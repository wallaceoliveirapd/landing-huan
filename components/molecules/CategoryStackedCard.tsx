"use client";

import { SkeletonImage } from "@/components/atoms/SkeletonImage";
import Link from "next/link";
import { motion } from "motion/react";
import { toProxyUrl } from "@/lib/imageUpload";

type Props = {
  label: string;
  mainImage: string;
  backImages?: string[];
  href?: string;
  onClick?: () => void;
};

/**
 * Stacked polaroid category card, Figma node 334:35991.
 *
 *   Outer container: 124 × 133.242px
 *
 *   Back card #1 (RIGHT, rotated +16.24°):
 *     wrapper: left 30.77px, top 22.1px, width 91.106px, height 103.683px
 *     image  : 69.317 × 87.801px, radius 18.484px
 *
 *   Back card #2 (LEFT, rotated -9.86°):
 *     wrapper: left 1.54px, top 7.7px, width 84.362px, height 104.285px
 *     image  : 69.317 × 93.796px, radius 18.484px
 *
 *   Front card:
 *     left 22.34px, top 20.8px, width 77.019px, height 104.745px,
 *     radius 18.484px, white border 2.311px, soft shadow.
 */
export function CategoryStackedCard({
  label,
  mainImage,
  backImages = [],
  href,
  onClick,
}: Props) {
  // Fallback to main image so cards always look filled
  const back0 = backImages[0] ?? mainImage;
  const back1 = backImages[1] ?? mainImage;

  const stack = (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="flex flex-col items-center gap-2 cursor-pointer select-none"
    >
      <div className="relative" style={{ width: 124, height: 133.242 }}>
        {/* Back card #1, rotated +16.24° (right) */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 30.77, top: 22.1, width: 91.106, height: 103.683 }}
        >
          <div className="flex-none" style={{ transform: "rotate(16.24deg)" }}>
            <div
              className="relative overflow-hidden"
              style={{ width: 69.317, height: 87.801, borderRadius: 18.484 }}
            >
              <SkeletonImage
                src={toProxyUrl(back0)}
                alt=""
                fill
                sizes="70px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Back card #2, rotated -9.86° (left) */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 1.54, top: 7.7, width: 84.362, height: 104.285 }}
        >
          <div className="flex-none" style={{ transform: "rotate(-9.86deg)" }}>
            <div
              className="relative overflow-hidden"
              style={{ width: 69.317, height: 93.796, borderRadius: 18.484 }}
            >
              <SkeletonImage
                src={toProxyUrl(back1)}
                alt=""
                fill
                sizes="70px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Front card */}
        <div
          className="absolute overflow-hidden border-solid border-white"
          style={{
            left: 22.34,
            top: 20.8,
            width: 77.019,
            height: 104.745,
            borderRadius: 18.484,
            borderWidth: 2.311,
            boxShadow: "0 9.242px 15.404px 0 rgba(84, 89, 98, 0.10)",
          }}
        >
          {mainImage && (
            <SkeletonImage
              src={toProxyUrl(mainImage)}
              alt={label}
              fill
              sizes="77px"
              className="object-cover"
            />
          )}
        </div>
      </div>

      <span className="font-display text-[14px] leading-none text-black whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="flex flex-col items-center">
        {stack}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center">
      {stack}
    </button>
  );
}
