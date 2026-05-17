"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";
import type { FunctionReference } from "convex/server";
import { ImageUploadField } from "@/components/organisms/admin/ImageUploadField";

const BACK_PATH = "/admin/categorias";

interface CategoriaDoc {
  _id?: string;
  key?: string;
  label?: string;
  href?: string;
  mainImage?: string;
  backImages?: string[];
  description?: string;
  order?: number;
  primary?: boolean;
  active?: boolean;
}

interface Props {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: FunctionReference<"mutation", any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMutation: FunctionReference<"mutation", any, any, any>;
  initialValues?: CategoriaDoc;
  itemId?: string;
}

function defaultForm() {
  return {
    key: "",
    label: "",
    href: "",
    mainImage: "",
    backImage0: "",
    backImage1: "",
    description: "",
    order: 0,
    primary: true,
    active: true,
  };
}

function initForm(item: CategoriaDoc) {
  return {
    key: item.key ?? "",
    label: item.label ?? "",
    href: item.href ?? "",
    mainImage: item.mainImage ?? "",
    backImage0: item.backImages?.[0] ?? "",
    backImage1: item.backImages?.[1] ?? "",
    description: item.description ?? "",
    order: item.order ?? 0,
    primary: item.primary ?? true,
    active: item.active ?? true,
  };
}

const inputBase =
  "w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white placeholder:text-[var(--color-neutral-400)]";

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={clsx(
          "relative w-11 h-6 rounded-full transition-colors cursor-pointer",
          value ? "bg-[var(--color-brand-purple)]" : "bg-[var(--color-neutral-300)]"
        )}
      >
        <div
          className={clsx(
            "absolute top-1 size-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-6" : "translate-x-1"
          )}
        />
      </div>
      <span className="text-sm text-[var(--color-neutral-700)]">{label}</span>
    </label>
  );
}

export function CategoriaFormPage({ title, createMutation, updateMutation, initialValues, itemId }: Props) {
  const router = useRouter();
  const isEdit = !!itemId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const create = useMutation(createMutation as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = useMutation(updateMutation as any);

  const [form, setForm] = useState(() =>
    initialValues ? initForm(initialValues) : defaultForm()
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        key: form.key,
        label: form.label,
        href: form.href,
        mainImage: form.mainImage,
        backImages: [form.backImage0, form.backImage1].filter(Boolean),
        description: form.description || undefined,
        order: form.order,
        primary: form.primary,
        active: form.active,
      };
      if (isEdit) {
        await update({ id: itemId, ...payload } as never);
      } else {
        await create(payload as never);
      }
      router.push(BACK_PATH);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={BACK_PATH}
          className="grid size-9 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] transition-colors shrink-0"
        >
          <Icon name="lucide:arrow-left" size={18} />
        </Link>
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] shrink-0">
          <Icon name="lucide:layout-grid" size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl text-[var(--color-neutral-800)]">{title}</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            {isEdit ? "Editar informações" : "Preencha os campos abaixo"}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Main fields */}
        <div className="flex flex-col gap-4">
          {/* Key + Label */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Key <span className="text-red-400">*</span>
                <span className="ml-2 text-xs font-normal text-[var(--color-neutral-500)]">
                  identificador único (ex: passeios)
                </span>
              </label>
              <input
                type="text"
                className={inputBase}
                value={form.key}
                onChange={(e) => set("key", e.target.value)}
                placeholder="passeios"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Label <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className={inputBase}
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="Passeios"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Href (link) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className={inputBase}
                value={form.href}
                onChange={(e) => set("href", e.target.value)}
                placeholder="/passeios"
                required
              />
            </div>
          </div>

          {/* Images, upload direto pro R2 */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--color-neutral-100)] pb-3">
              <p className="text-sm font-medium text-[var(--color-neutral-800)]">
                Imagens
              </p>
              <span className="text-[11px] text-[var(--color-neutral-500)]">
                Upload direto para o Cloudflare R2
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Imagem principal <span className="text-red-400">*</span>
                <span className="ml-2 text-xs font-normal text-[var(--color-neutral-500)]">
                  aparece no topo do card empilhado
                </span>
              </label>
              <ImageUploadField
                value={form.mainImage}
                onChange={(url) => set("mainImage", url)}
                uploadCategory="categorias"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Foto traseira 1
                <span className="ml-2 text-xs font-normal text-[var(--color-neutral-500)]">
                  rotacionada à esquerda
                </span>
              </label>
              <ImageUploadField
                value={form.backImage0}
                onChange={(url) => set("backImage0", url)}
                uploadCategory="categorias"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                Foto traseira 2
                <span className="ml-2 text-xs font-normal text-[var(--color-neutral-500)]">
                  rotacionada à direita
                </span>
              </label>
              <ImageUploadField
                value={form.backImage1}
                onChange={(url) => set("backImage1", url)}
                uploadCategory="categorias"
              />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-neutral-800)]">
              Descrição <span className="text-xs font-normal text-[var(--color-neutral-500)]">(opcional)</span>
            </label>
            <textarea
              className={clsx(inputBase, "min-h-[100px] resize-y")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descrição curta exibida no card..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          {/* Publish */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-medium text-[var(--color-neutral-700)] border-b border-[var(--color-neutral-100)] pb-3">
              Publicação
            </h3>
            <Toggle value={form.primary} onChange={(v) => set("primary", v)} label="Exibir na home (Primary)" />
            <Toggle value={form.active} onChange={(v) => set("active", v)} label="Ativo (visível no site)" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-neutral-600)]">Ordem de exibição</label>
              <input
                type="number"
                className={inputBase}
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
                step="1"
              />
            </div>
          </div>

          {/* Save */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3">
            {saveError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 leading-relaxed">
                {saveError}
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-purple)] py-3 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {saving ? (
                <>
                  <Icon name="svg-spinners:ring-resize" size={16} /> Salvando…
                </>
              ) : isEdit ? (
                <>
                  <Icon name="lucide:check" size={16} /> Salvar alterações
                </>
              ) : (
                <>
                  <Icon name="lucide:plus" size={16} /> Criar
                </>
              )}
            </button>
            <Link
              href={BACK_PATH}
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-neutral-300)] py-3 text-sm font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
