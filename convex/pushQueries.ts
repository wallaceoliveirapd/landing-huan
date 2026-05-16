import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── User-facing: subscribe / unsubscribe / status ─────────────────────────

/**
 * Register a Web Push subscription for the authenticated user.
 * Upserts on (userId, endpoint).
 */
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      // Reassign to the current user if the device is shared
      await ctx.db.patch(existing._id, {
        userId,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

/** Remove a specific endpoint subscription (user revoked permission). */
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing && existing.userId === userId) {
      await ctx.db.delete(existing._id);
    }
  },
});

/** Quick check: does the current user have any active subscription? */
export const myStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { subscribed: false };
    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return { subscribed: !!sub };
  },
});

// ─── Internal — used by convex/push.ts action ─────────────────────────────

/**
 * Resolve a broadcast segment into the list of userIds to target.
 *
 * The audience for the IN-APP INBOX is "every user matching the segment",
 * even if they don't have push subscribed. Push delivery to those without
 * a subscription simply does nothing (handled elsewhere).
 */
export const audienceForSegment = internalQuery({
  args: { segment: v.string() },
  handler: async (ctx, { segment }) => {
    const allUsers = await ctx.db.query("users").collect();
    const allUserIds = allUsers.map((u) => u._id);

    if (segment === "all" || segment === "") return allUserIds;

    if (segment === "planning") {
      const result: string[] = [];
      for (const uid of allUserIds) {
        const t = await ctx.db
          .query("trips")
          .withIndex("by_user", (q) => q.eq("userId", uid))
          .first();
        if (t && t.status === "planejando") result.push(uid);
      }
      return result;
    }

    if (segment === "with-favorites") {
      const result: string[] = [];
      for (const uid of allUserIds) {
        const f = await ctx.db
          .query("favorites")
          .withIndex("by_user", (q) => q.eq("userId", uid))
          .first();
        if (f) result.push(uid);
      }
      return result;
    }

    return allUserIds;
  },
});

/** All subscriptions for a list of users (flat). */
export const subscriptionsForUsers = internalQuery({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, { userIds }) => {
    const out: {
      _id: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      userId: string;
    }[] = [];
    for (const uid of userIds) {
      const subs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .collect();
      for (const s of subs) {
        out.push({
          _id: s._id,
          endpoint: s.endpoint,
          p256dh: s.p256dh,
          auth: s.auth,
          userId: s.userId,
        });
      }
    }
    return out;
  },
});

/** Bulk-remove subscriptions (expired endpoints with 410 from push service). */
export const removeSubscriptions = internalMutation({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    for (const id of ids) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.delete(id as any);
      } catch {
        /* already gone */
      }
    }
  },
});

/** Admin: wipe ALL push subscriptions (use after rotating VAPID keys). */
export const clearAllSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const all = await ctx.db.query("pushSubscriptions").collect();
    for (const s of all) {
      await ctx.db.delete(s._id);
    }
    return { removed: all.length };
  },
});

/** Persist a broadcast attempt to the audit log. */
export const recordBroadcast = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    segment: v.string(),
    delivered: v.number(),
    failed: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) ?? "system";
    await ctx.db.insert("pushBroadcasts", {
      sentByUserId: userId,
      title: args.title,
      body: args.body,
      url: args.url,
      segment: args.segment,
      delivered: args.delivered,
      failed: args.failed,
      sentAt: Date.now(),
    });
  },
});

/** Admin-only: list past broadcasts (newest first). */
export const listBroadcasts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const rows = await ctx.db
      .query("pushBroadcasts")
      .withIndex("by_sentAt")
      .order("desc")
      .take(limit);
    return rows;
  },
});
