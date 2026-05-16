"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { toProxyUrl } from "@/lib/imageUpload";

const KIND_COLOR: Record<string, string> = {
  tour: "#2563EB",
  restaurant: "#EA580C",
  dica: "#CA8A04",
  praia: "#0891B2",
  nightlife: "#7C3AED",
  hosting: "#0D9488",
  itinerary: "#16A34A",
  coupon: "#028574",
};

const KIND_LABEL: Record<string, string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  dica: "Dica",
  praia: "Praia",
  nightlife: "Vida noturna",
  hosting: "Hospedagem",
  itinerary: "Roteiro",
  coupon: "Cupom",
};

export default function FavoritosPage() {
  const auth = useAuth();
  const favorites = useQuery(api.favorites.myFavoritesWithItems);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  return (
    <SettingsLayout
      title="Favoritos"
      subtitle="Lugares que você salvou pra rever depois."
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        {favorites === undefined && (
          <div className="flex flex-col gap-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[88px] rounded-[16px] bg-[var(--color-neutral-100)]" />
            ))}
          </div>
        )}

        {favorites !== undefined && favorites.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Icon name="heart" size={36} className="text-[var(--color-neutral-400)]" />
            <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
              Nenhum favorito ainda
            </p>
            <p className="text-[12px] text-[var(--color-neutral-600)] max-w-[260px]">
              Toque no ♥ dos cards da home para salvar aqui.
            </p>
          </div>
        )}

        {favorites?.map(({ fav, item }) => {
          const color = KIND_COLOR[fav.kind] ?? "#323439";
          const label = KIND_LABEL[fav.kind] ?? fav.kind;
          const title = (item?.title as string | undefined) ?? (item?.name as string | undefined) ?? "Item indisponível";
          const subtitle = (item?.shortDesc as string | undefined) ?? (item?.cuisine as string | undefined) ?? "";
          const image = toProxyUrl(((item?.image as string | undefined) ?? (item?.cover as string | undefined)) ?? "");
          const slug = item?.slug as string | undefined;
          const url = item?.url as string | undefined;
          const href = (() => {
            if (fav.kind === "tour" && url) return url;
            if (fav.kind === "restaurant" && slug) return `/restaurantes/${slug}`;
            if (fav.kind === "dica" && slug) return `/dicas/${slug}`;
            if (fav.kind === "praia" && slug) return `/praias/${slug}`;
            if (fav.kind === "nightlife" && slug) return `/vida-noturna/${slug}`;
            return "/perfil/favoritos";
          })();
          const isExternal = href.startsWith("http");

          const Card = (
            <div className="relative flex gap-3 w-full rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-3 hover:border-[var(--color-neutral-800)] transition-colors">
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[16px]"
                style={{ backgroundColor: color }}
              />
              <div className="ml-1 relative size-16 flex-none rounded-xl overflow-hidden bg-[var(--color-neutral-100)]">
                {image ? (
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center">
                    <Icon name="heart" size={18} className="text-[var(--color-neutral-400)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-medium uppercase tracking-wide"
                  style={{ color }}
                >
                  {label}
                </p>
                <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)] mt-0.5 line-clamp-2">
                  {title}
                </p>
                {subtitle && (
                  <p className="text-[12px] text-[var(--color-neutral-600)] line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
              <Icon
                name={isExternal ? "external-link" : "chevron-right"}
                size={14}
                className="text-[var(--color-neutral-500)] shrink-0 self-center"
              />
            </div>
          );

          return (
            <Link
              key={fav._id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
            >
              {Card}
            </Link>
          );
        })}
      </div>
    </SettingsLayout>
  );
}
