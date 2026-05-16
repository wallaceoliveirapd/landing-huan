"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Segment-level error boundary. Triggered by uncaught render errors in any
 * route under `app/`. Gives the user a clear next step (refresh / go home)
 * instead of a blank screen.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-red-50 text-red-600 text-[32px]">
          !
        </div>
        <h1 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
          Algo travou por aqui
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed">
          A gente já registrou o erro. Tenta de novo, e se persistir, volta
          pra home.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[var(--color-neutral-500)] font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium"
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="h-11 px-5 inline-flex items-center rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] text-[13px] font-medium"
          >
            Voltar pra home
          </Link>
        </div>
      </div>
    </div>
  );
}
