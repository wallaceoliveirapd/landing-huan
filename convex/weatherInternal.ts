import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const dayShape = v.object({
  date: v.string(),
  tempMax: v.number(),
  tempMin: v.number(),
  precipitationSum: v.number(),
  precipitationProbabilityMax: v.optional(v.number()),
  weatherCode: v.number(),
});

const summaryShape = v.object({
  avgTempMax: v.number(),
  avgTempMin: v.number(),
  rainyDayCount: v.number(),
  dominantCode: v.number(),
});

export const patchSnapshot = internalMutation({
  args: {
    tripId: v.id("trips"),
    snapshot: v.object({
      mode: v.string(),
      fetchedAt: v.number(),
      days: v.array(dayShape),
      summary: v.optional(summaryShape),
    }),
  },
  handler: async (ctx, { tripId, snapshot }) => {
    await ctx.db.patch(tripId, { weatherSnapshot: snapshot });
    return null;
  },
});

export const markWeatherNotified = internalMutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    await ctx.db.patch(tripId, { weatherNotifiedAt: Date.now() });
    return null;
  },
});
