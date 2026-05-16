"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/atoms/Icon";
import { FavoriteButton } from "@/components/atoms/FavoriteButton";
import type { Restaurant } from "@/lib/mock-data";
import { toProxyUrl } from "@/lib/imageUpload";

/**
 * Restaurant card — matches Figma node 334:36332.
 *
 *   Card: 245px wide, gap-[8px]
 *   Image: w-full × 164px, rounded-[24px], heart pill 48×48 top-right
 *   Below image: rating row + name (no border, just text)
 */
export function RestaurantCard({
  restaurant,
  className,
  onSelect,
}: {
  restaurant: Restaurant;
  className?: string;
  onSelect?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "flex flex-col flex-none gap-2 w-[min(70vw,245px)]",
        className,
      )}
    >
      <Link
        href={`/restaurantes/${restaurant.slug}`}
        className="flex flex-col gap-2"
        onClick={onSelect}
      >
        <div className="relative aspect-[245/164] w-full overflow-hidden rounded-[24px]">
          <Image
            src={toProxyUrl(restaurant.image)}
            alt={restaurant.name}
            fill
            sizes="245px"
            className="object-cover"
          />
          {/* Favorite circle */}
          <div className="absolute right-2 top-2 bg-white rounded-full size-12 grid place-items-center">
            <FavoriteButton itemId={String(restaurant.id)} kind="restaurant" size={24} gtmName={restaurant.name} />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-1">
            <Icon
              name="star"
              size={14}
              className="text-[var(--color-neutral-800)] fill-[var(--color-neutral-800)]"
            />
            <span className="font-display font-medium text-[12px] leading-[1.2] text-[var(--color-neutral-800)]">
              {restaurant.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
            </span>
            <span className="text-[14px] text-[var(--color-neutral-600)] leading-[1.2]">•</span>
            <span className="text-[12px] text-[var(--color-neutral-600)] leading-[1.2]">
              Restaurantes
            </span>
          </div>
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] line-clamp-2">
            {restaurant.name}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
