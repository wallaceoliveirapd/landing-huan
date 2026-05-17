"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

type Slide = { src: string; alt: string };

/**
 * Hero das páginas internas (categoria / detalhe):
 * - altura fixa 320px
 * - foto full-bleed (suporta 1 ou múltiplas com crossfade)
 * - botão circular branco "voltar" no topo esquerdo
 * - título grande branco no rodapé (sem subtítulo/ícone)
 * - blur radial atrás do título para legibilidade (mesmo efeito do FeaturedHero)
 */
export function InternalPageHero({
  title,
  image,
  slides,
  backHref = "/",
  intervalMs = 5500,
}: {
  title: string;
  image?: string;
  slides?: Slide[];
  backHref?: string;
  intervalMs?: number;
}) {
  const list: Slide[] = slides && slides.length > 0 ? slides : image ? [{ src: image, alt: "" }] : [];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (list.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [list.length, intervalMs]);

  return (
    <section className="relative w-full h-[220px] min-h-[220px] overflow-hidden">
      {/* Camada de slides, TODAS sempre montadas, só opacity muda para evitar fundo vazio */}
      {list.map((s, i) => (
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
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      ))}

      {/* gradient + blur halo (mesmo padrão do FeaturedHero) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/5 to-black/5 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 backdrop-blur-[48px] pointer-events-none"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 30% 78%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.55) 55%, transparent 85%)",
          maskImage:
            "radial-gradient(ellipse 100% 100% at 30% 100%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.55) 55%, transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 30% 78%, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.1) 55%, transparent 85%)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.08, 0.05)}
        className="relative z-10 mx-auto flex h-full w-full max-w-screen-md flex-col justify-between p-4"
      >
        <motion.div variants={fadeUp}>
          <Link
            href={backHref}
            aria-label="Voltar"
            className="grid size-[42px] place-items-center rounded-full bg-white  hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <Icon
              name="material-symbols:chevron-left"
              size={28}
              className="text-[var(--color-ink)]"
            />
          </Link>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-display font-medium text-[36px] sm:text-[44px] leading-[1.05] text-white tracking-tight max-w-[18ch]"
        >
          {title}
        </motion.h1>
      </motion.div>
    </section>
  );
}
