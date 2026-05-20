"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { toProxyUrl } from "@/lib/imageUpload";

type Story = {
  _id: string;
  mediaType: string;
  url: string;
  durationMs?: number;
  caption?: string;
  captionStyle?: {
    color?: string;
    bg?: string;
    align?: string;
  };
  link?: {
    url: string;
    label: string;
    color?: string;
    bg?: string;
  };
  createdAt: number;
  expiresAt: number;
  viewCount?: number;
  linkClickCount?: number;
  reactionCounts?: Array<{ emoji: string; count: number }>;
};

const REACTIONS = ["❤️", "🔥", "😍", "👏", "😂", "🥹", "🙌"] as const;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  if (h < 1) {
    const m = Math.floor(diff / 60000);
    return `há ${Math.max(1, m)}m`;
  }
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function StoriesViewer({
  stories,
  startIndex = 0,
  onClose,
}: {
  stories: Story[];
  startIndex?: number;
  onClose: () => void;
}) {
  const auth = useAuth();
  const recordView = useMutation(api.stories.recordView);
  const reactMut = useMutation(api.stories.reactToStory);
  const recordLinkClick = useMutation(api.stories.recordLinkClick);

  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0); // 0..1 for current story
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emojiBurst, setEmojiBurst] = useState<{ emoji: string; key: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const current = stories[index];
  const total = stories.length;
  const isVideo = current?.mediaType === "video";

  // ── Record view on each story shown ─────────────────────────────
  useEffect(() => {
    if (!current || !auth.isAuthenticated) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recordView({ id: current._id as any }).catch(() => { });
  }, [current?._id, auth.isAuthenticated, recordView]);

  // ── Auto-advance ─────────────────────────────────────────────────
  const duration = useMemo(() => {
    if (!current) return 5000;
    if (current.mediaType === "video") return current.durationMs ?? 8000;
    return 5000;
  }, [current]);

  useEffect(() => {
    if (!current) return;
    setProgress(0);
    accumulatedRef.current = 0;
    startRef.current = Date.now();
    // Image: ready immediately. Video: wait for canplay.
    setLoading(isVideo);
  }, [current?._id, isVideo]);

  // Pause/resume the <video> element in sync with the global paused flag.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo) return;
    if (paused || loading) {
      v.pause();
    } else {
      v.play().catch(() => { });
    }
  }, [paused, loading, isVideo]);

  useEffect(() => {
    // Hold the timer until media is ready.
    if (!current || paused || loading) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Freeze accumulated progress when transitioning into paused state.
      if (paused || loading) {
        accumulatedRef.current =
          accumulatedRef.current + (Date.now() - startRef.current);
      }
      return;
    }
    startRef.current = Date.now();
    function tick() {
      const elapsed = accumulatedRef.current + (Date.now() - startRef.current);
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        if (index + 1 >= total) {
          onClose();
        } else {
          setIndex((i) => i + 1);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [current?._id, paused, loading, duration, index, total, onClose]);

  function goNext() {
    if (index + 1 >= total) onClose();
    else setIndex((i) => i + 1);
  }
  function goPrev() {
    if (index > 0) {
      setIndex((i) => i - 1);
      return;
    }
    // First story: restart from the beginning.
    setProgress(0);
    accumulatedRef.current = 0;
    startRef.current = Date.now();
    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0;
        v.play().catch(() => { });
      } catch {
        /* ignore */
      }
    }
  }

  async function handleReact(emoji: string) {
    setEmojiBurst({ emoji, key: Date.now() });
    if (!auth.isAuthenticated) {
      auth.openAuthModal();
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await reactMut({ id: current._id as any, emoji });
    } catch {
      /* ignore */
    }
  }

  // Swipe-up to show reactions / swipe-down to close
  const touchStartY = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) onClose();
    touchStartY.current = null;
  }

  if (typeof document === "undefined" || !current) return null;

  const align = current.captionStyle?.align ?? "bottom";
  // Hide all chrome (progress dots, avatar, caption, reactions) while the
  // video is buffering — only the loader + close button stay visible.
  const showChrome = !(loading && isVideo);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-0 z-[120] bg-black flex flex-col select-none"
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Top bar: progress dots + close. While the video is buffering we
            only render the close button so the user can still escape. */}
        <div className="absolute z-1 top-0 h-120 bg-gradient-to-b from-black/80 via-black/5 to-transparent w-full pointer-events-none">

        </div>
        <div
          className="absolute inset-x-0 top-0 z-20 px-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}
        >
          {showChrome && (
            <div className="flex gap-1">
              {stories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white"
                    style={{
                      width:
                        i < index
                          ? "100%"
                          : i === index
                            ? `${progress * 100}%`
                            : "0%",
                      transition: i === index ? "none" : "width 0.15s",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div
            className={`flex items-center ${showChrome ? "justify-between mt-3" : "justify-end"} px-1`}
          >
            {showChrome && (
              <div className="relative z-10 flex items-center gap-2">
                <div className="relative size-8 rounded-full overflow-hidden bg-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/avatar.png"
                    alt=""
                    className="absolute inset-0 size-full object-cover bg-[var(--color-yellow-300)]"
                  />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display font-medium text-[13px] text-white">
                    Huan
                  </span>
                  <span className="text-[11px] text-white/70">
                    {timeAgo(current.createdAt)}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-full bg-white/15 text-white"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Media */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          // Tap left = back, tap right = next; hold = pause
          onPointerDown={() => setPaused(true)}
          onPointerUp={(e) => {
            setPaused(false);
            const w = (e.currentTarget as HTMLElement).clientWidth;
            const x = e.clientX;
            if (x < w * 0.35) goPrev();
            else if (x > w * 0.65) goNext();
          }}
          onPointerLeave={() => setPaused(false)}
        >
          {current.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={toProxyUrl(current.url)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={toProxyUrl(current.url)}
              autoPlay
              playsInline
              // iOS older Safari needs this exact attr
              // @ts-expect-error — non-standard but harmless
              webkit-playsinline="true"
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
              onCanPlay={(e) => {
                setLoading(false);
                if (!paused) {
                  const v = e.currentTarget;
                  v.play().catch(() => {
                    // Autoplay with sound blocked → fall back to muted so
                    // playback never stalls on the native play overlay.
                    v.muted = true;
                    v.play().catch(() => {});
                  });
                }
              }}
              onLoadedData={(e) => {
                if (!paused) e.currentTarget.play().catch(() => {});
              }}
              onWaiting={() => setLoading(true)}
              onEnded={goNext}
            />
          )}

          {/* Loader while video buffers */}
          {loading && isVideo && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <Icon name="svg-spinners:ring-resize" size={36} className="text-white/90" />
            </div>
          )}
        </div>

        {/* Caption + optional link chip. Colored backgrounds render chapados.
            Preto / branco mantêm o look translúcido + backdrop-blur. The
            link sits right below the caption, sharing the same alignment. */}
        {showChrome && (current.caption || current.link) && (() => {
          const captionRawBg = current.captionStyle?.bg ?? "rgba(0,0,0,0.5)";
          const captionBlur = isBlackOrWhiteBg(captionRawBg);
          const captionBg = captionBlur ? captionRawBg : stripHexAlpha(captionRawBg);
          const linkRawBg = current.link?.bg ?? "rgba(0,0,0,0.5)";
          const linkBlur = isBlackOrWhiteBg(linkRawBg);
          const linkBg = linkBlur ? linkRawBg : stripHexAlpha(linkRawBg);
          return (
            <div
              className={`absolute inset-x-0 ${align === "center" ? "top-1/2 -translate-y-1/2" : ""} z-10 flex flex-col items-center gap-2 px-6 pointer-events-none`}
              style={
                align === "top"
                  ? { top: "calc(env(safe-area-inset-top) + 96px)" }
                  : align === "bottom"
                    ? { bottom: "calc(env(safe-area-inset-bottom) + 112px)" }
                    : undefined
              }
            >
              {current.caption && (
                <span
                  className={`inline-block font-display font-medium text-center px-3 py-1.5 rounded-lg max-w-[80%] leading-snug text-[18px] ${captionBlur ? "backdrop-blur-sm" : ""}`}
                  style={{
                    color: current.captionStyle?.color ?? "#FFFFFF",
                    backgroundColor: captionBg,
                  }}
                >
                  {current.caption}
                </span>
              )}
              {current.link && (
                <a
                  href={normalizeExternalUrl(current.link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    recordLinkClick({ id: current._id as any }).catch(() => {});
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className={`pointer-events-auto inline-flex items-center gap-2 max-w-[80%] font-display font-medium px-3 py-1.5 rounded-full text-[15px] ${linkBlur ? "backdrop-blur-sm" : ""}`}
                  style={{
                    color: current.link.color ?? "#FFFFFF",
                    backgroundColor: linkBg,
                  }}
                >
                  <Icon name="link" size={14} />
                  <span className="truncate">{current.link.label}</span>
                </a>
              )}
            </div>
          );
        })()}

        {/* Reactions row at bottom */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 px-5 pb-4 ${showChrome ? "" : "hidden"}`}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        >
          <div className="flex items-center justify-center gap-3 rounded-full bg-white/15 backdrop-blur-md px-3 py-2.5">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="text-[22px] active:scale-90 transition-transform"
                aria-label={`Reagir com ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji rain burst */}
        <AnimatePresence>
          {emojiBurst && (
            <EmojiBurst
              key={emojiBurst.key}
              emoji={emojiBurst.emoji}
              onDone={() => setEmojiBurst(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function EmojiBurst({
  emoji,
  onDone,
}: {
  emoji: string;
  onDone: () => void;
}) {
  const count = 18;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        leftPct: 20 + Math.random() * 60,
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 1.0,
        size: 22 + Math.floor(Math.random() * 22),
        rotate: Math.random() * 60 - 30,
      })),
    [emoji],
  );

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[130]">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "100vh", rotate: 0, opacity: 0 }}
          animate={{
            y: "-20vh",
            rotate: p.rotate,
            opacity: [0, 1, 1, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: "absolute",
            left: `${p.leftPct}vw`,
            fontSize: p.size,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Returns true when the bg value resolves to pure black or pure white,
 * regardless of optional alpha. `#000`, `#000000`, `#00000080`,
 * `rgba(0,0,0,0.5)` and the white equivalents all match.
 */
function isBlackOrWhiteBg(bg: string): boolean {
  const s = bg.trim().toLowerCase();
  if (s.startsWith("#")) {
    const hex = s.replace("#", "");
    const base =
      hex.length === 3 || hex.length === 4
        ? hex.slice(0, 3).split("").map((c) => c + c).join("")
        : hex.slice(0, 6);
    return base === "000000" || base === "ffffff";
  }
  // rgb(a)
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return false;
  const r = +m[1], g = +m[2], b = +m[3];
  return (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
}

/**
 * Strip the optional alpha from a hex color so the user-picked color
 * renders chapado (e.g. `#FF5733A0` → `#FF5733`). Non-hex inputs pass through.
 */
function stripHexAlpha(bg: string): string {
  const s = bg.trim();
  if (!s.startsWith("#")) return s;
  if (s.length === 9) return s.slice(0, 7);
  if (s.length === 5) return s.slice(0, 4);
  return s;
}

/**
 * Ensure URLs typed without a protocol (e.g. `google.com`, `www.google.com`)
 * are treated as external links instead of being resolved against the current
 * origin. http(s):// and other valid schemes pass through untouched.
 */
function normalizeExternalUrl(url: string): string {
  const s = url.trim();
  if (!s) return s;
  if (/^[a-z][a-z0-9+\-.]*:/i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}
