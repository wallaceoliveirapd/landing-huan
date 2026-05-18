"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { useChat } from "@/components/providers/ChatProvider";
import { cn } from "@/lib/cn";

type Item =
  | { kind: "link"; href: string; icon: string; label: string; requiresAuth?: boolean }
  | { kind: "chat"; icon: string; label: string };

function tourSlug(href: string): string | undefined {
  if (href === "/") return "home";
  if (href === "/favoritos") return "favorites";
  if (href === "/perfil") return "profile";
  return undefined;
}

const ITEMS: Item[] = [
  { kind: "link", href: "/",          icon: "home",     label: "Início" },
  { kind: "link", href: "/favoritos", icon: "heart",    label: "Favoritos", requiresAuth: true },
  { kind: "chat",                     icon: "sparkles", label: "NordestAI" },
  { kind: "link", href: "/perfil",    icon: "user",     label: "Perfil",    requiresAuth: true },
];

/**
 * Floating pill bottom navigation, Voyage style.
 * White pill with shadow, 4 items. Active item has a black circle
 * background. NordestAI is one of the items and opens the chat panel,
 * showing a tooltip periodically.
 */
export function BottomNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const chat = useChat();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // ── NordestAI tooltip schedule ─────────────────────────────────────────
  // Behavior:
  //   - First page visit  → opens 2.5s after mount, stays 5s.
  //   - Every visit after → opens 4s after mount, stays 5s, then every 30s.
  // This makes the assistant feel present without being intrusive.
  useEffect(() => {
    let intervalId: number | null = null;
    let hideTimer: number | null = null;

    function showOnce(durationMs: number) {
      setTooltipOpen(true);
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setTooltipOpen(false), durationMs);
    }

    const firstSeenKey = "nordestai-tooltip-seen";
    const seen =
      typeof window !== "undefined" &&
      localStorage.getItem(firstSeenKey) === "1";

    const firstDelay = seen ? 4000 : 2500;
    const firstTimer = window.setTimeout(() => {
      showOnce(5000);
      if (!seen) {
        try { localStorage.setItem(firstSeenKey, "1"); } catch {}
      }
      // Then keep nudging the user every 30s
      intervalId = window.setInterval(() => showOnce(5000), 30_000);
    }, firstDelay);

    return () => {
      window.clearTimeout(firstTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, []);

  if (pathname.startsWith("/minha-viagem/criar")) return null;
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/offline") return null;
  // Hide on detail pages (they have a back button in the hero).
  // Pattern: /{section}/{slug} where section is a detail category.
  const DETAIL_SECTIONS = [
    "passeios",
    "restaurantes",
    "praias",
    "dicas",
    "vida-noturna",
    "roteiros",
    "hospedagem",
  ];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2 && DETAIL_SECTIONS.includes(segments[0])) {
    return null;
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full bg-white py-2 px-2"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {ITEMS.map((item) => {
          if (item.kind === "chat") {
            return (
              <NordestAIButton
                key="chat"
                tooltipOpen={tooltipOpen}
                onClick={() => {
                  setTooltipOpen(false);
                  chat.requestOpen();
                }}
              />
            );
          }

          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const requiresAuth = "requiresAuth" in item && item.requiresAuth;

          function handleClick(e: React.MouseEvent) {
            if (requiresAuth && !auth.isAuthenticated) {
              e.preventDefault();
              auth.openAuthModal();
            }
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              aria-label={item.label}
              data-tour={tourSlug(item.href)}
              className="relative grid place-items-center size-12 rounded-full"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[var(--color-neutral-800)]"
                />
              )}
              <Icon
                name={item.icon}
                size={22}
                className={cn(
                  "relative",
                  isActive ? "text-white" : "text-[var(--color-neutral-800)]"
                )}
              />
            </Link>
          );
        })}
      </div>

    </nav>
  );
}

/** Animated NordestAI button, sparkle icon with ping ring + tooltip */
function NordestAIButton({
  tooltipOpen,
  onClick,
}: {
  tooltipOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      {/* Tooltip, rendered ABOVE the pill, with high z-index and pointer-
          events-none so it doesn't block clicks on the nav. */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            role="tooltip"
            className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            style={{ bottom: "calc(100% + 14px)" }}
          >
            <div className="relative bg-[var(--color-neutral-800)] text-white rounded-2xl px-4 py-2.5 text-[12px] leading-[1.25] whitespace-nowrap font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              Sou o Huan, seu agente de viagem!
              {/* Pointing arrow */}
              <span
                aria-hidden
                className="absolute size-3 rotate-45 bg-[var(--color-neutral-800)]"
                style={{
                  bottom: -5,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: tooltipOpen ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative grid place-items-center size-12 rounded-full bg-[var(--color-brand-yellow)] overflow-hidden"
        aria-label="NordestAI"
        data-tour="huan"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[var(--color-brand-yellow)] opacity-50 animate-ping"
          style={{ animationDuration: "2.5s" }}
        />
        <motion.span
          animate={{ rotate: tooltipOpen ? [0, -10, 12, -6, 0] : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="relative size-12"
        >
          <Image
            src="/images/avatar.png"
            alt="NordestAI"
            fill
            sizes="48px"
            className="object-cover"
            priority
          />
        </motion.span>
      </motion.button>
    </div>
  );
}
