"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Rating } from "@/components/atoms/Rating";
import { Icon } from "@/components/atoms/Icon";

type Props = {
  type: "tour" | "restaurant" | "dica";
  title: string;
  image: string;
  rating?: number;
  meta?: string;
  href: string;
};

const labels: Record<Props["type"], string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  dica: "Dica",
};

export function ChatInlineCard({ type, title, image, rating, meta, href }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
    >
      <Link
        href={href}
        target={type === "tour" ? "_blank" : undefined}
        rel={type === "tour" ? "noopener noreferrer" : undefined}
        className="flex items-stretch gap-3 rounded-2xl border-1 border-[var(--color-brand-purple)] bg-white overflow-hidden hover: transition-shadow"
      >
        <div className="relative w-[88px] h-[88px] shrink-0">
          <Image src={image} alt="" fill sizes="88px" className="object-cover" />
        </div>
        <div className="flex flex-col justify-between py-2 pr-3 min-w-0 flex-1">
          <div className="flex flex-col gap-[2px]">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-[var(--color-brand-purple)]">
              <Icon name="ph:sparkle-fill" size={10} /> {labels[type]} sugerido
            </span>
            <p className="font-display font-medium text-[14px] leading-[1.25] text-[var(--color-ink)] line-clamp-2">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-neutral-600)]">
            {rating !== undefined && <Rating value={rating} />}
            {meta && <span>{meta}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
