"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CouponCard, type CouponData } from "@/components/organisms/CouponCard";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { Icon } from "@/components/atoms/Icon";

export default function CuponsListingPage() {
  const coupons = useQuery(api.coupons.list, { activeOnly: true });
  const loading = coupons === undefined;

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.07, 0.04)}
      className="min-h-screen bg-white pb-32"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="px-6 pt-8 pb-2">
        <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)]">
          Cupons & ofertas
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
          Descontos dos nossos parceiros pra você economizar na viagem.
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div variants={fadeUp} className="px-6 pt-6">
        {loading ? (
          <div className="flex flex-col gap-4 max-w-md">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[180px] rounded-[16px] bg-[var(--color-neutral-100)] animate-pulse"
              />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Icon
              name="ticket-percent"
              size={48}
              className="text-[var(--color-neutral-400)]"
            />
            <p className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
              Nenhum cupom ativo no momento
            </p>
            <p className="text-[13px] text-[var(--color-neutral-600)] max-w-[300px]">
              Volte em breve — estamos sempre adicionando novas parcerias.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-md">
            {coupons.map((c) => {
              const data: CouponData = {
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
              };
              return <CouponCard key={c._id} coupon={data} />;
            })}
          </div>
        )}
      </motion.div>
    </motion.main>
  );
}
