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
  const n = await fetchQuery(api.nightlife.getBySlug, { slug });
  return { title: n ? `${n.name}, HUAN` : "Vida noturna, HUAN" };
}

const DAY_NAMES: Record<string, string> = {
  monday: "Segunda", tuesday: "Terça", wednesday: "Quarta", thursday: "Quinta",
  friday: "Sexta", saturday: "Sábado", sunday: "Domingo",
  segunda: "Segunda", terca: "Terça", "terça": "Terça", quarta: "Quarta",
  quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", "sábado": "Sábado",
  domingo: "Domingo",
};

export default async function NightlifeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const place = await fetchQuery(api.nightlife.getBySlug, { slug });
  if (!place) return notFound();

  return (
    <main className="min-h-screen bg-white pb-32">
      <GtmViewItem
        item_type="nightlife"
        item_id={place._id}
        item_name={place.name}
        item_city={place.city ?? null}
        item_category={place.type}
        item_slug={place.slug}
      />
      {/* ── Hero ──────────────────────────────────────────────── */}
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
        <Link
          href="/vida-noturna"
          aria-label="Voltar"
          className="absolute left-4 grid size-10 place-items-center rounded-full bg-white/95 backdrop-blur-sm"
          style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
        >
          <Icon name="arrow-left" size={18} className="text-[var(--color-neutral-800)]" />
        </Link>
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]">
          {place.type}
        </div>
      </div>

      {/* ── Title + description ─────────────────────────────── */}
      <section className="px-6 pt-6 max-w-screen-md mx-auto">
        <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)]">
          {place.name}
        </h1>
        <p className="text-[14px] leading-[1.55] text-[var(--color-neutral-600)] mt-2">
          {place.shortDesc}
        </p>
      </section>

      {/* ── Quick info rows ──────────────────────────────────── */}
      <section className="px-6 pt-6 max-w-screen-md mx-auto flex flex-col gap-2">
        {place.address && (
          <InfoRow icon="map-pin" label="Endereço" value={place.address} />
        )}
        {place.phone && (
          <InfoRow icon="phone" label="Telefone" value={place.phone} href={`tel:${place.phone}`} />
        )}
        {place.instagram && (
          <InfoRow
            icon="instagram"
            label="Instagram"
            value={`@${place.instagram.replace(/^@/, "")}`}
            href={`https://instagram.com/${place.instagram.replace(/^@/, "")}`}
          />
        )}
      </section>

      {/* ── Hours ─────────────────────────────────────────────── */}
      {place.hours && place.hours.length > 0 && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Horário de funcionamento
          </h2>
          <div className="rounded-[16px] border border-[var(--color-neutral-200)] overflow-hidden">
            {place.hours.map((h, i) => (
              <div
                key={`${h.day}-${i}`}
                className={`flex items-center justify-between px-4 py-3 text-[14px] ${
                  i !== place.hours.length - 1 ? "border-b border-[var(--color-neutral-100)]" : ""
                }`}
              >
                <span className="font-display font-medium text-[var(--color-neutral-800)]">
                  {DAY_NAMES[h.day.toLowerCase()] ?? h.day}
                </span>
                <span className="text-[var(--color-neutral-600)]">
                  {h.open && h.close ? `${h.open} – ${h.close}` : "Fechado"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Description ──────────────────────────────────────── */}
      {place.description && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Sobre o lugar
          </h2>
          <p className="text-[14px] leading-[1.65] text-[var(--color-neutral-700)] whitespace-pre-line">
            {place.description}
          </p>
        </section>
      )}

      {/* ── Photo gallery ────────────────────────────────────── */}
      {place.photos && place.photos.length > 0 && (
        <section className="px-6 pt-8 max-w-screen-md mx-auto">
          <h2 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
            Fotos
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {place.photos.slice(0, 6).map((src) => (
              <div
                key={src}
                className="relative aspect-square overflow-hidden rounded-[16px] bg-[var(--color-neutral-100)]"
              >
                <Image
                  src={toProxyUrl(src)}
                  alt={`Foto de ${place.name}`}
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
