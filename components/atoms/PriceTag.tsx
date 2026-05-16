import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export function PriceTag({
  value,
  from,
  className,
}: {
  value: number;
  from?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-[3px] whitespace-nowrap", className)}>
      <span className="text-[11px] leading-[13px] text-[var(--color-neutral-600)]">
        A partir de
      </span>
      <span className="inline-flex items-center gap-[6px]">
        <span className="font-display font-medium text-[22px] leading-none text-[var(--color-ink)]">
          {formatBRL(value)}
        </span>
        {from && from > value && (
          <span className="font-display text-[15px] leading-[19px] text-[var(--color-neutral-600)] line-through">
            {formatBRL(from)}
          </span>
        )}
      </span>
    </div>
  );
}
