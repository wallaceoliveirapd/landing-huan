"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

/** Limit on the badge counter — anything above shows as "9+". */
const BADGE_MAX = 9;

/**
 * Top section — greeting line (avatar + "Oi, tudo bem? / Name or 'Entre…'")
 * + a small bell or login icon on the right.
 *
 * Skeleton-first: while auth state OR viewer query is still loading,
 * render placeholder skeletons instead of guessing initials or names.
 *
 * Matches Figma node 334:35950 (logged out) / 334:36739 (logged in).
 */
export function Header() {
  const auth = useAuth();
  const viewer = useQuery(api.users.viewer);
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    auth.isAuthenticated ? {} : "skip",
  );

  // Don't even try to render real content until we know both:
  //   - whether the user is authenticated
  //   - if authenticated, what their viewer doc looks like
  const loading =
    auth.isLoading || (auth.isAuthenticated && viewer === undefined);
  const badgeText =
    typeof unreadCount === "number"
      ? unreadCount > BADGE_MAX
        ? `${BADGE_MAX}+`
        : String(unreadCount)
      : null;

  const firstName =
    (viewer as { name?: string; email?: string } | null)?.name?.split(" ")[0] ||
    (viewer as { email?: string } | null)?.email?.split("@")[0];

  const initial = firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-screen-md items-center gap-2 px-6 pt-8">
        {/* Avatar — skeleton until we know auth state */}
        {loading ? (
          <div className="size-[42px] flex-none rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
        ) : auth.isAuthenticated && viewer ? (
          <Link
            href="/perfil"
            className="grid size-[42px] flex-none place-items-center rounded-full bg-[var(--color-brand-yellow)] font-display font-medium text-[16px] text-black"
          >
            {initial}
          </Link>
        ) : (
          <button
            type="button"
            onClick={auth.openAuthModal}
            className="grid size-[42px] flex-none place-items-center rounded-full bg-[var(--color-neutral-100)]"
            aria-label="Entrar"
          >
            <Icon name="user" size={22} className="text-[var(--color-neutral-600)]" />
          </button>
        )}

        {/* Greeting — skeleton until we know auth state */}
        <div className="flex flex-1 flex-col gap-[2px] min-w-0">
          <p className="font-display text-[12px] text-[var(--color-neutral-600)]">
            Oi, tudo bem?
          </p>
          {loading ? (
            <div className="h-4 w-36 rounded-full bg-[var(--color-neutral-100)] animate-pulse mt-0.5" />
          ) : auth.isAuthenticated && firstName ? (
            <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] truncate">
              {firstName}
            </p>
          ) : (
            <button
              type="button"
              onClick={auth.openAuthModal}
              className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] text-left"
            >
              Entre ou crie sua conta grátis
            </button>
          )}
        </div>

        {/* Right action — bell (logged) — skeleton while loading */}
        {loading ? (
          <div className="size-10 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
        ) : auth.isAuthenticated ? (
          <Link
            href="/notificacoes"
            aria-label={
              typeof unreadCount === "number" && unreadCount > 0 && badgeText
                ? `Notificações (${badgeText} não lida${unreadCount === 1 ? "" : "s"})`
                : "Notificações"
            }
            className="relative grid size-10 place-items-center rounded-full text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)] transition-colors"
          >
            <Icon name="bell" size={22} />
            {typeof unreadCount === "number" && unreadCount > 0 && badgeText && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium leading-none grid place-items-center"
              >
                {badgeText}
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
