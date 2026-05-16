import { NextRequest, NextResponse } from "next/server";

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
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
  "upgrade-insecure-requests": "1",
};

interface ScrapeResult {
  title?: string;
  description?: string;
  shortDesc?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  sourceUrl: string;
  error?: string;
  blocked?: boolean;
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
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"]
        ? parsed["@graph"]
        : [parsed];
      for (const item of items) {
        const obj = item as Record<string, unknown>;
        const type = String(obj["@type"] ?? "").toLowerCase();
        if (
          type.includes("product") ||
          type.includes("touristattraction") ||
          type.includes("event") ||
          type.includes("activity")
        ) {
          return obj;
        }
      }
    } catch {
      // malformed JSON
    }
  }
  return null;
}

function parsePTDuration(pt: string): string | undefined {
  const days = pt.match(/(\d+)D/i)?.[1];
  const hours = pt.match(/(\d+)H/i)?.[1];
  const mins = pt.match(/(\d+)M(?!S)/i)?.[1];
  const parts: string[] = [];
  if (days) parts.push(`${days} dia${parseInt(days) > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hora${parseInt(hours) > 1 ? "s" : ""}`);
  if (mins) parts.push(`${mins} min`);
  return parts.length ? parts.join(" ") : undefined;
}

function extractDuration(ld: Record<string, unknown>, html: string): string | undefined {
  for (const key of ["timeRequired", "duration"]) {
    const val = ld[key] as string | undefined;
    if (val) {
      if (/^PT?/i.test(val)) return parsePTDuration(val);
      return decodeHtmlEntities(val);
    }
  }
  const m = html.match(
    /[Dd]ura[çc][aã]o[^:]*:?\s*(?:<[^>]+>)*\s*(\d+[^<\n]{2,30}(?:hora|dia|min|h\b))/
  );
  return m ? m[1].trim() : undefined;
}

function extractImage(ld: Record<string, unknown>, html: string): string | undefined {
  const img = ld["image"];
  if (typeof img === "string" && img.startsWith("http")) return img;
  if (Array.isArray(img) && typeof img[0] === "string") return img[0] as string;
  if (img && typeof img === "object") {
    const url = (img as Record<string, unknown>)["url"];
    if (typeof url === "string") return url;
  }
  return firstText(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) || undefined;
}

function extractPrice(
  ld: Record<string, unknown>,
  html: string
): { price?: number; originalPrice?: number } {
  let price: number | undefined;
  const offers = ld["offers"] as
    | Record<string, unknown>
    | Record<string, unknown>[]
    | undefined;
  if (offers) {
    const arr = Array.isArray(offers) ? offers : [offers];
    for (const o of arr) {
      const p = parseFloat(String(o["price"] ?? ""));
      if (p > 0) { price = p; break; }
    }
  }
  if (!price) {
    const m = html.match(/R\$\s*([\d.]+,\d{2})/);
    if (m) price = parseFloat(m[1].replace(/\./g, "").replace(",", ".")) || undefined;
  }
  let originalPrice: number | undefined;
  const m2 = html.match(/<s[^>]*>R\$\s*([\d.]+,\d{2})<\/s>/);
  if (m2) originalPrice = parseFloat(m2[1].replace(/\./g, "").replace(",", ".")) || undefined;
  return { price, originalPrice };
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({ url: "" }));
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  let html = "";
  let ok = false;
  let status = 0;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(14000),
    });
    status = res.status;
    if (res.ok) { html = await res.text(); ok = true; }
  } catch {
    // timeout / network
  }

  if (!ok) {
    return NextResponse.json({
      sourceUrl: url,
      blocked: true,
      error:
        status === 403 || status === 429
          ? "Civitatis bloqueou o acesso. Tente novamente ou preencha manualmente."
          : `Não foi possível acessar a página (status ${status || "timeout"}).`,
    });
  }

  const ld = extractJsonLd(html);
  const result: ScrapeResult = { sourceUrl: url };

  if (ld) {
    result.title = decodeHtmlEntities(String(ld["name"] ?? "")) || undefined;

    const rawDesc = ld["description"]
      ? decodeHtmlEntities(String(ld["description"]))
      : undefined;
    if (rawDesc) {
      result.description = rawDesc;
      result.shortDesc = rawDesc.length > 160
        ? rawDesc.slice(0, 157).replace(/\s\S*$/, "…")
        : rawDesc;
    }

    const agg = ld["aggregateRating"] as Record<string, unknown> | undefined;
    if (agg) {
      result.rating = parseFloat(String(agg["ratingValue"] ?? "")) || undefined;
      result.reviewCount =
        parseInt(String(agg["reviewCount"] ?? agg["ratingCount"] ?? ""), 10) || undefined;
    }

    result.image = extractImage(ld, html);
    const { price, originalPrice } = extractPrice(ld, html);
    result.price = price;
    result.originalPrice = originalPrice;
    result.duration = extractDuration(ld, html);
  } else {
    result.title =
      firstText(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/) ||
      firstText(html, /<title>([^|<]{3,80})/) ||
      undefined;

    const desc =
      firstText(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/) ||
      firstText(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/) ||
      undefined;
    if (desc) {
      result.description = desc;
      result.shortDesc = desc.length > 160 ? desc.slice(0, 157).replace(/\s\S*$/, "…") : desc;
    }

    result.image =
      firstText(html, /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) || undefined;
    result.rating =
      parseFloat(firstText(html, /"ratingValue"\s*:\s*"?([\d.]+)"?/)) || undefined;
    result.reviewCount =
      parseInt(
        firstText(html, /"reviewCount"\s*:\s*"?([\d,]+)"?/).replace(/,/g, ""),
        10
      ) || undefined;
    const m = html.match(/R\$\s*([\d.]+,\d{2})/);
    if (m) result.price = parseFloat(m[1].replace(/\./g, "").replace(",", ".")) || undefined;
    result.duration = extractDuration({}, html);
  }

  // Strip undefined / empty / 0
  for (const k of Object.keys(result) as (keyof ScrapeResult)[]) {
    if (result[k] === "" || result[k] === 0 || result[k] == null) {
      delete (result as unknown as Record<string, unknown>)[k];
    }
  }
  result.sourceUrl = url;

  if (!result.title && !result.price) {
    result.error =
      "Não foi possível extrair dados. A página pode ter proteção anti-bot. Preencha manualmente.";
  }

  return NextResponse.json(result);
}
