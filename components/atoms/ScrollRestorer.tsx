"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "scroll-restore-v1";
const MAX_ENTRIES = 24;
const RESTORE_DELAY_MS = 80;

type Saved = Record<string, number>;

function readMap(): Saved {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Saved;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Saved) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Per-pathname scroll restoration. Stores the page's scrollY in
 * sessionStorage right before the route changes, then restores it on
 * mount of the new route. Works around the default Next App Router
 * behaviour, which always lands at scrollY=0 on forward navigation.
 */
export function ScrollRestorer() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  // Save scroll position when leaving the current route + on page hide.
  useEffect(() => {
    function save() {
      if (!previousPath.current) return;
      const map = readMap();
      map[previousPath.current] = window.scrollY;
      // Keep the map small.
      const entries = Object.entries(map);
      if (entries.length > MAX_ENTRIES) {
        const trimmed = Object.fromEntries(entries.slice(-MAX_ENTRIES));
        writeMap(trimmed);
      } else {
        writeMap(map);
      }
    }

    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [pathname]);

  // Restore on every pathname change.
  useEffect(() => {
    const map = readMap();
    const target = map[pathname];
    previousPath.current = pathname;

    // Disable browser scroll restoration so it can't fight us.
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      try {
        history.scrollRestoration = "manual";
      } catch {
        /* ignore */
      }
    }

    if (typeof target === "number" && target > 0) {
      // Wait for layout + RouteTransition fade to settle.
      const t = window.setTimeout(() => {
        window.scrollTo({ top: target, left: 0, behavior: "auto" });
      }, RESTORE_DELAY_MS);
      return () => window.clearTimeout(t);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}
