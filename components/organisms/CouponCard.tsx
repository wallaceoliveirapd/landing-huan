"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toProxyUrl } from "@/lib/imageUpload";
import { Icon } from "@/components/atoms/Icon";
import { bottomSheetSpring } from "@/lib/motion-presets";
import { useAuth } from "@/components/providers/AuthProvider";
import { trackCouponCopy, trackCouponUse } from "@/lib/analytics";
import { RichContent } from "@/components/atoms/RichContent";
import { affiliateUrl } from "@/lib/affiliateUrl";
import { formatBRL } from "@/lib/format";

export interface CouponData {
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
}

function formatDiscount(type: string, value: number) {
  if (type === "percent") return `${value}% OFF`;
  return `R$ ${value.toFixed(2).replace(".", ",")} OFF`;
}

function ensureAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/**
 * Ticket-shape SVG separator with scalloped edges and dashed line in the middle.
 */
function TicketSeparator() {
  return (
    <div className="w-full h-[30px] relative -my-1">
      <svg
        width="100%"
        height="30"
        viewBox="0 0 347 30"
        fill="none"
        preserveAspectRatio="none"
        className="block w-full h-full"
      >
        {/* left scallop */}
        <circle cx="0" cy="15" r="10" fill="white" stroke="#DDE1E8" strokeWidth="1" />
        {/* right scallop */}
        <circle cx="347" cy="15" r="10" fill="white" stroke="#DDE1E8" strokeWidth="1" />
        {/* dashed line */}
        <line
          x1="14" y1="15" x2="333" y2="15"
          stroke="#DDE1E8"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

function CouponSheet({ coupon, onClose }: { coupon: CouponData; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const imgSrc = toProxyUrl(coupon.image) ||
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=630&q=80";

  function handleCopy() {
    navigator.clipboard.writeText(coupon.code).catch(() => { });
    setCopied(true);
    trackCouponCopy(coupon.title, coupon.code);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20"
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label={coupon.title}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={bottomSheetSpring}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden"
      >
        <div className="overflow-y-auto pb-[max(env(safe-area-inset-bottom),32px)]">
          <div className="relative w-full h-[200px] shrink-0">
            <Image src={imgSrc} alt={coupon.title} fill sizes="100vw"
              className="object-cover" unoptimized={imgSrc.startsWith("/api/img/")} />
            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
              <span className="h-1 w-12 rounded-full bg-white/80" />
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar"
              className="absolute top-6 right-6 grid size-10 place-items-center rounded-full bg-white">
              <Icon name="x" size={20} className="text-[var(--color-neutral-800)]" />
            </button>
          </div>

          <div className="flex flex-col gap-5 px-6 pt-6">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)]">
                {coupon.title}
              </h2>
              <p className="text-[14px] leading-[1.45] text-[var(--color-neutral-600)]">
                {coupon.description}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-[8px] bg-[var(--color-neutral-100)] pl-3 pr-1 py-2">
              <p className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)] tracking-[0.014px]">
                {coupon.code}
              </p>
              <button type="button" onClick={handleCopy}
                className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-neutral-300)] rounded-[6px] px-3 py-2 text-[13px] font-medium text-[var(--color-neutral-800)]">
                <Icon name="copy" size={14} />
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>

            {(coupon.firstPurchaseOnly || coupon.validUntil) && (
              <div className="flex flex-wrap gap-2">
                {coupon.firstPurchaseOnly && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-neutral-300)] px-3 py-1 text-[12px] text-[var(--color-neutral-600)]">
                    <Icon name="user-check" size={13} />
                    Apenas primeira compra
                  </span>
                )}
                {coupon.validUntil && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-neutral-300)] px-3 py-1 text-[12px] text-[var(--color-neutral-600)]">
                    <Icon name="calendar" size={13} />
                    Válido até {formatDate(coupon.validUntil)}
                  </span>
                )}
              </div>
            )}

            {coupon.conditions && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">Condições</p>
                <RichContent content={coupon.conditions} className="text-[14px]" />
              </div>
            )}

            {coupon.rules && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">Regras de uso</p>
                <RichContent content={coupon.rules} className="text-[14px]" />
              </div>
            )}

            <LinkedItemsCarousel couponId={coupon._id} />

            {coupon.partnerUrl && (
              <a
                href={affiliateUrl(coupon._id, "coupon", coupon.title, ensureAbsoluteUrl(coupon.partnerUrl))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCouponUse(coupon.title)}
                className="flex items-center justify-center gap-2 rounded-pill bg-[var(--color-neutral-800)] py-3.5 text-[15px] font-medium text-white"
              >
                <Icon name="external-link" size={16} />
                Usar cupom
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/**
 * Ticket-style coupon card, matches Figma node 334:36200.
 *
 *   Card: 347 wide
 *   Header: white, border (l/r/t), rounded-t-[16px], pt-4 pb-1 px-4
 *     - Title: medium 20, discount headline
 *     - Subtitle: regular 12 neutral-600
 *   Separator: scalloped white piece, 30px tall
 *   Footer: white, border (l/r/b), rounded-b-[16px], pb-4 px-4 gap-2
 *     - Code pill: neutral-100 rounded-[8px], holds "•••••••" + Copiar button
 *     - Footer row: Válido até DATE   /   Regras >
 */
export function CouponCard({ coupon, onSelect }: { coupon: CouponData; onSelect?: () => void }) {
  const auth = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleOpenDetails() {
    onSelect?.();
    if (auth.requireAuth()) setSheetOpen(true);
  }

  function handleCopyClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!auth.requireAuth()) return;
    navigator.clipboard.writeText(coupon.code).catch(() => { });
    trackCouponCopy(coupon.title, coupon.code);
  }

  const discount = formatDiscount(coupon.discountType, coupon.discountValue);

  // Mask the code when user is logged out
  const displayCode = auth.isAuthenticated ? coupon.code : "••••••••••";

  return (
    <>
      <div className="w-[min(82vw,347px)] flex-none flex flex-col select-none">
        {/* Header */}
        <div className="bg-white border-l border-r border-t border-[var(--color-neutral-300)] rounded-t-[16px] pt-4 pb-1 px-4 flex items-start">
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <p className="font-display font-medium text-[20px] leading-[28px] text-[var(--color-neutral-800)] truncate">
              {coupon.title || discount}
            </p>
            <p className="text-[12px] leading-[16px] text-[var(--color-neutral-600)] tracking-[0.012px] truncate">
              {coupon.description}
            </p>
          </div>
        </div>

        {/* Perforated separator */}
        <TicketSeparator />

        {/* Footer */}
        <div className="bg-white border-l border-r border-b border-[var(--color-neutral-300)] rounded-b-[16px] pb-4 px-4 flex flex-col gap-2">
          {/* Code pill */}
          <div className="flex items-center gap-2 bg-[var(--color-neutral-100)] rounded-[8px] pl-3 pr-1 py-1">
            <p className="flex-1 font-display font-medium text-[14px] leading-[20px] tracking-[0.014px] text-[var(--color-neutral-800)] truncate">
              {displayCode}
            </p>
            {auth.isAuthenticated ? (
              <button
                type="button"
                onClick={handleCopyClick}
                className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-neutral-300)] rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]"
              >
                <Icon name="copy" size={14} />
                Copiar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => auth.openAuthModal()}
                className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-neutral-300)] rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]"
              >
                <Icon name="lock" size={14} />
                Ver código
              </button>
            )}
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between w-full">
            <p className="text-[12px] leading-[16px] text-[var(--color-neutral-600)] tracking-[0.012px]">
              {coupon.validUntil
                ? `Válido até ${formatDate(coupon.validUntil)}`
                : "Sem prazo de validade"}
            </p>
            <button
              type="button"
              onClick={handleOpenDetails}
              className="inline-flex items-center gap-2 text-[12px] leading-[16px] text-[var(--color-neutral-700)] tracking-[0.012px]"
            >
              Regras
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {sheetOpen && (
            <CouponSheet coupon={coupon} onClose={() => setSheetOpen(false)} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* ── Linked items carousel (shown inside the coupon bottom sheet) ──────── */

const KIND_HREF: Record<string, (slug: string) => string> = {
  tour: (s) => `/passeios/${s}`,
  restaurant: (s) => `/restaurantes/${s}`,
  hosting: (s) => `/hospedagem/${s}`,
  nightlife: (s) => `/vida-noturna/${s}`,
  praia: (s) => `/praias/${s}`,
};

const KIND_LABEL: Record<string, string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  hosting: "Hospedagem",
  nightlife: "Vida noturna",
  praia: "Praia",
};

type LinkedItem = {
  kind: "tour" | "restaurant" | "hosting" | "nightlife" | "praia";
  _id: string;
  slug: string;
  name: string;
  image: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  shortDesc?: string;
};

function LinkedItemsCarousel({ couponId }: { couponId: string }) {
  const items = useQuery(api.coupons.linkedItemsFor, {
    id: couponId as Id<"coupons">,
  }) as LinkedItem[] | undefined;
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 -mx-6">
      <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)] px-6">
        Usar nesses itens
      </p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 pb-1">
        {items.map((it) => (
          <LinkedItemCard key={`${it.kind}-${it._id}`} item={it} />
        ))}
      </div>
    </div>
  );
}

function LinkedItemCard({ item }: { item: LinkedItem }) {
  const href = KIND_HREF[item.kind]?.(item.slug) ?? "#";
  const hasDiscount =
    item.price !== undefined &&
    item.originalPrice !== undefined &&
    item.originalPrice > item.price;
  return (
    <Link
      href={href}
      className="relative flex-none overflow-hidden rounded-[24px] bg-[var(--color-neutral-200)] w-[min(75vw,260px)] aspect-[260/190]"
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toProxyUrl(item.image)}
          alt={item.name}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[var(--color-neutral-500)]">
          <Icon name="image" size={24} />
        </div>
      )}
      <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-[var(--color-neutral-800)]">
            {KIND_LABEL[item.kind] ?? ""}
          </span>
        </div>
        <div className="bg-white rounded-[19px] px-3 py-2 flex flex-col gap-1">
          <p className="font-display font-medium text-[13px] leading-[1.25] text-[var(--color-neutral-800)] line-clamp-1">
            {item.name}
          </p>
          <div className="flex items-center justify-between gap-2">
            {item.price !== undefined ? (
              <div className="flex items-center gap-1.5 min-w-0">
                {hasDiscount && item.originalPrice !== undefined && (
                  <span className="text-[10px] line-through text-[var(--color-neutral-500)]">
                    {formatBRL(item.originalPrice)}
                  </span>
                )}
                <span className="text-[12px] font-semibold text-[var(--color-neutral-800)] truncate">
                  {formatBRL(item.price)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-[var(--color-neutral-600)] truncate">
                {item.shortDesc ?? ""}
              </span>
            )}
            {item.rating !== undefined && (
              <span className="flex items-center gap-0.5 text-[11px] font-medium text-[var(--color-neutral-700)]">
                <Icon name="star" size={11} className="text-[var(--color-yellow-500)]" />
                {item.rating.toFixed(1).replace(".", ",")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
