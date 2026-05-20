"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { toProxyUrl } from "@/lib/imageUpload";
import { StoriesViewer } from "./StoriesViewer";

/**
 * One bubble per active story, each showing a thumbnail (image or first
 * frame of the video). Tap → opens the viewer at that story. Hidden when
 * there are no active stories.
 */
export function StoriesRing({
  size = 64,
  inline = false,
}: {
  size?: number;
  /** When true, render the bubbles inline (no own scroller) so the parent
   *  controls horizontal layout / overflow. */
  inline?: boolean;
}) {
  const auth = useAuth();
  const stories = useQuery(api.stories.listActive, {});
  const viewed = useQuery(
    api.stories.myViewedStoryIds,
    auth.isAuthenticated ? {} : "skip",
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!stories || stories.length === 0) return null;

  const viewedSet = new Set(viewed ?? []);
  // Convex returns DESC (newest first). The viewer plays in chronological
  // order (ASC) and starts at the first unseen story. The carousel matches
  // viewer order ONLY when everything has been seen — otherwise newest-first
  // wins so freshness leads the row.
  const ascending = [...stories].reverse();
  const allSeen = stories.every((s) => viewedSet.has(s._id));
  const carouselList = allSeen ? ascending : stories;
  const firstUnseenAsc = ascending.findIndex((s) => !viewedSet.has(s._id));
  const viewerStart = firstUnseenAsc === -1 ? 0 : firstUnseenAsc;

  const bubbles = carouselList.map((s, i) => {
    const seen = viewedSet.has(s._id);
    const isVideo = s.mediaType === "video";
    const url = toProxyUrl(s.url);
    return (
      <button
        key={s._id}
        type="button"
        onClick={() => setOpenIndex(viewerStart)}
        className="inline-flex flex-col items-center gap-1.5 select-none active:scale-95 transition-transform shrink-0"
        aria-label={`Story ${i + 1}`}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 20, delay: i * 0.04 }}
          className="relative rounded-full"
          style={{ width: size, height: size }}
        >
          {/* Spinning gradient ring (only for unseen stories) */}
          <div
            className={`absolute inset-0 rounded-full ${seen ? "" : "story-ring-spin"}`}
            style={{
              background: seen
                ? "var(--color-neutral-300)"
                : "conic-gradient(from 180deg, #F9FD17, #6c47ff, #f000e4ff, #F9FD17)",
            }}
          />
          {/* Thumb (stays still on top of the ring) */}
          <span
            className="absolute rounded-full bg-white grid place-items-center"
            style={{ inset: 3, padding: 2 }}
          >
            <span className="rounded-full overflow-hidden size-full block bg-[var(--color-neutral-200)]">
              {isVideo ? (
                // Append #t=0.1 so Safari/Chrome render the first frame.
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={`${url}#t=0.1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="size-full object-cover" />
              )}
            </span>
          </span>
        </motion.div>
        <span
          className="text-[11px] font-medium text-[var(--color-neutral-700)] truncate max-w-[72px] block"
          title={s.caption ?? "Você precisa ver isso"}
        >
          {s.caption?.trim() || "Você precisa ver isso"}
        </span>
      </button>
    );
  });

  return (
    <>
      {inline ? (
        bubbles
      ) : (
        <div className="flex items-start gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {bubbles}
        </div>
      )}

      {openIndex !== null && (
        <StoriesViewer
          stories={ascending}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
