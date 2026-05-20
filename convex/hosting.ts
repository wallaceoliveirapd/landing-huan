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
    const items = await (activeOnly
      ? ctx.db
          .query("hosting")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("hosting")
    ).collect();
    const filtered = city ? items.filter((i) => matchesCity(i.city, city)) : items;
    return filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("hosting")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("hosting")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("hosting") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

const discountBannerValidator = v.optional(
  v.object({
    title: v.string(),
    description: v.string(),
    active: v.optional(v.boolean()),
  }),
);

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    type: v.string(),
    stars: v.optional(v.number()),
    image: v.string(),
    photos: v.optional(v.array(v.string())),
    address: v.string(),
    priceFrom: v.number(),
    affiliateUrl: v.string(),
    amenities: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
    discountBanner: discountBannerValidator,
    coupons: v.optional(v.array(v.id("coupons"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("hosting", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("hosting"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    type: v.optional(v.string()),
    stars: v.optional(v.number()),
    image: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    priceFrom: v.optional(v.number()),
    affiliateUrl: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
    order: v.optional(v.number()),
    discountBanner: discountBannerValidator,
    coupons: v.optional(v.array(v.id("coupons"))),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("hosting") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
