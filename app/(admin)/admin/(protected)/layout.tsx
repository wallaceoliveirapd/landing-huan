import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { AdminSidebar } from "@/components/organisms/admin/AdminSidebar";

// Protected admin pages — always dynamic (auth + real-time data)
export const dynamic = "force-dynamic";

/**
 * Server-side guard for /admin/(protected)/*:
 *   1. If no auth token → redirect to /admin/login
 *   2. If authenticated but role !== "admin" → redirect to home
 *
 * This runs on every request, so customers never get to see the admin UI
 * shell — they're bounced before any data is fetched.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token) redirect("/admin/login");

  const role = await fetchQuery(api.users.myRole, {}, { token });
  if (!role) redirect("/admin/login");
  if (role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen bg-[var(--color-neutral-100)]">
      <AdminSidebar />
      {/* pt-16 md:pt-0 = space for mobile top bar */}
      <main className="flex-1 overflow-auto p-4 pt-20 md:pt-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
