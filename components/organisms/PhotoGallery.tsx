"use client";

import { MasonryGallery } from "./MasonryGallery";

export function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  /** Optional alt text used inside the gallery + lightbox */
  alt?: string;
  /** Legacy prop, no longer used. Kept for backwards compat. */
  onViewAll?: () => void;
}) {
  if (!photos || photos.length === 0) return null;
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
        <h2 className="font-display font-medium text-[32px] leading-[40px] tracking-[-0.02em] text-[var(--color-ink)]">
          Fotos
        </h2>
        <MasonryGallery photos={photos} alt={alt ?? "Foto"} />
      </div>
    </section>
  );
}
