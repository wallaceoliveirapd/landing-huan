"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

function ClickDetailModal({
  clickId,
  onClose,
}: {
  clickId: Id<"affiliateClicks">;
  onClose: () => void;
}) {
  const detail = useQuery(api.affiliateClicks.getClickDetail, { clickId });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-2xl p-6 max-w-lg w-full z-10 max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base text-[var(--color-neutral-800)]">
            Detalhes do clique
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <Icon name="lucide:x" size={16} className="text-[var(--color-neutral-600)]" />
          </button>
        </div>

        {detail === undefined ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-[var(--color-neutral-100)] rounded w-full" />
            ))}
          </div>
        ) : detail === null ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Clique não encontrado.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Click info */}
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-2">
                Clique
              </p>
              <div className="rounded-xl border border-[var(--color-neutral-200)] divide-y divide-[var(--color-neutral-100)]">
                <Row label="Data / Hora">
                  <span className="font-mono text-xs">
                    {new Date(detail.click.timestamp).toLocaleString("pt-BR")}
                  </span>
                </Row>
                <Row label="Item">
                  {detail.click.itemName}
                </Row>
                <Row label="Tipo">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[detail.click.itemType] ?? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"}`}
                  >
                    {TYPE_LABELS[detail.click.itemType] ?? detail.click.itemType}
                  </span>
                </Row>
                {detail.click.channel && (
                  <Row label="Canal">
                    <span className="font-mono text-xs">{detail.click.channel}</span>
                  </Row>
                )}
                <Row label="Ref">
                  <span className="font-mono text-xs text-[var(--color-neutral-500)]">{detail.click.ref}</span>
                </Row>
                <Row label="URL destino">
                  <a
                    href={detail.click.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[var(--color-brand-purple)] hover:underline break-all"
                  >
                    {detail.click.targetUrl.length > 60
                      ? detail.click.targetUrl.slice(0, 60) + "…"
                      : detail.click.targetUrl}
                  </a>
                </Row>
              </div>
            </section>

            {/* User info */}
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-2">
                Usuário
              </p>
              {detail.click.isLoggedIn === false || detail.click.isLoggedIn === undefined ? (
                <div className="rounded-xl border border-[var(--color-neutral-200)] px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] px-2 py-0.5 text-xs font-medium">
                    Anônimo
                  </span>
                </div>
              ) : detail.user === null ? (
                <div className="rounded-xl border border-[var(--color-neutral-200)] px-4 py-3 text-sm text-[var(--color-neutral-500)]">
                  Logado, mas usuário não encontrado.
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-neutral-200)] divide-y divide-[var(--color-neutral-100)]">
                  {detail.user.name && <Row label="Nome">{detail.user.name}</Row>}
                  {detail.user.email && <Row label="E-mail"><span className="font-mono text-xs">{detail.user.email}</span></Row>}
                  {detail.user.phone && <Row label="Telefone"><span className="font-mono text-xs">{detail.user.phone}</span></Row>}
                  {detail.user.whatsapp && <Row label="WhatsApp"><span className="font-mono text-xs">{detail.user.whatsapp}</span></Row>}
                  {!detail.user.name && !detail.user.email && !detail.user.phone && !detail.user.whatsapp && (
                    <div className="px-4 py-3 text-sm text-[var(--color-neutral-500)]">Sem dados de perfil.</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span className="text-xs text-[var(--color-neutral-500)] w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[var(--color-neutral-800)] font-medium flex-1">{children}</span>
    </div>
  );
}

export default function RelatoriosPage() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [detailClickId, setDetailClickId] = useState<Id<"affiliateClicks"> | null>(null);

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
                      <th className="px-4 py-3" />
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
                        click.targetUrl.length > 40
                          ? click.targetUrl.slice(0, 40) + "…"
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
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDetailClickId(click._id)}
                              className="h-7 px-2.5 rounded-lg border border-[var(--color-neutral-200)] text-xs text-[var(--color-neutral-600)] hover:border-[var(--color-neutral-400)] hover:text-[var(--color-neutral-800)] transition-colors whitespace-nowrap"
                            >
                              Ver
                            </button>
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

      {detailClickId && (
        <ClickDetailModal
          clickId={detailClickId}
          onClose={() => setDetailClickId(null)}
        />
      )}

      <StoryLinksReport />
    </div>
  );
}

// ── Stories link-click report ───────────────────────────────────────────────
function StoryLinksReport() {
  const stories = useQuery(api.stories.adminListAll, {});
  if (stories === undefined) {
    return (
      <div className="mt-12">
        <SkeletonCard />
      </div>
    );
  }
  const withLinks = stories.filter((s) => s.link);
  const total = withLinks.reduce((sum, s) => sum + (s.linkClickCount ?? 0), 0);
  return (
    <section className="mt-12">
      <h2 className="font-display font-bold text-xl text-[var(--color-neutral-800)] mb-1">
        Cliques em links de Stories
      </h2>
      <p className="text-sm text-[var(--color-neutral-600)] mb-4">
        {withLinks.length} story{withLinks.length === 1 ? "" : "s"} com link •{" "}
        {total} clique{total === 1 ? "" : "s"} no total.
      </p>
      {withLinks.length === 0 ? (
        <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-5 text-sm text-[var(--color-neutral-500)]">
          Nenhum story com link cadastrado.
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide">Story</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide">Link</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide">Views</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide">Cliques</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-neutral-100)]">
              {withLinks
                .slice()
                .sort((a, b) => (b.linkClickCount ?? 0) - (a.linkClickCount ?? 0))
                .map((s) => {
                  const views = s.viewCount ?? 0;
                  const clicks = s.linkClickCount ?? 0;
                  const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0;
                  return (
                    <tr key={s._id}>
                      <td className="px-4 py-3 text-[var(--color-neutral-700)] max-w-[200px] truncate">
                        {s.caption ?? "(sem legenda)"}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={s.link!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-brand-purple)] hover:underline truncate inline-block max-w-[260px] align-bottom"
                        >
                          {s.link!.label}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{views}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{clicks}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-neutral-600)] tabular-nums">
                        {ctr}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
