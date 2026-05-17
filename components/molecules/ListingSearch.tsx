"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";

/**
 * Generic search bar + filter chips for listing pages.
 * Pure presentation, all state lives in the parent.
 */

export interface FilterChip {
  key: string;
  label: string;
  active: boolean;
  onToggle: () => void;
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  chips?: FilterChip[];
  resultCount?: number;
  totalCount?: number;
  loading?: boolean;
}

export function ListingSearch({
  search,
  onSearch,
  placeholder = "Buscar...",
  chips = [],
  resultCount,
  totalCount,
  loading,
}: Props) {
  const hasActiveChips = chips.some((c) => c.active);
  const showCount =
    resultCount !== undefined && totalCount !== undefined && resultCount !== totalCount;

  // Sentinel-based detection of sticky-pinned state. While the sentinel is
  // visible above the search bar, the bar is in its normal flow position and
  // the safe-area padding is not needed. Once the sentinel scrolls out, the
  // bar is pinned to top:0 and we extend the top padding to cover the
  // system status bar.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(false);

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

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-px" />
      <div
        className="bg-white sticky top-0 z-10 border-b border-[var(--color-neutral-100)] flex flex-col gap-2 pb-2 pt-3 transition-[padding] duration-150"
        style={
          pinned
            ? { paddingTop: "calc(max(env(safe-area-inset-top), 0px) + 12px)" }
            : undefined
        }
      >
        {/* Search input, constrained with side padding */}
        <div className="relative px-4">
          <Icon
            name="search"
            size={16}
            className="absolute left-7 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 pl-9 pr-9 rounded-full border border-[var(--color-neutral-300)] bg-white text-[14px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors placeholder:text-[var(--color-neutral-400)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-800)]"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Filter chips, full-bleed scroll with right fade */}
        {chips.length > 0 && (
          <div className="relative">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="no-scrollbar carousel-smooth flex gap-2 overflow-x-auto px-4 pb-0.5">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onToggle}
                  className={cn(
                    "flex-none h-7 px-3 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap",
                    chip.active
                      ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                      : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-600)]",
                  )}
                >
                  {chip.label}
                </button>
              ))}
              {hasActiveChips && (
                <button
                  type="button"
                  onClick={() => chips.forEach((c) => c.active && c.onToggle())}
                  className="flex-none h-7 px-3 rounded-full text-[12px] font-medium border border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)] transition-colors whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              )}
              <div className="flex-none w-8 shrink-0" aria-hidden />
            </div>
          </div>
        )}

        {/* Result count */}
        {!loading && showCount && (
          <p className="px-4 text-[11px] text-[var(--color-neutral-500)]">
            {resultCount} de {totalCount} resultado{totalCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}
