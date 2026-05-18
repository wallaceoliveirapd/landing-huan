import { v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const SITE_URL = "https://huanfalcao.com.br";

const VALID_ROLES = ["admin", "customer"] as const;

/**
 * Helper, assert that the calling user is an admin. Throws otherwise.
 */
async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const u = await ctx.db.get(userId);
  const role = (u as { role?: string } | null)?.role ?? "customer";
  if (role !== "admin") throw new Error("Forbidden, admin only");
  return userId;
}

/**
 * Admin-only list of users with their basic profile + counts.
 * Supports an optional text search (matches against name/email) and a
 * role filter.
 */
export const list = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()), // "" | "admin" | "customer"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, role, limit }) => {
    await requireAdmin(ctx);
    const cap = Math.min(limit ?? 100, 500);
    const users = await ctx.db.query("users").order("desc").take(cap);

    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const q = search ? norm(search.trim()) : "";

    const filtered = users.filter((u) => {
      // Role filter
      const userRole = ((u as { role?: string }).role ?? "customer") as
        | "admin"
        | "customer";
      if (role && role !== "" && userRole !== role) return false;

      // Search filter
      if (!q) return true;
      const name = ((u as { name?: string }).name ?? "").toLowerCase();
      const email = ((u as { email?: string }).email ?? "").toLowerCase();
      return norm(`${name} ${email}`).includes(q);
    });

    // Enrich with trip + favorite counts (best-effort, capped per user)
    const enriched = await Promise.all(
      filtered.map(async (u) => {
        const trips = await ctx.db
          .query("trips")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        const favorites = await ctx.db
          .query("favorites")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        return {
          _id: u._id,
          _creationTime: u._creationTime,
          name: (u as { name?: string }).name ?? "",
          email: (u as { email?: string }).email ?? "",
          whatsapp: (u as { whatsapp?: string }).whatsapp ?? "",
          role: ((u as { role?: string }).role ?? "customer") as
            | "admin"
            | "customer",
          emailVerificationTime:
            (u as { emailVerificationTime?: number }).emailVerificationTime ??
            null,
          welcomedAt: (u as { welcomedAt?: number }).welcomedAt ?? null,
          tripsCount: trips.length,
          favoritesCount: favorites.length,
        };
      }),
    );

    return enriched;
  },
});

/** Admin-only, get a single user by id with full details. */
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const u = await ctx.db.get(id);
    if (!u) return null;
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .collect();
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .collect();
    return {
      _id: u._id,
      _creationTime: u._creationTime,
      name: (u as { name?: string }).name ?? "",
      email: (u as { email?: string }).email ?? "",
      whatsapp: (u as { whatsapp?: string }).whatsapp ?? "",
      role: ((u as { role?: string }).role ?? "customer") as
        | "admin"
        | "customer",
      emailVerificationTime:
        (u as { emailVerificationTime?: number }).emailVerificationTime ?? null,
      welcomedAt: (u as { welcomedAt?: number }).welcomedAt ?? null,
      tripLimitBonus: (u as { tripLimitBonus?: number }).tripLimitBonus ?? 0,
      chatLimitBonus: (u as { chatLimitBonus?: number }).chatLimitBonus ?? 0,
      trips: trips.map((t) => ({
        _id: t._id,
        title: t.title,
        destination: t.destination,
        status: t.status,
        createdAt: t.createdAt,
      })),
      favorites: favorites.map((f) => ({
        _id: f._id,
        kind: f.kind,
        itemId: f.itemId,
        createdAt: f.createdAt,
      })),
    };
  },
});

/** Admin-only, update profile fields (name, whatsapp, email). */
export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireAdmin(ctx);
    const cleaned: Record<string, string> = {};
    if (typeof patch.name === "string") cleaned.name = patch.name.trim();
    if (typeof patch.whatsapp === "string")
      cleaned.whatsapp = patch.whatsapp.replace(/\D/g, "");
    if (typeof patch.email === "string")
      cleaned.email = patch.email.trim().toLowerCase();
    if (Object.keys(cleaned).length === 0) return null;
    await ctx.db.patch(id, cleaned);
    return await ctx.db.get(id);
  },
});

/** Admin-only, change a user's role. Can't demote your last admin. */
export const setRole = mutation({
  args: { id: v.id("users"), role: v.string() },
  handler: async (ctx, { id, role }) => {
    const callerId = await requireAdmin(ctx);
    if (!(VALID_ROLES as readonly string[]).includes(role)) {
      throw new Error("Invalid role");
    }
    // Don't allow demoting the caller if they're the last admin
    if (role !== "admin" && id === callerId) {
      const others = await ctx.db.query("users").collect();
      const otherAdmins = others.filter(
        (u) =>
          u._id !== callerId &&
          (u as { role?: string }).role === "admin",
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Não dá pra remover o último admin do sistema. Promova outro usuário primeiro.",
        );
      }
    }
    await ctx.db.patch(id, { role });
    return await ctx.db.get(id);
  },
});

/** Admin-only, manually mark the user's email as verified. */
export const markEmailVerified = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { emailVerificationTime: Date.now() });
    return await ctx.db.get(id);
  },
});

/** Admin-only, unverify the email (sets emailVerificationTime back to undefined). */
export const unmarkEmailVerified = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { emailVerificationTime: undefined });
    return await ctx.db.get(id);
  },
});

/** Admin-only, set per-user trip and chat limit bonuses (stacked on top of global defaults). */
export const setLimits = mutation({
  args: {
    id: v.id("users"),
    tripLimitBonus: v.number(),
    chatLimitBonus: v.number(),
  },
  handler: async (ctx, { id, tripLimitBonus, chatLimitBonus }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, {
      tripLimitBonus: Math.max(0, Math.round(tripLimitBonus)),
      chatLimitBonus: Math.max(0, Math.round(chatLimitBonus)),
    });
    return await ctx.db.get(id);
  },
});

/**
 * Admin-only, trigger a password reset for a user. Sends them an email
 * with a deep link to /esqueci-senha?email=...&autosend=1 that auto-fires
 * the standard Convex Auth reset-OTP flow on page load.
 *
 * Admin never sees the OTP code; it goes straight to the user's email.
 */
export const requestPasswordReset = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const u = await ctx.db.get(id);
    if (!u) throw new Error("Usuário não encontrado");
    const email = (u as { email?: string }).email;
    if (!email) throw new Error("Usuário sem email cadastrado");
    const name = (u as { name?: string }).name;
    const resetUrl = `${SITE_URL}/esqueci-senha?email=${encodeURIComponent(email)}&autosend=1`;
    await ctx.scheduler.runAfter(0, internal.email.sendPasswordResetRequest, {
      to: email,
      name,
      resetUrl,
    });
    return { ok: true };
  },
});

/**
 * Admin-only, create a new user (admin or customer) WITHOUT a password.
 * They'll need to use "forgot password" / reset flow to set one, OR you
 * can communicate the email separately.
 *
 * For simplicity, this just creates the user row directly, no Auth
 * Account is created (so they can't sign in until you also create an
 * auth account via the normal signUp flow on their behalf).
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    whatsapp: v.optional(v.string()),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!(VALID_ROLES as readonly string[]).includes(args.role)) {
      throw new Error("Invalid role");
    }
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new Error("Já existe um usuário com esse email");
    const id = await ctx.db.insert("users", {
      name: args.name.trim(),
      email,
      whatsapp: args.whatsapp?.replace(/\D/g, ""),
      role: args.role,
      emailVerificationTime: Date.now(),
    });
    return id;
  },
});

/**
 * Admin-only, delete a user account + all their data (trips, favorites,
 * reviews, etc.). Caller can't delete themselves.
 */
export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const callerId = await requireAdmin(ctx);
    if (id === callerId) {
      throw new Error("Você não pode excluir sua própria conta por aqui.");
    }
    // Cascade
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .collect();
    for (const t of trips) await ctx.db.delete(t._id);

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .collect();
    for (const f of favorites) await ctx.db.delete(f._id);

    // Auth tables (best effort)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tables = ["authAccounts", "authSessions", "authRefreshTokens"] as any[];
    for (const tableName of tables) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = await (ctx.db as any)
          .query(tableName)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((q: any) => q.eq(q.field("userId"), id))
          .collect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of rows) await ctx.db.delete(r._id);
      } catch {
        /* missing table or field */
      }
    }

    await ctx.db.delete(id);
    return { ok: true };
  },
});
