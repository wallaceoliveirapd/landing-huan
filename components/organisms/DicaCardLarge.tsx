"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@/components/atoms/Badge";
import type { Dica } from "@/lib/mock-data";

export function DicaCardLarge({ dica }: { dica: Dica }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/dicas/${dica.slug}`}
        className="flex w-full flex-col gap-4 group"
      >
        <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
          <Image
            src={dica.cover}
            alt={dica.title}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge tone="yellow">{dica.tipo}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <h3 className="font-display font-medium text-[18px] leading-[1.39] text-[var(--color-ink)]">
            {dica.title}
          </h3>
          <p className="text-[14px] leading-[1.5] text-[var(--color-neutral-600)] line-clamp-3">
            {dica.excerpt}
          </p>
          <span className="text-[12px] text-[var(--color-neutral-600)]">
            Publicado em {new Date(dica.publishedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
