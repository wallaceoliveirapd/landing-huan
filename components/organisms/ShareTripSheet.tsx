"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { bottomSheetSpring } from "@/lib/motion-presets";

/**
 * Generates / revokes a public share token for the trip and exposes a copy
 * link. Read-only view lives at /v/{token} and renders the trip without
 * requiring auth, with a NordesteAÍ branded CTA "Crie o seu roteiro também".
 */
export function ShareTripSheet({
  open,
  tripId,
  onClose,
}: {
  open: boolean;
  tripId: Id<"trips">;
  onClose: () => void;
}) {
  const trip = useQuery(api.trips.getById, { id: tripId });
  const enable = useMutation(api.trips.enableSharing);
  const disable = useMutation(api.trips.disableSharing);

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = trip?.shareToken ?? null;
  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/v/${token}`
      : "";

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function handleEnable() {
    if (busy) return;
    setBusy(true);
    try {
      await enable({ id: tripId });
    } catch {
      toast.error("Não consegui gerar o link. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (busy) return;
    if (!confirm("Desativar o link? Quem já tem ele perderá acesso.")) return;
    setBusy(true);
    try {
      await disable({ id: tripId });
    } catch {
      toast.error("Não consegui desativar o link. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => { });
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2200);
  }

  async function handleNativeShare() {
    if (!shareUrl) return;
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({
          title: trip?.title ?? "Roteiro NordesteAÍ",
          text: `Olha o roteiro que montei: ${trip?.title}`,
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Compartilhar viagem"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            <div className="px-5 pt-4 pb-2 flex justify-center">
              <span className="h-1 w-12 rounded-full bg-[var(--color-neutral-200)]" />
            </div>
            <div className="px-6 pt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)]">
                  <Icon name="share-2" size={16} />
                </span>
                <h2 className="font-display font-semibold text-[18px] text-[var(--color-neutral-800)]">
                  Compartilhar viagem
                </h2>
              </div>
            </div>

            <div className="px-6 pt-4 flex flex-col gap-3">
              {!token ? (
                <>
                  <p className="text-[14px] leading-[1.5] text-[var(--color-neutral-600)]">
                    Gere um link público pra mostrar o roteiro pra qualquer
                    pessoa. Quem abre vê em modo somente leitura.
                  </p>
                  <button
                    type="button"
                    onClick={handleEnable}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium disabled:opacity-60"
                  >
                    {busy ? (
                      <Icon name="svg-spinners:ring-resize" size={15} />
                    ) : (
                      <Icon name="link-2" size={15} />
                    )}
                    Gerar link de compartilhamento
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-[var(--color-neutral-100)] px-3 py-2.5 flex items-center gap-2">
                    <Icon
                      name="link-2"
                      size={14}
                      className="shrink-0 text-[var(--color-neutral-600)]"
                    />
                    <p className="flex-1 min-w-0 text-[14px] truncate text-[var(--color-neutral-800)]">
                      {shareUrl}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white border border-[var(--color-neutral-300)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-neutral-800)]"
                    >
                      <Icon name={copied ? "check" : "copy"} size={12} />
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium"
                  >
                    <Icon name="share-2" size={15} />
                    Compartilhar
                  </button>

                  <button
                    type="button"
                    onClick={handleDisable}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] py-3 text-[13px] font-medium disabled:opacity-60"
                  >
                    <Icon name="link-2-off" size={14} />
                    Desativar link
                  </button>
                </>
              )}

              <p className="text-[11px] text-[var(--color-neutral-500)] text-center pt-1">
                O link mostra o roteiro com a marca NordesteAÍ e um botão pro
                visitante criar o roteiro dele.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
