"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersListPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | "admin" | "customer">("");

  const users = useQuery(api.usersAdmin.list, {
    search: search || undefined,
    role: role || undefined,
    limit: 200,
  });
  const loading = users === undefined;

  return (
    <main>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-medium text-[24px] text-[var(--color-neutral-800)]">
            Usuários
          </h1>
          <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
            Gerencie contas, roles e verificação de email.
          </p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--color-neutral-800)] text-white text-[14px] font-medium"
        >
          <Icon name="user-plus" size={16} />
          Novo usuário
        </Link>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-white border border-[var(--color-neutral-300)] focus-within:border-[var(--color-neutral-800)] transition-colors">
          <Icon name="search" size={16} className="text-[var(--color-neutral-600)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--color-neutral-500)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="grid size-5 place-items-center rounded-full bg-[var(--color-neutral-100)]"
            >
              <Icon name="x" size={11} className="text-[var(--color-neutral-700)]" />
            </button>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-[var(--color-neutral-100)]">
          {([
            { v: "", label: "Todos" },
            { v: "admin", label: "Admins" },
            { v: "customer", label: "Customers" },
          ] as const).map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => setRole(r.v)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                role === r.v
                  ? "bg-white text-[var(--color-neutral-800)]"
                  : "text-[var(--color-neutral-600)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-[12px] bg-[var(--color-neutral-100)]" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white p-12 text-center">
          <Icon
            name="users-round"
            size={32}
            className="text-[var(--color-neutral-400)] mx-auto mb-3"
          />
          <p className="text-[14px] text-[var(--color-neutral-600)]">
            Nenhum usuário encontrado.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-neutral-200)] bg-white overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_220px_120px_120px_80px_40px] gap-3 px-5 py-3 border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)] text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-600)]">
            <div>Nome</div>
            <div>Email</div>
            <div>Role</div>
            <div>Verificado</div>
            <div>Viagens</div>
            <div></div>
          </div>
          {/* Rows */}
          {users.map((u, i) => (
            <Link
              key={u._id}
              href={`/admin/usuarios/${u._id}`}
              className={`grid grid-cols-1 md:grid-cols-[1fr_220px_120px_120px_80px_40px] gap-3 px-5 py-4 items-center hover:bg-[var(--color-neutral-50)] transition-colors ${
                i !== users.length - 1
                  ? "border-b border-[var(--color-neutral-100)]"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)] font-display font-medium text-[14px] text-[var(--color-neutral-800)] shrink-0">
                  {(u.name || u.email || "?")[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)] truncate">
                    {u.name || "(sem nome)"}
                  </p>
                  <p className="text-[11px] text-[var(--color-neutral-500)] md:hidden truncate">
                    {u.email}
                  </p>
                </div>
              </div>
              <div className="text-[13px] text-[var(--color-neutral-700)] truncate hidden md:block">
                {u.email}
              </div>
              <div>
                <span
                  className={`inline-block text-[10px] font-medium uppercase tracking-wide rounded-full px-2 py-0.5 ${
                    u.role === "admin"
                      ? "bg-[var(--color-brand-yellow)] text-[var(--color-neutral-800)]"
                      : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]"
                  }`}
                >
                  {u.role}
                </span>
              </div>
              <div className="text-[12px]">
                {u.emailVerificationTime ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Icon name="check-circle" size={12} />
                    {fmtDate(u.emailVerificationTime)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Icon name="alert-circle" size={12} />
                    Pendente
                  </span>
                )}
              </div>
              <div className="text-[13px] text-[var(--color-neutral-700)] hidden md:block">
                {u.tripsCount}
              </div>
              <div className="text-right">
                <Icon
                  name="chevron-right"
                  size={14}
                  className="text-[var(--color-neutral-500)] ml-auto"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
