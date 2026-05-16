"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  skipped: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
};

export default function AdminWebhooksPage() {
  const events = useQuery(api.webhookLog.list, { limit: 50 });

  return (
    <main className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Webhooks (n8n)
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] mt-1 max-w-[60ch]">
          Eventos disparados pra automações externas. Configure
          <code className="mx-1 px-1.5 py-0.5 rounded bg-[var(--color-neutral-100)] text-[12px]">N8N_WEBHOOK_URL</code>
          e
          <code className="mx-1 px-1.5 py-0.5 rounded bg-[var(--color-neutral-100)] text-[12px]">N8N_WEBHOOK_SECRET</code>
          no Convex pra ativar.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-5 mb-6">
        <h2 className="font-display font-medium text-[15px] text-[var(--color-neutral-800)] mb-3">
          Eventos disparados hoje
        </h2>
        <ul className="text-[13px] text-[var(--color-neutral-700)] space-y-1 list-disc pl-5">
          <li><code>user.signedUp</code> — quando alguém cria conta</li>
          <li><code>trip.created</code> — quando uma viagem é criada</li>
        </ul>
        <p className="text-[12px] text-[var(--color-neutral-600)] mt-3">
          Cada request leva um header <code>X-Huan-Signature: sha256=…</code> com HMAC do corpo
          assinado por <code>N8N_WEBHOOK_SECRET</code>. Use isso pra validar no n8n.
        </p>
      </section>

      {events === undefined ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-[12px] bg-[var(--color-neutral-100)]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-[13px] text-[var(--color-neutral-600)] text-center py-12">
          Nenhum evento disparado ainda. Crie uma viagem ou cadastre um usuário para testar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => {
            const status = STATUS_STYLES[e.status] ?? STATUS_STYLES.pending;
            return (
              <div
                key={e._id}
                className="flex items-start gap-3 p-3 rounded-[12px] border border-[var(--color-neutral-200)] bg-white"
              >
                <Icon
                  name="webhook"
                  size={16}
                  className="text-[var(--color-neutral-600)] mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-display font-medium text-[13px] text-[var(--color-neutral-800)]">
                      {e.event}
                    </code>
                    <span
                      className={`inline-block text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 ${status}`}
                    >
                      {e.status}
                    </span>
                    <span className="text-[11px] text-[var(--color-neutral-500)] ml-auto">
                      {fmtDate(e.createdAt)}
                    </span>
                  </div>
                  {e.response && (
                    <p className="text-[11px] text-[var(--color-neutral-600)] mt-0.5 truncate">
                      {e.response}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
