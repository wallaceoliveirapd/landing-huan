import { v } from "convex/values";
import { query } from "./_generated/server";
import { matchesCity } from "./cityFilter";

// ─── Tokenization + scoring helpers ────────────────────────────────────────

/** Strip accents and lowercase: "Catamarã" → "catamara". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Stopwords we ignore when tokenizing, they pollute the match. */
const STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "no", "na", "nos", "nas",
  "em", "por", "para", "pra", "com", "sem", "ou", "e", "que",
  "é", "ser", "estar", "ter", "esta", "este", "isso",
  "quero", "queria", "preciso", "procuro", "buscar", "ver",
]);

/**
 * "Generic" category words, they describe the CATEGORY of thing the user
 * wants (already detected via INTENT rules) but are NOT useful for scoring
 * within the category. e.g. "passeio" matches every single tour title;
 * the discriminating word is "barco" / "catamarã" / "buggy" etc.
 *
 * These tokens stay in the tokenized list so they can be detected, but
 * scoring gives them weight 0 (i.e. they don't help nor hurt).
 */
const GENERIC_CATEGORY_TOKENS = new Set([
  "passeio", "passeios", "tour", "tours", "atividade", "atividades",
  "restaurante", "restaurantes", "comer", "comida", "lugar", "lugares",
  "praia", "praias", "hospedagem", "hotel", "pousada",
  "cupom", "cupons", "desconto", "ofertas", "dica", "dicas",
  "bar", "balada", "show",
]);

/**
 * Synonyms, keys are normalized tokens, values are extra tokens.
 * IMPORTANT: keep these tight. Don't expand specific things ("barco")
 * to generic categories ("passeio"), that pollutes results.
 */
const SYNONYMS: Record<string, string[]> = {
  barco:      ["catamara", "lancha", "veleiro", "navio"],
  catamara:   ["barco", "lancha", "veleiro"],
  lancha:     ["barco", "catamara"],
  veleiro:    ["barco"],
  comer:      ["restaurante", "comida", "gastronomia"],
  comida:     ["restaurante", "comer"],
  noite:      ["bar", "balada", "show"],
  hospedagem: ["hotel", "pousada", "airbnb", "hostel"],
  hotel:      ["pousada", "hospedagem"],
  pousada:    ["hotel", "hospedagem"],
  cupom:      ["desconto", "oferta", "promocao"],
  desconto:   ["cupom", "oferta", "promocao"],
  buggy:      ["dunas", "areia"],
  trilha:     ["ecologica", "natureza"],
  mergulho:   ["snorkel", "scuba"],
};

function tokenize(s: string): string[] {
  const tokens = norm(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  // Expand with synonyms
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    (SYNONYMS[t] ?? []).forEach((syn) => expanded.add(syn));
  }
  return [...expanded];
}

/**
 * Count token matches inside a haystack. Generic category tokens
 * (e.g. "passeio", "restaurante") count 0, they describe the category
 * already and would otherwise match every item in that category.
 */
function scoreMatch(haystack: string, tokens: string[]): number {
  const h = norm(haystack);
  let score = 0;
  for (const t of tokens) {
    if (GENERIC_CATEGORY_TOKENS.has(t)) continue;
    if (h.includes(t)) score += 1;
  }
  return score;
}

/**
 * Score an item against the query tokens. Title matches weigh more than
 * description, and tags. Returns 0 if no SPECIFIC token (non-generic)
 * matched anywhere, prevents "passeio de barco" from matching every
 * tour titled "Passeio de …".
 */
function scoreItem(
  item: {
    title?: string;
    name?: string;
    description?: string;
    shortDesc?: string;
    excerpt?: string;
    subtitle?: string;
    tags?: string[];
    features?: string[];
    cuisine?: string;
    type?: string;
  },
  tokens: string[],
): number {
  if (tokens.length === 0) return 1; // empty query, return everything

  // Bail early if there are no SPECIFIC tokens, we can't discriminate.
  // (Caller falls back to "browse-by-type" in that case.)
  const specific = tokens.filter((t) => !GENERIC_CATEGORY_TOKENS.has(t));
  if (specific.length === 0) return 0;

  const titleScore = scoreMatch(
    item.title ?? item.name ?? item.subtitle ?? "",
    tokens,
  );
  const descScore = scoreMatch(
    `${item.description ?? ""} ${item.shortDesc ?? ""} ${item.excerpt ?? ""}`,
    tokens,
  );
  const tagsScore = scoreMatch(
    [...(item.tags ?? []), ...(item.features ?? []), item.cuisine ?? "", item.type ?? ""].join(" "),
    tokens,
  );
  return titleScore * 3 + descScore * 1.5 + tagsScore;
}

// ─── Search query ──────────────────────────────────────────────────────────
export const search = query({
  args: {
    q: v.string(),
    type: v.union(
      v.literal("tour"),
      v.literal("restaurant"),
      v.literal("dica"),
      v.literal("praia"),
      v.literal("nightlife"),
      v.literal("itinerary"),
      v.literal("hosting"),
      v.literal("coupon"),
      v.literal("any"),
    ),
    /** Optional city filter (e.g. "Natal"). Compared on the first comma
     *  segment, accent-insensitive. */
    city: v.optional(v.string()),
  },
  handler: async (ctx, { q, type, city }) => {
    const tokens = tokenize(q);
    const isEmptyQuery = tokens.length === 0;
    const specificTokens = tokens.filter((t) => !GENERIC_CATEGORY_TOKENS.has(t));
    const isBrowseQuery = isEmptyQuery || specificTokens.length === 0;

    const results: { score: number; item: Record<string, unknown> }[] = [];
    /** Near-miss bucket: items in the requested category that did NOT clear
     *  the strict score threshold. Used to fill the response when the strict
     *  search returns 0 so the user always sees the closest available items. */
    const nearMiss: { score: number; item: Record<string, unknown> }[] = [];

    function passesCity(rawCity: string | undefined): boolean {
      if (!city) return true;
      return matchesCity(rawCity, city);
    }

    function pushScored(
      item: Record<string, unknown>,
      raw: Record<string, unknown>,
    ) {
      const rawCity =
        typeof raw.city === "string" ? raw.city : undefined;
      if (!passesCity(rawCity)) return;
      if (isBrowseQuery) {
        results.push({ score: 1, item });
        return;
      }
      const score = scoreItem(raw, tokens);
      if (score >= 1.5) {
        results.push({ score, item });
      } else {
        // Keep weakly-matching items so we can fall back to "closest" results
        // when no strong match exists in this category.
        nearMiss.push({ score: score + 0.01, item });
      }
    }

    // ── Tours ──
    if (type === "tour" || type === "any") {
      const tours = await ctx.db
        .query("tours")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const t of tours) {
        pushScored(
          {
            kind: "tour",
            id: t._id,
            title: t.title,
            slug: t.slug,
            shortDesc: t.shortDesc,
            description: t.shortDesc,
            tags: t.tags,
            price: t.price,
            duration: t.duration,
            rating: t.rating,
            image: t.image,
            url: t.url,
          },
          t,
        );
      }
    }

    // ── Restaurants ──
    if (type === "restaurant" || type === "any") {
      const restaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const r of restaurants) {
        pushScored(
          {
            kind: "restaurant",
            id: r._id,
            title: r.name,
            shortDesc: r.shortDesc,
            description: r.shortDesc,
            tags: r.tags,
            cuisine: r.cuisine,
            priceRange: r.priceRange,
            rating: r.rating,
            image: r.image,
            slug: r.slug,
          },
          r,
        );
      }
    }

    // ── Dicas ──
    if (type === "dica" || type === "any") {
      const dicas = await ctx.db
        .query("dicas")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const d of dicas) {
        pushScored(
          {
            kind: "dica",
            id: d._id,
            title: d.title,
            excerpt: d.excerpt,
            tags: d.tags,
            cover: d.cover,
            slug: d.slug,
          },
          d,
        );
      }
    }

    // ── Praias ──
    if (type === "praia" || type === "any") {
      const praias = await ctx.db
        .query("praias")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const p of praias) {
        pushScored(
          {
            kind: "praia",
            id: p._id,
            title: p.name,
            shortDesc: p.shortDesc,
            description: p.shortDesc,
            features: p.features,
            image: p.image,
            slug: p.slug,
          },
          p,
        );
      }
    }

    // ── Nightlife ──
    if (type === "nightlife" || type === "any") {
      const items = await ctx.db
        .query("nightlife")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const n of items) {
        pushScored(
          {
            kind: "nightlife",
            id: n._id,
            title: n.name,
            shortDesc: n.shortDesc,
            description: n.shortDesc,
            tags: n.tags,
            type: n.type,
            image: n.image,
            slug: n.slug,
          },
          n,
        );
      }
    }

    // ── Itineraries ──
    if (type === "itinerary" || type === "any") {
      const itineraries = await ctx.db
        .query("itineraries")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const i of itineraries) {
        pushScored(
          {
            kind: "itinerary",
            id: i._id,
            title: i.title,
            subtitle: i.subtitle,
            description: i.subtitle,
            durationDays: i.durationDays,
            cover: i.cover,
            slug: i.slug,
          },
          i,
        );
      }
    }

    // ── Hosting ──
    if (type === "hosting" || type === "any") {
      const items = await ctx.db
        .query("hosting")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const h of items) {
        pushScored(
          {
            kind: "hosting",
            id: h._id,
            title: h.name,
            shortDesc: h.shortDesc,
            description: h.shortDesc,
            type: h.type,
            amenities: h.amenities,
            priceFrom: h.priceFrom,
            image: h.image,
            affiliateUrl: h.affiliateUrl,
          },
          h,
        );
      }
    }

    // ── Coupons ──
    if (type === "coupon" || type === "any") {
      const items = await ctx.db
        .query("coupons")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const c of items) {
        pushScored(
          {
            kind: "coupon",
            id: c._id,
            title: c.title,
            description: c.description,
            partner: c.partner,
            code: c.code,
            image: c.image,
            discountType: c.discountType,
            discountValue: c.discountValue,
            partnerUrl: c.partnerUrl,
          },
          c,
        );
      }
    }

    const sorted = results.sort((a, b) => b.score - a.score).slice(0, 8);
    if (sorted.length > 0) {
      return { items: sorted.map((r) => r.item), partial: false };
    }
    // Strict search empty: surface the closest matches so the chat can
    // present "não encontrei X exato, mas posso te indicar estes".
    const near = nearMiss
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.item);
    return { items: near, partial: near.length > 0 };
  },
});

/**
 * Returns true when at least one active piece of content (tour, restaurant,
 * praia, nightlife, dica, hosting, coupon) exists for the given city. Used
 * by the chat to decide whether to pre-search or to admit "ainda não tenho
 * conteúdo cadastrado dessa cidade".
 */
export const cityHasContent = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const tables = ["tours", "restaurants", "praias", "nightlife", "dicas"] as const;
    for (const t of tables) {
      const items = await ctx.db
        .query(t)
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      if (items.some((i) => matchesCity(i.city, city))) return true;
    }
    return false;
  },
});

/**
 * Returns all active content (tours, beaches, restaurants, nightlife) without
 * any filter, used by the NordestAI to build itineraries when no pre-made
 * itinerary is found.
 */
export const getContentForItinerary = query({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, unknown>[] = [];

    const [tours, praias, restaurants, nightlife] = await Promise.all([
      ctx.db.query("tours").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("praias").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("restaurants").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("nightlife").withIndex("by_active", (q) => q.eq("active", true)).collect(),
    ]);

    tours.slice(0, 8).forEach((t) =>
      results.push({
        kind: "tour",
        id: t._id,
        title: t.title,
        slug: t.slug,
        shortDesc: t.shortDesc,
        duration: t.duration,
        price: t.price,
        image: t.image,
        url: t.url,
      }),
    );

    praias.slice(0, 6).forEach((p) =>
      results.push({
        kind: "praia",
        id: p._id,
        title: p.name,
        shortDesc: p.shortDesc,
        image: p.image,
        slug: p.slug,
      }),
    );

    restaurants.slice(0, 6).forEach((r) =>
      results.push({
        kind: "restaurant",
        id: r._id,
        title: r.name,
        shortDesc: r.shortDesc,
        cuisine: r.cuisine,
        image: r.image,
        slug: r.slug,
      }),
    );

    nightlife.slice(0, 4).forEach((n) =>
      results.push({
        kind: "nightlife",
        id: n._id,
        title: n.name,
        shortDesc: n.shortDesc,
        image: n.image,
        slug: n.slug,
      }),
    );

    return results;
  },
});
