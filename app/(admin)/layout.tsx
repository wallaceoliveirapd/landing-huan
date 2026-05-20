import type { ReactNode } from "react";
import type { Metadata } from "next";

// Block indexing of the entire admin route group.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// Route group para admin, sem o AppProviders (sem ChatFab etc.)
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
