"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";

const DISABLED_PATHS = ["/minha-viagem/criar", "/admin"];

function isAnyModalOpen(): boolean {
  // Modals lock body scroll (overflow: hidden), quick signal.
  if (typeof document !== "undefined" && document.body.style.overflow === "hidden") return true;
  // Belt and suspenders: any open dialog with aria-modal.
  return !!document.querySelector('[role="dialog"][aria-modal="true"]');
}

const THRESHOLD = 80;
const MAX_PULL = 140;

/**
 * Native-app-style pull-to-refresh. Trigger: drag down from the very top of
 * the document. Past the threshold, releasing reloads the page.
 *
 * The page already has `overscroll-behavior-y: none` globally so the browser
 * does not steal the gesture.
 */
export function PullToRefresh() {
  const pathname = usePathname();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  const pathDisabled = DISABLED_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (pathDisabled) return;

    function onTouchStart(e: TouchEvent) {
      // Skip when a modal is open so swipes do not dismiss/reload it.
      if (isAnyModalOpen()) return;
      // Only start tracking when scroll is at the very top.
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null) return;
      if (window.scrollY > 0) {
        startY.current = null;
        setPull(0);
        pullRef.current = 0;
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        pullRef.current = 0;
        return;
      }
      // Dampened pull, 0.55 feels close to native iOS.
      const damped = Math.min(dy * 0.55, MAX_PULL);
      pullRef.current = damped;
      setPull(damped);
    }

    function onTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        // Slight delay so the spinner is visible before reload.
        setTimeout(() => window.location.reload(), 220);
        return;
      }
      setPull(0);
      pullRef.current = 0;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pathDisabled]);

  if (pathDisabled) return null;
  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(pull / THRESHOLD, 1);
  const showSpinner = refreshing || pull >= THRESHOLD;

  return (
    <div
      aria-hidden
      className="fixed top-0 inset-x-0 z-[60] flex justify-center pointer-events-none"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + 12px)`,
        transform: `translateY(${Math.min(pull, MAX_PULL) - 40}px)`,
        transition: refreshing ? "transform 0.2s ease" : "none",
      }}
    >
      <div
        className="grid size-10 place-items-center rounded-full bg-white"
        style={{
          boxShadow: "0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          opacity: 0.5 + progress * 0.5,
        }}
      >
        <span
          className={showSpinner ? "animate-spin" : ""}
          style={{
            transform: showSpinner ? "none" : `rotate(${progress * 270}deg)`,
            transition: showSpinner ? "none" : "transform 0.05s linear",
          }}
        >
          <Icon
            name="refresh-cw"
            size={18}
            className="text-[var(--color-neutral-800)]"
          />
        </span>
      </div>
    </div>
  );
}
