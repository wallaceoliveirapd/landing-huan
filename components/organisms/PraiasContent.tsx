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
import { ListingSearch } from "@/components/molecules/ListingSearch";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

export function PraiasContent() {
  const convexPraias = useQuery(api.praias.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const allPraias = useMemo(() => convexPraias ?? [], [convexPraias]);

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

  const cities = useMemo(
    () => [...new Set(allPraias.map((p) => p.city).filter(Boolean) as string[])].sort(),
    [allPraias],
  );

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
      if (activeCity && p.city !== activeCity) return false;
      if (activeFeature && !(p.features ?? []).includes(activeFeature)) return false;
      return true;
    });
  }, [allPraias, search, activeCity, activeFeature]);

  const chips = [
    ...topFeatures.map((f) => ({
      key: `feat-${f}`,
      label: f,
      active: activeFeature === f,
      onToggle: () => { const next = activeFeature === f ? null : f; setActiveFeature(next); if (next) gtmFilterApplied("caracteristica", f, "praias"); },
    })),
    ...cities.map((c) => ({
      key: `city-${c}`,
      label: c.split(",")[0],
      active: activeCity === c,
      onToggle: () => { const next = activeCity === c ? null : c; setActiveCity(next); if (next) gtmFilterApplied("cidade", c.split(",")[0], "praias"); },
    })),
  ];

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
      <ListingSearch
        search={search}
        onSearch={setSearch}
        placeholder="Buscar praias..."
        chips={chips}
        resultCount={filtered.length}
        totalCount={allPraias.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="waves" title="Nenhuma praia encontrada" description="Tente outros filtros ou limpe a busca." />
      ) : (
        filtered.map((p, i) => (
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
                      {p.city && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)] flex items-center gap-1">
                          <Icon name="map-pin" size={11} />
                          {p.city.split(",")[0]}
                        </div>
                      )}
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
            {i < filtered.length - 1 && <SectionSpacer />}
          </div>
        ))
      )}
    </div>
  );
}
