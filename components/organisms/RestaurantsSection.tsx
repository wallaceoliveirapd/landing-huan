"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { RestaurantCard } from "./RestaurantCard";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { gtmSelectItem } from "@/lib/gtm";
import type { Restaurant } from "@/lib/mock-data";

export function RestaurantsSection() {
  const convexRestaurants = useQuery(api.restaurants.list, { activeOnly: true });

  const restaurants: Restaurant[] = (convexRestaurants ?? []).map((r) => ({
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
  }));

  if (restaurants.length === 0) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerChildren(0.08, 0)}
      className="w-full bg-white"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 py-8">
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pb-6">
          <h2 className="font-display font-medium text-[24px] leading-tight text-[var(--color-neutral-800)]">
            Principais restaurantes
          </h2>
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Top lugares para comer no Nordeste
          </p>
        </motion.div>

        <HorizontalCarousel>
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              onSelect={() =>
                gtmSelectItem({
                  item_type: "restaurante",
                  item_id: String(r.id),
                  item_name: r.name,
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
