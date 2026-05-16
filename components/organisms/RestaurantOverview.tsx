"use client";

import { motion } from "motion/react";
import { InfoRow } from "@/components/molecules/InfoRow";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

export function RestaurantOverview({
  openUntil,
  address,
  instagram,
  phone,
}: {
  openUntil?: string;
  address: string;
  instagram?: string;
  phone?: string;
}) {
  return (
    <section className="w-full bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerChildren(0.06, 0.05)}
        className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6"
      >
        <motion.h2
          variants={fadeUp}
          className="font-display font-medium text-[32px] leading-[40px] tracking-[-0.02em] text-[var(--color-ink)]"
        >
          Visão geral
        </motion.h2>

        {openUntil && (
          <motion.div variants={fadeUp}>
            <InfoRow icon="tabler:clock" accent>
              Aberto até as {openUntil}
            </InfoRow>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <InfoRow icon="boxicons:location">{address}</InfoRow>
        </motion.div>
        {instagram && (
          <motion.div variants={fadeUp}>
            <InfoRow icon="mdi:instagram">{instagram}</InfoRow>
          </motion.div>
        )}
        {phone && (
          <motion.div variants={fadeUp}>
            <InfoRow icon="solar:phone-outline">{phone}</InfoRow>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
