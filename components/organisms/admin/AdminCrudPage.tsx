"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
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

export type FieldType =
  | "text"
  | "textarea"
  | "rich"
  | "number"
  | "boolean"
  | "url"
  | "image"
  | "photos"
  | "tags"
  | "hours"
  | "days"
  | "select"
  | "city";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  /** If set, this field's slug is auto-derived from the named field */
  slugFrom?: string;
  /** Options for "select" type */
  options?: { value: string; label: string }[];
  /**
   * R2 sub-folder for image/photos uploads.
   * Files go to: landing-huan/[uploadCategory]/timestamp-filename.webp
   * Defaults to "geral".
   */
  uploadCategory?: string;
};

type AnyDoc = Record<string, unknown> & { _id: string };

interface AdminCrudPageProps {
  title: string;
  icon: string;
  items: AnyDoc[] | undefined;
  fields: Field[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMutation: FunctionReference<"mutation", any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMutation: FunctionReference<"mutation", any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteMutation: FunctionReference<"mutation", any, any, any>;
  extra?: React.ReactNode;
  rowLabel?: (item: AnyDoc) => string;
  rowImage?: (item: AnyDoc) => string | undefined;
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
            : f.type === "hours"
              ? []
              : f.type === "days"
                ? []
                : f.type === "select" && f.options?.length
                  ? f.options[0].value
                  : "",
    ])
  );
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
      />
    );
  }

  if (field.type === "photos") {
    return (
      <PhotosField
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (
      <DaysBuilder
        value={Array.isArray(value) ? (value as Parameters<typeof DaysBuilder>[0]["value"]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => onChange(!value)}
          className={clsx(
            "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
            value ? "bg-[var(--color-brand-purple)]" : "bg-[var(--color-neutral-300)]"
          )}
        >
          <div
            className={clsx(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
              value ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </div>
        <span className="text-sm text-[var(--color-neutral-800)]">{field.label}</span>
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
        className={clsx(base, "min-h-[120px] resize-y")}
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
          placeholder="Digite e pressione Enter para adicionar"
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

  // Slug field: auto-generate + show derivation hint
  if (field.key === "slug" && field.slugFrom) {
    const sourceValue = String(allValues[field.slugFrom] ?? "");
    return (
      <div className="relative">
        <input
          type="text"
          className={clsx(base, "pr-20")}
          value={String(value ?? "")}
          onChange={(e) => {
            onSlugManualEdit();
            onChange(e.target.value);
          }}
          placeholder="gerado-automaticamente-do-titulo"
          required={field.required}
        />
        {!slugEdited && sourceValue && (
          <button
            type="button"
            onClick={() => {
              onChange(toSlug(sourceValue));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-brand-purple)] font-medium hover:underline"
          >
            Regenerar
          </button>
        )}
      </div>
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "url"
            ? "url"
            : "text"
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

export function AdminCrudPage({
  title,
  icon,
  items,
  fields,
  createMutation,
  updateMutation,
  deleteMutation,
  extra,
  rowLabel,
  rowImage,
}: AdminCrudPageProps) {
  const create = useMutation(createMutation);
  const update = useMutation(updateMutation);
  const remove = useMutation(deleteMutation);

  const [open, setOpen] = useState<null | { mode: "new" } | { mode: "edit"; item: AnyDoc }>(null);
  const [form, setForm] = useState<Record<string, unknown>>(defaultValues(fields));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // Track if slug was manually edited (to stop auto-gen)
  const slugManuallyEdited = useRef(false);

  // Find the slug field and its source field
  const slugField = fields.find((f) => f.key === "slug");
  const slugSourceKey = slugField?.slugFrom;

  function openNew() {
    setForm(defaultValues(fields));
    slugManuallyEdited.current = false;
    setSaveError(null);
    setOpen({ mode: "new" });
  }

  function openEdit(item: AnyDoc) {
    const f: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = item[field.key];
      if (field.type === "tags" || field.type === "photos") {
        f[field.key] = Array.isArray(raw) ? raw : [];
      } else if (field.type === "hours") {
        f[field.key] = Array.isArray(raw) ? raw : [];
      } else if (field.type === "days") {
        f[field.key] = Array.isArray(raw) ? raw : [];
      } else if (field.type === "boolean") {
        f[field.key] = !!raw;
      } else if (field.type === "number") {
        f[field.key] = typeof raw === "number" ? raw : 0;
      } else {
        f[field.key] = raw ?? "";
      }
    }
    slugManuallyEdited.current = true; // don't auto-update existing slug
    setSaveError(null);
    setForm(f);
    setOpen({ mode: "edit", item });
  }

  function handleFieldChange(key: string, v: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: v };
      // Auto-generate slug from source field if not manually edited
      if (
        key === slugSourceKey &&
        slugField &&
        !slugManuallyEdited.current
      ) {
        next[slugField.key] = toSlug(String(v));
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      if (open?.mode === "new") {
        await create(form as never);
      } else if (open?.mode === "edit") {
        await update({ id: open.item._id, ...form } as never);
      }
      setOpen(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Confirmar exclusão?")) return;
    setDeleteId(id);
    try {
      await remove({ id } as never);
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
            <Icon name={icon} size={20} />
          </span>
          <h1 className="font-display font-bold text-xl md:text-2xl text-[var(--color-neutral-800)]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {extra}
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="lucide:plus" size={16} />
            Novo
          </button>
        </div>
      </div>

      {/* Table / Card list */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {items === undefined ? (
          <div className="p-8 text-center text-[var(--color-neutral-600)]">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-neutral-600)]">Nenhum item cadastrado ainda.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden sm:table">
              <thead>
                <tr className="border-b border-[var(--color-neutral-300)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-neutral-600)] w-8" />
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-neutral-600)]">Nome / Título</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-neutral-600)] w-20">Ativo</th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-neutral-600)] w-20">Destaque</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const img = rowImage?.(item);
                  return (
                    <tr
                      key={item._id}
                      className="border-b border-[var(--color-neutral-100)] last:border-0 hover:bg-[var(--color-neutral-100)]/50 transition-colors"
                    >
                      <td className="pl-4 py-2">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="size-9 rounded-lg object-cover bg-[var(--color-neutral-100)]"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-neutral-800)]">
                        {rowLabel ? rowLabel(item) : String(item.title ?? item.name ?? item._id)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={clsx(
                          "mx-auto size-2.5 rounded-full",
                          item.active ? "bg-green-500" : "bg-[var(--color-neutral-300)]"
                        )} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.featured ? (
                          <Icon name="lucide:star-off" size={15} className="text-[var(--color-brand-yellow)] mx-auto hidden" />
                        ) : null}
                        <Icon
                          name="lucide:star"
                          size={15}
                          className={clsx("mx-auto", item.featured ? "text-amber-400" : "text-[var(--color-neutral-300)]")}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(item)}
                            className="grid size-8 place-items-center rounded-lg hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] transition-colors"
                          >
                            <Icon name="lucide:pencil" size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteId === item._id}
                            className="grid size-8 place-items-center rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-40"
                          >
                            {deleteId === item._id
                              ? <Icon name="svg-spinners:ring-resize" size={14} />
                              : <Icon name="lucide:trash-2" size={14} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-[var(--color-neutral-100)]">
              {items.map((item) => {
                const img = rowImage?.(item);
                return (
                  <div key={item._id} className="flex items-center gap-3 px-4 py-3">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="size-11 rounded-xl object-cover shrink-0 bg-[var(--color-neutral-100)]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--color-neutral-800)] truncate">
                        {rowLabel ? rowLabel(item) : String(item.title ?? item.name ?? item._id)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={clsx("text-xs", item.active ? "text-green-600" : "text-[var(--color-neutral-400)]")}>
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                        {!!item.featured && <span className="text-xs text-amber-500">★ Destaque</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(item)} className="grid size-9 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">
                        <Icon name="lucide:pencil" size={15} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} disabled={deleteId === item._id} className="grid size-9 place-items-center rounded-xl hover:bg-red-50 text-red-400 disabled:opacity-40">
                        {deleteId === item._id ? <Icon name="svg-spinners:ring-resize" size={15} /> : <Icon name="lucide:trash-2" size={15} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20"
          onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        >
          <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl bg-white flex flex-col max-h-[92dvh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neutral-100)] shrink-0">
              <h2 className="font-display font-bold text-lg text-[var(--color-neutral-800)]">
                {open?.mode === "new" ? `Novo ${title.replace(/s$/, "").toLowerCase()}` : "Editar"}
              </h2>
              <button
                onClick={() => setOpen(null)}
                className="grid size-8 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
              >
                <Icon name="lucide:x" size={16} />
              </button>
            </div>

            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {fields.map((field) => {
                if (field.type === "boolean") {
                  return (
                    <div key={field.key}>
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
                // Skip standalone label for photos/hours/days, they have internal labels
                const noLabel = ["photos", "hours", "days"].includes(field.type);
                return (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    {!noLabel && (
                      <label className="text-sm font-medium text-[var(--color-neutral-800)]">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                        {field.key === "slug" && !slugManuallyEdited.current && (
                          <span className="ml-2 text-xs font-normal text-[var(--color-neutral-600)]">
                            (gerado automaticamente)
                          </span>
                        )}
                      </label>
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

            {/* Footer */}
            <div className="shrink-0 px-5 pb-5 pt-3 border-t border-[var(--color-neutral-100)] flex flex-col gap-2">
              {saveError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(null)}
                  className="flex-1 rounded-xl border border-[var(--color-neutral-300)] py-3 text-sm font-medium text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-purple)] py-3 text-sm font-medium text-white disabled:opacity-60 transition-opacity"
                >
                  {saving ? <Icon name="svg-spinners:ring-resize" size={16} /> : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
