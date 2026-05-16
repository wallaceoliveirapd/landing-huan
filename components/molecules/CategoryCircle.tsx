"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/atoms/Icon";

type Props = {
  label: string;
  image?: string;
  icon?: IconName;
  href?: string;
  onClick?: () => void;
  iconBg?: string;
};

export function CategoryCircle({ label, image, icon, href, onClick, iconBg }: Props) {
  const inner = (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="flex flex-col items-center justify-end gap-2 flex-1 min-w-0"
    >
      <div
        className={cn(
          "relative size-[72px] rounded-full overflow-hidden grid place-items-center",
          iconBg ?? "bg-[var(--color-neutral-100)]",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="88px"
            className="object-contain p-2"
          />
        ) : icon ? (
          <Icon name={icon} size={36} className="text-[var(--color-ink)]" />
        ) : (
          <div className="size-full bg-[var(--color-neutral-100)]" />
        )}
      </div>
      <span className="font-display font-medium text-[14px] leading-[1.1] text-[var(--color-ink)] whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="flex flex-1 min-w-0 group">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="flex flex-1 min-w-0 cursor-pointer">
      {inner}
    </button>
  );
}
