import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const placeShape = v.object({
  osmId: v.string(),
  name: v.string(),
  kind: v.string(),
  lat: v.number(),
  lng: v.number(),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  openingHours: v.optional(v.string()),
  cuisine: v.optional(v.string()),
  tags: v.array(v.string()),
});

/** Read cached OSM places by cache key. Returns null if missing or stale. */
export const get = internalQuery({
  args: { cacheKey: v.string() },
  handler: async (ctx, { cacheKey }) => {
    const row = await ctx.db
      .query("osmCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
      .unique();
    if (!row) return null;
    if (Date.now() - row.fetchedAt > TTL_MS) return null;
    return row.places;
  },
});

/** Write places to the cache (upsert by cacheKey). */
export const set = internalMutation({
  args: {
    cacheKey: v.string(),
    places: v.array(placeShape),
  },
  handler: async (ctx, { cacheKey, places }) => {
    const existing = await ctx.db
      .query("osmCache")
      .withIndex("by_key", (q) => q.eq("cacheKey", cacheKey))
      .unique();
    const fetchedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { places, fetchedAt });
    } else {
      await ctx.db.insert("osmCache", { cacheKey, places, fetchedAt });
    }
  },
});
