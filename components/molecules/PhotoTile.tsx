"use client";

import { SkeletonImage } from "@/components/atoms/SkeletonImage";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function PhotoTile({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative h-[188px] w-[243px] flex-none overflow-hidden rounded-card",
        className,
      )}
    >
      <SkeletonImage
        src={src}
        alt={alt}
        fill
        sizes="243px"
        className="object-cover"
      />
    </motion.div>
  );
}
