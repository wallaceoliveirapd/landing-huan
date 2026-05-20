"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { CookieConsentProvider } from "./CookieConsentProvider";
import { StoryQueueProvider } from "./StoryQueueProvider";
import { CookieBanner } from "@/components/organisms/CookieBanner";
import { StoryQueueToast } from "@/components/organisms/admin/StoryQueueToast";
import { ErrorBoundary } from "@/components/atoms/ErrorBoundary";

/**
 * Root-level providers: Convex + Sonner toaster + top-level ErrorBoundary.
 * Wraps the entire app tree. Public UI elements (ChatFab, BottomSheet) are
 * in PublicProviders, which is only mounted in the public route groups.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <CookieConsentProvider>
        <ConvexClientProvider>
          <StoryQueueProvider>
            {children}
            <StoryQueueToast />
          </StoryQueueProvider>
        </ConvexClientProvider>
        <CookieBanner />
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={4500}
          offset={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-2xl !border !border-[var(--color-neutral-200)] !shadow-lg",
            },
          }}
        />
      </CookieConsentProvider>
    </ErrorBoundary>
  );
}
