"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Plain horizontal scroller — no title, no nav buttons.
 * Matches the Figma sections which use a section heading container
 * + the list container separately. Bleed-right on mobile so the next
 * card peeks past the right edge.
 */
export function HorizontalCarousel({
  children,
  className,
  bleedRight = true,
}: {
  children: ReactNode;
  className?: string;
  bleedRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar carousel-smooth flex items-stretch gap-4 overflow-x-auto pb-2 -mb-2",
        bleedRight
          ? "-mx-6 w-[calc(100%+3rem)] px-6 md:mx-0 md:w-full md:px-0"
          : "w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
