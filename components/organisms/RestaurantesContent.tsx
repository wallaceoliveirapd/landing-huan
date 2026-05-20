"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { RestaurantCardLarge } from "./RestaurantCardLarge";
import { SectionSpacer } from "./SectionSpacer";
import { ListingFilterBar } from "@/components/molecules/ListingFilterBar";
import type { FilterSection } from "@/components/molecules/ListingFiltersModal";
import { buildCityOptions, parseCity } from "@/lib/locationFilter";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { EmptyState } from "./EmptyState";
import type { Restaurant } from "@/lib/mock-data";

export function RestaurantesContent() {
  const convexRestaurants = useQuery(api.restaurants.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activePriceRange, setActivePriceRange] = useState<string | null>(null);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexRestaurants !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("restaurantes");
    }
  }, [convexRestaurants]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "restaurantes");
    }
  }, [search]);

  const allRestaurants = useMemo(
    () =>
      (convexRestaurants ?? []).map((r) => ({
        data: r,
        mapped: {
          id: r._id,
          slug: r.slug,
          name: r.name,
          image: r.image,
          rating: r.rating,
          ratingLabel: r.reviewCount >= 100 ? "Muito bom" : "Bom",
          openUntil: r.hours?.[0] ? `${r.hours[0].open}–${r.hours[0].close}` : undefined,
          address: r.address,
          instagram: r.instagram,
          phone: r.phone,
          hours: (r.hours ?? []).map((h) => ({
            weekday: h.day,
            hours: `${h.open} – ${h.close}` as string | "Fechado",
          })),
          photos: r.photos ?? [],
        } as Restaurant,
      })),
    [convexRestaurants],
  );

  const cityOptions = useMemo(
    () => buildCityOptions(allRestaurants.map((r) => r.data.city)),
    [allRestaurants],
  );
  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of cityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [cityOptions]);
  const cuisines = useMemo(
    () => [...new Set(allRestaurants.map((r) => r.data.cuisine).filter(Boolean))].sort(),
    [allRestaurants],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allRestaurants.filter(({ data }) => {
      if (q && !data.name.toLowerCase().includes(q) && !data.cuisine.toLowerCase().includes(q)) return false;
      if (activeCity) {
        const dc = parseCity(data.city ?? "");
        const ac = parseCity(activeCity);
        if (dc.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      } else if (activeState) {
        const dc = parseCity(data.city ?? "");
        if (dc.state !== activeState) return false;
      }
      if (activePriceRange && data.priceRange !== activePriceRange) return false;
      if (activeCuisine && data.cuisine !== activeCuisine) return false;
      return true;
    });
  }, [allRestaurants, search, activeCity, activeState, activePriceRange, activeCuisine]);

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
        if (v) gtmFilterApplied("cidade", v.split(",")[0], "restaurantes");
      },
      onChangeState: (v) => {
        setActiveState(v);
        if (v) gtmFilterApplied("estado", v, "restaurantes");
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
          const labels: Record<string, string> = { "$": "$ Econômico", "$$": "$$ Moderado", "$$$": "$$$ Premium" };
          gtmFilterApplied("preco", labels[v] ?? v, "restaurantes");
        }
      },
      options: [
        { value: "$", label: "$ Econômico" },
        { value: "$$", label: "$$ Moderado" },
        { value: "$$$", label: "$$$ Premium" },
      ],
    },
    {
      key: "cuisine",
      label: "Culinária",
      icon: "chef-hat",
      type: "single",
      value: activeCuisine,
      onChange: (v) => {
        setActiveCuisine(v);
        if (v) gtmFilterApplied("culinaria", v, "restaurantes");
      },
      options: cuisines.map((c) => ({ value: c, label: c })),
    },
  ];

  const clearAllFilters = () => {
    setActiveCity(null);
    setActiveState(null);
    setActivePriceRange(null);
    setActiveCuisine(null);
  };

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexRestaurants === undefined) {
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

  return (
    <div className="pb-20">
      <ListingFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar restaurantes..."
        filterSections={filterSections}
        onClearAll={clearAllFilters}
        resultCount={filtered.length}
        totalCount={allRestaurants.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="utensils" title="Nenhum restaurante encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        <AnimatePresence initial={false}>
          {visible.map(({ mapped }, i) => (
            <motion.div
              key={mapped.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <section className="bg-white">
                <div className="mx-auto w-full max-w-screen-md p-4">
                  <RestaurantCardLarge restaurant={mapped} />
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
