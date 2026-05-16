"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function DiscountBanner({
  headline,
  rest,
  code,
  className,
}: {
  headline: string;
  rest: string;
  code: string;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative h-[128px] w-full overflow-hidden rounded-card bg-[var(--color-brand-yellow)]",
        className,
      )}
    >
      <div className="absolute -left-6 sm:left-2 top-1/2 -translate-y-1/2 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
        <Image
          src="/images/other/cupom.png"
          alt=""
          fill
          sizes="220px"
          className="object-contain"
        />
      </div>

      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 max-w-[58%] sm:max-w-[260px] flex flex-col gap-[8px] text-black font-display font-medium">
        <p className="text-[24px] sm:text-[24px] leading-tight">
          <span className="text-[var(--color-brand-purple)] underline decoration-[var(--color-brand-purple)] decoration-2 underline-offset-2">
            {headline}
          </span>
          <span>{rest}</span>
        </p>
        <p className="text-[16px] sm:text-[14px] leading-tight">{code}</p>
      </div>
    </motion.div>
  );
}
