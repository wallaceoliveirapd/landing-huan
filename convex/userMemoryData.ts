import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./helpers";

/**
 * Upsert a single preference for a user. Same (userId, key) is replaced.
 * Called by the extractor action and by the admin panel.
 */
export const upsert = internalMutation({
  args: {
    userId: v.string(),
    key: v.string(),
    value: v.string(),
    confidence: v.number(),
    source: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .unique();

    const patch = {
      value: args.value,
      confidence: args.confidence,
      source: args.source,
      capturedAt: Date.now(),
      note: args.note,
    };

    if (existing) {
      // Don't overwrite a high-confidence value with a weaker one.
      if (existing.confidence > args.confidence + 0.15) return existing._id;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("userPreferences", { userId: args.userId, key: args.key, ...patch });
  },
});

/**
 * Internal lookup used by the chat route to inject the user's memory into
 * the system prompt.
 */
export const listForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Viewer-scoped query: lets the user see their own preferences. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Owner can delete one of their preferences (privacy). */
export const deleteMine = mutation({
  args: { id: v.id("userPreferences") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});

// ─── Admin tools ───────────────────────────────────────────────
export const adminListForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const adminUpsert = mutation({
  args: {
    userId: v.string(),
    key: v.string(),
    value: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .unique();
    const patch = {
      value: args.value.trim().toLowerCase(),
      confidence: 1,
      source: "manual_admin",
      capturedAt: Date.now(),
      note: args.note,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("userPreferences", {
      userId: args.userId,
      key: args.key.trim().toLowerCase(),
      ...patch,
    });
  },
});

export const adminDelete = mutation({
  args: { id: v.id("userPreferences") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
