"use client";

import { useEffect, useState } from "react";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";

export default function SegurancaPage() {
  const auth = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  return (
    <SettingsLayout
      title="Login e segurança"
      subtitle="Gerencie sua senha e dispositivos conectados."
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        <Row icon="key-round" label="Senha" value="••••••••" />
        <Row icon="mail-check" label="E-mail verificado" value="Sim" />
        <Row icon="smartphone" label="Sessões ativas" value="1 dispositivo" />

        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="mt-2 h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] transition-all"
        >
          Alterar senha
        </button>

        {showInfo && (
          <div className="mt-3 p-4 rounded-[16px] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)]">
            <p className="text-[13px] text-[var(--color-neutral-700)] leading-[1.5]">
              Recurso em breve. Por enquanto, se precisar trocar a senha entre em contato com a gente
              em <strong>suporte@huan.com.br</strong>.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={auth.signOut}
          className="mt-2 h-12 rounded-full bg-white border border-[var(--color-neutral-800)] text-[var(--color-neutral-800)] font-display font-medium text-[15px]"
        >
          Sair da conta
        </button>
      </div>
    </SettingsLayout>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
      <Icon name={icon} size={18} className="text-[var(--color-neutral-800)]" />
      <p className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
        {label}
      </p>
      <span className="text-[13px] text-[var(--color-neutral-600)]">{value}</span>
    </div>
  );
}
