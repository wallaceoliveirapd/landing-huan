"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { PhotoTile } from "@/components/molecules/PhotoTile";
import { PhotoLightbox } from "./PhotoLightbox";

export function PhotoGallery({
  photos,
  alt = "Foto",
}: {
  photos: string[];
  alt?: string;
  /** Legacy prop, no longer used (Ver todas opens the lightbox at index 0). */
  onViewAll?: () => void;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (!photos || photos.length === 0) return null;
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-medium text-[32px] leading-[40px] tracking-[-0.02em] text-[var(--color-ink)]">
            Fotos
          </h2>
          <Button variant="pill-outline" size="md" onClick={() => setOpenAt(0)}>
            Ver todas
          </Button>
        </div>
        <HorizontalCarousel>
          {photos.map((src, i) => (
            <button
              type="button"
              key={src + i}
              onClick={() => setOpenAt(i)}
              className="snap-start"
            >
              <PhotoTile src={src} />
            </button>
          ))}
        </HorizontalCarousel>
      </div>
      <PhotoLightbox
        photos={photos}
        index={openAt}
        onIndexChange={setOpenAt}
        onClose={() => setOpenAt(null)}
        alt={alt}
      />
    </section>
  );
}
