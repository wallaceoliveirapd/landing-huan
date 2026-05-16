import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

const stopValidator = v.union(
  v.object({ type: v.literal("tour"), tourId: v.string() }),
  v.object({
    type: v.literal("place"),
    name: v.string(),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    time: v.optional(v.string()),
  })
);

const dayValidator = v.object({
  day: v.number(),
  title: v.string(),
  description: v.string(),
  stops: v.array(stopValidator),
});

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("itineraries")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("itineraries")
    ).collect();
    return items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("itineraries")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("itineraries")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("itineraries") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    subtitle: v.string(),
    durationDays: v.number(),
    cover: v.string(),
    days: v.array(dayValidator),
    city: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("itineraries", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("itineraries"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    durationDays: v.optional(v.number()),
    cover: v.optional(v.string()),
    days: v.optional(v.array(dayValidator)),
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
  args: { id: v.id("itineraries") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
