"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CategoryStackedCard } from "@/components/molecules/CategoryStackedCard";
import { useCategoriesSheet } from "@/components/providers/CategoriesSheetProvider";
import { CATEGORIES } from "@/lib/categories";
import { staggerFast, scaleIn } from "@/lib/motion-presets";

function VerTudoCard() {
  const { open } = useCategoriesSheet();

  return (
    <button
      type="button"
      onClick={open}
      className="flex flex-col items-center gap-2 select-none cursor-pointer"
    >
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="flex flex-col items-center gap-2"
      >
        {/* Same outer container as CategoryStackedCard */}
        <div className="relative" style={{ width: 124, height: 133.242 }}>
          {/* Back card #1, rotated +16.24° (right) */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 30.77, top: 22.1, width: 91.106, height: 103.683 }}
          >
            <div style={{ transform: "rotate(16.24deg)" }}>
              <div
                className="bg-[var(--color-neutral-200)]"
                style={{ width: 69.317, height: 87.801, borderRadius: 18.484 }}
              />
            </div>
          </div>

          {/* Back card #2, rotated -9.86° (left) */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: 1.54, top: 7.7, width: 84.362, height: 104.285 }}
          >
            <div style={{ transform: "rotate(-9.86deg)" }}>
              <div
                className="bg-[var(--color-neutral-200)]"
                style={{ width: 69.317, height: 93.796, borderRadius: 18.484 }}
              />
            </div>
          </div>

          {/* Front card */}
          <div
            className="absolute bg-[var(--color-neutral-100)] border-solid border-white flex items-center justify-center"
            style={{
              left: 22.34,
              top: 20.8,
              width: 77.019,
              height: 104.745,
              borderRadius: 18.484,
              borderWidth: 3,
              boxShadow: "0 9.242px 15.404px 0 rgba(84, 89, 98, 0.10)",
            }}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-[6px] bg-[var(--color-neutral-300)]"
                  style={{ width: 22, height: 22 }}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="font-display text-[14px] leading-none text-black whitespace-nowrap">
          Ver tudo
        </span>
      </motion.div>
    </button>
  );
}

/**
 * Home category strip, driven by the DB (primary: true, active: true),
 * sorted by `order`. Falls back to the hardcoded CATEGORIES list for
 * metadata (label, href) when a DB key matches.
 *
 * If the DB has no primary categories yet (empty / loading), shows the
 * 3 hardcoded primary categories as a skeleton-ready fallback.
 */
export function CategoryGrid() {
  const dbCategories = useQuery(api.categories.list, { activeOnly: true });

  // Loading state, show skeleton placeholders
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
      <motion.div variants={scaleIn} className="flex-none">
        <VerTudoCard />
      </motion.div>
    </motion.div>
  );
}
