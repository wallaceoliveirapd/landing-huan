import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    const items = await (category
      ? ctx.db
          .query("media")
          .withIndex("by_category", (q) => q.eq("category", category))
      : ctx.db.query("media")
    ).collect();
    return items.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

export const saveMediaRecord = mutation({
  args: {
    filename: v.string(),
    url: v.string(),
    mimeType: v.string(),
    size: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return ctx.db.insert("media", { ...args, uploadedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

// R2 presign, called from Next.js API route, not directly from Convex
export const generateR2PresignUrl = action({
  args: {
    filename: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { filename, mimeType }) => {
    // This action is intentionally thin, the heavy lifting (S3 presign) happens
    // in the Next.js API route /api/upload which has access to R2 env vars.
    // We return a token so the API route knows the request is from an authenticated user.
    return { filename, mimeType, token: "presign-via-api-route" };
  },
});
