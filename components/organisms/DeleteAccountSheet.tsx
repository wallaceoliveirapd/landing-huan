"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { bottomSheetSpring } from "@/lib/motion-presets";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Reason = "nao-uso" | "privacidade" | "bugs" | "duplicidade" | "outro";

const REASONS: { value: Reason; label: string; desc: string }[] = [
  { value: "nao-uso", label: "Não uso mais", desc: "Não tenho mais interesse no serviço." },
  { value: "privacidade", label: "Preocupação com privacidade", desc: "Quero apagar meus dados." },
  { value: "bugs", label: "Encontrei bugs ou problemas técnicos", desc: "Algo não está funcionando bem." },
  { value: "duplicidade", label: "Tenho conta duplicada", desc: "Já tenho outra conta no app." },
  { value: "outro", label: "Outro motivo", desc: "Vou explicar abaixo." },
];

type Props = { open: boolean; onClose: () => void };

export function DeleteAccountSheet({ open, onClose }: Props) {
  useBodyScrollLock(open);
  const router = useRouter();
  const auth = useAuth();
  const requestDeletion = useMutation(api.users.requestDeletion);

  const [reason, setReason] = useState<Reason | "">("");
  const [feedback, setFeedback] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setReason("");
    setFeedback("");
    setConfirm(false);
    setSubmitting(false);
    setError("");
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleDelete() {
    if (!reason || !confirm || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await requestDeletion({ reason, feedback: feedback.trim() || undefined });
      await auth.signOut();
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo deu errado.";
      setError(msg);
      setSubmitting(false);
    }
  }

  const canDelete = !!reason && confirm && !submitting;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[80] bg-black/20"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Excluir conta"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <span className="h-1 w-12 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-2 pb-4 shrink-0">
              <div className="grid size-10 place-items-center rounded-full bg-red-50 shrink-0">
                <Icon name="triangle-alert" size={18} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-medium text-[20px] text-[var(--color-neutral-800)]">
                  Excluir minha conta
                </h2>
                <p className="text-[13px] text-[var(--color-neutral-600)] mt-1">
                  Vai deletar permanentemente sua conta, viagens e favoritos. Não dá pra desfazer.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fechar"
                disabled={submitting}
                className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)] disabled:opacity-50"
              >
                <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
              </button>
            </div>

            {/* Body, scrollable */}
            <div className="overflow-y-auto px-6 pb-4 flex-1">
              <p className="text-[13px] font-medium text-[var(--color-neutral-800)] mb-3">
                Antes de excluir, conta pra gente: por que está saindo?
              </p>
              <div className="flex flex-col gap-2 mb-5">
                {REASONS.map((r) => {
                  const sel = reason === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReason(r.value)}
                      className={`flex items-start gap-3 p-4 rounded-[16px] bg-white border text-left transition-colors ${sel
                          ? "border-[var(--color-neutral-800)] border-2"
                          : "border-[var(--color-neutral-300)]"
                        }`}
                    >
                      <span
                        className={`grid size-5 place-items-center rounded-full border-2 shrink-0 mt-0.5 ${sel ? "border-[var(--color-neutral-800)]" : "border-[var(--color-neutral-300)]"
                          }`}
                      >
                        {sel && <span className="size-2 rounded-full bg-[var(--color-neutral-800)]" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                          {r.label}
                        </p>
                        <p className="text-[12px] text-[var(--color-neutral-600)]">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              <label className="block text-[13px] font-medium text-[var(--color-neutral-800)] mb-2">
                Quer deixar um feedback? (opcional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="O que poderia ter sido melhor?"
                rows={3}
                maxLength={500}
                className="w-full rounded-[16px] border border-[var(--color-neutral-300)] px-4 py-3 text-[14px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors resize-none"
              />
              <p className="text-[11px] text-[var(--color-neutral-500)] mt-1">
                {feedback.length}/500
              </p>

              {/* Confirm checkbox */}
              <label className="mt-5 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  className="mt-1 size-4 accent-black"
                />
                <span className="text-[13px] leading-[1.5] text-[var(--color-neutral-700)]">
                  Eu entendo que essa ação é <strong className="font-medium text-[var(--color-neutral-800)]">permanente</strong>. Minha conta, minhas viagens e meus favoritos serão excluídos.
                </span>
              </label>

              {error && (
                <p className="mt-4 text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pt-3 pb-6 shrink-0 border-t border-[var(--color-neutral-100)] bg-white flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 h-12 rounded-full bg-white border border-[var(--color-neutral-800)] text-[var(--color-neutral-800)] font-display font-medium text-[14px] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 h-12 rounded-full bg-red-600 text-white font-display font-medium text-[14px] disabled:opacity-40"
              >
                {submitting ? "Excluindo…" : "Excluir definitivamente"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
