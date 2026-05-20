"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax?: number;
  weatherCode: number;
}

interface Snapshot {
  mode: string;
  fetchedAt: number;
  days: WeatherDay[];
  summary?: {
    avgTempMax: number;
    avgTempMin: number;
    rainyDayCount: number;
    dominantCode: number;
  };
}

interface Props {
  tripId: Id<"trips">;
  startDate?: number;
  snapshot?: Snapshot | null;
}

// WMO weather code → label + lucide icon name.
// https://open-meteo.com/en/docs#weathervariables
function codeMeta(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Céu limpo", icon: "sun" };
  if (code <= 3) return { label: "Parcialmente nublado", icon: "cloud-sun" };
  if (code === 45 || code === 48) return { label: "Neblina", icon: "cloud-fog" };
  if (code >= 51 && code <= 57) return { label: "Chuvisco", icon: "cloud-drizzle" };
  if (code >= 61 && code <= 67) return { label: "Chuva", icon: "cloud-rain" };
  if (code >= 71 && code <= 77) return { label: "Neve", icon: "cloud-snow" };
  if (code >= 80 && code <= 82) return { label: "Aguaceiros", icon: "cloud-rain" };
  if (code === 95) return { label: "Tempestade", icon: "cloud-lightning" };
  if (code >= 96) return { label: "Tempestade c/ granizo", icon: "cloud-lightning" };
  return { label: "Variado", icon: "cloud" };
}

function rainIntensity(mm: number): string {
  if (mm < 0.2) return "Sem chuva";
  if (mm < 2) return "Chuvisco leve";
  if (mm < 10) return "Chuva moderada";
  return "Chuva forte";
}

function formatDate(iso: string) {
  // iso: "YYYY-MM-DD" — interpret as local to avoid TZ drift.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  }).replace(".", "");
}

function packingHint(avgMax: number, avgMin: number, rainy: boolean): string {
  if (avgMax >= 28 && !rainy) {
    return "Roupas leves, protetor solar, e garrafa de água sempre.";
  }
  if (avgMax >= 24 && rainy) {
    return "Roupa leve durante o dia + capa de chuva ou guarda-chuva pra emergências.";
  }
  if (avgMax >= 20) {
    return "Roupas leves, mas leva um casaquinho pras noites.";
  }
  return "Pode ser fresco: casaco e calça comprida nas noites.";
}

export function TripWeatherCard({ tripId, startDate, snapshot }: Props) {
  const refresh = useAction(api.weather.refresh);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const autoTriedRef = useRef(false);

  async function runRefresh(force = false) {
    setLoading(true);
    setFailed(false);
    try {
      const res = await refresh({ tripId, force });
      if (!res.ok) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  // Auto-trigger ONCE when missing or stale (> 7 days). Weather updates
  // infrequently so we don't burn API calls on every visit.
  useEffect(() => {
    if (!startDate) return;
    if (autoTriedRef.current) return;
    const stale =
      !snapshot || Date.now() - snapshot.fetchedAt > 7 * 24 * 60 * 60 * 1000;
    if (stale) {
      autoTriedRef.current = true;
      runRefresh(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, startDate, snapshot]);

  const headlineCode = useMemo(() => {
    if (!snapshot || snapshot.days.length === 0) return null;
    if (snapshot.summary?.dominantCode !== undefined) return snapshot.summary.dominantCode;
    return snapshot.days[0].weatherCode;
  }, [snapshot]);

  if (!snapshot || snapshot.days.length === 0) {
    if (loading) {
      return (
        <section className="px-5 pt-6">
          <div className="rounded-[20px] bg-[var(--color-neutral-100)] p-4 flex items-center gap-3 animate-pulse">
            <div className="size-10 rounded-full bg-[var(--color-neutral-200)]" />
            <div className="flex-1 h-3 rounded bg-[var(--color-neutral-200)]" />
          </div>
        </section>
      );
    }
    const missingDate = !startDate;
    return (
      <section className="px-5 pt-6">
        <div className="rounded-[20px] border border-[var(--color-neutral-200)] bg-white p-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0">
            <Icon name="cloud-off" size={18} className="text-[var(--color-neutral-600)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
              {missingDate
                ? "Defina a data da viagem"
                : failed
                  ? "Não consegui carregar o clima"
                  : "Sem dados de clima ainda"}
            </p>
            <p className="text-[12px] text-[var(--color-neutral-600)]">
              {missingDate
                ? "Pra ver a previsão, edita a data de início."
                : failed
                  ? "Tenta de novo agora."
                  : "Gera a previsão pra sua viagem."}
            </p>
          </div>
          {!missingDate && (
            <button
              type="button"
              onClick={() => runRefresh(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--color-brand-yellow)] text-[var(--color-neutral-800)] text-[12px] font-medium hover:brightness-95 transition disabled:opacity-50"
            >
              <Icon name="refresh-cw" size={12} />
              {failed ? "Tentar de novo" : "Gerar"}
            </button>
          )}
        </div>
      </section>
    );
  }

  const isForecast = snapshot.mode === "forecast";
  const headline = headlineCode !== null ? codeMeta(headlineCode) : null;

  return (
    <section className="px-5 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[20px] border border-[var(--color-neutral-200)] bg-white overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            {headline && (
              <div className="grid size-11 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0">
                <Icon name={headline.icon} size={22} className="text-[var(--color-neutral-600)]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                {isForecast ? "Previsão pra sua viagem" : "Histórico pra essa época"}
              </p>
              <p className="font-display font-medium text-[16px] leading-tight text-[var(--color-neutral-800)] truncate">
                {headline?.label ?? "Clima"}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${isForecast
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
              }`}
          >
            {isForecast ? "Tempo real" : "Histórico 3 anos"}
          </span>
        </div>

        {snapshot.summary && !isForecast && (
          <div className="px-4 pb-3 flex flex-wrap gap-3 text-[12px] text-[var(--color-neutral-700)]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="thermometer" size={12} />
              Média {snapshot.summary.avgTempMin}° a {snapshot.summary.avgTempMax}°
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="cloud-rain" size={12} />
              {snapshot.summary.rainyDayCount === 0
                ? "Pouca chance de chuva"
                : `${snapshot.summary.rainyDayCount} dia${snapshot.summary.rainyDayCount === 1 ? "" : "s"} de chuva esperado`}
            </span>
          </div>
        )}

        <div className="border-t border-[var(--color-neutral-100)] overflow-x-auto no-scrollbar">
          <div className="flex gap-2 px-4 py-3 min-w-min">
            {snapshot.days.map((d, i) => {
              const meta = codeMeta(d.weatherCode);
              return (
                <div
                  key={d.date + i}
                  className="shrink-0 w-[88px] rounded-[14px] bg-[var(--color-neutral-100)] p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
                    Dia {i + 1}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-neutral-800)]">
                    {formatDate(d.date)}
                  </span>
                  <Icon name={meta.icon} size={22} className="text-[var(--color-neutral-800)] my-1" />
                  <span className="font-display font-medium text-[13px] text-[var(--color-neutral-800)]">
                    {Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°
                  </span>
                  {isForecast && d.precipitationProbabilityMax !== undefined && d.precipitationProbabilityMax >= 30 && (
                    <span className="text-[10px] font-medium text-blue-700 inline-flex items-center gap-1">
                      <Icon name="droplets" size={10} />
                      {d.precipitationProbabilityMax}%
                    </span>
                  )}
                  {!isForecast && d.precipitationSum > 0.5 && (
                    <span className="text-[10px] font-medium text-blue-700">
                      {rainIntensity(d.precipitationSum)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {snapshot.summary && !isForecast && (
          <div className="px-4 pb-4 pt-1 flex items-start gap-2 text-[12px] text-[var(--color-neutral-700)] leading-[1.5]">
            <Icon name="briefcase" size={14} className="text-[var(--color-neutral-700)] shrink-0 mt-0.5" />
            <span>
              {packingHint(
                snapshot.summary.avgTempMax,
                snapshot.summary.avgTempMin,
                snapshot.summary.rainyDayCount > 0,
              )}
            </span>
          </div>
        )}
      </motion.div>
    </section>
  );
}
