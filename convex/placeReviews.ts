import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const VALID_KINDS = ["tour", "restaurant", "praia", "nightlife"] as const;

function assertKind(kind: string) {
  if (!(VALID_KINDS as readonly string[]).includes(kind)) {
    throw new Error("Invalid kind");
  }
}

/**
 * Weighted average of admin-seeded rating/reviewCount + user reviews.
 * Seed acts like N additional pre-existing ratings, so a single new
 * 5-star review on an item with seed (4.5, 200) barely moves the dial.
 * Returns `null` rating when there's nothing to average.
 */
function combineStats(
  seedRating: number | undefined,
  seedCount: number | undefined,
  userRatings: number[],
): { rating: number | null; total: number } {
  const sCount = seedCount ?? 0;
  const sRating = seedRating ?? 0;
  const uSum = userRatings.reduce((s, r) => s + r, 0);
  const totalCount = sCount + userRatings.length;
  if (totalCount === 0) return { rating: null, total: 0 };
  const rating = (sRating * sCount + uSum) / totalCount;
  return { rating, total: totalCount };
}

/** Internal helper: fetch user-review ratings for a single item. */
async function userRatingsForItem(
  ctx: QueryCtx,
  kind: string,
  itemId: string,
): Promise<number[]> {
  const rows = await ctx.db
    .query("placeReviews")
    .withIndex("by_kind_item", (q) => q.eq("kind", kind).eq("itemId", itemId))
    .collect();
  return rows.map((r) => r.rating);
}

/**
 * Returns the combined (seed + user) rating/total for one item. Reusable
 * from `tours.ts` / `restaurants.ts` etc. to enrich list and detail queries.
 */
export async function combinedStats(
  ctx: QueryCtx,
  kind: string,
  itemId: string,
  seedRating: number | undefined,
  seedCount: number | undefined,
): Promise<{ rating: number | null; total: number }> {
  const userRatings = await userRatingsForItem(ctx, kind, itemId);
  return combineStats(seedRating, seedCount, userRatings);
}

/** Batched variant for list queries. */
export async function combinedStatsForItems<
  T extends { _id: string; rating?: number; reviewCount?: number },
>(ctx: QueryCtx, kind: string, items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const { rating, total } = await combinedStats(
        ctx,
        kind,
        item._id,
        item.rating,
        item.reviewCount,
      );
      return {
        ...item,
        rating: rating ?? item.rating ?? 0,
        reviewCount: total,
      };
    }),
  );
}

/**
 * List all reviews for a place, newest first, with the author name resolved.
 */
export const listByItem = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    const rows = await ctx.db
      .query("placeReviews")
      .withIndex("by_kind_item", (q) => q.eq("kind", kind).eq("itemId", itemId))
      .order("desc")
      .collect();

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
          /* user gone */
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

/** Current user's review for a place, or null. */
export const myReview = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("placeReviews")
      .withIndex("by_user_kind_item", (q) =>
        q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
      )
      .unique();
  },
});

/**
 * Avg rating + count for a place. Combines admin seed (item.rating,
 * item.reviewCount) with all user reviews so the badge in the detail
 * page matches what we show on listing cards.
 */
export const aggregateForItem = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let item: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item = await ctx.db.get(itemId as any);
    } catch {
      /* invalid id, treat as no seed */
    }
    const seedRating = (item as { rating?: number } | null)?.rating;
    const seedCount = (item as { reviewCount?: number } | null)?.reviewCount;
    const { rating, total } = await combinedStats(
      ctx,
      kind,
      itemId,
      seedRating,
      seedCount,
    );
    return { avg: rating, total };
  },
});

/** Create or update the caller's review for a place. */
export const upsert = mutation({
  args: {
    kind: v.string(),
    itemId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { kind, itemId, rating, comment }) => {
    assertKind(kind);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (rating < 1 || rating > 5 || !Number.isFinite(rating)) {
      throw new Error("Rating must be between 1 and 5");
    }
    if (comment && comment.length > 1000) {
      throw new Error("Comment too long");
    }
    const existing = await ctx.db
      .query("placeReviews")
      .withIndex("by_user_kind_item", (q) =>
        q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
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
    return await ctx.db.insert("placeReviews", {
      userId,
      kind,
      itemId,
      rating,
      comment: comment?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Delete the caller's review for a place. */
export const remove = mutation({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("placeReviews")
      .withIndex("by_user_kind_item", (q) =>
        q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});
