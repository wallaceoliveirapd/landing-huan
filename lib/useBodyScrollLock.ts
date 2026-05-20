"use client";

import { useEffect } from "react";

/**
 * Locks page scroll while a modal / sheet is open.
 *
 * Tracks how many components currently want the lock via a module-level
 * counter so multiple stacked sheets (e.g. story viewer + auth modal) only
 * release the lock when the last one closes. Saves and restores the
 * pre-lock `overflow` / `paddingRight` to avoid layout jumps from the
 * scrollbar disappearing on desktop.
 */
let lockCount = 0;
let savedOverflow: string | null = null;
let savedPaddingRight: string | null = null;
let savedScrollY = 0;

function applyLock() {
  if (lockCount > 0) return;
  if (typeof document === "undefined") return;
  const body = document.body;
  savedOverflow = body.style.overflow;
  savedPaddingRight = body.style.paddingRight;
  savedScrollY = window.scrollY;
  // Reserve the scrollbar width on desktop so layout doesn't shift.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
  body.style.overflow = "hidden";
}

function releaseLock() {
  if (lockCount > 0) return;
  if (typeof document === "undefined") return;
  const body = document.body;
  body.style.overflow = savedOverflow ?? "";
  body.style.paddingRight = savedPaddingRight ?? "";
  // Re-pin to the previous scroll position in case any layout change moved it.
  if (typeof window !== "undefined") {
    window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
  }
}

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    if (lockCount === 1) applyLock();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [active]);
}
