"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { gtmViewItemList, gtmSearch, gtmFilterApplied } from "@/lib/gtm";
import { SectionSpacer } from "./SectionSpacer";
import { EmptyState } from "./EmptyState";
import { ListingSearch } from "@/components/molecules/ListingSearch";
import { useInfiniteList, InfiniteSentinel } from "@/components/molecules/InfiniteList";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";
const STATE_LABEL: Record<string, string> = {
  AL: "Alagoas",
  BA: "Bahia",
  CE: "Ceará",
  MA: "Maranhão",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  RN: "Rio Grande do Norte",
  SE: "Sergipe",
};

function parseCity(value: string): { name: string; state: string } {
  const [name, state] = value.split(",").map((s) => s.trim());
  return { name: name ?? "", state: (state ?? "").toUpperCase() };
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PraiasContent() {
  const convexPraias = useQuery(api.praias.list, { activeOnly: true });

  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  // Random order, stable per session (re-shuffles only when DB list size
  // changes). useState lazy init runs once at mount.
  const allPraias = useMemo(
    () => shuffle(convexPraias ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convexPraias?.length],
  );

  // GTM: fire view_item_list once when data first loads
  const firedRef = useRef(false);
  useEffect(() => {
    if (convexPraias !== undefined && !firedRef.current) {
      firedRef.current = true;
      gtmViewItemList("praias");
    }
  }, [convexPraias]);

  // GTM: fire search when term >= 2 chars
  useEffect(() => {
    if (search.length >= 2) {
      gtmSearch(search, "praias");
    }
  }, [search]);

  const cities = useMemo(
    () => [...new Set(allPraias.map((p) => p.city).filter(Boolean) as string[])].sort(),
    [allPraias],
  );

  // Build city + state options from the praias actually in the DB. We expect
  // praia.city in the "Cidade, Estado" format (e.g. "João Pessoa, PB"), so we
  // parse it and dedupe.
  const allCityOptions = useMemo(() => {
    const seen = new Map<string, { name: string; state: string }>();
    for (const p of allPraias) {
      const raw = (p.city ?? "").trim();
      if (!raw) continue;
      const { name, state } = parseCity(raw);
      if (!name) continue;
      const key = `${name}|${state}`;
      if (!seen.has(key)) seen.set(key, { name, state });
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allPraias]);

  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of allCityOptions) if (c.state) seen.add(c.state);
    return [...seen].sort();
  }, [allCityOptions]);

  const stateSuggestions = useMemo(() => {
    const q = stateQuery.trim().toLowerCase();
    return stateOptions.filter((s) =>
      !q || s.toLowerCase().includes(q) || (STATE_LABEL[s] ?? "").toLowerCase().includes(q),
    );
  }, [stateOptions, stateQuery]);

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    const base = activeState
      ? allCityOptions.filter((c) => c.state === activeState)
      : allCityOptions;
    return base.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 30);
  }, [allCityOptions, activeState, cityQuery]);

  // Top recurring features across all praias
  const topFeatures = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const p of allPraias) for (const f of (p.features ?? [])) freq[f] = (freq[f] ?? 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f]) => f);
  }, [allPraias]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allPraias.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) return false;
      if (activeCity) {
        const pc = parseCity(p.city ?? "");
        const ac = parseCity(activeCity);
        if (pc.name.toLowerCase() !== ac.name.toLowerCase()) return false;
      }
      if (activeState) {
        const { state } = parseCity(p.city ?? "");
        if (state !== activeState) return false;
      }
      if (activeFeature && !(p.features ?? []).includes(activeFeature)) return false;
      return true;
    });
  }, [allPraias, search, activeCity, activeState, activeFeature]);

  const locationChipLabel = activeCity
    ? `Cidade: ${parseCity(activeCity).name}`
    : activeState
      ? `Estado: ${activeState}`
      : "Localização";

  const chips = [
    {
      key: "city-picker",
      label: locationChipLabel,
      active: !!activeCity || !!activeState,
      onToggle: () => setCityMenuOpen((v) => !v),
    },
    ...topFeatures.map((f) => ({
      key: `feat-${f}`,
      label: f,
      active: activeFeature === f,
      onToggle: () => { const next = activeFeature === f ? null : f; setActiveFeature(next); if (next) gtmFilterApplied("caracteristica", f, "praias"); },
    })),
  ];

  function pickCity(c: { name: string; state: string } | null) {
    if (!c) {
      setActiveCity(null);
      setCityQuery("");
      return;
    }
    const value = `${c.name}, ${c.state}`;
    setActiveCity(value);
    setCityQuery(c.name);
    gtmFilterApplied("cidade", c.name, "praias");
  }

  function pickState(state: string | null) {
    if (!state) {
      setActiveState(null);
      setStateQuery("");
      return;
    }
    setActiveState(state);
    setStateQuery(state);
    // If a city was selected and doesn't belong to this state, clear it.
    if (activeCity) {
      const { state: cityState } = parseCity(activeCity);
      if (cityState !== state) {
        setActiveCity(null);
        setCityQuery("");
      }
    }
    gtmFilterApplied("estado", state, "praias");
  }

  function clearLocation() {
    setActiveCity(null);
    setActiveState(null);
    setCityQuery("");
    setStateQuery("");
  }

  const { visible, sentinelRef, hasMore } = useInfiniteList(filtered, { initial: 6, step: 6 });

  if (convexPraias === undefined) {
    return (
      <div className="pb-20">
        <div className="h-20 bg-white border-b border-[var(--color-neutral-100)]" />
        <section className="bg-white">
          <div className="mx-auto w-full max-w-screen-md p-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[240px] rounded-card bg-[var(--color-neutral-100)] animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (allPraias.length === 0) {
    return (
      <section className="bg-white">
        <EmptyState
          icon="waves"
          title="Estamos finalizando esse guia"
          description="O conteúdo de cada praia será cadastrado em breve."
        />
      </section>
    );
  }

  return (
    <div className="pb-20">
      <ListingSearch
        search={search}
        onSearch={setSearch}
        placeholder="Buscar praias..."
        chips={chips}
        resultCount={filtered.length}
        totalCount={allPraias.length}
      />

      <AnimatePresence>
        {cityMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCityMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <h3 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
                  Filtrar por localização
                </h3>
                <button
                  type="button"
                  onClick={() => setCityMenuOpen(false)}
                  aria-label="Fechar"
                  className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)]"
                >
                  <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-4">
                {/* Estado autocomplete */}
                <FilterAutocomplete
                  label="Estado"
                  placeholder="Ex: Paraíba, PB"
                  query={stateQuery}
                  onQueryChange={setStateQuery}
                  selected={activeState}
                  onClear={() => pickState(null)}
                  renderSelected={(s) => `${s}, ${STATE_LABEL[s] ?? ""}`.replace(/, $/, "")}
                  suggestions={stateSuggestions.slice(0, 9).map((s) => ({
                    key: s,
                    primary: STATE_LABEL[s] ?? s,
                    secondary: s,
                    onPick: () => pickState(s),
                  }))}
                />

                {/* Cidade autocomplete */}
                <FilterAutocomplete
                  label="Cidade"
                  placeholder={activeState ? `Buscar cidade em ${activeState}` : "Buscar cidade do Nordeste"}
                  query={cityQuery}
                  onQueryChange={setCityQuery}
                  selected={activeCity}
                  onClear={() => pickCity(null)}
                  renderSelected={(c) => c}
                  suggestions={citySuggestions.map((c) => ({
                    key: `${c.name}-${c.state}`,
                    primary: c.name,
                    secondary: c.state,
                    onPick: () => pickCity(c),
                  }))}
                />

                {/* Limpar tudo */}
                {(activeCity || activeState) && (
                  <button
                    type="button"
                    onClick={() => { clearLocation(); setCityMenuOpen(false); }}
                    className="self-start mt-1 text-[13px] font-medium text-[var(--color-neutral-600)]"
                  >
                    Limpar filtros
                  </button>
                )}

                {/* Quick picks from current DB cities */}
                {cities.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-neutral-100)]">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)] mb-2">
                      Cidades com praias cadastradas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cities.map((c) => {
                        const parsed = parseCity(c);
                        const selected = activeCity === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => pickCity(parsed)}
                            className={`px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${selected
                                ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                                : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]"
                              }`}
                          >
                            {parsed.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <EmptyState icon="waves" title="Nenhuma praia encontrada" description="Tente outros filtros ou limpe a busca." />
      ) : (
        visible.map((p, i) => (
          <div key={p._id}>
            <section className="bg-white">
              <div className="mx-auto w-full max-w-screen-md p-4">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link href={`/praias/${p.slug}`} className="flex flex-col gap-4 group">
                    <div className="relative h-[200px] w-full overflow-hidden rounded-card ">
                      <Image
                        src={toProxyUrl(p.image)}
                        alt={p.name}
                        fill
                        sizes="(min-width: 768px) 720px, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {p.city && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-800)] flex items-center gap-1">
                          <Icon name="map-pin" size={11} />
                          {p.city.split(",")[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] group-hover:underline">
                        {p.name}
                      </h3>
                      <p className="text-[14px] text-[var(--color-neutral-600)] leading-relaxed line-clamp-2">
                        {p.shortDesc}
                      </p>
                      {p.features && p.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {p.features.slice(0, 4).map((f) => (
                            <span
                              key={f}
                              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              </div>
            </section>
            {i < visible.length - 1 && <SectionSpacer />}
          </div>
        ))
      )}
      <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
    </div>
  );
}

function FilterAutocomplete({
  label,
  placeholder,
  query,
  onQueryChange,
  selected,
  onClear,
  renderSelected,
  suggestions,
}: {
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (v: string) => void;
  selected: string | null;
  onClear: () => void;
  renderSelected: (v: string) => string;
  suggestions: { key: string; primary: string; secondary?: string; onPick: () => void }[];
}) {
  const [focused, setFocused] = useState(false);
  const showSuggestions = focused && suggestions.length > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
        {label}
      </label>
      {selected ? (
        <div className="flex items-center gap-2 h-11 px-3 rounded-[12px] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)]">
          <Icon name="map-pin" size={14} className="text-[var(--color-neutral-600)]" />
          <span className="flex-1 text-[14px] text-[var(--color-neutral-800)]">
            {renderSelected(selected)}
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar"
            className="grid size-7 place-items-center rounded-full bg-white"
          >
            <Icon name="x" size={12} className="text-[var(--color-neutral-700)]" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={placeholder}
            className="w-full h-11 px-3 rounded-[12px] border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
          />
          {showSuggestions && (
            <div className="absolute z-10 mt-1 w-full rounded-[12px] border border-[var(--color-neutral-200)] bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); s.onPick(); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--color-neutral-100)]"
                >
                  <span className="text-[14px] text-[var(--color-neutral-800)]">
                    {s.primary}
                  </span>
                  {s.secondary && (
                    <span className="text-[11px] text-[var(--color-neutral-500)] font-medium">
                      {s.secondary}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
