import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const SITE_URL = "https://huanfalcao.com.br";

/** Per-user trip plan limit (must stay in sync with the client-side TRIP_LIMIT). */
const TRIP_LIMIT = 3;

// Single trip by ID — only returns if user owns it.
export const getById = query({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== userId) return null;
    return trip;
  },
});

// Resolve DB items referenced by an itinerary (returns map of id → {kind, ...}).
export const resolveItineraryItems = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const trip = await ctx.db.get(tripId);
    if (!trip || trip.userId !== userId) return [];

    const ids = new Set<string>();
    for (const day of trip.itinerary ?? []) {
      for (const a of day.activities ?? []) {
        if (a.source === "db" && a.itemId) ids.add(a.itemId);
      }
    }
    const items: Record<string, Record<string, unknown>> = {};
    for (const idStr of ids) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = await ctx.db.get(idStr as any);
        if (doc) items[idStr] = doc as Record<string, unknown>;
      } catch {
        /* invalid id — skip */
      }
    }
    return items;
  },
});

export const myTrips = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    duration: v.optional(v.number()),
    groupSize: v.optional(v.number()),
    budget: v.optional(v.string()),
    notes: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Enforce the trip-limit-per-user
    const existing = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length >= TRIP_LIMIT) {
      throw new ConvexError({
        code: "TRIP_LIMIT_REACHED",
        message: `Você já tem ${TRIP_LIMIT} viagens planejadas. Apague uma pra criar outra.`,
        limit: TRIP_LIMIT,
      });
    }

    const tripId = await ctx.db.insert("trips", {
      ...args,
      userId,
      status: "planejando",
      createdAt: Date.now(),
    });

    // Fire-and-forget: email confirming the new trip. Scheduling means
    // we don't block the mutation if the email service is slow.
    const user = await ctx.db.get(userId);
    const email = (user as { email?: string } | null)?.email;
    if (email) {
      await ctx.scheduler.runAfter(2_000, internal.email.sendTripCreated, {
        to: email,
        name: (user as { name?: string } | null)?.name,
        tripTitle: args.title,
        destination: args.destination,
        tripUrl: `${SITE_URL}/minha-viagem/${tripId}`,
      });
    }

    // In-app inbox notification — appears in the bell + /notificacoes
    await ctx.db.insert("userNotifications", {
      userId,
      title: "Sua viagem está pronta",
      body: `Montei pra você um roteiro em ${args.destination}. Bora dar uma olhada!`,
      url: `/minha-viagem/${tripId}`,
      kind: "trip",
      read: false,
      createdAt: Date.now(),
    });

    // Fire webhook for n8n automations (non-blocking)
    await ctx.scheduler.runAfter(0, internal.webhooks.dispatch, {
      event: "trip.created",
      payload: JSON.stringify({
        event: "trip.created",
        at: Date.now(),
        tripId,
        userId,
        userEmail: email,
        title: args.title,
        destination: args.destination,
        type: args.type,
        duration: args.duration,
        groupSize: args.groupSize,
        budget: args.budget,
      }),
    });

    return tripId;
  },
});

export const update = mutation({
  args: {
    id: v.id("trips"),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    duration: v.optional(v.number()),
    groupSize: v.optional(v.number()),
    budget: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== userId) throw new Error("Not found");
    return ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== userId) throw new Error("Not found");
    return ctx.db.delete(id);
  },
});
