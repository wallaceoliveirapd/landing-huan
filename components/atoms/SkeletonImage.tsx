"use client";

import { useState } from "react";
import NextImage from "next/image";
import type { ImageProps } from "next/image";

/**
 * next/image wrapper that shows an animate-pulse skeleton until the image
 * loads. Designed for fill images — the parent must be position:relative
 * (or absolute/fixed) and overflow:hidden.
 */
export function SkeletonImage({ className, onLoad: onLoadProp, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[var(--color-neutral-100)] animate-pulse"
        />
      )}
      <NextImage
        {...props}
        className={className}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.25s ease" }}
        onLoad={(e) => {
          setLoaded(true);
          onLoadProp?.(e);
        }}
      />
    </>
  );
}
