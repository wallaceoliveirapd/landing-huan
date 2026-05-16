import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";
import { otpEmail } from "../lib/emailTemplates";

/**
 * Email OTP provider used to verify a user's email during signup.
 *
 * Flow:
 *   1. Frontend calls signIn("password", { ...signUpData, flow: "signUp" }).
 *      Password creates the account in UNVERIFIED state and triggers this
 *      provider's `sendVerificationRequest` because it's passed as
 *      `Password({ verify: ResendOTP })`.
 *   2. We email a 6-digit code to the user.
 *   3. Frontend collects the code and calls
 *      signIn("resend-otp", { email, code }) — this provider verifies the
 *      code and Convex Auth marks the account as verified + signs them in.
 *
 * Token expires in 10 minutes.
 */
export const ResendOTP = Email({
  id: "resend-otp",
  // 10 minutes
  maxAge: 60 * 10,
  // 6-digit numeric code
  async generateVerificationToken() {
    // eslint-disable-next-line no-restricted-globals
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0]).slice(0, 6).padStart(6, "0");
  },
  async sendVerificationRequest({ identifier: email, token, expires }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const from = process.env.EMAIL_FROM ??
      "Huan Falcão <oi@email.huanfalcao.com.br>";
    const replyTo = process.env.EMAIL_REPLY_TO ?? "oi@huanfalcao.com.br";

    const ttlMinutes = Math.max(
      1,
      Math.round((expires.getTime() - Date.now()) / 60_000),
    );

    const tpl = otpEmail({ code: token, ttlMinutes });

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      replyTo,
    });
    if (result.error) {
      console.error("[otp] send failed:", result.error);
      throw new Error(result.error.message);
    }
  },
});
