"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { logAndGetMessage } from "@/lib/errors";

function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function InformacoesPessoaisPage() {
  const auth = useAuth();
  const viewer = useQuery(api.users.viewer);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  useEffect(() => {
    if (viewer) {
      setName((viewer as { name?: string }).name ?? "");
      setWhatsapp(
        maskWhatsapp((viewer as { whatsapp?: string }).whatsapp ?? ""),
      );
    }
  }, [viewer]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ name, whatsapp });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      toast.error(logAndGetMessage("profile.update", err, "Não consegui salvar suas alterações."));
    } finally {
      setSaving(false);
    }
  }

  const loading = viewer === undefined;

  return (
    <SettingsLayout
      title="Informações pessoais"
      subtitle="Esses dados ficam no seu perfil e podem ser usados pelo NordestAI."
    >
      <div className="flex flex-col gap-4 max-w-md">
        {loading ? (
          <>
            <FieldSkeleton label="Nome" />
            <FieldSkeleton label="WhatsApp" />
            <FieldSkeleton label="E-mail" />
            <div className="h-12 rounded-full bg-[var(--color-neutral-100)] animate-pulse mt-2" />
          </>
        ) : (
          <>
            <Field
              label="Nome"
              value={name}
              onChange={setName}
              placeholder="Seu nome completo"
            />
            <Field
              label="WhatsApp"
              value={whatsapp}
              onChange={(v) => setWhatsapp(maskWhatsapp(v))}
              placeholder="(83) 99999-9999"
              inputMode="numeric"
            />
            <Field
              label="E-mail"
              value={(viewer as { email?: string } | null)?.email ?? ""}
              onChange={() => {}}
              disabled
            />

            {savedMsg && (
              <p className="text-[12px] font-medium text-emerald-600">
                Alterações salvas.
              </p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-2 h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50 transition-all"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </>
        )}
      </div>
    </SettingsLayout>
  );
}

function FieldSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">
        {label}
      </span>
      <div className="h-12 rounded-[16px] bg-[var(--color-neutral-100)] animate-pulse" />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        className="h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[15px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-600)]"
      />
    </label>
  );
}
