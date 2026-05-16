"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsLayout } from "@/components/organisms/SettingsLayout";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { LegalSheet } from "@/components/organisms/LegalSheet";
import { DeleteAccountSheet } from "@/components/organisms/DeleteAccountSheet";
import { TERMS_MD } from "@/content/terms";
import { PRIVACY_MD } from "@/content/privacy";
import { logAndGetMessage } from "@/lib/errors";

type ItemKey = "terms" | "privacy" | "data" | "delete";

const ITEMS: {
  key: ItemKey;
  icon: string;
  label: string;
  desc?: string;
  destructive?: boolean;
}[] = [
  { key: "terms", icon: "file-text", label: "Termos de uso" },
  { key: "privacy", icon: "shield", label: "Política de privacidade" },
  {
    key: "data",
    icon: "database",
    label: "Meus dados",
    desc: "Baixe uma cópia em CSV de tudo que temos sobre você.",
  },
  {
    key: "delete",
    icon: "trash-2",
    label: "Excluir minha conta",
    desc: "Remoção permanente da conta e dos dados.",
    destructive: true,
  },
];

export default function PrivacidadePage() {
  const auth = useAuth();
  const [openSheet, setOpenSheet] = useState<"terms" | "privacy" | "delete" | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/data-export");
      if (!res.ok) throw new Error("Falha ao exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `nordestai-meus-dados-${today}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(logAndGetMessage("dataExport", err, "Não consegui exportar agora. Tente novamente em instantes."));
    } finally {
      setExporting(false);
    }
  }

  function handleClick(key: ItemKey) {
    if (key === "data") {
      handleExport();
    } else {
      setOpenSheet(key);
    }
  }

  return (
    <SettingsLayout
      title="Privacidade"
      subtitle="Seus dados, suas regras. Aqui você gerencia tudo."
    >
      <div className="flex flex-col gap-3 max-w-2xl">
        {ITEMS.map((item) => {
          const isExporting = item.key === "data" && exporting;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item.key)}
              disabled={isExporting}
              className={`text-left w-full flex items-center gap-3 p-4 rounded-[16px] border bg-white transition-colors disabled:opacity-50 ${
                item.destructive
                  ? "border-red-300 hover:border-red-500"
                  : "border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-800)]"
              }`}
            >
              <Icon
                name={item.icon}
                size={18}
                className={
                  item.destructive
                    ? "text-red-600"
                    : "text-[var(--color-neutral-800)]"
                }
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-display font-medium text-[14px] ${
                    item.destructive
                      ? "text-red-600"
                      : "text-[var(--color-neutral-800)]"
                  }`}
                >
                  {isExporting ? "Gerando arquivo…" : item.label}
                </p>
                {item.desc && (
                  <p className="text-[12px] text-[var(--color-neutral-600)]">
                    {item.desc}
                  </p>
                )}
              </div>
              <Icon
                name="chevron-right"
                size={14}
                className="text-[var(--color-neutral-500)]"
              />
            </button>
          );
        })}
      </div>

      <LegalSheet
        open={openSheet === "terms"}
        onClose={() => setOpenSheet(null)}
        title="Termos de uso"
        source={TERMS_MD}
      />
      <LegalSheet
        open={openSheet === "privacy"}
        onClose={() => setOpenSheet(null)}
        title="Política de privacidade"
        source={PRIVACY_MD}
      />
      <DeleteAccountSheet
        open={openSheet === "delete"}
        onClose={() => setOpenSheet(null)}
      />
    </SettingsLayout>
  );
}
