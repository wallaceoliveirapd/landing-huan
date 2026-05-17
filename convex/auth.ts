import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import type { DataModel } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { ResendOTP, ResendOTPReset } from "./otp";

/**
 * Password auth with email OTP verification on signup.
 *
 * Two providers are registered:
 *   1. `password`, handles signUp + signIn with email/password. On signUp,
 *      it triggers `verify` (= ResendOTP) which emails a 6-digit code and
 *      keeps the account unverified until the code is confirmed.
 *   2. `resend-otp`, registered as a standalone provider so the client can
 *      call signIn("resend-otp", { email, code }) to verify and log in.
 *
 * The Password `profile` callback captures `name` and `whatsapp` from the
 * signUp form and stores them on the user document.
 */
const password = Password<DataModel>({
  verify: ResendOTP,
  reset: ResendOTPReset,
  profile(params) {
    return {
      email: params.email as string,
      name: typeof params.name === "string" ? params.name : undefined,
      whatsapp:
        typeof params.whatsapp === "string" ? params.whatsapp : undefined,
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [password, ResendOTP, ResendOTPReset],
  callbacks: {
    /**
     * Fires after the user document is created OR updated. We send the
     * welcome email + webhook ONLY after email verification (signup OTP),
     * never on raw password creation (which leaves the account
     * unverified). This way "ghost" accounts that never confirmed don't
     * receive welcome.
     */
    async afterUserCreatedOrUpdated(ctx, args) {
      // Only fire when the email is verified via the OTP provider.
      if (args.type !== "verification") return;

      const user = await ctx.db.get(args.userId);
      if (!user) return;
      const email = (user as { email?: string }).email;
      const name = (user as { name?: string }).name;
      if (!email) return;

      // Guard against re-runs (if the user re-verifies, don't email twice).
      // We store a `welcomedAt` timestamp on the user and skip if present.
      if ((user as { welcomedAt?: number }).welcomedAt) return;
      await ctx.db.patch(args.userId, { welcomedAt: Date.now() });

      await ctx.scheduler.runAfter(0, internal.email.sendWelcome, {
        to: email,
        name,
      });

      // In-app welcome notification (bell + /notificacoes)
      await ctx.db.insert("userNotifications", {
        userId: args.userId,
        title: "Bem-vindo!",
        body: "Que bom ter você por aqui. Bora montar sua primeira viagem?",
        url: "/minha-viagem/criar",
        kind: "welcome",
        read: false,
        createdAt: Date.now(),
      });

      await ctx.scheduler.runAfter(0, internal.webhooks.dispatch, {
        event: "user.signedUp",
        payload: JSON.stringify({
          event: "user.signedUp",
          at: Date.now(),
          userId: args.userId,
          email,
          name,
        }),
      });
    },
  },
});
