"use client";

import { useEffect, useState } from "react";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";

const LANGS = [
  { code: "pt-BR", label: "Português (Brasil)", note: "Atual" },
  { code: "en-US", label: "English (US)", note: "Em breve" },
  { code: "es-ES", label: "Español", note: "Em breve" },
];

const CURRENCIES = [
  { code: "BRL", label: "Real (R$)", note: "Atual" },
  { code: "USD", label: "Dólar (US$)", note: "Em breve" },
];

export default function IdiomaPage() {
  const auth = useAuth();
  const [lang, setLang] = useState("pt-BR");
  const [currency, setCurrency] = useState("BRL");

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  return (
    <SettingsLayout
      title="Idioma e região"
      subtitle="Defina o idioma e a moeda que prefere."
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <Section title="Idioma">
          {LANGS.map((l) => (
            <Option
              key={l.code}
              label={l.label}
              note={l.note}
              selected={lang === l.code}
              disabled={l.note === "Em breve"}
              onSelect={() => setLang(l.code)}
            />
          ))}
        </Section>

        <Section title="Moeda">
          {CURRENCIES.map((c) => (
            <Option
              key={c.code}
              label={c.label}
              note={c.note}
              selected={currency === c.code}
              disabled={c.note === "Em breve"}
              onSelect={() => setCurrency(c.code)}
            />
          ))}
        </Section>
      </div>
    </SettingsLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Option({
  label,
  note,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  note: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex items-center gap-3 p-4 rounded-[16px] bg-white border transition-colors text-left ${
        selected
          ? "border-[var(--color-neutral-800)] border-2"
          : "border-[var(--color-neutral-200)]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--color-neutral-800)]"}`}
    >
      <span className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
        {label}
      </span>
      <span className="text-[12px] text-[var(--color-neutral-600)]">{note}</span>
      {selected && (
        <Icon name="check" size={16} className="text-[var(--color-neutral-800)]" />
      )}
    </button>
  );
}
