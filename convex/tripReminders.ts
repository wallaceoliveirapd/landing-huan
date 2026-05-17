import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Sends both email + push for a trip reminder. The trip.create mutation
 * schedules this twice (1 week + 1 day before startDate).
 */
export const send = internalAction({
  args: {
    tripId: v.string(),
    kind: v.union(v.literal("week"), v.literal("day")),
  },
  handler: async (ctx, { tripId, kind }) => {
    // Fetch trip + user (server-only)
    const data = await ctx.runQuery(internal.tripRemindersData.getForReminder, {
      tripId,
    });
    if (!data) return;
    const { trip, email, name } = data;
    const tripUrl = `https://huanfalcao.com.br/minha-viagem/${trip._id}`;

    if (email) {
      if (kind === "week") {
        await ctx.runAction(internal.email.sendTripWeekBefore, {
          to: email,
          name,
          tripTitle: trip.title,
          destination: trip.destination,
          tripUrl,
        });
      } else {
        await ctx.runAction(internal.email.sendTripChecklist, {
          to: email,
          name,
          tripTitle: trip.title,
          destination: trip.destination,
          tripUrl,
        });
      }
    }

    const pushTitle =
      kind === "week"
        ? `Falta 1 semana pra ${trip.destination}`
        : `Amanhã é dia! ${trip.destination}`;
    const pushBody =
      kind === "week"
        ? "Bora se organizar pra sua viagem? Eu te ajudo no chat."
        : "Checklist rapido pra hoje: documento, carregador, protetor solar.";

    await ctx.runAction(internal.push.sendToUser, {
      userId: trip.userId,
      title: pushTitle,
      body: pushBody,
      url: `/minha-viagem/${trip._id}`,
    });
  },
});
