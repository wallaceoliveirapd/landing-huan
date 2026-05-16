import { cn } from "@/lib/cn";
import { Rating } from "@/components/atoms/Rating";

export function RatingLine({
  value,
  label,
  meta,
  light,
  className,
}: {
  value: number;
  label?: string;
  meta?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-[3px] flex-wrap", className)}>
      <Rating value={value} light={light} />
      {label && (
        <span
          className={cn(
            "text-[11px] leading-normal",
            light ? "text-white/90" : "text-[var(--color-neutral-600)]",
          )}
        >
          {label}
        </span>
      )}
      {meta && (
        <span
          className={cn(
            "text-[11px] leading-normal",
            light ? "text-white/90" : "text-[var(--color-neutral-600)]",
          )}
        >
          • {meta}
        </span>
      )}
    </div>
  );
}
