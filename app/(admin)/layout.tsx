import type { ReactNode } from "react";
import type { Metadata } from "next";

// Block indexing of the entire admin route group + plug a dedicated PWA
// manifest so admins can install the panel as its own app.
export const metadata: Metadata = {
  title: "Admin NordesteAÍ",
  applicationName: "Admin NordesteAÍ",
  manifest: "/manifest-admin.json",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: {
    icon: "/images/meta/img-admin.png",
    apple: "/images/meta/img-admin.png",
  },
  appleWebApp: {
    capable: true,
    title: "Admin NordesteAÍ",
    statusBarStyle: "default",
  },
};

// Route group para admin, sem o AppProviders (sem ChatFab etc.)
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
