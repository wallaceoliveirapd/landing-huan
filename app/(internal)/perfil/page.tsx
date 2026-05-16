"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";
import { TripCard, TripCardSkeleton } from "@/components/organisms/TripCard";
import { HorizontalCarousel } from "@/components/organisms/HorizontalCarousel";

const SETTINGS_ITEMS = [
  { icon: "user-circle",  label: "Informações pessoais", href: "/perfil/informacoes-pessoais" },
  { icon: "map",          label: "Minhas viagens",        href: "/perfil/viagens" },
  { icon: "heart",        label: "Favoritos",             href: "/perfil/favoritos", showCounter: true },
  { icon: "bell",         label: "Notificações",          href: "/perfil/notificacoes" },
  { icon: "shield",       label: "Login e segurança",      href: "/perfil/seguranca" },
  { icon: "globe",        label: "Idioma e região",       href: "/perfil/idioma" },
  { icon: "lock-keyhole", label: "Privacidade",           href: "/perfil/privacidade" },
];

export default function PerfilPage() {
  const auth = useAuth();
  const viewer = useQuery(api.users.viewer);
  const trips = useQuery(api.trips.myTrips);
  const favoriteIds = useQuery(api.favorites.myFavoriteIds);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6">
        <Icon name="lock-keyhole" size={48} className="text-[var(--color-neutral-400)]" />
        <p className="text-[16px] font-medium text-[var(--color-neutral-800)]">
          Faça login para ver seu perfil
        </p>
        <button
          type="button"
          onClick={auth.openAuthModal}
          className="rounded-full bg-[var(--color-neutral-800)] px-6 py-3 font-medium text-[14px] text-white"
        >
          Entrar / Criar conta
        </button>
      </div>
    );
  }

  // Skeleton-first: never read with `?? defaultValue`. Render skeletons
  // until the underlying query resolves.
  const viewerLoading = viewer === undefined;
  const tripsLoading = trips === undefined;
  const favoritesLoading = favoriteIds === undefined;

  const userName =
    (viewer as { name?: string; email?: string } | null)?.name?.trim() ||
    (viewer as { email?: string } | null)?.email?.split("@")[0] ||
    "Viajante";
  const userEmail = (viewer as { email?: string } | null)?.email ?? "";
  const initial = userName[0]?.toUpperCase() ?? "?";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.07, 0.05)}
      className="min-h-screen bg-white pb-32"
    >
      {/* ── Header: title + sign out ─────────────────────────────── */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Perfil
        </h1>
        <button
          type="button"
          onClick={auth.signOut}
          className="font-display font-medium text-[14px] text-[var(--color-success-500)]"
        >
          Sair
        </button>
      </div>

      {/* ── Profile row ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-6 pb-6 flex items-center gap-4">
        {viewerLoading ? (
          <div className="size-14 rounded-full bg-[var(--color-neutral-100)] shrink-0 animate-pulse" />
        ) : (
          <div className="grid size-14 place-items-center rounded-full bg-[var(--color-neutral-100)] font-display font-medium text-[20px] text-[var(--color-neutral-800)] shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {viewerLoading ? (
            <>
              <div className="h-4 w-32 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
              <div className="h-3 w-40 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
            </>
          ) : (
            <>
              <p className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] truncate">
                {userName}
              </p>
              <p className="text-[13px] text-[var(--color-neutral-600)] truncate">
                {userEmail}
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Trips carousel — skeleton-first ──────────────────────── */}
      <motion.div variants={fadeUp} className="pb-6">
        <div className="px-6 mb-3 flex items-center justify-between">
          <h2 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
            Minhas viagens
          </h2>
          {!tripsLoading && trips && trips.length > 0 && (
            <Link
              href="/perfil/viagens"
              className="text-[12px] font-medium text-[var(--color-neutral-600)]"
            >
              Ver todas
            </Link>
          )}
        </div>

        {tripsLoading ? (
          <div className="px-6">
            <HorizontalCarousel>
              <TripCardSkeleton />
              <TripCardSkeleton />
            </HorizontalCarousel>
          </div>
        ) : trips && trips.length > 0 ? (
          <div className="px-6">
            <HorizontalCarousel>
              {trips.map((t) => (
                <TripCard key={t._id} trip={t} />
              ))}
              {/* "Add new" trailing card */}
              <Link
                href="/minha-viagem/criar"
                className="relative flex-none overflow-hidden rounded-[24px] border-2 border-dashed border-[var(--color-neutral-300)] bg-white hover:border-[var(--color-neutral-800)] transition-colors flex flex-col items-center justify-center gap-3 w-[min(80vw,280px)]"
                style={{ aspectRatio: "4/5" }}
              >
                <div className="grid size-12 place-items-center rounded-full border border-[var(--color-neutral-300)]">
                  <Icon name="plus" size={22} className="text-[var(--color-neutral-800)]" />
                </div>
                <p className="font-display font-medium text-[13px] text-[var(--color-neutral-600)] text-center px-4">
                  Nova viagem
                </p>
              </Link>
            </HorizontalCarousel>
          </div>
        ) : (
          // No trips — single create CTA
          <div className="px-6">
            <Link
              href="/minha-viagem/criar"
              className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-300)] bg-white hover:border-[var(--color-neutral-800)] transition-colors"
            >
              <div className="grid size-10 place-items-center rounded-full border border-[var(--color-neutral-200)]">
                <Icon name="plus" size={18} className="text-[var(--color-neutral-800)]" />
              </div>
              <div className="flex-1">
                <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                  Criar nova viagem
                </p>
                <p className="text-[12px] text-[var(--color-neutral-600)]">
                  Monte seu próximo roteiro no Nordeste
                </p>
              </div>
              <Icon name="chevron-right" size={16} className="text-[var(--color-neutral-600)]" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Settings list — heading w/ better visual hierarchy ──── */}
      <motion.div variants={fadeUp} className="px-6 pt-2">
        <h2 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)] mb-4">
          Configurações da conta
        </h2>
        <div className="flex flex-col">
          {SETTINGS_ITEMS.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className={`flex items-center gap-4 px-1 py-4 transition-colors ${
                i !== SETTINGS_ITEMS.length - 1
                  ? "border-b border-[var(--color-neutral-100)]"
                  : ""
              }`}
            >
              <Icon name={s.icon} size={20} className="text-[var(--color-neutral-800)] shrink-0" />
              <span className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                {s.label}
              </span>
              {s.showCounter && (
                favoritesLoading ? (
                  <span className="h-3 w-5 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
                ) : (
                  <span className="text-[12px] font-medium text-[var(--color-neutral-600)]">
                    {favoriteIds!.length}
                  </span>
                )
              )}
              <Icon name="chevron-right" size={16} className="text-[var(--color-neutral-500)]" />
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
