"use client";

import { Button } from "@/components/atoms/Button";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { PhotoTile } from "@/components/molecules/PhotoTile";

export function PhotoGallery({
  photos,
  onViewAll,
}: {
  photos: string[];
  onViewAll?: () => void;
}) {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-screen-md flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-medium text-[32px] leading-[40px] tracking-[-0.02em] text-[var(--color-ink)]">
            Fotos
          </h2>
          <Button variant="pill-outline" size="md" onClick={onViewAll}>
            Ver todas
          </Button>
        </div>
        <HorizontalCarousel>
          {photos.map((src, i) => (
            <div key={src + i} className="snap-start">
              <PhotoTile src={src} />
            </div>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  );
}
