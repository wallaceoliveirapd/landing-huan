"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";

type Props = { restaurantId: Id<"restaurants"> };

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/**
 * Star input, 1..5 stars, controlled by a number value.
 */
function StarPicker({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            className="grid place-items-center"
          >
            <Icon
              name="star"
              size={size}
              className={
                filled
                  ? "text-[var(--color-brand-yellow)] fill-[var(--color-brand-yellow)]"
                  : "text-[var(--color-neutral-300)] fill-transparent"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

function StaticStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          className={
            n <= rating
              ? "text-[var(--color-brand-yellow)] fill-[var(--color-brand-yellow)]"
              : "text-[var(--color-neutral-300)] fill-transparent"
          }
        />
      ))}
    </span>
  );
}

export function RestaurantReviews({ restaurantId }: Props) {
  const auth = useAuth();
  const reviews = useQuery(api.reviews.listByRestaurant, { restaurantId });
  const myReview = useQuery(api.reviews.myReview, { restaurantId });
  const aggregate = useQuery(api.reviews.aggregateForRestaurant, { restaurantId });
  const upsertReview = useMutation(api.reviews.upsert);
  const removeReview = useMutation(api.reviews.remove);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form when myReview arrives
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    } else if (myReview === null) {
      // user has no review yet, keep empty
      setRating(0);
      setComment("");
    }
  }, [myReview]);

  const reviewsLoading = reviews === undefined;
  const myReviewLoading = myReview === undefined;
  const aggLoading = aggregate === undefined;

  async function handleSubmit() {
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await upsertReview({
        restaurantId,
        rating,
        comment: comment.trim() || undefined,
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir sua avaliação?")) return;
    setSubmitting(true);
    try {
      await removeReview({ restaurantId });
      setRating(0);
      setComment("");
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Empty / loading guard ───────────────────────────────────────────
  return (
    <section className="px-6 pt-8 w-full max-w-screen-md mx-auto pb-20">
      <div className="flex items-end justify-between mb-3">
        <h2 className="font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
          Avaliações
        </h2>
        {aggLoading ? (
          <div className="h-4 w-24 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
        ) : aggregate.total > 0 ? (
          <div className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-neutral-700)]">
            <Icon
              name="star"
              size={14}
              className="text-[var(--color-brand-yellow)] fill-[var(--color-brand-yellow)]"
            />
            <span className="font-medium">{aggregate.avg!.toFixed(1)}</span>
            <span className="text-[var(--color-neutral-500)]">
              · {aggregate.total} {aggregate.total === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Authoring (logged users) ────────────────────────────────── */}
      {!auth.isLoading && !auth.isAuthenticated && (
        <div className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 flex items-center justify-between gap-3 mb-4">
          <p className="text-[13px] text-[var(--color-neutral-700)] flex-1">
            Entre na sua conta pra avaliar este restaurante.
          </p>
          <button
            type="button"
            onClick={() => auth.openAuthModal()}
            className="shrink-0 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium px-4 py-2"
          >
            Entrar
          </button>
        </div>
      )}

      {auth.isAuthenticated && (
        <div className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 mb-4">
          {myReviewLoading ? (
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-[var(--color-neutral-100)] animate-pulse" />
              <div className="h-7 w-40 rounded bg-[var(--color-neutral-100)] animate-pulse" />
            </div>
          ) : myReview && !editing ? (
            // Existing review, read view
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
                  Sua avaliação
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-[12px] font-medium text-[var(--color-neutral-700)] underline underline-offset-2"
                  >
                    Editar
                  </button>
                  <span className="text-[var(--color-neutral-300)]">·</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="text-[12px] font-medium text-red-600 underline underline-offset-2 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <StaticStars rating={myReview.rating} size={20} />
              {myReview.comment && (
                <p className="text-[14px] leading-[1.55] text-[var(--color-neutral-700)] mt-1">
                  {myReview.comment}
                </p>
              )}
            </div>
          ) : (
            // Edit / create form
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
                {myReview ? "Editar sua avaliação" : "Avalie este restaurante"}
              </span>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte como foi sua experiência (opcional)"
                rows={3}
                maxLength={1000}
                className="w-full rounded-[12px] border border-[var(--color-neutral-300)] px-3 py-2 text-[14px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] resize-none"
              />
              <p className="text-[11px] text-[var(--color-neutral-500)] text-right">
                {comment.length}/1000
              </p>
              {error && (
                <p className="text-[12px] text-red-600">{error}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || rating < 1}
                  className="h-10 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium disabled:opacity-40"
                >
                  {submitting ? "Enviando…" : myReview ? "Salvar alterações" : "Publicar"}
                </button>
                {myReview && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setRating(myReview.rating);
                      setComment(myReview.comment ?? "");
                    }}
                    disabled={submitting}
                    className="h-10 px-4 rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] text-[13px] font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reviews list ───────────────────────────────────────────────── */}
      {reviewsLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 flex flex-col gap-2 animate-pulse"
            >
              <div className="h-3 w-32 rounded bg-[var(--color-neutral-100)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-neutral-100)]" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-[13px] text-[var(--color-neutral-600)] py-8 text-center">
          Nenhuma avaliação por aqui ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
                  {r.authorName}
                </span>
                <span className="text-[11px] text-[var(--color-neutral-500)]">
                  {fmtDate(r.createdAt)}
                </span>
              </div>
              <StaticStars rating={r.rating} />
              {r.comment && (
                <p className="text-[14px] leading-[1.55] text-[var(--color-neutral-700)] mt-1 whitespace-pre-line">
                  {r.comment}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
