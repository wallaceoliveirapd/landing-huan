"use client";

import { motion } from "motion/react";
import { OfferCard } from "@/components/organisms/OfferCard";
import { HorizontalCarousel } from "@/components/organisms/HorizontalCarousel";
import { PlaceCard } from "@/components/molecules/PlaceCard";
import { getTourById, type Itinerary, type ItineraryStop } from "@/lib/mock-data";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

/**
 * Renderiza um roteiro em formato de timeline:
 * "Dia 1: título — descrição" → carrossel de cards do que fazer no dia.
 * Cards podem ser passeios cadastrados ou paradas livres sem imagem.
 */
export function RoteiroTimeline({ itinerary }: { itinerary: Itinerary }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerChildren(0.08, 0.05)}
      className="flex w-full flex-col gap-8"
    >
      {itinerary.days.map((day, i) => {
        const isLast = i === itinerary.days.length - 1;
        return (
          <motion.div
            key={day.day}
            variants={fadeUp}
            className="relative flex w-full gap-4"
          >
            <div className="flex flex-col items-center pt-1.5">
              <span className="grid size-9 place-items-center rounded-full bg-[var(--color-brand-purple)] text-white font-display font-medium text-[14px] leading-none">
                {day.day}
              </span>
              {!isLast && (
                <span
                  aria-hidden
                  className="mt-2 w-px flex-1 bg-gradient-to-b from-[var(--color-brand-purple)]/40 to-transparent"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 pb-2 min-w-0">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] uppercase tracking-wider font-medium text-[var(--color-brand-purple)]">
                  Dia {day.day}
                </span>
                <h3 className="font-display font-medium text-[20px] sm:text-[22px] leading-[1.25] text-[var(--color-ink)]">
                  {day.title}
                </h3>
                <p className="text-[14px] leading-[1.5] text-[var(--color-neutral-600)]">
                  {day.description}
                </p>
              </div>

              {day.stops.length > 0 && (
                <HorizontalCarousel bleedRight={false}>
                  {day.stops.map((stop, idx) => (
                    <StopCard
                      key={`${itinerary.id}-${day.day}-${idx}`}
                      stop={stop}
                    />
                  ))}
                </HorizontalCarousel>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function StopCard({ stop }: { stop: ItineraryStop }) {
  if (stop.type === "tour") {
    const tour = getTourById(stop.tourId);
    if (!tour) return null;
    return <OfferCard tour={tour} className="snap-start" />;
  }
  return (
    <PlaceCard
      name={stop.name}
      address={stop.address}
      description={stop.description}
      time={stop.time}
      className="snap-start"
      size="lg"
    />
  );
}
