"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";

/**
 * Social-proof live counter. Stabilizes a viewer count for the current
 * item (seeded from itemId so all visitors see the same number in the
 * same window) and nudges it ±1 every 25-40s for subtle motion.
 *
 * Rendered as a fixed pill above the sticky CTA button — white bg with
 * shadow, matches bottom-nav visual language.
 */
function seededInitial(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // 5..10 inclusive
  return 5 + (Math.abs(h) % 6);
}

export function LiveViewers({ itemId }: { itemId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(seededInitial(itemId));
    const tick = () => {
      setCount((c) => {
        if (c === null) return c;
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = c + delta;
        if (next < 4) return 5;
        if (next > 14) return 13;
        return next;
      });
    };
    const interval = setInterval(tick, 25_000 + Math.random() * 15_000);
    return () => clearInterval(interval);
  }, [itemId]);

  if (count === null) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[11px] font-medium text-[var(--color-neutral-800)]"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
        <span>
          <span className="font-semibold text-emerald-700">{count}</span> vendo agora
        </span>
      </motion.div>
    </div>
  );
}
