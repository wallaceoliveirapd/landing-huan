import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const REACTION_TYPES = ["like", "love", "wow", "fire"] as const;
export type ReactionType = typeof REACTION_TYPES[number];

/** Per-type counts + the current user's reaction (if any) for a dica. */
export const forDica = query({
  args: { dicaId: v.id("dicas") },
  handler: async (ctx, { dicaId }) => {
    const rows = await ctx.db
      .query("dicaReactions")
      .withIndex("by_dica", (q) => q.eq("dicaId", dicaId))
      .collect();

    const counts: Record<string, number> = { like: 0, love: 0, wow: 0, fire: 0 };
    for (const r of rows) {
      counts[r.reaction] = (counts[r.reaction] ?? 0) + 1;
    }

    const userId = await getAuthUserId(ctx);
    let myReaction: string | null = null;
    if (userId) {
      const mine = await ctx.db
        .query("dicaReactions")
        .withIndex("by_user_dica", (q) =>
          q.eq("userId", userId).eq("dicaId", dicaId),
        )
        .unique();
      myReaction = mine?.reaction ?? null;
    }

    return {
      counts,
      total: rows.length,
      myReaction,
    };
  },
});

/**
 * Toggle a reaction:
 *   - If user has no reaction → add the requested one
 *   - If user has the SAME reaction → remove (unreact)
 *   - If user has a DIFFERENT reaction → switch to the new one
 */
export const toggle = mutation({
  args: {
    dicaId: v.id("dicas"),
    reaction: v.string(),
  },
  handler: async (ctx, { dicaId, reaction }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(REACTION_TYPES as readonly string[]).includes(reaction)) {
      throw new Error("Invalid reaction type");
    }

    const existing = await ctx.db
      .query("dicaReactions")
      .withIndex("by_user_dica", (q) =>
        q.eq("userId", userId).eq("dicaId", dicaId),
      )
      .unique();

    if (existing) {
      if (existing.reaction === reaction) {
        await ctx.db.delete(existing._id);
        return null; // unreacted
      }
      await ctx.db.patch(existing._id, { reaction });
      return reaction; // switched
    }
    await ctx.db.insert("dicaReactions", {
      userId,
      dicaId,
      reaction,
      createdAt: Date.now(),
    });
    return reaction; // added
  },
});
