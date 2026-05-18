"use client";

import { usePathname } from "next/navigation";

const DETAIL_SECTIONS = [
  "passeios", "restaurantes", "praias", "dicas", "vida-noturna", "roteiros",
];

/** Adds bottom clearance only on pages where BottomNav is rendered. */
export function BottomNavSpacer() {
  const pathname = usePathname();

  if (pathname.startsWith("/minha-viagem/criar")) return null;
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/offline") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 2 && DETAIL_SECTIONS.includes(segments[0])) return null;

  return <div className="h-22" aria-hidden />;
}
