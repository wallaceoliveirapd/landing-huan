"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";
import { logAndGetMessage } from "@/lib/errors";
import dynamic from "next/dynamic";
import { gtmTripViewed } from "@/lib/gtm";
import { NORDESTE_CITIES } from "@/lib/nordeste-cities";

/**
 * Some legacy trips were created before lat/lng were captured (or got
 * persisted as 0). Falling back to (0, 0) drops the pin in the Atlantic
 * Ocean. Look up coords from the destination string when needed.
 */
function resolveCoords(
  destination: string,
  lat: number | undefined,
  lng: number | undefined,
): { lat: number; lng: number } {
  if (typeof lat === "number" && typeof lng === "number" && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  const cityName = (destination ?? "").split(",")[0].trim().toLowerCase();
  const match = NORDESTE_CITIES.find((c) => c.name.toLowerCase() === cityName);
  if (match) return { lat: match.lat, lng: match.lng };
  // Final fallback: João Pessoa (project's default content city)
  return { lat: -7.1195, lng: -34.845 };
}

const MapView = dynamic(
  () => import("@/components/molecules/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[180px] rounded-[20px] bg-[var(--color-neutral-100)] animate-pulse" />
    ),
  },
);

// ─── Time-of-day label ─────────────────────────────────────────────────────
const TIME_LABEL: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  fullday: "Dia inteiro",
};

const TIME_ICON: Record<string, string> = {
  morning: "sunrise",
  afternoon: "sun",
  evening: "moon-star",
  fullday: "compass",
};

const KIND_COLOR: Record<string, string> = {
  tour: "#2563EB",
  restaurant: "#EA580C",
  praia: "#0891B2",
  nightlife: "#7C3AED",
  activity: "#16A34A",
};

const KIND_LABEL: Record<string, string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  praia: "Praia",
  nightlife: "Vida noturna",
  activity: "Atividade",
};

const TRIP_TYPE_LABEL: Record<string, string> = {
  praia: "Praia",
  historica: "Cidade histórica",
  natureza: "Natureza",
  aventura: "Aventura",
  gastronomia: "Gastronomia",
  festa: "Festa",
  roadtrip: "Road trip",
  familia: "Família",
  solo: "Solo",
  cultural: "Cultural",
};

type ActivityCardProps = {
  source: string;
  kind: string;
  title: string;
  note?: string;
  timeOfDay: string;
  icon?: string;
  dbItem?: { name?: unknown; title?: unknown; shortDesc?: unknown; image?: unknown; cover?: unknown; url?: unknown; slug?: unknown; affiliateUrl?: unknown } | undefined;
  // OSM enrichment (only present when source = "osm")
  osmLat?: number;
  osmLng?: number;
  osmAddress?: string;
  osmWebsite?: string;
};

function ActivityCard({
  source,
  kind,
  title,
  note,
  timeOfDay,
  icon,
  dbItem,
  osmLat,
  osmLng,
  osmAddress,
  osmWebsite,
}: ActivityCardProps) {
  const color = KIND_COLOR[kind] ?? "#323439";
  const kindLabel = KIND_LABEL[kind] ?? "Atividade";
  const isSuggestion = source === "suggestion";
  const isOsm = source === "osm";

  // Resolve display title: prefer DB item title, else activity title
  const displayTitle =
    (dbItem?.title as string | undefined) ?? (dbItem?.name as string | undefined) ?? title;

  // Resolve display note: DB shortDesc > OSM address > activity note
  const displayNote =
    (dbItem?.shortDesc as string | undefined) ?? (isOsm ? osmAddress : undefined) ?? note;

  // Primary link target:
  //   db → DB detail page or external URL
  //   osm → Google Maps search by lat/lng (always opens externally)
  //   suggestion → no link
  const linkHref = (() => {
    if (dbItem) {
      if (kind === "tour") return dbItem.url as string | undefined;
      if (kind === "restaurant" && dbItem.slug) return `/restaurantes/${dbItem.slug}`;
      if (kind === "praia" && dbItem.slug) return `/praias/${dbItem.slug}`;
      if (kind === "nightlife" && dbItem.slug) return `/vida-noturna/${dbItem.slug}`;
    }
    if (isOsm && typeof osmLat === "number" && typeof osmLng === "number") {
      const q = encodeURIComponent(`${displayTitle}@${osmLat},${osmLng}`);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    return undefined;
  })();

  const isExternal = !!linkHref?.startsWith("http");
  const Container = linkHref ? "a" : "div";

  return (
    <Container
      href={linkHref}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="relative flex gap-3 w-full rounded-[16px] bg-white border border-[var(--color-neutral-200)] p-3 hover:border-[var(--color-neutral-800)] transition-colors"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[16px]"
        style={{ backgroundColor: color }}
      />
      <div className="ml-1 grid size-12 flex-none place-items-center rounded-xl bg-[var(--color-neutral-100)]">
        <Icon
          name={
            isSuggestion
              ? icon ?? "compass"
              : isOsm
              ? "map-pin"
              : TIME_ICON[timeOfDay] ?? "compass"
          }
          size={20}
          className="text-[var(--color-neutral-800)]"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-medium uppercase tracking-wide"
            style={{ color }}
          >
            {kindLabel}
          </span>
          <span className="text-[10px] text-[var(--color-neutral-500)]">·</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            {TIME_LABEL[timeOfDay] ?? "Atividade"}
          </span>
          {isSuggestion && (
            <span className="ml-auto text-[10px] font-medium text-[var(--color-neutral-500)] bg-[var(--color-neutral-100)] rounded-full px-2 py-0.5">
              sugestão
            </span>
          )}
          {isOsm && (
            <span className="ml-auto text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
              <Icon name="check-circle-2" size={10} />
              local real
            </span>
          )}
        </div>
        <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] mt-0.5 line-clamp-2">
          {displayTitle}
        </p>
        {displayNote && (
          <p className="text-[12px] leading-[1.4] text-[var(--color-neutral-600)] mt-1 line-clamp-2">
            {displayNote}
          </p>
        )}
        {/* OSM website link (secondary) */}
        {isOsm && osmWebsite && (
          <a
            href={osmWebsite}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-neutral-700)] underline underline-offset-2"
          >
            <Icon name="globe" size={11} />
            Site oficial
          </a>
        )}
      </div>
      {linkHref && (
        <Icon
          name={isExternal ? "external-link" : "chevron-right"}
          size={14}
          className="text-[var(--color-neutral-500)] shrink-0 self-center"
        />
      )}
    </Container>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const auth = useAuth();
  const { id: idStr } = use(params);
  const tripId = idStr as Id<"trips">;

  const trip = useQuery(api.trips.getById, { id: tripId });
  const resolvedItems = useQuery(api.trips.resolveItineraryItems, { tripId });
  const generateItinerary = useAction(api.itineraryGen.generate);
  const removeTrip = useMutation(api.trips.remove);

  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  // GTM: fire trip_viewed once when trip data loads
  useEffect(() => {
    if (!trip) return;
    gtmTripViewed({
      trip_type: trip.type,
      trip_city: trip.destination,
      trip_duration: trip.duration ?? 3,
    });
  }, [trip?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for itinerary if it's still loading (action runs in background)
  const itineraryReady = !!trip?.itinerary && trip.itinerary.length > 0;

  if (trip === undefined) {
    return <TripDetailSkeleton />;
  }

  if (trip === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Icon name="search-x" size={48} className="text-[var(--color-neutral-400)]" />
        <p className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
          Viagem não encontrada
        </p>
        <button
          type="button"
          onClick={() => router.push("/perfil")}
          className="mt-2 rounded-full bg-[var(--color-neutral-800)] px-5 py-2.5 font-display font-medium text-[14px] text-white"
        >
          Voltar ao perfil
        </button>
      </div>
    );
  }

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    try {
      await generateItinerary({ tripId });
      toast.success("Roteiro atualizado!");
    } catch (err) {
      toast.error(logAndGetMessage("trip.regenerate", err, "Não consegui regenerar o roteiro."));
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    if (!confirm("Excluir essa viagem? Essa ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      await removeTrip({ id: tripId });
      router.push("/perfil");
    } catch (err) {
      toast.error(logAndGetMessage("trip.delete", err, "Não consegui excluir a viagem."));
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.06, 0.04)}
      className="min-h-screen bg-white pb-32"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
      >
        <button
          type="button"
          onClick={() => router.push("/perfil")}
          aria-label="Voltar"
          className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)]"
        >
          <Icon name="arrow-left" size={18} className="text-[var(--color-neutral-800)]" />
        </button>
        <span className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
          Detalhes da viagem
        </span>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Excluir viagem"
          className="ml-auto grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] disabled:opacity-50"
          disabled={deleting}
        >
          <Icon name="trash-2" size={16} className="text-[var(--color-neutral-800)]" />
        </button>
      </div>

      {/* ── Map preview ────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-5 pt-2">
        <div className="rounded-[20px] overflow-hidden bg-[var(--color-neutral-100)]">
          {(() => {
            const coords = resolveCoords(trip.destination, trip.lat, trip.lng);
            return (
              <MapView
                lat={coords.lat}
                lng={coords.lng}
                zoom={11}
                label={trip.destination.split(",")[0]}
                staticView
                className="h-[200px] !rounded-none"
              />
            );
          })()}
        </div>
      </motion.div>

      {/* ── Title + meta ───────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-5 pt-5 flex flex-col gap-1.5">
        <h1 className="font-display font-medium text-[24px] leading-[1.2] text-[var(--color-neutral-800)]">
          {trip.title}
        </h1>
        <p className="text-[13px] text-[var(--color-neutral-600)] inline-flex items-center gap-1.5">
          <Icon name="map-pin" size={14} className="text-[var(--color-neutral-500)]" />
          {trip.destination}
        </p>
      </motion.div>

      {/* ── Quick info pills ───────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-5 pt-4">
        <div className="flex flex-wrap gap-2">
          <InfoPill icon="compass" label={TRIP_TYPE_LABEL[trip.type] ?? trip.type} />
          <InfoPill
            icon="calendar-days"
            label={`${trip.duration ?? 3} ${(trip.duration ?? 3) === 1 ? "dia" : "dias"}`}
          />
          <InfoPill
            icon="users"
            label={`${trip.groupSize ?? 2} ${(trip.groupSize ?? 2) === 1 ? "pessoa" : "pessoas"}`}
          />
          {trip.budget && (
            <InfoPill
              icon="wallet"
              label={
                trip.budget === "baixo"
                  ? "Econômico"
                  : trip.budget === "alto"
                  ? "Confortável"
                  : "Moderado"
              }
            />
          )}
        </div>
      </motion.div>

      {/* ── Itinerary section ──────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
            Seu roteiro
          </h2>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-100)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)] disabled:opacity-50"
          >
            <Icon name="refresh-cw" size={12} />
            {regenerating ? "Gerando..." : "Refazer"}
          </button>
        </div>

        {!itineraryReady && !regenerating && (
          <ItineraryLoading />
        )}

        {regenerating && <ItineraryLoading />}

        {itineraryReady && !regenerating && (
          <div className="flex flex-col gap-6">
            {trip.itinerary!.map((day) => (
              <div key={day.day} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[13px]">
                    {day.day}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                      Dia {day.day}
                    </p>
                    <p className="font-display font-medium text-[15px] leading-tight text-[var(--color-neutral-800)]">
                      {day.theme}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pl-12">
                  {day.activities.map((a, idx) => (
                    <ActivityCard
                      key={`${day.day}-${idx}`}
                      source={a.source}
                      kind={a.kind}
                      title={a.title}
                      note={a.note}
                      timeOfDay={a.timeOfDay}
                      icon={a.icon}
                      dbItem={
                        a.source === "db" && a.itemId
                          ? (resolvedItems as Record<string, Record<string, unknown>> | undefined)?.[a.itemId]
                          : undefined
                      }
                      osmLat={a.osmLat}
                      osmLng={a.osmLng}
                      osmAddress={a.osmAddress}
                      osmWebsite={a.osmWebsite}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Notes section ──────────────────────────────────── */}
      {trip.notes && (
        <motion.div variants={fadeUp} className="px-5 pt-8">
          <h2 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)] mb-2">
            Anotações
          </h2>
          <p className="text-[14px] leading-[1.5] text-[var(--color-neutral-700)]">
            {trip.notes}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Small bits ────────────────────────────────────────────────────────────
function InfoPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-100)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]">
      <Icon name={icon} size={12} className="text-[var(--color-neutral-700)]" />
      {label}
    </div>
  );
}

function ItineraryLoading() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1].map((d) => (
        <div key={d} className="flex flex-col gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-[var(--color-neutral-100)]" />
            <div className="flex flex-col gap-1.5">
              <div className="h-2.5 w-16 rounded-full bg-[var(--color-neutral-100)]" />
              <div className="h-3.5 w-32 rounded-full bg-[var(--color-neutral-100)]" />
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-12">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[88px] rounded-[16px] bg-[var(--color-neutral-100)]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-32 animate-pulse">
      <div
        className="flex items-center gap-3 px-5 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
      >
        <div className="size-10 rounded-full bg-[var(--color-neutral-100)]" />
        <div className="h-4 w-32 rounded-full bg-[var(--color-neutral-100)]" />
      </div>
      <div className="px-5 pt-2">
        <div className="h-[200px] rounded-[20px] bg-[var(--color-neutral-100)]" />
      </div>
      <div className="px-5 pt-5 flex flex-col gap-2">
        <div className="h-6 w-48 rounded-full bg-[var(--color-neutral-100)]" />
        <div className="h-3 w-32 rounded-full bg-[var(--color-neutral-100)]" />
      </div>
      <div className="px-5 pt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-[var(--color-neutral-100)]" />
        ))}
      </div>
    </div>
  );
}
