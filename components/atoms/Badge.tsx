import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "neutral" | "purple" | "yellow";

const tones: Record<Tone, string> = {
  success: "bg-[var(--color-success-green)] text-white",
  neutral:
    "bg-white text-[var(--color-ink)] border border-black/10",
  purple: "bg-[var(--color-brand-purple)] text-white",
  yellow: "bg-[var(--color-brand-yellow)] text-black",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill px-[7px] py-[5px] text-[12px] font-medium leading-none tracking-[0.012em] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
