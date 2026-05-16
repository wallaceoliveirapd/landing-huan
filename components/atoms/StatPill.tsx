import { Icon } from "@/components/atoms/Icon";

/**
 * Numeric stat with built-in skeleton.
 *
 * Pass `value` as `number` to render normally, or `undefined` while the
 * underlying Convex query is still loading — the component renders a
 * skeleton placeholder instead of "0". This prevents the typical
 * "0 → 3" flash that happens when you use `?? 0` on a useQuery result.
 */
export function StatPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-[var(--color-neutral-100)]">
      <Icon name={icon} size={18} className="text-[var(--color-neutral-600)]" />
      {value === undefined ? (
        <span className="block h-[22px] w-7 rounded bg-white animate-pulse" />
      ) : (
        <span className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] leading-none">
          {value}
        </span>
      )}
      <span className="text-[11px] text-[var(--color-neutral-600)]">{label}</span>
    </div>
  );
}
