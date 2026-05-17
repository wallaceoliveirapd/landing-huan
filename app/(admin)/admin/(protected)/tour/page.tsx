"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/atoms/Icon";

const STORAGE_KEY = "huan-welcome-tour-v1";

type Mode = "done" | "force" | null;

export default function AdminTourPage() {
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    try {
      setMode(localStorage.getItem(STORAGE_KEY) as Mode);
    } catch {
      /* noop */
    }
  }, []);

  function set(value: Mode) {
    try {
      if (value === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
      setMode(value);
      toast.success("Estado atualizado. Recarregue a home pra testar.");
    } catch {
      toast.error("Não consegui salvar no localStorage.");
    }
  }

  return (
    <main className="p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
          Tour guide
        </h1>
        <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
          Controla o estado do tour de boas-vindas (5 passos) que aparece
          quando o usuário entra logado pela primeira vez. O estado é por
          dispositivo (localStorage).
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-6 mb-6">
        <p className="text-[13px] font-medium text-[var(--color-neutral-600)] mb-2">
          Estado atual no seu dispositivo:
        </p>
        <p className="font-display font-medium text-[18px] text-[var(--color-neutral-800)]">
          {mode === "done"
            ? "Concluído (não vai mais mostrar)"
            : mode === "force"
            ? "Debug, sempre mostrar"
            : "Não visto ainda, vai mostrar na próxima visita"}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <ActionRow
          icon="refresh-cw"
          title="Resetar tour"
          desc="Apaga a flag, o tour aparece de novo na próxima visita logada na home."
          buttonLabel="Resetar"
          onClick={() => set(null)}
          disabled={mode === null}
        />
        <ActionRow
          icon="bug-play"
          title="Modo debug (sempre mostrar)"
          desc="O tour aparece toda vez que abrir a home. Útil pra testar o fluxo. Lembra de desligar depois."
          buttonLabel={mode === "force" ? "Já ativo" : "Ativar"}
          onClick={() => set("force")}
          disabled={mode === "force"}
        />
        <ActionRow
          icon="check-circle-2"
          title="Marcar como concluído"
          desc="Esconde o tour pra esse dispositivo, como se o usuário já tivesse passado por ele."
          buttonLabel={mode === "done" ? "Já concluído" : "Marcar"}
          onClick={() => set("done")}
          disabled={mode === "done"}
        />
      </section>
    </main>
  );
}

function ActionRow({
  icon,
  title,
  desc,
  buttonLabel,
  onClick,
  disabled,
}: {
  icon: string;
  title: string;
  desc: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
      <Icon name={icon} size={20} className="text-[var(--color-neutral-800)] mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
          {title}
        </p>
        <p className="text-[12px] text-[var(--color-neutral-600)] mt-0.5 leading-[1.5]">
          {desc}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="h-9 px-4 rounded-full bg-[var(--color-neutral-800)] text-white text-[13px] font-medium disabled:opacity-40 shrink-0"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
