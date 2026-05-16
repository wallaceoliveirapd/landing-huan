"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/cn";
import { logAndGetMessage } from "@/lib/errors";
import { gtmAddToWishlist, gtmRemoveFromWishlist } from "@/lib/gtm";

type Props = {
  itemId: string;
  kind: string;
  className?: string;
  /** Size of the heart icon (default 22) */
  size?: number;
  /** GTM metadata — used for wishlist events */
  gtmName?: string;
  gtmCity?: string;
};

/**
 * Heart toggle. Uses Lucide heart icon — outlined when not favorited,
 * filled red when favorited. Requires auth — opens modal if not signed in.
 */
export function FavoriteButton({ itemId, kind, className, size = 22, gtmName, gtmCity }: Props) {
  const auth = useAuth();
  const favoriteIds = useQuery(api.favorites.myFavoriteIds) ?? [];
  const toggleFav = useMutation(api.favorites.toggle);
  const [pending, setPending] = useState(false);
  const [burst, setBurst] = useState(false);

  const isFav = favoriteIds.includes(itemId);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!auth.requireAuth()) return;
      if (pending) return;
      setPending(true);
      const willAdd = !isFav;
      try {
        await toggleFav({ itemId, kind });
        if (willAdd) {
          setBurst(true);
          setTimeout(() => setBurst(false), 600);
          if (gtmName) {
            gtmAddToWishlist({
              item_type: kind as "passeio" | "restaurante" | "dica" | "praia" | "nightlife" | "roteiro" | "hospedagem",
              item_id: itemId,
              item_name: gtmName,
              item_city: gtmCity ?? null,
            });
          }
        } else {
          if (gtmName) {
            gtmRemoveFromWishlist({
              item_type: kind as "passeio" | "restaurante" | "dica" | "praia" | "nightlife" | "roteiro" | "hospedagem",
              item_id: itemId,
              item_name: gtmName,
            });
          }
        }
      } catch (err) {
        toast.error(logAndGetMessage("favorite.toggle", err, "Não consegui salvar o favorito."));
      } finally {
        setPending(false);
      }
    },
    [auth, pending, isFav, toggleFav, itemId, kind, gtmName, gtmCity],
  );

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "relative grid place-items-center",
        pending && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {/* Burst ring */}
      <AnimatePresence>
        {burst && (
          <motion.span
            key="burst"
            initial={{ scale: 0.5, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-full bg-red-400 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={isFav ? { scale: [1, 1.25, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative grid place-items-center",
          isFav ? "text-red-500" : "text-[var(--color-neutral-800)]",
        )}
        style={isFav ? ({ fill: "currentColor" } as React.CSSProperties) : undefined}
      >
        <Icon name="heart" size={size} />
      </motion.span>
    </motion.button>
  );
}
