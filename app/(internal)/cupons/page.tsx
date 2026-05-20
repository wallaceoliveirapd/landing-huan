"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CouponCard, type CouponData } from "@/components/organisms/CouponCard";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { Icon } from "@/components/atoms/Icon";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { gtmViewItemList, gtmSelectItem } from "@/lib/gtm";

export default function CuponsListingPage() {
  const coupons = useQuery(api.coupons.list, { activeOnly: true });
  const loading = coupons === undefined;

  const { visible, sentinelRef, hasMore } = useInfiniteList(coupons ?? [], { initial: 6, step: 6 });

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (coupons !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("cupons");
    }
  }, [coupons]);

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.07, 0.04)}
      className="min-h-screen bg-white pb-32"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="px-6 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
      >
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
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <Icon
              name="ticket-percent"
              size={48}
              className="text-[var(--color-neutral-400)]"
            />
            <p className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
              Nenhum cupom ativo no momento
            </p>
            <p className="text-[13px] text-[var(--color-neutral-600)] max-w-[300px]">
              Volte em breve, estamos sempre adicionando novas parcerias.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 max-w-md">
            <AnimatePresence initial={false}>
              {visible.map((c) => {
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
                return (
                  <motion.div
                    key={c._id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <CouponCard
                      coupon={data}
                      onSelect={() =>
                        gtmSelectItem({
                          item_type: "passeio",
                          item_id: c._id,
                          item_name: c.title,
                          item_city: null,
                          list_name: "cupons",
                        })
                      }
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
          </div>
        )}
      </motion.div>
    </motion.main>
  );
}
