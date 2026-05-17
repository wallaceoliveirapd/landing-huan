"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook that returns a slice of an array, expanded as the user scrolls past
 * a sentinel element. Returns the visible slice, a sentinel ref to mount on
 * a placeholder near the bottom of the list, and a flag indicating whether
 * more items can still be revealed.
 */
export function useInfiniteList<T>(
  items: T[],
  { initial = 8, step = 6 }: { initial?: number; step?: number } = {},
) {
  const [count, setCount] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const total = items.length;

  // Reset visible window when the underlying list changes size (e.g. filter).
  useEffect(() => {
    setCount(initial);
  }, [total, initial]);

  useEffect(() => {
    if (count >= total) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => Math.min(c + step, total));
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [count, total, step]);

  return {
    visible: items.slice(0, count),
    sentinelRef,
    hasMore: count < total,
  };
}

/** Sentinel div rendered at the end of the list. Triggers loading more. */
export function InfiniteSentinel({
  sentinelRef,
  hasMore,
}: {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div ref={sentinelRef} className="flex items-center justify-center py-8">
      <div className="size-5 rounded-full border-2 border-[var(--color-neutral-300)] border-t-[var(--color-neutral-800)] animate-spin" />
    </div>
  );
}
