"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { defaultChecklistForType } from "@/lib/checklistTemplates";

type Item = { id: string; text: string; done: boolean };

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Packing / preparation checklist tied to a trip. Seeds defaults based
 * on trip.type on first open, persists changes via `trips.setChecklist`,
 * supports add/edit/remove + done toggle.
 */
export function TripChecklist({
  tripId,
  tripType,
  initialItems,
}: {
  tripId: Id<"trips">;
  tripType: string;
  initialItems?: Item[];
}) {
  const setChecklist = useMutation(api.trips.setChecklist);
  const [items, setItems] = useState<Item[]>(initialItems ?? []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [seeded, setSeeded] = useState(!!initialItems && initialItems.length > 0);

  // Sync from props if Convex updates outside (e.g. concurrent edit).
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      setSeeded(true);
    }
  }, [initialItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.done).length;
    return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [items]);

  async function persist(next: Item[]) {
    setItems(next);
    try {
      await setChecklist({ id: tripId, items: next });
    } catch {
      toast.error("Não consegui salvar o checklist.");
    }
  }

  async function handleSeed() {
    const seeds: Item[] = defaultChecklistForType(tripType).map((text) => ({
      id: newId(),
      text,
      done: false,
    }));
    setSeeded(true);
    await persist(seeds);
  }

  function toggleItem(id: string) {
    const next = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    persist(next);
  }

  function removeItem(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  function addItem() {
    const t = draft.trim();
    if (!t) return;
    persist([...items, { id: newId(), text: t, done: false }]);
    setDraft("");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl border border-[var(--color-neutral-200)] overflow-hidden"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-neutral-50)] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] shrink-0">
            <Icon name="list-checks" size={18} />
          </span>
          <div className="flex flex-col min-w-0 text-left">
            <span className="font-display font-medium text-[15px] text-[var(--color-neutral-800)]">
              Checklist da viagem
            </span>
            <span className="text-[11px] text-[var(--color-neutral-500)]">
              {items.length === 0
                ? "Não preparado ainda"
                : `${stats.done} de ${stats.total} • ${stats.pct}%`}
            </span>
          </div>
        </div>
        <Icon
          name="chevron-down"
          size={16}
          className={`text-[var(--color-neutral-600)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
              {/* Progress bar */}
              {stats.total > 0 && (
                <div className="h-1.5 rounded-full bg-[var(--color-neutral-100)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-neutral-800)] transition-all"
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
              )}

              {!seeded && items.length === 0 ? (
                <div className="flex flex-col gap-2 py-3">
                  <p className="text-[13px] text-[var(--color-neutral-600)]">
                    Comece com uma sugestão automática baseada no tipo da viagem
                    ou crie o seu do zero.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSeed}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-800)] text-white px-3.5 py-2 text-[12px] font-medium"
                    >
                      <Icon name="sparkles" size={12} />
                      Sugestão pra "{tripType}"
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeeded(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] px-3.5 py-2 text-[12px] font-medium"
                    >
                      Começar vazio
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {items.length === 0 && (
                    <div className="flex flex-col gap-2 py-2">
                      <p className="text-[13px] text-[var(--color-neutral-600)]">
                        Checklist vazio. Quer recuperar a sugestão automática
                        baseada no tipo da viagem?
                      </p>
                      <button
                        type="button"
                        onClick={handleSeed}
                        className="self-start inline-flex items-center gap-1.5 rounded-full bg-[var(--color-neutral-800)] text-white px-3.5 py-2 text-[12px] font-medium"
                      >
                        <Icon name="sparkles" size={12} />
                        Usar sugestão pra "{tripType}"
                      </button>
                    </div>
                  )}
                  <ul className="flex flex-col">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 py-2 border-b border-[var(--color-neutral-100)] last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-label={item.done ? "Desmarcar" : "Marcar"}
                          className={`grid size-5 place-items-center rounded-full border transition-colors shrink-0 ${item.done
                            ? "bg-[var(--color-neutral-800)] border-[var(--color-neutral-800)] text-white"
                            : "border-[var(--color-neutral-400)]"
                            }`}
                        >
                          {item.done && <Icon name="check" size={12} />}
                        </button>
                        <span
                          className={`flex-1 text-[14px] leading-snug ${item.done
                            ? "line-through text-[var(--color-neutral-500)]"
                            : "text-[var(--color-neutral-800)]"
                            }`}
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remover"
                          className="grid size-7 place-items-center rounded-full hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Add row */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addItem();
                        }
                      }}
                      placeholder="Adicionar item ao checklist..."
                      className="flex-1 h-10 px-3 rounded-full border border-[var(--color-neutral-300)] text-[13px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
                    />
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={!draft.trim()}
                      className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white disabled:opacity-40"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
