"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Pill outline full-width que aparece no fim das seções "Ofertas",
 * "Restaurantes" e "Dicas" (Figma 324:27562).
 */
export function ViewAllButton({
  href,
  label = "Ver todos",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={href}
        className={cn(
          "inline-flex w-full items-center justify-center rounded-pill border border-[var(--color-ink)] px-6 py-3 font-display font-medium text-[16px] leading-[1.1] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-neutral-100)]",
          className,
        )}
      >
        {label}
      </Link>
    </motion.div>
  );
}
