"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "trip-dados", label: "Dados", icon: "info" },
  { id: "trip-roteiro", label: "Roteiro", icon: "map" },
  { id: "trip-checklist", label: "Checklist", icon: "list-checks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Sticky tab bar for the trip detail page. Scrolls smoothly to each
 * section, highlights the currently visible section, and adopts the
 * safe-area top inset once pinned.
 */
export function TripTabs() {
  const [active, setActive] = useState<TabId>(TABS[0].id);
  const [pinned, setPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Pinned detection — when the sentinel scrolls out of view, the bar is
  // stuck to the top of the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Active section: pick the one with the most visible area on screen
  // below the tabs bar. Sections wrap their actual content so bounding
  // rects span the full section, not zero-height anchors.
  useEffect(() => {
    function update() {
      const offset = 120;
      const viewportH = window.innerHeight;
      let best: { id: TabId; score: number } | null = null;
      for (const t of TABS) {
        const el = document.getElementById(t.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const top = Math.max(r.top, offset);
        const bottom = Math.min(r.bottom, viewportH);
        const visible = Math.max(0, bottom - top);
        if (!best || visible > best.score) best = { id: t.id, score: visible };
      }
      if (best && best.score > 0) setActive(best.id);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function go(id: TabId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-px" />
      <div
        aria-hidden={!pinned}
        className={cn(
          "sticky top-0 z-30 bg-white border-b border-[var(--color-neutral-100)] transition-opacity duration-200",
          pinned
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        style={
          pinned
            ? { paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 6px)" }
            : { paddingTop: 0, height: 0, overflow: "hidden" }
        }
      >
        <div className="flex items-stretch gap-1 px-2 pb-0 max-w-screen-md mx-auto">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                className={cn(
                  "relative flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-neutral-800)]"
                    : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]",
                )}
              >
                <Icon name={t.icon} size={14} />
                <span>{t.label}</span>
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-[1px]  h-[2px] rounded-t-full bg-[var(--color-neutral-800)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
