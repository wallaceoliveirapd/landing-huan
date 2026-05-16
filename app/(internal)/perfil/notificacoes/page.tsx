"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import {
  pushSupported,
  subscribePush,
  unsubscribePush,
  serializeSubscription,
} from "@/lib/pushClient";

export default function NotificacoesPage() {
  const auth = useAuth();
  const status = useQuery(api.pushQueries.myStatus);
  const subscribe = useMutation(api.pushQueries.subscribe);
  const unsubscribe = useMutation(api.pushQueries.unsubscribe);

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  useEffect(() => {
    if (!pushSupported()) {
      setPermission("unsupported");
    } else if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const supported = permission !== "unsupported";
  const isOn = !!status?.subscribed && permission === "granted";
  const loading = status === undefined;

  async function handleToggle() {
    if (working) return;
    setError("");
    setWorking(true);
    try {
      if (isOn) {
        const endpoint = await unsubscribePush();
        if (endpoint) await unsubscribe({ endpoint });
      } else {
        const sub = await subscribePush();
        if (!sub) {
          setError("Permissão negada ou navegador não suporta. Verifique as configurações.");
          if (typeof Notification !== "undefined") setPermission(Notification.permission);
          return;
        }
        const { endpoint, p256dh, auth: authKey } = serializeSubscription(sub);
        if (!p256dh || !authKey) {
          setError("Não foi possível gerar a chave de inscrição.");
          return;
        }
        await subscribe({
          endpoint,
          p256dh,
          auth: authKey,
          userAgent: navigator.userAgent,
        });
        setPermission("granted");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <SettingsLayout
      title="Notificações"
      subtitle="Receba avisos importantes no seu navegador ou celular."
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        {/* Push toggle — main toggle */}
        <div
          className={`flex items-start gap-4 p-4 rounded-[16px] border bg-white ${
            isOn ? "border-[var(--color-neutral-800)]" : "border-[var(--color-neutral-200)]"
          }`}
        >
          <div className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0">
            <Icon name="bell" size={18} className="text-[var(--color-neutral-800)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
              Notificações no navegador
            </p>
            {!supported ? (
              <p className="text-[12px] text-[var(--color-neutral-600)]">
                Seu navegador não suporta. Tente Chrome ou Safari iOS 16.4+.
              </p>
            ) : permission === "denied" ? (
              <p className="text-[12px] text-amber-700">
                Você bloqueou notificações para este site. Habilite nas configurações do navegador.
              </p>
            ) : (
              <p className="text-[12px] text-[var(--color-neutral-600)]">
                Avise quando seu roteiro estiver pronto, novas ofertas chegarem, lembrete de viagem.
              </p>
            )}
            {error && (
              <p className="text-[12px] text-red-600 mt-1">{error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={!supported || permission === "denied" || working || loading}
            aria-pressed={isOn}
            className="shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-10 h-6 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
            ) : (
              <Toggle on={isOn} />
            )}
          </button>
        </div>

        {/* Info card */}
        <div className="px-4 py-3 rounded-[12px] bg-[var(--color-neutral-100)]">
          <p className="text-[12px] leading-[1.55] text-[var(--color-neutral-700)]">
            <strong>Dica:</strong> no iPhone, o push só funciona se você instalar este site na tela
            inicial (compartilhar → "Adicionar à Tela de Início"). No Android e desktop, funciona
            direto pelo navegador.
          </p>
        </div>

        <p className="text-[11px] text-[var(--color-neutral-500)] mt-2 max-w-[40ch]">
          Você pode desativar quando quiser. Nunca enviamos spam.
        </p>
      </div>
    </SettingsLayout>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex w-10 h-6 shrink-0 rounded-full transition-colors ${
        on ? "bg-[var(--color-neutral-800)]" : "bg-[var(--color-neutral-300)]"
      }`}
    >
      <span
        className="absolute top-0.5 size-5 rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </span>
  );
}
