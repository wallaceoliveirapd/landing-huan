"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";
import {
  ListingFiltersModal,
  type FilterSection,
} from "./ListingFiltersModal";

/**
 * Listing search + primary filter chips + "Filtros" button (with counter
 * badge) that opens the full filters modal. Each primary chip can either
 * be a direct toggle (`primaryChips`) or trigger the modal opened to a
 * specific section.
 */
export type PrimaryChip = {
  key: string;
  label: string;
  icon: string;
  /** Currently selected value's label (e.g. "João Pessoa"). */
  activeLabel?: string;
  onClick: () => void;
};

export function ListingFilterBar({
  search,
  onSearch,
  placeholder = "Buscar...",
  primaryChips = [],
  filterSections,
  onClearAll,
  resultCount,
  totalCount,
  loading,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  primaryChips?: PrimaryChip[];
  filterSections: FilterSection[];
  onClearAll: () => void;
  resultCount?: number;
  totalCount?: number;
  loading?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const activeCount = filterSections.reduce((acc, s) => {
    if (s.type === "single") return s.value ? acc + 1 : acc;
    if (s.type === "multi") return acc + s.value.length;
    // location: state + city each count as one
    return acc + (s.activeState ? 1 : 0) + (s.activeCity ? 1 : 0);
  }, 0);

  const showCount =
    !loading &&
    resultCount !== undefined &&
    totalCount !== undefined &&
    resultCount !== totalCount;

  // Sticky pinned state for safe-area padding adjustment.
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
        {/* Search input */}
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

        {/* Primary chips + "Filtros" button */}
        <div className="relative">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="no-scrollbar carousel-smooth flex gap-2 overflow-x-auto px-4 pb-0.5">
            {/* Filtros button always first */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={cn(
                "flex-none inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap",
                activeCount > 0
                  ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                  : "bg-white text-[var(--color-neutral-800)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-600)]",
              )}
            >
              <Icon name="sliders-horizontal" size={13} />
              <span>Filtros</span>
              {activeCount > 0 && (
                <span
                  className={cn(
                    "min-w-[18px] h-[18px] grid place-items-center rounded-full text-[10px] font-semibold px-1",
                    "bg-white text-[var(--color-neutral-800)]",
                  )}
                >
                  {activeCount}
                </span>
              )}
            </button>

            {primaryChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onClick}
                className={cn(
                  "flex-none inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap",
                  chip.activeLabel
                    ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                    : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-600)]",
                )}
              >
                <Icon name={chip.icon} size={13} />
                <span>{chip.activeLabel ?? chip.label}</span>
              </button>
            ))}

            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex-none inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)] whitespace-nowrap"
              >
                Limpar
              </button>
            )}
            <div className="flex-none w-8 shrink-0" aria-hidden />
          </div>
        </div>

        {/* Result count */}
        {showCount && (
          <p className="px-4 text-[11px] text-[var(--color-neutral-500)]">
            {resultCount} de {totalCount} resultado{totalCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <ListingFiltersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sections={filterSections}
        onClearAll={onClearAll}
      />
    </>
  );
}
