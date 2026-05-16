"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { useCookieConsent } from "@/components/providers/CookieConsentProvider";
import { cn } from "@/lib/cn";

// ── Config sheet ──────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative w-10 h-5 rounded-full transition-colors shrink-0",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer",
        checked ? "bg-[var(--color-neutral-800)]" : "bg-[var(--color-neutral-300)]",
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function CookieConfigSheet() {
  const { consent, savePreferences, acceptAll, setConfigOpen } = useCookieConsent();

  const [analytics, setAnalytics] = useState(consent?.analytics ?? true);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  // Sync if consent changes externally
  useEffect(() => {
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [consent]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-[59]"
        onClick={() => setConfigOpen(false)}
      />

      {/* Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[28px] px-6 pt-5 pb-10 max-h-[85dvh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-[var(--color-neutral-300)] mb-5" />

        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
            Configurar cookies
          </h2>
          <button
            type="button"
            onClick={() => setConfigOpen(false)}
            className="p-1 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <p className="text-[13px] text-[var(--color-neutral-600)] mb-6 leading-relaxed">
          Escolha quais cookies você aceita. Essenciais são necessários para o site funcionar.
        </p>

        {/* Categories */}
        <div className="flex flex-col divide-y divide-[var(--color-neutral-100)]">
          {/* Essential */}
          <div className="py-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                Essenciais
              </p>
              <p className="text-[12px] text-[var(--color-neutral-500)] mt-0.5 leading-relaxed">
                Necessários para autenticação, sessão e funcionamento básico do site. Não podem ser desativados.
              </p>
            </div>
            <Toggle checked={true} disabled />
          </div>

          {/* Analytics */}
          <div className="py-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                Analíticos
              </p>
              <p className="text-[12px] text-[var(--color-neutral-500)] mt-0.5 leading-relaxed">
                Google Analytics / GTM — nos ajudam a entender como o site é usado e melhorar a experiência.
              </p>
            </div>
            <Toggle checked={analytics} onChange={setAnalytics} />
          </div>

          {/* Marketing */}
          <div className="py-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                Marketing
              </p>
              <p className="text-[12px] text-[var(--color-neutral-500)] mt-0.5 leading-relaxed">
                Meta Pixel — usados para anúncios personalizados e remarketing em redes sociais.
              </p>
            </div>
            <Toggle checked={marketing} onChange={setMarketing} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            onClick={() => savePreferences({ analytics, marketing })}
            className="w-full h-11 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[14px]"
          >
            Salvar preferências
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="w-full h-11 rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-800)] font-display font-medium text-[14px]"
          >
            Aceitar todos
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Banner ────────────────────────────────────────────────────

export function CookieBanner() {
  const { decided, acceptRecommended, configOpen, setConfigOpen } = useCookieConsent();

  // Don't flash banner on SSR / before hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {/* Config sheet (can open independently from footer link) */}
      {configOpen && <CookieConfigSheet key="config" />}

      {/* Banner — only when user hasn't decided yet */}
      {!decided && !configOpen && (
        <motion.div
          key="banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.6 }}
          className="fixed left-3 right-3 z-50 md:left-auto md:right-6 md:max-w-sm"
          style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[var(--color-neutral-200)] px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-[20px] leading-none mt-0.5">🍪</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-medium text-[13px] text-[var(--color-neutral-800)] leading-snug">
                  Usamos cookies
                </p>
                <p className="text-[12px] text-[var(--color-neutral-600)] mt-0.5 leading-relaxed">
                  Para melhorar sua experiência e analisar o uso do site. Sem rastreamento de marketing por padrão.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={acceptRecommended}
                className="flex-1 h-9 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[12px]"
              >
                Aceitar
              </button>
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="flex-1 h-9 rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] font-display font-medium text-[12px] hover:border-[var(--color-neutral-600)] transition-colors"
              >
                Configurar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
