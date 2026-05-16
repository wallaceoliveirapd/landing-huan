"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/atoms/Icon";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://seuhuan.com.br";

const CAMPAIGN_PRESETS = [
  "meta_ads",
  "google_ads",
  "email",
  "whatsapp",
  "instagram",
  "influencer",
  "parceiro",
];

const MEDIUM_PRESETS = ["cpc", "email", "social", "organic", "referral", "qr"];

const CONTENT_PRESETS = [
  "",
  "banner_hero",
  "banner_cupom",
  "card_passeio",
  "card_restaurante",
  "card_dica",
];

const PAGE_PRESETS = [
  { label: "Home", value: "/" },
  { label: "Passeios", value: "/passeios" },
  { label: "Restaurantes", value: "/restaurantes" },
  { label: "Dicas", value: "/dicas" },
  { label: "Praias", value: "/praias" },
  { label: "Vida Noturna", value: "/vida-noturna" },
  { label: "Roteiros", value: "/roteiros" },
  { label: "Hospedagem", value: "/hospedagem" },
];

function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

export default function AnalyticsPage() {
  const [page, setPage] = useState("/");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const generatedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (source.trim()) params.set("utm_source", slugify(source));
    if (medium.trim()) params.set("utm_medium", slugify(medium));
    if (campaign.trim()) params.set("utm_campaign", slugify(campaign));
    if (term.trim()) params.set("utm_term", slugify(term));
    if (content.trim()) params.set("utm_content", slugify(content));
    const qs = params.toString();
    return `${BASE_URL}${page}${qs ? `?${qs}` : ""}`;
  }, [page, source, medium, campaign, term, content]);

  function copyUrl() {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function reset() {
    setPage("/");
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="font-display font-bold text-2xl text-[var(--color-neutral-800)] mb-1">
        Gerador de Links UTM
      </h1>
      <p className="text-sm text-[var(--color-neutral-600)] mb-6">
        Crie links rastreáveis para suas campanhas. Os parâmetros são capturados pelo GTM / GA4.
      </p>

      <div className="bg-white border border-[var(--color-neutral-300)] rounded-2xl p-6 flex flex-col gap-5">

        {/* Page */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            Página de destino
          </label>
          <div className="flex flex-wrap gap-2">
            {PAGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPage(p.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${page === p.value
                  ? "bg-[var(--color-brand-purple)] text-white border-[var(--color-brand-purple)]"
                  : "bg-white text-[var(--color-neutral-800)] border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)]"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="/pagina-personalizada"
            className="mt-1 h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>

        {/* utm_source */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            utm_source <span className="font-normal text-[var(--color-neutral-600)]">(de onde vem o tráfego)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setSource(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${source === p
                  ? "bg-[var(--color-brand-purple)] text-white border-[var(--color-brand-purple)]"
                  : "bg-white text-[var(--color-neutral-600)] border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)]"
                  }`}>{p}</button>
            ))}
          </div>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="ex: meta_ads, google, newsletter"
            className="mt-1 h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>

        {/* utm_medium */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            utm_medium <span className="font-normal text-[var(--color-neutral-600)]">(canal de mídia)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MEDIUM_PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setMedium(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${medium === p
                  ? "bg-[var(--color-brand-purple)] text-white border-[var(--color-brand-purple)]"
                  : "bg-white text-[var(--color-neutral-600)] border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)]"
                  }`}>{p}</button>
            ))}
          </div>
          <input
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            placeholder="ex: cpc, email, social"
            className="mt-1 h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>

        {/* utm_campaign */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            utm_campaign <span className="font-normal text-[var(--color-neutral-600)]">(nome da campanha)</span>
          </label>
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="ex: verao_2025, black_friday"
            className="h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>

        {/* utm_content (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            utm_content <span className="font-normal text-[var(--color-neutral-600)]">(opcional — identifica o criativo)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_PRESETS.filter(Boolean).map((p) => (
              <button key={p} type="button" onClick={() => setContent(p)}
                className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${content === p
                  ? "bg-[var(--color-brand-purple)] text-white border-[var(--color-brand-purple)]"
                  : "bg-white text-[var(--color-neutral-600)] border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)]"
                  }`}>{p}</button>
            ))}
          </div>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ex: banner_hero, card_catamaraFigma"
            className="mt-1 h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>

        {/* utm_term (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-neutral-800)]">
            utm_term <span className="font-normal text-[var(--color-neutral-600)]">(opcional — palavra-chave de busca paga)</span>
          </label>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ex: passeio catamara joao pessoa"
            className="h-10 rounded-xl border border-[var(--color-neutral-300)] px-3 text-sm text-[var(--color-neutral-800)] focus:outline-none focus:border-[var(--color-brand-purple)]"
          />
        </div>
      </div>

      {/* Preview + copy */}
      <div className="mt-6 bg-[var(--color-neutral-100)] rounded-2xl p-5">
        <p className="text-xs font-medium text-[var(--color-neutral-600)] uppercase tracking-wide mb-2">
          URL gerada
        </p>
        <p className="text-sm text-[var(--color-neutral-800)] break-all leading-relaxed font-mono">
          {generatedUrl}
        </p>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={copyUrl}
            className="flex items-center gap-2 rounded-full bg-[var(--color-brand-purple)] text-white px-4 py-2.5 text-sm font-medium hover:brightness-110 transition-all"
          >
            <Icon name={copied ? "lucide:check" : "lucide:copy"} size={15} />
            {copied ? "Copiado!" : "Copiar link"}
          </button>

          <a
            href={generatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-800)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <Icon name="lucide:external-link" size={15} />
            Testar link
          </a>

          <button
            type="button"
            onClick={reset}
            className="ml-auto flex items-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-600)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <Icon name="lucide:rotate-ccw" size={15} />
            Limpar
          </button>
        </div>
      </div>

      {/* Quick guide */}
      <div className="mt-6 border border-[var(--color-neutral-300)] rounded-2xl p-5">
        <h2 className="font-medium text-[var(--color-neutral-800)] mb-3 flex items-center gap-2">
          <Icon name="lucide:info" size={16} className="text-[var(--color-brand-purple)]" />
          Como usar no GA4
        </h2>
        <ul className="text-sm text-[var(--color-neutral-600)] space-y-1.5 list-disc list-inside">
          <li>Cole o link gerado em seus anúncios, e-mails ou posts.</li>
          <li>No GA4, vá em <strong>Relatórios → Aquisição → Aquisição de tráfego</strong>.</li>
          <li>Filtre por <strong>Origem / Mídia</strong> ou <strong>Campanha</strong> para ver os resultados.</li>
          <li>No GTM você pode criar triggers baseados nos parâmetros UTM para disparo de eventos personalizados.</li>
        </ul>

        <h2 className="font-medium text-[var(--color-neutral-800)] mt-5 mb-3 flex items-center gap-2">
          <Icon name="lucide:facebook" size={16} className="text-blue-600" />
          Como usar no Meta Ads
        </h2>
        <ul className="text-sm text-[var(--color-neutral-600)] space-y-1.5 list-disc list-inside">
          <li>Cole a URL no campo <strong>URL do site</strong> ao criar o anúncio.</li>
          <li>O Meta Pixel já está instalado no site e rastreia <strong>PageView</strong> e eventos de conteúdo.</li>
          <li>No Gerenciador de Eventos do Meta, confirme que os eventos estão chegando.</li>
        </ul>
      </div>
    </div>
  );
}
