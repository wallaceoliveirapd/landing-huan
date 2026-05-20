"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { bottomSheetSpring } from "@/lib/motion-presets";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const IMPRESSIONS_KEY = "pwa-prompt-impressions";
const INSTALLED_KEY = "pwa-installed";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_PER_WEEK = 3;

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari uses a non-standard property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(mql || iosStandalone);
}

function readImpressions(): number[] {
  try {
    const raw = localStorage.getItem(IMPRESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function pushImpression() {
  try {
    const now = Date.now();
    const next = [...readImpressions(), now].filter((t) => now - t <= WEEK_MS);
    localStorage.setItem(IMPRESSIONS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalone()) {
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch {
      /* ignore */
    }
    return false;
  }
  try {
    if (localStorage.getItem(INSTALLED_KEY) === "1") return false;
  } catch {
    /* ignore */
  }
  const now = Date.now();
  const impressions = readImpressions().filter((t) => now - t <= WEEK_MS);
  // First-ever access → mandatory.
  if (impressions.length === 0) return true;
  // Otherwise, show until we've hit the per-week floor.
  return impressions.length < MIN_PER_WEEK;
}

/**
 * Full-screen install prompt that nudges visitors to add the site to their
 * home screen. Shows once per session (max), mandatory on the very first
 * visit, then at least MIN_PER_WEEK times per rolling week until the user
 * actually installs the PWA (detected via display-mode: standalone).
 */
export function PwaInstallSheet() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  useBodyScrollLock(open);

  useEffect(() => {
    if (!shouldShowPrompt()) return;
    setPlatform(detectPlatform());
    setOpen(true);
    pushImpression();
  }, []);

  function handleClose() {
    setOpen(false);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[140] bg-black/30"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Baixe o NordesteAÍ no seu celular"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            className="fixed inset-0 z-[150] bg-white flex flex-col"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-0 right-0 z-10 grid size-11 place-items-center rounded-full text-[var(--color-neutral-800)]"
              style={{
                marginTop: "calc(env(safe-area-inset-top) + 8px)",
                marginRight: 8,
              }}
            >
              <Icon name="x" size={20} />
            </button>

            {/* ── Scrollable content (header art + body) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Header art scrolls with the rest of the sheet */}
              <div className="bg-[var(--color-neutral-100)] pt-8 flex items-center justify-center relative w-full overflow-hidden">
                <div
                  className="relative w-full max-w-[440px]"
                  style={{ aspectRatio: "440 / 418" }}
                >
                  <Image
                    src="/images/pwa/pwa-mockup.png"
                    alt="App NordesteAÍ no celular"
                    fill
                    sizes="(min-width: 440px) 440px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="px-8 pt-8 pb-6 flex flex-col gap-3 mx-auto w-full max-w-screen-sm">
                <h1 className="font-display font-medium text-[28px] sm:text-[34px] leading-[1.2] text-[var(--color-neutral-800)]">
                  Baixe o NordesteAÍ no seu celular
                </h1>
                <p className="text-[13px] leading-[1.55] text-[var(--color-neutral-600)]">
                  Acesso direto da tela inicial, sem precisar abrir o navegador.
                  Mais rápido, com avisos das viagens e dos cupons exclusivos.
                </p>

                <TutorialSection platform={platform} />
              </div>
            </div>

            {/* ── Footer ── */}
            <div
              className="px-8 pt-3 shrink-0"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
            >
              <motion.button
                type="button"
                onClick={handleClose}
                whileTap={{ scale: 0.97 }}
                className="w-full mx-auto max-w-screen-sm block text-center rounded-full py-3.5 text-[14px] font-medium text-[var(--color-neutral-700)] hover:text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)] transition-colors"
              >
                Fazer isso depois
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Tutorial steps per platform ──────────────────────────────────────── */

function TutorialSection({ platform }: { platform: Platform }) {
  const [tab, setTab] = useState<"ios" | "android">(
    platform === "android" ? "android" : "ios",
  );

  // Re-sync when platform detection finishes.
  useEffect(() => {
    if (platform === "android") setTab("android");
    else if (platform === "ios") setTab("ios");
  }, [platform]);

  const showToggle = platform === "other";

  return (
    <div className="flex flex-col gap-4">
      {showToggle && (
        <div className="self-start inline-flex rounded-full bg-[var(--color-neutral-100)] p-1">
          <TabButton active={tab === "ios"} onClick={() => setTab("ios")}>
            iOS
          </TabButton>
          <TabButton active={tab === "android"} onClick={() => setTab("android")}>
            Android
          </TabButton>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.ol
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          {(tab === "ios" ? IOS_STEPS : ANDROID_STEPS).map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-2xl bg-[var(--color-neutral-100)] px-4 py-3"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[12px]">
                {i + 1}
              </span>
              <div className="flex-1 flex flex-col gap-1 pt-0.5">
                <p className="text-[14px] leading-[1.45] text-[var(--color-neutral-800)] font-display font-medium flex justify-between items-center gap-1.5 flex-wrap">
                  {step.title}
                  {step.icon && (
                    <span className="inline-grid size-6 place-items-center rounded-full bg-white rounded-full text-[var(--color-neutral-800)]">
                      <Icon name={step.icon} size={14} />
                    </span>
                  )}
                </p>
                <p className="text-[12px] leading-[1.5] text-[var(--color-neutral-600)]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </motion.ol>
      </AnimatePresence>

      <p className="text-[11px] leading-[1.5] text-[var(--color-neutral-500)]">
        Sem download de loja, sem assinatura. Funciona offline pras viagens
        salvas.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${active
        ? "bg-white text-[var(--color-neutral-800)] border border-[var(--color-neutral-300)]"
        : "text-[var(--color-neutral-700)] hover:text-[var(--color-neutral-800)]"
        }`}
    >
      {children}
    </button>
  );
}

type Step = { title: string; body: string; icon?: string };

const IOS_STEPS: Step[] = [
  {
    title: "Abra no Safari",
    body: "Se você está em outro app (Instagram, Gmail), toque em “Abrir no Safari”.",
    icon: "compass",
  },
  {
    title: "Toque nos três pontinhos",
    body: "No Safari mais novo, o menu “⋯” fica na barra de baixo, ao lado da URL.",
    icon: "more-horizontal",
  },
  {
    title: "Escolha “Compartilhar”",
    body: "Dentro do menu, toque no ícone de quadrado com a seta pra cima.",
    icon: "share",
  },
  {
    title: "Escolha “Adicionar à Tela de Início”",
    body: "Role a lista de opções até encontrar essa entrada.",
    icon: "plus-square",
  },
  {
    title: "Toque em “Adicionar”",
    body: "Pronto. O ícone do NordesteAÍ vai aparecer na sua tela inicial.",
    icon: "check",
  },
];

const ANDROID_STEPS: Step[] = [
  {
    title: "Abra no Chrome",
    body: "Outros navegadores também funcionam, mas o Chrome é o mais consistente.",
    icon: "compass",
  },
  {
    title: "Toque no menu ⋮",
    body: "É o ícone com três pontinhos verticais, no canto superior direito.",
    icon: "more-vertical",
  },
  {
    title: "Escolha “Instalar aplicativo”",
    body: "Em alguns aparelhos aparece como “Adicionar à tela inicial”.",
    icon: "download",
  },
  {
    title: "Confirme",
    body: "O atalho fica na sua tela inicial igualzinho a um app da loja.",
    icon: "check",
  },
];

/** Helper so the chat / wherever can offer a manual "Install" CTA later. */
export function clearPwaInstallSnooze() {
  try {
    localStorage.removeItem(IMPRESSIONS_KEY);
  } catch {
    /* ignore */
  }
}
