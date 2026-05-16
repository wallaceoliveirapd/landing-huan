import { cn } from "@/lib/cn";

/**
 * Clean skeleton block — uses `neutral-100` (warmer than neutral-300)
 * so it matches the new white aesthetic. Default radius is 12px;
 * pass a different `rounded-*` class to override.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[12px] bg-[var(--color-neutral-100)]",
        className,
      )}
      style={style}
    />
  );
}

/** Inline circle skeleton — convenience for avatars and icon placeholders. */
export function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-full bg-[var(--color-neutral-100)]", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Single text line skeleton. */
export function SkeletonLine({
  width = "100%",
  className,
}: {
  width?: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-[var(--color-neutral-100)] h-3",
        className,
      )}
      style={{ width }}
    />
  );
}
