import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db.query("coupons").withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("coupons")
    ).collect();
    return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) =>
    ctx.db.query("coupons").withIndex("by_featured", (q) => q.eq("featured", true)).collect(),
});

export const getById = query({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    code: v.string(),
    image: v.string(),
    discountType: v.string(),
    discountValue: v.number(),
    partner: v.optional(v.string()),
    partnerUrl: v.optional(v.string()),
    conditions: v.optional(v.string()),
    rules: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    firstPurchaseOnly: v.boolean(),
    validUntil: v.optional(v.number()),
    active: v.boolean(),
    featured: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("coupons", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("coupons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    code: v.optional(v.string()),
    image: v.optional(v.string()),
    discountType: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    partner: v.optional(v.string()),
    partnerUrl: v.optional(v.string()),
    conditions: v.optional(v.string()),
    rules: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    firstPurchaseOnly: v.optional(v.boolean()),
    validUntil: v.optional(v.number()),
    active: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
