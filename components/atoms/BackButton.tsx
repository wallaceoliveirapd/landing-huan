"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";

interface Props {
  /** Where to go when there's no history (e.g. opened directly via shared link). */
  fallbackHref: string;
  className?: string;
  iconName?: string;
  iconSize?: number;
  ariaLabel?: string;
}

export function BackButton({
  fallbackHref,
  className,
  iconName = "arrow-left",
  iconSize = 18,
  ariaLabel = "Voltar",
}: Props) {
  const router = useRouter();
  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={className}
    >
      <Icon name={iconName} size={iconSize} />
    </button>
  );
}
