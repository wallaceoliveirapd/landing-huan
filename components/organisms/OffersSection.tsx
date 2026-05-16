"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { OfferCard } from "./OfferCard";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { gtmSelectItem } from "@/lib/gtm";
import type { Tour } from "@/lib/mock-data";

function ratingLabel(reviewCount: number): string {
  if (reviewCount >= 200) return "Excelente";
  if (reviewCount >= 100) return "Muito bom";
  if (reviewCount >= 50) return "Bom";
  return "Novidade";
}

export function OffersSection() {
  const convexTours = useQuery(api.tours.list, { activeOnly: true });

  const tours: Tour[] = (convexTours ?? []).map((t) => ({
    id: t._id,
    title: t.title,
    image: t.image,
    rating: t.rating,
    ratingLabel: ratingLabel(t.reviewCount),
    duration: t.duration,
    price: t.price,
    priceFrom: t.originalPrice,
    discountPct: t.originalPrice
      ? Math.round((1 - t.price / t.originalPrice) * 100)
      : undefined,
    url: t.url,
    tags: t.tags,
  }));

  if (tours.length === 0) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerChildren(0.08, 0)}
      className="w-full bg-white"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 pt-4 pb-8">
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pb-6">
          <h2 className="font-display font-medium text-[24px] leading-tight text-[var(--color-neutral-800)]">
            Passeios em ofertas
          </h2>
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Top ofertas de passeios pelo Nordeste
          </p>
        </motion.div>

        <HorizontalCarousel>
          {tours.map((t, i) => (
            <OfferCard
              key={t.id}
              tour={t}
              onSelect={() =>
                gtmSelectItem({
                  item_type: "passeio",
                  item_id: String(t.id),
                  item_name: t.title,
                  item_city: null,
                  list_name: "home",
                })
              }
            />
          ))}
        </HorizontalCarousel>
      </div>
    </motion.section>
  );
}
