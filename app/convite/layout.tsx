"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthModal } from "@/components/organisms/AuthModal";

/**
 * Minimal layout for /convite/[token] accept screen — drops BottomNav,
 * WelcomeTour, ChatPanel, PendingInviteAlert and the rest of PublicProviders
 * so the invite flow stays focused (no distractions, no tour guide popups).
 *
 * Auth is still needed because accept/decline requires a logged-in user; the
 * AuthModal renders when the page asks for it.
 */
export default function ConviteLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
    </AuthProvider>
  );
}
