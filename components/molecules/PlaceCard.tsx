"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/atoms/Icon";

/**
 * Card de "parada" num roteiro sem imagem — só nome, endereço e descrição.
 * Útil pra cadastrar paradas livres no admin (almoço, pôr do sol, atividade).
 */
export function PlaceCard({
  name,
  address,
  description,
  time,
  className,
  size = "lg",
}: {
  name: string;
  address?: string;
  description?: string;
  time?: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex h-full flex-col gap-2 rounded-card border border-dashed border-[var(--color-brand-purple)]/30 bg-[var(--color-neutral-100)]",
        size === "lg" ? "w-[254px] flex-none p-4" : "w-[180px] flex-none p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[var(--color-brand-purple)]">
        <Icon name="boxicons:location" size={size === "lg" ? 18 : 14} />
        {time && (
          <span
            className={cn(
              "font-display font-medium tracking-wider uppercase",
              size === "lg" ? "text-[12px]" : "text-[10px]",
            )}
          >
            {time}
          </span>
        )}
      </div>
      <h4
        className={cn(
          "font-display font-medium text-[var(--color-ink)] leading-[1.3]",
          size === "lg" ? "text-[15px]" : "text-[12px]",
        )}
      >
        {name}
      </h4>
      {address && (
        <p
          className={cn(
            "text-[var(--color-neutral-600)] leading-[1.4]",
            size === "lg" ? "text-[13px]" : "text-[11px]",
          )}
        >
          {address}
        </p>
      )}
      {description && size === "lg" && (
        <p className="mt-auto text-[13px] leading-[1.45] text-[var(--color-neutral-800)]">
          {description}
        </p>
      )}
    </motion.div>
  );
}
