"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/cn";

/**
 * Green promo banner shown inside a tour/hosting detail page when the admin
 * filled in `discountBanner: { title, description }`. The visual hook is the
 * ticket-percent icon on the left so the user immediately recognizes it as
 * a discount section, not a generic info card.
 */
export function PromoBanner({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  if (!title.trim() && !description.trim()) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-[#016a5d] p-5 text-white",
        className,
      )}
    >

      <div className="w-full relative z-10 flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/15">
          <Icon name="ticket-percent" size={28} className="text-white" />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-display font-medium text-[20px] leading-tight">
            {title}
          </p>
          {description && (
            <p className="text-[14px] leading-snug text-white/85">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
