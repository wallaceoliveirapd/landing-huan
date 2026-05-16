"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";

export default function AdminLoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: mode });
      router.push("/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (mode === "signIn" && msg.includes("not found")) {
        setError("Usuário não encontrado. Use 'Criar conta' para o primeiro acesso.");
      } else if (mode === "signUp" && msg.includes("already exists")) {
        setError("Usuário já existe. Use 'Entrar' para fazer login.");
        setMode("signIn");
      } else {
        setError("E-mail ou senha inválidos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-100)] p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="font-display font-bold text-3xl text-[var(--color-brand-purple)]">
            HUAN
          </span>
          <p className="text-sm text-[var(--color-neutral-600)]">
            Painel administrativo
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="font-display font-medium text-lg text-[var(--color-neutral-800)]">
            {mode === "signIn" ? "Entrar" : "Criar conta admin"}
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-neutral-800)]">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-[var(--color-neutral-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors"
              placeholder="admin@huan.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-neutral-800)]">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-xl border border-[var(--color-neutral-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-6 py-3 font-display font-medium text-white transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <Icon name="svg-spinners:ring-resize" size={18} />
            ) : mode === "signIn" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-4 text-center text-sm text-[var(--color-neutral-600)]">
          {mode === "signIn" ? (
            <>
              Primeiro acesso?{" "}
              <button
                onClick={() => { setMode("signUp"); setError(""); }}
                className="text-[var(--color-brand-purple)] font-medium hover:underline"
              >
                Criar conta admin
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                onClick={() => { setMode("signIn"); setError(""); }}
                className="text-[var(--color-brand-purple)] font-medium hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
