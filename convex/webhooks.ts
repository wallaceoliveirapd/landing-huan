"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "node:crypto";

/**
 * Webhook dispatch — POSTs the event payload to the configured n8n webhook
 * URL. Signs the request with HMAC-SHA256 using N8N_WEBHOOK_SECRET so the
 * receiver can verify authenticity.
 *
 * Required env vars:
 *   - N8N_WEBHOOK_URL    — receiver endpoint (set to "" or unset to disable)
 *   - N8N_WEBHOOK_SECRET — shared secret used for HMAC signature
 */
export const dispatch = internalAction({
  args: {
    event: v.string(),
    payload: v.string(), // JSON-stringified by caller
  },
  handler: async (ctx, { event, payload }) => {
    const url = process.env.N8N_WEBHOOK_URL;
    if (!url) {
      console.log(`[webhook] skipped ${event} — N8N_WEBHOOK_URL not set`);
      await ctx.runMutation(internal.webhookLog.markStatus, {
        event, payload, status: "skipped", response: "no url",
      });
      return;
    }
    const secret = process.env.N8N_WEBHOOK_SECRET ?? "";

    // Track attempt
    const id = await ctx.runMutation(internal.webhookLog.create, {
      event, payload,
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Huan-Event": event,
        "User-Agent": "huanfalcao-webhook/1.0",
      };
      if (secret) {
        const sig = crypto
          .createHmac("sha256", secret)
          .update(payload)
          .digest("hex");
        headers["X-Huan-Signature"] = `sha256=${sig}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
      });

      await ctx.runMutation(internal.webhookLog.update, {
        id,
        status: res.ok ? "sent" : "failed",
        response: `${res.status} ${res.statusText}`,
      });
    } catch (err) {
      console.error("[webhook] dispatch failed:", err);
      await ctx.runMutation(internal.webhookLog.update, {
        id,
        status: "failed",
        response: err instanceof Error ? err.message : "unknown error",
      });
    }
  },
});
