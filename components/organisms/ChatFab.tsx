"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useChat } from "@/components/providers/ChatProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { trackChatOpen } from "@/lib/analytics";

export function ChatFab() {
  const chat = useChat();
  const auth = useAuth();
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    function onScroll() {
      const dist =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      setAtBottom(dist < 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const t1 = window.setTimeout(onScroll, 50);
    const t2 = window.setTimeout(onScroll, 500);
    const t3 = window.setTimeout(onScroll, 1500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  if (chat.isOpen) return null;

  function handleOpen() {
    trackChatOpen();
    if (auth.requireAuth()) {
      chat.open();
    }
  }

  return (
    <div
      className="fixed bottom-5 inset-x-0 z-40 flex px-5 pointer-events-none"
      style={{
        justifyContent: atBottom ? "center" : "flex-end",
        transition: "justify-content 0.5s",
      }}
    >
      <motion.button
        type="button"
        onClick={handleOpen}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Abrir chat com NordestAI"
        className="pointer-events-auto inline-flex items-center gap-2.5 rounded-pill bg-[var(--color-brand-yellow)] pl-1 pr-5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.22)] text-black font-display font-bold text-[15px]"
      >
        <span className="relative grid size-9 place-items-center rounded-full bg-black text-[var(--color-brand-yellow)]">
          <Icon name="ph:sparkle-fill" size={18} />
          <motion.span
            aria-hidden
            animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-black"
          />
        </span>
        <span>Fale com NordestAI</span>
      </motion.button>
    </div>
  );
}
