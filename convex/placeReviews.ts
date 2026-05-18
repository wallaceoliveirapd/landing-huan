import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const VALID_KINDS = ["tour", "restaurant", "praia", "nightlife"] as const;

function assertKind(kind: string) {
  if (!(VALID_KINDS as readonly string[]).includes(kind)) {
    throw new Error("Invalid kind");
  }
}

// ── Profanity filter (PT-BR) ────────────────────────────────────────────────
const BLOCKLIST_PT = [
  // anatomia / ato sexual
  "cu", "cuzao", "buceta", "puta", "viado", "foder", "foda", "fodase",
  "foda-se", "porra", "caralho", "piroca", "rola", "xota", "xoxota",
  // xingamentos
  "merda", "fdp", "filha da puta", "filho da puta", "vadia", "vagabunda",
  "vagabundo", "safada", "safado", "idiota", "imbecil", "retardado",
  "retardada", "otario", "otaria", "babaca", "corno", "corna",
  // desgraça e variantes
  "desgraça", "desgraçado", "desgraçada", "maldito", "maldita",
  // insultos leves mas claramente ofensivos
  "lixo", "inutil", "arrombado", "arrombada", "broxa",
];

function passesLocalFilter(text: string): boolean {
  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return !BLOCKLIST_PT.some((w) => {
    const wn = w.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return new RegExp(`\\b${wn}\\b`).test(norm);
  });
}

// ── OpenAI Moderation API ───────────────────────────────────────────────────
async function openaiModeration(
  text: string,
): Promise<{ flagged: boolean; score: number } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const result = data?.results?.[0];
    if (!result) return null;
    const score = Math.max(...Object.values<number>(result.category_scores ?? {}));
    return { flagged: result.flagged === true, score };
  } catch {
    return null;
  }
}

// ── Aggregate helpers ───────────────────────────────────────────────────────
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
  return { rating: (sRating * sCount + uSum) / totalCount, total: totalCount };
}

async function userRatingsForItem(
  ctx: QueryCtx,
  kind: string,
  itemId: string,
): Promise<number[]> {
  const rows = await ctx.db
    .query("placeReviews")
    .withIndex("by_kind_item", (q) => q.eq("kind", kind).eq("itemId", itemId))
    .collect();
  return rows
    .filter((r) => !r.status || r.status === "published")
    .map((r) => r.rating);
}

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
      return { ...item, rating: rating ?? item.rating ?? 0, reviewCount: total };
    }),
  );
}

// ── Public queries ──────────────────────────────────────────────────────────

export const listByItem = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    const rows = await ctx.db
      .query("placeReviews")
      .withIndex("by_kind_item", (q) => q.eq("kind", kind).eq("itemId", itemId))
      .order("desc")
      .collect();

    const published = rows.filter((r) => !r.status || r.status === "published");

    return await Promise.all(
      published.map(async (r) => {
        let authorName = "Anônimo";
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = await ctx.db.get(r.userId as any);
          authorName =
            (u as { name?: string } | null)?.name ||
            (u as { email?: string } | null)?.email?.split("@")[0] ||
            "Anônimo";
        } catch { /* user gone */ }
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

export const aggregateForItem = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let item: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item = await ctx.db.get(itemId as any);
    } catch { /* invalid id */ }
    const { rating, total } = await combinedStats(
      ctx,
      kind,
      itemId,
      (item as { rating?: number } | null)?.rating,
      (item as { reviewCount?: number } | null)?.reviewCount,
    );
    return { avg: rating, total };
  },
});

// ── Admin queries ───────────────────────────────────────────────────────────

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("placeReviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
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
        } catch { /* user gone */ }
        let itemName = `${r.kind}/${r.itemId.slice(-6)}`;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const it = await ctx.db.get(r.itemId as any);
          itemName =
            (it as { title?: string } | null)?.title ||
            (it as { name?: string } | null)?.name ||
            itemName;
        } catch { /* item gone */ }
        return {
          _id: r._id,
          authorName,
          kind: r.kind,
          itemId: r.itemId,
          itemName,
          rating: r.rating,
          comment: r.comment ?? "",
          moderationScore: r.moderationScore,
          createdAt: r.createdAt,
        };
      }),
    );
  },
});

// ── Internal mutation ───────────────────────────────────────────────────────

export const internalUpsert = internalMutation({
  args: {
    userId: v.string(),
    kind: v.string(),
    itemId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
    status: v.union(v.literal("published"), v.literal("pending"), v.literal("rejected")),
    moderationScore: v.optional(v.number()),
  },
  handler: async (ctx, { userId, kind, itemId, rating, comment, status, moderationScore }) => {
    const existing = await ctx.db
      .query("placeReviews")
      .withIndex("by_user_kind_item", (q) =>
        q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
      )
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { rating, comment, status, moderationScore, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("placeReviews", {
      userId, kind, itemId, rating, comment, status, moderationScore, createdAt: now, updatedAt: now,
    });
  },
});

// ── Public action (submit + moderate) ──────────────────────────────────────

export const submitReview = action({
  args: {
    kind: v.string(),
    itemId: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { kind, itemId, rating, comment }) => {
    if (!(VALID_KINDS as readonly string[]).includes(kind)) throw new Error("Invalid kind");
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (rating < 1 || rating > 5 || !Number.isFinite(rating)) throw new Error("Rating must be 1-5");
    if (comment && comment.length > 1000) throw new Error("Comment too long");

    let status: "published" | "pending" = "published";
    let moderationScore: number | undefined;

    if (comment?.trim()) {
      if (!passesLocalFilter(comment)) {
        status = "pending";
      } else {
        const result = await openaiModeration(comment.trim());
        if (result !== null) {
          moderationScore = result.score;
          if (result.flagged) status = "pending";
        }
      }
    }

    await ctx.runMutation(internal.placeReviews.internalUpsert, {
      userId: userId as string,
      kind,
      itemId,
      rating,
      comment: comment?.trim() || undefined,
      status,
      moderationScore,
    });

    return { status };
  },
});

// ── Admin mutations ─────────────────────────────────────────────────────────

export const moderate = mutation({
  args: {
    reviewId: v.id("placeReviews"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, { reviewId, decision }) => {
    const review = await ctx.db.get(reviewId);
    if (!review) throw new Error("Review not found");
    await ctx.db.patch(reviewId, {
      status: decision === "approve" ? "published" : "rejected",
      updatedAt: Date.now(),
    });
  },
});

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
