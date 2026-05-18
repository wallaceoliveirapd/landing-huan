"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { toast } from "sonner";

const KIND_LABEL: Record<string, string> = {
  tour: "Passeio",
  restaurant: "Restaurante",
  praia: "Praia",
  nightlife: "Vida noturna",
};

const STAR_ON = "text-amber-500 fill-amber-500";
const STAR_OFF = "text-[var(--color-neutral-300)] fill-transparent";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={13} className={n <= rating ? STAR_ON : STAR_OFF} />
      ))}
    </span>
  );
}

export default function AvaliacoesPage() {
  const pending = useQuery(api.placeReviews.listPending);
  const moderate = useMutation(api.placeReviews.moderate);

  async function handle(reviewId: Id<"placeReviews">, decision: "approve" | "reject") {
    try {
      await moderate({ reviewId, decision });
      toast.success(decision === "approve" ? "Avaliação publicada." : "Avaliação rejeitada.");
    } catch {
      toast.error("Erro ao moderar.");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Avaliações pendentes
        </h1>
        <p className="text-[13px] text-[var(--color-neutral-600)] mt-1">
          Avaliações aguardando moderação (filtro automático ou Perspective API).
        </p>
      </div>

      {pending === undefined ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-[16px] bg-[var(--color-neutral-100)] animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="lucide:check-circle" size={40} className="text-emerald-500" />
          <p className="text-[15px] font-medium text-[var(--color-neutral-800)]">
            Nenhuma avaliação pendente
          </p>
          <p className="text-[13px] text-[var(--color-neutral-600)]">
            Tudo moderado por aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((r) => (
            <div
              key={r._id}
              className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
                      {KIND_LABEL[r.kind] ?? r.kind}
                    </span>
                    <span className="text-[11px] text-[var(--color-neutral-400)]">·</span>
                    <span className="text-[12px] font-medium text-[var(--color-neutral-700)] truncate max-w-[200px]">
                      {r.itemName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">
                      {r.authorName}
                    </span>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-[13px] text-[var(--color-neutral-700)] leading-[1.5] mt-1">
                      {r.comment}
                    </p>
                  )}
                  {r.moderationScore !== undefined && (
                    <p className="text-[11px] text-[var(--color-neutral-500)] mt-0.5">
                      Score Perspective:{" "}
                      <span className={r.moderationScore > 0.7 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                        {(r.moderationScore * 100).toFixed(0)}%
                      </span>
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--color-neutral-400)]">
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-[var(--color-neutral-100)]">
                <button
                  type="button"
                  onClick={() => handle(r._id, "approve")}
                  className="flex-1 h-9 rounded-full bg-emerald-600 text-white text-[13px] font-medium hover:bg-emerald-700 transition-colors"
                >
                  Publicar
                </button>
                <button
                  type="button"
                  onClick={() => handle(r._id, "reject")}
                  className="flex-1 h-9 rounded-full bg-white border border-red-300 text-red-600 text-[13px] font-medium hover:bg-red-50 transition-colors"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
