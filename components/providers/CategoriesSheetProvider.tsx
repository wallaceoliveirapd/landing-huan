"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Value = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<Value | null>(null);

export function CategoriesSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo<Value>(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategoriesSheet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCategoriesSheet must be used within CategoriesSheetProvider");
  return ctx;
}
