"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { RoteiroListCard } from "./RoteiroListCard";
import { SectionSpacer } from "./SectionSpacer";
import { EmptyState } from "./EmptyState";
import { ListingFilterBar } from "@/components/molecules/ListingFilterBar";
import type { FilterSection } from "@/components/molecules/ListingFiltersModal";
import { buildCityOptions, parseCity } from "@/lib/locationFilter";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import type { Itinerary } from "@/lib/mock-data";

export function RoteirosContent() {
  const convexItineraries = useQuery(api.itineraries.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
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

  const cityOptions = useMemo(
    () => buildCityOptions(allItems.map((it) => it.city)),
    [allItems],
  );
  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [cityOptions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((it) => {
      if (q && !it.title.toLowerCase().includes(q) && !it.subtitle.toLowerCase().includes(q)) return false;
      if (activeCity) {
        const ic = parseCity(it.city ?? "");
        const ac = parseCity(activeCity);
        if (ic.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      } else if (activeState) {
        const ic = parseCity(it.city ?? "");
        if (ic.state !== activeState) return false;
      }
      if (activeDuration) {
        if (activeDuration === "1" && it.durationDays !== 1) return false;
        if (activeDuration === "2-3" && (it.durationDays < 2 || it.durationDays > 3)) return false;
        if (activeDuration === "4-7" && (it.durationDays < 4 || it.durationDays > 7)) return false;
        if (activeDuration === "7+" && it.durationDays <= 7) return false;
      }
      return true;
    });
  }, [allItems, search, activeCity, activeState, activeDuration]);

  const filterSections: FilterSection[] = [
    {
      key: "location",
      label: "Localização",
      icon: "map-pin",
      type: "location",
      cityOptions,
      stateOptions,
      activeCity,
      activeState,
      onChangeCity: (v) => {
        setActiveCity(v);
        if (v) gtmFilterApplied("cidade", v.split(",")[0], "roteiros");
      },
      onChangeState: (v) => {
        setActiveState(v);
        if (v) gtmFilterApplied("estado", v, "roteiros");
      },
    },
    {
      key: "duration",
      label: "Duração",
      icon: "clock",
      type: "single",
      value: activeDuration,
      onChange: (v) => {
        setActiveDuration(v);
        if (v) {
          const labels: Record<string, string> = { "1": "1 dia", "2-3": "2–3 dias", "4-7": "4–7 dias", "7+": "7+ dias" };
          gtmFilterApplied("duracao", labels[v] ?? v, "roteiros");
        }
      },
      options: [
        { value: "1", label: "1 dia" },
        { value: "2-3", label: "2–3 dias" },
        { value: "4-7", label: "4–7 dias" },
        { value: "7+", label: "7+ dias" },
      ],
    },
  ];

  const clearAllFilters = () => {
    setActiveCity(null);
    setActiveState(null);
    setActiveDuration(null);
  };

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
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar roteiros..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allItems.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="map" title="Nenhum roteiro encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        <AnimatePresence initial={false}>
          {visible.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <section className="bg-white">
                <div className="mx-auto w-full max-w-screen-md p-4">
                  <RoteiroListCard itinerary={it} />
                </div>
              </section>
              {i < visible.length - 1 && <SectionSpacer />}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  );
}
