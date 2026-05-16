import type { Variants, Transition } from "motion/react";

export const easeOutSoft: Transition["ease"] = [0.22, 1, 0.36, 1];
export const easeOutExpo: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutSoft },
  },
};

export const fadeUpSlow: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: easeOutSoft } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOutSoft },
  },
};

export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 28, mass: 0.8 },
  },
};

export const staggerChildren = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const staggerFast = (delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: delay } },
});

export const tapScale = { scale: 0.97 } as const;
export const hoverLift = {
  y: -2,
  transition: { duration: 0.2, ease: easeOutSoft },
} as const;
export const hoverLiftCard = {
  y: -4,
  transition: { type: "spring", stiffness: 400, damping: 22 },
} as const;

export const bottomSheetSpring: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 280,
  mass: 0.7,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 22,
  mass: 0.9,
};
