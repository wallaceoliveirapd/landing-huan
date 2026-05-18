"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "lucide:layout-dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuários", icon: "lucide:users-round" },
  { href: "/admin/categorias", label: "Categorias", icon: "lucide:layout-grid" },
  { href: "/admin/passeios", label: "Passeios", icon: "lucide:map-pin" },
  { href: "/admin/restaurantes", label: "Restaurantes", icon: "lucide:utensils" },
  { href: "/admin/dicas", label: "Dicas", icon: "lucide:lightbulb" },
  { href: "/admin/praias", label: "Praias", icon: "lucide:waves" },
  { href: "/admin/vida-noturna", label: "Vida Noturna", icon: "lucide:moon" },
  { href: "/admin/roteiros", label: "Roteiros", icon: "lucide:route" },
  { href: "/admin/hospedagem", label: "Hospedagem", icon: "lucide:bed" },
  { href: "/admin/cupons", label: "Cupons", icon: "lucide:ticket-percent" },
  { href: "/admin/site", label: "Conteúdo do Site", icon: "lucide:pencil" },
  { href: "/admin/midia", label: "Mídia / R2", icon: "lucide:image" },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: "lucide:star" },
  { href: "/admin/analytics", label: "Analytics / UTM", icon: "lucide:bar-chart-2" },
  { href: "/admin/push", label: "Push notifications", icon: "lucide:bell-ring" },
  { href: "/admin/webhooks", label: "Webhooks (n8n)", icon: "lucide:webhook" },
  { href: "/admin/tour", label: "Tour guide", icon: "lucide:map" },
];

function NavItem({
  href,
  label,
  icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-brand-purple)] text-white"
          : "text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)]"
      )}
    >
      <Icon name={icon} size={16} />
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-[var(--color-neutral-300)] p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6 px-2">
          <span className="font-display font-bold text-2xl text-[var(--color-brand-purple)]">HUAN</span>
          <p className="text-xs text-[var(--color-neutral-600)] mt-0.5">Admin</p>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(({ href, label, icon, exact }) => (
            <NavItem key={href} href={href} label={label} icon={icon} exact={exact} />
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] transition-colors mt-4"
        >
          <Icon name="lucide:log-out" size={16} />
          Sair
        </button>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 pb-3 bg-white border-b border-[var(--color-neutral-300)] shadow-sm"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <span className="font-display font-bold text-xl text-[var(--color-brand-purple)]">HUAN Admin</span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="grid size-10 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] transition-colors"
          aria-label="Abrir menu"
        >
          <Icon name="lucide:menu" size={22} />
        </button>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-display font-bold text-2xl text-[var(--color-brand-purple)]">HUAN</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="grid size-9 place-items-center rounded-xl hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)]"
                >
                  <Icon name="lucide:x" size={18} />
                </button>
              </div>

              <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
                {NAV.map(({ href, label, icon, exact }) => (
                  <NavItem
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    exact={exact}
                    onClick={() => setDrawerOpen(false)}
                  />
                ))}
              </nav>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] transition-colors mt-4"
              >
                <Icon name="lucide:log-out" size={16} />
                Sair
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
