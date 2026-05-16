"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "pill-outline" | "pill-dark" | "pill-yellow";
type Size = "sm" | "md" | "lg";

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-display font-medium leading-none rounded-pill transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-purple)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-white hover:bg-black active:bg-black/90",
  secondary:
    "bg-[var(--color-neutral-100)] text-[var(--color-ink)] hover:bg-[var(--color-neutral-300)]",
  ghost: "bg-transparent text-[var(--color-ink)] hover:bg-black/5",
  "pill-outline":
    "border border-[rgba(50,52,57,0.16)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-neutral-100)]",
  "pill-dark":
    "bg-[var(--color-ink)] text-white border border-[var(--color-ink)] hover:bg-black",
  "pill-yellow":
    "bg-[var(--color-brand-yellow)] text-black hover:brightness-95 active:brightness-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", fullWidth, type = "button", ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    />
  );
});
