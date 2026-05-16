import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return doc?.value ?? null;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("siteContent").collect();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("siteContent", { key, value, updatedAt: Date.now() });
    }
  },
});
