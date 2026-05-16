import { createAccount } from "@convex-dev/auth/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Seed default admin account.
 *
 *   email:    admin@admin.com
 *   password: HuFalcao1-
 *   role:     admin
 *
 * Idempotent: if an account with this email already exists, we skip
 * creating the auth account, but still ensure role="admin" and the email
 * is marked verified so login works.
 *
 * Run with:
 *   npx convex run seedAdmin:run
 */

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "HuFalcao1-";
const ADMIN_NAME = "Admin";

export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    status: "created" | "already_exists" | "promoted";
    userId: Id<"users">;
  }> => {
    // Check if a user with this email already exists.
    const existing = await ctx.runQuery(internal.seedAdmin.findByEmail, {
      email: ADMIN_EMAIL,
    });

    if (existing) {
      // Just promote + verify.
      await ctx.runMutation(internal.seedAdmin.promoteToAdmin, {
        userId: existing,
      });
      return { status: "promoted", userId: existing };
    }

    // Create auth account via @convex-dev/auth helper.
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: {
        id: ADMIN_EMAIL,
        secret: ADMIN_PASSWORD,
      },
      profile: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
      },
    });

    await ctx.runMutation(internal.seedAdmin.promoteToAdmin, {
      userId: user._id as Id<"users">,
    });

    return { status: "created", userId: user._id as Id<"users"> };
  },
});

export const findByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const u = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    return u?._id ?? null;
  },
});

export const promoteToAdmin = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      role: "admin",
      emailVerificationTime: Date.now(),
    });
  },
});
