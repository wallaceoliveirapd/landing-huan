"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { CouponCard } from "./CouponCard";
import type { CouponData } from "./CouponCard";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";

export function CouponsSection() {
  const coupons = useQuery(api.coupons.list, { activeOnly: true });

  if (!coupons || coupons.length === 0) return null;

  const couponData: CouponData[] = coupons.map((c) => ({
    _id: c._id,
    title: c.title,
    description: c.description,
    code: c.code,
    image: c.image,
    discountType: c.discountType,
    discountValue: c.discountValue,
    partner: c.partner,
    partnerUrl: c.partnerUrl,
    conditions: c.conditions,
    rules: c.rules,
    firstPurchaseOnly: c.firstPurchaseOnly,
    validUntil: c.validUntil,
  }));

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerChildren(0.08, 0)}
      className="w-full bg-white"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 py-8">
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pb-6">
          <h2 className="font-display font-medium text-[24px] leading-tight text-[var(--color-neutral-800)]">
            Economize ainda mais
          </h2>
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Separei alguns cupons para você
          </p>
        </motion.div>

        <HorizontalCarousel>
          {couponData.map((c) => (
            <CouponCard key={c._id} coupon={c} />
          ))}
        </HorizontalCarousel>
      </div>
    </motion.section>
  );
}
