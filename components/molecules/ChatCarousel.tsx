"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { trackCardClick } from "@/lib/analytics";
import { useChat } from "@/components/providers/ChatProvider";
import type { RawCardItem } from "@/lib/chat-mocks";

const KIND_META: Record<
  string,
  { label: string; icon: string; accent: string }
> = {
  tour: { label: "Passeio", icon: "compass", accent: "#2563EB" },
  restaurant: { label: "Restaurante", icon: "utensils", accent: "#EA580C" },
  dica: { label: "Dica", icon: "lightbulb", accent: "#CA8A04" },
  praia: { label: "Praia", icon: "waves", accent: "#0891B2" },
  nightlife: { label: "Vida noturna", icon: "moon", accent: "#7C3AED" },
  hosting: { label: "Hospedagem", icon: "bed-double", accent: "#0D9488" },
  itinerary: { label: "Roteiro", icon: "calendar-check", accent: "#16A34A" },
  coupon: { label: "Cupom", icon: "ticket-percent", accent: "#028574" },
  router: { label: "Criar viagem", icon: "sparkles", accent: "#323439" },
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
      href = item.slug ? `/passeios/${String(item.slug)}` : "/passeios";
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

// ─── Router card (special full-width CTA) ───────────────────────────────────
function RouterCard({ item }: { item: Normalized }) {
  const { close } = useChat();
  return (
    <Link
      href={item.href}
      onClick={() => { trackCardClick("router", item.title); close(); }}
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

// ─── iFood-style vertical card ───────────────────────────────────────────────
function ChatCard({ item: rawItem }: { item: RawCardItem }) {
  const { close } = useChat();
  const item = normalize(rawItem);
  if (item.isRouter) return <RouterCard item={item} />;

  const { kind, title, subtitle, image, href, badge } = item;
  const km = KIND_META[kind] ?? KIND_META.tour;
  const isExternal =
    href.startsWith("http") || kind === "hosting" || kind === "coupon";

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      onClick={() => { trackCardClick(kind, title); if (!isExternal) close(); }}
      className="relative flex flex-col items-start justify-between overflow-hidden rounded-3xl w-[230px] h-[208px] flex-none p-2 active:scale-[0.97] transition-transform"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Background image */}
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          sizes="148px"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: `${km.accent}1A` }}
        >
          <span style={{ color: km.accent }}>
            <Icon name={km.icon} size={36} className="opacity-30" />
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20 pointer-events-none" />

      {/* Coupon discount overlay */}
      {kind === "coupon" && badge && (
        <div
          className="absolute inset-0 z-[5] flex items-center justify-center"
          style={{ backgroundColor: `${km.accent}D9` }}
        >
          <span className="font-display font-bold text-[22px] text-white text-center px-3 leading-tight">
            {badge}
          </span>
        </div>
      )}

      {/* Category badge */}
      <div
        className="relative z-10 inline-flex items-center gap-1 px-2 py-[5px] rounded-full shrink-0"
        style={{ backgroundColor: km.accent }}
      >
        <Icon name={km.icon} size={12} className="text-white" />
        <span className="text-white text-[10px] font-medium uppercase tracking-wide font-display leading-none">
          {km.label}
        </span>
      </div>

      {/* Non-coupon rating badge */}
      {badge && kind !== "coupon" && (
        <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-sm px-1.5 py-0 rounded-full">
          <span className="text-white text-[11px] font-medium ">{badge}</span>
        </div>
      )}

      {/* White footer panel */}
      <div className="relative z-10 bg-white rounded-[16px] px-3 py-2 w-full flex items-center gap-1.5">
        <div className="flex-1 min-w-0">
          <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] truncate leading-snug">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-[var(--color-neutral-600)] truncate mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        <Icon
          name="chevron-right"
          size={18}
          className="text-[var(--color-neutral-500)] shrink-0"
        />
      </div>
    </Link>
  );
}

// ─── Carousel ────────────────────────────────────────────────────────────────
export function ChatCarousel({ items }: { items: RawCardItem[] }) {
  if (!items.length) return null;

  const contentItems = items
    .filter((i) => (i.kind ?? i.type) !== "router")
    .slice(0, 8);
  const routerItems = items.filter((i) => (i.kind ?? i.type) === "router");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 w-full"
    >
      {contentItems.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar -mx-5"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {/* Left spacer: 12px + gap-2(8px) = 20px — matches chat px-5 padding */}
          <div className="w-3 flex-none shrink-0" aria-hidden />
          {contentItems.map((item) => (
            <ChatCard key={String(item.id ?? Math.random())} item={item} />
          ))}
          {/* Right spacer */}
          <div className="w-3 flex-none shrink-0" aria-hidden />
        </div>
      )}
      {routerItems.map((item) => (
        <ChatCard key={String(item.id ?? Math.random())} item={item} />
      ))}
    </motion.div>
  );
}
