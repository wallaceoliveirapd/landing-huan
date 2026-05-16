import { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const userId = await getAuthUserId(ctx as QueryCtx);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
