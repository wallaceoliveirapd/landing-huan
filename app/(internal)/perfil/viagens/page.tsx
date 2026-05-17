"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { TRIP_LIMIT } from "@/app/(internal)/minha-viagem/criar/page";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planejando: { label: "Planejando", color: "bg-amber-50 text-amber-700" },
  confirmada: { label: "Confirmada", color: "bg-emerald-50 text-emerald-700" },
  realizada: { label: "Realizada", color: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]" },
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

export default function MinhasViagensPage() {
  const auth = useAuth();
  const trips = useQuery(api.trips.myTrips);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  const loading = trips === undefined;
  const used = trips?.length;
  const remaining = used === undefined ? TRIP_LIMIT : Math.max(TRIP_LIMIT - used, 0);
  const subtitle = loading
    ? "Carregando suas viagens…"
    : `${used} de ${TRIP_LIMIT} viagens criadas.`;

  return (
    <SettingsLayout
      title="Minhas viagens"
      subtitle={subtitle}
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        {/* Create new, only show when we know the count */}
        {!loading && remaining > 0 && (
          <Link
            href="/minha-viagem/criar"
            className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-300)] bg-white hover:border-[var(--color-neutral-800)] transition-colors"
          >
            <div className="grid size-10 place-items-center rounded-full border border-[var(--color-neutral-200)]">
              <Icon name="plus" size={18} className="text-[var(--color-neutral-800)]" />
            </div>
            <div className="flex-1">
              <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                Criar nova viagem
              </p>
              <p className="text-[12px] text-[var(--color-neutral-600)]">
                {remaining === 1 ? "Você pode criar mais 1 viagem" : `Você pode criar mais ${remaining} viagens`}
              </p>
            </div>
            <Icon name="chevron-right" size={16} className="text-[var(--color-neutral-500)]" />
          </Link>
        )}

        {/* Loading */}
        {trips === undefined && (
          <div className="flex flex-col gap-3 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="h-[80px] rounded-[16px] bg-[var(--color-neutral-100)]" />
            ))}
          </div>
        )}

        {/* Empty */}
        {trips !== undefined && trips.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Icon name="map" size={36} className="text-[var(--color-neutral-400)]" />
            <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
              Nenhuma viagem ainda
            </p>
            <p className="text-[12px] text-[var(--color-neutral-600)] max-w-[260px]">
              Crie sua primeira viagem e a gente monta um roteiro pra você.
            </p>
          </div>
        )}

        {/* Trips list */}
        {trips?.map((t) => {
          const status = STATUS_LABELS[t.status] ?? STATUS_LABELS.planejando;
          return (
            <Link
              key={t._id}
              href={`/minha-viagem/${t._id}`}
              className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white hover:border-[var(--color-neutral-800)] transition-colors"
            >
              <div className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)]">
                <Icon
                  name="map-pin"
                  size={18}
                  className="text-[var(--color-neutral-800)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] truncate">
                  {t.title}
                </p>
                <p className="text-[12px] text-[var(--color-neutral-600)] truncate">
                  {t.destination} · {TRIP_TYPE_LABEL[t.type] ?? t.type} · {t.duration ?? 3}{" "}
                  {(t.duration ?? 3) === 1 ? "dia" : "dias"}
                </p>
              </div>
              <span
                className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${status.color}`}
              >
                {status.label}
              </span>
            </Link>
          );
        })}
      </div>
    </SettingsLayout>
  );
}
