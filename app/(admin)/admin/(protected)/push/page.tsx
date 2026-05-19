"use client";

import { useState, useMemo } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

const SEGMENTS = [
  { value: "all", label: "Todos os inscritos", desc: "Quem ativou notificações." },
  { value: "planning", label: "Planejando viagem", desc: "Tem ao menos 1 viagem com status planejando." },
  { value: "with-favorites", label: "Com favoritos", desc: "Tem pelo menos 1 favorito salvo." },
  { value: "specific", label: "Usuários específicos", desc: "Selecione 1 ou mais usuários que ativaram notificações." },
];

const SEGMENT_LABELS: Record<string, string> = {
  all: "Todos",
  planning: "Planejando",
  "with-favorites": "Com favoritos",
  "specific-users": "Específicos",
};

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
  const sendToSelectedUsers = useAction(api.push.sendToSelectedUsers);
  const clearSubs = useMutation(api.pushQueries.clearAllSubscriptions);
  const history = useQuery(api.pushQueries.listBroadcasts, { limit: 20 });
  const subscribedUsers = useQuery(api.pushQueries.listSubscribedUsers, {});

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [segment, setSegment] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{ delivered: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    if (!subscribedUsers) return [];
    const q = userSearch.toLowerCase();
    if (!q) return subscribedUsers;
    return subscribedUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q),
    );
  }, [subscribedUsers, userSearch]);

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function selectAll() {
    setSelectedUserIds(new Set(filteredUsers.map((u) => u.userId)));
  }

  function clearSelection() {
    setSelectedUserIds(new Set());
  }

  const canSend =
    title.trim() &&
    body.trim() &&
    (segment !== "specific" || selectedUserIds.size > 0);

  async function handleSend() {
    setError("");
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError("Título e corpo são obrigatórios.");
      return;
    }
    if (segment === "specific" && selectedUserIds.size === 0) {
      setError("Selecione ao menos 1 usuário.");
      return;
    }
    const confirmMsg =
      segment === "specific"
        ? `Enviar para ${selectedUserIds.size} usuário(s) selecionado(s)?`
        : `Enviar para o segmento "${segment}"?`;
    if (!confirm(confirmMsg)) return;
    setSending(true);
    try {
      let r: { delivered: number; failed: number };
      if (segment === "specific") {
        r = await sendToSelectedUsers({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/",
          userIds: Array.from(selectedUserIds),
        });
      } else {
        r = await sendBroadcast({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/",
          segment,
        });
      }
      setResult(r);
      setTitle("");
      setBody("");
      setUrl("/");
      setSelectedUserIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setSending(false);
    }
  }

  async function handleClearSubs() {
    if (!confirm("Limpar TODAS as subscriptions? Usuários precisarão reativar notificações.")) return;
    setClearing(true);
    try {
      const r = await clearSubs({});
      alert(`${r.removed} subscriptions removidas.`);
    } catch {
      alert("Erro ao limpar.");
    } finally {
      setClearing(false);
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

          {/* Segment selector */}
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
                      className={`grid size-5 place-items-center rounded-full border-2 mt-0.5 shrink-0 ${
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

          {/* User picker — shown only when segment === "specific" */}
          {segment === "specific" && (
            <div className="rounded-[12px] border border-[var(--color-neutral-200)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-[var(--color-neutral-100)]">
                <span className="text-[13px] font-medium text-[var(--color-neutral-800)]">
                  {selectedUserIds.size > 0
                    ? `${selectedUserIds.size} selecionado(s)`
                    : "Selecione usuários"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[12px] text-[var(--color-brand-purple)] hover:underline"
                  >
                    Todos
                  </button>
                  <span className="text-[var(--color-neutral-300)]">·</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[12px] text-[var(--color-neutral-500)] hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-[var(--color-neutral-100)]">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail…"
                  className="w-full h-8 text-[13px] outline-none placeholder:text-[var(--color-neutral-400)] text-[var(--color-neutral-800)]"
                />
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-[var(--color-neutral-100)]">
                {subscribedUsers === undefined ? (
                  <div className="px-3 py-4 text-[13px] text-[var(--color-neutral-500)] text-center animate-pulse">
                    Carregando…
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="px-3 py-4 text-[13px] text-[var(--color-neutral-500)] text-center">
                    Nenhum usuário com push ativo.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const checked = selectedUserIds.has(u.userId);
                    return (
                      <button
                        key={u.userId}
                        type="button"
                        onClick={() => toggleUser(u.userId)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          checked ? "bg-[var(--color-neutral-50)]" : "hover:bg-[var(--color-neutral-50)]"
                        }`}
                      >
                        <span
                          className={`size-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            checked
                              ? "bg-[var(--color-neutral-800)] border-[var(--color-neutral-800)]"
                              : "border-[var(--color-neutral-300)]"
                          }`}
                        >
                          {checked && (
                            <Icon name="lucide:check" size={10} className="text-white" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[var(--color-neutral-800)] truncate">
                            {u.name ?? "Sem nome"}
                          </p>
                          {u.email && (
                            <p className="text-[11px] text-[var(--color-neutral-500)] truncate">{u.email}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {error && <p className="text-[13px] text-red-600">{error}</p>}
          {result && (
            <p className="text-[13px] text-emerald-700 bg-emerald-50 rounded-[12px] px-3 py-2">
              Enviado! Entregues: {result.delivered}. Falhas: {result.failed}.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClearSubs}
              disabled={clearing}
              className="h-11 px-4 rounded-full border border-red-300 text-red-600 text-[13px] font-medium disabled:opacity-50 hover:bg-red-50"
            >
              {clearing ? "Limpando…" : "Limpar subscriptions"}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !canSend}
              className="h-11 px-5 rounded-full bg-[var(--color-neutral-800)] text-white text-[14px] font-medium disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Enviar agora"}
            </button>
          </div>
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
                    {fmtDate(b.sentAt)} · {SEGMENT_LABELS[b.segment] ?? b.segment}
                    {b.targetUserIds && b.targetUserIds.length > 0 && (
                      <span> ({b.targetUserIds.length} usuário{b.targetUserIds.length !== 1 ? "s" : ""})</span>
                    )}
                    {" "}· entregues: {b.delivered} / falhas: {b.failed}
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
