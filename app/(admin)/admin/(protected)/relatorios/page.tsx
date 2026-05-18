"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

const TYPE_LABELS: Record<string, string> = {
  tour: "Passeio",
  coupon: "Cupom",
  hosting: "Hospedagem",
};

const TYPE_COLORS: Record<string, string> = {
  tour: "bg-blue-100 text-blue-700",
  coupon: "bg-green-100 text-green-700",
  hosting: "bg-amber-100 text-amber-700",
};

function SkeletonCard() {
  return (
    <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-24 bg-[var(--color-neutral-200)] rounded mb-3" />
      <div className="h-8 w-16 bg-[var(--color-neutral-200)] rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 w-32 bg-[var(--color-neutral-200)] rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 bg-[var(--color-neutral-200)] rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-10 bg-[var(--color-neutral-200)] rounded" /></td>
    </tr>
  );
}

export default function RelatoriosPage() {
  const [selectedType, setSelectedType] = useState<string>("");

  const stats = useQuery(api.affiliateClicks.stats, {});
  const clicks = useQuery(api.affiliateClicks.list, {
    itemType: selectedType || undefined,
    limit: 100,
  });

  const loading = stats === undefined || clicks === undefined;
  const noData = !loading && stats.total === 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="font-display font-bold text-2xl text-[var(--color-neutral-800)] mb-1">
        Relatório de afiliados
      </h1>
      <p className="text-sm text-[var(--color-neutral-600)] mb-8">
        Cliques nos links de afiliados rastreados pelo sistema.
      </p>

      {/* ── Summary cards ───────────────────────────────────── */}
      {loading ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </>
      ) : noData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon name="lucide:bar-chart-2" size={40} className="text-[var(--color-neutral-400)] mb-4" />
          <p className="text-[var(--color-neutral-600)] text-sm max-w-xs">
            Nenhum clique registrado ainda. Compartilhe os links afiliados para começar a rastrear.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {/* Total */}
            <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5">
              <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide mb-1">
                Total de cliques
              </p>
              <p className="text-3xl font-bold text-[var(--color-neutral-800)]">{stats.total}</p>
            </div>

            {/* Logged in */}
            <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5">
              <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide mb-1">
                Usuários logados
              </p>
              <p className="text-3xl font-bold text-green-600">{stats.loggedIn}</p>
            </div>

            {/* Anonymous */}
            <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5">
              <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide mb-1">
                Usuários anônimos
              </p>
              <p className="text-3xl font-bold text-[var(--color-neutral-500)]">{stats.anonymous}</p>
            </div>
          </div>

          {/* By type */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(["tour", "coupon", "hosting"] as const).map((type) => (
              <div
                key={type}
                className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5"
              >
                <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide mb-1">
                  {TYPE_LABELS[type] ?? type}
                </p>
                <p className="text-3xl font-bold text-[var(--color-neutral-800)]">
                  {stats.byType[type] ?? 0}
                </p>
              </div>
            ))}
          </div>

          {/* ── Top items table ─────────────────────────────── */}
          {stats.topItems.length > 0 && (
            <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl mb-8 overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-neutral-200)]">
                <h2 className="font-semibold text-sm text-[var(--color-neutral-800)]">
                  Top itens mais clicados
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-neutral-200)] text-xs text-[var(--color-neutral-600)] uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Nome</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium">Cliques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topItems.map((item, i) => (
                      <tr
                        key={item.ref}
                        className="border-b border-[var(--color-neutral-100)] last:border-0 hover:bg-[var(--color-neutral-50)] transition-colors"
                      >
                        <td className="px-4 py-3 text-[var(--color-neutral-500)] font-mono text-xs">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-neutral-800)] font-medium">
                          {item.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"}`}
                          >
                            {TYPE_LABELS[item.type] ?? item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[var(--color-neutral-800)]">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── By channel ──────────────────────────────────── */}
          {Object.keys(stats.byChannel).length > 0 && (
            <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl mb-8 overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-neutral-200)]">
                <h2 className="font-semibold text-sm text-[var(--color-neutral-800)]">
                  Por canal
                </h2>
              </div>
              <div className="divide-y divide-[var(--color-neutral-100)]">
                {Object.entries(stats.byChannel)
                  .sort(([, a], [, b]) => b - a)
                  .map(([channel, count]) => {
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <div key={channel} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-sm font-medium text-[var(--color-neutral-800)] w-32 shrink-0">
                          {channel}
                        </span>
                        <div className="flex-1 h-2 bg-[var(--color-neutral-100)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-brand-purple)] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-[var(--color-neutral-600)] w-16 text-right">
                          {count} <span className="text-xs text-[var(--color-neutral-400)]">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Recent clicks ────────────────────────────────── */}
          <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-neutral-200)] flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-semibold text-sm text-[var(--color-neutral-800)]">
                Cliques recentes
              </h2>
              {/* Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] bg-white focus:outline-none focus:border-[var(--color-brand-purple)]"
              >
                <option value="">Todos os tipos</option>
                <option value="tour">Passeio</option>
                <option value="coupon">Cupom</option>
                <option value="hosting">Hospedagem</option>
              </select>
            </div>

            {clicks === undefined ? (
              <table className="w-full text-sm">
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            ) : clicks.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--color-neutral-500)]">
                Nenhum clique encontrado para este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-neutral-200)] text-xs text-[var(--color-neutral-600)] uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-medium">Data / Hora</th>
                      <th className="px-4 py-3 text-left font-medium">Nome</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium">Usuário</th>
                      <th className="px-4 py-3 text-left font-medium">Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.map((click) => {
                      const d = new Date(click.timestamp);
                      const dateStr =
                        d.toLocaleDateString("pt-BR") +
                        " " +
                        d.toLocaleTimeString("pt-BR");
                      const shortUrl =
                        click.targetUrl.length > 50
                          ? click.targetUrl.slice(0, 50) + "…"
                          : click.targetUrl;
                      return (
                        <tr
                          key={click._id}
                          className="border-b border-[var(--color-neutral-100)] last:border-0 hover:bg-[var(--color-neutral-50)] transition-colors"
                        >
                          <td className="px-4 py-3 text-xs text-[var(--color-neutral-500)] whitespace-nowrap font-mono">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-neutral-800)] font-medium">
                            {click.itemName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[click.itemType] ?? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"}`}
                            >
                              {TYPE_LABELS[click.itemType] ?? click.itemType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {click.isLoggedIn === true ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-medium">
                                Logado
                              </span>
                            ) : click.isLoggedIn === false ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] px-2 py-0.5 text-[10px] font-medium">
                                Anônimo
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--color-neutral-400)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-neutral-500)] text-xs font-mono">
                            <a
                              href={click.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[var(--color-brand-purple)] transition-colors"
                              title={click.targetUrl}
                            >
                              {shortUrl}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
