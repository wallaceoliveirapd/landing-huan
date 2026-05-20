"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { Confetti } from "@/components/atoms/Confetti";
import { toast } from "sonner";

type Props = { params: Promise<{ token: string }> };

/**
 * /convite/[token] — full-screen page rendered when an invitee clicks
 * the share link. Shows trip info, asks them to log in (if needed) and
 * confirms acceptance with confetti.
 */
export default function ConvitePage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const auth = useAuth();

  const invite = useQuery(api.tripCollab.peekInvite, { token });
  const me = useQuery(api.users.viewer, auth.isAuthenticated ? {} : "skip");
  const accept = useMutation(api.tripCollab.acceptInvite);
  const decline = useMutation(api.tripCollab.declineInvite);

  const [accepting, setAccepting] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [redirectId, setRedirectId] = useState<string | null>(null);

  // After confetti + delay, push to the trip detail page.
  useEffect(() => {
    if (!redirectId) return;
    const t = setTimeout(() => {
      router.push(`/minha-viagem/${redirectId}`);
    }, 2200);
    return () => clearTimeout(t);
  }, [redirectId, router]);

  async function handleAccept() {
    if (accepting) return;
    if (!auth.isAuthenticated) {
      auth.openAuthModal();
      return;
    }
    setAccepting(true);
    try {
      const res = await accept({ token });
      setConfettiOn(true);
      setRedirectId(res.tripId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não consegui aceitar.";
      toast.error(msg);
      setAccepting(false);
    }
  }

  async function handleDecline() {
    try {
      await decline({ token });
      toast.success("Convite recusado.");
      router.push("/");
    } catch {
      toast.error("Não consegui recusar.");
    }
  }

  if (invite === undefined) {
    return (
      <main className="min-h-screen bg-white grid place-items-center">
        <Icon name="svg-spinners:ring-resize" size={32} className="text-[var(--color-neutral-400)]" />
      </main>
    );
  }

  if (invite === null) {
    return (
      <main className="min-h-screen bg-white grid place-items-center p-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]">
            <Icon name="link-2-off" size={22} />
          </span>
          <h1 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
            Convite expirado
          </h1>
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Esse link já foi usado ou cancelado pelo dono da viagem.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white px-5 py-3 text-[14px] font-medium"
          >
            Ir para a página inicial
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white grid place-items-center p-6 text-center">
      <Confetti active={confettiOn} />
      <AnimatePresence mode="wait">
        {!redirectId ? (
          <motion.div
            key="invite"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-5 max-w-sm"
          >
            {/* Inviter avatar — single, big, white ring + soft shadow */}
            <AvatarBubble
              src={invite.owner.image ?? undefined}
              name={invite.owner.name ?? "Convite"}
              size={140}
            />

            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-brand-purple)]">
                Convite de viagem
              </p>
              <h1 className="font-display font-medium text-[26px] leading-[1.15] text-[var(--color-neutral-800)]">
                {firstName(invite.owner.name) || "Alguém"} te chamou pra viajar junto
              </h1>
            </div>

            <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white px-5 py-4 w-full text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                {invite.duration ?? "?"} dia(s) • {invite.role === "edit" ? "Pode editar" : "Somente leitura"}
              </p>
              <p className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] mt-1">
                {invite.title}
              </p>
              <p className="text-[13px] text-[var(--color-neutral-600)] inline-flex items-center gap-1.5 mt-1">
                <Icon name="map-pin" size={12} />
                {invite.destination}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium disabled:opacity-60"
              >
                {accepting ? (
                  <Icon name="svg-spinners:ring-resize" size={14} />
                ) : (
                  <Icon name="check" size={14} />
                )}
                {auth.isAuthenticated ? "Aceitar convite" : "Entrar e aceitar"}
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] py-2"
              >
                Recusar
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="flex flex-col items-center gap-4"
          >
            <span className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" size={28} />
            </span>
            <h1 className="font-display font-semibold text-[24px] text-[var(--color-neutral-800)]">
              Aceito! 🎉
            </h1>
            <p className="text-[14px] text-[var(--color-neutral-600)]">
              Levando você pra viagem...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AvatarBubble({
  src,
  name,
  size = 48,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative rounded-full overflow-hidden bg-[var(--color-brand-purple)] grid place-items-center text-white font-display font-semibold ring-[6px] ring-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

function firstName(full: string | null | undefined): string {
  if (!full) return "";
  const p = full.trim().split(/\s+/)[0];
  return p ?? "";
}
