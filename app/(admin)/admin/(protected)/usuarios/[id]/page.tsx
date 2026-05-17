"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: idStr } = use(params);
  const userId = idStr as Id<"users">;

  const user = useQuery(api.usersAdmin.get, { id: userId });
  const updateProfile = useMutation(api.usersAdmin.updateProfile);
  const setRole = useMutation(api.usersAdmin.setRole);
  const markVerified = useMutation(api.usersAdmin.markEmailVerified);
  const unmarkVerified = useMutation(api.usersAdmin.unmarkEmailVerified);
  const remove = useMutation(api.usersAdmin.remove);

  // Editable form state, initialized from server doc
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setWhatsapp(maskWhatsapp(user.whatsapp));
    }
  }, [user]);

  if (user === undefined) {
    return <SkeletonPage />;
  }
  if (user === null) {
    return (
      <main className="text-center py-20">
        <p className="text-[14px] text-[var(--color-neutral-600)] mb-4">
          Usuário não encontrado.
        </p>
        <Link
          href="/admin/usuarios"
          className="inline-block h-10 px-4 leading-10 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium"
        >
          Voltar à lista
        </Link>
      </main>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        id: userId,
        name,
        email,
        whatsapp,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(newRole: "admin" | "customer") {
    if (newRole === user!.role) return;
    if (!confirm(`Mudar o role pra "${newRole}"?`)) return;
    setSaving(true);
    setError("");
    try {
      await setRole({ id: userId, role: newRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao mudar role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVerified() {
    setSaving(true);
    setError("");
    try {
      if (user!.emailVerificationTime) {
        await unmarkVerified({ id: userId });
      } else {
        await markVerified({ id: userId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `EXCLUIR ${user!.name || user!.email}? Isso apaga viagens, favoritos e a conta. Não dá pra desfazer.`,
      )
    )
      return;
    setSaving(true);
    try {
      await remove({ id: userId });
      router.push("/admin/usuarios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir.");
      setSaving(false);
    }
  }

  return (
    <main className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/usuarios"
          aria-label="Voltar"
          className="grid size-9 place-items-center rounded-full hover:bg-[var(--color-neutral-100)] transition-colors"
        >
          <Icon name="arrow-left" size={18} />
        </Link>
        <div className="grid size-12 place-items-center rounded-full bg-[var(--color-neutral-100)] font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
          {(user.name || user.email || "?")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-medium text-[20px] text-[var(--color-neutral-800)] truncate">
            {user.name || "(sem nome)"}
          </h1>
          <p className="text-[12px] text-[var(--color-neutral-600)] truncate">
            {user.email} · Criado em {fmtDateTime(user._creationTime)}
          </p>
        </div>
        <span
          className={`text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 ${
            user.role === "admin"
              ? "bg-[var(--color-brand-yellow)] text-[var(--color-neutral-800)]"
              : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
          }`}
        >
          {user.role}
        </span>
      </div>

      {error && (
        <p className="mb-4 text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Profile editor */}
        <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
          <h2 className="font-display font-medium text-[15px] text-[var(--color-neutral-800)] mb-4">
            Perfil
          </h2>
          <div className="flex flex-col gap-3">
            <Field label="Nome" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field
              label="WhatsApp"
              value={whatsapp}
              onChange={(v) => setWhatsapp(maskWhatsapp(v))}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            {savedAt && (
              <p className="text-[12px] text-emerald-700">
                Salvo {fmtDateTime(savedAt)}
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ml-auto h-10 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </section>

        {/* Sidebar, role + verification + danger zone */}
        <div className="flex flex-col gap-4">
          {/* Role */}
          <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
            <h3 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
              Role
            </h3>
            <div className="flex flex-col gap-2">
              {(["admin", "customer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  disabled={saving || user.role === r}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border text-left text-[13px] transition-colors disabled:cursor-default ${
                    user.role === r
                      ? "border-[var(--color-neutral-800)] bg-[var(--color-neutral-100)] font-medium"
                      : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-800)]"
                  }`}
                >
                  <span className="grid size-4 place-items-center rounded-full border-2 border-current shrink-0">
                    {user.role === r && (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Verification */}
          <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
            <h3 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
              Verificação de email
            </h3>
            {user.emailVerificationTime ? (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] text-emerald-700 inline-flex items-center gap-1">
                  <Icon name="check-circle" size={12} />
                  Verificado em {fmtDateTime(user.emailVerificationTime)}
                </p>
                <button
                  type="button"
                  onClick={handleToggleVerified}
                  disabled={saving}
                  className="h-9 rounded-full bg-white border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] text-[12px] font-medium disabled:opacity-50"
                >
                  Desmarcar como verificado
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] text-amber-700 inline-flex items-center gap-1">
                  <Icon name="alert-circle" size={12} />
                  Email não verificado
                </p>
                <button
                  type="button"
                  onClick={handleToggleVerified}
                  disabled={saving}
                  className="h-9 rounded-full bg-[var(--color-neutral-800)] text-white text-[12px] font-medium disabled:opacity-50"
                >
                  Marcar como verificado
                </button>
              </div>
            )}
          </section>

          {/* Activity summary */}
          <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
            <h3 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] mb-3">
              Atividade
            </h3>
            <div className="text-[13px] text-[var(--color-neutral-700)] space-y-2">
              <Row label="Viagens" value={String(user.trips.length)} />
              <Row label="Favoritos" value={String(user.favorites.length)} />
              <Row
                label="Welcome enviado"
                value={user.welcomedAt ? fmtDateTime(user.welcomedAt) : "Não"}
              />
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-red-300 bg-white p-5">
            <h3 className="font-display font-medium text-[14px] text-red-600 mb-2">
              Zona de risco
            </h3>
            <p className="text-[12px] text-[var(--color-neutral-700)] mb-3">
              Excluir essa conta apaga viagens, favoritos e dados associados. Não dá pra desfazer.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="w-full h-10 rounded-full bg-red-600 text-white text-[13px] font-medium disabled:opacity-50"
            >
              Excluir usuário
            </button>
          </section>
        </div>
      </div>

      {/* Trips list */}
      {user.trips.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5">
          <h2 className="font-display font-medium text-[15px] text-[var(--color-neutral-800)] mb-3">
            Viagens
          </h2>
          <div className="flex flex-col gap-2">
            {user.trips.map((t) => (
              <Link
                key={t._id}
                href={`/minha-viagem/${t._id}`}
                className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--color-neutral-100)] hover:border-[var(--color-neutral-300)] transition-colors"
              >
                <Icon name="map-pin" size={14} className="text-[var(--color-neutral-700)]" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-medium text-[13px] text-[var(--color-neutral-800)] truncate">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-[var(--color-neutral-600)] truncate">
                    {t.destination} · {t.status}
                  </p>
                </div>
                <Icon name="chevron-right" size={12} className="text-[var(--color-neutral-500)]" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email";
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-[var(--color-neutral-700)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-[10px] border border-[var(--color-neutral-300)] px-3 text-[14px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)]"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-neutral-600)]">{label}</span>
      <span className="font-medium text-[var(--color-neutral-800)]">{value}</span>
    </div>
  );
}

function SkeletonPage() {
  return (
    <main className="max-w-4xl animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-9 rounded-full bg-[var(--color-neutral-100)]" />
        <div className="size-12 rounded-full bg-[var(--color-neutral-100)]" />
        <div className="flex-1">
          <div className="h-4 w-32 rounded bg-[var(--color-neutral-100)] mb-2" />
          <div className="h-3 w-48 rounded bg-[var(--color-neutral-100)]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="h-72 rounded-2xl bg-[var(--color-neutral-100)]" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-[var(--color-neutral-100)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
