"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

const COLORS = [
  "#F9FD17", // brand yellow
  "#6c47ff", // brand purple
  "#028574", // success green
  "#EA580C", // orange
  "#2563EB", // blue
  "#EC4899", // pink
];

type Piece = {
  id: number;
  left: number; // 0..100 (vw)
  delay: number; // s
  duration: number; // s
  rotate: number; // deg
  color: string;
  size: number; // px
};

/**
 * Lightweight confetti burst. Renders N absolutely-positioned squares
 * that fall from the top with random horizontal drift + rotation, then
 * fades out. No external library required.
 */
export function Confetti({ count = 80, active = true }: { count?: number; active?: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    const list: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 2.5 + Math.random() * 2,
      rotate: Math.random() * 720 - 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.floor(Math.random() * 8),
    }));
    setPieces(list);
  }, [active, count]);

  if (!active || pieces.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            y: "-10vh",
            x: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            x: (Math.random() - 0.5) * 200,
            rotate: p.rotate,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 0.84, 0.44, 1],
          }}
          style={{
            position: "absolute",
            left: `${p.left}vw`,
            top: 0,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
