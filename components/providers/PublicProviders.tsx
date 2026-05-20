"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { ChatProvider } from "./ChatProvider";
import { CategoriesSheetProvider } from "./CategoriesSheetProvider";
import { ChatPanel } from "@/components/organisms/ChatPanel";
import { CategoriesBottomSheet } from "@/components/organisms/CategoriesBottomSheet";
import { AuthModal } from "@/components/organisms/AuthModal";
import { BottomNav } from "@/components/organisms/BottomNav";
import { PushPrompt } from "@/components/organisms/PushPrompt";
import { PullToRefresh } from "@/components/organisms/PullToRefresh";
import { WelcomeTour } from "@/components/organisms/WelcomeTour";
import { PendingInviteAlert } from "@/components/organisms/PendingInviteAlert";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

/**
 * Providers + global UI for public pages (home + internal).
 * NOT used in admin to keep the panel clean.
 *
 * ChatFab was removed, the NordestAI chat is now opened from the
 * BottomNav (item with sparkle icon + periodic tooltip).
 */
export function PublicProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CategoriesSheetProvider>
        <ChatProvider>
          {children}
          <ChatPanel />
          <CategoriesBottomSheet />
          <AuthModal />
          <BottomNav />
          <PushPrompt />
          <PullToRefresh />
          <WelcomeTour />
          <PendingInviteAlert />
          <ServiceWorkerRegister />
        </ChatProvider>
      </CategoriesSheetProvider>
    </AuthProvider>
  );
}
