"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { Confetti } from "@/components/atoms/Confetti";

const DISMISSED_KEY = "nordestai-invite-dismissed";

function firstName(full: string | null | undefined): string {
  if (!full) return "";
  return full.trim().split(/\s+/)[0] ?? "";
}

function initials(name: string | null | undefined, email?: string): string {
  const base = (name && name.trim()) || (email ?? "").split("@")[0];
  if (!base) return "?";
  return base
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Full-screen modal that pops up when a logged-in user opens the app
 * with pending invites tied to their email. Cycles through invites
 * one at a time. Each session-dismissed invite stays hidden until
 * the next login.
 */
export function PendingInviteAlert() {
  const auth = useAuth();
  const router = useRouter();
  const invites = useQuery(
    api.tripCollab.myPendingInvites,
    auth.isAuthenticated ? {} : "skip",
  );
  const acceptInvite = useMutation(api.tripCollab.acceptInvite);
  const declineInvite = useMutation(api.tripCollab.declineInvite);

  const [index, setIndex] = useState(0);
  const [dismissedTokens, setDismissedTokens] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<{ tripId: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Load session-dismissed tokens from sessionStorage so they don't
  // re-popup on every navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(DISMISSED_KEY);
      if (raw) setDismissedTokens(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  // After accept confetti, redirect to trip detail.
  useEffect(() => {
    if (!accepted) return;
    const t = setTimeout(() => {
      router.push(`/minha-viagem/${accepted.tripId}`);
      setAccepted(null);
    }, 2200);
    return () => clearTimeout(t);
  }, [accepted, router]);

  const filtered = (invites ?? []).filter(
    (i) => !dismissedTokens.includes(i.token),
  );
  const current = filtered[index];

  if (!auth.isAuthenticated || !current) return null;
  if (typeof document === "undefined") return null;

  function dismissCurrent() {
    if (!current) return;
    const next = [...dismissedTokens, current.token];
    setDismissedTokens(next);
    try {
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
    setIndex(0);
  }

  async function handleAccept() {
    if (busy || !current) return;
    setBusy(true);
    try {
      const res = await acceptInvite({ token: current.token });
      setAccepted({ tripId: res.tripId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não consegui aceitar.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    if (busy || !current) return;
    setBusy(true);
    try {
      await declineInvite({ token: current.token });
      toast.success("Convite recusado.");
      dismissCurrent();
    } catch {
      toast.error("Não consegui recusar.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {(current || accepted) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Convite de viagem"
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="fixed inset-0 z-[95] grid place-items-center p-6 pointer-events-none"
          >
            <Confetti active={!!accepted} />
            <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden">
              {/* Top close (only when invite pending, not on success) */}
              {!accepted && (
                <button
                  type="button"
                  onClick={dismissCurrent}
                  aria-label="Fechar"
                  className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
                >
                  <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {!accepted ? (
                  <motion.div
                    key="invite"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-6 pt-10 pb-6 flex flex-col items-center text-center"
                  >
                    <BigAvatar
                      src={current?.owner.image ?? undefined}
                      name={current?.owner.name ?? "Convite"}
                      email={current?.owner.name ?? undefined}
                    />
                    <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-brand-purple)]">
                      Convite de viagem
                    </p>
                    <h2 className="mt-1 font-display font-medium text-[22px] leading-[1.2] text-[var(--color-neutral-800)] max-w-[280px]">
                      {firstName(current?.owner.name) || "Alguém"} te chamou pra viajar junto
                    </h2>

                    <div className="mt-4 w-full rounded-2xl border border-[var(--color-neutral-200)] bg-white px-4 py-3 text-left">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                        {current?.duration ?? "?"} dia(s) •{" "}
                        {current?.role === "edit" ? "Pode editar" : "Só leitura"}
                      </p>
                      <p className="font-display font-medium text-[16px] text-[var(--color-neutral-800)] mt-0.5 truncate">
                        {current?.title}
                      </p>
                      <p className="text-[12px] text-[var(--color-neutral-600)] inline-flex items-center gap-1.5 mt-0.5">
                        <Icon name="map-pin" size={11} />
                        {current?.destination}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 w-full">
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium disabled:opacity-60"
                      >
                        {busy ? (
                          <Icon name="svg-spinners:ring-resize" size={14} />
                        ) : (
                          <Icon name="check" size={14} />
                        )}
                        Aceitar convite
                      </button>
                      <button
                        type="button"
                        onClick={handleDecline}
                        disabled={busy}
                        className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] py-2"
                      >
                        Recusar
                      </button>
                    </div>

                    {filtered.length > 1 && (
                      <p className="mt-3 text-[11px] text-[var(--color-neutral-500)]">
                        Convite {index + 1} de {filtered.length}
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="px-6 pt-12 pb-10 flex flex-col items-center text-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0.5, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 18 }}
                    >
                      <BigAvatar
                        src={current?.owner.image ?? undefined}
                        name={current?.owner.name ?? "Convite"}
                      />
                    </motion.div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                        Convite aceito
                      </p>
                      <h2 className="mt-1 font-display font-medium text-[22px] leading-[1.2] text-[var(--color-neutral-800)] max-w-[280px]">
                        Você está dentro 🎉
                      </h2>
                      <p className="mt-2 text-[13px] text-[var(--color-neutral-600)]">
                        Levando você pra viagem de {firstName(current?.owner.name) || "Huan"}...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function BigAvatar({
  src,
  name,
  email,
}: {
  src?: string;
  name: string;
  email?: string;
}) {
  return (
    <div
      className="relative rounded-full overflow-hidden bg-[var(--color-brand-purple)] grid place-items-center text-white font-display font-semibold ring-[6px] ring-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
      style={{ width: 120, height: 120, fontSize: 40 }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes="120px" className="object-cover" />
      ) : (
        <span>{initials(name, email)}</span>
      )}
    </div>
  );
}
