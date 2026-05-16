"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";
import type { FunctionReference } from "convex/server";
import { toProxyUrl } from "@/lib/imageUpload";

type AnyDoc = Record<string, unknown> & { _id: string };

interface AdminListPageProps {
  title: string;
  icon: string;
  items: AnyDoc[] | undefined;
  basePath: string; // e.g. "/admin/passeios"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteMutation: FunctionReference<"mutation", any, any, any>;
  rowLabel?: (item: AnyDoc) => string;
  rowImage?: (item: AnyDoc) => string | undefined;
  extra?: React.ReactNode;
  subtitle?: string;
}

export function AdminListPage({
  title,
  icon,
  items,
  basePath,
  deleteMutation,
  rowLabel,
  rowImage,
  extra,
  subtitle,
}: AdminListPageProps) {
  const remove = useMutation(deleteMutation);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
          <div>
            <h1 className="font-display font-bold text-xl md:text-2xl text-[var(--color-neutral-800)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--color-neutral-600)]">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {extra}
          <Link
            href={`${basePath}/novo`}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="lucide:plus" size={16} />
            Novo
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {items === undefined ? (
          <div className="p-8 text-center text-[var(--color-neutral-600)]">
            <Icon name="svg-spinners:ring-resize" size={20} className="mx-auto mb-2" />
            Carregando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)]">
              <Icon name={icon} size={26} />
            </span>
            <p className="text-[var(--color-neutral-600)] font-medium">Nenhum item ainda</p>
            <Link
              href={`${basePath}/novo`}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Icon name="lucide:plus" size={14} />
              Criar primeiro
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden sm:table">
              <thead>
                <tr className="border-b border-[var(--color-neutral-200)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-neutral-500)] w-12" />
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-neutral-500)]">
                    Nome / Título
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-neutral-500)] w-20">
                    Ativo
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--color-neutral-500)] w-24">
                    Destaque
                  </th>
                  <th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const img = rowImage?.(item);
                  const label = rowLabel ? rowLabel(item) : String(item.title ?? item.name ?? item._id);
                  return (
                    <tr
                      key={item._id}
                      className="border-b border-[var(--color-neutral-100)] last:border-0 hover:bg-[var(--color-neutral-50)] transition-colors group"
                    >
                      <td className="pl-4 py-2.5">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={toProxyUrl(img)}
                            alt=""
                            className="size-9 rounded-lg object-cover bg-[var(--color-neutral-100)]"
                          />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-lg bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)]">
                            <Icon name={icon} size={14} />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-neutral-800)]">
                        {label}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div
                          className={clsx(
                            "mx-auto size-2.5 rounded-full",
                            item.active ? "bg-green-500" : "bg-[var(--color-neutral-300)]"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Icon
                          name="lucide:star"
                          size={14}
                          className={clsx(
                            "mx-auto",
                            item.featured ? "text-amber-400" : "text-[var(--color-neutral-200)]"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`${basePath}/${item._id}`}
                            className="grid size-8 place-items-center rounded-lg hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] transition-colors"
                          >
                            <Icon name="lucide:pencil" size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteId === item._id}
                            className="grid size-8 place-items-center rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-40"
                          >
                            {deleteId === item._id ? (
                              <Icon name="svg-spinners:ring-resize" size={14} />
                            ) : (
                              <Icon name="lucide:trash-2" size={14} />
                            )}
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
                const label = rowLabel ? rowLabel(item) : String(item.title ?? item.name ?? item._id);
                return (
                  <div key={item._id} className="flex items-center gap-3 px-4 py-3">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className="size-11 rounded-xl object-cover shrink-0 bg-[var(--color-neutral-100)]"
                      />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)]">
                        <Icon name={icon} size={18} />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--color-neutral-800)] truncate">
                        {label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={clsx(
                            "text-xs",
                            item.active ? "text-green-600" : "text-[var(--color-neutral-400)]"
                          )}
                        >
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                        {!!item.featured && (
                          <span className="text-xs text-amber-500">★ Destaque</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`${basePath}/${item._id}`}
                        className="grid size-9 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]"
                      >
                        <Icon name="lucide:pencil" size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleteId === item._id}
                        className="grid size-9 place-items-center rounded-xl hover:bg-red-50 text-red-400 disabled:opacity-40"
                      >
                        {deleteId === item._id ? (
                          <Icon name="svg-spinners:ring-resize" size={15} />
                        ) : (
                          <Icon name="lucide:trash-2" size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
