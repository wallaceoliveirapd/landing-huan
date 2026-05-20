"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { DicaCardLarge } from "./DicaCardLarge";
import { SectionSpacer } from "./SectionSpacer";
import { ListingFilterBar } from "@/components/molecules/ListingFilterBar";
import type { FilterSection } from "@/components/molecules/ListingFiltersModal";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { EmptyState } from "./EmptyState";
import type { Dica } from "@/lib/mock-data";

const CATEGORY_LABELS: Record<string, string> = {
  dica: "Dica geral",
  "joao-pessoa": "João Pessoa",
  curiosidade: "Curiosidade",
  gastronomia: "Gastronomia",
  praias: "Praias",
};

export function DicasContent() {
  const convexDicas = useQuery(api.dicas.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexDicas !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("dicas");
    }
  }, [convexDicas]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "dicas");
    }
  }, [search]);

  const allDicas: (Dica & { rawCategory: string })[] = useMemo(
    () =>
      (convexDicas ?? []).map((d) => ({
        id: d._id,
        slug: d.slug,
        title: d.title,
        cover: d.cover,
        excerpt: d.excerpt,
        tipo: (d.category as Dica["tipo"]) ?? "Geral",
        publishedAt: new Date(d.publishedAt).toISOString().split("T")[0],
        rawCategory: d.category,
      })),
    [convexDicas],
  );

  const categories = useMemo(
    () => [...new Set(allDicas.map((d) => d.rawCategory).filter(Boolean))],
    [allDicas],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allDicas.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q) && !d.excerpt.toLowerCase().includes(q)) return false;
      if (activeCategory && d.rawCategory !== activeCategory) return false;
      return true;
    });
  }, [allDicas, search, activeCategory]);

  const filterSections: FilterSection[] = [
    {
      key: "category",
      label: "Categoria",
      icon: "lightbulb",
      type: "single",
      value: activeCategory,
      onChange: (v) => {
        setActiveCategory(v);
        if (v) gtmFilterApplied("categoria", CATEGORY_LABELS[v] ?? v, "dicas");
      },
      options: categories.map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c })),
    },
  ];

  const clearAllFilters = () => setActiveCategory(null);

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexDicas === undefined) {
    return (
      <div className="pb-28">
        <div className="h-20 bg-white border-b border-[var(--color-neutral-100)]" />
        <section className="bg-white">
          <div className="mx-auto w-full max-w-screen-md p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[200px] rounded-card bg-[var(--color-neutral-100)] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar dicas..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allDicas.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="lightbulb" title="Nenhuma dica encontrada" description="Tente outros filtros ou limpe a busca." />
      ) : (
        <AnimatePresence initial={false}>
          {visible.map((d, i) => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <section className="bg-white">
                <div className="mx-auto w-full max-w-screen-md p-4">
                  <DicaCardLarge dica={d} />
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
