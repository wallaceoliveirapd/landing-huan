import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly }) => {
    const all =
      activeOnly === false
        ? await ctx.db.query("categories").collect()
        : await ctx.db
            .query("categories")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();
    return all.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  },
});

export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    href: v.string(),
    mainImage: v.string(),
    backImages: v.array(v.string()),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    primary: v.boolean(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => ctx.db.insert("categories", args),
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    key: v.optional(v.string()),
    label: v.optional(v.string()),
    href: v.optional(v.string()),
    mainImage: v.optional(v.string()),
    backImages: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    order: v.optional(v.number()),
    primary: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => ctx.db.patch(id, patch),
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
