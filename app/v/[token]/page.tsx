import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

const BASE = "https://huanfalcao.com.br";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const trip = await fetchQuery(api.trips.getByShareToken, { token });
  if (!trip) return { title: "Roteiro não encontrado" };
  return {
    title: `${trip.title} • Roteiro compartilhado`,
    description: `Roteiro de ${trip.duration ?? "?"} dia(s) em ${trip.destination}. Veja a programação completa.`,
    robots: { index: false, follow: false },
    alternates: { canonical: `${BASE}/v/${token}` },
    openGraph: {
      title: `${trip.title} • Roteiro NordesteAÍ`,
      description: `Roteiro de ${trip.duration ?? "?"} dia(s) em ${trip.destination}.`,
      url: `${BASE}/v/${token}`,
      type: "website",
      images: [{ url: "/images/meta/img-meta.png", width: 1200, height: 630, alt: "NordesteAÍ - By Huan Falcão" }],
    },
  };
}

function formatDate(ts: number | undefined): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const TIME_LABEL: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  fullday: "Dia inteiro",
};

const KIND_LABEL: Record<string, string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  praia: "Praia",
  nightlife: "Vida noturna",
  dica: "Dica",
  activity: "Atividade",
};

const KIND_ICON: Record<string, string> = {
  tour: "compass",
  restaurant: "utensils",
  praia: "waves",
  nightlife: "moon-star",
  activity: "calendar",
  dica: "lightbulb",
};

const KIND_COLOR: Record<string, string> = {
  tour: "#2563EB",
  restaurant: "#EA580C",
  praia: "#0891B2",
  nightlife: "#7C3AED",
  activity: "#16A34A",
};

type Activity = {
  source: string;
  kind: string;
  timeOfDay: string;
  title: string;
  note?: string;
  itemId?: string;
  icon?: string;
  time?: string;
  customUrl?: string;
  osmLat?: number;
  osmLng?: number;
  osmAddress?: string;
  osmWebsite?: string;
};

type ItemData = {
  image?: string;
  title?: string;
  name?: string;
  slug?: string;
  shortDesc?: string;
  url?: string;
};

function resolveLinkHref(a: Activity, dbItem: ItemData | undefined): {
  href: string | null;
  external: boolean;
} {
  if (dbItem?.slug) {
    if (a.kind === "tour") return { href: `/passeios/${dbItem.slug}`, external: false };
    if (a.kind === "restaurant") return { href: `/restaurantes/${dbItem.slug}`, external: false };
    if (a.kind === "praia") return { href: `/praias/${dbItem.slug}`, external: false };
    if (a.kind === "nightlife") return { href: `/vida-noturna/${dbItem.slug}`, external: false };
    if (a.kind === "dica") return { href: `/dicas/${dbItem.slug}`, external: false };
  }
  if (a.source === "custom" && a.customUrl) {
    const url = /^https?:\/\//i.test(a.customUrl) ? a.customUrl : `https://${a.customUrl}`;
    return { href: url, external: true };
  }
  if (a.source === "osm" && typeof a.osmLat === "number" && typeof a.osmLng === "number") {
    const q = encodeURIComponent(`${a.title}@${a.osmLat},${a.osmLng}`);
    return { href: `https://www.google.com/maps/search/?api=1&query=${q}`, external: true };
  }
  return { href: null, external: false };
}

function ActivityCard({
  a,
  dbItem,
}: {
  a: Activity;
  dbItem: ItemData | undefined;
}) {
  const color = KIND_COLOR[a.kind] ?? "#323439";
  const kindLabel = KIND_LABEL[a.kind] ?? "Atividade";
  const isSuggestion = a.source === "suggestion";
  const isOsm = a.source === "osm";
  const isCustom = a.source === "custom";

  const displayTitle = dbItem?.title ?? dbItem?.name ?? a.title;
  const displayNote = dbItem?.shortDesc ?? (isOsm ? a.osmAddress : undefined) ?? a.note;
  const itemImage = dbItem?.image;

  const { href, external } = resolveLinkHref(a, dbItem);

  const inner = (
    <div className="relative flex overflow-hidden gap-3 w-full rounded-[16px] bg-white border border-[var(--color-neutral-200)] p-3 hover:border-[var(--color-neutral-800)] transition-colors">
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: color }}
      />
      <div className="ml-1 flex flex-1 gap-3 min-w-0">
        <div className="relative size-12 flex-none rounded-xl overflow-hidden bg-[var(--color-neutral-100)]">
          {itemImage ? (
            <Image
              src={toProxyUrl(itemImage)}
              alt={displayTitle}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Icon
                name={
                  isSuggestion
                    ? a.icon ?? "compass"
                    : isOsm
                      ? "map-pin"
                      : isCustom
                        ? "link"
                        : KIND_ICON[a.kind] ?? "compass"
                }
                size={20}
                className="text-[var(--color-neutral-800)]"
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] font-medium uppercase tracking-wide"
              style={{ color }}
            >
              {isCustom ? "Outro" : kindLabel}
            </span>
            <span className="text-[10px] text-[var(--color-neutral-500)]">·</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
              {TIME_LABEL[a.timeOfDay] ?? "Atividade"}
            </span>
            {isSuggestion && (
              <span className="text-[10px] font-medium text-[var(--color-neutral-500)] bg-[var(--color-neutral-100)] rounded-full px-2 py-0.5">
                sugestão
              </span>
            )}
            {isOsm && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                <Icon name="check-circle-2" size={10} />
                local real
              </span>
            )}
          </div>
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] mt-0.5">
            {displayTitle}
          </p>
          {displayNote && (
            <p className="text-[12px] leading-[1.4] text-[var(--color-neutral-600)] mt-1 line-clamp-2">
              {displayNote}
            </p>
          )}
        </div>
      </div>
      {a.time && (
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="rounded-full bg-[var(--color-neutral-100)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)]">
            {a.time}
          </span>
        </div>
      )}
    </div>
  );

  if (!href) return inner;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}

export default async function SharedTripPage({ params }: PageProps) {
  const { token } = await params;
  const trip = await fetchQuery(api.trips.getByShareToken, { token });
  if (!trip) return notFound();

  const startLabel = formatDate(trip.startDate);

  return (
    <main className="min-h-screen bg-white pb-32">
      {/* Brand bar */}
      <div className="bg-white border-b border-[var(--color-neutral-200)] px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/avatar.png"
            alt="NordesteAÍ"
            width={32}
            height={32}
            className="size-8 rounded-full object-cover bg-[var(--color-brand-yellow)]"
          />
          <span className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
            NordesteAÍ by Huan{" "}
            <span className="text-[var(--color-neutral-500)] font-normal">
              • Roteiro compartilhado
            </span>
          </span>
        </Link>
      </div>

      {/* Hero */}
      <section className="px-5 pt-8 max-w-screen-md mx-auto">
        <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-neutral-700)]">
          {trip.duration ?? "?"} dia(s) • {trip.destination}
        </p>
        <h1 className="mt-2 font-display font-medium text-[28px] leading-[1.15] text-[var(--color-neutral-800)]">
          {trip.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-[var(--color-neutral-700)]">
          {startLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={14} />
              {startLabel}
            </span>
          )}
          {trip.groupSize && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={14} />
              {trip.groupSize} pessoa(s)
            </span>
          )}
          {trip.budget && (
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Icon name="wallet" size={14} />
              {trip.budget}
            </span>
          )}
        </div>
      </section>

      {/* Days */}
      <section className="px-5 pt-8 max-w-screen-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
            Seu roteiro
          </h2>
        </div>

        {trip.itinerary.length === 0 ? (
          <p className="text-[14px] text-[var(--color-neutral-600)] bg-white rounded-2xl p-5 text-center border border-[var(--color-neutral-300)]">
            Esse roteiro ainda não tem dias programados.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {trip.itinerary
              .filter((d) => d.day <= (trip.duration ?? trip.itinerary.length))
              .map((day) => {
                const dayDate = trip.startDate
                  ? new Date(trip.startDate + (day.day - 1) * 86_400_000)
                  : null;
                return (
                  <div key={day.day} className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white font-display font-semibold text-[16px]">
                          {day.day}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                            Dia {day.day}
                          </p>
                          {day.theme && (
                            <p className="font-display font-medium text-[15px] leading-tight text-[var(--color-neutral-800)]">
                              {day.theme}
                            </p>
                          )}
                        </div>
                      </div>
                      {dayDate && (
                        <div className="flex flex-col items-center rounded-[14px] bg-neutral-100 px-3 py-1.5 shrink-0">
                          <span className="text-[10px] font-medium uppercase tracking-wide text-black/70">
                            {dayDate
                              .toLocaleDateString("pt-BR", { weekday: "short" })
                              .replace(".", "")}
                          </span>
                          <span className="font-display font-medium text-[16px] leading-none text-black">
                            {dayDate.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                            })}
                          </span>
                          <span className="text-[10px] font-medium text-black/70 mt-0.5">
                            {dayDate
                              .toLocaleDateString("pt-BR", { month: "short" })
                              .replace(".", "")}
                          </span>
                        </div>
                      )}
                    </div>

                    {day.activities.length === 0 ? (
                      <p className="text-[13px] text-[var(--color-neutral-500)]">
                        Sem atividades neste dia.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 pb-5">
                        {day.activities.map((raw, i) => {
                          const a = raw as Activity;
                          const dbItem =
                            a.source === "db" && a.itemId
                              ? trip.items?.[a.itemId]
                              : undefined;
                          return <ActivityCard key={i} a={a} dbItem={dbItem} />;
                        })}
                      </div>
                    )}

                    <hr className="border-[var(--color-neutral-200)]" />
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Sticky brand CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 px-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <Link
          href="/minha-viagem/criar"
          className="mx-auto max-w-screen-md flex items-center justify-between gap-3 rounded-full bg-[var(--color-neutral-800)] text-white pl-5 pr-2 py-2 shadow-lg hover:opacity-95 transition-opacity"
        >
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-display font-medium text-[14px]">
              Crie o seu roteiro também
            </span>
            <span className="text-[11px] text-white/80">
              Grátis, em 1 minuto, no NordesteAÍ
            </span>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white text-[var(--color-neutral-800)] px-3 py-2 text-[13px] font-medium">
            Começar
            <Icon name="arrow-right" size={14} />
          </span>
        </Link>
      </div>
    </main>
  );
}
