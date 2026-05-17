"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@/components/atoms/Icon";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Nordeste Brazil bounding box (lon_min, lat_min, lon_max, lat_max)
const NORDESTE_BBOX = "-49,-19,-32,-1";

interface Suggestion {
  id: string;
  place_name: string;
  text: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function CityAutocompleteField({ value, onChange, className }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value → input
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,district&country=BR&bbox=${NORDESTE_BBOX}&limit=6&language=pt`;
      const res = await fetch(url);
      const data = await res.json();
      const features: Suggestion[] = (data.features ?? []).map(
        (f: { id: string; place_name: string; text: string }) => ({
          id: f.id,
          place_name: f.place_name,
          text: f.text,
        })
      );
      setSuggestions(features);
      setOpen(features.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(q); // keep external in sync while typing
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 280);
  }

  function select(suggestion: Suggestion) {
    // Extract "Cidade, Estado" from place_name (drop country suffix)
    const parts = suggestion.place_name.split(", ");
    // Mapbox returns: "City, State, Brazil", take first 2
    const city = parts.slice(0, 2).join(", ");
    setQuery(city);
    onChange(city);
    setSuggestions([]);
    setOpen(false);
  }

  const base =
    "w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white placeholder:text-[var(--color-neutral-400)]";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <input
          type="text"
          className={base}
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Ex: João Pessoa, PB"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="size-4 border-2 border-[var(--color-brand-purple)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && query && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-800)]"
            onClick={() => { setQuery(""); onChange(""); setSuggestions([]); setOpen(false); }}
          >
            <Icon name="lucide:x" size={14} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-neutral-200)] bg-white shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--color-neutral-100)] flex items-center gap-2 transition-colors"
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
            >
              <Icon name="lucide:map-pin" size={14} className="text-[var(--color-brand-purple)] shrink-0" />
              <span className="text-[var(--color-neutral-800)] truncate">{s.place_name.split(", Brazil")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
