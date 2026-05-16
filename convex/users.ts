import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DELETION_REASONS = ["nao-uso", "privacidade", "bugs", "duplicidade", "outro"] as const;
const VALID_ROLES = ["admin", "customer"] as const;

/** Returns the current authenticated user, or null if not logged in */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

/**
 * Lightweight role check for client-side gating.
 * Returns "admin" | "customer" | null (not logged in).
 */
export const myRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const u = await ctx.db.get(userId);
    return ((u as { role?: string } | null)?.role ?? "customer") as
      | "admin"
      | "customer";
  },
});

/**
 * One-off migration — promotes the user with the email defined in the
 * ADMIN_EMAIL Convex env var to "admin", and makes sure every other user
 * has role="customer" and emailVerificationTime set (so they can sign
 * in normally despite the new OTP requirement).
 *
 * Run with: `npx convex run users:bootstrapRoles`
 */
export const bootstrapRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const users = await ctx.db.query("users").collect();
    let promoted = 0;
    let normalized = 0;
    const now = Date.now();
    for (const u of users) {
      const patch: Record<string, unknown> = {};
      // Set role if missing
      if (!(u as { role?: string }).role) {
        const matches =
          adminEmail && u.email?.toLowerCase().trim() === adminEmail;
        patch.role = matches ? "admin" : "customer";
        if (matches) promoted++;
      }
      // Mark existing accounts as verified so they can sign in without OTP
      if (!u.emailVerificationTime) patch.emailVerificationTime = now;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(u._id, patch);
        normalized++;
      }
    }
    return { totalUsers: users.length, promoted, normalized };
  },
});

/**
 * Permanently delete the authenticated user's account. We:
 *   1. Persist the reason + optional feedback to `accountDeletions`
 *      (so we learn why people churn) — using a SNAPSHOT of email/name
 *      since we're about to delete the user row.
 *   2. Cascade-delete user-owned data: trips, favorites.
 *      Auth subsystem (authAccounts, authSessions, authRefreshTokens,
 *      authVerificationCodes, etc.) is cleaned by deleting their rows
 *      with this userId.
 *   3. Delete the user row.
 *
 * Caller must `signOut()` afterwards on the client.
 */
export const requestDeletion = mutation({
  args: {
    reason: v.string(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, { reason, feedback }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!(DELETION_REASONS as readonly string[]).includes(reason)) {
      throw new Error("Invalid reason");
    }

    const user = await ctx.db.get(userId);

    // 1. Save deletion feedback
    await ctx.db.insert("accountDeletions", {
      userId,
      email: (user as { email?: string } | null)?.email,
      name: (user as { name?: string } | null)?.name,
      reason,
      feedback,
      deletedAt: Date.now(),
    });

    // 2. Cascade — delete data owned by this user
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const t of trips) await ctx.db.delete(t._id);

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const f of favorites) await ctx.db.delete(f._id);

    // 3. Clean up Convex Auth tables (kept here for completeness — if
    // your schema doesn't index by userId on these, this is best-effort).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tables: any[] = [
      "authAccounts",
      "authSessions",
      "authRefreshTokens",
      "authVerificationCodes",
      "authVerifiers",
    ];
    for (const tableName of tables) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await (ctx.db as any)
          .query(tableName)
          .filter((q: any) => q.eq(q.field("userId"), userId))
          .collect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of rows) await ctx.db.delete(r._id);
      } catch {
        /* table doesn't exist or no userId field — skip */
      }
    }

    // 4. Finally delete the user
    await ctx.db.delete(userId);

    return { ok: true };
  },
});

/** Update the current user's profile fields (name, whatsapp). */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patch: Record<string, string> = {};
    if (typeof args.name === "string") patch.name = args.name.trim();
    if (typeof args.whatsapp === "string") {
      patch.whatsapp = args.whatsapp.replace(/\D/g, "");
    }
    if (Object.keys(patch).length === 0) return null;
    await ctx.db.patch(userId, patch);
    return ctx.db.get(userId);
  },
});
