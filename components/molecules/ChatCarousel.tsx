"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { trackCardClick } from "@/lib/analytics";
import type { RawCardItem } from "@/lib/chat-mocks";

/**
 * Per-kind metadata. Each category gets a subtle accent color (used as a
 * small left accent stripe + label tone). NOT loud borders — just an
 * understated visual cue so the user can scan categories quickly.
 */
const KIND_META: Record<
  string,
  { label: string; icon: string; accent: string; labelColor: string }
> = {
  tour:       { label: "Passeio",      icon: "compass",       accent: "#2563EB", labelColor: "text-[#1D4ED8]" },
  restaurant: { label: "Restaurante",  icon: "utensils",      accent: "#EA580C", labelColor: "text-[#C2410C]" },
  dica:       { label: "Dica",         icon: "lightbulb",     accent: "#CA8A04", labelColor: "text-[#A16207]" },
  praia:      { label: "Praia",        icon: "waves",         accent: "#0891B2", labelColor: "text-[#0E7490]" },
  nightlife:  { label: "Vida noturna", icon: "moon",          accent: "#7C3AED", labelColor: "text-[#6D28D9]" },
  hosting:    { label: "Hospedagem",   icon: "bed-double",    accent: "#0D9488", labelColor: "text-[#0F766E]" },
  itinerary:  { label: "Roteiro",      icon: "calendar-check", accent: "#16A34A", labelColor: "text-[#15803D]" },
  coupon:     { label: "Cupom",        icon: "ticket-percent", accent: "#028574", labelColor: "text-[#028574]" },
  router:     { label: "Criar viagem", icon: "sparkles",      accent: "#323439", labelColor: "text-[#323439]" },
};

type Normalized = {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  meta?: string;
  badge?: string;
  isRouter?: boolean;
};

function normalize(item: RawCardItem): Normalized {
  const kind = String(item.kind ?? item.type ?? "tour");
  const id = String(item.id ?? Math.random());
  const image = toProxyUrl(String(item.image ?? item.cover ?? ""));
  let title = String(item.title ?? item.name ?? "");
  let subtitle = String(
    item.shortDesc ?? item.excerpt ?? item.description ?? item.subtitle ?? "",
  );
  let href = "#";
  let meta: string | undefined;
  let badge: string | undefined;

  switch (kind) {
    case "tour":
      href = String(item.url ?? "/passeios");
      meta = item.duration ? String(item.duration) : undefined;
      badge = item.rating ? `★ ${Number(item.rating).toFixed(1)}` : undefined;
      break;
    case "restaurant":
      href = `/restaurantes/${String(item.slug ?? "")}`;
      meta = item.cuisine ? String(item.cuisine) : undefined;
      badge = item.rating ? `★ ${Number(item.rating).toFixed(1)}` : undefined;
      break;
    case "dica":
      href = `/dicas/${String(item.slug ?? "")}`;
      break;
    case "praia":
      href = `/praias/${String(item.slug ?? "")}`;
      break;
    case "nightlife":
      href = `/vida-noturna/${String(item.slug ?? "")}`;
      break;
    case "hosting":
      href = String(item.affiliateUrl ?? "/hospedagem");
      meta = item.priceFrom
        ? `A partir de R$ ${Number(item.priceFrom).toFixed(0)}`
        : undefined;
      break;
    case "itinerary":
      href = `/roteiros/${String(item.slug ?? "")}`;
      meta = item.durationDays ? `${item.durationDays} dias` : undefined;
      title = title || String(item.subtitle ?? "");
      break;
    case "coupon":
      href = String(item.partnerUrl ?? "#");
      badge =
        item.discountType === "percent"
          ? `${item.discountValue}% OFF`
          : `R$${Number(item.discountValue).toFixed(0)} OFF`;
      subtitle = String(item.description ?? "");
      break;
    case "router":
      href = String(item.href ?? "/minha-viagem/criar");
      title = String(item.title ?? "Criar viagem");
      subtitle = String(item.subtitle ?? "Monte seu roteiro");
      return {
        id,
        kind,
        title,
        subtitle,
        image: "",
        href,
        meta: String(item.cta ?? "Abrir criador"),
        isRouter: true,
      };
  }

  return { id, kind, title, subtitle, image, href, meta, badge };
}

// ─── Router card (special: "Criar viagem") ─────────────────────────────────
function RouterCard({ item }: { item: Normalized }) {
  return (
    <Link
      href={item.href}
      onClick={() => trackCardClick("router", item.title)}
      className="group relative flex items-center gap-3 w-full overflow-hidden rounded-2xl bg-[var(--color-neutral-800)] text-white p-4 transition-transform"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand-yellow)]"
      />
      <div className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-yellow)] shrink-0">
        <Icon name="sparkles" size={20} className="text-[var(--color-neutral-800)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-medium text-[14px] text-white">
          {item.title}
        </p>
        <p className="text-[12px] text-white/70">{item.subtitle}</p>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)] shrink-0">
        {item.meta}
        <Icon name="arrow-right" size={12} />
      </div>
    </Link>
  );
}

// ─── Standard card ────────────────────────────────────────────────────────
function ChatCard({ item }: { item: RawCardItem }) {
  const normalized = normalize(item);
  if (normalized.isRouter) return <RouterCard item={normalized} />;

  const { kind, title, subtitle, image, href, meta, badge } = normalized;
  const km = KIND_META[kind] ?? KIND_META.tour;
  const isExternal =
    href.startsWith("http") ||
    kind === "tour" ||
    kind === "hosting" ||
    kind === "coupon";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-full flex-none"
    >
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={() => trackCardClick(kind, title)}
        className="group relative flex gap-3 overflow-hidden rounded-2xl bg-white border border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-800)] transition-colors p-3"
      >
        {/* Subtle category accent stripe on the left */}
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: km.accent }}
        />

        {/* Square image */}
        <div className="relative h-[80px] w-[80px] flex-none rounded-xl overflow-hidden bg-[var(--color-neutral-100)] ml-1">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <Icon name={km.icon} size={22} className="opacity-30" />
            </div>
          )}
          {/* Coupon discount overlay */}
          {kind === "coupon" && badge && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: `${km.accent}E6` }}
            >
              <span className="font-display font-medium text-[14px] text-white leading-tight text-center px-1">
                {badge}
              </span>
            </div>
          )}
        </div>

        {/* Text column */}
        <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
          {/* Top row: kind label + rating badge */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${km.labelColor}`}
            >
              <Icon name={km.icon} size={10} />
              {km.label}
              {meta && (
                <span className="text-[var(--color-neutral-600)] font-normal normal-case tracking-normal">
                  • {meta}
                </span>
              )}
            </span>
            {badge && kind !== "coupon" && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--color-neutral-800)] whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] line-clamp-2 mt-1">
            {title}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-[12px] leading-[1.4] text-[var(--color-neutral-600)] line-clamp-1 mt-1">
              {subtitle}
            </p>
          )}

          {/* CTA arrow */}
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[11px] text-[var(--color-neutral-700)] font-medium">
              {isExternal ? "Ver oferta" : "Ver mais"}
            </span>
            <Icon name="arrow-right" size={11} className="text-[var(--color-neutral-700)]" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Carousel ───────────────────────────────────────────────────────────────
export function ChatCarousel({ items }: { items: RawCardItem[] }) {
  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 w-full"
    >
      {items.slice(0, 5).map((item) => (
        <ChatCard key={String(item.id ?? Math.random())} item={item} />
      ))}
    </motion.div>
  );
}
