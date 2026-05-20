"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms/Icon";

/**
 * Compute hours/minutes until next BR midnight (limit resets at 00:00 BRT).
 * Returns "X horas" or "X min" so the user gets a clear ETA.
 */
function timeUntilReset(): { hours: number; minutes: number } {
  // Brazil/Recife is fixed UTC-3 (no DST).
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const brNow = new Date(utcMs - 3 * 3600_000);
  const brMidnight = new Date(brNow);
  brMidnight.setHours(24, 0, 0, 0);
  const diffMs = brMidnight.getTime() - brNow.getTime();
  const total = Math.max(0, Math.floor(diffMs / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

function formatEta(h: number, m: number): string {
  if (h >= 1) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m} min`;
}

/**
 * Replaces the suggested prompts row when the user's daily message quota
 * is exhausted. Shows an error chip + countdown to the next reset.
 */
export function ChatLimitChip() {
  const [eta, setEta] = useState(timeUntilReset);

  useEffect(() => {
    const id = setInterval(() => setEta(timeUntilReset()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="shrink-0 px-5 py-2.5 bg-white flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-[12px] font-medium">
        <Icon name="alert-circle" size={13} />
        <span>
          Limite diário atingido. Volte em{" "}
          <span className="font-semibold">{formatEta(eta.hours, eta.minutes)}</span>.
        </span>
      </div>
    </div>
  );
}
