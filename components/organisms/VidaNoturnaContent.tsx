"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { SectionSpacer } from "./SectionSpacer";
import { EmptyState } from "./EmptyState";
import { ListingFilterBar } from "@/components/molecules/ListingFilterBar";
import type { FilterSection } from "@/components/molecules/ListingFiltersModal";
import { buildCityOptions, parseCity } from "@/lib/locationFilter";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

const NIGHTLIFE_ICONS: Record<string, string> = {
  Bar: "beer",
  Balada: "music-2",
  "Show ao Vivo": "mic-2",
  Rooftop: "building-2",
  Pub: "glass-water",
};

export function VidaNoturnaContent() {
  const convexNightlife = useQuery(api.nightlife.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const allItems = useMemo(() => convexNightlife ?? [], [convexNightlife]);

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexNightlife !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("vida-noturna");
    }
  }, [convexNightlife]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "vida-noturna");
    }
  }, [search]);

  const cityOptions = useMemo(
    () => buildCityOptions(allItems.map((n) => n.city)),
    [allItems],
  );
  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [cityOptions]);
  const types = useMemo(
    () => [...new Set(allItems.map((n) => n.type).filter(Boolean))].sort(),
    [allItems],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allItems.filter((n) => {
      if (q && !n.name.toLowerCase().includes(q) && !(n.shortDesc ?? "").toLowerCase().includes(q)) return false;
      if (activeCity) {
        const nc = parseCity(n.city ?? "");
        const ac = parseCity(activeCity);
        if (nc.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      } else if (activeState) {
        const nc = parseCity(n.city ?? "");
        if (nc.state !== activeState) return false;
      }
      if (activeType && n.type !== activeType) return false;
      return true;
    });
  }, [allItems, search, activeCity, activeState, activeType]);

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
        if (v) gtmFilterApplied("cidade", v.split(",")[0], "vida-noturna");
      },
      onChangeState: (v) => {
        setActiveState(v);
        if (v) gtmFilterApplied("estado", v, "vida-noturna");
      },
    },
    {
      key: "type",
      label: "Tipo",
      icon: "music-2",
      type: "single",
      value: activeType,
      onChange: (v) => {
        setActiveType(v);
        if (v) gtmFilterApplied("tipo", v, "vida-noturna");
      },
      options: types.map((t) => ({ value: t, label: t })),
    },
  ];

  const clearAllFilters = () => {
    setActiveCity(null);
    setActiveState(null);
    setActiveType(null);
  };

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexNightlife === undefined) {
    return (
      <div className="pb-20">
        <div className="h-20 bg-white border-b border-[var(--color-neutral-100)]" />
        <section className="bg-white">
          <div className="mx-auto w-full max-w-screen-md p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[240px] rounded-card bg-[var(--color-neutral-100)] animate-pulse" />
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
          icon="martini"
          title="Em curadoria"
          description="Estamos cadastrando os bares e casas de show. Volte em breve!"
        />
      </section>
    );
  }

  return (
    <div className="pb-20">
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar vida noturna..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allItems.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="martini" title="Nenhum resultado encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        visible.map((n, i) => (
          <div key={n._id}>
            <section className="bg-white">
              <div className="mx-auto w-full max-w-screen-md p-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link href={`/vida-noturna/${n.slug}`} className="flex flex-col gap-4 group">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-card shadow-card">
                      <Image
                        src={toProxyUrl(n.image)}
                        alt={n.name}
                        fill
                        sizes="(min-width: 768px) 720px, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-white flex items-center gap-1">
                        <Icon name={NIGHTLIFE_ICONS[n.type] ?? "music-2"} size={11} />
                        {n.type}
                      </div>
                      {n.city && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)] flex items-center gap-1">
                          <Icon name="map-pin" size={11} />
                          {n.city.split(",")[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] group-hover:underline">
                        {n.name}
                      </h3>
                      <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed line-clamp-2">
                        {n.shortDesc}
                      </p>
                      {n.address && (
                        <p className="text-[12px] text-[var(--color-neutral-500)] flex items-center gap-1 mt-1">
                          <Icon name="map-pin" size={12} />
                          {n.address}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
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
