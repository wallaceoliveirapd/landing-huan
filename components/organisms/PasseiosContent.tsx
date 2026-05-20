"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/convex/_generated/api";
import { OfferCardLarge } from "./OfferCardLarge";
import { SectionSpacer } from "./SectionSpacer";
import { DiscountBanner } from "@/components/molecules/DiscountBanner";
import { ListingFilterBar } from "@/components/molecules/ListingFilterBar";
import type { FilterSection } from "@/components/molecules/ListingFiltersModal";
import { buildCityOptions, parseCity } from "@/lib/locationFilter";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { EmptyState } from "./EmptyState";
import { SITE_CONTENT } from "@/lib/mock-data";
import type { Tour } from "@/lib/mock-data";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";

export function PasseiosContent() {
  const convexTours = useQuery(api.tours.list, { activeOnly: true });
  const couponHeadline = useQuery(api.siteContent.get, { key: "coupon.headline" });
  const couponRest = useQuery(api.siteContent.get, { key: "coupon.rest" });
  const couponCode = useQuery(api.siteContent.get, { key: "coupon.code" });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activePriceRange, setActivePriceRange] = useState<string | null>(null);
  const [activeDuration, setActiveDuration] = useState<string | null>(null);

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexTours !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("passeios");
    }
  }, [convexTours]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "passeios");
    }
  }, [search]);

  const allTours: (Tour & { city?: string })[] = useMemo(
    () =>
      (convexTours ?? []).map((t) => ({
        id: t._id,
        slug: t.slug,
        title: t.title,
        image: t.image,
        rating: t.rating,
        reviewCount: t.reviewCount,
        ratingLabel: t.reviewCount >= 200 ? "Excelente" : t.reviewCount >= 100 ? "Muito bom" : "Bom",
        duration: t.duration,
        price: t.price,
        priceFrom: t.originalPrice,
        discountPct: t.originalPrice ? Math.round((1 - t.price / t.originalPrice) * 100) : undefined,
        url: t.url,
        tags: t.tags,
        city: t.city,
        description: t.description,
        shortDesc: t.shortDesc,
      })),
    [convexTours],
  );

  const cityOptions = useMemo(
    () => buildCityOptions(allTours.map((t) => t.city)),
    [allTours],
  );
  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [cityOptions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allTours.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (activeCity) {
        const pc = parseCity(t.city ?? "");
        const ac = parseCity(activeCity);
        if (pc.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      } else if (activeState) {
        const pc = parseCity(t.city ?? "");
        if (pc.state !== activeState) return false;
      }
      if (activePriceRange) {
        if (activePriceRange === "ate150" && t.price > 150) return false;
        if (activePriceRange === "150-300" && (t.price < 150 || t.price > 300)) return false;
        if (activePriceRange === "acima300" && t.price < 300) return false;
      }
      if (activeDuration) {
        const dur = t.duration?.toLowerCase() ?? "";
        if (activeDuration === "curto" && !["1 hora", "2 hora", "3 hora"].some((d) => dur.includes(d))) return false;
        if (activeDuration === "meio" && !["4", "5", "6"].some((d) => dur.includes(d))) return false;
        if (activeDuration === "dia" && !dur.includes("dia")) return false;
      }
      return true;
    });
  }, [allTours, search, activeCity, activeState, activePriceRange, activeDuration]);

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
        if (v) gtmFilterApplied("cidade", v.split(",")[0], "passeios");
      },
      onChangeState: (v) => {
        setActiveState(v);
        if (v) gtmFilterApplied("estado", v, "passeios");
      },
    },
    {
      key: "price",
      label: "Faixa de preço",
      icon: "tag",
      type: "single",
      value: activePriceRange,
      onChange: (v) => {
        setActivePriceRange(v);
        if (v) {
          const labels: Record<string, string> = { ate150: "Até R$150", "150-300": "R$150–300", acima300: "Acima R$300" };
          gtmFilterApplied("preco", labels[v] ?? v, "passeios");
        }
      },
      options: [
        { value: "ate150", label: "Até R$150" },
        { value: "150-300", label: "R$150–300" },
        { value: "acima300", label: "Acima R$300" },
      ],
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
          const labels: Record<string, string> = { curto: "Até 3h", meio: "Meio período", dia: "Dia inteiro" };
          gtmFilterApplied("duracao", labels[v] ?? v, "passeios");
        }
      },
      options: [
        { value: "curto", label: "Até 3h" },
        { value: "meio", label: "Meio período" },
        { value: "dia", label: "Dia inteiro" },
      ],
    },
  ];

  const clearAllFilters = () => {
    setActiveCity(null);
    setActiveState(null);
    setActivePriceRange(null);
    setActiveDuration(null);
  };

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexTours === undefined) {
    return (
      <div className="pb-20">
        <div className="h-20 bg-white border-b border-[var(--color-neutral-100)]" />
        <section className="bg-white">
          <div className="mx-auto w-full max-w-screen-md p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[220px] rounded-card bg-[var(--color-neutral-100)] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar passeios..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allTours.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="map-pin" title="Nenhum passeio encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        <>
          <AnimatePresence initial={false}>
            {visible.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <section className="bg-white">
                  <div className="mx-auto w-full max-w-screen-md p-4">
                    <OfferCardLarge tour={t} />
                  </div>
                </section>
                {i < visible.length - 1 && <SectionSpacer />}
              </motion.div>
            ))}
          </AnimatePresence>
          <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
        </>
      )}
    </div>
  );
}
