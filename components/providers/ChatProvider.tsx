"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NordesteAIOnboarding } from "@/components/organisms/NordesteAIOnboarding";
import { useAuth } from "./AuthProvider";

type ChatContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /**
   * Auth-aware open. If the user is logged out, shows the NordesteAÍ
   * onboarding instead of the chat panel. Use this in CTAs that point at
   * the chat from public surfaces (hero, featured section, etc.).
   */
  requestOpen: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const requestOpen = useCallback(() => {
    if (auth.isLoading) return;
    if (auth.isAuthenticated) {
      setIsOpen(true);
    } else {
      setOnboardingOpen(true);
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  const value = useMemo<ChatContextValue>(
    () => ({ isOpen, open, close, toggle, requestOpen }),
    [isOpen, open, close, toggle, requestOpen],
  );
  return (
    <ChatContext.Provider value={value}>
      {children}
      <NordesteAIOnboarding
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onLogin={() => {
          setOnboardingOpen(false);
          auth.openAuthModal();
        }}
      />
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
