"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  buildOverpassQuery,
  osmCacheKey,
  parseOverpassResponse,
  OVERPASS_URL,
  type OsmKind,
  type OsmPlace,
} from "../lib/osmPlaces";

/**
 * Search OSM places around a coordinate, caching results in Convex for 7 days.
 * Returns up to 60 places (Overpass result limit) split across the requested kinds.
 */
export const searchAroundCity = action({
  args: {
    lat: v.number(),
    lng: v.number(),
    kinds: v.array(v.string()),
    radius: v.optional(v.number()),
  },
  handler: async (ctx, { lat, lng, kinds, radius = 8000 }): Promise<OsmPlace[]> => {
    const validKinds = kinds.filter(
      (k): k is OsmKind =>
        k === "restaurant" || k === "praia" || k === "tour" ||
        k === "nightlife" || k === "attraction",
    );
    if (validKinds.length === 0) return [];

    const cacheKey = osmCacheKey(validKinds, lat, lng, radius);

    // Try cache first
    const cached = await ctx.runQuery(internal.osmCache.get, { cacheKey });
    if (cached) {
      console.log(`[osm] cache HIT ${cacheKey} (${cached.length} places)`);
      return cached as OsmPlace[];
    }
    console.log(`[osm] cache MISS ${cacheKey}, querying Overpass…`);

    // Build + send the Overpass QL query
    const query = buildOverpassQuery(lat, lng, validKinds, radius);

    let places: OsmPlace[] = [];
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Identify ourselves so Overpass admins can reach out if we abuse limits.
          "User-Agent": "huan-nordesteai/0.1 (https://github.com/uolaci/huan)",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!res.ok) {
        console.error(`[osm] Overpass returned ${res.status}`);
        return [];
      }

      const data = (await res.json()) as { elements?: unknown[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      places = parseOverpassResponse(data as any);
    } catch (err) {
      console.error("[osm] Overpass fetch failed:", err);
      return [];
    }

    // Persist to cache (don't await error, fire and forget on failure)
    if (places.length > 0) {
      try {
        await ctx.runMutation(internal.osmCache.set, {
          cacheKey,
          places,
        });
      } catch (err) {
        console.warn("[osm] cache write failed:", err);
      }
    }

    return places;
  },
});
