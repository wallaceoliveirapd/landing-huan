"use client";

import * as React from "react";

interface AiLoaderProps {
  size?: number;
  text?: string;
}

/**
 * Fullscreen loading overlay shown while the NordestAI is generating an
 * itinerary. Yellow brand gradient + concentric glowing ring that rotates
 * while each letter of the text pulses sequentially.
 *
 * Adapted from a generic AI-loader pattern, tinted to match HUAN's brand
 * (yellow `#F9FD17` + dark ink for legibility).
 */
export const AiLoader: React.FC<AiLoaderProps> = ({
  size = 200,
  text = "Montando seu roteiro",
}) => {
  const letters = text.split("");

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-12"
      style={{
        background:
          "radial-gradient(ellipse at center, #fffbcc 0%, #fde047 45%, #facc15 80%, #ca8a04 100%)",
      }}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {/* Rotating ring */}
      <div
        className="relative flex items-center justify-center font-display select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-[var(--color-neutral-800)] opacity-30 animate-loaderLetter font-medium"
            style={{
              animationDelay: `${index * 0.07}s`,
              fontSize: Math.max(13, size / 13),
            }}
          >
            {letter === " " ? " " : letter}
          </span>
        ))}

        <div className="absolute inset-0 rounded-full animate-loaderCircle" />
      </div>

      {/* Subtitle hint */}
      <p className="text-[13px] font-medium text-[var(--color-neutral-700)] tracking-wide animate-pulse">
        Isso pode levar alguns segundos…
      </p>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #fde047 inset,
              0 12px 18px 0 #facc15 inset,
              0 36px 36px 0 #ca8a04 inset,
              0 0 3px 1.2px rgba(202, 138, 4, 0.35),
              0 0 12px 2px rgba(250, 204, 21, 0.3);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #facc15 inset,
              0 12px 6px 0 #eab308 inset,
              0 24px 36px 0 #a16207 inset,
              0 0 3px 1.2px rgba(202, 138, 4, 0.35),
              0 0 12px 2px rgba(250, 204, 21, 0.3);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #fde047 inset,
              0 12px 18px 0 #facc15 inset,
              0 36px 36px 0 #ca8a04 inset,
              0 0 3px 1.2px rgba(202, 138, 4, 0.35),
              0 0 12px 2px rgba(250, 204, 21, 0.3);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.18);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 5s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 3s infinite;
        }
      `}</style>
    </div>
  );
};
