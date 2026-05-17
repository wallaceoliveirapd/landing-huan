"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { SectionSpacer } from "./SectionSpacer";
import { EmptyState } from "./EmptyState";
import { ListingSearch } from "@/components/molecules/ListingSearch";
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
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

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
    {
      key: "city-picker",
      label: activeCity ? `Cidade: ${activeCity.split(",")[0]}` : "Cidade",
      active: !!activeCity,
      onToggle: () => setCityMenuOpen((v) => !v),
    },
    ...topFeatures.map((f) => ({
      key: `feat-${f}`,
      label: f,
      active: activeFeature === f,
      onToggle: () => { const next = activeFeature === f ? null : f; setActiveFeature(next); if (next) gtmFilterApplied("caracteristica", f, "praias"); },
    })),
  ];

  function pickCity(c: string | null) {
    setActiveCity(c);
    setCityMenuOpen(false);
    if (c) gtmFilterApplied("cidade", c.split(",")[0], "praias");
  }

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

      <AnimatePresence>
        {cityMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCityMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <h3 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
                  Filtrar por cidade
                </h3>
                <button
                  type="button"
                  onClick={() => setCityMenuOpen(false)}
                  aria-label="Fechar"
                  className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)]"
                >
                  <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 pt-2 pb-3 flex flex-col">
                <button
                  type="button"
                  onClick={() => pickCity(null)}
                  className={`flex items-center justify-between py-3 text-left border-b border-[var(--color-neutral-100)] last:border-0 ${
                    !activeCity ? "text-[var(--color-neutral-800)] font-medium" : "text-[var(--color-neutral-700)]"
                  }`}
                >
                  <span className="text-[14px]">Todas as cidades</span>
                  {!activeCity && <Icon name="check" size={16} />}
                </button>
                {cities.map((c) => {
                  const selected = activeCity === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCity(c)}
                      className={`flex items-center justify-between py-3 text-left border-b border-[var(--color-neutral-100)] last:border-0 ${
                        selected ? "text-[var(--color-neutral-800)] font-medium" : "text-[var(--color-neutral-700)]"
                      }`}
                    >
                      <span className="text-[14px]">{c}</span>
                      {selected && <Icon name="check" size={16} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
