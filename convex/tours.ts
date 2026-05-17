import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";
import { matchesCity } from "./cityFilter";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { activeOnly = true, city }) => {
    const q = ctx.db.query("tours");
    const items = await (activeOnly
      ? q.withIndex("by_active", (q) => q.eq("active", true))
      : q
    ).collect();
    const filtered = city ? items.filter((i) => matchesCity(i.city, city)) : items;
    return filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("tours")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("tours")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("tours") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    image: v.string(),
    duration: v.string(),
    rating: v.number(),
    reviewCount: v.number(),
    url: v.string(),
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("tours", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tours"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    price: v.optional(v.number()),
    originalPrice: v.optional(v.number()),
    image: v.optional(v.string()),
    duration: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
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
  args: { id: v.id("tours") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
