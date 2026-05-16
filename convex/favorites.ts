import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Returns all favorite itemIds for the current user (empty array if not authed). */
export const myFavoriteIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return favs.map((f) => f.itemId);
  },
});

/** Toggle a favorite: removes it if it exists, adds it otherwise. Returns the new state. */
export const toggle = mutation({
  args: {
    itemId: v.string(),
    kind: v.string(),
  },
  handler: async (ctx, { itemId, kind }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", userId).eq("itemId", itemId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // removed
    } else {
      await ctx.db.insert("favorites", {
        userId,
        itemId,
        kind,
        createdAt: Date.now(),
      });
      return true; // added
    }
  },
});

/** All favorites for the current user, newest first. */
export const myFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/** Resolve each favorite ID to its underlying document. */
export const myFavoritesWithItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    type Item = { fav: typeof favs[number]; item: Record<string, unknown> | null };
    const results: Item[] = [];

    for (const fav of favs) {
      let item: Record<string, unknown> | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = await ctx.db.get(fav.itemId as any);
        item = (doc as Record<string, unknown> | null) ?? null;
      } catch {
        item = null;
      }
      results.push({ fav, item });
    }
    return results;
  },
});
