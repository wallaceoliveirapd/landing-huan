"use client";

import { motion } from "motion/react";
import { HoursRow } from "@/components/molecules/HoursRow";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

export function OperatingHours({
  hours,
}: {
  hours: { weekday: string; hours: string }[];
}) {
  return (
    <section className="w-full bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerChildren(0.04, 0.05)}
        className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6"
      >
        <motion.h2
          variants={fadeUp}
          className="font-display font-medium text-[32px] leading-[40px] tracking-[-0.02em] text-[var(--color-ink)]"
        >
          Horário de funcionamento
        </motion.h2>
        <div className="flex w-full flex-col gap-2">
          {hours.map((h) => (
            <motion.div key={h.weekday} variants={fadeUp}>
              <HoursRow weekday={h.weekday} hours={h.hours} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
