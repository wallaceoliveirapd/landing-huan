"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  pushSupported,
  subscribePush,
  serializeSubscription,
} from "@/lib/pushClient";

/**
 * Discreet bottom banner asking the user for Web Push permission.
 *
 * Rules for showing it:
 *   - User is authenticated
 *   - Browser supports Web Push
 *   - User hasn't already subscribed (per Convex `myStatus`)
 *   - Browser permission isn't already "denied" (it'd be useless)
 *   - User hasn't dismissed the banner in this session (localStorage)
 *   - We're NOT on the trip creator (it has its own AI loader overlay)
 *   - We're NOT on the /perfil/notificacoes page (it has its own UI)
 *
 * Appears after a small delay so it doesn't pop up immediately on load.
 */
const DISMISS_KEY = "push-prompt-dismissed";
const DISMISS_HOURS = 23; // re-show at least once a day

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) ?? "0", 10);
    if (!ts) return false;
    const ageMs = Date.now() - ts;
    return ageMs < DISMISS_HOURS * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function PushPrompt() {
  const auth = useAuth();
  const status = useQuery(
    api.pushQueries.myStatus,
    auth.isAuthenticated ? {} : "skip",
  );
  const subscribe = useMutation(api.pushQueries.subscribe);
  const pathname = usePathname();

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Skip on pages with their own overlays / notification UI
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/minha-viagem/criar") ||
      pathname.startsWith("/perfil/notificacoes")
    ) {
      setVisible(false);
      return;
    }
    if (auth.isLoading || !auth.isAuthenticated) return;
    if (!pushSupported()) return;
    if (typeof Notification !== "undefined" && Notification.permission === "denied") return;
    if (status === undefined) return; // still loading
    if (status.subscribed) return;
    if (isDismissed()) return;

    // Delay 4s so we don't startle the user on landing
    const t = window.setTimeout(() => setVisible(true), 4000);
    return () => window.clearTimeout(t);
  }, [auth.isLoading, auth.isAuthenticated, status, pathname]);

  async function handleEnable() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const sub = await subscribePush();
      if (!sub) {
        setError("Permissão negada. Você pode habilitar depois nas Configurações.");
        return;
      }
      const { endpoint, p256dh, auth: authKey } = serializeSubscription(sub);
      await subscribe({
        endpoint,
        p256dh,
        auth: authKey,
        userAgent: navigator.userAgent,
      });
      setVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar.");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    markDismissed();
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          // Sits ABOVE the floating bottom nav. We reserve ~88px of bottom
          // space for the pill nav so the banner doesn't overlap it.
          className="fixed inset-x-4 z-40 pointer-events-none"
          style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="pointer-events-auto mx-auto max-w-md rounded-[20px] bg-white border border-[var(--color-neutral-200)] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[var(--color-brand-yellow)] shrink-0">
                <Icon name="bell-ring" size={18} className="text-[var(--color-neutral-800)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)]">
                  Quer receber meus avisos?
                </p>
                <p className="text-[12px] leading-[1.45] text-[var(--color-neutral-600)] mt-1">
                  Posso te avisar quando seu roteiro tiver pronto, novos cupons chegarem ou dicas
                  novas saírem.
                </p>
                {error && (
                  <p className="text-[11px] text-red-600 mt-2">{error}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleEnable}
                    disabled={busy}
                    className="h-9 px-4 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium disabled:opacity-50"
                  >
                    {busy ? "Ativando…" : "Ativar avisos"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={busy}
                    className="h-9 px-3 text-[13px] font-medium text-[var(--color-neutral-600)]"
                  >
                    Agora não
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Fechar"
                className="grid size-8 place-items-center rounded-full hover:bg-[var(--color-neutral-100)] shrink-0"
              >
                <Icon name="x" size={14} className="text-[var(--color-neutral-600)]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
