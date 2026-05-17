"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/atoms/Icon";
import { compressToWebP, uploadToR2, deleteFromR2, isR2Url, toProxyUrl } from "@/lib/imageUpload";

interface Props {
  value: string[];
  onChange: (photos: string[]) => void;
  /** R2 sub-folder. Defaults to "geral". */
  uploadCategory?: string;
}

export function PhotosField({ value, onChange, uploadCategory = "geral" }: Props) {
  const photos = Array.isArray(value) ? value : [];
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function processFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        images.map(async (file) => {
          const blob = await compressToWebP(file);
          const { publicUrl } = await uploadToR2(blob, file.name, uploadCategory);
          return publicUrl;
        }),
      );
      onChange([...photos, ...urls]);
    } catch (err) {
      console.error("Photos upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    await processFiles(files);
    if (e.target) e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!uploading) setDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    await processFiles(files);
  }

  async function removePhoto(i: number) {
    const url = photos[i];
    if (url && isR2Url(url)) deleteFromR2(url);
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-xl transition-colors ${
          dragOver ? "bg-[var(--color-brand-purple)]/5 outline outline-2 outline-[var(--color-brand-purple)] outline-offset-2" : ""
        }`}
      >
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-neutral-100)]">
            <Image
              src={toProxyUrl(url)}
              alt={`Foto ${i + 1}`}
              fill
              className="object-cover"
              sizes="120px"
              unoptimized={isR2Url(url)}
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <Icon name="lucide:x" size={11} />
            </button>
          </div>
        ))}

        {/* Add button */}
        <label
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors text-[var(--color-neutral-600)] ${
            uploading ? "opacity-50 pointer-events-none" : ""
          } ${
            dragOver
              ? "border-[var(--color-brand-purple)] text-[var(--color-brand-purple)]"
              : "border-[var(--color-neutral-300)] hover:border-[var(--color-brand-purple)] hover:text-[var(--color-brand-purple)]"
          }`}
        >
          {uploading ? (
            <Icon name="svg-spinners:ring-resize" size={20} className="text-[var(--color-brand-purple)]" />
          ) : (
            <>
              <Icon name="lucide:plus" size={20} />
              <span className="text-[10px] mt-1 font-medium text-center px-1">
                {dragOver ? "Soltar aqui" : "Adicionar"}
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--color-neutral-600)]">
        Arraste imagens pra adicionar. Comprimidas automaticamente para WebP.
      </p>
    </div>
  );
}
