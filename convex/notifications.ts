import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_LIMIT = 30;

/**
 * Public query: paginated inbox for the current user.
 * Most recent first. Caller can pass a custom limit (max 100).
 */
export const myNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const cap = Math.min(limit ?? DEFAULT_LIMIT, 100);
    return await ctx.db
      .query("userNotifications")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(cap);
  },
});

/**
 * Quick count of unread notifications — used by the header bell badge.
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query("userNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    return rows.length;
  },
});

/** Mark a single notification as read. */
export const markRead = mutation({
  args: { id: v.id("userNotifications") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const n = await ctx.db.get(id);
    if (!n || n.userId !== userId) return;
    if (!n.read) await ctx.db.patch(id, { read: true, readAt: Date.now() });
  },
});

/** Mark every notification of the current user as read. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const rows = await ctx.db
      .query("userNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    const now = Date.now();
    for (const n of rows) {
      await ctx.db.patch(n._id, { read: true, readAt: now });
    }
    return rows.length;
  },
});

/**
 * Internal — insert a notification for ONE user.
 * Used by system events (trip created, welcome, etc.) and by broadcasts.
 */
export const insert = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    kind: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userNotifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal — bulk insert for broadcast (one row per user).
 * Receives the audience userIds and the notification fields.
 */
export const insertBulk = internalMutation({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    kind: v.string(),
  },
  handler: async (ctx, { userIds, ...fields }) => {
    const now = Date.now();
    for (const uid of userIds) {
      await ctx.db.insert("userNotifications", {
        userId: uid,
        ...fields,
        read: false,
        createdAt: now,
      });
    }
    return userIds.length;
  },
});
