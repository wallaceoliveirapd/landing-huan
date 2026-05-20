"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const CITIES = [
  "João Pessoa",
  "Natal",
  "Recife",
  "Maceió",
  "Maragogi",
  "Porto de Galinhas",
  "Pipa",
  "Fortaleza",
  "Jericoacoara",
  "Salvador",
  "Fernando de Noronha",
];

const CYCLE_MS = 2200;

export type PromptTemplate = {
  /** Display + send template. Use `{city}` to inject a cycling Northeast city. */
  template: string;
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { template: "Passeio de barco em {city}" },
  { template: "Onde comer frutos do mar em {city}?" },
  { template: "Quais praias têm mar calmo em {city}?" },
  { template: "Quero planejar uma viagem para {city}" },
  { template: "Tem cupom de desconto em {city}?" },
];

function renderTemplate(template: string, city: string): string {
  return template.replace("{city}", city);
}

/**
 * Row of suggested prompts. Each chip cycles a Northeast city name in
 * place of the `{city}` token. Clicking a chip fills the composer with
 * the current text instead of sending it directly — the user can edit
 * before submitting.
 *
 * Disabling (e.g. when the daily chat limit is hit) freezes the
 * animation and removes click handlers.
 */
export function SuggestedPromptsRow({
  templates = PROMPT_TEMPLATES,
  onPick,
  disabled = false,
}: {
  templates?: PromptTemplate[];
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setTick((t) => t + 1);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [disabled]);

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 px-5 py-2.5 bg-white">
      {templates.map((p, idx) => {
        // Stagger each chip so they don't all flip at the same instant.
        const cityIndex = (tick + idx * 2) % CITIES.length;
        const city = CITIES[cityIndex];
        const hasToken = p.template.includes("{city}");
        const filled = renderTemplate(p.template, city);
        // Trim split parts and rely on explicit margins between spans so
        // the inline-flex container doesn't collapse the space adjacent to
        // the animated city token (which currently makes "em" stick to
        // the city name on render).
        const [before, after] = hasToken
          ? p.template.split("{city}").map((s) => s.trim())
          : [p.template, ""];

        return (
          <motion.button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onPick(filled)}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
            onFocus={() => { pausedRef.current = true; }}
            onBlur={() => { pausedRef.current = false; }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="flex-none rounded-full bg-white border border-[var(--color-neutral-300)] text-[var(--color-neutral-800)] text-[13px] font-medium px-4 py-2 hover:border-[var(--color-neutral-800)] disabled:opacity-40 transition-colors whitespace-nowrap inline-flex items-center"
          >
            {hasToken ? (
              <>
                <span>{before}</span>
                <span className="inline-flex items-center mx-[0.35em]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={city}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[var(--color-brand-purple)] whitespace-nowrap"
                    >
                      {city}
                    </motion.span>
                  </AnimatePresence>
                </span>
                {after && <span>{after}</span>}
              </>
            ) : (
              <span>{p.template}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
