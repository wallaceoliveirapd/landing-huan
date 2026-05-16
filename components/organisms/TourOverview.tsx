"use client";

import { motion } from "motion/react";
import { InfoRow } from "@/components/molecules/InfoRow";
import { Badge } from "@/components/atoms/Badge";
import { PriceTag } from "@/components/atoms/PriceTag";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

export function TourOverview({
  price,
  priceFrom,
  duration,
  description,
  city,
  tags,
}: {
  price: number;
  priceFrom?: number;
  duration: string;
  description?: string;
  city?: string;
  tags: string[];
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
        <motion.div variants={fadeUp}>
          <PriceTag value={price} from={priceFrom} />
        </motion.div>

        <motion.div variants={fadeUp}>
          <InfoRow icon="tabler:clock" accent>
            {duration}
          </InfoRow>
        </motion.div>

        {city && (
          <motion.div variants={fadeUp}>
            <InfoRow icon="boxicons:location">{city}</InfoRow>
          </motion.div>
        )}

        {description && (
          <motion.p
            variants={fadeUp}
            className="text-[15px] leading-[1.6] text-[var(--color-neutral-700)] whitespace-pre-line"
          >
            {description}
          </motion.p>
        )}

        {tags.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
