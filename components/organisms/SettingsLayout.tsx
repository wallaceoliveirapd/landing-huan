"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";

/**
 * Shared wrapper for profile settings sub-pages.
 * Header with back arrow + title, animated content area.
 */
export function SettingsLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.06, 0.04)}
      className="min-h-screen bg-white pb-32"
    >
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
        >
          <Icon
            name="arrow-left"
            size={18}
            className="text-[var(--color-neutral-800)]"
          />
        </button>
        <span className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
          Perfil
        </span>
      </div>

      <motion.div variants={fadeUp} className="px-6 pt-6 pb-2">
        <h1 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
            {subtitle}
          </p>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="px-6 pt-6">
        {children}
      </motion.div>
    </motion.div>
  );
}
