import { cn } from "@/lib/cn";
import { formatRating } from "@/lib/format";
import { Icon } from "./Icon";

export function Rating({
  value,
  className,
  light,
}: {
  value: number;
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[3px]",
        light ? "text-white" : "text-[var(--color-ink)]",
        className,
      )}
    >
      <Icon
        name="lucide:star"
        size={14}
        className={cn(
          "fill-current",
          light ? "text-white" : "text-[var(--color-ink)]",
        )}
      />
      <span className="font-display font-medium text-[15px] leading-[16px] tracking-[0.005em]">
        {formatRating(value)}
      </span>
    </span>
  );
}
