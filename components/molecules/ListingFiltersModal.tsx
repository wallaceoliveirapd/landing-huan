"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { bottomSheetSpring } from "@/lib/motion-presets";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { cn } from "@/lib/cn";
import { FilterAutocomplete } from "./FilterAutocomplete";
import { STATE_LABEL, type CityOption } from "@/lib/locationFilter";

export type FilterOption = { value: string; label: string; icon?: string };

export type FilterSection =
  | {
      key: string;
      label: string;
      icon: string;
      type: "single";
      options: FilterOption[];
      value: string | null;
      onChange: (v: string | null) => void;
    }
  | {
      key: string;
      label: string;
      icon: string;
      type: "multi";
      options: FilterOption[];
      value: string[];
      onChange: (v: string[]) => void;
    }
  | {
      key: string;
      label: string;
      icon: string;
      type: "location";
      cityOptions: CityOption[];
      stateOptions: string[];
      activeCity: string | null;
      activeState: string | null;
      onChangeCity: (v: string | null) => void;
      onChangeState: (v: string | null) => void;
    };

type DraftValue = string | string[] | null | { state: string | null; city: string | null };

/** Full-screen filters modal with categorized sections + Apply / Clear. */
export function ListingFiltersModal({
  open,
  onClose,
  sections,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  sections: FilterSection[];
  onClearAll: () => void;
}) {
  useBodyScrollLock(open);
  const [draft, setDraft] = useState<Record<string, DraftValue>>({});
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const d: Record<string, DraftValue> = {};
    for (const s of sections) {
      if (s.type === "location") {
        d[s.key] = { state: s.activeState, city: s.activeCity };
      } else {
        d[s.key] = s.value;
      }
    }
    setDraft(d);
    setStateQuery("");
    setCityQuery("");
  }, [open, sections]);

  function handleApply() {
    for (const s of sections) {
      const v = draft[s.key];
      if (s.type === "single") {
        s.onChange((v as string | null) ?? null);
      } else if (s.type === "multi") {
        s.onChange(Array.isArray(v) ? v : []);
      } else if (s.type === "location") {
        const loc = (v as { state: string | null; city: string | null } | undefined) ?? {
          state: null,
          city: null,
        };
        s.onChangeState(loc.state);
        s.onChangeCity(loc.city);
      }
    }
    onClose();
  }

  function handleClearAll() {
    const cleared: Record<string, DraftValue> = {};
    for (const s of sections) {
      if (s.type === "multi") cleared[s.key] = [];
      else if (s.type === "location") cleared[s.key] = { state: null, city: null };
      else cleared[s.key] = null;
    }
    setDraft(cleared);
    setStateQuery("");
    setCityQuery("");
    onClearAll();
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col"
          >
            <div className="px-5 pt-4 pb-2 flex justify-center">
              <span className="h-1 w-12 rounded-full bg-[var(--color-neutral-200)]" />
            </div>

            <div className="px-6 pb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold text-[18px] text-[var(--color-neutral-800)]">
                Filtros
              </h2>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[13px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)]"
              >
                Limpar tudo
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-5">
              {sections.map((section) => (
                <div key={section.key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      name={section.icon}
                      size={14}
                      className="text-[var(--color-neutral-600)]"
                    />
                    <h3 className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                      {section.label}
                    </h3>
                  </div>

                  {section.type === "location" ? (
                    <LocationFilterBody
                      section={section}
                      draft={
                        (draft[section.key] as { state: string | null; city: string | null }) ?? {
                          state: null,
                          city: null,
                        }
                      }
                      setDraft={(next) =>
                        setDraft((prev) => ({ ...prev, [section.key]: next }))
                      }
                      stateQuery={stateQuery}
                      onStateQuery={setStateQuery}
                      cityQuery={cityQuery}
                      onCityQuery={setCityQuery}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {section.options.map((opt) => {
                        const draftValue = draft[section.key];
                        const isSelected =
                          section.type === "single"
                            ? draftValue === opt.value
                            : Array.isArray(draftValue) && draftValue.includes(opt.value);

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setDraft((prev) => {
                                const next = { ...prev };
                                if (section.type === "single") {
                                  next[section.key] = isSelected ? null : opt.value;
                                } else {
                                  const cur = Array.isArray(prev[section.key])
                                    ? (prev[section.key] as string[])
                                    : [];
                                  next[section.key] = isSelected
                                    ? cur.filter((v) => v !== opt.value)
                                    : [...cur, opt.value];
                                }
                                return next;
                              });
                            }}
                            className={cn(
                              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors",
                              isSelected
                                ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                                : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-600)]",
                            )}
                          >
                            {opt.icon && <Icon name={opt.icon} size={13} />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              className="border-t border-[var(--color-neutral-200)] px-6 py-3 flex gap-3"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center rounded-full border border-[var(--color-neutral-300)] py-3 text-[14px] font-medium text-[var(--color-neutral-700)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[var(--color-neutral-800)] py-3 text-[14px] font-medium text-white"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function LocationFilterBody({
  section,
  draft,
  setDraft,
  stateQuery,
  onStateQuery,
  cityQuery,
  onCityQuery,
}: {
  section: Extract<FilterSection, { type: "location" }>;
  draft: { state: string | null; city: string | null };
  setDraft: (next: { state: string | null; city: string | null }) => void;
  stateQuery: string;
  onStateQuery: (v: string) => void;
  cityQuery: string;
  onCityQuery: (v: string) => void;
}) {
  const activeState = draft.state;
  const activeCity = draft.city;

  const stateSuggestions = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    return section.stateOptions.filter(
      (s) =>
        !q || s.toLowerCase().includes(q) || (STATE_LABEL[s] ?? "").toLowerCase().includes(q),
    );
  }, [section.stateOptions, stateQuery]);

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    const base = activeState
      ? section.cityOptions.filter((c) => c.state === activeState)
      : section.cityOptions;
    return base.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 30);
  }, [section.cityOptions, activeState, cityQuery]);

  return (
    <div className="flex flex-col gap-3 pt-1">
      <FilterAutocomplete
        label="Estado"
        placeholder="Ex: Paraíba, PB"
        query={stateQuery}
        onQueryChange={onStateQuery}
        selected={activeState}
        onClear={() => {
          setDraft({ state: null, city: null });
          onStateQuery("");
          onCityQuery("");
        }}
        renderSelected={(s) => `${s}${STATE_LABEL[s] ? `, ${STATE_LABEL[s]}` : ""}`}
        suggestions={stateSuggestions.slice(0, 9).map((s) => ({
          key: s,
          primary: STATE_LABEL[s] ?? s,
          secondary: s,
          onPick: () => {
            setDraft({ state: s, city: null });
            onStateQuery("");
          },
        }))}
      />
      <FilterAutocomplete
        label="Cidade"
        placeholder={activeState ? `Buscar cidade em ${activeState}` : "Buscar cidade do Nordeste"}
        query={cityQuery}
        onQueryChange={onCityQuery}
        selected={activeCity}
        onClear={() => {
          setDraft({ state: activeState, city: null });
          onCityQuery("");
        }}
        renderSelected={(c) => c}
        suggestions={citySuggestions.map((c) => ({
          key: `${c.name}-${c.state}`,
          primary: c.name,
          secondary: c.state,
          onPick: () => {
            setDraft({ state: activeState ?? c.state, city: `${c.name}, ${c.state}` });
            onCityQuery("");
          },
        }))}
      />

      {/* Quick-pick chips for cities already present in the listing,
          following the same pattern as the Praias filter modal. */}
      {section.cityOptions.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-neutral-100)]">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)] mb-2">
            Cidades cadastradas
          </p>
          <div className="flex flex-wrap gap-2">
            {section.cityOptions.map((c) => {
              const value = `${c.name}, ${c.state}`;
              const selected = activeCity === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setDraft({
                      state: selected ? activeState : (activeState ?? c.state),
                      city: selected ? null : value,
                    })
                  }
                  className={`px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
                    selected
                      ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                      : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
