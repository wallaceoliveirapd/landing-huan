"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";

/**
 * Autocomplete input with suggestion dropdown. When a value is selected,
 * the input swaps to a read-only chip with a clear button.
 */
export type AutocompleteSuggestion = {
  key: string;
  primary: string;
  secondary?: string;
  onPick: () => void;
};

export function FilterAutocomplete({
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
  suggestions: AutocompleteSuggestion[];
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
            <div className="absolute z-50 mt-1 w-full rounded-[12px] border border-[var(--color-neutral-200)] bg-white shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    s.onPick();
                  }}
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
