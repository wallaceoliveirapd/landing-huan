"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Opens the auth modal */
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  /** Call this before doing a gated action. Returns true if already authed. */
  requireAuth: () => boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut: convexSignOut } = useAuthActions();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const requireAuth = useCallback((): boolean => {
    if (isAuthenticated) return true;
    setAuthModalOpen(true);
    return false;
  }, [isAuthenticated]);

  const signOut = useCallback(async () => {
    await convexSignOut();
  }, [convexSignOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading, openAuthModal, closeAuthModal, authModalOpen, requireAuth, signOut }),
    [isAuthenticated, isLoading, openAuthModal, closeAuthModal, authModalOpen, requireAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
