"use client";

import { AnimatePresence, motion } from "motion/react";

/**
 * Fullscreen loading overlay shown while the NordestAI is generating an
 * itinerary. Yellow brand gradient + spinning ring + pulsing subtitle.
 *
 * Usage:
 *   <AiLoader show={generating} />
 *
 * When show=false the component returns null (removed from DOM via AnimatePresence).
 */
export function AiLoader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="ai-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#fef9c3] via-[#fde047] to-[#facc15]"
          role="status"
          aria-live="polite"
          aria-label="Montando seu roteiro"
        >
          {/* Spinning ring with inner glow */}
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-[#ca8a04] border-t-transparent animate-spin" />
            <div className="absolute w-12 h-12 rounded-full bg-[#facc15] shadow-[0_0_30px_#eab308]" />
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-display font-semibold text-lg text-black/70">
              Montando seu roteiro...
            </p>
            <p className="text-sm text-black/50">
              Buscando os melhores lugares para você
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Keep the old named export alias for any other callers that may
// use the class-component style (e.g. <AiLoader text="…" />).
// Those usages just gate the render externally, so `show` defaults to true.
/** @deprecated Use `<AiLoader show={…} />` instead */
export const AiLoaderLegacy = AiLoader;
