"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

type Stop =
  | { type: "tour"; tourId: string; tourTitle?: string }
  | { type: "place"; name: string; address?: string; description?: string; time?: string };

type Day = { day: number; title: string; description: string; stops: Stop[] };

interface Props {
  value: Day[];
  onChange: (days: Day[]) => void;
}

/** Combobox that lets admin search & pick a tour by name */
function TourPicker({
  value,
  onChange,
}: {
  value: string; // tourId currently selected
  onChange: (id: string, title: string) => void;
}) {
  const allTours = useQuery(api.tours.list, { activeOnly: false });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current tour title
  const currentTour = allTours?.find((t) => t._id === value);
  const displayText = currentTour ? currentTour.title : value || "";

  const filtered = (allTours ?? []).filter(
    (t) =>
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.shortDesc ?? "").toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const inputCls =
    "w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white";

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm cursor-pointer hover:border-[var(--color-brand-purple)] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {currentTour?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentTour.image}
            alt=""
            className="size-7 rounded-lg object-cover shrink-0"
          />
        ) : (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
            <Icon name="lucide:ticket" size={13} />
          </span>
        )}
        <span className={currentTour ? "text-[var(--color-neutral-800)] font-medium" : "text-[var(--color-neutral-400)]"}>
          {displayText || "Selecionar passeio…"}
        </span>
        <Icon
          name="lucide:chevron-down"
          size={14}
          className="ml-auto text-[var(--color-neutral-400)] shrink-0"
        />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-[var(--color-neutral-200)] bg-white shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--color-neutral-100)]">
            <input
              autoFocus
              className={inputCls}
              placeholder="Buscar passeio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--color-neutral-400)] text-center">
                Nenhum passeio encontrado
              </p>
            ) : (
              filtered.map((tour) => (
                <button
                  key={tour._id}
                  type="button"
                  onClick={() => {
                    onChange(tour._id, tour.title);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-[var(--color-neutral-50)] transition-colors text-left"
                >
                  {tour.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tour.image} alt="" className="size-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--color-neutral-100)]">
                      <Icon name="lucide:map-pin" size={13} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-neutral-800)] truncate">{tour.title}</p>
                    {tour.duration && (
                      <p className="text-xs text-[var(--color-neutral-500)]">{tour.duration}</p>
                    )}
                  </div>
                  {tour._id === value && (
                    <Icon name="lucide:check" size={14} className="ml-auto text-[var(--color-brand-purple)] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DaysBuilder({ value, onChange }: Props) {
  const days: Day[] = Array.isArray(value) ? value : [];
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));

  function toggleExpand(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function addDay() {
    const newDay: Day = {
      day: days.length + 1,
      title: `Dia ${days.length + 1}`,
      description: "",
      stops: [],
    };
    onChange([...days, newDay]);
    setExpanded((prev) => new Set([...prev, days.length]));
  }

  function removeDay(i: number) {
    onChange(days.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })));
  }

  function updateDay(i: number, partial: Partial<Day>) {
    onChange(days.map((d, idx) => (idx === i ? { ...d, ...partial } : d)));
  }

  function addStop(dayIdx: number, type: "place" | "tour") {
    const stop: Stop =
      type === "tour"
        ? { type: "tour", tourId: "", tourTitle: "" }
        : { type: "place", name: "", address: "", description: "", time: "" };
    updateDay(dayIdx, { stops: [...days[dayIdx].stops, stop] });
  }

  function removeStop(dayIdx: number, stopIdx: number) {
    updateDay(dayIdx, { stops: days[dayIdx].stops.filter((_, i) => i !== stopIdx) });
  }

  function updateStop(dayIdx: number, stopIdx: number, partial: Partial<Stop>) {
    updateDay(dayIdx, {
      stops: days[dayIdx].stops.map((s, i) =>
        i === stopIdx ? ({ ...s, ...partial } as Stop) : s
      ),
    });
  }

  const inputCls =
    "w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white placeholder:text-[var(--color-neutral-400)]";

  return (
    <div className="flex flex-col gap-2">
      {days.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 rounded-xl border-2 border-dashed border-[var(--color-neutral-300)]">
          <span className="grid size-12 place-items-center rounded-xl bg-[var(--color-neutral-100)] text-[var(--color-neutral-400)]">
            <Icon name="lucide:route" size={22} />
          </span>
          <p className="text-sm text-[var(--color-neutral-500)] text-center">
            Nenhum dia adicionado ainda.
            <br />Clique em "Adicionar dia" abaixo para começar.
          </p>
        </div>
      )}

      {days.map((day, dayIdx) => {
        const isOpen = expanded.has(dayIdx);
        return (
          <div key={dayIdx} className="rounded-xl border border-[var(--color-neutral-300)]">
            {/* Day header */}
            <button
              type="button"
              onClick={() => toggleExpand(dayIdx)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="size-7 flex items-center justify-center rounded-full bg-[var(--color-brand-purple)] text-white text-xs font-bold shrink-0">
                  {day.day}
                </span>
                <span className="font-medium text-sm text-[var(--color-neutral-800)] text-left">
                  {day.title || `Dia ${day.day}`}
                </span>
                <span className="text-xs text-[var(--color-neutral-500)] hidden sm:block">
                  {day.stops.length} parada{day.stops.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Icon
                name={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                size={15}
                className="text-[var(--color-neutral-500)] shrink-0"
              />
            </button>

            {isOpen && (
              <div className="p-4 flex flex-col gap-4 bg-white">
                {/* Day title & description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--color-neutral-600)]">
                      Título do dia
                    </label>
                    <input
                      className={inputCls}
                      value={day.title}
                      onChange={(e) => updateDay(dayIdx, { title: e.target.value })}
                      placeholder="Ex: Chegada e primeiras impressões"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--color-neutral-600)]">
                      Resumo do dia
                    </label>
                    <input
                      className={inputCls}
                      value={day.description}
                      onChange={(e) => updateDay(dayIdx, { description: e.target.value })}
                      placeholder="O que acontece neste dia"
                    />
                  </div>
                </div>

                {/* Stops */}
                {day.stops.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide">
                      Paradas do dia
                    </p>
                    {day.stops.map((stop, stopIdx) => (
                      <div
                        key={stopIdx}
                        className="rounded-xl border border-[var(--color-neutral-200)] p-3 flex flex-col gap-2.5 bg-[var(--color-neutral-50)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-neutral-600)]">
                            {stop.type === "place" ? (
                              <><Icon name="lucide:map-pin" size={12} /> Lugar livre</>
                            ) : (
                              <><Icon name="lucide:ticket" size={12} /> Passeio cadastrado</>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStop(dayIdx, stopIdx)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Icon name="lucide:x" size={12} /> Remover
                          </button>
                        </div>

                        {stop.type === "place" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              className={inputCls}
                              value={stop.name}
                              onChange={(e) => updateStop(dayIdx, stopIdx, { name: e.target.value })}
                              placeholder="Nome do lugar *"
                            />
                            <input
                              className={inputCls}
                              value={stop.time ?? ""}
                              onChange={(e) => updateStop(dayIdx, stopIdx, { time: e.target.value })}
                              placeholder="Horário sugerido (ex: 09:00)"
                            />
                            <input
                              className={inputCls}
                              value={stop.address ?? ""}
                              onChange={(e) => updateStop(dayIdx, stopIdx, { address: e.target.value })}
                              placeholder="Endereço (opcional)"
                            />
                            <input
                              className={inputCls}
                              value={stop.description ?? ""}
                              onChange={(e) => updateStop(dayIdx, stopIdx, { description: e.target.value })}
                              placeholder="Dica ou observação"
                            />
                          </div>
                        ) : (
                          <TourPicker
                            value={stop.tourId}
                            onChange={(id, tourTitle) =>
                              updateStop(dayIdx, stopIdx, { tourId: id, tourTitle })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add stop + remove day */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[var(--color-neutral-100)]">
                  <button
                    type="button"
                    onClick={() => addStop(dayIdx, "place")}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-brand-purple)]/20 transition-colors"
                  >
                    <Icon name="lucide:map-pin" size={12} /> + Lugar
                  </button>
                  <button
                    type="button"
                    onClick={() => addStop(dayIdx, "tour")}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-brand-purple)]/20 transition-colors"
                  >
                    <Icon name="lucide:ticket" size={12} /> + Passeio
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDay(dayIdx)}
                    className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Icon name="lucide:trash-2" size={12} /> Remover dia
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addDay}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-neutral-300)] py-3.5 text-sm font-medium text-[var(--color-neutral-500)] hover:border-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)] transition-colors"
      >
        <Icon name="lucide:plus" size={15} /> Adicionar dia
      </button>
    </div>
  );
}
