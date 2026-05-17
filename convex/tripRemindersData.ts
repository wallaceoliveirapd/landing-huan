import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Lookup helper for the reminder action, returns the trip + user email/name
 * given a trip id. Kept in a separate file so the action (which uses node
 * runtime) doesn't get a transitive dependency on db query types.
 */
export const getForReminder = internalQuery({
  args: { tripId: v.string() },
  handler: async (ctx, { tripId }) => {
    const trip = await ctx.db.get(tripId as Id<"trips">);
    if (!trip) return null;
    const user = (await ctx.db.get((trip as Doc<"trips">).userId as Id<"users">)) as
      | (Doc<"users"> & { email?: string; name?: string })
      | null;
    return {
      trip,
      email: user?.email,
      name: user?.name,
    };
  },
});
