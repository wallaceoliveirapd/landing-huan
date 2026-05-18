"use client";

import { SkeletonImage } from "@/components/atoms/SkeletonImage";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/atoms/Icon";
import { FavoriteButton } from "@/components/atoms/FavoriteButton";
import type { Tour } from "@/lib/mock-data";
import { toProxyUrl } from "@/lib/imageUpload";
import { formatBRL } from "@/lib/format";

/**
 * Offer Card, matches Figma node 334:36370.
 *
 *   Card outer:  317 × 213 px, rounded-[24px], padding 6px
 *   Background image: full bleed (absolute inset 0)
 *   Heart pill (top-right): white rounded-full p-3
 *   Footer info: white rounded-[19px], px-4 py-2, title + price/rating
 */
export function OfferCard({ tour, className, onSelect }: { tour: Tour; className?: string; onSelect?: () => void }) {
  const MotionLink = motion(Link);
  return (
    <MotionLink
      href={`/passeios/${tour.slug}`}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "relative flex-none overflow-hidden rounded-[24px] bg-[var(--color-neutral-200)]",
        "w-[min(85vw,317px)] aspect-[317/213]",
        className,
      )}
    >
      {/* Full-bleed image */}
      <SkeletonImage
        src={toProxyUrl(tour.image)}
        alt={tour.title}
        fill
        sizes="317px"
        className="object-cover"
      />

      {/* Foreground stack, heart on top, info pinned to bottom */}
      <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
        <div className="flex w-full justify-end">
          <div className="bg-white rounded-full p-3">
            <FavoriteButton itemId={String(tour.id)} kind="tour" size={24} gtmName={tour.title} />
          </div>
        </div>

        <div className="bg-white rounded-[19px] px-4 py-2 flex flex-col gap-2">
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] line-clamp-1">
            {tour.title}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              {tour.discountPct && (
                <span
                  className="text-white text-[10px] font-medium leading-[1.2] rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "#028574" }}
                >
                  {tour.discountPct}% off
                </span>
              )}
              {tour.priceFrom && (
                <span className="text-[12px] text-[var(--color-neutral-600)] line-through">
                  {formatBRL(tour.priceFrom)}
                </span>
              )}
              <span className="font-display font-medium text-[16px] leading-[1.3] text-[var(--color-neutral-800)]">
                {formatBRL(tour.price)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon
                name="star"
                size={14}
                className="text-[var(--color-neutral-800)] fill-[var(--color-neutral-800)]"
              />
              <span className="font-display font-medium text-[12px] leading-[1.2] text-[var(--color-neutral-800)]">
                {tour.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
              </span>
              <span className="text-[14px] text-[var(--color-neutral-600)] leading-[1.2]">•</span>
              <span className="text-[12px] text-[var(--color-neutral-600)] leading-[1.2]">Passeios</span>
            </div>
          </div>
        </div>
      </div>
    </MotionLink>
  );
}
