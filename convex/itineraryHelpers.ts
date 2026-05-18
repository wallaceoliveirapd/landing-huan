import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { matchesCity } from "./cityFilter";

// ─── Internal query: read the trip itself ─────────────────────────────────
export const getTrip = internalQuery({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => ctx.db.get(tripId),
});

// ─── Internal query: collect all content for the trip type ─────────────────
export const collectContent = internalQuery({
  args: {
    type: v.string(),
    budget: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { type, city }) => {
    const [toursAll, restaurantsAll, praiasAll, nightlifeAll] = await Promise.all([
      ctx.db.query("tours").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("restaurants").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("praias").withIndex("by_active", (q) => q.eq("active", true)).collect(),
      ctx.db.query("nightlife").withIndex("by_active", (q) => q.eq("active", true)).collect(),
    ]);

    // City scoping. If the trip has a destination city, drop items from any
    // other city so the AI can't recommend Natal places for a João Pessoa
    // trip. Without a city, everything stays in scope.
    const tours = city ? toursAll.filter((t) => matchesCity(t.city, city)) : toursAll;
    const restaurants = city
      ? restaurantsAll.filter((r) => matchesCity(r.city, city))
      : restaurantsAll;
    const praias = city ? praiasAll.filter((p) => matchesCity(p.city, city)) : praiasAll;
    const nightlife = city
      ? nightlifeAll.filter((n) => matchesCity(n.city, city))
      : nightlifeAll;

    // Broad keyword-match by trip type to surface relevant content.
    const typeKeywords: Record<string, string[]> = {
      praia: ["praia", "mar", "areia", "sol", "litoral"],
      historica: ["centro historico", "igreja", "museu", "histori"],
      natureza: ["natureza", "trilha", "ecologic", "parque", "cachoeira", "mata", "rio"],
      aventura: ["aventura", "kite", "surf", "esporte", "buggy", "trilha", "rapel"],
      gastronomia: ["restaurante", "comida", "frutos", "regional"],
      festa: ["festa", "show", "forro", "balada", "carnaval"],
      roadtrip: [],
      familia: ["familia", "crianca", "calmo"],
      solo: [],
      cultural: ["museu", "cultura", "arte", "histori", "show"],
    };
    const kws = typeKeywords[type] ?? [];
    function matchesType(name: string, desc: string, tags: string[]): boolean {
      if (kws.length === 0) return true;
      const haystack = `${name} ${desc} ${tags.join(" ")}`.toLowerCase();
      return kws.some((k) => haystack.includes(k));
    }

    return {
      tours: tours.map((t) => ({
        _id: String(t._id),
        kind: "tour" as const,
        title: t.title,
        shortDesc: t.shortDesc,
        duration: t.duration,
        price: t.price,
        tags: t.tags,
        relevant: matchesType(t.title, t.description ?? "", t.tags ?? []),
      })),
      restaurants: restaurants.map((r) => ({
        _id: String(r._id),
        kind: "restaurant" as const,
        title: r.name,
        shortDesc: r.shortDesc,
        cuisine: r.cuisine,
        priceRange: r.priceRange,
        tags: r.tags,
        relevant: matchesType(r.name, r.description ?? "", r.tags ?? []),
      })),
      praias: praias.map((p) => ({
        _id: String(p._id),
        kind: "praia" as const,
        title: p.name,
        shortDesc: p.shortDesc,
        relevant: matchesType(p.name, p.description ?? "", []),
      })),
      nightlife: nightlife.map((n) => ({
        _id: String(n._id),
        kind: "nightlife" as const,
        title: n.name,
        shortDesc: n.shortDesc,
        type: n.type,
        relevant: matchesType(n.name, n.description ?? "", []),
      })),
    };
  },
});

// ─── Internal mutation: write the itinerary back to the trip ───────────────
export const setItinerary = internalMutation({
  args: {
    tripId: v.id("trips"),
    itinerary: v.array(
      v.object({
        day: v.number(),
        theme: v.string(),
        activities: v.array(
          v.object({
            source: v.string(), // "db" | "osm" | "suggestion"
            kind: v.string(),
            timeOfDay: v.string(),
            title: v.string(),
            note: v.optional(v.string()),
            itemId: v.optional(v.string()),
            icon: v.optional(v.string()),
            // OSM enrichment (only present when source = "osm")
            osmLat: v.optional(v.number()),
            osmLng: v.optional(v.number()),
            osmAddress: v.optional(v.string()),
            osmWebsite: v.optional(v.string()),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, { tripId, itinerary }) => {
    await ctx.db.patch(tripId, {
      itinerary,
      itineraryGeneratedAt: Date.now(),
    });
  },
});
