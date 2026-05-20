"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Fullscreen loading overlay shown while the NordesteAÍ is generating an
 * itinerary. Clean white surface, brand-yellow orb with soft glow, and a
 * progressive status line that cycles through plausible AI steps.
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
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          role="status"
          aria-live="polite"
          aria-label="Montando seu roteiro"
        >
          {/* Soft yellow radial wash behind the orb */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 38%, rgba(250, 204, 21, 0.22) 0%, rgba(250, 204, 21, 0.08) 35%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center gap-10 px-8 max-w-[420px]">
            <Orb />
            <StatusText />
            <ProgressDots />
          </div>

          <p className="absolute bottom-8 inset-x-0 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
            NordesteAÍ
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Orb() {
  return (
    <div className="relative size-[120px] flex items-center justify-center">
      {/* Outer slow-rotating conic ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(250,204,21,0) 0%, rgba(250,204,21,0.85) 25%, rgba(234,179,8,0.95) 50%, rgba(250,204,21,0.85) 75%, rgba(250,204,21,0) 100%)",
          maskImage:
            "radial-gradient(circle, transparent 56%, black 58%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 56%, black 58%, black 100%)",
        }}
      />

      {/* Inner core with breathing scale */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative size-[78px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, #fff7c2 0%, #fde047 35%, #facc15 70%, #eab308 100%)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(234,179,8,0.35), inset 0 -8px 18px rgba(202,138,4,0.35), inset 0 6px 14px rgba(255,255,255,0.55)",
        }}
      >
        {/* Glossy highlight */}
        <span
          aria-hidden
          className="absolute top-[10%] left-[18%] size-[28%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
      </motion.div>

      {/* Soft pulsing halo */}
      <motion.span
        aria-hidden
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.18, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(250,204,21,0.45) 0%, rgba(250,204,21,0) 65%)",
        }}
      />
    </div>
  );
}

const STATUS_LINES = [
  "Analisando seu estilo de viagem",
  "Buscando lugares reais perto de você",
  "Consultando o clima dos próximos dias",
  "Montando o melhor roteiro pra você",
];

function StatusText() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % STATUS_LINES.length);
    }, 2400);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2 className="font-display font-medium text-[22px] leading-tight text-[var(--color-neutral-800)]">
        Montando seu roteiro
      </h2>
      <div className="relative h-[18px] w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 text-[13px] text-[var(--color-neutral-600)]"
          >
            {STATUS_LINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
          className="size-1.5 rounded-full bg-[var(--color-neutral-700)]"
        />
      ))}
    </div>
  );
}

/** @deprecated Use `<AiLoader show={…} />` instead */
export const AiLoaderLegacy = AiLoader;
