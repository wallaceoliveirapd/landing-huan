"use client";

import { Icon } from "@/components/atoms/Icon";
import { trackCardClick } from "@/lib/analytics";

export function TourCtaFooter({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackCardClick("tour", title)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white px-7 py-3.5 text-[15px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-[0.98] transition-transform"
      >
        <Icon name="external-link" size={16} />
        Ir para o passeio
      </a>
    </div>
  );
}
