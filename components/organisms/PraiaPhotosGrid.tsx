"use client";

import { useState } from "react";
import Image from "next/image";
import { toProxyUrl } from "@/lib/imageUpload";
import { PhotoLightbox } from "./PhotoLightbox";

export function PraiaPhotosGrid({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {photos.slice(0, 6).map((src, i) => (
          <button
            type="button"
            key={src + i}
            onClick={() => setOpenAt(i)}
            className="relative aspect-square overflow-hidden rounded-[16px] bg-[var(--color-neutral-100)]"
          >
            <Image
              src={toProxyUrl(src)}
              alt={alt}
              fill
              sizes="(min-width: 768px) 350px, 50vw"
              className="object-cover hover:scale-[1.03] transition-transform duration-300"
            />
          </button>
        ))}
      </div>
      <PhotoLightbox
        photos={photos}
        index={openAt}
        onIndexChange={setOpenAt}
        onClose={() => setOpenAt(null)}
        alt={alt}
      />
    </>
  );
}
