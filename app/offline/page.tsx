import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

export const metadata: Metadata = {
  title: "Sem conexão",
  description: "Você está offline. Conecte-se à internet e tente novamente.",
};

// Fully static page so the service worker can pre-cache it. Avoid any
// client-only logic so it renders correctly even when JS chunks are
// missing from the cache.
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
    >
      <div className="grid size-20 place-items-center rounded-full bg-[var(--color-neutral-100)] mb-6">
        <Icon name="cloud-off" size={36} className="text-[var(--color-neutral-700)]" />
      </div>
      <h1 className="font-display font-medium text-[24px] leading-[1.2] text-[var(--color-neutral-800)] max-w-[20ch]">
        Você está sem conexão
      </h1>
      <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-neutral-600)] max-w-[32ch]">
        Sem internet por enquanto. Verifique sua rede, depois volte aqui.
      </p>
      <Link
        href="/"
        prefetch={false}
        className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px]"
      >
        <Icon name="refresh-cw" size={16} />
        Tentar de novo
      </Link>
      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
        NordesteAÍ
      </p>
    </main>
  );
}
