"use client";

import { useEffect } from "react";

/**
 * iOS Safari ignores viewport user-scalable=no in the regular browser tab.
 * touch-action: pan-x pan-y also doesn't fully block pinch on iOS.
 * Listening to `gesturestart` and preventing it is the only reliable way to
 * block pinch-zoom on iOS Safari. In PWA standalone the viewport meta is
 * already respected, so this is a no-op there.
 *
 * We also block double-tap zoom (gesturechange/gestureend) just in case.
 * Multi-touch pinch via wheel+ctrl on desktop is also intercepted.
 */
export function DisablePinchZoom() {
  useEffect(() => {
    function block(e: Event) {
      e.preventDefault();
    }

    // iOS Safari gesture events (non-standard but only way to block pinch)
    document.addEventListener("gesturestart", block, { passive: false });
    document.addEventListener("gesturechange", block, { passive: false });
    document.addEventListener("gestureend", block, { passive: false });

    // Desktop: Ctrl+wheel pinch in browsers
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) e.preventDefault();
    }
    document.addEventListener("wheel", onWheel, { passive: false });

    // Cmd/Ctrl + (+/-/0) keyboard zoom
    function onKey(e: KeyboardEvent) {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    }
    document.addEventListener("keydown", onKey, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
      document.removeEventListener("gestureend", block);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
