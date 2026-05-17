import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";
import { otpEmail, passwordResetEmail } from "../lib/emailTemplates";

async function send(
  template: { subject: string; html: string },
  to: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const from = process.env.EMAIL_FROM ?? "Huan Falcão <oi@email.huanfalcao.com.br>";
  const replyTo = process.env.EMAIL_REPLY_TO ?? "oi@huanfalcao.com.br";
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: template.subject,
    html: template.html,
    replyTo,
  });
  if (result.error) {
    console.error("[otp] send failed:", result.error);
    throw new Error(result.error.message);
  }
}

function ttlMinutesFromExpires(expires: Date) {
  return Math.max(1, Math.round((expires.getTime() - Date.now()) / 60_000));
}

function genNumericCode(): string {
  // eslint-disable-next-line no-restricted-globals
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0]).slice(0, 6).padStart(6, "0");
}

/**
 * Email OTP provider used to verify a user's email during signup.
 *
 * Used as `Password({ verify: ResendOTP })` and as a standalone provider so
 * the frontend can call signIn("resend-otp", { email, code }) to finish
 * verification.
 *
 * Token expires in 10 minutes.
 */
export const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 60 * 10,
  async generateVerificationToken() {
    return genNumericCode();
  },
  async sendVerificationRequest({ identifier: email, token, expires }) {
    await send(
      otpEmail({ code: token, ttlMinutes: ttlMinutesFromExpires(expires) }),
      email,
    );
  },
});

/**
 * Email OTP provider used for password reset / change-password flows. Same
 * mechanics as ResendOTP but emails a copy that talks about resetting the
 * password instead of confirming a signup, so users don't see "concluir seu
 * cadastro" when they asked to change their password.
 */
export const ResendOTPReset = Email({
  id: "resend-otp-reset",
  maxAge: 60 * 10,
  async generateVerificationToken() {
    return genNumericCode();
  },
  async sendVerificationRequest({ identifier: email, token, expires }) {
    await send(
      passwordResetEmail({
        code: token,
        ttlMinutes: ttlMinutesFromExpires(expires),
      }),
      email,
    );
  },
});
