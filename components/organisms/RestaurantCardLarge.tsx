"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { RatingLine } from "@/components/molecules/RatingLine";
import type { Restaurant } from "@/lib/mock-data";
import { toProxyUrl } from "@/lib/imageUpload";

export function RestaurantCardLarge({ restaurant }: { restaurant: Restaurant }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/restaurantes/${restaurant.slug}`}
        className="flex w-full flex-col gap-4 group"
      >
        <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
          <Image
            src={toProxyUrl(restaurant.image)}
            alt={restaurant.name}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <h3 className="font-display font-medium text-[18px] leading-[1.39] text-[var(--color-ink)]">
            {restaurant.name}
          </h3>
          <RatingLine value={restaurant.rating} label={restaurant.ratingLabel} />
          <p className="text-[13px] leading-[1.4] text-[var(--color-neutral-600)] line-clamp-1">
            {restaurant.address}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
