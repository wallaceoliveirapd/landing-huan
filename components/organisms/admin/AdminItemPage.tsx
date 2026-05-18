"use client";

import { useRef, useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";
import { toSlug } from "@/lib/imageUpload";
import { ImageUploadField } from "./ImageUploadField";
import { PhotosField } from "./PhotosField";
import { HoursBuilder } from "./HoursBuilder";
import { DaysBuilder } from "./DaysBuilder";
import { CityAutocompleteField } from "./CityAutocompleteField";
import { RichTextEditor } from "./RichTextEditor";
import type { FunctionReference } from "convex/server";
import type { Field } from "./AdminCrudPage";

type AnyDoc = Record<string, unknown> & { _id?: string };

interface AdminItemPageProps {
  title: string;
  icon: string;
  fields: Field[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: FunctionReference<"mutation", any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMutation: FunctionReference<"mutation", any, any, any>;
  backPath: string;
  /** Pre-populated values for editing */
  initialValues?: AnyDoc;
  /** If set → edit mode */
  itemId?: string;
  /** Show Civitatis/GetYourGuide import panel */
  civitatis?: boolean;
}

function defaultValues(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.type === "boolean"
        ? false
        : f.type === "number"
          ? 0
          : f.type === "tags" || f.type === "photos"
            ? []
            : f.type === "hours" || f.type === "days"
              ? []
              : f.type === "select" && f.options?.length
                ? f.options[0].value
                : "",
    ])
  );
}

function initValues(fields: Field[], item: AnyDoc): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = item[field.key];
    if (field.type === "tags" || field.type === "photos" || field.type === "hours" || field.type === "days") {
      f[field.key] = Array.isArray(raw) ? raw : [];
    } else if (field.type === "boolean") {
      f[field.key] = !!raw;
    } else if (field.type === "number") {
      f[field.key] = typeof raw === "number" ? raw : 0;
    } else {
      f[field.key] = raw ?? "";
    }
  }
  return f;
}

function FieldInput({
  field,
  value,
  onChange,
  allValues,
  slugEdited,
  onSlugManualEdit,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  allValues: Record<string, unknown>;
  slugEdited: boolean;
  onSlugManualEdit: () => void;
}) {
  const base =
    "w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white placeholder:text-[var(--color-neutral-400)]";

  if (field.type === "image") {
    return (
      <ImageUploadField
        value={String(value ?? "")}
        onChange={onChange}
        uploadCategory={field.uploadCategory}
      />
    );
  }

  if (field.type === "photos") {
    return (
      <PhotosField
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
        uploadCategory={field.uploadCategory}
      />
    );
  }

  if (field.type === "hours") {
    type H = { day: string; open: string; close: string };
    return (
      <HoursBuilder
        value={Array.isArray(value) ? (value as H[]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "days") {
    return (
      <DaysBuilder
        value={Array.isArray(value) ? (value as Parameters<typeof DaysBuilder>[0]["value"]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "boolean") {
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
        <span className="text-sm text-[var(--color-neutral-700)]">{field.label}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={base}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "city") {
    return (
      <CityAutocompleteField
        value={String(value ?? "")}
        onChange={onChange}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={clsx(base, "min-h-[160px] resize-y")}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  }

  if (field.type === "rich") {
    return (
      <RichTextEditor
        value={String(value ?? "")}
        onChange={onChange}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "tags") {
    const tags = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-col gap-2">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-purple)]/10 px-3 py-1 text-xs text-[var(--color-brand-purple)]"
              >
                {t}
                <button
                  type="button"
                  onClick={() => onChange(tags.filter((_, j) => j !== i))}
                  className="hover:text-[var(--color-brand-purple)]/60"
                >
                  <Icon name="lucide:x" size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          className={base}
          placeholder="Digite e pressione Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              const v = e.currentTarget.value.trim();
              if (v && !tags.includes(v)) {
                onChange([...tags, v]);
                e.currentTarget.value = "";
              }
            }
          }}
        />
      </div>
    );
  }

  // Slug field
  if (field.key === "slug") {
    const sourceKey = field.slugFrom ?? "";
    const sourceValue = String(allValues[sourceKey] ?? "");
    const canRegen = !!sourceValue;
    return (
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type="text"
            className={clsx(base, "pr-28 font-mono text-xs")}
            value={String(value ?? "")}
            onChange={(e) => {
              onSlugManualEdit();
              onChange(e.target.value);
            }}
            placeholder="gerado-automaticamente"
            required={field.required}
          />
          {canRegen && (
            <button
              type="button"
              onClick={() => {
                onChange(toSlug(sourceValue));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-brand-purple)] font-medium hover:underline px-1"
            >
              Regenerar
            </button>
          )}
        </div>
        {!slugEdited && (
          <p className="text-xs text-[var(--color-neutral-400)]">
            Gerado automaticamente a partir do título. Clique em "Regenerar" para atualizar.
          </p>
        )}
      </div>
    );
  }

  return (
    <input
      type={
        field.type === "number" ? "number" : field.type === "url" ? "url" : "text"
      }
      className={base}
      value={String(value ?? "")}
      onChange={(e) =>
        onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
      }
      placeholder={field.placeholder}
      required={field.required}
      step={field.type === "number" ? "any" : undefined}
    />
  );
}

export function AdminItemPage({
  title,
  icon,
  fields,
  createMutation,
  updateMutation,
  backPath,
  initialValues,
  itemId,
  civitatis,
}: AdminItemPageProps) {
  const router = useRouter();
  const isEdit = !!itemId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const create = useMutation(createMutation as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = useMutation(updateMutation as any);

  const [form, setForm] = useState<Record<string, unknown>>(
    initialValues ? initValues(fields, initialValues) : defaultValues(fields)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);
  const savingRef = useRef(false);
  const [civUrl, setCivUrl] = useState("");
  const [civLoading, setCivLoading] = useState(false);
  const [civError, setCivError] = useState<string | null>(null);
  const [civImported, setCivImported] = useState(false);
  const slugManuallyEdited = useRef(isEdit); // in edit mode, don't auto-overwrite slug

  const slugField = fields.find((f) => f.key === "slug");
  const slugSourceKey = slugField?.slugFrom;

  // Backup: auto-update slug whenever source field changes (create mode only)
  const sourceValue = slugSourceKey ? String(form[slugSourceKey] ?? "") : "";
  useEffect(() => {
    if (!slugField || !slugSourceKey || slugManuallyEdited.current) return;
    if (!sourceValue) return;
    setForm((prev) => ({ ...prev, [slugField.key]: toSlug(sourceValue) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceValue]);

  // Debounced autosave: only in edit mode. Skip the initial mount and any
  // change that happens while a manual save is in flight.
  useEffect(() => {
    if (!isEdit || !itemId) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      setAutosaveStatus("saving");
      try {
        await update({ id: itemId, ...form } as never);
        setAutosaveStatus("saved");
      } catch {
        setAutosaveStatus("error");
      } finally {
        savingRef.current = false;
      }
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isEdit, itemId]);

  function handleFieldChange(key: string, v: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: v };
      if (key === slugSourceKey && slugField && !slugManuallyEdited.current) {
        next[slugField.key] = toSlug(String(v));
      }
      return next;
    });
  }

  async function handleSave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      if (isEdit) {
        await update({ id: itemId, ...form } as never);
      } else {
        await create(form as never);
      }
      router.push(backPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.";
      setSaveError(msg);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  async function handleCivitatiImport() {
    if (!civUrl.trim()) return;
    setCivLoading(true);
    setCivError(null);
    setCivImported(false);
    try {
      const res = await fetch("/api/scrape-civitatis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: civUrl.trim() }),
      });
      const data = await res.json();
      if (data.blocked || data.error) {
        setCivError(data.error ?? "Erro ao importar.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.shortDesc && { shortDesc: data.shortDesc }),
        ...(data.price && { price: data.price }),
        ...(data.originalPrice && { originalPrice: data.originalPrice }),
        ...(data.image && { image: data.image }),
        ...(data.duration && { duration: data.duration }),
        ...(data.rating && { rating: data.rating }),
        ...(data.reviewCount && { reviewCount: data.reviewCount }),
        url: civUrl.trim(),
      }));
      slugManuallyEdited.current = false;
      setCivImported(true);
    } catch {
      setCivError("Erro de conexão ao importar.");
    } finally {
      setCivLoading(false);
    }
  }

  // Group fields into "main" (first half) and "side" (meta fields at end)
  const metaKeys = new Set(["featured", "active", "order"]);
  const mainFields = fields.filter((f) => !metaKeys.has(f.key));
  const metaFields = fields.filter((f) => metaKeys.has(f.key));

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backPath}
          className="grid size-9 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] transition-colors shrink-0"
        >
          <Icon name="lucide:arrow-left" size={18} />
        </Link>
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] shrink-0">
          <Icon name={icon} size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl text-[var(--color-neutral-800)]">{title}</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            {isEdit ? "Editar informações" : "Preencha os campos abaixo"}
          </p>
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Main fields */}
        <div className="flex flex-col gap-4">
          {civitatis && (
            <div className="rounded-2xl bg-[var(--color-brand-purple)]/5 border border-[var(--color-brand-purple)]/20 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Icon name="lucide:download" size={16} className="text-[var(--color-brand-purple)]" />
                <span className="text-sm font-semibold text-[var(--color-brand-purple)]">
                  Importar da Civitatis / GetYourGuide
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={civUrl}
                  onChange={(e) => { setCivUrl(e.target.value); setCivImported(false); setCivError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCivitatiImport(); } }}
                  placeholder="https://www.civitatis.com/pt/joao-pessoa/passeio-..."
                  className="flex-1 rounded-xl border border-[var(--color-brand-purple)]/30 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={handleCivitatiImport}
                  disabled={civLoading || !civUrl.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
                >
                  {civLoading ? (
                    <Icon name="svg-spinners:ring-resize" size={15} />
                  ) : (
                    <Icon name="lucide:sparkles" size={15} />
                  )}
                  {civLoading ? "Importando…" : "Importar"}
                </button>
              </div>
              {civError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 leading-relaxed">
                  {civError}
                </p>
              )}
              {civImported && (
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <Icon name="lucide:check-circle" size={13} />
                  Dados importados. Revise e ajuste antes de salvar.
                </p>
              )}
            </div>
          )}
          {mainFields.map((field) => {
            if (field.type === "boolean") {
              return (
                <div key={field.key} className="rounded-2xl bg-white p-5 shadow-sm">
                  <FieldInput
                    field={field}
                    value={form[field.key]}
                    onChange={(v) => handleFieldChange(field.key, v)}
                    allValues={form}
                    slugEdited={slugManuallyEdited.current}
                    onSlugManualEdit={() => { slugManuallyEdited.current = true; }}
                  />
                </div>
              );
            }

            const noLabel = ["photos", "hours", "days"].includes(field.type);

            return (
              <div key={field.key} className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-2">
                {!noLabel && (
                  <div className="flex items-baseline gap-2">
                    <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {field.key === "slug" && !slugManuallyEdited.current && (
                      <span className="text-xs text-[var(--color-neutral-500)]">
                        (gerado automaticamente)
                      </span>
                    )}
                  </div>
                )}
                {noLabel && (
                  <p className="text-sm font-medium text-[var(--color-neutral-800)]">{field.label}</p>
                )}
                <FieldInput
                  field={field}
                  value={form[field.key]}
                  onChange={(v) => handleFieldChange(field.key, v)}
                  allValues={form}
                  slugEdited={slugManuallyEdited.current}
                  onSlugManualEdit={() => { slugManuallyEdited.current = true; }}
                />
              </div>
            );
          })}
        </div>

        {/* Sidebar: meta + save */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          {/* Publish status */}
          {metaFields.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-medium text-[var(--color-neutral-700)] border-b border-[var(--color-neutral-100)] pb-3">
                Publicação
              </h3>
              {metaFields.map((field) => (
                <div key={field.key}>
                  {field.type === "boolean" ? (
                    <FieldInput
                      field={field}
                      value={form[field.key]}
                      onChange={(v) => handleFieldChange(field.key, v)}
                      allValues={form}
                      slugEdited={slugManuallyEdited.current}
                      onSlugManualEdit={() => { slugManuallyEdited.current = true; }}
                    />
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--color-neutral-600)]">
                        {field.label}
                      </label>
                      <FieldInput
                        field={field}
                        value={form[field.key]}
                        onChange={(v) => handleFieldChange(field.key, v)}
                        allValues={form}
                        slugEdited={slugManuallyEdited.current}
                        onSlugManualEdit={() => { slugManuallyEdited.current = true; }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Save button */}
          <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3">
            {isEdit && autosaveStatus !== "idle" && (
              <p className={`text-xs rounded-xl px-3 py-2 leading-relaxed inline-flex items-center gap-2 ${
                autosaveStatus === "error"
                  ? "text-red-600 bg-red-50"
                  : "text-[var(--color-neutral-700)] bg-[var(--color-neutral-100)]"
              }`}>
                <Icon
                  name={
                    autosaveStatus === "saving"
                      ? "svg-spinners:ring-resize"
                      : autosaveStatus === "saved"
                      ? "lucide:cloud-check"
                      : "lucide:cloud-alert"
                  }
                  size={14}
                />
                {autosaveStatus === "saving"
                  ? "Salvando automaticamente..."
                  : autosaveStatus === "saved"
                  ? "Salvo automaticamente"
                  : "Falha no salvamento automático, salve manualmente."}
              </p>
            )}
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
                <><Icon name="svg-spinners:ring-resize" size={16} /> Salvando…</>
              ) : isEdit ? (
                <><Icon name="lucide:check" size={16} /> Salvar alterações</>
              ) : (
                <><Icon name="lucide:plus" size={16} /> Criar</>
              )}
            </button>
            <Link
              href={backPath}
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
