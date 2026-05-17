import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";
import { PraiaPhotosGrid } from "@/components/organisms/PraiaPhotosGrid";
import { BackButton } from "@/components/atoms/BackButton";

type PageProps = { params: Promise<{ slug: string }> };

function isMapsUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://");
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const p = await fetchQuery(api.praias.getBySlug, { slug });
  return { title: p ? `${p.name}, HUAN` : "Praia, HUAN" };
}

export default async function PraiaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const praia = await fetchQuery(api.praias.getBySlug, { slug });
  if (!praia) return notFound();

  return (
    <main className="min-h-screen bg-white pb-32">
      <GtmViewItem
        item_type="praia"
        item_id={praia._id}
        item_name={praia.name}
        item_city={praia.city ?? null}
        item_slug={praia.slug}
      />
      {/* ── Hero image ─────────────────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <Image
          src={toProxyUrl(praia.image)}
          alt={praia.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
        <div
          className="absolute left-4"
          style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <BackButton
            fallbackHref="/praias"
            className="grid size-10 place-items-center rounded-full bg-white/95 backdrop-blur-sm text-[var(--color-neutral-800)]"
          />
        </div>
        {(() => {
          const label = praia.city || (praia.location && !isMapsUrl(praia.location) ? praia.location : "");
          if (!label) return null;
          return (
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]">
              <Icon name="map-pin" size={12} />
              {label}
            </div>
          );
        })()}
      </div>

      {/* ── Maps CTA ───────────────────────────────────────────── */}
      {praia.location && isMapsUrl(praia.location) && (
        <section className="px-6 pt-6 max-w-screen-md mx-auto">
          <a
            href={praia.location}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white hover:border-[var(--color-neutral-800)] transition-colors"
          >
            <div className="grid size-10 place-items-center rounded-full bg-[var(--color-brand-yellow)] shrink-0">
              <Icon name="map-pin" size={18} className="text-[var(--color-neutral-800)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                Ver localização
              </p>
              <p className="text-[12px] text-[var(--color-neutral-600)]">
                Abrir no Google Maps
              </p>
            </div>
            <Icon name="external-link" size={16} className="text-[var(--color-neutral-600)]" />
          </a>
        </section>
      )}

      {/* ── Title + description ────────────────────────────────── */}
      <section className="px-6 pt-6 max-w-screen-md mx-auto">
        <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)]">
          {praia.name}
        </h1>
        <p className="text-[14px] leading-[1.55] text-[var(--color-neutral-600)] mt-2">
          {praia.shortDesc}
        </p>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      {praia.features && praia.features.length > 0 && (
        <section className="px-6 pt-6 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Características
          </h2>
          <div className="flex flex-wrap gap-2">
            {praia.features.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-100)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]"
              >
                {f}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Full description ───────────────────────────────────── */}
      {praia.description && (
        <section className="px-6 pt-6 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Sobre a praia
          </h2>
          <p className="text-[14px] leading-[1.65] text-[var(--color-neutral-700)] whitespace-pre-line">
            {praia.description}
          </p>
        </section>
      )}

      {/* ── Photo gallery ──────────────────────────────────────── */}
      {praia.photos && praia.photos.length > 0 && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Fotos
          </h2>
          <PraiaPhotosGrid photos={praia.photos} alt={`Foto de ${praia.name}`} />
        </section>
      )}
    </main>
  );
}
