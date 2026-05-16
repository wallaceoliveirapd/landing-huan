import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/atoms/Icon";

export function InfoRow({
  icon,
  children,
  accent,
  className,
}: {
  icon: IconName;
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-1 w-full", className)}>
      <Icon
        name={icon}
        size={20}
        className={cn(
          "mt-[1px]",
          accent ? "text-[var(--color-brand-purple)]" : "text-[var(--color-ink)]",
        )}
      />
      <p
        className={cn(
          "flex-1 text-[15px] leading-[1.39]",
          accent
            ? "font-medium text-[var(--color-brand-purple)]"
            : "font-normal text-[var(--color-ink)]",
        )}
      >
        {children}
      </p>
    </div>
  );
}
