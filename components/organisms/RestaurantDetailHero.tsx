"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { RatingLine } from "@/components/molecules/RatingLine";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

export function RestaurantDetailHero({
  name,
  image,
  rating,
  ratingLabel,
  backHref = "/restaurantes",
}: {
  name: string;
  image: string;
  rating: number;
  ratingLabel: string;
  backHref?: string;
}) {
  return (
    <section className="relative w-full h-[453px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"
        />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.08, 0.05)}
        className="relative z-10 mx-auto flex h-full w-full max-w-screen-md flex-col justify-between px-8 pb-8"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
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

        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <h1 className="font-display font-medium text-[36px] sm:text-[40px] leading-[1.1] text-white tracking-tight">
            {name}
          </h1>
          <RatingLine value={rating} label={ratingLabel} light />
        </motion.div>
      </motion.div>
    </section>
  );
}
