"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { BottomNavSpacer } from "@/components/atoms/BottomNavSpacer";

export type PlaceKind = "tour" | "restaurant" | "praia" | "nightlife";

const REACTIONS: { type: "like" | "love" | "wow" | "fire"; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "Curti" },
  { type: "love", emoji: "❤️", label: "Amei" },
  { type: "wow", emoji: "😮", label: "Uau" },
  { type: "fire", emoji: "🔥", label: "Top" },
];

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STAR_ON = "text-amber-500 fill-amber-500";
const STAR_OFF = "text-[var(--color-neutral-300)] fill-transparent";

function StarPicker({
  value,
  onChange,
  size = 28,
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
          <motion.button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="grid place-items-center"
          >
            <Icon name="star" size={size} className={filled ? STAR_ON : STAR_OFF} />
          </motion.button>
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
          className={n <= rating ? STAR_ON : STAR_OFF}
        />
      ))}
    </span>
  );
}

type Props = {
  kind: PlaceKind;
  itemId: string;
  /** Heading label, e.g. "este passeio", "esta praia". Defaults to "este lugar". */
  noun?: string;
};

export function PlaceReviewsSection({ kind, itemId, noun = "este lugar" }: Props) {
  const auth = useAuth();
  const reviews = useQuery(api.placeReviews.listByItem, { kind, itemId });
  const myReview = useQuery(api.placeReviews.myReview, { kind, itemId });
  const aggregate = useQuery(api.placeReviews.aggregateForItem, { kind, itemId });
  const reactions = useQuery(api.placeReactions.forItem, { kind, itemId });
  const submitReview = useAction(api.placeReviews.submitReview);
  const removeReview = useMutation(api.placeReviews.remove);
  const toggleReaction = useMutation(api.placeReactions.toggle);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? "");
    } else if (myReview === null) {
      setRating(0);
      setComment("");
    }
  }, [myReview]);

  const reviewsLoading = reviews === undefined;
  const myReviewLoading = myReview === undefined;
  const aggLoading = aggregate === undefined;
  const reactionsLoading = reactions === undefined;

  async function handleSubmit() {
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await submitReview({
        kind,
        itemId,
        rating,
        comment: comment.trim() || undefined,
      });
      setEditing(false);
      if (result?.status === "pending") {
        setError("Avaliação enviada! Ela aparecerá após análise da moderação.");
      }
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
      await removeReview({ kind, itemId });
      setRating(0);
      setComment("");
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReaction(type: "like" | "love" | "wow" | "fire") {
    if (!auth.requireAuth()) return;
    void toggleReaction({ kind, itemId, reaction: type });
  }

  return (
    <section className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 pt-10 pb-8">
        <div className="w-full h-px mb-6 bg-[var(--color-neutral-300)]"></div>
        {/* ── Reactions bar (matches DicaReactions style) ───────────────── */}
        <div className="mb-6">
          <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)] mb-3">
            O que achou {noun.replace(/^este /, "deste ").replace(/^esta /, "dessa ").replace(/^esse /, "desse ")}?
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {REACTIONS.map((r) => {
              const count = reactions?.counts[r.type] ?? 0;
              const mine = reactions?.myReaction === r.type;
              return (
                <motion.button
                  key={r.type}
                  type="button"
                  onClick={() => handleReaction(r.type)}
                  disabled={reactionsLoading}
                  whileTap={{ scale: 0.9 }}
                  animate={mine ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  aria-label={r.label}
                  aria-pressed={mine}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${mine
                    ? "bg-[var(--color-neutral-800)] text-white"
                    : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-200)]"
                    } disabled:opacity-50`}
                >
                  <span className="text-[15px] leading-none" aria-hidden>
                    {r.emoji}
                  </span>
                  {reactionsLoading ? (
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
        </div>

        <div className="w-full h-px mb-6 bg-[var(--color-neutral-300)]"></div>

        {/* ── Header + aggregate ────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-3 pt-2">
          <h2 className="font-display font-medium text-[22px] text-[var(--color-neutral-800)]">
            Avaliações
          </h2>
          {aggLoading ? (
            <div className="h-4 w-24 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
          ) : aggregate.total > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-neutral-700)]">
              <Icon name="star" size={14} className={STAR_ON} />
              <span className="font-medium">{aggregate.avg!.toFixed(1)}</span>
              <span className="text-[var(--color-neutral-500)]">
                · {aggregate.total} {aggregate.total === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          ) : null}
        </div>

        {/* ── Logged-out CTA ────────────────────────────────────────────── */}
        {!auth.isLoading && !auth.isAuthenticated && (
          <div className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 flex items-center justify-between gap-3 mb-4">
            <p className="text-[13px] text-[var(--color-neutral-700)] flex-1">
              Entre na sua conta pra avaliar {noun}.
            </p>
            <button
              type="button"
              onClick={auth.openAuthModal}
              className="shrink-0 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium px-4 py-2"
            >
              Entrar
            </button>
          </div>
        )}

        {/* ── Authoring (logged in) ─────────────────────────────────────── */}
        {auth.isAuthenticated && (
          <div className="rounded-[16px] border border-[var(--color-neutral-200)] bg-white p-4 mb-4">
            {myReviewLoading ? (
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded bg-[var(--color-neutral-100)] animate-pulse" />
                <div className="h-7 w-40 rounded bg-[var(--color-neutral-100)] animate-pulse" />
              </div>
            ) : myReview && !editing ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
                      Sua avaliação
                    </span>
                    {myReview.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Icon name="clock" size={10} />
                        Aguardando análise
                      </span>
                    )}
                  </div>
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
              <div className="flex flex-col gap-3">
                <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
                  {myReview ? "Editar sua avaliação" : `Avalie ${noun}`}
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
                {error && <p className="text-[12px] text-red-600">{error}</p>}
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

        {/* ── Reviews list ──────────────────────────────────────────────── */}
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
            <AnimatePresence initial={false}>
              {reviews.map((r, i) => (
                <motion.div
                  key={r._id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28, delay: i * 0.04 }}
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
            </AnimatePresence>
          </div>
        )}
        <BottomNavSpacer />
      </div>
    </section>
  );
}
