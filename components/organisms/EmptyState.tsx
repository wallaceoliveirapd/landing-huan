import { Icon, type IconName } from "@/components/atoms/Icon";

export function EmptyState({
  title,
  description,
  icon = "ph:sparkle-fill",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <div className="mx-auto flex w-full max-w-screen-md flex-col items-center gap-3 p-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[var(--color-brand-yellow)] text-[var(--color-brand-purple)]">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="font-display font-medium text-[18px] text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="font-display text-[14px] leading-[1.5] text-[var(--color-neutral-600)] max-w-[50ch]">
        {description}
      </p>
    </div>
  );
}
