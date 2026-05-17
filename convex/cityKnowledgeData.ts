import { v } from "convex/values";
import {
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAdmin } from "./helpers";
import { matchesCity } from "./cityFilter";

/**
 * Internal lookup used by the chat route / itinerary generator to inject
 * admin-curated facts about the active city. Returns only active rows
 * whose season window (if any) covers today.
 */
export const listForCity = internalQuery({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const rows = await ctx.db.query("cityKnowledge").collect();
    const month = new Date().getUTCMonth() + 1; // 1..12
    return rows
      .filter((r) => r.active)
      .filter((r) => matchesCity(r.city, city))
      .filter((r) => {
        if (r.startMonth == null || r.endMonth == null) return true;
        const s = r.startMonth, e = r.endMonth;
        return s <= e ? month >= s && month <= e : month >= s || month <= e;
      });
  },
});

// ─── Admin CRUD ────────────────────────────────────────────────
export const adminList = query({
  args: { city: v.optional(v.string()) },
  handler: async (ctx, { city }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("cityKnowledge").collect();
    const filtered = city ? rows.filter((r) => matchesCity(r.city, city)) : rows;
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: {
    city: v.string(),
    title: v.string(),
    body: v.string(),
    startMonth: v.optional(v.number()),
    endMonth: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("cityKnowledge", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cityKnowledge"),
    city: v.string(),
    title: v.string(),
    body: v.string(),
    startMonth: v.optional(v.number()),
    endMonth: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("cityKnowledge") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});
