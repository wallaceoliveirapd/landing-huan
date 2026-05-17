import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const DAILY_LIMIT = 10;

/** "YYYY-MM-DD" in São Paulo timezone, the user-facing day window. */
function brDateKey(now: number = Date.now()): string {
  // sv-SE locale conveniently formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/**
 * Returns the authenticated user's chat usage for today and the daily limit.
 * Logged-out users get a fixed zero usage; the chat API also rejects them.
 */
export const myStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { used: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT, blocked: false };
    }
    const row = await ctx.db
      .query("chatDailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("dateKey", brDateKey()),
      )
      .unique();
    const used = row?.count ?? 0;
    return {
      used,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - used),
      blocked: used >= DAILY_LIMIT,
    };
  },
});

/**
 * Increment the user's chat usage by 1 for today. Rejects the call when the
 * limit has already been reached so the chat send flow can short-circuit.
 *
 * Returns the post-increment state so the client can update its counter
 * without a second round trip.
 */
export const consume = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const dateKey = brDateKey();
    const row = await ctx.db
      .query("chatDailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("dateKey", dateKey),
      )
      .unique();
    const current = row?.count ?? 0;
    if (current >= DAILY_LIMIT) {
      return { used: current, limit: DAILY_LIMIT, remaining: 0, blocked: true };
    }
    if (row) {
      await ctx.db.patch(row._id, { count: current + 1 });
    } else {
      await ctx.db.insert("chatDailyUsage", { userId, dateKey, count: 1 });
    }
    const used = current + 1;
    return {
      used,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - used),
      blocked: used >= DAILY_LIMIT,
    };
  },
});
