"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import webpush from "web-push";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:suporte@huanfalcao.com.br";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Send a push notification to a single user's subscriptions. Used by the
 * trip reminder scheduler.
 */
export const sendToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title, body, url }): Promise<{ delivered: number; failed: number }> => {
    configureVapid();
    const iconUrl = "https://evokemedia.com.br/landing-huan/icon.png";

    // Inbox row for the user
    await ctx.runMutation(internal.notifications.insertBulk, {
      userIds: [userId],
      title,
      body,
      url: url ?? "/",
      icon: iconUrl,
      kind: "trip-reminder",
    });

    const subs: { _id: string; endpoint: string; p256dh: string; auth: string; userId: string }[] =
      await ctx.runQuery(internal.pushQueries.subscriptionsForUsers, { userIds: [userId] });

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? "/",
      tag: "trip-reminder",
      icon: iconUrl,
      badge: iconUrl,
    });

    let delivered = 0;
    let failed = 0;
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
          delivered++;
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (err as any)?.statusCode;
          if (status === 401 || status === 404 || status === 410) {
            expired.push(s._id);
          } else {
            console.warn("[push:user] send error:", err);
          }
          failed++;
        }
      }),
    );

    if (expired.length > 0) {
      await ctx.runMutation(internal.pushQueries.removeSubscriptions, { ids: expired });
    }

    return { delivered, failed };
  },
});

/**
 * Admin-only broadcast.
 * Segment options:
 *   - "all": every authenticated user with a push subscription
 *   - "planning": users with at least one trip in "planejando" status
 *   - "with-favorites": users with at least 1 favorite
 *
 * Returns counts of delivered / failed for the audit log.
 */
export const sendBroadcast = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    segment: v.string(),
  },
  handler: async (ctx, { title, body, url, segment }): Promise<{ delivered: number; failed: number }> => {
    configureVapid();

    // Get the audience userIds, this list is for the IN-APP INBOX (every
    // matching user, regardless of push opt-in).
    const userIds: string[] = await ctx.runQuery(
      internal.pushQueries.audienceForSegment,
      { segment },
    );

    // Use relative path, the SW resolves it against its own scope origin.
    // Absolute URL would fail on local dev (cross-origin fetch of the icon
    // from localhost to production URL is blocked).
    const iconUrl = "https://evokemedia.com.br/landing-huan/icon.png";

    // Write a notification row for EACH user (inbox / bell badge). This
    // shows up in /notificacoes regardless of push subscription status.
    await ctx.runMutation(internal.notifications.insertBulk, {
      userIds,
      title,
      body,
      url: url ?? "/",
      icon: iconUrl,
      kind: "broadcast",
    });

    // Get all push subscriptions for those users, these are the ones who
    // also get the real OS-level push.
    const subs: { _id: string; endpoint: string; p256dh: string; auth: string; userId: string }[] =
      await ctx.runQuery(internal.pushQueries.subscriptionsForUsers, { userIds });

    let delivered = 0;
    let failed = 0;
    const expired: string[] = []; // sub _ids that returned 410

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? "/",
      tag: "broadcast",
      icon: iconUrl,
      badge: iconUrl,
    });

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
            { TTL: 60 * 60 * 24 }, // 24h
          );
          delivered++;
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (err as any)?.statusCode;
          // 410 Gone   = subscription permanently removed by browser vendor
          // 404 NotFnd  = endpoint no longer exists
          // 401 Unauth  = VAPID key mismatch, subscription was created with
          //               different keys, can never be delivered; remove it.
          if (status === 401 || status === 404 || status === 410) {
            expired.push(s._id);
          } else {
            console.warn("[push] send error:", err);
          }
          failed++;
        }
      }),
    );

    // Cleanup expired subscriptions
    if (expired.length > 0) {
      await ctx.runMutation(internal.pushQueries.removeSubscriptions, {
        ids: expired,
      });
    }

    // Record the broadcast event for the admin audit log
    await ctx.runMutation(internal.pushQueries.recordBroadcast, {
      title, body, url, segment, delivered, failed,
    });

    return { delivered, failed };
  },
});

/**
 * Admin: send a push notification to a specific list of users.
 * Both the OS-level push and inbox notification are delivered.
 */
export const sendToSelectedUsers = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    userIds: v.array(v.string()),
  },
  handler: async (ctx, { title, body, url, userIds }): Promise<{ delivered: number; failed: number }> => {
    configureVapid();

    const iconUrl = "https://evokemedia.com.br/landing-huan/icon.png";

    await ctx.runMutation(internal.notifications.insertBulk, {
      userIds,
      title,
      body,
      url: url ?? "/",
      icon: iconUrl,
      kind: "broadcast",
    });

    const subs: { _id: string; endpoint: string; p256dh: string; auth: string; userId: string }[] =
      await ctx.runQuery(internal.pushQueries.subscriptionsForUsers, { userIds });

    const payload = JSON.stringify({
      title,
      body,
      url: url ?? "/",
      tag: "broadcast",
      icon: iconUrl,
      badge: iconUrl,
    });

    let delivered = 0;
    let failed = 0;
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
          delivered++;
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (err as any)?.statusCode;
          if (status === 401 || status === 404 || status === 410) {
            expired.push(s._id);
          } else {
            console.warn("[push:specific] send error:", err);
          }
          failed++;
        }
      }),
    );

    if (expired.length > 0) {
      await ctx.runMutation(internal.pushQueries.removeSubscriptions, { ids: expired });
    }

    await ctx.runMutation(internal.pushQueries.recordBroadcast, {
      title, body, url, segment: "specific-users", targetUserIds: userIds, delivered, failed,
    });

    return { delivered, failed };
  },
});
