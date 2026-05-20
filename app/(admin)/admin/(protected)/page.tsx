"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import Link from "next/link";

// ─── Sections config ────────────────────────────────────────────
const SECTIONS = [
  {
    href: "/admin/passeios",
    label: "Passeios",
    icon: "lucide:map-pin",
    color: "text-orange-500",
    bg: "bg-orange-50",
    query: api.tours.list,
  },
  {
    href: "/admin/restaurantes",
    label: "Restaurantes",
    icon: "lucide:utensils",
    color: "text-red-500",
    bg: "bg-red-50",
    query: api.restaurants.list,
  },
  {
    href: "/admin/dicas",
    label: "Dicas",
    icon: "lucide:lightbulb",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    query: api.dicas.list,
  },
  {
    href: "/admin/praias",
    label: "Praias",
    icon: "lucide:waves",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    query: api.praias.list,
  },
  {
    href: "/admin/vida-noturna",
    label: "Vida Noturna",
    icon: "lucide:moon",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    query: api.nightlife.list,
  },
  {
    href: "/admin/roteiros",
    label: "Roteiros",
    icon: "lucide:route",
    color: "text-green-600",
    bg: "bg-green-50",
    query: api.itineraries.list,
  },
  {
    href: "/admin/hospedagem",
    label: "Hospedagem",
    icon: "lucide:bed",
    color: "text-purple-600",
    bg: "bg-purple-50",
    query: api.hosting.list,
  },
  {
    href: "/admin/cupons",
    label: "Cupons",
    icon: "lucide:ticket-percent",
    color: "text-pink-600",
    bg: "bg-pink-50",
    query: api.coupons.list,
  },
] as const;

const QUICK_ADDS = [
  { href: "/admin/passeios/novo", label: "Passeio", icon: "lucide:map-pin" },
  { href: "/admin/restaurantes/novo", label: "Restaurante", icon: "lucide:utensils" },
  { href: "/admin/dicas/novo", label: "Dica", icon: "lucide:lightbulb" },
  { href: "/admin/praias/novo", label: "Praia", icon: "lucide:waves" },
  { href: "/admin/roteiros/novo", label: "Roteiro", icon: "lucide:route" },
  { href: "/admin/hospedagem/novo", label: "Hospedagem", icon: "lucide:bed" },
  { href: "/admin/cupons/novo", label: "Cupom", icon: "lucide:ticket-percent" },
] as const;

// ─── Section card ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionCard({ href, label, icon, color, bg, query }: (typeof SECTIONS)[number]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = useQuery(query as any, { activeOnly: false } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const active = (all as any[])?.filter((i: any) => i.active)?.length ?? 0;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[var(--color-neutral-200)]"
    >
      <div className="flex items-start justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${bg} ${color}`}>
          <Icon name={icon} size={20} />
        </span>
        <Icon
          name="lucide:arrow-up-right"
          size={14}
          className="text-[var(--color-neutral-400)] opacity-0 group-hover:opacity-100 transition-opacity mt-1"
        />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-[var(--color-neutral-800)]">
          {all === undefined ? (
            <span className="text-[var(--color-neutral-300)]">…</span>
          ) : (
            all.length
          )}
        </p>
        <p className="text-sm font-medium text-[var(--color-neutral-600)] mt-0.5">{label}</p>
      </div>
      {all !== undefined && all.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-500)]">
          <span className="size-1.5 rounded-full bg-green-500 inline-block" />
          {active} ativo{active !== 1 ? "s" : ""}
          {all.length - active > 0 && (
            <span className="text-[var(--color-neutral-400)]">
              · {all.length - active} inativo{all.length - active !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

const STALE_KIND_LABEL: Record<string, string> = {
  tour: "passeios",
  restaurant: "restaurantes",
  praia: "praias",
  nightlife: "vida noturna",
  dica: "dicas",
  hosting: "hospedagens",
  coupon: "cupons",
};

const STALE_KIND_HREF: Record<string, string> = {
  tour: "/admin/passeios",
  restaurant: "/admin/restaurantes",
  praia: "/admin/praias",
  nightlife: "/admin/vida-noturna",
  dica: "/admin/dicas",
  hosting: "/admin/hospedagem",
  coupon: "/admin/cupons",
};

/**
 * Surfaces items not touched in the last 6 months so admin remembers
 * to refresh prices / photos / availability.
 */
function OutdatedBanner() {
  const summary = useQuery(api.outdated.staleSummary, {});
  if (!summary || summary.total === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
        <Icon name="lucide:alert-triangle" size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">
          {summary.total} item{summary.total !== 1 ? "s" : ""} sem atualização há mais de 6 meses
        </p>
        <p className="text-xs text-amber-800/80 mt-0.5">
          Revise preços, fotos e disponibilidade pra manter o conteúdo confiável.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(summary.byKind).map(([kind, n]) => (
            <Link
              key={kind}
              href={STALE_KIND_HREF[kind] ?? "/admin"}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-amber-200 px-3 py-1 text-[12px] font-medium text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <span className="font-semibold">{n}</span>
              <span>{STALE_KIND_LABEL[kind] ?? kind}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--color-neutral-800)]">
            {greeting}
          </h1>
          <p className="text-sm text-[var(--color-neutral-500)] mt-1 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-brand-purple)] transition-colors"
          >
            <Icon name="lucide:external-link" size={14} />
            Ver site
          </a>
          <Link
            href="/admin/site"
            className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Icon name="lucide:pencil" size={14} />
            Editar site
          </Link>
        </div>
      </div>

      {/* Outdated content nudge */}
      <OutdatedBanner />

      {/* Content stats */}
      <div>
        <h2 className="text-xs font-medium text-[var(--color-neutral-500)] uppercase tracking-wider mb-4">
          Conteúdo
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {SECTIONS.map((s) => (
            <SectionCard key={s.href} {...s} />
          ))}
        </div>
      </div>

      {/* Two columns: quick add + resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick add */}
        <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="lucide:zap" size={16} className="text-[var(--color-brand-yellow)]" />
            <h3 className="text-sm font-medium text-[var(--color-neutral-800)]">Adicionar novo</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_ADDS.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-200)] px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)] transition-colors"
              >
                <Icon name={q.icon} size={14} />
                {q.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Settings & tools */}
        <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Icon name="lucide:settings-2" size={16} className="text-[var(--color-neutral-500)]" />
            <h3 className="text-sm font-medium text-[var(--color-neutral-800)]">Configurações</h3>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/admin/site"
              className="flex items-center gap-3 rounded-xl hover:bg-[var(--color-neutral-50)] px-3 py-3 text-sm text-[var(--color-neutral-700)] transition-colors group"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
                <Icon name="lucide:pencil" size={15} />
              </span>
              <div className="flex-1">
                <p className="font-medium">Conteúdo do site</p>
                <p className="text-xs text-[var(--color-neutral-500)]">Textos, imagens e hero</p>
              </div>
              <Icon name="lucide:chevron-right" size={14} className="text-[var(--color-neutral-400)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/midia"
              className="flex items-center gap-3 rounded-xl hover:bg-[var(--color-neutral-50)] px-3 py-3 text-sm text-[var(--color-neutral-700)] transition-colors group"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]">
                <Icon name="lucide:image" size={15} />
              </span>
              <div className="flex-1">
                <p className="font-medium">Biblioteca de mídia</p>
                <p className="text-xs text-[var(--color-neutral-500)]">Upload e gerenciamento de imagens</p>
              </div>
              <Icon name="lucide:chevron-right" size={14} className="text-[var(--color-neutral-400)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tip banner */}
      <div className="rounded-2xl bg-[var(--color-brand-yellow)] p-5 flex items-start gap-4">
        <span className="grid size-10 place-items-center rounded-xl bg-black/10 text-black shrink-0">
          <Icon name="lucide:route" size={20} />
        </span>
        <div>
          <p className="font-display font-bold text-[var(--color-neutral-800)]">
            Crie roteiros prontos para os turistas
          </p>
          <p className="text-sm text-[var(--color-neutral-700)] mt-1">
            Use o construtor de roteiros para montar itinerários de 1, 3 e 7 dias com passeios, restaurantes e dicas. Aparecem na seção de Roteiros do site.
          </p>
          <Link
            href="/admin/roteiros/novo"
            className="inline-flex items-center gap-2 mt-3 rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <Icon name="lucide:plus" size={14} />
            Criar roteiro
          </Link>
        </div>
      </div>
    </div>
  );
}
