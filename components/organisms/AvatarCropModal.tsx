"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";

interface Props {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
}

async function cropToBlob(src: string, area: Area, size = 512): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas ctx unavailable");
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/webp",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Square (1:1) avatar cropper with zoom and pan, rendered with a circular
 * overlay. The cropped output is delivered to onConfirm as a 512x512 webp
 * blob.
 */
export function AvatarCropModal({ open, src, onClose, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!src || !area) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(src, area);
      await onConfirm(blob);
      onClose();
    } catch (err) {
      console.error("crop failed", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Recortar foto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col bg-black"
        >
          <div
            className="flex items-center justify-between px-4 text-white"
            style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancelar"
              className="text-[14px] font-medium px-3 py-2 rounded-full bg-white/10"
            >
              Cancelar
            </button>
            <span className="text-[14px] font-medium opacity-80">Recortar foto</span>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving || !area}
              className="text-[14px] font-medium px-4 py-2 rounded-full bg-[var(--color-brand-yellow)] text-black disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Concluir"}
            </button>
          </div>

          <div className="relative flex-1">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          </div>

          <div
            className="px-6 py-5 flex items-center gap-3 text-white"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
          >
            <Icon name="image" size={16} className="opacity-70" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--color-brand-yellow)]"
              aria-label="Zoom"
            />
            <Icon name="zoom-in" size={16} className="opacity-70" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
