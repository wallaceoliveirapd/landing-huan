"use client";

import { Icon as Iconify } from "@iconify/react";
import { cn } from "@/lib/cn";

/**
 * Loose alias kept for backwards compatibility — any icon name string is accepted.
 * Prefer Lucide (e.g. "heart", "home"); legacy "ph:" / "lucide:" names also work.
 */
export type IconName = string;

/**
 * Lucide icon by name (without `lucide:` prefix) — preferred.
 * Strokes are rendered at 1.7 by default to match the site's clean style.
 *
 * Usage: <Icon name="heart" /> or <Icon name="lucide:heart" /> (legacy/full).
 */
export function Icon({
  name,
  className,
  size = 20,
  strokeWidth = 1.7,
}: {
  name: string;
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}) {
  // Default to lucide: prefix if no namespace is provided
  const fullName = name.includes(":") ? name : `lucide:${name}`;
  // CSS variable trick: Iconify renders SVG with currentColor & inherits stroke-width via CSS var
  return (
    <Iconify
      icon={fullName}
      className={cn("inline-block shrink-0", className)}
      width={size}
      height={size}
      aria-hidden
      style={{ strokeWidth }}
    />
  );
}
