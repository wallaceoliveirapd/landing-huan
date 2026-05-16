"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { getTourById, type Itinerary, type ItineraryStop } from "@/lib/mock-data";
import { PlaceCard } from "@/components/molecules/PlaceCard";
import { Icon } from "@/components/atoms/Icon";

/**
 * Versão compacta da timeline para renderizar dentro do chat do NordestAI.
 * Cada dia tem um carrossel horizontal de mini-cards (passeios + paradas livres).
 */
export function ChatTimeline({ itinerary }: { itinerary: Itinerary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full flex-col gap-4 rounded-2xl bg-white border-1 border-[var(--color-brand-purple)] p-3"
    >
      <Link
        href={`/roteiros/${itinerary.slug}`}
        className="flex items-center gap-2 text-[12px] font-display font-medium text-[var(--color-brand-purple)]"
      >
        <Icon name="lucide:map" size={14} /> Roteiro · {itinerary.durationDays}{" "}
        {itinerary.durationDays === 1 ? "dia" : "dias"}
        <Icon name="material-symbols:arrow-forward-rounded" size={14} className="ml-auto" />
      </Link>

      {itinerary.days.map((day, i) => {
        const isLast = i === itinerary.days.length - 1;
        return (
          <div key={day.day} className="flex gap-2 min-w-0">
            <div className="flex flex-col items-center pt-0.5">
              <span className="grid size-7 place-items-center rounded-full bg-[var(--color-brand-purple)] text-white font-display font-medium text-[12px] leading-none">
                {day.day}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className="mt-1 w-px flex-1 bg-[var(--color-brand-purple)]/30"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2 min-w-0 pb-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-brand-purple)]">
                  Dia {day.day}
                </span>
                <p className="font-display font-medium text-[13px] leading-[1.3] text-black">
                  {day.title}
                </p>
              </div>

              {day.stops.length > 0 && (
                <div className="no-scrollbar carousel-smooth flex items-stretch gap-2 overflow-x-auto -mr-3 pr-3">
                  {day.stops.map((stop, idx) => (
                    <CompactStop
                      key={`${itinerary.id}-${day.day}-${idx}`}
                      stop={stop}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function CompactStop({ stop }: { stop: ItineraryStop }) {
  if (stop.type === "place") {
    return (
      <PlaceCard
        name={stop.name}
        address={stop.address}
        time={stop.time}
        size="sm"
        className="snap-start"
      />
    );
  }
  const tour = getTourById(stop.tourId);
  if (!tour) return null;
  return (
    <a
      href={tour.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full w-[180px] flex-none flex-col overflow-hidden rounded-xl border border-black/10 bg-white snap-start"
    >
      <div className="relative h-[90px] w-full flex-none">
        <Image src={tour.image} alt={tour.title} fill sizes="180px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="font-display font-medium text-[11px] leading-[1.3] text-black line-clamp-2">
          {tour.title}
        </p>
        <span className="mt-auto text-[10px] text-[var(--color-neutral-600)]">
          {tour.duration} · ★ {tour.rating.toFixed(1).replace(".", ",")}
        </span>
      </div>
    </a>
  );
}
