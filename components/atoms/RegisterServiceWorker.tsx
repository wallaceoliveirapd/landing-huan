"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js as soon as the app boots so the offline fallback and
 * future caching strategies are active for every visitor (not only the
 * ones who opted into push). Idempotent — re-runs across navigations are
 * safe because the browser deduplicates by scope+scriptURL.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Defer to idle so we don't compete with hydration.
    const run = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("[sw] register failed", err));
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback?: (cb: () => void) => void })
        .requestIdleCallback?.(run);
    } else {
      setTimeout(run, 1500);
    }
  }, []);

  return null;
}
