"use client";

import { useEffect } from "react";

/**
 * Register /sw.js as early as possible so the offline page is pre-cached
 * and ready to serve when the user loses connectivity. The same service
 * worker also handles push notifications (see lib/pushClient.ts).
 *
 * No UI. Mounts once at the app root.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Defer slightly so we don't compete with the initial paint on slow
    // devices. The worker just needs to be registered, not active in
    // milliseconds.
    const t = window.setTimeout(() => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("[sw] registration failed", err);
        });
    }, 1500);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
