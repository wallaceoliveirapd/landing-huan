"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";

type Step = "idle" | "confirm" | "code" | "success";

export default function SegurancaPage() {
  const router = useRouter();
  const auth = useAuth();
  const { signIn } = useAuthActions();
  const viewer = useQuery(api.users.viewer);

  const [step, setStep] = useState<Step>("idle");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Capture email locally so it survives any auth state transition during
  // the reset flow.
  const [emailSnapshot, setEmailSnapshot] = useState("");
  useEffect(() => {
    const e = (viewer as { email?: string } | null)?.email;
    if (e && !emailSnapshot) setEmailSnapshot(e);
  }, [viewer, emailSnapshot]);
  const email = emailSnapshot;

  // Don't pop the auth modal while the user is inside the password change
  // flow, even if Convex Auth briefly flips them to unauthenticated.
  useEffect(() => {
    if (step !== "idle") return;
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated, step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  async function requestReset() {
    if (!email) {
      toast.error("Não encontrei seu email. Recarregue a página.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email, flow: "reset" });
      setStep("code");
      setResendCooldown(45);
      toast.success("Enviei um código de 6 dígitos pro seu email.");
    } catch {
      toast.error("Não consegui enviar o código. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      toast.error("Digite os 6 dígitos do código.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", {
        email,
        code: digits,
        newPassword,
        flow: "reset-verification",
      });
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("invalid") || msg.includes("expired")) {
        toast.error("Código inválido ou expirado.");
      } else {
        toast.error("Não consegui alterar. Tente de novo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function finishAndSignOut() {
    try {
      await auth.signOut();
    } catch {
      /* signOut failures are non-fatal here */
    }
    router.push("/");
  }

  return (
    <SettingsLayout
      title="Login e segurança"
      subtitle="Gerencie sua senha e dispositivos conectados."
    >
      <div className="flex flex-col gap-3 max-w-md">
        <Row icon="key-round" label="Senha" value="••••••••" />
        <Row icon="mail-check" label="E-mail verificado" value="Sim" />
        <Row icon="smartphone" label="Sessões ativas" value="1 dispositivo" />

        {step === "idle" && (
          <button
            type="button"
            onClick={() => setStep("confirm")}
            disabled={!email}
            className="mt-2 h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50"
          >
            Alterar senha
          </button>
        )}

        {step === "code" && (
          <form onSubmit={submitNewPassword} className="mt-3 flex flex-col gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
            <p className="text-[13px] text-[var(--color-neutral-700)] leading-[1.5]">
              Enviei um código de 6 dígitos para <strong>{email}</strong>. Digite abaixo e escolha a nova senha.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-center tracking-[6px] font-mono text-[18px] outline-none focus:border-[var(--color-neutral-800)]"
            />

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 8 caracteres)"
              minLength={8}
              className="h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[15px] outline-none focus:border-[var(--color-neutral-800)]"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              minLength={8}
              className="h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[15px] outline-none focus:border-[var(--color-neutral-800)]"
            />

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>

            <div className="flex items-center justify-between text-[12px]">
              <button
                type="button"
                onClick={requestReset}
                disabled={resendCooldown > 0 || loading}
                className="font-medium text-[var(--color-neutral-700)] disabled:opacity-40"
              >
                {resendCooldown > 0
                  ? `Reenviar em ${resendCooldown}s`
                  : "Reenviar código"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("idle"); setCode(""); setNewPassword(""); setConfirmPassword(""); }}
                className="font-medium text-[var(--color-neutral-600)]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          onClick={auth.signOut}
          className="mt-2 h-12 rounded-full bg-white border border-[var(--color-neutral-800)] text-[var(--color-neutral-800)] font-display font-medium text-[15px]"
        >
          Sair da conta
        </button>
      </div>

      {/* Confirm modal before starting the reset flow */}
      <AnimatePresence>
        {step === "confirm" && (
          <ConfirmModal
            title="Vamos trocar sua senha"
            body={
              <>
                <p>
                  Vou enviar um código de 6 dígitos para <strong>{email}</strong>.
                  Depois que você confirmar a nova senha, vou te desconectar pra
                  que entre com a senha nova.
                </p>
                <p className="mt-2 text-[12px] text-[var(--color-neutral-600)]">
                  Esse é o jeito mais seguro de garantir que é você mesmo
                  trocando a senha.
                </p>
              </>
            }
            cancelLabel="Agora não"
            confirmLabel={loading ? "Enviando..." : "Enviar código"}
            onCancel={() => setStep("idle")}
            onConfirm={() => requestReset()}
            loading={loading}
          />
        )}
        {step === "success" && (
          <ConfirmModal
            title="Senha alterada!"
            body={
              <p>
                Sua senha foi atualizada. Vou te desconectar agora, é só entrar
                de novo usando a senha nova.
              </p>
            }
            confirmLabel="Entrar com a nova senha"
            onConfirm={finishAndSignOut}
            loading={false}
          />
        )}
      </AnimatePresence>
    </SettingsLayout>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
      <Icon name={icon} size={18} className="text-[var(--color-neutral-800)]" />
      <p className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
        {label}
      </p>
      <span className="text-[13px] text-[var(--color-neutral-600)]">{value}</span>
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
}: {
  title: string;
  body: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/20"
        onClick={onCancel}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[80] mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 className="font-display font-medium text-[20px] leading-[1.2] text-[var(--color-neutral-800)] mb-3">
          {title}
        </h2>
        <div className="text-[14px] leading-[1.55] text-[var(--color-neutral-700)] mb-5">
          {body}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50"
          >
            {confirmLabel}
          </button>
          {cancelLabel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-12 rounded-full bg-white border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] font-display font-medium text-[14px] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
