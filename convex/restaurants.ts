import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

const hoursValidator = v.array(
  v.object({ day: v.string(), open: v.string(), close: v.string() })
);

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("restaurants")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("restaurants")
    ).collect();
    return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("restaurants")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("restaurants") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    cuisine: v.string(),
    priceRange: v.string(),
    image: v.string(),
    photos: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    address: v.string(),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.optional(hoursValidator),
    tags: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
    tripAdvisorUrl: v.optional(v.string()),
  },
  handler: async (ctx, { photos, hours, tags, rating, reviewCount, ...rest }) => {
    await requireAdmin(ctx);
    return ctx.db.insert("restaurants", {
      ...rest,
      photos: photos ?? [],
      hours: hours ?? [],
      tags: tags ?? [],
      rating: rating ?? 0,
      reviewCount: reviewCount ?? 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("restaurants"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    image: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.optional(hoursValidator),
    tags: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
    tripAdvisorUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("restaurants") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

// ── TripAdvisor Scraper ───────────────────────────────────────
export const scrapeTripAdvisor = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }) => {
    const headers = {
      "User-Agent":
        process.env.TRIPADVISOR_USER_AGENT ??
        "Mozilla/5.0 (compatible; HUANBot/1.0)",
      "Accept-Language": "pt-BR,pt;q=0.9",
      Accept: "text/html",
    };

    const html = await fetch(url, { headers }).then((r) => r.text());

    // Basic extraction via regex (cheerio not available in Convex runtime)
    const extract = (re: RegExp) => html.match(re)?.[1]?.trim() ?? "";

    const name = extract(/<h1[^>]*>([^<]+)<\/h1>/);
    const ratingRaw = extract(/"ratingValue"\s*:\s*"?([\d.]+)"?/);
    const reviewRaw = extract(/"reviewCount"\s*:\s*"?([\d,]+)"?/);
    const address = extract(
      /"streetAddress"\s*:\s*"([^"]+)"/
    ) || extract(/class="[^"]*biGQs[^"]*"[^>]*><span>([^<]{10,80})<\/span>/);
    const description = extract(/"description"\s*:\s*"([^"]{20,500})"/);

    return {
      name,
      rating: ratingRaw ? parseFloat(ratingRaw) : undefined,
      reviewCount: reviewRaw ? parseInt(reviewRaw.replace(/,/g, ""), 10) : undefined,
      address,
      description,
      sourceUrl: url,
    };
  },
});
