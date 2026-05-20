import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const SITE_URL = "https://huanfalcao.com.br";

/** Per-user trip plan limit (must stay in sync with the client-side TRIP_LIMIT). */
const TRIP_LIMIT = 3;

// Single trip by ID, only returns if user owns it.
// True when the current user can read this trip (owner OR collaborator).
function hasReadAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any,
  userId: string,
): boolean {
  if (!trip) return false;
  if (trip.userId === userId) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (trip.collaborators ?? []).some((c: any) => c.userId === userId);
}

export const getById = query({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const trip = await ctx.db.get(id);
    if (!hasReadAccess(trip, userId)) return null;
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
    if (!trip || !hasReadAccess(trip, userId)) return [];

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
        /* invalid id, skip */
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
    // Owned trips (cheap via index)
    const owned = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    // Trips where the user joined as a collaborator. No index on
    // collaborators[], so we scan everything not already owned.
    const collabRows = await ctx.db.query("trips").collect();
    const ownedIds = new Set(owned.map((t) => t._id));
    const shared = collabRows.filter(
      (t) =>
        !ownedIds.has(t._id) &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((t.collaborators ?? []) as Array<{ userId: string }>).some(
          (c) => c.userId === userId,
        ),
    );
    return [...owned, ...shared].sort(
      (a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0),
    );
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

    // Enforce the trip-limit-per-user (base + any admin-granted bonus)
    const user = await ctx.db.get(userId);
    const bonus = (user as { tripLimitBonus?: number } | null)?.tripLimitBonus ?? 0;
    const effectiveLimit = TRIP_LIMIT + bonus;
    const existing = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length >= effectiveLimit) {
      throw new ConvexError({
        code: "TRIP_LIMIT_REACHED",
        message: `Você já tem ${effectiveLimit} viagens planejadas. Apague uma pra criar outra.`,
        limit: effectiveLimit,
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

    // Fetch the weather snapshot in the background so the detail page
    // already has it on first load.
    if (typeof args.startDate === "number") {
      await ctx.scheduler.runAfter(3_000, internal.weather.refreshForTrip, {
        tripId,
      });
    }

    // Schedule pre-trip reminders (push + email) at 7d and 1d before
    // startDate. Skipped if startDate is in the past for that window.
    if (typeof args.startDate === "number") {
      const now = Date.now();
      const weekBefore = args.startDate - 7 * 24 * 60 * 60 * 1000;
      const dayBefore = args.startDate - 1 * 24 * 60 * 60 * 1000;
      if (weekBefore > now + 60_000) {
        await ctx.scheduler.runAt(weekBefore, internal.tripReminders.send, {
          tripId,
          kind: "week",
        });
      }
      if (dayBefore > now + 60_000) {
        await ctx.scheduler.runAt(dayBefore, internal.tripReminders.send, {
          tripId,
          kind: "day",
        });
      }
    }

    // In-app inbox notification, appears in the bell + /notificacoes
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

export const updateBasics = mutation({
  args: {
    id: v.id("trips"),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    duration: v.optional(v.number()),
    groupSize: v.optional(v.number()),
    budget: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, { id, title, type, duration, groupSize, budget, startDate }) => {
    const { trip } = await loadEditable(ctx, id);

    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (type !== undefined) patch.type = type;
    if (duration !== undefined) patch.duration = duration;
    if (groupSize !== undefined) patch.groupSize = groupSize;
    if (budget !== undefined) patch.budget = budget;
    if (startDate !== undefined) patch.startDate = startDate;

    // Append blank days if new duration exceeds existing itinerary depth.
    // Existing days are never deleted — hidden by the client via display filter.
    if (duration !== undefined) {
      const existing = trip.itinerary ?? [];
      const maxDay = existing.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: number, d: any) => Math.max(m, d.day),
        0,
      );
      if (duration > maxDay) {
        const newDays = [];
        for (let d = maxDay + 1; d <= duration; d++) {
          newDays.push({ day: d, theme: "", activities: [] });
        }
        patch.itinerary = [...existing, ...newDays];
      }
    }

    // If startDate or duration changed, the cached weather window is stale.
    // Clear the snapshot + notification flag and re-fetch in the background
    // so the next page render shows the right forecast/historical range.
    const datesChanged =
      (startDate !== undefined && startDate !== trip.startDate) ||
      (duration !== undefined && duration !== trip.duration);
    if (datesChanged) {
      patch.weatherSnapshot = undefined;
      patch.weatherNotifiedAt = undefined;
    }

    await ctx.db.patch(id, patch);

    if (datesChanged) {
      const effectiveStart = startDate !== undefined ? startDate : trip.startDate;
      if (typeof effectiveStart === "number") {
        await ctx.scheduler.runAfter(0, internal.weather.refreshForTrip, {
          tripId: id,
        });
      }
    }
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
    await loadEditable(ctx, id);
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

/**
 * Generate (or reuse) a public share token for the trip so the owner can
 * send a read-only link to anyone. Token is URL-safe random.
 */
const checklistItemValidator = v.object({
  id: v.string(),
  text: v.string(),
  done: v.boolean(),
});

export const setChecklist = mutation({
  args: {
    id: v.id("trips"),
    items: v.array(checklistItemValidator),
  },
  handler: async (ctx, { id, items }) => {
    const { trip } = await loadEditable(ctx, id);
    // Hard cap to prevent abuse.
    if (items.length > 200) throw new Error("Too many items");
    await ctx.db.patch(trip._id, { checklist: items });
  },
});

export const enableSharing = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== userId) throw new Error("Not found");
    if (trip.shareToken) return trip.shareToken;
    // 16-byte URL-safe token (server-side Math.random is fine here).
    const token = Array.from({ length: 22 }, () =>
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[
        Math.floor(Math.random() * 62)
      ],
    ).join("");
    await ctx.db.patch(id, { shareToken: token });
    return token;
  },
});

export const disableSharing = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const trip = await ctx.db.get(id);
    if (!trip || trip.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { shareToken: undefined });
  },
});

/**
 * Public, unauthenticated lookup for a shared trip. Returns ONLY the
 * fields safe to expose (no userId, no notes). Token must be exact.
 */
export const getByShareToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token || token.length < 10) return null;
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_share_token", (q) => q.eq("shareToken", token))
      .unique();
    if (!trip) return null;
    // Resolve referenced DB items so the shared page can render real images
    // and titles instead of plain text.
    const ids = new Set<string>();
    for (const day of trip.itinerary ?? []) {
      for (const a of day.activities ?? []) {
        if (a.source === "db" && a.itemId) ids.add(a.itemId);
      }
    }
    const itemMap: Record<
      string,
      {
        image?: string;
        title?: string;
        name?: string;
        slug?: string;
        shortDesc?: string;
        url?: string;
      }
    > = {};
    for (const idStr of ids) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = await ctx.db.get(idStr as any);
        if (doc) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = doc as any;
          itemMap[idStr] = {
            image: typeof d.image === "string" ? d.image : (typeof d.cover === "string" ? d.cover : undefined),
            title: typeof d.title === "string" ? d.title : undefined,
            name: typeof d.name === "string" ? d.name : undefined,
            slug: typeof d.slug === "string" ? d.slug : undefined,
            shortDesc: typeof d.shortDesc === "string" ? d.shortDesc : (typeof d.excerpt === "string" ? d.excerpt : undefined),
            url: typeof d.url === "string" ? d.url : (typeof d.affiliateUrl === "string" ? d.affiliateUrl : undefined),
          };
        }
      } catch {
        /* skip invalid */
      }
    }
    return {
      _id: trip._id,
      title: trip.title,
      destination: trip.destination,
      lat: trip.lat,
      lng: trip.lng,
      type: trip.type,
      duration: trip.duration,
      groupSize: trip.groupSize,
      budget: trip.budget,
      startDate: trip.startDate,
      status: trip.status,
      itinerary: trip.itinerary ?? [],
      weatherSnapshot: trip.weatherSnapshot,
      items: itemMap,
    };
  },
});

const activityShape = v.object({
  source: v.string(),
  kind: v.string(),
  timeOfDay: v.string(),
  title: v.string(),
  note: v.optional(v.string()),
  itemId: v.optional(v.string()),
  icon: v.optional(v.string()),
  time: v.optional(v.string()),
  customUrl: v.optional(v.string()),
  osmLat: v.optional(v.number()),
  osmLng: v.optional(v.number()),
  osmAddress: v.optional(v.string()),
  osmWebsite: v.optional(v.string()),
  addedBy: v.optional(v.string()),
});

/**
 * Returns the trip if the current user has edit permission (owner OR
 * collaborator with role="edit"). View-only collaborators are rejected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadEditable(ctx: any, tripId: string): Promise<{ trip: any; userId: string }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const trip = await ctx.db.get(tripId);
  if (!trip) throw new Error("Not found");
  if (trip.userId === userId) return { trip, userId };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collab = (trip.collaborators ?? []).find((c: any) => c.userId === userId);
  if (collab && collab.role === "edit") return { trip, userId };
  throw new Error("Sem permissão para editar essa viagem.");
}

/** Append a new activity to a specific day in the trip itinerary. */
export const addActivity = mutation({
  args: {
    tripId: v.id("trips"),
    day: v.number(),
    activity: activityShape,
  },
  handler: async (ctx, { tripId, day, activity }) => {
    const { trip, userId } = await loadEditable(ctx, tripId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itinerary: any[] = (trip.itinerary ?? []).map((d: any) => ({ ...d }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target = itinerary.find((d: any) => d.day === day);
    if (!target) {
      target = { day, theme: "", activities: [] };
      itinerary.push(target);
    }
    // Stamp who added this activity so the UI can render an avatar.
    const stamped = { ...activity, addedBy: activity.addedBy ?? userId };
    target.activities = [...target.activities, stamped];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itinerary.sort((a: any, b: any) => a.day - b.day);
    await ctx.db.patch(tripId, { itinerary });
    return null;
  },
});

/** Remove an activity at a given index from a day. */
export const removeActivity = mutation({
  args: {
    tripId: v.id("trips"),
    day: v.number(),
    index: v.number(),
  },
  handler: async (ctx, { tripId, day, index }) => {
    const { trip } = await loadEditable(ctx, tripId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itinerary: any[] = (trip.itinerary ?? []).map((d: any) => ({
      ...d,
      activities: [...d.activities],
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = itinerary.find((d: any) => d.day === day);
    if (!target) return null;
    target.activities.splice(index, 1);
    await ctx.db.patch(tripId, { itinerary });
    return null;
  },
});

/** Replace the entire activities array for a day (used by drag-and-drop reorder). */
export const reorderActivities = mutation({
  args: {
    tripId: v.id("trips"),
    day: v.number(),
    activities: v.array(activityShape),
  },
  handler: async (ctx, { tripId, day, activities }) => {
    const { trip } = await loadEditable(ctx, tripId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itinerary: any[] = (trip.itinerary ?? []).map((d: any) => ({ ...d }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = itinerary.find((d: any) => d.day === day);
    if (!target) return null;
    target.activities = activities;
    await ctx.db.patch(tripId, { itinerary });
    return null;
  },
});

/** Set the precise time (HH:MM) on an activity. Pass empty string to clear. */
export const setActivityTime = mutation({
  args: {
    tripId: v.id("trips"),
    day: v.number(),
    index: v.number(),
    time: v.string(),
  },
  handler: async (ctx, { tripId, day, index, time }) => {
    const { trip } = await loadEditable(ctx, tripId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itinerary: any[] = (trip.itinerary ?? []).map((d: any) => ({
      ...d,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: d.activities.map((a: any) => ({ ...a })),
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = itinerary.find((d: any) => d.day === day);
    if (!target || !target.activities[index]) return null;
    if (time) target.activities[index].time = time;
    else delete target.activities[index].time;
    await ctx.db.patch(tripId, { itinerary });
    return null;
  },
});
