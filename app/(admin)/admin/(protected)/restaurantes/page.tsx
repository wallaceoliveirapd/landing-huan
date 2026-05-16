"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AdminListPage } from "@/components/organisms/admin/AdminListPage";
import { Icon } from "@/components/atoms/Icon";
import { toSlug } from "@/lib/imageUpload";

interface ScrapeResult {
  name?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  website?: string;
  sourceUrl?: string;
  error?: string;
  blocked?: boolean;
}

function TripAdvisorImporter() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScrape() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tripadvisor-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: ScrapeResult = await res.json();
      // Always show result (even if blocked — we show the fallback UX inside result panel)
      setResult(data);
      if (data.blocked && !data.name) {
        setError(null); // error is shown inside the result panel
      }
    } catch {
      setError("Erro de rede. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }

  /** Navigate to /novo with prefilled query params */
  function handleUseData() {
    if (!result) return;
    const params = new URLSearchParams();
    if (result.name) params.set("name", result.name);
    if (result.name) params.set("slug", toSlug(result.name));
    if (result.description) params.set("description", result.description);
    if (result.address) params.set("address", result.address);
    if (result.phone) params.set("phone", result.phone);
    if (result.rating) params.set("rating", String(result.rating));
    if (result.reviewCount) params.set("reviewCount", String(result.reviewCount));
    if (result.cuisine) params.set("cuisine", result.cuisine);
    if (result.priceRange) params.set("priceRange", result.priceRange);
    if (result.website) params.set("website", result.website);
    if (url) params.set("tripAdvisorUrl", url);
    router.push(`/admin/restaurantes/novo?${params.toString()}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-800)] hover:border-[var(--color-brand-purple)] transition-colors"
      >
        <Icon name="simple-icons:tripadvisor" size={15} />
        <span className="hidden sm:inline">Importar TripAdvisor</span>
        <span className="sm:hidden">TripAdvisor</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="simple-icons:tripadvisor" size={18} className="text-[#34E0A1]" />
                <h2 className="font-display font-bold text-lg">Importar do TripAdvisor</h2>
              </div>
              <button
                onClick={() => { setOpen(false); setResult(null); setError(null); }}
                className="grid size-8 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)]"
              >
                <Icon name="lucide:x" size={16} />
              </button>
            </div>

            <p className="text-sm text-[var(--color-neutral-500)]">
              Cole a URL do restaurante no TripAdvisor para importar os dados automaticamente.
            </p>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="https://www.tripadvisor.com.br/Restaurant_Review-..."
              className="w-full rounded-xl border border-[var(--color-neutral-300)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors"
            />

            <button
              onClick={handleScrape}
              disabled={loading || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-purple)] py-3 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <><Icon name="svg-spinners:ring-resize" size={16} /> Buscando…</>
              ) : (
                <><Icon name="lucide:search" size={15} /> Buscar dados</>
              )}
            </button>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                <p className="font-medium mb-1">Não foi possível importar</p>
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-3">
                {/* Blocked / partial data warning */}
                {result.error && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col gap-2">
                    <p className="text-sm font-medium text-amber-700">⚠️ Acesso bloqueado pelo TripAdvisor</p>
                    <p className="text-xs text-amber-700 leading-relaxed">{result.error}</p>
                    {result.sourceUrl && (
                      <a
                        href={result.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-purple)] underline underline-offset-2"
                      >
                        <Icon name="lucide:external-link" size={12} />
                        Abrir TripAdvisor em nova aba
                      </a>
                    )}
                  </div>
                )}

                {/* Show data panel if we got anything at all, even partial */}
                {(result.name || result.rating || result.address || result.description) && (
                  <div className="rounded-xl border border-[var(--color-neutral-200)] overflow-hidden">
                    <div className="bg-[var(--color-neutral-50)] px-4 py-2.5 border-b border-[var(--color-neutral-200)]">
                      <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide">
                        Dados encontrados
                      </p>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-2 text-sm">
                      <Row label="Nome" value={result.name} />
                      <Row label="Avaliação" value={result.rating ? `⭐ ${result.rating}` : undefined} />
                      <Row label="Avaliações" value={result.reviewCount ? `${result.reviewCount.toLocaleString("pt-BR")} reviews` : undefined} />
                      <Row label="Endereço" value={result.address} />
                      <Row label="Telefone" value={result.phone} />
                      <Row label="Cozinha" value={result.cuisine} />
                      <Row label="Faixa de preço" value={result.priceRange} />
                      {result.description && (
                        <div>
                          <span className="font-medium text-[var(--color-neutral-600)]">Descrição: </span>
                          <span className="text-[var(--color-neutral-700)] line-clamp-3">{result.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Always show "fill manually" option — even when blocked */}
                <button
                  onClick={handleUseData}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-purple)] py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <Icon name="lucide:arrow-right" size={15} />
                  {result.name ? "Usar esses dados → Criar restaurante" : "Preencher manualmente → Criar restaurante"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-medium text-[var(--color-neutral-600)]">{label}: </span>
      <span className="text-[var(--color-neutral-700)]">{value}</span>
    </p>
  );
}

export default function RestaurantesPage() {
  const items = useQuery(api.restaurants.list, { activeOnly: false });
  return (
    <AdminListPage
      title="Restaurantes"
      icon="lucide:utensils"
      items={items as never}
      basePath="/admin/restaurantes"
      deleteMutation={api.restaurants.remove}
      extra={<TripAdvisorImporter />}
      rowLabel={(item) => String(item.name ?? item._id)}
      rowImage={(item) => String(item.image ?? "")}
    />
  );
}
