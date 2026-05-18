import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const log = mutation({
  args: {
    ref: v.string(),
    itemType: v.string(),
    itemName: v.string(),
    targetUrl: v.string(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("affiliateClicks", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const list = query({
  args: {
    itemType: v.optional(v.string()),
    ref: v.optional(v.string()),
    channel: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { itemType, ref, channel, limit = 200 }) => {
    await requireAdmin(ctx);
    let items;
    if (itemType) {
      items = await ctx.db
        .query("affiliateClicks")
        .withIndex("by_itemType_timestamp", (q) => q.eq("itemType", itemType))
        .order("desc")
        .take(limit);
    } else if (ref) {
      items = await ctx.db
        .query("affiliateClicks")
        .withIndex("by_ref", (q) => q.eq("ref", ref))
        .order("desc")
        .take(limit);
    } else {
      items = await ctx.db
        .query("affiliateClicks")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }
    if (channel) {
      items = items.filter((i) => i.channel === channel);
    }
    return items;
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_timestamp")
      .order("desc")
      .take(5000);

    const byType: Record<string, number> = {};
    const byItem: Record<string, { name: string; count: number; type: string }> = {};
    const byChannel: Record<string, number> = {};

    for (const c of all) {
      byType[c.itemType] = (byType[c.itemType] ?? 0) + 1;
      if (!byItem[c.ref]) {
        byItem[c.ref] = { name: c.itemName, count: 0, type: c.itemType };
      }
      byItem[c.ref].count++;
      if (c.channel) {
        byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
      }
    }

    const topItems = Object.entries(byItem)
      .map(([ref, data]) => ({ ref, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      total: all.length,
      byType,
      topItems,
      byChannel,
    };
  },
});
