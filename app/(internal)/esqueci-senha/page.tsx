"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "@/components/atoms/Icon";

type Step = "email" | "code";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const e = params.get("email");
    if (e) setEmail(e);
  }, [params]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Digite seu email.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email: email.trim(), flow: "reset" });
      setStep("code");
      setResendCooldown(45);
      toast.success("Enviei um código pro seu email.");
    } catch {
      toast.error("Não consegui enviar agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function submitNew(e: React.FormEvent) {
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
        email: email.trim(),
        code: digits,
        newPassword,
        flow: "reset-verification",
      });
      toast.success("Senha alterada! Entrando...");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("invalid") || msg.includes("expired")) {
        toast.error("Código inválido ou expirado.");
      } else {
        toast.error("Não consegui salvar. Tente de novo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-white px-6 pb-10 max-w-md mx-auto"
      style={{ paddingTop: "max(env(safe-area-inset-top), 2.5rem)" }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--color-neutral-700)] mb-8"
      >
        <Icon name="arrow-left" size={16} />
        Voltar
      </Link>

      <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)] mb-2">
        Recuperar senha
      </h1>
      <p className="text-[14px] text-[var(--color-neutral-600)] mb-8 leading-[1.5]">
        {step === "email"
          ? "Digite o email da sua conta, vou te mandar um código pra criar uma nova senha."
          : "Enviei um código de 6 dígitos pra esse email. Digita aí e escolhe a nova senha."}
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus
            className="h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[15px] outline-none focus:border-[var(--color-neutral-800)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitNew} className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-neutral-700)] mb-1">
            Email: <strong>{email}</strong>
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

          <div className="flex items-center justify-between text-[12px] pt-1">
            <button
              type="button"
              onClick={() => requestCode()}
              disabled={resendCooldown > 0 || loading}
              className="font-medium text-[var(--color-neutral-700)] disabled:opacity-40"
            >
              {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setNewPassword(""); setConfirmPassword(""); }}
              className="font-medium text-[var(--color-neutral-600)]"
            >
              Trocar email
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
