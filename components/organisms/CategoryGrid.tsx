"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CategoryStackedCard } from "@/components/molecules/CategoryStackedCard";
import { CATEGORIES } from "@/lib/categories";
import { staggerFast, scaleIn } from "@/lib/motion-presets";

/**
 * Home category strip — driven by the DB (primary: true, active: true),
 * sorted by `order`. Falls back to the hardcoded CATEGORIES list for
 * metadata (label, href) when a DB key matches.
 *
 * If the DB has no primary categories yet (empty / loading), shows the
 * 3 hardcoded primary categories as a skeleton-ready fallback.
 */
export function CategoryGrid() {
  const dbCategories = useQuery(api.categories.list, { activeOnly: true });

  // Loading state — show skeleton placeholders
  if (dbCategories === undefined) {
    return (
      <div className="no-scrollbar -mx-6 flex w-[calc(100%+3rem)] items-start gap-4 overflow-x-auto px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-none flex flex-col items-center gap-2 animate-pulse"
          >
            <div className="w-[160px] h-[160px] rounded-[28px] bg-[var(--color-neutral-100)]" />
            <div className="h-3 w-16 rounded bg-[var(--color-neutral-100)]" />
          </div>
        ))}
      </div>
    );
  }

  // Primary categories from DB (active + primary), sorted by order
  const primary = dbCategories
    .filter((d) => d.primary)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  // If DB has no primary categories, fall back to hardcoded list
  const staticFallback = CATEGORIES.filter((c) => c.primary);
  const items =
    primary.length > 0
      ? primary.map((d) => ({
          key: d.key,
          label: d.label,
          href: d.href,
          mainImage: d.mainImage,
          backImages: d.backImages,
        }))
      : staticFallback.map((c) => ({
          key: c.key,
          label: c.label,
          href: c.href,
          mainImage: c.image ?? "",
          backImages: [],
        }));

  return (
    <motion.div
      className="no-scrollbar -mx-6 flex w-[calc(100%+3rem)] items-start gap-4 overflow-x-auto px-6"
      variants={staggerFast(0.0)}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.div key={item.key} variants={scaleIn} className="flex-none">
          <CategoryStackedCard
            label={item.label}
            mainImage={item.mainImage}
            backImages={item.backImages}
            href={item.href}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
