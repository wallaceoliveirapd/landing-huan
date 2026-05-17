"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";
import { compressToWebP, uploadToR2, deleteFromR2, isR2Url, toProxyUrl } from "@/lib/imageUpload";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** R2 sub-folder (landing-huan/[uploadCategory]/…). Defaults to "geral". */
  uploadCategory?: string;
}

export function ImageUploadField({ value, onChange, uploadCategory = "geral" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem.");
      return;
    }
    setError(null);
    setUploading(true);
    setProgress("Comprimindo…");
    try {
      const blob = await compressToWebP(file);
      setProgress("Enviando…");
      const { publicUrl } = await uploadToR2(blob, file.name, uploadCategory);
      if (value && isR2Url(value)) deleteFromR2(value);
      onChange(publicUrl);
    } catch (err) {
      setError("Falha no upload. Tente novamente.");
      console.error(err);
    } finally {
      setUploading(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    if (!uploading) setDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
  }
  async function handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
      return;
    }
    // Dragged from another browser tab (Google Images, etc.). Extract the
    // image URL from the dataTransfer and ask the server to download it for
    // us (bypasses CORS).
    const url = pickImageUrl(e.dataTransfer);
    if (url) await processUrl(url);
  }

  async function processUrl(url: string) {
    setError(null);
    setUploading(true);
    setProgress("Baixando…");
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Falha ao baixar" }));
        throw new Error(j.error ?? "Falha ao baixar");
      }
      const blob = await res.blob();
      const fileName = (url.split("/").pop() ?? "image").split("?")[0];
      const file = new File([blob], fileName, { type: blob.type });
      await processFile(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao baixar a imagem.";
      setError(msg);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  function handleRemove() {
    if (value && isR2Url(value)) deleteFromR2(value);
    onChange("");
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full aspect-video rounded-xl overflow-hidden bg-[var(--color-neutral-100)] transition-shadow ${
            dragOver ? "ring-4 ring-[var(--color-brand-purple)]/40" : ""
          }`}
        >
          <Image
            src={toProxyUrl(value)}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 480px"
            unoptimized={isR2Url(value)}
          />
          {dragOver && (
            <div className="absolute inset-0 grid place-items-center bg-[var(--color-brand-purple)]/30 text-white text-sm font-medium pointer-events-none">
              Solte para substituir
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <Icon name="lucide:x" size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors text-[var(--color-neutral-600)] disabled:opacity-50 ${
            dragOver
              ? "border-[var(--color-brand-purple)] text-[var(--color-brand-purple)] bg-[var(--color-brand-purple)]/5"
              : "border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)]"
          }`}
        >
          {uploading ? (
            <>
              <Icon name="svg-spinners:ring-resize" size={24} />
              <span className="text-sm">{progress}</span>
            </>
          ) : (
            <>
              <Icon name="lucide:image-plus" size={28} />
              <span className="text-sm font-medium">
                {dragOver ? "Solte a imagem aqui" : "Clique ou arraste pra fazer upload"}
              </span>
              <span className="text-xs opacity-70">JPG, PNG, WEBP, comprime automaticamente</span>
            </>
          )}
        </button>
      )}

      {/* URL fallback input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole uma URL de imagem"
          className="flex-1 rounded-xl border border-[var(--color-neutral-300)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-purple)] transition-colors bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Trocar imagem"
            className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)] hover:bg-[var(--color-brand-purple)]/20 disabled:opacity-50 transition-colors"
          >
            {uploading
              ? <Icon name="svg-spinners:ring-resize" size={14} />
              : <Icon name="lucide:refresh-cw" size={14} />
            }
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

/**
 * Extract an image URL from a DragEvent's dataTransfer. Handles a few flavors
 * that browsers attach when you drag an <img> out of another tab:
 *   - text/uri-list: the canonical URL list
 *   - text/x-moz-url: Firefox-specific, "url\ntitle"
 *   - text/html:     contains <img src="..."> — Chrome on Mac uses this
 *   - text/plain:    last-resort plain URL
 */
function pickImageUrl(dt: DataTransfer): string | null {
  const candidates: string[] = [];
  for (const type of ["text/uri-list", "text/x-moz-url", "text/plain"]) {
    const v = dt.getData(type);
    if (v) candidates.push(...v.split(/\r?\n/));
  }
  const html = dt.getData("text/html");
  if (html) {
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) candidates.push(m[1]);
  }
  for (const raw of candidates) {
    const c = raw.trim();
    if (!c) continue;
    if (c.startsWith("http://") || c.startsWith("https://")) return c;
  }
  return null;
}
