"use client";

import { SkeletonImage } from "@/components/atoms/SkeletonImage";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/atoms/Badge";
import { PriceTag } from "@/components/atoms/PriceTag";
import { RatingLine } from "@/components/molecules/RatingLine";
import type { Tour } from "@/lib/mock-data";
import { toProxyUrl } from "@/lib/imageUpload";

/**
 * Card "solto" para páginas internas (Figma 324:27646):
 * - Imagem com rounded-card e sombra leve
 * - Conteúdo (título, preço, tags) fora do retângulo, sem borda
 * - Cada card vive numa <section> própria com bg-white + p-6
 */
export function OfferCardLarge({ tour }: { tour: Tour }) {
  const MotionLink = motion(Link);
  return (
    <MotionLink
      href={`/passeios/${tour.slug}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex w-full flex-col gap-4 group"
    >
      <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
        <SkeletonImage
          src={toProxyUrl(tour.image)}
          alt={tour.title}
          fill
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col gap-3 w-full">
        <h3 className="font-display font-medium text-[18px] leading-[1.39] text-[var(--color-ink)]">
          {tour.title}
        </h3>
        <RatingLine
          value={tour.rating}
          label={tour.ratingLabel}
          meta={tour.duration}
        />
        <PriceTag value={tour.price} from={tour.priceFrom} />
        <div className="flex flex-wrap gap-1.5">
          {tour.discountPct && (
            <Badge tone="success">{tour.discountPct}% OFF</Badge>
          )}
          {tour.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>
    </MotionLink>
  );
}
