import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";
import { matchesCity } from "./cityFilter";
import { mergedCouponIdsFor } from "./coupons";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { activeOnly = true, city }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("praias")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("praias")
    ).collect();
    const filtered = city
      ? items.filter((i) => matchesCity(i.city, city))
      : items;
    return filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
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
    const item = await ctx.db
      .query("praias")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!item) return null;
    const coupons = await mergedCouponIdsFor(ctx, "praia", item._id, item.coupons);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...item, coupons: coupons as any };
  },
});

export const getById = query({
  args: { id: v.id("praias") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const allFeatures = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("praias").collect();
    const set = new Set<string>();
    for (const p of all) for (const f of p.features) set.add(f);
    return [...set].sort();
  },
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
    coupons: v.optional(v.array(v.id("coupons"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let slug = args.slug;
    let existing = await ctx.db
      .query("praias")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    let suffix = 2;
    while (existing) {
      slug = `${args.slug}-${suffix++}`;
      existing = await ctx.db
        .query("praias")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
    }
    return ctx.db.insert("praias", { ...args, slug });
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
    coupons: v.optional(v.array(v.id("coupons"))),
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
