import type { ReactNode } from "react";

// Base admin layout — no sidebar (login page uses this)
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
