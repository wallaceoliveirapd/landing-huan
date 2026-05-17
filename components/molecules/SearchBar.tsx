"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";

/**
 * Matches Figma node 334:35954, Outer neutral-100 pill,
 * inner white input pill + white circular search/filter button.
 */
export function SearchBar({
  placeholder = "Como eu posso te ajudar?",
  onClick,
  onSearch,
}: {
  placeholder?: string;
  onClick?: () => void;
  /** Optional filter/search action on the right circular button */
  onSearch?: () => void;
}) {
  return (
    <div data-tour="search" className="w-full bg-[var(--color-neutral-100)] flex gap-1 items-stretch p-1 rounded-pill">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 inline-flex items-center bg-white h-[48px] px-4 py-3 rounded-pill text-left"
      >
        <span className="text-[14px] text-[var(--color-neutral-600)] font-normal">
          {placeholder}
        </span>
      </button>

      <motion.button
        type="button"
        onClick={onSearch ?? onClick}
        whileTap={{ scale: 0.92 }}
        className="size-[48px] flex-none grid place-items-center bg-white rounded-pill"
        aria-label="Buscar"
      >
        <Icon name="search" size={20} className="text-[var(--color-neutral-800)]" />
      </motion.button>
    </div>
  );
}
