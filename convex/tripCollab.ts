import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const SITE_URL = "https://huanfalcao.com.br";

function token(len = 18): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function findUserByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  email: string,
): Promise<{ _id: string; name?: string; email?: string; image?: string } | null> {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q: { eq: (k: string, v: string) => unknown }) =>
      q.eq("email", norm),
    )
    .unique();
  return user;
}

async function loadTripOwned(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  tripId: string,
): Promise<{
  _id: string;
  userId: string;
  collaborators?: Array<{ userId: string; role: string; joinedAt: number }>;
  pendingInvites?: Array<{
    email: string;
    resolvedUserId?: string;
    role: string;
    token: string;
    createdAt: number;
  }>;
}> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Unauthorized");
  const trip = await ctx.db.get(tripId);
  if (!trip || trip.userId !== userId) {
    throw new ConvexError("Não encontrado");
  }
  return trip;
}

/**
 * Look up a user by email so the invite UI can show their name + avatar.
 * Returns `null` when no matching user exists.
 */
export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const u = await findUserByEmail(ctx, email);
    if (!u) return null;
    return {
      _id: u._id,
      name: u.name ?? null,
      email: u.email ?? null,
      image: u.image ?? null,
    };
  },
});

/**
 * List the people associated with a trip (owner + collaborators + pending
 * invites), with resolved names/avatars for the UI.
 */
export const peopleForTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const trip = await ctx.db.get(tripId);
    if (!trip) return null;
    const isOwner = trip.userId === userId;
    const isMember =
      isOwner ||
      (trip.collaborators ?? []).some((c) => c.userId === userId);
    if (!isMember) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function load(uid: string): Promise<any> {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = await ctx.db.get(uid as any);
        return u;
      } catch {
        return null;
      }
    }

    const ownerDoc = await load(trip.userId);
    const collabsResolved = await Promise.all(
      (trip.collaborators ?? []).map(async (c) => {
        const u = await load(c.userId);
        return {
          userId: c.userId,
          role: c.role,
          joinedAt: c.joinedAt,
          name: (u as { name?: string } | null)?.name ?? null,
          email: (u as { email?: string } | null)?.email ?? null,
          image: (u as { image?: string } | null)?.image ?? null,
        };
      }),
    );
    const invitesResolved = await Promise.all(
      (trip.pendingInvites ?? []).map(async (inv) => {
        const u = inv.resolvedUserId ? await load(inv.resolvedUserId) : null;
        return {
          email: inv.email,
          role: inv.role,
          token: inv.token,
          createdAt: inv.createdAt,
          name: (u as { name?: string } | null)?.name ?? null,
          image: (u as { image?: string } | null)?.image ?? null,
        };
      }),
    );

    return {
      isOwner,
      currentUserId: userId,
      owner: {
        userId: trip.userId,
        name: (ownerDoc as { name?: string } | null)?.name ?? null,
        email: (ownerDoc as { email?: string } | null)?.email ?? null,
        image: (ownerDoc as { image?: string } | null)?.image ?? null,
      },
      collaborators: collabsResolved,
      pendingInvites: invitesResolved,
    };
  },
});

/**
 * Owner sends an invite. Email is hashed lowercased; resolved user id is
 * recorded if it already exists (helps surface name/avatar in UI).
 * Idempotent on email — re-inviting same email refreshes the token.
 */
export const createInvite = mutation({
  args: {
    tripId: v.id("trips"),
    email: v.string(),
    role: v.union(v.literal("edit"), v.literal("view")),
  },
  handler: async (ctx, { tripId, email, role }) => {
    const trip = await loadTripOwned(ctx, tripId);
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes("@")) {
      throw new ConvexError("E-mail inválido");
    }

    // Block self-invite + already-a-collab
    const resolved = await findUserByEmail(ctx, normEmail);
    if (resolved && resolved._id === trip.userId) {
      throw new ConvexError("Você já é o dono dessa viagem.");
    }
    const existing = (trip.collaborators ?? []).find(
      (c) => resolved && c.userId === resolved._id,
    );
    if (existing) throw new ConvexError("Essa pessoa já colabora aqui.");

    const otherPending = (trip.pendingInvites ?? []).filter(
      (i) => i.email !== normEmail,
    );
    const newInvite = {
      email: normEmail,
      resolvedUserId: resolved?._id,
      role,
      token: token(),
      createdAt: Date.now(),
    };
    await ctx.db.patch(tripId, {
      pendingInvites: [...otherPending, newInvite],
    });

    // Send invite email out-of-band. Resolve inviter name + trip metadata
    // so the recipient sees who/where without an extra round-trip.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inviter = await ctx.db.get((trip as any).userId);
    const inviterName =
      (inviter as { name?: string; email?: string } | null)?.name ??
      (inviter as { name?: string; email?: string } | null)?.email ??
      "Alguém";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripAny = trip as any;
    await ctx.scheduler.runAfter(0, internal.email.sendTripInvite, {
      to: normEmail,
      inviterName,
      tripTitle: tripAny.title ?? "Minha viagem",
      destination: tripAny.destination ?? "",
      acceptUrl: `${SITE_URL}/convite/${newInvite.token}`,
      role,
      isExistingUser: !!resolved,
    });

    return newInvite.token;
  },
});

export const cancelInvite = mutation({
  args: { tripId: v.id("trips"), email: v.string() },
  handler: async (ctx, { tripId, email }) => {
    const trip = await loadTripOwned(ctx, tripId);
    const norm = email.trim().toLowerCase();
    const next = (trip.pendingInvites ?? []).filter((i) => i.email !== norm);
    await ctx.db.patch(tripId, { pendingInvites: next });
  },
});

export const changeCollaboratorRole = mutation({
  args: {
    tripId: v.id("trips"),
    collaboratorUserId: v.string(),
    role: v.union(v.literal("edit"), v.literal("view")),
  },
  handler: async (ctx, { tripId, collaboratorUserId, role }) => {
    const trip = await loadTripOwned(ctx, tripId);
    const next = (trip.collaborators ?? []).map((c) =>
      c.userId === collaboratorUserId ? { ...c, role } : c,
    );
    await ctx.db.patch(tripId, { collaborators: next });
  },
});

export const removeCollaborator = mutation({
  args: { tripId: v.id("trips"), collaboratorUserId: v.string() },
  handler: async (ctx, { tripId, collaboratorUserId }) => {
    const trip = await loadTripOwned(ctx, tripId);
    const next = (trip.collaborators ?? []).filter(
      (c) => c.userId !== collaboratorUserId,
    );
    await ctx.db.patch(tripId, { collaborators: next });
  },
});

/**
 * Pending invites for the currently logged-in user, matched on email.
 * Returns trip info + inviter avatar so the in-app modal can render
 * "Joao te chamou pra viajar" without an extra round-trip.
 */
export const myPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const me = await ctx.db.get(userId as any);
    const myEmail = (
      (me as { email?: string } | null)?.email ?? ""
    )
      .trim()
      .toLowerCase();
    if (!myEmail) return [];

    const trips = await ctx.db.query("trips").collect();
    const out: Array<{
      tripId: string;
      title: string;
      destination: string;
      duration: number | null;
      role: string;
      token: string;
      owner: { name: string | null; image: string | null };
    }> = [];
    for (const t of trips) {
      for (const inv of t.pendingInvites ?? []) {
        if (inv.email !== myEmail) continue;
        if (t.userId === userId) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let owner: any = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          owner = await ctx.db.get(t.userId as any);
        } catch {
          /* ignore */
        }
        out.push({
          tripId: t._id,
          title: t.title,
          destination: t.destination,
          duration: t.duration ?? null,
          role: inv.role,
          token: inv.token,
          owner: {
            name: (owner as { name?: string } | null)?.name ?? null,
            image: (owner as { image?: string } | null)?.image ?? null,
          },
        });
      }
    }
    return out;
  },
});

/**
 * Public lookup by invite token so the accept page can show trip info
 * before login. Returns minimal data; auth check happens on accept.
 */
export const peekInvite = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token || token.length < 10) return null;
    const trips = await ctx.db.query("trips").collect();
    for (const t of trips) {
      const inv = (t.pendingInvites ?? []).find((i) => i.token === token);
      if (!inv) continue;
      // Owner display
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let owner: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        owner = await ctx.db.get(t.userId as any);
      } catch {
        /* ignore */
      }
      return {
        tripId: t._id,
        title: t.title,
        destination: t.destination,
        duration: t.duration ?? null,
        role: inv.role,
        email: inv.email,
        owner: {
          name: (owner as { name?: string } | null)?.name ?? null,
          image: (owner as { image?: string } | null)?.image ?? null,
        },
      };
    }
    return null;
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Faça login para aceitar o convite.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const me = await ctx.db.get(userId as any);
    const myEmail =
      ((me as { email?: string } | null)?.email ?? "").trim().toLowerCase();

    const trips = await ctx.db.query("trips").collect();
    for (const t of trips) {
      const inv = (t.pendingInvites ?? []).find((i) => i.token === token);
      if (!inv) continue;
      // Email must match
      if (myEmail && inv.email && myEmail !== inv.email) {
        throw new ConvexError(
          "Esse convite foi enviado para outro e-mail. Faça login com o e-mail convidado.",
        );
      }
      if (t.userId === userId) {
        throw new ConvexError("Você já é o dono dessa viagem.");
      }
      const already = (t.collaborators ?? []).some((c) => c.userId === userId);
      if (already) {
        // Just clean up the pending entry.
        await ctx.db.patch(t._id, {
          pendingInvites: (t.pendingInvites ?? []).filter(
            (i) => i.token !== token,
          ),
        });
        return { tripId: t._id, alreadyCollaborator: true };
      }

      await ctx.db.patch(t._id, {
        collaborators: [
          ...(t.collaborators ?? []),
          { userId, role: inv.role, joinedAt: Date.now() },
        ],
        pendingInvites: (t.pendingInvites ?? []).filter(
          (i) => i.token !== token,
        ),
      });
      return { tripId: t._id, alreadyCollaborator: false };
    }
    throw new ConvexError("Convite não encontrado ou já expirado.");
  },
});

export const declineInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const trips = await ctx.db.query("trips").collect();
    for (const t of trips) {
      const inv = (t.pendingInvites ?? []).find((i) => i.token === token);
      if (!inv) continue;
      await ctx.db.patch(t._id, {
        pendingInvites: (t.pendingInvites ?? []).filter(
          (i) => i.token !== token,
        ),
      });
      return { tripId: t._id };
    }
    throw new ConvexError("Convite não encontrado.");
  },
});

/**
 * Owned-or-collaborated trips for the current user. Used by the side
 * menu / dashboard to surface shared trips.
 */
export const myTripsWithRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const trips = await ctx.db.query("trips").collect();
    const out: Array<{
      _id: string;
      title: string;
      destination: string;
      role: "owner" | "edit" | "view";
    }> = [];
    for (const t of trips) {
      if (t.userId === userId) {
        out.push({ _id: t._id, title: t.title, destination: t.destination, role: "owner" });
        continue;
      }
      const collab = (t.collaborators ?? []).find((c) => c.userId === userId);
      if (collab) {
        out.push({
          _id: t._id,
          title: t.title,
          destination: t.destination,
          role: collab.role === "edit" ? "edit" : "view",
        });
      }
    }
    return out;
  },
});
