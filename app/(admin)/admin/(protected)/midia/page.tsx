"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import Image from "next/image";

export default function MidiaPage() {
  const items = useQuery(api.media.list, {});
  const saveRecord = useMutation(api.media.saveMediaRecord);
  const remove = useMutation(api.media.remove);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Get presigned URL from Next.js API route
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, mimeType: file.type }),
        });
        const { uploadUrl, publicUrl } = await presignRes.json();

        // Upload to R2
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        // Save record in Convex
        await saveRecord({
          filename: file.name,
          url: publicUrl,
          mimeType: file.type,
          size: file.size,
        });
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-purple)]/10 text-[var(--color-brand-purple)]">
            <Icon name="lucide:image" size={20} />
          </span>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--color-neutral-800)]">
              Mídia / R2
            </h1>
            <p className="text-sm text-[var(--color-neutral-600)]">
              Faça upload de imagens para o Cloudflare R2.
            </p>
          </div>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-purple)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 transition-opacity"
        >
          {uploading ? (
            <Icon name="svg-spinners:ring-resize" size={16} />
          ) : (
            <>
              <Icon name="lucide:upload" size={16} />
              Upload
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="rounded-2xl border-2 border-dashed border-[var(--color-neutral-300)] p-8 text-center text-sm text-[var(--color-neutral-600)] hover:border-[var(--color-brand-purple)] transition-colors"
      >
        Arraste imagens aqui ou clique em Upload
      </div>

      {/* Grid */}
      {items === undefined ? (
        <p className="text-sm text-[var(--color-neutral-600)]">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--color-neutral-600)]">Nenhuma mídia ainda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="group relative rounded-xl overflow-hidden bg-[var(--color-neutral-100)] aspect-square"
            >
              {item.mimeType.startsWith("image/") && (
                <Image
                  src={item.url}
                  alt={item.filename}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end gap-1 p-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => copyUrl(item.url)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-white/90 py-1.5 text-xs font-medium text-black"
                >
                  {copied === item.url ? <Icon name="lucide:check" size={12} /> : <Icon name="lucide:copy" size={12} />}
                  Copiar URL
                </button>
                <button
                  onClick={() => remove({ id: item._id })}
                  className="grid size-7 place-items-center rounded-lg bg-red-500/90 text-white"
                >
                  <Icon name="lucide:trash-2" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
