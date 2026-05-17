import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * List all reviews of a restaurant, newest first. Includes the
 * reviewer's name (looked up from `users`).
 */
export const listByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    const rows = await ctx.db
      .query("restaurantReviews")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
      .order("desc")
      .collect();

    // Resolve reviewer names in parallel
    return await Promise.all(
      rows.map(async (r) => {
        let authorName = "Anônimo";
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = await ctx.db.get(r.userId as any);
          authorName =
            (u as { name?: string } | null)?.name ||
            (u as { email?: string } | null)?.email?.split("@")[0] ||
            "Anônimo";
        } catch {
          /* user no longer exists, skip */
        }
        return {
          _id: r._id,
          userId: r.userId,
          authorName,
          rating: r.rating,
          comment: r.comment ?? "",
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      }),
    );
  },
});

/** The current user's review for the restaurant, if any. */
export const myReview = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("restaurantReviews")
      .withIndex("by_user_restaurant", (q) =>
        q.eq("userId", userId).eq("restaurantId", restaurantId),
      )
      .unique();
  },
});

/**
 * Aggregate: avg rating + total count. Used in restaurant cards/detail
 * to show the user's true rating (not just the seeded one).
 */
export const aggregateForRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    const rows = await ctx.db
      .query("restaurantReviews")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId))
      .collect();
    if (rows.length === 0) return { avg: null, total: 0 };
    const sum = rows.reduce((acc, r) => acc + r.rating, 0);
    return { avg: sum / rows.length, total: rows.length };
  },
});

/**
 * Create or update the current user's review for a restaurant.
 * Each user can have at most one review per restaurant.
 */
export const upsert = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { restaurantId, rating, comment }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (rating < 1 || rating > 5 || !Number.isFinite(rating)) {
      throw new Error("Rating must be between 1 and 5");
    }
    if (comment && comment.length > 1000) {
      throw new Error("Comment too long");
    }

    const existing = await ctx.db
      .query("restaurantReviews")
      .withIndex("by_user_restaurant", (q) =>
        q.eq("userId", userId).eq("restaurantId", restaurantId),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        rating,
        comment: comment?.trim() || undefined,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("restaurantReviews", {
      userId,
      restaurantId,
      rating,
      comment: comment?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Delete the current user's review. */
export const remove = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("restaurantReviews")
      .withIndex("by_user_restaurant", (q) =>
        q.eq("userId", userId).eq("restaurantId", restaurantId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
