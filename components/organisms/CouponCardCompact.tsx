"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { trackCouponCopy } from "@/lib/analytics";

export type CouponCompactData = {
  _id: string;
  title: string;
  description: string;
  code: string;
  image: string;
  discountType: string;
  discountValue: number;
  partner?: string;
  partnerUrl?: string;
  conditions?: string;
  rules?: string;
  firstPurchaseOnly: boolean;
  validUntil?: number;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function CompactSeparator() {
  return (
    <div className="w-full h-[22px] relative -my-1">
      <svg
        width="100%"
        height="22"
        viewBox="0 0 260 22"
        fill="none"
        preserveAspectRatio="none"
        className="block w-full h-full"
      >
        <circle cx="0" cy="11" r="7" fill="white" stroke="#DDE1E8" strokeWidth="1" />
        <circle cx="260" cy="11" r="7" fill="white" stroke="#DDE1E8" strokeWidth="1" />
        <line
          x1="10"
          y1="11"
          x2="250"
          y2="11"
          stroke="#DDE1E8"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}

/**
 * Smaller ticket-style coupon for use inside detail pages (passeios,
 * hospedagem, restaurantes, vida noturna) where the full-width CouponCard
 * would be too heavy. Visual language matches the home carousel.
 */
export function CouponCardCompact({
  coupon,
  onSelect,
}: {
  coupon: CouponCompactData;
  onSelect?: () => void;
}) {
  const auth = useAuth();
  const [copied, setCopied] = useState(false);

  function handleCopyClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!auth.requireAuth()) return;
    navigator.clipboard.writeText(coupon.code).catch(() => { });
    trackCouponCopy(coupon.title, coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const displayCode = auth.isAuthenticated ? coupon.code : "•••••••";

  return (
    <>
      <div className="w-[260px] flex-none flex flex-col select-none">
        <button
          type="button"
          onClick={() => {
            onSelect?.();
          }}
          className="bg-white border-l border-r border-t border-[var(--color-neutral-300)] rounded-t-[14px] pt-3 pb-1 px-3 flex flex-col gap-1 text-left"
        >
          <p className="font-display font-medium text-[18px] leading-[18px] text-[var(--color-neutral-800)] line-clamp-1">
            {coupon.title}
          </p>
          <p className="text-[12px] leading-[14px] text-[var(--color-neutral-600)] line-clamp-2 min-h-[28px]">
            {coupon.description}
          </p>
        </button>

        <CompactSeparator />

        <div className="bg-white border-l border-r border-b border-[var(--color-neutral-300)] rounded-b-[14px] pt-1 pb-3 px-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-[var(--color-neutral-100)] rounded-[6px] pl-2.5 pr-1 py-1">
            <p className="flex-1 font-display font-medium text-[12px] leading-[16px] text-[var(--color-neutral-800)] truncate">
              {displayCode}
            </p>
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={handleCopyClick}
                className="inline-flex items-center gap-1 bg-white border border-[var(--color-neutral-300)] rounded-[5px] px-2 py-1 text-[11px] font-medium text-[var(--color-neutral-800)]"
              >
                <Icon name={copied ? "check" : "copy"} size={11} />
                {copied ? "Copiado" : "Copiar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => auth.openAuthModal()}
                className="inline-flex items-center gap-1 bg-white border border-[var(--color-neutral-300)] rounded-[5px] px-2 py-1 text-[11px] font-medium text-[var(--color-neutral-800)]"
              >
                <Icon name="lock" size={11} />
                Ver
              </button>
            )}
          </div>
          <p className="text-[10px] leading-[14px] text-[var(--color-neutral-600)] truncate">
            {coupon.validUntil
              ? `Válido até ${formatDate(coupon.validUntil)}`
              : "Sem validade"}
          </p>
        </div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(<AnimatePresence />, document.body)}
    </>
  );
}
