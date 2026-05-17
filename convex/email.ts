"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { Resend } from "resend";
import {
  welcomeEmail,
  otpEmail,
  tripCreatedEmail,
  broadcastEmail,
} from "../lib/emailTemplates";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  return new Resend(apiKey);
}

function getFrom() {
  return process.env.EMAIL_FROM ??
    "NordestAI <nordestai@email.huanfalcao.com.br>";
}

function getReplyTo() {
  return process.env.EMAIL_REPLY_TO ?? "suporte@huanfalcao.com.br";
}

/**
 * Low-level send. Used internally and from admin broadcast page.
 * Don't call this directly from auth, use the higher-level helpers below.
 */
export const send = internalAction({
  args: {
    to: v.union(v.string(), v.array(v.string())),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, { to, subject, html }) => {
    const resend = getResend();
    const result = await resend.emails.send({
      from: getFrom(),
      to,
      subject,
      html,
      replyTo: getReplyTo(),
    });
    if (result.error) {
      console.error("[email] send failed:", result.error);
      throw new Error(result.error.message);
    }
    return { id: result.data?.id ?? "" };
  },
});

// ─── Welcome ────────────────────────────────────────────────────────────────
export const sendWelcome = internalAction({
  args: { to: v.string(), name: v.optional(v.string()) },
  handler: async (_ctx, { to, name }) => {
    const tpl = welcomeEmail({ name });
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── OTP (email verification) ─────────────────────────────────────────────
export const sendOtp = internalAction({
  args: { to: v.string(), code: v.string() },
  handler: async (_ctx, { to, code }) => {
    const tpl = otpEmail({ code, ttlMinutes: 10 });
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── Trip created ─────────────────────────────────────────────────────────
export const sendTripCreated = internalAction({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    tripTitle: v.string(),
    destination: v.string(),
    tripUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const tpl = tripCreatedEmail(args);
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── Trip reminder, 1 week before ────────────────────────────────────────
export const sendTripWeekBefore = internalAction({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    tripTitle: v.string(),
    destination: v.string(),
    tripUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const { tripWeekBeforeEmail } = await import("../lib/emailTemplates");
    const tpl = tripWeekBeforeEmail(args);
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── Trip weather update: historical → forecast promotion ────────────────
export const sendTripWeatherUpdate = internalAction({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    tripTitle: v.string(),
    destination: v.string(),
    tripUrl: v.string(),
    tempMax: v.union(v.number(), v.null()),
    tempMin: v.union(v.number(), v.null()),
  },
  handler: async (_ctx, args) => {
    const { tripWeatherUpdateEmail } = await import("../lib/emailTemplates");
    const tpl = tripWeatherUpdateEmail(args);
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── Trip reminder, 1 day before (checklist) ─────────────────────────────
export const sendTripChecklist = internalAction({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    tripTitle: v.string(),
    destination: v.string(),
    tripUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const { tripChecklistEmail } = await import("../lib/emailTemplates");
    const tpl = tripChecklistEmail(args);
    const resend = getResend();
    await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: getReplyTo(),
    });
  },
});

// ─── Admin broadcast ─────────────────────────────────────────────────────
export const sendBroadcast = action({
  args: {
    to: v.array(v.string()),
    headline: v.string(),
    body: v.string(),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const tpl = broadcastEmail(args);
    const resend = getResend();
    // Send in batches of 50 to respect Resend per-request limits
    const chunks: string[][] = [];
    for (let i = 0; i < args.to.length; i += 50) {
      chunks.push(args.to.slice(i, i + 50));
    }
    let sent = 0;
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((to) =>
          resend.emails.send({
            from: getFrom(),
            to,
            subject: tpl.subject,
            html: tpl.html,
            replyTo: getReplyTo(),
          }),
        ),
      );
      sent += chunk.length;
    }
    return { sent };
  },
});
