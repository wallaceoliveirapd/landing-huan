import type { ReactNode } from "react";

// Route group para admin, sem o AppProviders (sem ChatFab etc.)
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
