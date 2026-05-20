"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

/**
 * Wrap the children of an App Router layout so route changes inside that
 * layout fade in/out. The pathname is the key, so each new route enters as
 * a fresh node and the previous one exits cleanly.
 *
 * Keep this around the *route content only* — never wrap fixed UI
 * (BottomNav, ChatPanel, sheets), otherwise it would unmount on every
 * navigation and reset their state / lose their refs.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
