import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
import { GtmViewItem } from "@/components/atoms/GtmViewItem";

type PageProps = { params: Promise<{ slug: string }> };

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
        <Link
          href="/praias"
          aria-label="Voltar"
          className="absolute top-4 left-4 grid size-10 place-items-center rounded-full bg-white/95 backdrop-blur-sm"
        >
          <Icon name="arrow-left" size={18} className="text-[var(--color-neutral-800)]" />
        </Link>
        {praia.location && (
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]">
            <Icon name="map-pin" size={12} />
            {praia.location}
          </div>
        )}
      </div>

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
          <div className="grid grid-cols-2 gap-2">
            {praia.photos.slice(0, 6).map((src) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden rounded-[16px] bg-[var(--color-neutral-100)]"
              >
                <Image
                  src={toProxyUrl(src)}
                  alt={`Foto de ${praia.name}`}
                  fill
                  sizes="(min-width: 768px) 350px, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
