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

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PraiasContent() {
  const convexPraias = useQuery(api.praias.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Random order, stable per session (re-shuffles only when DB list size
  // changes). useState lazy init runs once at mount.
  const allPraias = useMemo(
    () => shuffle(convexPraias ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convexPraias?.length],
  );

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexPraias !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("praias");
    }
  }, [convexPraias]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "praias");
    }
  }, [search]);

  const cityOptions = useMemo(
    () => buildCityOptions(allPraias.map((p) => p.city)),
    [allPraias],
  );
  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [cityOptions]);

  // Top recurring features across all praias
  const topFeatures = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const p of allPraias) for (const f of (p.features ?? [])) freq[f] = (freq[f] ?? 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f]) => f);
  }, [allPraias]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allPraias.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false;
      if (activeCity) {
        const pc = parseCity(p.city ?? "");
        const ac = parseCity(activeCity);
        if (pc.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      }
      if (activeState) {
        const { state } = parseCity(p.city ?? "");
        if (state !== activeState) return false;
      }
      if (activeFeature && !(p.features ?? []).includes(activeFeature)) return false;
      return true;
    });
  }, [allPraias, search, activeCity, activeState, activeFeature]);

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
        if (v) gtmFilterApplied("cidade", v.split(",")[0], "praias");
      },
      onChangeState: (v) => {
        setActiveState(v);
        if (v) gtmFilterApplied("estado", v, "praias");
      },
    },
    {
      key: "feature",
      label: "Características",
      icon: "sparkles",
      type: "single",
      value: activeFeature,
      onChange: (v) => {
        setActiveFeature(v);
        if (v) gtmFilterApplied("caracteristica", v, "praias");
      },
      options: topFeatures.map((f) => ({ value: f, label: f })),
    },
  ];

  const clearAllFilters = () => {
    setActiveCity(null);
    setActiveState(null);
    setActiveFeature(null);
  };

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexPraias === undefined) {
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

  if (allPraias.length === 0) {
    return (
      <section className="bg-white">
        <EmptyState
          icon="waves"
          title="Estamos finalizando esse guia"
          description="O conteúdo de cada praia será cadastrado em breve."
        />
      </section>
    );
  }

  return (
    <div className="pb-20">
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar praias..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allPraias.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="waves" title="Nenhuma praia encontrada" description="Tente outros filtros ou limpe a busca." />
      ) : (
        visible.map((p, i) => (
          <div key={p._id}>
            <section className="bg-white">
              <div className="mx-auto w-full max-w-screen-md p-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link href={`/praias/${p.slug}`} className="flex flex-col gap-4 group">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
                      <Image
                        src={toProxyUrl(p.image)}
                        alt={p.name}
                        fill
                        sizes="(min-width: 768px) 720px, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {p.city && (() => {
                        const { name, state } = parseCity(p.city);
                        return (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)] flex items-center gap-1">
                            <Icon name="map-pin" size={11} />
                            {name}{state ? `, ${state}` : ""}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] group-hover:underline">
                        {p.name}
                      </h3>
                      <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed line-clamp-2">
                        {p.shortDesc}
                      </p>
                      {p.features && p.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {p.features.slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
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

