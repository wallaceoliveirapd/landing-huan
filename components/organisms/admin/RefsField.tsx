"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Icon } from "@/components/atoms/Icon";
import type { FunctionReference } from "convex/server";
import type { Field } from "./AdminCrudPage";

type RefOption = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  code?: string;
};

/**
 * Autocomplete picker for multi-selecting documents from another table.
 * Used for "Cupons vinculados" so admin can search a coupon by title,
 * description, or code and add it as a chip.
 */
export function RefsField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flip dropdown above the input when there isn't enough space below.
  useEffect(() => {
    if (!open) return;
    function measure() {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const needed = 280;
      setDropUp(spaceBelow < needed && spaceAbove > spaceBelow);
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  const options = useQuery(
    field.optionsQuery as FunctionReference<"query", "public">,
    (field.optionsQueryArgs ?? {}) as never,
  ) as RefOption[] | undefined;

  function addId(id: string) {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setQuery("");
    setOpen(false);
  }

  function removeId(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  const selected = (options ?? []).filter((o) => value.includes(o._id));
  const filtered = (options ?? [])
    .filter((o) => !value.includes(o._id))
    .filter((o) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (o.title ?? "").toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q) ||
        (o.description ?? "").toLowerCase().includes(q) ||
        (o.code ?? "").toLowerCase().includes(q)
      );
    });

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((opt) => (
            <span
              key={opt._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-purple)]/10 px-3 py-1.5 text-xs text-[var(--color-brand-purple)]"
            >
              <span className="font-medium">{opt.title ?? opt.name ?? opt._id}</span>
              {opt.code && <span className="opacity-70 font-mono">({opt.code})</span>}
              <button
                type="button"
                onClick={() => removeId(opt._id)}
                className="hover:opacity-70"
              >
                <Icon name="lucide:x" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={
            options === undefined
              ? "Carregando…"
              : options.length === 0
                ? "Nenhum item cadastrado"
                : "Buscar por título, descrição ou código…"
          }
          disabled={options === undefined || options.length === 0}
          className="w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white placeholder:text-[var(--color-neutral-400)]"
        />
        {open && filtered.length > 0 && (
          <div
            className={
              dropUp
                ? "absolute z-20 left-0 right-0 bottom-full mb-1 rounded-xl border border-[var(--color-neutral-300)] bg-white shadow-lg max-h-[280px] overflow-y-auto"
                : "absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-[var(--color-neutral-300)] bg-white shadow-lg max-h-[280px] overflow-y-auto"
            }
          >
            {filtered.map((opt) => (
              <button
                key={opt._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addId(opt._id);
                }}
                className="w-full text-left px-3 py-2 hover:bg-[var(--color-neutral-100)] flex flex-col gap-0.5 border-b border-[var(--color-neutral-100)] last:border-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--color-neutral-800)]">
                    {opt.title ?? opt.name ?? opt._id}
                  </span>
                  {opt.code && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] shrink-0">
                      {opt.code}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <span className="text-[12px] text-[var(--color-neutral-600)] line-clamp-2">
                    {opt.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
