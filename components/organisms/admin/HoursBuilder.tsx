"use client";

import { clsx } from "clsx";

type HourEntry = { day: string; open: string; close: string };

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface Props {
  value: HourEntry[];
  onChange: (hours: HourEntry[]) => void;
}

export function HoursBuilder({ value, onChange }: Props) {
  // Merge incoming value with all 7 days
  const hours: (HourEntry & { closed: boolean })[] = DAYS.map((day) => {
    const existing = (Array.isArray(value) ? value : []).find(
      (h) => h.day.toLowerCase() === day.toLowerCase()
    );
    return {
      day,
      open: existing?.open ?? "",
      close: existing?.close ?? "",
      closed: !existing,
    };
  });

  function update(day: string, field: "open" | "close", val: string) {
    const updated = hours.map((h) =>
      h.day === day ? { ...h, [field]: val, closed: false } : h
    );
    emit(updated);
  }

  function toggleClosed(day: string) {
    const updated = hours.map((h) => {
      if (h.day !== day) return h;
      if (h.closed) {
        return { ...h, closed: false, open: "09:00", close: "22:00" };
      }
      return { ...h, closed: true, open: "", close: "" };
    });
    emit(updated);
  }

  function emit(updated: typeof hours) {
    onChange(
      updated
        .filter((h) => !h.closed)
        .map(({ day, open, close }) => ({ day, open, close }))
    );
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--color-neutral-300)] px-2 py-1.5 text-sm text-center outline-none focus:border-[var(--color-brand-purple)] bg-white disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]";

  return (
    <div className="rounded-xl border border-[var(--color-neutral-300)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-neutral-100)]">
            <th className="px-3 py-2 text-left text-xs font-medium text-[var(--color-neutral-600)]">Dia</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-[var(--color-neutral-600)]">Abre</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-[var(--color-neutral-600)]">Fecha</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-[var(--color-neutral-600)]">Fechado</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h.day} className="border-t border-[var(--color-neutral-100)]">
              <td
                className={clsx(
                  "px-3 py-2 text-xs font-medium",
                  h.closed
                    ? "text-[var(--color-neutral-400)]"
                    : "text-[var(--color-neutral-800)]"
                )}
              >
                {h.day}
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="time"
                  disabled={h.closed}
                  value={h.open}
                  onChange={(e) => update(h.day, "open", e.target.value)}
                  className={inputCls}
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="time"
                  disabled={h.closed}
                  value={h.close}
                  onChange={(e) => update(h.day, "close", e.target.value)}
                  className={inputCls}
                />
              </td>
              <td className="px-3 py-1.5 text-center">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={() => toggleClosed(h.day)}
                  className="h-4 w-4 accent-[var(--color-brand-purple)]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
