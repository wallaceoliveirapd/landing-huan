import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("praias")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("praias")
    ).collect();
    return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("praias")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("praias")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("praias") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    image: v.string(),
    photos: v.array(v.string()),
    location: v.string(),
    features: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("praias", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("praias"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    image: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("praias") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
