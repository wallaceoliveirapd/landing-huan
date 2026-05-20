"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";

type Item = { href: string; label: string; icon: string; exact?: boolean };
type Group = { id: string; label: string; icon: string; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "overview",
    label: "Visão geral",
    icon: "lucide:layout-dashboard",
    items: [
      { href: "/admin", label: "Dashboard", icon: "lucide:layout-dashboard", exact: true },
    ],
  },
  {
    id: "conteudo",
    label: "Conteúdo",
    icon: "lucide:layers",
    items: [
      { href: "/admin/categorias", label: "Categorias", icon: "lucide:layout-grid" },
      { href: "/admin/passeios", label: "Passeios", icon: "lucide:map-pin" },
      { href: "/admin/restaurantes", label: "Restaurantes", icon: "lucide:utensils" },
      { href: "/admin/praias", label: "Praias", icon: "lucide:waves" },
      { href: "/admin/vida-noturna", label: "Vida Noturna", icon: "lucide:moon" },
      { href: "/admin/hospedagem", label: "Hospedagem", icon: "lucide:bed" },
      { href: "/admin/roteiros", label: "Roteiros", icon: "lucide:route" },
      { href: "/admin/dicas", label: "Dicas", icon: "lucide:lightbulb" },
      { href: "/admin/site", label: "Conteúdo do Site", icon: "lucide:pencil" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "lucide:megaphone",
    items: [
      { href: "/admin/stories", label: "Stories", icon: "lucide:image-plus" },
      { href: "/admin/cupons", label: "Cupons", icon: "lucide:ticket-percent" },
      { href: "/admin/push", label: "Push notifications", icon: "lucide:bell-ring" },
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    icon: "lucide:users",
    items: [
      { href: "/admin/usuarios", label: "Usuários", icon: "lucide:users-round" },
      { href: "/admin/avaliacoes", label: "Avaliações", icon: "lucide:star" },
    ],
  },
  {
    id: "metricas",
    label: "Métricas",
    icon: "lucide:bar-chart-2",
    items: [
      { href: "/admin/analytics", label: "Analytics / UTM", icon: "lucide:bar-chart-2" },
      { href: "/admin/relatorios", label: "Relatórios", icon: "lucide:file-bar-chart" },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: "lucide:settings",
    items: [
      { href: "/admin/midia", label: "Mídia / R2", icon: "lucide:image" },
      { href: "/admin/webhooks", label: "Webhooks (n8n)", icon: "lucide:webhook" },
      { href: "/admin/tour", label: "Tour guide", icon: "lucide:map" },
    ],
  },
];

const STORAGE_KEY = "admin:openGroups";

function NavItem({
  href,
  label,
  icon,
  exact,
  onClick,
}: Item & { onClick?: () => void }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--color-brand-purple)] text-white"
          : "text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)]"
      )}
    >
      <Icon name={icon} size={15} />
      {label}
    </Link>
  );
}

function GroupSection({
  group,
  open,
  onToggle,
  onItemClick,
}: {
  group: Group;
  open: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const hasActive = group.items.some((it) =>
    it.exact ? pathname === it.href : pathname.startsWith(it.href),
  );

  // Single-item groups render as a flat NavItem (no chevron noise).
  if (group.items.length === 1) {
    return <NavItem {...group.items[0]} onClick={onItemClick} />;
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors",
          hasActive
            ? "text-[var(--color-brand-purple)]"
            : "text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]",
        )}
      >
        <span className="flex items-center gap-2">
          <Icon name={group.icon} size={13} />
          {group.label}
        </span>
        <Icon
          name="lucide:chevron-down"
          size={13}
          className={clsx("transition-transform", open ? "rotate-0" : "-rotate-90")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pl-2 pt-0.5">
              {group.items.map((it) => (
                <NavItem key={it.href} {...it} onClick={onItemClick} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useOpenGroups() {
  const pathname = usePathname();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  // Initial load: restore from localStorage, expand group with active path.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string[] = [];
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      /* ignore */
    }
    const next = new Set(stored);
    for (const g of GROUPS) {
      const active = g.items.some((it) =>
        it.exact ? pathname === it.href : pathname.startsWith(it.href),
      );
      if (active) next.add(g.id);
    }
    setOpenIds(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always ensure the active group is open on route change.
  useEffect(() => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      for (const g of GROUPS) {
        const active = g.items.some((it) =>
          it.exact ? pathname === it.href : pathname.startsWith(it.href),
        );
        if (active) next.add(g.id);
      }
      return next;
    });
  }, [pathname]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      }
      return next;
    });
  }

  return { openIds, toggle };
}

export function AdminSidebar() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openIds, toggle } = useOpenGroups();

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
  }

  const navContent = (onItemClick?: () => void) => (
    <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
      {GROUPS.map((g) => (
        <GroupSection
          key={g.id}
          group={g}
          open={openIds.has(g.id)}
          onToggle={() => toggle(g.id)}
          onItemClick={onItemClick}
        />
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-[var(--color-neutral-300)] p-4 sticky top-0 h-screen overflow-hidden">
        <div className="mb-5 px-2">
          <span className="font-display font-bold text-2xl text-[var(--color-brand-purple)]">HUAN</span>
          <p className="text-xs text-[var(--color-neutral-600)] mt-0.5">Admin</p>
        </div>
        {navContent()}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] transition-colors mt-3"
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              onClick={() => setDrawerOpen(false)}
            />
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

              {navContent(() => setDrawerOpen(false))}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] transition-colors mt-3"
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
