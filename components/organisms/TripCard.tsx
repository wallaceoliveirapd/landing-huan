"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";

/**
 * Trip card for /perfil horizontal carousel.
 * Full-bleed gradient background + bell icon top-right
 * + white pill bottom info card (title, destination, countdown).
 *
 * Width matches OfferCard: min(80vw, 280px). Aspect 4:5 for a taller feel.
 */

const TYPE_GRADIENTS: Record<string, string> = {
  praia:       "from-[#0ea5e9] via-[#38bdf8] to-[#7dd3fc]",
  historica:   "from-[#92400e] via-[#b45309] to-[#d97706]",
  natureza:    "from-[#15803d] via-[#16a34a] to-[#4ade80]",
  aventura:    "from-[#c2410c] via-[#ea580c] to-[#fb923c]",
  gastronomia: "from-[#be123c] via-[#e11d48] to-[#fb7185]",
  festa:       "from-[#6d28d9] via-[#7c3aed] to-[#a78bfa]",
  roadtrip:    "from-[#854d0e] via-[#a16207] to-[#ca8a04]",
  familia:     "from-[#0f766e] via-[#0d9488] to-[#2dd4bf]",
  solo:        "from-[#334155] via-[#475569] to-[#94a3b8]",
  cultural:    "from-[#3730a3] via-[#4338ca] to-[#818cf8]",
};

const DEFAULT_GRADIENT = "from-[#323439] via-[#565a60] to-[#94989e]";

const STATUS_LABELS: Record<string, string> = {
  planejando:  "Planejando",
  confirmada:  "Confirmada",
  realizada:   "Realizada",
};

const STATUS_COLORS: Record<string, string> = {
  planejando:  "bg-[var(--color-brand-yellow)] text-black",
  confirmada:  "bg-[var(--color-success-green)] text-white",
  realizada:   "bg-[var(--color-neutral-600)] text-white",
};

function getCountdown(startDate?: number, duration?: number): string {
  if (!startDate) return STATUS_LABELS["planejando"] ?? "Planejando";
  const now = Date.now();
  const diffMs = startDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1)  return `Em ${diffDays} dias`;
  if (diffDays === 1) return "Amanhã!";
  if (diffDays === 0) return "Hoje! 🎉";

  // Past — maybe still in duration
  const tripEnd = duration ? startDate + duration * 24 * 60 * 60 * 1000 : startDate;
  if (now <= tripEnd) return "Em andamento";

  return "Realizada";
}

interface Trip {
  _id: string;
  title: string;
  destination: string;
  type: string;
  status: string;
  startDate?: number;
  duration?: number;
}

export function TripCard({ trip, className }: { trip: Trip; className?: string }) {
  const gradient = TYPE_GRADIENTS[trip.type] ?? DEFAULT_GRADIENT;
  const countdown = getCountdown(trip.startDate, trip.duration);
  const statusColor = STATUS_COLORS[trip.status] ?? STATUS_COLORS.planejando;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "relative flex-none overflow-hidden rounded-[24px]",
        "w-[min(80vw,280px)]",
        className,
      )}
      style={{ aspectRatio: "4/5" }}
    >
      <Link href={`/minha-viagem/${trip._id}`} className="absolute inset-0 flex flex-col">
        {/* Full-bleed gradient background */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />

        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Content layer */}
        <div className="relative flex-1 flex flex-col justify-between p-3">
          {/* Top-right: bell icon pill */}
          <div className="flex justify-end">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-sm">
              <Icon
                name={trip.status === "planejando" ? "bell" : trip.status === "confirmada" ? "plane" : "check"}
                size={18}
                className="text-[var(--color-neutral-800)]"
              />
            </div>
          </div>

          {/* Bottom: white info card */}
          <div className="bg-white rounded-[18px] px-3 py-3 flex flex-col gap-2">
            {/* Status pill + countdown */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full leading-[1.3]",
                  statusColor,
                )}
              >
                {STATUS_LABELS[trip.status] ?? trip.status}
              </span>
              <span className="text-[11px] font-medium text-[var(--color-neutral-600)]">
                {countdown}
              </span>
            </div>

            {/* Title + destination */}
            <div>
              <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] line-clamp-1">
                {trip.title}
              </p>
              <p className="text-[12px] text-[var(--color-neutral-600)] truncate mt-0.5">
                {trip.destination}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Skeleton placeholder for loading state */
export function TripCardSkeleton() {
  return (
    <div
      className="relative flex-none overflow-hidden rounded-[24px] bg-[var(--color-neutral-100)] animate-pulse w-[min(80vw,280px)]"
      style={{ aspectRatio: "4/5" }}
    />
  );
}
