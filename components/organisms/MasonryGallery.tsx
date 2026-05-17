"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

interface Props {
  photos: string[];
  alt?: string;
}

const SWIPE_DISMISS = 80;

/**
 * Two-column CSS masonry gallery (three columns on desktop) where each tile
 * grows to its natural aspect ratio. Clicking a tile opens a fullscreen
 * lightbox with swipe + arrow navigation.
 */
export function MasonryGallery({ photos, alt = "Foto" }: Props) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  const close = useCallback(() => setOpenAt(null), []);
  const next = useCallback(
    () => setOpenAt((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );
  const prev = useCallback(
    () =>
      setOpenAt((i) =>
        i === null ? null : (i - 1 + photos.length) % photos.length,
      ),
    [photos.length],
  );

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (openAt === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openAt, next, prev, close]);

  // Lock body scroll while open.
  useEffect(() => {
    if (openAt === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [openAt]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="columns-2 sm:columns-3 gap-2 [column-fill:_balance]">
        {photos.map((src, i) => (
          <button
            type="button"
            key={src + i}
            onClick={() => setOpenAt(i)}
            className="block w-full mb-2 break-inside-avoid overflow-hidden rounded-[14px] bg-[var(--color-neutral-100)]"
          >
            {/* unoptimized=false so Next handles sizing; intrinsic aspect via natural dims */}
            <Image
              src={toProxyUrl(src)}
              alt={`${alt} ${i + 1}`}
              width={600}
              height={800}
              sizes="(min-width: 768px) 240px, 50vw"
              className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {openAt !== null && (
          <Lightbox
            photos={photos}
            index={openAt}
            onClose={close}
            onNext={next}
            onPrev={prev}
            alt={alt}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onNext,
  onPrev,
  alt,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  alt: string;
}) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    setDrag(dx);
  }
  function onTouchEnd() {
    if (startX.current === null) return;
    const dx = drag;
    startX.current = null;
    startY.current = null;
    setDrag(0);
    if (dx <= -SWIPE_DISMISS) onNext();
    else if (dx >= SWIPE_DISMISS) onPrev();
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de fotos"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] bg-black flex flex-col"
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 text-white"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <span className="text-[13px] font-medium opacity-80">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Icon name="x" size={18} className="text-white" />
        </button>
      </div>

      {/* Image area */}
      <div
        className="relative flex-1 flex items-center justify-center select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={photos[index]}
            initial={{ opacity: 0, x: drag > 0 ? -40 : 40 }}
            animate={{ opacity: 1, x: drag }}
            exit={{ opacity: 0, x: drag > 0 ? 40 : -40 }}
            transition={{ duration: 0.2 }}
            className="relative w-full h-full"
          >
            <Image
              src={toProxyUrl(photos[index])}
              alt={`${alt} ${index + 1}`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Foto anterior"
              className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
            >
              <Icon name="chevron-left" size={22} className="text-white" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Próxima foto"
              className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
            >
              <Icon name="chevron-right" size={22} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {photos.length > 1 && (
        <div
          className="overflow-x-auto no-scrollbar"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
        >
          <div className="flex gap-2 px-4 py-3">
            {photos.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => onNavigate(i)}
                aria-label={`Foto ${i + 1}`}
                className={`relative shrink-0 size-14 rounded-[10px] overflow-hidden border-2 transition-colors ${
                  i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={toProxyUrl(src)}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  function onNavigate(i: number) {
    // setOpenAt comes from parent — proxy via prev/next stepping isn't ideal,
    // simulate via prev/next jumps. The thumbnail strip is the only consumer
    // of arbitrary index, so dispatch the right number of next/prev clicks.
    const delta = i - index;
    if (delta === 0) return;
    if (delta > 0) for (let k = 0; k < delta; k++) onNext();
    else for (let k = 0; k < -delta; k++) onPrev();
  }
}
