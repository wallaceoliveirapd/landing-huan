"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

const SWIPE_DISMISS = 80;

export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  alt = "Foto",
}: {
  photos: string[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  alt?: string;
}) {
  const startX = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  const next = useCallback(
    () => onIndexChange((index! + 1) % photos.length),
    [index, photos.length, onIndexChange],
  );
  const prev = useCallback(
    () => onIndexChange((index! - 1 + photos.length) % photos.length),
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, next, prev, onClose]);

  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [index]);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    setDrag(e.touches[0].clientX - startX.current);
  }
  function onTouchEnd() {
    if (startX.current === null) return;
    const dx = drag;
    startX.current = null;
    setDrag(0);
    if (dx <= -SWIPE_DISMISS) next();
    else if (dx >= SWIPE_DISMISS) prev();
  }

  return (
    <AnimatePresence>
      {index !== null && (
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
                  onClick={prev}
                  aria-label="Foto anterior"
                  className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
                >
                  <Icon name="chevron-left" size={22} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Próxima foto"
                  className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors"
                >
                  <Icon name="chevron-right" size={22} className="text-white" />
                </button>
              </>
            )}
          </div>

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
                    onClick={() => onIndexChange(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`relative shrink-0 size-14 rounded-[10px] overflow-hidden border-2 transition-colors ${
                      i === index
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
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
      )}
    </AnimatePresence>
  );
}
