"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";

type Role = "edit" | "view";

type DraftInvite = {
  email: string;
  role: Role;
  name?: string | null;
  image?: string | null;
};

// Two wizard steps when there are no people yet; review when there are.
const WIZARD_STEPS = ["onboarding", "compose"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

function shortName(full: string | null | undefined): string {
  if (!full) return "";
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function initialsFor(name: string | null | undefined, email?: string): string {
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

export function CollabInviteSheet({
  open,
  tripId,
  onClose,
}: {
  open: boolean;
  tripId: Id<"trips">;
  onClose: () => void;
}) {
  const people = useQuery(api.tripCollab.peopleForTrip, { tripId });

  const hasPeople =
    !!people &&
    (people.collaborators.length > 0 || people.pendingInvites.length > 0);

  // Modes:
  //  - "review"  : there are already collabs/pending — show list with Add CTA
  //  - "wizard"  : no one yet — run onboarding → compose
  //  - "compose-modal": invoked from review's Add CTA — overlay compose form
  const [mode, setMode] = useState<"review" | "wizard" | "compose-modal">("wizard");
  const [wizardStep, setWizardStep] = useState<WizardStep>("onboarding");
  const [draft, setDraft] = useState<DraftInvite[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<Role>("edit");
  const [sending, setSending] = useState(false);

  const lookup = useQuery(
    api.tripCollab.findByEmail,
    emailInput.includes("@") ? { email: emailInput } : "skip",
  );
  const createInvite = useMutation(api.tripCollab.createInvite);
  const cancelInvite = useMutation(api.tripCollab.cancelInvite);
  const changeRole = useMutation(api.tripCollab.changeCollaboratorRole);
  const removeCollab = useMutation(api.tripCollab.removeCollaborator);

  // Reset on open/close. Once people loads, decide initial mode.
  useEffect(() => {
    if (!open) {
      setMode("wizard");
      setWizardStep("onboarding");
      setDraft([]);
      setEmailInput("");
      setRole("edit");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (people === undefined) return; // still loading
    setMode((prev) => {
      // Only auto-select on first resolve. Don't yank user out of compose-modal.
      if (prev === "compose-modal") return prev;
      return hasPeople ? "review" : "wizard";
    });
  }, [open, people, hasPeople]);

  function pushDraft() {
    const e = emailInput.trim().toLowerCase();
    if (!e || !e.includes("@")) {
      toast.error("E-mail inválido");
      return;
    }
    if (draft.some((d) => d.email === e)) {
      toast.error("Esse e-mail já está na lista.");
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        email: e,
        role,
        name: lookup?.name ?? null,
        image: lookup?.image ?? null,
      },
    ]);
    setEmailInput("");
  }

  async function handleSendAll() {
    if (draft.length === 0) return;
    setSending(true);
    let okCount = 0;
    for (const d of draft) {
      try {
        await createInvite({ tripId, email: d.email, role: d.role });
        okCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falhou";
        toast.error(`${d.email}: ${msg}`);
      }
    }
    setSending(false);
    if (okCount > 0) {
      toast.success(
        `${okCount} convite${okCount > 1 ? "s" : ""} enviado${okCount > 1 ? "s" : ""}`,
      );
      setDraft([]);
      setEmailInput("");
      setMode("review");
    }
  }

  function headerBack() {
    if (mode === "wizard" && wizardStep === "compose") {
      setWizardStep("onboarding");
    } else if (mode === "compose-modal") {
      setMode("review");
      setDraft([]);
      setEmailInput("");
    } else {
      onClose();
    }
  }

  const isWizardOnboarding = mode === "wizard" && wizardStep === "onboarding";
  const headerIcon = isWizardOnboarding || mode === "review" ? "x" : "arrow-left";
  const headerTitle =
    mode === "review"
      ? "Pessoas da viagem"
      : mode === "compose-modal"
        ? "Convidar amigos"
        : wizardStep === "onboarding"
          ? null // matches criar viagem onboarding (no title)
          : "Convidar amigos";

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
            className="fixed inset-0 z-[70] bg-black/30"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Convidar para a viagem"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed inset-0 z-[80] bg-white flex flex-col"
          >
            {/* Header: criar-viagem style — circle button + title */}
            <div
              className="flex items-center gap-3 px-6 pb-2 shrink-0"
              style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
            >
              <button
                type="button"
                onClick={headerBack}
                aria-label={headerIcon === "x" ? "Fechar" : "Voltar"}
                className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
              >
                <Icon
                  name={headerIcon}
                  size={20}
                  className="text-[var(--color-neutral-800)]"
                />
              </button>
              {headerTitle && (
                <span className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
                  {headerTitle}
                </span>
              )}
            </div>

            {/* Progress bar only in wizard compose step (matches criar viagem) */}
            {mode === "wizard" && wizardStep === "compose" && (
              <div className="flex gap-2 px-6 pt-3 pb-1 shrink-0">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full overflow-hidden bg-[var(--color-neutral-200)]"
                  >
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-neutral-800)]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: i <= 0 ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      style={{ originX: 0 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                {mode === "wizard" && wizardStep === "onboarding" && (
                  <OnboardingStep key="ob" />
                )}
                {((mode === "wizard" && wizardStep === "compose") ||
                  mode === "compose-modal") && (
                  <ComposeStep
                    key="compose"
                    emailInput={emailInput}
                    onEmailInput={setEmailInput}
                    role={role}
                    onRole={setRole}
                    lookup={lookup ?? null}
                    draft={draft}
                    onAdd={pushDraft}
                    onRemoveDraft={(email) =>
                      setDraft((d) => d.filter((i) => i.email !== email))
                    }
                  />
                )}
                {mode === "review" && (
                  <ReviewStep
                    key="review"
                    people={people ?? null}
                    onCancelInvite={(email) =>
                      cancelInvite({ tripId, email }).catch(() => toast.error("Falhou"))
                    }
                    onRemoveCollab={(userId) =>
                      removeCollab({ tripId, collaboratorUserId: userId }).catch(() =>
                        toast.error("Falhou"),
                      )
                    }
                    onChangeRole={(userId, r) =>
                      changeRole({ tripId, collaboratorUserId: userId, role: r }).catch(() =>
                        toast.error("Falhou"),
                      )
                    }
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <footer
              className="border-t border-[var(--color-neutral-100)] px-5 py-3 shrink-0"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
            >
              {mode === "wizard" && wizardStep === "onboarding" && (
                <button
                  type="button"
                  onClick={() => setWizardStep("compose")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium"
                >
                  Começar
                  <Icon name="arrow-right" size={14} />
                </button>
              )}
              {((mode === "wizard" && wizardStep === "compose") ||
                mode === "compose-modal") && (
                <button
                  type="button"
                  onClick={handleSendAll}
                  disabled={sending || draft.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium disabled:opacity-50"
                >
                  {sending ? (
                    <Icon name="svg-spinners:ring-resize" size={14} />
                  ) : (
                    <Icon name="send" size={14} />
                  )}
                  Enviar {draft.length > 0 ? `(${draft.length})` : ""}
                </button>
              )}
              {mode === "review" && (
                <button
                  type="button"
                  onClick={() => setMode("compose-modal")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white py-3 text-[14px] font-medium"
                >
                  <Icon name="plus" size={14} />
                  Adicionar pessoas
                </button>
              )}
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── Onboarding — 3 character circles ──────────────────────────────────────
function OnboardingStep() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center text-center px-6 pt-12 pb-8"
    >
      <div className="relative h-[200px] w-full max-w-xs flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 320, damping: 22 }}
          className="absolute z-10"
        >
          <CharacterCircle src="/images/my-trips/share/person-02.png" size={120} />
        </motion.div>
        <motion.div
          initial={{ x: -180, opacity: 0 }}
          animate={{ x: -64, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
        >
          <CharacterCircle src="/images/my-trips/share/person-01.png" size={96} />
        </motion.div>
        <motion.div
          initial={{ x: 180, opacity: 0 }}
          animate={{ x: 64, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
        >
          <CharacterCircle src="/images/my-trips/share/person-03.png" size={96} />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.35 }}
        className="mt-6 font-display font-medium text-[24px] leading-[1.2] text-[var(--color-neutral-800)] max-w-[280px]"
      >
        Viaje junto com quem você ama
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.35 }}
        className="mt-2 text-[14px] leading-[1.55] text-[var(--color-neutral-600)] max-w-[320px]"
      >
        Convide amigos pra ver o roteiro ou editar com você. Cada um vê o que
        contribuiu, combinado, organizado, sem chat solto.
      </motion.p>
    </motion.div>
  );
}

function CharacterCircle({ src, size = 96 }: { src: string; size?: number }) {
  return (
    <div
      className="relative rounded-full bg-[var(--color-neutral-100)] ring-4 ring-white shadow-md flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div className="relative" style={{ width: size * 0.78, height: size * 0.78 }}>
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-contain" />
      </div>
    </div>
  );
}

// ─── Compose ──────────────────────────────────────────────────────────────
function ComposeStep({
  emailInput,
  onEmailInput,
  role,
  onRole,
  lookup,
  draft,
  onAdd,
  onRemoveDraft,
}: {
  emailInput: string;
  onEmailInput: (v: string) => void;
  role: Role;
  onRole: (v: Role) => void;
  lookup: { name: string | null; image: string | null } | null;
  draft: DraftInvite[];
  onAdd: () => void;
  onRemoveDraft: (email: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="px-5 pt-5 pb-6 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
          E-mail
        </label>
        <div className="relative">
          <input
            type="email"
            inputMode="email"
            value={emailInput}
            onChange={(e) => onEmailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            placeholder="amigo@exemplo.com"
            className="w-full h-11 px-3 pr-32 rounded-[12px] border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
          />
          <button
            type="button"
            onClick={onAdd}
            className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--color-neutral-800)] text-white px-3 py-2 text-[12px] font-medium"
          >
            <Icon name="plus" size={12} />
            Adicionar
          </button>
        </div>
        {emailInput.includes("@") && lookup && (
          <div className="flex items-center gap-2 mt-2 px-2">
            <AvatarSm name={lookup.name ?? null} email={emailInput} src={lookup.image ?? null} />
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">
                {shortName(lookup.name) || emailInput}
              </span>
              <span className="text-[11px] text-emerald-700">já tem conta NordesteAÍ</span>
            </div>
          </div>
        )}
        {emailInput.includes("@") && lookup === null && (
          <p className="text-[11px] text-[var(--color-neutral-500)] mt-1 px-2">
            Nenhum cadastro encontrado — a pessoa vai criar conta com esse e-mail
            ao receber o link.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
          Permissão
        </label>
        <div className="grid grid-cols-2 gap-2">
          <RolePill
            active={role === "edit"}
            icon="pencil"
            title="Pode editar"
            desc="Adicionar, remover, mover atividades"
            onClick={() => onRole("edit")}
          />
          <RolePill
            active={role === "view"}
            icon="eye"
            title="Só leitura"
            desc="Ver o roteiro sem mudar"
            onClick={() => onRole("view")}
          />
        </div>
      </div>

      {draft.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
            Vai convidar ({draft.length})
          </p>
          {draft.map((d) => (
            <div
              key={d.email}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-neutral-200)] px-3 py-2.5"
            >
              <AvatarSm name={d.name ?? null} email={d.email} src={d.image ?? null} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--color-neutral-800)] truncate">
                  {shortName(d.name) || d.email}
                </p>
                <p className="text-[11px] text-[var(--color-neutral-500)] truncate">
                  {d.email} • {d.role === "edit" ? "Edição" : "Leitura"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDraft(d.email)}
                aria-label="Remover"
                className="grid size-8 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
              >
                <Icon name="x" size={14} className="text-[var(--color-neutral-600)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RolePill({
  active,
  icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 items-start rounded-2xl border p-3 text-left transition-colors ${active
        ? "border-[var(--color-neutral-800)] border-2"
        : "border-[var(--color-neutral-300)]"
        }`}
    >
      <Icon name={icon} size={18} className="text-[var(--color-neutral-800)]" />
      <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
        {title}
      </p>
      <p className="text-[11px] text-[var(--color-neutral-600)] leading-tight">
        {desc}
      </p>
    </button>
  );
}

// ─── Review (pending + accepted) ───────────────────────────────────────────
type People = {
  isOwner: boolean;
  currentUserId: string;
  owner: { userId: string; name: string | null; email: string | null; image: string | null };
  collaborators: Array<{
    userId: string;
    role: string;
    joinedAt: number;
    name: string | null;
    email: string | null;
    image: string | null;
  }>;
  pendingInvites: Array<{
    email: string;
    role: string;
    token: string;
    createdAt: number;
    name: string | null;
    image: string | null;
  }>;
};

function ReviewStep({
  people,
  onCancelInvite,
  onRemoveCollab,
  onChangeRole,
}: {
  people: People | null;
  onCancelInvite: (email: string) => void;
  onRemoveCollab: (userId: string) => void;
  onChangeRole: (userId: string, role: Role) => void;
}) {
  const hasPending = people && people.pendingInvites.length > 0;
  const hasCollabs = people && people.collaborators.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="px-5 pt-5 pb-8 flex flex-col gap-5"
    >
      {people && (
        <section>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)] mb-2">
            Dono
          </p>
          <PersonRow
            name={people.owner.name}
            email={people.owner.email ?? undefined}
            image={people.owner.image}
            badge="Dono"
          />
        </section>
      )}

      {hasCollabs && (
        <section>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)] mb-2">
            Colaboradores
          </p>
          <div className="flex flex-col gap-2">
            {people!.collaborators.map((c) => (
              <PersonRow
                key={c.userId}
                name={c.name}
                email={c.email ?? undefined}
                image={c.image}
                badge={c.role === "edit" ? "Edição" : "Leitura"}
                trailing={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onChangeRole(c.userId, c.role === "edit" ? "view" : "edit")}
                      className="text-[11px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] px-2"
                    >
                      {c.role === "edit" ? "→ Leitura" : "→ Edição"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCollab(c.userId)}
                      aria-label="Remover"
                      className="grid size-8 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
                    >
                      <Icon name="trash-2" size={14} className="text-[var(--color-neutral-600)]" />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      {hasPending && (
        <section>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)] mb-2">
            Aguardando aceite
          </p>
          <div className="flex flex-col gap-2">
            {people!.pendingInvites.map((inv) => (
              <div key={inv.email} className="opacity-70">
                <PersonRow
                  name={inv.name}
                  email={inv.email}
                  image={inv.image}
                  badge="Aguardando aceite"
                  badgeColor="amber"
                  trailing={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/convite/${inv.token}`;
                          navigator.clipboard.writeText(url).catch(() => { });
                          toast.success("Link copiado!");
                        }}
                        aria-label="Copiar link"
                        className="grid size-8 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
                      >
                        <Icon name="copy" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancelInvite(inv.email)}
                        aria-label="Cancelar"
                        className="grid size-8 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function PersonRow({
  name,
  email,
  image,
  badge,
  badgeColor,
  trailing,
}: {
  name: string | null | undefined;
  email?: string;
  image: string | null | undefined;
  badge?: string;
  badgeColor?: "amber";
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-neutral-200)] px-3 py-2.5">
      <AvatarSm name={name ?? null} email={email} src={image ?? null} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-neutral-800)] truncate">
          {shortName(name) || email || "?"}
        </p>
        {email && (
          <p className="text-[11px] text-[var(--color-neutral-500)] truncate">{email}</p>
        )}
      </div>
      {badge && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor === "amber"
            ? "bg-amber-100 text-amber-800"
            : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
            }`}
        >
          {badge}
        </span>
      )}
      {trailing}
    </div>
  );
}

function AvatarSm({
  name,
  email,
  src,
}: {
  name: string | null;
  email?: string;
  src: string | null;
}) {
  const initials = useMemo(() => initialsFor(name, email), [name, email]);
  if (src) {
    return (
      <div className="relative size-9 rounded-full overflow-hidden bg-[var(--color-neutral-100)] shrink-0">
        <Image src={src} alt={name ?? email ?? ""} fill sizes="36px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="grid size-9 place-items-center rounded-full bg-[var(--color-brand-purple)] text-white font-display font-semibold text-[13px] shrink-0">
      {initials}
    </div>
  );
}
