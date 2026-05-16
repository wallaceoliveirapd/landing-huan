"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { ImageUploadField } from "@/components/organisms/admin/ImageUploadField";

// Text fields
const TEXT_KEYS = [
  { key: "hero_title", label: "Título do Hero", placeholder: "Tá vindo pra João Pessoa?" },
  { key: "hero_subtitle", label: "Subtítulo do Hero", placeholder: "A gente te conta o que vale a pena." },
  { key: "coupon_code", label: "Código do Cupom", placeholder: "HUAN10" },
  { key: "coupon_description", label: "Descrição do Cupom", placeholder: "10% OFF nos passeios" },
  { key: "featured_title", label: "Título da Seção Destaque", placeholder: "Não sabe por onde começar?" },
  { key: "featured_subtitle", label: "Subtítulo da Seção Destaque", placeholder: "O NordestAI te ajuda." },
];

// Image fields (stored as siteContent keys with image URLs)
const IMAGE_KEYS = [
  {
    key: "featured_hero_image_1",
    label: "FeaturedHero — Slide 1",
    placeholder: "https://images.unsplash.com/...",
  },
  {
    key: "featured_hero_image_2",
    label: "FeaturedHero — Slide 2",
    placeholder: "https://images.unsplash.com/...",
  },
  {
    key: "featured_hero_image_3",
    label: "FeaturedHero — Slide 3",
    placeholder: "https://images.unsplash.com/...",
  },
];

function SiteTextField({
  siteKey,
  label,
  placeholder,
}: {
  siteKey: string;
  label: string;
  placeholder: string;
}) {
  const value = useQuery(api.siteContent.get, { key: siteKey });
  const set = useMutation(api.siteContent.set);
  const [local, setLocal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const displayValue = local !== null ? local : (value ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      await set({ key: siteKey, value: displayValue });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setLocal(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--color-neutral-800)]">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white"
        />
        <button
          onClick={handleSave}
          disabled={saving || local === null}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 transition-opacity whitespace-nowrap"
        >
          {saving ? (
            <Icon name="svg-spinners:ring-resize" size={14} />
          ) : saved ? (
            <><Icon name="lucide:check" size={14} /> Salvo</>
          ) : (
            "Salvar"
          )}
        </button>
      </div>
    </div>
  );
}

function SiteImageField({ siteKey, label }: { siteKey: string; label: string }) {
  const value = useQuery(api.siteContent.get, { key: siteKey });
  const set = useMutation(api.siteContent.set);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [local, setLocal] = useState<string | null>(null);

  const displayValue = local !== null ? local : (value ?? "");

  async function handleSave(url: string) {
    setLocal(url);
    setSaving(true);
    try {
      await set({ key: siteKey, value: url });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-neutral-800)]">{label}</label>
        {saving && <Icon name="svg-spinners:ring-resize" size={14} className="text-[var(--color-brand-purple)]" />}
        {saved && !saving && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Icon name="lucide:check" size={12} /> Salvo
          </span>
        )}
      </div>
      <ImageUploadField
        value={displayValue}
        onChange={handleSave}
      />
    </div>
  );
}

export default function SitePage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
          <Icon name="lucide:pencil" size={20} />
        </span>
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-[var(--color-neutral-800)]">
            Conteúdo do Site
          </h1>
          <p className="text-sm text-[var(--color-neutral-600)]">
            Edite textos, imagens e configurações visíveis no site público.
          </p>
        </div>
      </div>

      {/* Text fields */}
      <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-5">
        <h2 className="font-display font-medium text-base text-[var(--color-neutral-800)] border-b border-[var(--color-neutral-100)] pb-3">
          Textos
        </h2>
        {TEXT_KEYS.map((k) => (
          <SiteTextField key={k.key} siteKey={k.key} label={k.label} placeholder={k.placeholder} />
        ))}
      </div>

      {/* FeaturedHero images */}
      <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-5">
        <div>
          <h2 className="font-display font-medium text-base text-[var(--color-neutral-800)]">
            Imagens do Hero
          </h2>
          <p className="text-xs text-[var(--color-neutral-600)] mt-1">
            Slides do carrossel principal da home (seção "Não sabe por onde começar?").
            Alterações aparecem imediatamente no site.
          </p>
        </div>
        {IMAGE_KEYS.map((k) => (
          <SiteImageField key={k.key} siteKey={k.key} label={k.label} />
        ))}
      </div>
    </div>
  );
}
