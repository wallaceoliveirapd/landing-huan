/** Compress an image File to a WebP Blob using Canvas */
export function compressToWebP(
  file: File,
  maxWidth = 1400,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    img.src = objectUrl;
  });
}

/**
 * Upload a blob to R2 via the Next.js API route (server-side PUT — no CORS issues).
 * Files are stored under: landing-huan/[category]/[timestamp]-[filename].webp
 * Returns the public proxy URL + storage key.
 */
export async function uploadToR2(
  blob: Blob,
  originalFilename: string,
  /** R2 sub-folder. Stored as landing-huan/[category]/... */
  category = "geral"
): Promise<{ publicUrl: string; key: string }> {
  const webpFilename = originalFilename.replace(/\.[^.]+$/, ".webp");
  // Convert blob to a File so FormData sets the correct filename/type
  const file = new File([blob], webpFilename, { type: "image/webp" });

  const form = new FormData();
  form.append("file", file);
  form.append("category", category);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed (${res.status}): ${msg}`);
  }
  const { publicUrl, key } = await res.json();
  return { publicUrl, key };
}

/** Delete a previously uploaded R2 image. Extracts key from URL. */
export async function deleteFromR2(url: string): Promise<void> {
  if (!isR2Url(url)) return;
  // Key is everything after the public URL base, e.g. "uploads/123-foo.webp"
  const key = extractR2Key(url);
  if (!key) return;
  await fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  }).catch(console.error);
}

/** True if the URL looks like an R2 uploaded file (not external). */
export function isR2Url(url: string): boolean {
  if (typeof url !== "string") return false;
  return (
    url.startsWith("/api/img/") ||
    url.includes("/uploads/") ||
    url.includes("/landing-huan/")
  );
}

function extractR2Key(url: string): string | null {
  // From proxy URL: /api/img/landing-huan/passeios/123-file.webp
  const proxyMatch = url.match(/\/api\/img\/(.+)$/);
  if (proxyMatch) return proxyMatch[1];
  // From old/absolute CDN URL: https://evokemedia.com.br/uploads/123-file.webp
  // or https://evokemedia.com.br/landing-huan/passeios/123-file.webp
  const cdnMatch = url.match(/https?:\/\/[^/]+\/(.+)$/);
  if (cdnMatch) return cdnMatch[1];
  return null;
}

/**
 * Normalizes any R2 image URL to the internal proxy path (/api/img/…).
 * Works with new landing-huan/ paths, old uploads/ paths, and absolute CDN URLs.
 * Returns the original string UNCHANGED for external images (Unsplash, etc.).
 */
export function toProxyUrl(url: string): string {
  if (!url) return url;
  // Only proxy R2 URLs — external CDNs (Unsplash, etc.) pass through unchanged
  if (!isR2Url(url)) return url;
  if (url.startsWith("/api/img/")) return url; // already proxied
  const key = extractR2Key(url);
  if (key) return `/api/img/${key}`;
  return url;
}

/** Generate a URL-safe slug from a title string (strips accents, spaces → hyphens). */
export function toSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}
