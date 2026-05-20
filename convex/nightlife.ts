import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";
import { matchesCity } from "./cityFilter";
import { mergedCouponIdsFor } from "./coupons";

const hoursValidator = v.array(
  v.object({ day: v.string(), open: v.string(), close: v.string() })
);

const discountBannerValidator = v.optional(
  v.object({
    title: v.string(),
    description: v.string(),
    active: v.optional(v.boolean()),
  }),
);

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, { activeOnly = true, city }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("nightlife")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("nightlife")
    ).collect();
    const filtered = city ? items.filter((i) => matchesCity(i.city, city)) : items;
    return filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("nightlife")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const item = await ctx.db
      .query("nightlife")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!item) return null;
    const coupons = await mergedCouponIdsFor(ctx, "nightlife", item._id, item.coupons);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...item, coupons: coupons as any };
  },
});

export const getById = query({
  args: { id: v.id("nightlife") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.string(),
    type: v.string(),
    image: v.string(),
    photos: v.array(v.string()),
    address: v.string(),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    hours: hoursValidator,
    tags: v.array(v.string()),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
    discountBanner: discountBannerValidator,
    coupons: v.optional(v.array(v.id("coupons"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("nightlife", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("nightlife"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    type: v.optional(v.string()),
    image: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    instagram: v.optional(v.string()),
    hours: v.optional(hoursValidator),
    tags: v.optional(v.array(v.string())),
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
  args: { id: v.id("nightlife") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
