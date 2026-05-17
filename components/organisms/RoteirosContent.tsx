"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { RoteiroListCard } from "./RoteiroListCard";
import { SectionSpacer } from "./SectionSpacer";
import { EmptyState } from "./EmptyState";
import { ListingSearch } from "@/components/molecules/ListingSearch";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import type { Itinerary } from "@/lib/mock-data";

export function RoteirosContent() {
  const convexItineraries = useQuery(api.itineraries.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeDuration, setActiveDuration] = useState<string | null>(null);

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexItineraries !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("roteiros");
    }
  }, [convexItineraries]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "roteiros");
    }
  }, [search]);

  const allItems: (Itinerary & { city?: string })[] = useMemo(
    () =>
      (convexItineraries ?? []).map((it) => ({
        id: it._id,
        slug: it.slug,
        title: it.title,
        subtitle: it.subtitle,
        durationDays: it.durationDays,
        cover: it.cover,
        days: it.days,
        city: it.city,
      })),
    [convexItineraries],
  );

  const cities = useMemo(
    () => [...new Set(allItems.map((it) => it.city).filter(Boolean) as string[])].sort(),
    [allItems],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((it) => {
      if (q && !it.title.toLowerCase().includes(q) && !it.subtitle.toLowerCase().includes(q)) return false;
      if (activeCity && it.city !== activeCity) return false;
      if (activeDuration) {
        if (activeDuration === "1" && it.durationDays !== 1) return false;
        if (activeDuration === "2-3" && (it.durationDays < 2 || it.durationDays > 3)) return false;
        if (activeDuration === "4-7" && (it.durationDays < 4 || it.durationDays > 7)) return false;
        if (activeDuration === "7+" && it.durationDays <= 7) return false;
      }
      return true;
    });
  }, [allItems, search, activeCity, activeDuration]);

  const chips = [
    { key: "dur-1", label: "1 dia", active: activeDuration === "1", onToggle: () => { const next = activeDuration === "1" ? null : "1"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "1 dia", "roteiros"); } },
    { key: "dur-23", label: "2–3 dias", active: activeDuration === "2-3", onToggle: () => { const next = activeDuration === "2-3" ? null : "2-3"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "2–3 dias", "roteiros"); } },
    { key: "dur-47", label: "4–7 dias", active: activeDuration === "4-7", onToggle: () => { const next = activeDuration === "4-7" ? null : "4-7"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "4–7 dias", "roteiros"); } },
    { key: "dur-7+", label: "7+ dias", active: activeDuration === "7+", onToggle: () => { const next = activeDuration === "7+" ? null : "7+"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "7+ dias", "roteiros"); } },
    ...cities.map((c) => ({
      key: `city-${c}`,
      label: c.split(",")[0],
      active: activeCity === c,
      onToggle: () => { const next = activeCity === c ? null : c; setActiveCity(next); if (next) gtmFilterApplied("cidade", c.split(",")[0], "roteiros"); },
    })),
  ];

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexItineraries === undefined) {
    return (
      <div className="pb-20">
        <div className="h-20 bg-white border-b border-[var(--color-neutral-100)]" />
        <section className="bg-white py-6">
          <div className="mx-auto w-full max-w-screen-md p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[280px] rounded-card bg-[var(--color-neutral-100)] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <section className="bg-white">
        <EmptyState
          icon="map"
          title="Roteiros em preparo"
          description="Estamos montando roteiros especiais. Volte em breve!"
        />
      </section>
    );
  }

  return (
    <div className="pb-20">
      <ListingSearch
        search={search}
        onSearch={setSearch}
        placeholder="Buscar roteiros..."
        chips={chips}
        resultCount={filtered.length}
        totalCount={allItems.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="map" title="Nenhum roteiro encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        visible.map((it, i) => (
          <div key={it.id}>
            <section className="bg-white">
              <div className="mx-auto w-full max-w-screen-md p-4">
                <RoteiroListCard itinerary={it} />
              </div>
            </section>
            {i < visible.length - 1 && <SectionSpacer />}
          </div>
        ))
      )}
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  );
}
