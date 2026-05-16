"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

export function ListingHero({
  title,
  subtitle,
  icon,
  image,
}: {
  title: string;
  subtitle: string;
  icon?: IconName;
  image: string;
}) {
  return (
    <section className="relative w-full min-h-[320px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Bottom-anchored gradient for legibility, lighter at top */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 pointer-events-none"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.08, 0.05)}
        className="relative z-10 mx-auto flex h-full min-h-[320px] w-full max-w-screen-md flex-col justify-end gap-3 p-8"
      >
        {icon && (
          <motion.span
            variants={fadeUp}
            className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-yellow)] text-[var(--color-brand-purple)]"
          >
            <Icon name={icon} size={22} />
          </motion.span>
        )}
        <motion.h1
          variants={fadeUp}
          className="font-display font-medium text-[36px] sm:text-[44px] leading-[1.05] text-white tracking-tight max-w-[20ch] [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]"
        >
          {title}
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="font-display text-[14px] sm:text-[15px] leading-[1.5] text-white/90 max-w-[58ch] [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </section>
  );
}
