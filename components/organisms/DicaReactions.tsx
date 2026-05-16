"use client";

import { motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/providers/AuthProvider";
import { logAndGetMessage } from "@/lib/errors";

const REACTIONS = [
  { key: "like", emoji: "👍", label: "Curti" },
  { key: "love", emoji: "❤️", label: "Amei" },
  { key: "wow", emoji: "😮", label: "Uau" },
  { key: "fire", emoji: "🔥", label: "Top demais" },
] as const;

/**
 * Reaction bar for dicas — 4 emoji buttons.
 * Tapping again removes; tapping a different one switches.
 */
export function DicaReactions({ dicaId }: { dicaId: Id<"dicas"> }) {
  const auth = useAuth();
  const data = useQuery(api.reactions.forDica, { dicaId });
  const toggle = useMutation(api.reactions.toggle);

  const loading = data === undefined;

  async function handleClick(reaction: string) {
    if (!auth.requireAuth()) return;
    // Optimistic UI is tricky with Convex's reactive updates — just await
    // the mutation. Convex will re-render with the new state in ~ms.
    try {
      await toggle({ dicaId, reaction });
    } catch (err) {
      toast.error(logAndGetMessage("dica.reaction", err, "Não consegui registrar sua reação."));
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map((r) => {
        const count = data?.counts[r.key] ?? 0;
        const active = data?.myReaction === r.key;
        return (
          <motion.button
            key={r.key}
            type="button"
            onClick={() => handleClick(r.key)}
            whileTap={{ scale: 0.9 }}
            animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            aria-label={r.label}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-[var(--color-neutral-800)] text-white"
                : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-200)]"
            }`}
          >
            <span className="text-[15px] leading-none" aria-hidden>
              {r.emoji}
            </span>
            {loading ? (
              <span
                className="inline-block w-4 h-3 rounded-full bg-white/40 animate-pulse"
                aria-hidden
              />
            ) : (
              <span className="leading-none">{count}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
