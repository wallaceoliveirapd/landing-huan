"use client";

import React, { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/atoms/Icon";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";
import { logAndGetMessage } from "@/lib/errors";
import dynamic from "next/dynamic";
import { gtmTripViewed } from "@/lib/gtm";
import { NORDESTE_CITIES } from "@/lib/nordeste-cities";
import { AddActivitySheet } from "@/components/organisms/AddActivitySheet";
import { EditTripSheet } from "@/components/organisms/EditTripSheet";
import { TripWeatherCard } from "@/components/organisms/TripWeatherCard";

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
  tripId: Id<"trips">;
  day: number;
  index: number;
  source: string;
  kind: string;
  title: string;
  note?: string;
  timeOfDay: string;
  time?: string;
  customUrl?: string;
  icon?: string;
  dbItem?: { name?: unknown; title?: unknown; shortDesc?: unknown; image?: unknown; cover?: unknown; url?: unknown; slug?: unknown; affiliateUrl?: unknown } | undefined;
  osmLat?: number;
  osmLng?: number;
  osmAddress?: string;
  osmWebsite?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

function ActivityCard({
  tripId,
  day,
  index,
  source,
  kind,
  title,
  note,
  timeOfDay,
  time,
  customUrl,
  icon,
  dbItem,
  osmLat,
  osmLng,
  osmAddress,
  osmWebsite,
  dragHandleProps,
}: ActivityCardProps) {
  const router = useRouter();
  const setActivityTime = useMutation(api.trips.setActivityTime);
  const removeActivity = useMutation(api.trips.removeActivity);
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
  //   custom → customUrl
  //   suggestion → no link
  const linkHref = (() => {
    if (dbItem) {
      if (kind === "tour" && dbItem.slug) return `/passeios/${dbItem.slug}`;
      if (kind === "restaurant" && dbItem.slug) return `/restaurantes/${dbItem.slug}`;
      if (kind === "praia" && dbItem.slug) return `/praias/${dbItem.slug}`;
      if (kind === "nightlife" && dbItem.slug) return `/vida-noturna/${dbItem.slug}`;
      if (kind === "dica" && dbItem.slug) return `/dicas/${dbItem.slug}`;
    }
    if (source === "custom" && customUrl) return customUrl;
    if (isOsm && typeof osmLat === "number" && typeof osmLng === "number") {
      const q = encodeURIComponent(`${displayTitle}@${osmLat},${osmLng}`);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    return undefined;
  })();

  const isExternal = !!linkHref?.startsWith("http");
  function handleNavigate() {
    if (!linkHref) return;
    if (isExternal) {
      window.open(linkHref, "_blank", "noopener,noreferrer");
    } else {
      router.push(linkHref);
    }
  }

  return (
    <div className="relative flex overflow-hidden gap-3 w-full rounded-[16px] bg-white border border-[var(--color-neutral-200)] p-3 hover:border-[var(--color-neutral-800)] transition-colors">
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[px]"
        style={{ backgroundColor: color }}
      />
      <div
        role={linkHref ? "button" : undefined}
        tabIndex={linkHref ? 0 : undefined}
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (linkHref && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleNavigate();
          }
        }}
        className={`ml-1 flex flex-1 gap-3 min-w-0 ${linkHref ? "cursor-pointer" : ""}`}
      >
        <div className="grid size-12 flex-none place-items-center rounded-xl bg-[var(--color-neutral-100)]">
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
          <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] mt-0.5 line-clamp-2">
            {displayTitle}
          </p>
          {displayNote && (
            <p className="text-[12px] leading-[1.4] text-[var(--color-neutral-600)] mt-1 line-clamp-2">
              {displayNote}
            </p>
          )}
          {isOsm && osmWebsite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(osmWebsite, "_blank", "noopener,noreferrer");
              }}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-neutral-700)] underline underline-offset-2"
            >
              <Icon name="globe" size={11} />
              Site oficial
            </button>
          )}
        </div>
      </div>

      {/* Right rail: drag handle + time pill + trash button + chevron. Outside the
          click-to-navigate area, so they never collide with it. */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="grid size-7 place-items-center rounded-full text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-700)] cursor-grab active:cursor-grabbing touch-none"
            title="Arrastar para reordenar"
          >
            <Icon name="grip-vertical" size={14} />
          </div>
        )}
        <label
          title={time ? "Mudar horário" : "Definir horário"}
          className="relative inline-flex items-center gap-1 h-7 px-2 rounded-full bg-white border-[1px] border-neutral-200 cursor-pointer hover:brightness-95 transition"
        >
          <Icon name="clock" size={11} className="text-[var(--color-neutral-800)]" />
          <span className="text-[10px] font-medium text-[var(--color-neutral-800)]">
            {time ? time : "Horário"}
          </span>
          <input
            type="time"
            value={time ?? ""}
            onChange={(e) => {
              setActivityTime({ tripId, day, index, time: e.target.value });
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Remover do roteiro"
            onClick={async () => {
              if (!confirm(`Remover "${displayTitle}" do roteiro? Essa ação não pode ser desfeita.`)) return;
              try {
                await removeActivity({ tripId, day, index });
              } catch (err) {
                console.error(err);
              }
            }}
            className="inline-flex items-center justify-center size-7 rounded-full bg-white border border-[var(--color-neutral-300)] hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Icon name="trash-2" size={11} />
          </button>
          {linkHref && (
            <button
              type="button"
              onClick={handleNavigate}
              aria-label="Ver detalhes"
              className="inline-flex items-center justify-center size-7 rounded-full bg-white border border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-800)] transition-colors"
            >
              <Icon
                name={isExternal ? "external-link" : "chevron-right"}
                size={11}
                className="text-[var(--color-neutral-700)]"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sortable wrapper ─────────────────────────────────────────────────────
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

function SortableActivityCard({
  id,
  tripId,
  day,
  index,
  activity,
  dbItem,
}: {
  id: number;
  tripId: Id<"trips">;
  day: number;
  index: number;
  activity: Activity;
  dbItem?: Record<string, unknown>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
      }}
    >
      <ActivityCard
        tripId={tripId}
        day={day}
        index={index}
        source={activity.source}
        kind={activity.kind}
        title={activity.title}
        note={activity.note}
        timeOfDay={activity.timeOfDay}
        time={activity.time}
        customUrl={activity.customUrl}
        icon={activity.icon}
        dbItem={dbItem}
        osmLat={activity.osmLat}
        osmLng={activity.osmLng}
        osmAddress={activity.osmAddress}
        osmWebsite={activity.osmWebsite}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
      />
    </div>
  );
}

function DayActivities({
  tripId,
  dayNum,
  initialActivities,
  resolvedItems,
  onAddSheet,
}: {
  tripId: Id<"trips">;
  dayNum: number;
  initialActivities: Activity[];
  resolvedItems: Record<string, Record<string, unknown>> | undefined;
  onAddSheet: () => void;
}) {
  const reorderActivities = useMutation(api.trips.reorderActivities);
  const [items, setItems] = useState<Activity[]>(initialActivities);

  useEffect(() => {
    setItems(initialActivities);
  }, [initialActivities]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = active.id as number;
    const newIndex = over.id as number;
    const newOrder = arrayMove(items, oldIndex, newIndex);
    setItems(newOrder);
    reorderActivities({ tripId, day: dayNum, activities: newOrder });
  }

  const hasAnyTime = items.some((a) => a.time);

  function handleSortByTime() {
    const sorted = [...items].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
    setItems(sorted);
    reorderActivities({ tripId, day: dayNum, activities: sorted });
  }

  return (
    <div className="flex flex-col gap-2">
      {hasAnyTime && (
        <button
          type="button"
          onClick={handleSortByTime}
          className="self-start inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-100)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)] transition-colors"
        >
          <Icon name="arrow-up-narrow-wide" size={12} />
          Ordenar por horário
        </button>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((_, i) => i)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((a, idx) => (
            <SortableActivityCard
              key={`${dayNum}-${idx}`}
              id={idx}
              tripId={tripId}
              day={dayNum}
              index={idx}
              activity={a}
              dbItem={
                a.source === "db" && a.itemId
                  ? resolvedItems?.[a.itemId]
                  : undefined
              }
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={onAddSheet}
        className="self-start inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-neutral-300)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-800)] hover:text-[var(--color-neutral-800)] transition-colors"
      >
        <Icon name="plus" size={12} />
        Adicionar ao dia {dayNum}
      </button>
    </div>
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
  const [addSheetDay, setAddSheetDay] = useState<number | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

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
          onClick={() => setEditSheetOpen(true)}
          aria-label="Editar viagem"
          className="ml-auto grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)]"
        >
          <Icon name="pencil" size={16} className="text-[var(--color-neutral-800)]" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Excluir viagem"
          className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] disabled:opacity-50"
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

      <TripWeatherCard
        tripId={tripId}
        startDate={trip.startDate}
        snapshot={trip.weatherSnapshot ?? null}
      />

      {/* ── Itinerary section ──────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
            Seu roteiro
          </h2>
        </div>

        {!itineraryReady && !regenerating && (
          <ItineraryLoading />
        )}

        {regenerating && <ItineraryLoading />}

        {itineraryReady && !regenerating && (
          <div className="flex flex-col gap-6">
            {trip.itinerary!.filter((d) => d.day <= (trip.duration ?? trip.itinerary!.length)).map((day) => {
              const dayDate = trip.startDate
                ? new Date(trip.startDate + (day.day - 1) * 86400000)
                : null;
              return (
                <div key={day.day} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[14px]">
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
                    {dayDate && (
                      <div className="flex flex-col items-center rounded-[14px] bg-neutral-100 px-3 py-1.5 shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-black/70">
                          {dayDate.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                        </span>
                        <span className="font-display font-medium text-[16px] leading-none text-black">
                          {dayDate.toLocaleDateString("pt-BR", { day: "2-digit" })}
                        </span>
                        <span className="text-[10px] font-medium text-black/70 mt-0.5">
                          {dayDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pl-12">
                    <DayActivities
                      tripId={tripId}
                      dayNum={day.day}
                      initialActivities={day.activities}
                      resolvedItems={resolvedItems as Record<string, Record<string, unknown>> | undefined}
                      onAddSheet={() => setAddSheetDay(day.day)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AddActivitySheet
        open={addSheetDay !== null}
        tripId={tripId}
        day={addSheetDay ?? 1}
        city={trip.destination.split(",")[0].trim()}
        onClose={() => setAddSheetDay(null)}
      />

      <EditTripSheet
        open={editSheetOpen}
        tripId={tripId}
        initialDuration={trip.duration ?? 3}
        initialGroupSize={trip.groupSize ?? 2}
        initialBudget={trip.budget ?? "medio"}
        initialStartDate={trip.startDate}
        onClose={() => setEditSheetOpen(false)}
      />

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
