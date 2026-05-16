"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OfferCardLarge } from "./OfferCardLarge";
import { SectionSpacer } from "./SectionSpacer";
import { DiscountBanner } from "@/components/molecules/DiscountBanner";
import { ListingSearch } from "@/components/molecules/ListingSearch";
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

  const cities = useMemo(
    () => [...new Set(allTours.map((t) => t.city).filter(Boolean) as string[])].sort(),
    [allTours],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allTours.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (activeCity && t.city !== activeCity) return false;
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
  }, [allTours, search, activeCity, activePriceRange, activeDuration]);

  const chips = [
    { key: "ate150", label: "Até R$150", active: activePriceRange === "ate150", onToggle: () => { const next = activePriceRange === "ate150" ? null : "ate150"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "Até R$150", "passeios"); } },
    { key: "150-300", label: "R$150–300", active: activePriceRange === "150-300", onToggle: () => { const next = activePriceRange === "150-300" ? null : "150-300"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "R$150–300", "passeios"); } },
    { key: "acima300", label: "Acima R$300", active: activePriceRange === "acima300", onToggle: () => { const next = activePriceRange === "acima300" ? null : "acima300"; setActivePriceRange(next); if (next) gtmFilterApplied("preco", "Acima R$300", "passeios"); } },
    { key: "curto", label: "Até 3h", active: activeDuration === "curto", onToggle: () => { const next = activeDuration === "curto" ? null : "curto"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "Até 3h", "passeios"); } },
    { key: "meio", label: "Meio período", active: activeDuration === "meio", onToggle: () => { const next = activeDuration === "meio" ? null : "meio"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "Meio período", "passeios"); } },
    { key: "dia", label: "Dia inteiro", active: activeDuration === "dia", onToggle: () => { const next = activeDuration === "dia" ? null : "dia"; setActiveDuration(next); if (next) gtmFilterApplied("duracao", "Dia inteiro", "passeios"); } },
    ...cities.map((c) => ({
      key: `city-${c}`,
      label: c.split(",")[0],
      active: activeCity === c,
      onToggle: () => { const next = activeCity === c ? null : c; setActiveCity(next); if (next) gtmFilterApplied("cidade", c.split(",")[0], "passeios"); },
    })),
  ];

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
      <ListingSearch
        search={search}
        onSearch={setSearch}
        placeholder="Buscar passeios..."
        chips={chips}
        resultCount={filtered.length}
        totalCount={allTours.length}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="map-pin" title="Nenhum passeio encontrado" description="Tente outros filtros ou limpe a busca." />
      ) : (
        <>
          {filtered.map((t, i) => (
            <div key={t.id}>
              <section className="bg-white">
                <div className="mx-auto w-full max-w-screen-md p-4">
                  <OfferCardLarge tour={t} />
                </div>
              </section>
              {i < filtered.length - 1 && <SectionSpacer />}
            </div>
          ))}
          <SectionSpacer />
          <section className="bg-white">
            <div className="mx-auto w-full max-w-screen-md p-4">
              <DiscountBanner
                headline={couponHeadline ?? SITE_CONTENT.coupon.headline}
                rest={couponRest ?? SITE_CONTENT.coupon.rest}
                code={couponCode ?? SITE_CONTENT.coupon.code}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
