import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const items = await (activeOnly
      ? ctx.db
          .query("dicas")
          .withIndex("by_active", (q) => q.eq("active", true))
      : ctx.db.query("dicas")
    ).collect();
    return items.sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

export const featured = query({
  handler: async (ctx) => {
    return ctx.db
      .query("dicas")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("dicas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("dicas") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    cover: v.string(),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    featured: v.boolean(),
    active: v.boolean(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { tags, publishedAt, ...rest }) => {
    await requireAdmin(ctx);
    return ctx.db.insert("dicas", {
      ...rest,
      tags: tags ?? [],
      publishedAt: publishedAt ?? Date.now(),
    });
  },
});

// Called by cowork script (no auth, uses internal action wrapper)
export const createFromCowork = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    cover: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("dicas", {
      ...args,
      publishedAt: Date.now(),
      featured: false,
      active: true,
      source: "cowork",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("dicas"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    cover: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    city: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("dicas") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
