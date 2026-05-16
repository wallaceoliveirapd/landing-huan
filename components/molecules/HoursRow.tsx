import { cn } from "@/lib/cn";

export function HoursRow({
  weekday,
  hours,
}: {
  weekday: string;
  hours: string;
}) {
  const closed = hours === "Fechado";
  return (
    <div className="flex items-center gap-1 w-full text-[15px] leading-[1.39]">
      <p className="flex-1 font-normal text-[var(--color-ink)]">{weekday}</p>
      <p
        className={cn(
          "text-right font-medium whitespace-nowrap",
          closed ? "text-[var(--color-brand-purple)]" : "text-[var(--color-ink)]",
        )}
      >
        {hours}
      </p>
    </div>
  );
}
