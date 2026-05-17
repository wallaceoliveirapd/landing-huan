"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
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
  const updateAvatar = useMutation(api.users.updateAvatar);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleAvatarPick(file: File) {
    if (uploadingAvatar) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Imagem maior que 4MB. Escolha uma menor.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Falha no upload" }));
        throw new Error(error);
      }
      const { publicUrl } = (await res.json()) as { publicUrl: string };
      await updateAvatar({ image: publicUrl });
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error(logAndGetMessage("profile.avatar", err, "Não consegui salvar a foto."));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      await updateAvatar({ image: null });
      toast.success("Foto removida.");
    } catch (err) {
      toast.error(logAndGetMessage("profile.avatar.remove", err, "Não consegui remover."));
    } finally {
      setUploadingAvatar(false);
    }
  }

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
            <AvatarUploader
              image={(viewer as { image?: string } | null)?.image}
              name={name}
              uploading={uploadingAvatar}
              onPick={() => fileInputRef.current?.click()}
              onRemove={handleAvatarRemove}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarPick(f);
                e.target.value = "";
              }}
            />
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

function AvatarUploader({
  image,
  name,
  uploading,
  onPick,
  onRemove,
}: {
  image?: string;
  name: string;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-4 pb-2">
      <div className="relative size-20 rounded-full overflow-hidden bg-[var(--color-neutral-100)] shrink-0">
        {image ? (
          <Image
            src={toProxyUrl(image)}
            alt="Foto de perfil"
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="size-full grid place-items-center font-display font-medium text-[28px] text-[var(--color-neutral-800)]">
            {initial}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-neutral-800)] text-white px-4 h-9 text-[13px] font-medium disabled:opacity-50"
        >
          <Icon name="camera" size={14} />
          {image ? "Trocar foto" : "Adicionar foto"}
        </button>
        {image && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 self-start text-[12px] font-medium text-[var(--color-neutral-600)] disabled:opacity-50"
          >
            <Icon name="trash-2" size={12} />
            Remover
          </button>
        )}
      </div>
    </div>
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
