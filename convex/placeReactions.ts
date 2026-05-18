import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const VALID_KINDS = ["tour", "restaurant", "praia", "nightlife"] as const;
export const REACTION_TYPES = ["like", "love", "wow", "fire"] as const;

function assertKind(kind: string) {
  if (!(VALID_KINDS as readonly string[]).includes(kind)) {
    throw new Error("Invalid kind");
  }
}

/** Per-type counts + caller's reaction for a place. */
export const forItem = query({
  args: { kind: v.string(), itemId: v.string() },
  handler: async (ctx, { kind, itemId }) => {
    assertKind(kind);
    const rows = await ctx.db
      .query("placeReactions")
      .withIndex("by_kind_item", (q) => q.eq("kind", kind).eq("itemId", itemId))
      .collect();

    const counts: Record<string, number> = { like: 0, love: 0, wow: 0, fire: 0 };
    for (const r of rows) {
      counts[r.reaction] = (counts[r.reaction] ?? 0) + 1;
    }
    const userId = await getAuthUserId(ctx);
    let myReaction: string | null = null;
    if (userId) {
      const mine = await ctx.db
        .query("placeReactions")
        .withIndex("by_user_kind_item", (q) =>
          q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
        )
        .unique();
      myReaction = mine?.reaction ?? null;
    }
    return { counts, total: rows.length, myReaction };
  },
});

/**
 * Toggle a reaction:
 *  - no reaction → add
 *  - same reaction → remove
 *  - different reaction → switch
 */
export const toggle = mutation({
  args: {
    kind: v.string(),
    itemId: v.string(),
    reaction: v.string(),
  },
  handler: async (ctx, { kind, itemId, reaction }) => {
    assertKind(kind);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (!(REACTION_TYPES as readonly string[]).includes(reaction)) {
      throw new Error("Invalid reaction");
    }
    const existing = await ctx.db
      .query("placeReactions")
      .withIndex("by_user_kind_item", (q) =>
        q.eq("userId", userId).eq("kind", kind).eq("itemId", itemId),
      )
      .unique();
    if (existing) {
      if (existing.reaction === reaction) {
        await ctx.db.delete(existing._id);
        return null;
      }
      await ctx.db.patch(existing._id, { reaction });
      return reaction;
    }
    await ctx.db.insert("placeReactions", {
      userId,
      kind,
      itemId,
      reaction,
      createdAt: Date.now(),
    });
    return reaction;
  },
});
