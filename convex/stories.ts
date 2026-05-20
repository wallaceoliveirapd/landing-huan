import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./helpers";
import { internal } from "./_generated/api";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type ReactionCount = { emoji: string; count: number };

function normalizeReactions(
  rc: unknown,
): ReactionCount[] {
  if (Array.isArray(rc)) return rc as ReactionCount[];
  if (rc && typeof rc === "object") {
    return Object.entries(rc as Record<string, number>).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  }
  return [];
}

/**
 * List currently active stories (createdAt within last 24h), ordered
 * oldest-first so the bar shows the publishing order.
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("stories")
      .withIndex("by_expires", (q) => q.gt("expiresAt", now))
      .order("desc")
      .collect();
    return rows.map((s) => ({
      _id: s._id,
      mediaType: s.mediaType,
      url: s.url,
      durationMs: s.durationMs,
      caption: s.caption,
      captionStyle: s.captionStyle,
      link: s.link,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      viewCount: s.viewCount ?? 0,
      linkClickCount: s.linkClickCount ?? 0,
      reactionCounts: normalizeReactions(s.reactionCounts),
    }));
  },
});

/**
 * For the currently logged-in user, returns which active stories they
 * have already viewed (so the bar can render "seen" vs "unseen" rings).
 */
export const myViewedStoryIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("storyViews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => r.storyId);
  },
});

/**
 * Admin lists all stories (including expired-but-not-yet-cleaned) so
 * they can review counts and delete early.
 */
export const adminListAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("stories").order("desc").collect();
  },
});

/**
 * Admin: insert a new story. Caller uploads to R2 first, then passes
 * the `r2Key` + public URL. Lifetime is fixed at 24h from now.
 */
export const adminCreate = mutation({
  args: {
    mediaType: v.union(v.literal("image"), v.literal("video")),
    r2Key: v.string(),
    url: v.string(),
    durationMs: v.optional(v.number()),
    caption: v.optional(v.string()),
    captionStyle: v.optional(
      v.object({
        color: v.optional(v.string()),
        bg: v.optional(v.string()),
        align: v.optional(v.string()),
      }),
    ),
    link: v.optional(
      v.object({
        url: v.string(),
        label: v.string(),
        color: v.optional(v.string()),
        bg: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdmin(ctx);
    const now = Date.now();
    return await ctx.db.insert("stories", {
      mediaType: args.mediaType,
      r2Key: args.r2Key,
      url: args.url,
      durationMs: args.durationMs,
      caption: args.caption?.trim() || undefined,
      captionStyle: args.captionStyle,
      link: args.link,
      createdAt: now,
      expiresAt: now + TWENTY_FOUR_HOURS_MS,
      publishedBy: adminUserId as string,
      viewCount: 0,
      reactionCounts: [],
    });
  },
});

/** Admin: delete a story immediately (also clears its R2 object). */
export const adminDelete = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const story = await ctx.db.get(id);
    if (!story) return;
    await ctx.db.delete(id);
    // Schedule R2 deletion outside the mutation.
    await ctx.scheduler.runAfter(0, internal.stories.deleteR2Object, {
      r2Key: story.r2Key,
    });
  },
});

/**
 * Track a story view. Idempotent per (storyId, userId).
 */
export const recordView = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story_user", (q) =>
        q.eq("storyId", id).eq("userId", userId),
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("storyViews", {
      storyId: id,
      userId,
      viewedAt: Date.now(),
    });
    const story = await ctx.db.get(id);
    if (story) {
      await ctx.db.patch(id, { viewCount: (story.viewCount ?? 0) + 1 });
    }
  },
});

/**
 * Anonymous: bump the link-click counter on a story. No auth required so
 * even logged-out viewers count toward the metric.
 */
export const recordLinkClick = mutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    const story = await ctx.db.get(id);
    if (!story) return;
    await ctx.db.patch(id, {
      linkClickCount: (story.linkClickCount ?? 0) + 1,
    });
  },
});

/**
 * Set / change the current user's reaction emoji on a story. Pass an
 * empty string to clear. Counters are kept on the story doc.
 */
export const reactToStory = mutation({
  args: { id: v.id("stories"), emoji: v.string() },
  handler: async (ctx, { id, emoji }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Faça login pra reagir");
    const story = await ctx.db.get(id);
    if (!story) throw new Error("Story não existe");
    const existing = await ctx.db
      .query("storyReactions")
      .withIndex("by_story_user", (q) =>
        q.eq("storyId", id).eq("userId", userId),
      )
      .unique();

    const counts: ReactionCount[] = normalizeReactions(story.reactionCounts);
    function bump(e: string, delta: number) {
      const i = counts.findIndex((c) => c.emoji === e);
      if (i === -1) {
        if (delta > 0) counts.push({ emoji: e, count: delta });
      } else {
        counts[i].count = Math.max(0, counts[i].count + delta);
        if (counts[i].count === 0) counts.splice(i, 1);
      }
    }
    if (existing) {
      if (existing.emoji) bump(existing.emoji, -1);
      if (!emoji) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { emoji, createdAt: Date.now() });
        bump(emoji, 1);
      }
    } else if (emoji) {
      await ctx.db.insert("storyReactions", {
        storyId: id,
        userId,
        emoji,
        createdAt: Date.now(),
      });
      bump(emoji, 1);
    }
    await ctx.db.patch(id, { reactionCounts: counts });
  },
});

// ── Cron: purge expired stories every 30 min ─────────────────────────
export const purgeExpired = internalAction({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    const now = Date.now();
    const expired: Array<{ _id: string; r2Key: string }> = await ctx.runQuery(
      internal.stories.listExpired,
      { now },
    );
    for (const s of expired) {
      try {
        await ctx.runAction(internal.stories.deleteR2Object, {
          r2Key: s.r2Key,
        });
      } catch (err) {
        console.warn("[stories] delete R2 failed", err);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.runMutation(internal.stories.hardDelete, { id: s._id as any });
    }
    return { deleted: expired.length };
  },
});

export const listExpired = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, { now }): Promise<Array<{ _id: string; r2Key: string }>> => {
    const rows = await ctx.db
      .query("stories")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();
    return rows.map((s) => ({ _id: s._id, r2Key: s.r2Key }));
  },
});

export const hardDelete = internalMutation({
  args: { id: v.id("stories") },
  handler: async (ctx, { id }) => {
    // Also drop related view/reaction rows.
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story_user", (q) => q.eq("storyId", id))
      .collect();
    for (const v of views) await ctx.db.delete(v._id);
    const reactions = await ctx.db
      .query("storyReactions")
      .withIndex("by_story_user", (q) => q.eq("storyId", id))
      .collect();
    for (const r of reactions) await ctx.db.delete(r._id);
    await ctx.db.delete(id);
  },
});

/**
 * Calls the Next.js API route that removes the R2 object. We could use
 * the AWS SDK directly here, but keeping the side-effect on the Node
 * side avoids bundling AWS SDK into the Convex action.
 */
export const deleteR2Object = internalAction({
  args: { r2Key: v.string() },
  handler: async (_ctx, { r2Key }) => {
    const url = process.env.SITE_URL ?? "https://huanfalcao.com.br";
    const secret = process.env.R2_DELETE_SECRET ?? "";
    try {
      await fetch(`${url}/api/r2-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-purge-secret": secret,
        },
        body: JSON.stringify({ key: r2Key }),
      });
    } catch (err) {
      console.warn("[stories] r2 delete fetch failed", err);
    }
  },
});
