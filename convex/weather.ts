"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive";

// Open-Meteo forecast horizon: ~16 days.
const FORECAST_HORIZON_DAYS = 16;

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax?: number;
  weatherCode: number;
}

interface WeatherSummary {
  avgTempMax: number;
  avgTempMin: number;
  rainyDayCount: number;
  dominantCode: number;
}

interface Snapshot {
  mode: "forecast" | "historical";
  fetchedAt: number;
  days: WeatherDay[];
  summary?: WeatherSummary;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayDiff(ms: number) {
  return Math.round(ms / 86_400_000);
}

async function fetchForecast(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<WeatherDay[]> {
  const url = `${FORECAST_BASE}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&start_date=${startDate}&end_date=${endDate}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast ${res.status}`);
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      precipitation_probability_max?: number[];
      weather_code?: number[];
    };
  };
  const d = json.daily;
  if (!d || !d.time) return [];
  return d.time.map((date, i) => ({
    date,
    tempMax: d.temperature_2m_max?.[i] ?? 0,
    tempMin: d.temperature_2m_min?.[i] ?? 0,
    precipitationSum: d.precipitation_sum?.[i] ?? 0,
    precipitationProbabilityMax: d.precipitation_probability_max?.[i],
    weatherCode: d.weather_code?.[i] ?? 0,
  }));
}

async function fetchArchive(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<WeatherDay[]> {
  const url = `${ARCHIVE_BASE}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&start_date=${startDate}&end_date=${endDate}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo archive ${res.status}`);
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      weather_code?: number[];
    };
  };
  const d = json.daily;
  if (!d || !d.time) return [];
  return d.time.map((date, i) => ({
    date,
    tempMax: d.temperature_2m_max?.[i] ?? 0,
    tempMin: d.temperature_2m_min?.[i] ?? 0,
    precipitationSum: d.precipitation_sum?.[i] ?? 0,
    weatherCode: d.weather_code?.[i] ?? 0,
  }));
}

/**
 * Build a historical "what to expect" snapshot by averaging the same date
 * window across the last 3 years. Each result day represents that
 * day-of-trip (Day 1, Day 2, ...) averaged across the 3 historical samples.
 */
async function fetchHistoricalAverage(
  lat: number,
  lng: number,
  tripStart: Date,
  durationDays: number,
): Promise<{ days: WeatherDay[]; summary: WeatherSummary }> {
  const years = [1, 2, 3].map((offset) => offset);
  const samples = await Promise.all(
    years.map(async (offset) => {
      const start = new Date(tripStart);
      start.setUTCFullYear(start.getUTCFullYear() - offset);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + Math.max(0, durationDays - 1));
      try {
        return await fetchArchive(lat, lng, isoDay(start), isoDay(end));
      } catch (err) {
        console.warn("[weather] archive sample failed", err);
        return [];
      }
    }),
  );

  // Average per "Day N" of the trip.
  const days: WeatherDay[] = [];
  for (let i = 0; i < durationDays; i++) {
    const slot = samples.map((s) => s[i]).filter(Boolean) as WeatherDay[];
    if (slot.length === 0) continue;
    const tempMax = slot.reduce((a, d) => a + d.tempMax, 0) / slot.length;
    const tempMin = slot.reduce((a, d) => a + d.tempMin, 0) / slot.length;
    const precipitationSum =
      slot.reduce((a, d) => a + d.precipitationSum, 0) / slot.length;
    // Dominant weather code among the year samples.
    const codeFreq: Record<number, number> = {};
    for (const d of slot) codeFreq[d.weatherCode] = (codeFreq[d.weatherCode] ?? 0) + 1;
    const dominantCode = Number(
      Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0][0],
    );
    const date = new Date(tripStart);
    date.setUTCDate(date.getUTCDate() + i);
    days.push({
      date: isoDay(date),
      tempMax: round1(tempMax),
      tempMin: round1(tempMin),
      precipitationSum: round1(precipitationSum),
      weatherCode: dominantCode,
    });
  }

  const avgTempMax = days.length
    ? round1(days.reduce((a, d) => a + d.tempMax, 0) / days.length)
    : 0;
  const avgTempMin = days.length
    ? round1(days.reduce((a, d) => a + d.tempMin, 0) / days.length)
    : 0;
  const rainyDayCount = days.filter((d) => d.precipitationSum >= 2).length;
  const overallCodeFreq: Record<number, number> = {};
  for (const d of days) overallCodeFreq[d.weatherCode] = (overallCodeFreq[d.weatherCode] ?? 0) + 1;
  const dominantCode = days.length
    ? Number(Object.entries(overallCodeFreq).sort((a, b) => b[1] - a[1])[0][0])
    : 0;

  return {
    days,
    summary: { avgTempMax, avgTempMin, rainyDayCount, dominantCode },
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Fetch (and cache on the trip doc) the weather snapshot for a trip.
 * Selects forecast vs historical mode based on how far the trip start is.
 * Idempotent: short-circuits when a fresh snapshot already exists.
 */
export const refreshForTrip = internalAction({
  args: { tripId: v.id("trips"), force: v.optional(v.boolean()) },
  handler: async (ctx, { tripId, force }): Promise<{ ok: boolean; mode?: string } > => {
    const trip = await ctx.runQuery(internal.tripRemindersData.getForReminder, {
      tripId,
    });
    if (!trip) return { ok: false };
    const t = trip.trip as {
      _id: string;
      lat?: number;
      lng?: number;
      startDate?: number;
      duration?: number;
      weatherSnapshot?: Snapshot;
    };
    if (typeof t.lat !== "number" || typeof t.lng !== "number") return { ok: false };
    if (typeof t.startDate !== "number") return { ok: false };

    const duration = Math.max(1, t.duration ?? 3);

    // Reuse a fresh snapshot (7-day TTL) unless caller forces refresh.
    // Weather data updates infrequently enough that re-fetching daily is
    // wasteful, even inside the 16-day forecast window.
    if (
      !force &&
      t.weatherSnapshot &&
      Date.now() - t.weatherSnapshot.fetchedAt < 7 * 24 * 60 * 60 * 1000
    ) {
      return { ok: true, mode: t.weatherSnapshot.mode };
    }

    const now = Date.now();
    const daysUntil = dayDiff(t.startDate - now);
    const start = new Date(t.startDate);
    const end = new Date(t.startDate + (duration - 1) * 86_400_000);

    let snapshot: Snapshot;
    if (daysUntil <= FORECAST_HORIZON_DAYS) {
      // Forecast covers up to 16 days. Clamp end date if needed.
      const clampedEnd = new Date(
        Math.min(
          end.getTime(),
          now + FORECAST_HORIZON_DAYS * 86_400_000,
        ),
      );
      const days = await fetchForecast(
        t.lat,
        t.lng,
        isoDay(start),
        isoDay(clampedEnd),
      );
      snapshot = { mode: "forecast", fetchedAt: now, days };
    } else {
      const { days, summary } = await fetchHistoricalAverage(
        t.lat,
        t.lng,
        start,
        duration,
      );
      snapshot = { mode: "historical", fetchedAt: now, days, summary };
    }

    await ctx.runMutation(internal.weatherInternal.patchSnapshot, {
      tripId,
      snapshot,
    });
    return { ok: true, mode: snapshot.mode };
  },
});

/** Public wrapper, lets the trip detail page trigger a manual refresh. */
export const refresh = action({
  args: { tripId: v.id("trips"), force: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ ok: boolean; mode?: string }> => {
    return await ctx.runAction(internal.weather.refreshForTrip, args);
  },
});
