import { NextRequest, NextResponse } from "next/server";

/** Browser-like headers to avoid bot detection */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.google.com.br/",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
  "upgrade-insecure-requests": "1",
};

interface ScrapeResult {
  name?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  description?: string;
  cuisine?: string;
  hours?: { day: string; open: string; close: string }[];
  website?: string;
  priceRange?: string;
  sourceUrl: string;
  error?: string;
}

function firstText(html: string, re: RegExp): string {
  return html.match(re)?.[1]?.trim() ?? "";
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u([\dA-Fa-f]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .trim();
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  // TripAdvisor embeds multiple JSON-LD blocks; collect all and find the restaurant/attraction one
  const blocks: string[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1]);
  }

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.trim());
      // Handle @graph arrays
      const items: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"]
        ? parsed["@graph"]
        : [parsed];

      for (const item of items) {
        const obj = item as Record<string, unknown>;
        const type = String(obj["@type"] ?? "").toLowerCase();
        if (
          type.includes("restaurant") ||
          type.includes("foodestablishment") ||
          type.includes("touristattraction") ||
          type.includes("localbusiness")
        ) {
          return obj;
        }
      }
    } catch {
      // malformed JSON, skip
    }
  }
  return null;
}

function extractPriceRange(html: string): string | undefined {
  // TripAdvisor uses $ $$ $$$ $$$$
  const m = html.match(/priceRange[^"]*"([$$$$]+)"/);
  if (m) return m[1];
  const m2 = html.match(/"priceRange"\s*:\s*"([^"]+)"/);
  return m2?.[1];
}

function extractPhone(html: string): string | undefined {
  const m = html.match(/telephone[":\s]*"([+\d\s()-]{7,20})"/);
  if (m) return m[1].trim();
  // meta
  const m2 = html.match(/content="((?:\+55|0)[\d\s()-]{8,20})"/);
  return m2?.[1]?.trim();
}

function extractCuisine(ld: Record<string, unknown>): string | undefined {
  const raw = ld["servesCuisine"] ?? ld["cuisines"];
  if (!raw) return undefined;
  if (Array.isArray(raw)) return (raw as string[]).join(", ");
  return String(raw);
}

function extractAddress(ld: Record<string, unknown>): string | undefined {
  const addr = ld["address"] as Record<string, unknown> | string | undefined;
  if (!addr) return undefined;
  if (typeof addr === "string") return decodeHtmlEntities(addr);
  const parts = [
    addr["streetAddress"],
    addr["addressLocality"],
    addr["addressRegion"],
  ]
    .filter(Boolean)
    .map((p) => decodeHtmlEntities(String(p)));
  return parts.join(", ") || undefined;
}

/** Convert a desktop TripAdvisor URL to mobile equivalent */
function toMobileUrl(url: string): string {
  return url
    .replace(/www\.tripadvisor\.com\.br/, "m.tripadvisor.com.br")
    .replace(/www\.tripadvisor\.com\//, "m.tripadvisor.com/")
    .replace(/https:\/\/tripadvisor\.com\.br/, "https://m.tripadvisor.com.br")
    .replace(/https:\/\/tripadvisor\.com\//, "https://m.tripadvisor.com/");
}

/** Mobile browser headers — less strict bot detection on mobile subdomain */
const MOBILE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.google.com.br/",
  "Cache-Control": "no-cache",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
};

async function tryFetch(url: string, isMobile = false): Promise<{ html: string; ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      headers: isMobile ? MOBILE_HEADERS : HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return { html: "", ok: false, status: res.status };
    const html = await res.text();
    return { html, ok: true, status: 200 };
  } catch {
    return { html: "", ok: false, status: 0 };
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({ url: "" }));

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  // ── Attempt 1: desktop URL ───────────────────────────────────────────
  let { html, ok, status } = await tryFetch(url, false);

  // ── Attempt 2: mobile URL (less aggressive bot detection) ───────────
  if (!ok) {
    const mobileUrl = toMobileUrl(url);
    if (mobileUrl !== url) {
      ({ html, ok, status } = await tryFetch(mobileUrl, true));
    }
  }

  if (!ok) {
    // Return a partial result with error + sourceUrl so the UI can offer manual fill
    return NextResponse.json({
      sourceUrl: url,
      blocked: true,
      error:
        status === 403
          ? "TripAdvisor bloqueou o acesso automático (403). Abra a URL manualmente, copie os dados e preencha o formulário."
          : `Não foi possível acessar o TripAdvisor (status ${status || "timeout"}). Verifique sua conexão ou preencha manualmente.`,
    });
  }

  // ── Primary: JSON-LD structured data ───────────────────────────────
  const ld = extractJsonLd(html);

  const result: ScrapeResult = { sourceUrl: url };

  if (ld) {
    result.name = decodeHtmlEntities(String(ld["name"] ?? "")) || undefined;
    const agg = ld["aggregateRating"] as Record<string, unknown> | undefined;
    if (agg) {
      result.rating = parseFloat(String(agg["ratingValue"] ?? "")) || undefined;
      result.reviewCount = parseInt(String(agg["reviewCount"] ?? ""), 10) || undefined;
    }
    result.address = extractAddress(ld);
    result.description = ld["description"]
      ? decodeHtmlEntities(String(ld["description"])).slice(0, 600)
      : undefined;
    result.cuisine = extractCuisine(ld);
    result.website =
      (ld["url"] as string | undefined) ??
      (ld["sameAs"] as string | undefined) ??
      undefined;
    result.phone =
      (ld["telephone"] as string | undefined) ?? extractPhone(html);
    result.priceRange = (ld["priceRange"] as string | undefined) ?? extractPriceRange(html);
  } else {
    // ── Fallback: Open Graph + meta ───────────────────────────────────
    result.name =
      firstText(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) ||
      firstText(html, /<title>([^<]{3,80})<\/title>/);

    result.description =
      firstText(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/) ||
      firstText(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/);

    // Regex fallbacks
    result.rating =
      parseFloat(firstText(html, /"ratingValue"\s*:\s*"?([\d.]+)"?/)) || undefined;
    result.reviewCount =
      parseInt(
        firstText(html, /"reviewCount"\s*:\s*"?([\d,]+)"?/).replace(/,/g, ""),
        10
      ) || undefined;
    result.address = firstText(html, /"streetAddress"\s*:\s*"([^"]+)"/);
    result.phone = extractPhone(html);
    result.priceRange = extractPriceRange(html);
  }

  // Sanitize: remove empty strings
  for (const k of Object.keys(result) as (keyof ScrapeResult)[]) {
    if (result[k] === "" || result[k] === 0) delete (result as unknown as Record<string, unknown>)[k];
  }

  // If we got basically nothing, TripAdvisor likely blocked us
  if (!result.name && !result.rating && !result.address) {
    result.error =
      "TripAdvisor não retornou dados. A página pode exigir login ou bloqueou o acesso. Cole a URL diretamente e preencha manualmente.";
  }

  return NextResponse.json(result);
}
