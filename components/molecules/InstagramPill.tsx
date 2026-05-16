"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";

export function InstagramPill({
  href = "https://instagram.com",
  label = "Dúvida? Fala comigo!",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 rounded-pill border border-[rgba(50,52,57,0.16)] bg-white pl-[10px] pr-[18px] py-2 transition-colors hover:bg-[var(--color-neutral-100)]"
      >
        <Icon name="mdi:instagram" size={20} className="text-[var(--color-ink)]" />
        <span className="font-display font-medium text-[14px] leading-[1.1] text-[var(--color-ink)] whitespace-nowrap">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
