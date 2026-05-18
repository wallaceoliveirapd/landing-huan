"use client";

import { SkeletonImage } from "@/components/atoms/SkeletonImage";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import type { Itinerary } from "@/lib/mock-data";

export function RoteiroListCard({ itinerary }: { itinerary: Itinerary }) {
  const stopsCount = itinerary.days.reduce((acc, d) => acc + d.stops.length, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/roteiros/${itinerary.slug}`}
        className="flex w-full flex-col gap-4 group"
      >
        <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
          <SkeletonImage
            src={itinerary.cover}
            alt={itinerary.title}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-pill bg-[var(--color-brand-yellow)] px-3 py-1 text-[12px] font-display font-medium text-black">
            <Icon name="lucide:map" size={14} /> {itinerary.durationDays}{" "}
            {itinerary.durationDays === 1 ? "dia" : "dias"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display font-medium text-[20px] sm:text-[22px] leading-[1.25] text-[var(--color-ink)]">
            {itinerary.title}
          </h3>
          <p className="text-[14px] leading-[1.5] text-[var(--color-neutral-600)]">
            {itinerary.subtitle}
          </p>
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-brand-purple)]">
            <Icon name="ph:sparkle-fill" size={14} />
            {stopsCount} {stopsCount === 1 ? "parada" : "paradas"} curadas
            <Icon name="material-symbols:arrow-forward-rounded" size={14} className="ml-auto sm:ml-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
