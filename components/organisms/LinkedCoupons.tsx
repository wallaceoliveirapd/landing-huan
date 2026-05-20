"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { CouponCardCompact, type CouponCompactData } from "./CouponCardCompact";

/**
 * Renders the list of coupons admin manually linked to a tour or hosting,
 * so the user sees exactly which promo codes apply when booking that item.
 *
 * Uses the same horizontal carousel as the home page Cupons section, but
 * with a smaller card variant so it fits inside an item-detail page.
 */
export function LinkedCoupons({
  ids,
  heading = "Cupons disponíveis",
}: {
  ids: Id<"coupons">[];
  heading?: string;
}) {
  const coupons = useQuery(api.coupons.getByIds, { ids });
  if (!ids.length) return null;
  if (!coupons || coupons.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 min-w-0">
      <h2 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
        {heading}
      </h2>
      <HorizontalCarousel>
        {coupons.map((c) => (
          <CouponCardCompact
            key={c._id}
            coupon={
              {
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
              } satisfies CouponCompactData
            }
          />
        ))}
      </HorizontalCarousel>
    </section>
  );
}
