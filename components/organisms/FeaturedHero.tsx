"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { useChat } from "@/components/providers/ChatProvider";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

type Slide = { src: string; alt: string };

/**
 * Featured hero, slimmer version, auto-cycling images, no slider dots.
 * Sits AFTER the restaurants section. Height ~220px.
 */
export function FeaturedHero({
  title,
  slides,
  cta,
  intervalMs = 5500,
}: {
  title: string;
  slides: Slide[];
  cta: string;
  intervalMs?: number;
}) {
  const chat = useChat();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <section className="w-full bg-white px-6 py-6">
      <div className="relative mx-auto w-full max-w-screen-md h-[220px] overflow-hidden rounded-[24px]">
        {/* All images stay in DOM, only opacity toggles. */}
        {slides.map((s, i) => (
          <motion.div
            key={s.src}
            aria-hidden={i !== index}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
            />
          </motion.div>
        ))}

        {/* Soft gradient for legibility */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerChildren(0.1, 0.05)}
          className="relative z-10 h-full flex flex-col items-start justify-end gap-3 p-6"
        >
          <motion.h2
            variants={fadeUp}
            className="font-display font-medium text-[22px] leading-[1.15] tracking-tight text-white max-w-[18ch]"
          >
            {title}
          </motion.h2>

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={chat.open}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full bg-white pl-3 pr-4 py-2 text-[var(--color-neutral-800)] font-display font-medium text-[13px] leading-[1.1]"
          >
            <Icon name="sparkles" size={16} />
            {cta}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
