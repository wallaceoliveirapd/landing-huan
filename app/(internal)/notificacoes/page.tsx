"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { staggerChildren, fadeUp } from "@/lib/motion-presets";

/** Map of `kind` → header icon + accent color. */
const KIND_META: Record<string, { icon: string; color: string; label: string }> = {
  broadcast: { icon: "megaphone", color: "#F9FD17", label: "Aviso" },
  trip: { icon: "map", color: "#2563EB", label: "Viagem" },
  welcome: { icon: "sparkles", color: "#F9FD17", label: "Bem-vindo" },
  system: { icon: "info", color: "#72777f", label: "Sistema" },
};

function fmtTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificacoesInboxPage() {
  const router = useRouter();
  const auth = useAuth();
  const notifications = useQuery(api.notifications.myNotifications, { limit: 100 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  const loading = notifications === undefined;
  const list = notifications ?? [];
  const hasUnread = list.some((n) => !n.read);

  async function handleClickNotification(id: Id<"userNotifications">, url: string | undefined, isRead: boolean) {
    if (!isRead) {
      // Optimistic — Convex reactivity updates UI in ms. Failures are
      // non-blocking but logged.
      markRead({ id }).catch((err) => {
        console.error("[notifications.markRead] failed", err);
      });
    }
    if (url) router.push(url);
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren(0.06, 0.04)}
      className="min-h-screen bg-white pb-32"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
        >
          <Icon name="arrow-left" size={18} className="text-[var(--color-neutral-800)]" />
        </button>
        <span className="font-display font-medium text-[16px] text-[var(--color-neutral-800)] flex-1">
          Notificações
        </span>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllRead({})}
            className="text-[13px] font-medium text-[var(--color-neutral-700)]"
          >
            Marcar tudo lido
          </button>
        )}
      </div>

      <motion.div variants={fadeUp} className="px-6 pt-4 pb-2">
        <p className="text-[14px] text-[var(--color-neutral-600)]">
          Aqui aparecem os avisos do Huan, atualizações das suas viagens e mensagens do sistema.
        </p>
      </motion.div>

      {/* List */}
      <div className="px-4 pt-2 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-[16px] bg-[var(--color-neutral-100)]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Icon name="bell-off" size={48} className="text-[var(--color-neutral-400)]" />
            <p className="font-display font-medium text-[15px] text-[var(--color-neutral-800)]">
              Nenhuma notificação ainda
            </p>
            <p className="text-[13px] text-[var(--color-neutral-600)] max-w-[280px]">
              Quando algo acontecer — viagem pronta, novo cupom, aviso — vai cair aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((n) => {
              const meta = KIND_META[n.kind] ?? KIND_META.system;
              const Inner = (
                <div
                  className={`relative flex gap-3 w-full rounded-[16px] border bg-white p-4 transition-colors ${
                    n.read
                      ? "border-[var(--color-neutral-200)]"
                      : "border-[var(--color-neutral-800)]"
                  }`}
                >
                  {!n.read && (
                    <span
                      aria-hidden
                      className="absolute top-3 right-3 size-2 rounded-full bg-red-500"
                    />
                  )}
                  <div
                    className="grid size-10 place-items-center rounded-full shrink-0"
                    style={{ backgroundColor: `${meta.color}22` }}
                  >
                    <Icon
                      name={meta.icon}
                      size={18}
                      className="text-[var(--color-neutral-800)]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-medium uppercase tracking-wide"
                        style={{ color: meta.color === "#F9FD17" ? "#a16207" : meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-neutral-500)]">
                        · {fmtTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="font-display font-medium text-[14px] leading-[1.3] text-[var(--color-neutral-800)]">
                      {n.title}
                    </p>
                    <p className="text-[13px] leading-[1.45] text-[var(--color-neutral-600)] mt-0.5">
                      {n.body}
                    </p>
                  </div>
                  {n.url && (
                    <Icon
                      name="chevron-right"
                      size={14}
                      className="text-[var(--color-neutral-500)] shrink-0 self-center"
                    />
                  )}
                </div>
              );

              if (n.url) {
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleClickNotification(n._id, n.url, n.read)}
                    className="text-left"
                  >
                    {Inner}
                  </button>
                );
              }
              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleClickNotification(n._id, undefined, n.read)}
                  className="text-left"
                >
                  {Inner}
                </button>
              );
            })}

            {/* Settings shortcut */}
            <Link
              href="/perfil/notificacoes"
              className="mt-4 mb-4 flex items-center justify-center gap-2 text-[13px] text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] transition-colors"
            >
              <Icon name="settings" size={14} />
              Preferências de notificação
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
