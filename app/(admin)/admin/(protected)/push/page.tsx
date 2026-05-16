"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

const SEGMENTS = [
  { value: "all", label: "Todos os inscritos", desc: "Quem ativou notificações." },
  { value: "planning", label: "Planejando viagem", desc: "Tem ao menos 1 viagem com status planejando." },
  { value: "with-favorites", label: "Com favoritos", desc: "Tem pelo menos 1 favorito salvo." },
];

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPushPage() {
  const sendBroadcast = useAction(api.push.sendBroadcast);
  const history = useQuery(api.pushQueries.listBroadcasts, { limit: 20 });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ delivered: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError("Título e corpo são obrigatórios.");
      return;
    }
    if (!confirm(`Enviar para o segmento "${segment}"?`)) return;
    setSending(true);
    try {
      const r = await sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/",
        segment,
      });
      setResult(r);
      setTitle("");
      setBody("");
      setUrl("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Push notifications
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
          Envie avisos para usuários que ativaram notificações no navegador.
        </p>
      </header>

      {/* Form */}
      <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-6 mb-6">
        <h2 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)] mb-4">
          Nova notificação
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">Título</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={64}
              placeholder="ex: Novo roteiro em Pipa"
              className="h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
            />
            <span className="text-[11px] text-[var(--color-neutral-500)]">{title.length}/64</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">Mensagem</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={180}
              rows={3}
              placeholder="ex: Acabei de subir um roteiro novo. Vem ver!"
              className="rounded-[12px] border border-[var(--color-neutral-300)] px-3 py-2 text-[14px] outline-none focus:border-[var(--color-neutral-800)] resize-none"
            />
            <span className="text-[11px] text-[var(--color-neutral-500)]">{body.length}/180</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">URL ao clicar</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/passeios"
              className="h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
            />
          </label>

          <div>
            <p className="text-[13px] font-medium text-[var(--color-neutral-800)] mb-2">Segmento</p>
            <div className="flex flex-col gap-2">
              {SEGMENTS.map((s) => {
                const sel = segment === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSegment(s.value)}
                    className={`text-left flex items-start gap-3 p-3 rounded-[12px] border transition-colors ${
                      sel
                        ? "border-[var(--color-neutral-800)] border-2"
                        : "border-[var(--color-neutral-300)]"
                    }`}
                  >
                    <span
                      className={`grid size-5 place-items-center rounded-full border-2 mt-0.5 ${
                        sel ? "border-[var(--color-neutral-800)]" : "border-[var(--color-neutral-300)]"
                      }`}
                    >
                      {sel && <span className="size-2 rounded-full bg-[var(--color-neutral-800)]" />}
                    </span>
                    <div>
                      <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">{s.label}</p>
                      <p className="text-[12px] text-[var(--color-neutral-600)]">{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-[13px] text-red-600">{error}</p>}
          {result && (
            <p className="text-[13px] text-emerald-700 bg-emerald-50 rounded-[12px] px-3 py-2">
              Enviado! Entregues: {result.delivered}. Falhas: {result.failed}.
            </p>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="self-end h-11 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[14px] font-medium disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar agora"}
          </button>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)] mb-3">
          Últimos envios
        </h2>
        {history === undefined ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-[12px] bg-[var(--color-neutral-100)]" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-[13px] text-[var(--color-neutral-600)] text-center py-8">
            Nenhum broadcast enviado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((b) => (
              <div
                key={b._id}
                className="flex items-start gap-3 p-3 rounded-[12px] border border-[var(--color-neutral-200)] bg-white"
              >
                <Icon name="bell" size={16} className="text-[var(--color-neutral-700)] mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-medium text-[13.5px] text-[var(--color-neutral-800)] truncate">
                    {b.title}
                  </p>
                  <p className="text-[12px] text-[var(--color-neutral-600)] line-clamp-1">{b.body}</p>
                  <p className="text-[11px] text-[var(--color-neutral-500)] mt-0.5">
                    {fmtDate(b.sentAt)} · {b.segment} · entregues: {b.delivered} / falhas: {b.failed}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
