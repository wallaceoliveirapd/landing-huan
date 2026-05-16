import { v } from "convex/values";
import {
  internalMutation,
  query,
} from "./_generated/server";

/** Record a webhook attempt (status = "pending"). */
export const create = internalMutation({
  args: { event: v.string(), payload: v.string() },
  handler: async (ctx, { event, payload }) => {
    return await ctx.db.insert("webhookEvents", {
      event,
      payload,
      status: "pending",
      response: undefined,
      createdAt: Date.now(),
    });
  },
});

/** Update a previously-recorded attempt with the result. */
export const update = internalMutation({
  args: {
    id: v.id("webhookEvents"),
    status: v.string(),
    response: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, response }) => {
    await ctx.db.patch(id, { status, response });
  },
});

/** Insert a final-status event without a pre-created row. */
export const markStatus = internalMutation({
  args: {
    event: v.string(),
    payload: v.string(),
    status: v.string(),
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      event: args.event,
      payload: args.payload,
      status: args.status,
      response: args.response,
      createdAt: Date.now(),
    });
  },
});

/** Admin-only: list recent webhook events. */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_status_createdAt")
      .order("desc")
      .take(limit);
  },
});
