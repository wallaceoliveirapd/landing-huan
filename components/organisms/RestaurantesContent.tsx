"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { RestaurantCardLarge } from "./RestaurantCardLarge";
import { SectionSpacer } from "./SectionSpacer";
import { ListingSearch } from "@/components/molecules/ListingSearch";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { EmptyState } from "./EmptyState";
import type { Restaurant } from "@/lib/mock-data";

export function RestaurantesContent() {
  const convexRestaurants = useQuery(api.restaurants.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
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

  const cities = useMemo(
    () => [...new Set(allRestaurants.map((r) => r.data.city).filter(Boolean) as string[])].sort(),
    [allRestaurants],
  );
  const cuisines = useMemo(
    () => [...new Set(allRestaurants.map((r) => r.data.cuisine).filter(Boolean))].sort(),
    [allRestaurants],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allRestaurants.filter(({ data }) => {
      if (q && !data.name.toLowerCase().includes(q) && !data.cuisine.toLowerCase().includes(q)) return false;
      if (activeCity && data.city !== activeCity) return false;
      if (activePriceRange && data.priceRange !== activePriceRange) return false;
      if (activeCuisine && data.cuisine !== activeCuisine) return false;
      return true;
    });
  }, [allRestaurants, search, activeCity, activePriceRange, activeCuisine]);

  const chips = [
    { key: "$", label: "$ Econômico", active: activePriceRange === "$", onToggle: () => { const next = activePriceRange === "$" ? null : "$"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "$ Econômico", "restaurantes"); } },
    { key: "$$", label: "$$ Moderado", active: activePriceRange === "$$", onToggle: () => { const next = activePriceRange === "$$" ? null : "$$"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "$$ Moderado", "restaurantes"); } },
    { key: "$$$", label: "$$$ Premium", active: activePriceRange === "$$$", onToggle: () => { const next = activePriceRange === "$$$" ? null : "$$$"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "$$$ Premium", "restaurantes"); } },
    ...cuisines.map((c) => ({
      key: `cuisine-${c}`,
      label: c,
      active: activeCuisine === c,
      onToggle: () => { const next = activeCuisine === c ? null : c; setActiveCuisine(next); if (next) gtmFilterApplied("culinaria", c, "restaurantes"); },
    })),
    ...cities.map((c) => ({
      key: `city-${c}`,
      label: c.split(",")[0],
      active: activeCity === c,
      onToggle: () => { const next = activeCity === c ? null : c; setActiveCity(next); if (next) gtmFilterApplied("cidade", c.split(",")[0], "restaurantes"); },
    })),
  ];

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
      <ListingSearch
        search={search}
        onSearch={setSearch}
        placeholder="Buscar restaurantes..."
        chips={chips}
        resultCount={filtered.length}
        totalCount={allRestaurants.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="utensils" title="Nenhum restaurante encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        visible.map(({ mapped }, i) => (
          <div key={mapped.id}>
            <section className="bg-white">
              <div className="mx-auto w-full max-w-screen-md p-4">
                <RestaurantCardLarge restaurant={mapped} />
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
