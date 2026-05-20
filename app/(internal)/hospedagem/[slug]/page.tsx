import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { PraiaPhotosGrid } from "@/components/organisms/PraiaPhotosGrid";
import { affiliateUrl } from "@/lib/affiliateUrl";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";
import { BackButton } from "@/components/atoms/BackButton";
import { RichContent } from "@/components/atoms/RichContent";
import { TourCtaFooter } from "@/components/organisms/TourCtaFooter";
import { PromoBanner } from "@/components/molecules/PromoBanner";
import { LinkedCoupons } from "@/components/organisms/LinkedCoupons";
import { LiveViewers } from "@/components/molecules/LiveViewers";

const BASE = "https://huanfalcao.com.br";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const items = await fetchQuery(api.hosting.list, {});
  return items.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const h = await fetchQuery(api.hosting.getBySlug, { slug });
  if (!h) return { title: "Hospedagem não encontrada" };
  const desc = h.shortDesc?.slice(0, 160) ?? "";
  const url = `${BASE}/hospedagem/${slug}`;
  return {
    title: h.name,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: h.name,
      description: desc,
      url,
      type: "website",
      images: h.image ? [{ url: h.image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function HospedagemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await fetchQuery(api.hosting.getBySlug, { slug });
  if (!place) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: place.name,
    description: place.shortDesc ?? undefined,
    image: place.image ?? undefined,
    url: `${BASE}/hospedagem/${place.slug}`,
    ...(place.address
      ? {
        address: {
          "@type": "PostalAddress",
          streetAddress: place.address,
          addressCountry: "BR",
        },
      }
      : {}),
    ...(place.priceFrom
      ? {
        priceRange: `A partir de R$ ${place.priceFrom.toFixed(0)}`,
      }
      : {}),
  };

  const ctaHref = affiliateUrl(place._id, "hosting", place.name, place.affiliateUrl);

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GtmViewItem
        item_type="hospedagem"
        item_id={place._id}
        item_name={place.name}
        item_city={place.city ?? null}
        item_category={place.type}
        item_price={place.priceFrom}
        item_slug={place.slug}
      />

      {/* ── Hero image ─────────────────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <Image
          src={toProxyUrl(place.image)}
          alt={place.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div
          className="absolute left-4"
          style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <BackButton
            fallbackHref="/hospedagem"
            className="grid size-10 place-items-center rounded-full bg-white/95 backdrop-blur-sm text-[var(--color-neutral-800)]"
          />
        </div>
        {/* Type badge */}
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]">
          {place.type}
        </div>
        {/* Stars overlay */}
        {place.stars && place.stars > 0 && (
          <div className="absolute bottom-4 right-4 inline-flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5">
            {Array.from({ length: place.stars }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={13}
                className="text-[var(--color-ink)] fill-[var(--color-ink)]"
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Title + shortDesc ──────────────────────────────────── */}
      <section className="px-6 pt-6 max-w-screen-md mx-auto">
        <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)]">
          {place.name}
        </h1>
        <p className="text-[14px] leading-[1.55] text-[var(--color-neutral-600)] mt-2">
          {place.shortDesc}
        </p>
      </section>

      {/* ── Info rows ─────────────────────────────────────────── */}
      <section className="px-6 pt-6 max-w-screen-md mx-auto flex flex-col gap-2">
        {/* Price */}
        <div className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
          <div className="grid size-10 place-items-center rounded-full bg-[var(--color-brand-yellow)] shrink-0">
            <Icon name="tag" size={18} className="text-[var(--color-neutral-800)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[var(--color-neutral-600)] uppercase tracking-wide">
              Diárias a partir de
            </p>
            <p className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
              R$ {place.priceFrom.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Address */}
        {place.address && (
          <InfoRow icon="map-pin" label="Endereço" value={place.address} />
        )}

        {/* City */}
        {place.city && (
          <InfoRow icon="navigation" label="Cidade" value={place.city} />
        )}
      </section>

      {/* ── Promo banner (admin-configured) ────────────────────── */}
      {place.discountBanner?.active &&
        (place.discountBanner.title || place.discountBanner.description) && (
          <section className="px-6 pt-5 max-w-screen-md mx-auto">
            <PromoBanner
              title={place.discountBanner.title}
              description={place.discountBanner.description}
            />
          </section>
        )}

      {/* ── Linked coupons ─────────────────────────────────────── */}
      {place.coupons && place.coupons.length > 0 && (
        <section className="px-6 pt-6 max-w-screen-md mx-auto">
          <LinkedCoupons ids={place.coupons} heading="Cupons para esta hospedagem" />
        </section>
      )}

      {/* ── Amenities chips ────────────────────────────────────── */}
      {place.amenities && place.amenities.length > 0 && (
        <section className="px-6 pt-6 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Comodidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {place.amenities.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-100)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]"
              >
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Rich description ───────────────────────────────────── */}
      {place.description && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Sobre a hospedagem
          </h2>
          <RichContent
            content={place.description}
            className="text-[14px] leading-[1.65]"
          />
        </section>
      )}

      {/* ── Photo gallery (tap → full-screen lightbox) ─────────── */}
      {place.photos && place.photos.length > 0 && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Fotos
          </h2>
          <PraiaPhotosGrid photos={place.photos} alt={`Foto de ${place.name}`} />
        </section>
      )}

      {/* spacer for fixed CTA + live viewers pill */}
      <div className="h-40" />

      <LiveViewers itemId={place._id} />
      {/* ── CTA footer ─────────────────────────────────────────── */}
      <TourCtaFooter
        url={place.affiliateUrl}
        title={place.name}
        itemId={place._id}
        itemType="hosting"
        label="Reservar hospedagem"
      />
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
      <Icon name={icon} size={18} className="text-[var(--color-neutral-800)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--color-neutral-600)] uppercase tracking-wide">
          {label}
        </p>
        <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] truncate">
          {value}
        </p>
      </div>
      {href && (
        <Icon name="external-link" size={14} className="text-[var(--color-neutral-500)]" />
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} target={href.startsWith("http") ? "_blank" : undefined}>
        {inner}
      </Link>
    );
  }
  return inner;
}
