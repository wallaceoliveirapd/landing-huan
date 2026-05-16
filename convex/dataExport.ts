import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Returns all of the authenticated user's owned data so the client can
 * package it into a CSV/ZIP for download (LGPD compliance).
 *
 * Returns null when the user is not authenticated — caller should treat
 * that as 401.
 */
export const exportMyData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Resolve favorite items to their human-readable titles when possible
    const favoritesEnriched = await Promise.all(
      favorites.map(async (f) => {
        let title = "";
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = await ctx.db.get(f.itemId as any);
          if (doc) {
            title =
              (doc as { title?: string }).title ??
              (doc as { name?: string }).name ??
              "";
          }
        } catch {
          /* invalid id */
        }
        return { ...f, title };
      }),
    );

    return {
      exportedAt: Date.now(),
      profile: {
        id: userId,
        email: (user as { email?: string } | null)?.email ?? "",
        name: (user as { name?: string } | null)?.name ?? "",
        whatsapp: (user as { whatsapp?: string } | null)?.whatsapp ?? "",
        createdAt: (user as { _creationTime?: number } | null)?._creationTime ?? null,
      },
      trips: trips.map((t) => ({
        id: t._id,
        title: t.title,
        destination: t.destination,
        type: t.type,
        duration: t.duration ?? null,
        groupSize: t.groupSize ?? null,
        budget: t.budget ?? "",
        status: t.status,
        createdAt: t.createdAt,
      })),
      favorites: favoritesEnriched.map((f) => ({
        id: f._id,
        kind: f.kind,
        itemId: f.itemId,
        title: f.title,
        createdAt: f.createdAt,
      })),
    };
  },
});
