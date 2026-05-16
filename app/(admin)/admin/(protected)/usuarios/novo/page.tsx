"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

export default function AdminNewUserPage() {
  const router = useRouter();
  const create = useMutation(api.usersAdmin.create);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Nome e email são obrigatórios.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const id = await create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim() ? whatsapp.replace(/\D/g, "") : undefined,
        role,
      });
      router.push(`/admin/usuarios/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário.");
      setSaving(false);
    }
  }

  return (
    <main className="max-w-2xl">
      {/* Header */}
      <header className="mb-6">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] mb-3"
        >
          <Icon name="chevron-left" size={14} />
          Voltar
        </Link>
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Novo usuário
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
          Cria a conta direto no banco. Email já marcado como verificado.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-6 flex flex-col gap-5"
      >
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria Silva"
            className="h-11 px-4 rounded-full bg-white border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
            required
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="h-11 px-4 rounded-full bg-white border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
            required
          />
        </div>

        {/* WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            WhatsApp <span className="lowercase text-[var(--color-neutral-500)] font-normal tracking-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(83) 99999-9999"
            className="h-11 px-4 rounded-full bg-white border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
          />
        </div>

        {/* Role */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              {
                v: "customer" as const,
                label: "Customer",
                desc: "Usuário final do app",
                icon: "user",
              },
              {
                v: "admin" as const,
                label: "Admin",
                desc: "Acesso total ao painel",
                icon: "shield",
              },
            ]).map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors ${
                  role === r.v
                    ? "border-[var(--color-neutral-800)] bg-[var(--color-neutral-50)]"
                    : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-400)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name={r.icon} size={16} className="text-[var(--color-neutral-700)]" />
                  <span className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                    {r.label}
                  </span>
                </div>
                <span className="text-[12px] text-[var(--color-neutral-600)]">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3 text-[12px] text-[var(--color-neutral-700)] leading-relaxed">
          <strong>Heads-up:</strong> isso cria só o registro do usuário, sem senha. Pra ele logar, vai precisar usar &ldquo;esqueci minha senha&rdquo; ou você criar manualmente o auth account.
        </div>

        {error && (
          <p className="text-[13px] text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium disabled:opacity-40"
          >
            {saving ? "Criando…" : "Criar usuário"}
          </button>
          <Link
            href="/admin/usuarios"
            className="h-11 px-5 inline-flex items-center rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] text-[13px] font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
