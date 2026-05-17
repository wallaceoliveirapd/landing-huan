"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useChat } from "@/components/providers/ChatProvider";
import { Icon } from "@/components/atoms/Icon";
import { ChatBubble, ChatMarkdown } from "@/components/molecules/ChatBubble";
import { ChatCarousel } from "@/components/molecules/ChatCarousel";
import { ChatInlineCard } from "@/components/molecules/ChatInlineCard";
import { ChatTimeline } from "@/components/molecules/ChatTimeline";
import {
  INITIAL_MESSAGES,
  SUGGESTED_PROMPTS,
  type ChatMessage,
  type RawCardItem,
} from "@/lib/chat-mocks";
import { trackChatMessage, trackSuggestedPrompt } from "@/lib/analytics";
import { gtmChatMessageSent, gtmChatResponseReceived } from "@/lib/gtm";

const STORAGE_KEY = "nordestai-chat-v1";

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* corrupted */
  }
  return INITIAL_MESSAGES;
}

/**
 * Fullscreen chat panel, clean white aesthetic, lucide icons, no bold.
 * Sliding bottom→top with spring. Matches the rest of the site.
 */
export function ChatPanel() {
  const chat = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* noop */
    }
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 60);
  }, [messages, chat.isOpen]);

  useEffect(() => {
    if (chat.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [chat.isOpen]);

  function clearChat() {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || isTyping) return;

    trackChatMessage(t);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      kind: "text",
      content: t,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    gtmChatMessageSent(nextMessages.length, t.length);
    setInput("");
    setIsTyping(true);

    const history = [...messages, userMsg]
      .filter((m) => m.kind === "text")
      .map((m) => ({ role: m.role, content: (m as { content: string }).content }));

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", kind: "text", content: "" },
    ]);

    const cardBuffer: RawCardItem[] = [];
    let cardsInserted = false;
    let responseText = "";

    function flushCards() {
      if (cardsInserted || cardBuffer.length === 0) return;
      cardsInserted = true;
      const carouselMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "cards",
        content: "",
        items: [...cardBuffer],
      };
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === assistantId);
        if (idx === -1) return [...prev, carouselMsg];
        return [...prev.slice(0, idx), carouselMsg, ...prev.slice(idx)];
      });
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("Chat API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") {
            flushCards();
            setMessages((prev) => {
              const finalMessages = prev.map((m) =>
                m.id === assistantId && m.kind === "text" && !m.content
                  ? { ...m, content: "" }
                  : m,
              );
              gtmChatResponseReceived(finalMessages.length, responseText.length);
              return finalMessages;
            });
            setIsTyping(false);
            return;
          }
          try {
            const event = JSON.parse(raw) as {
              type: string;
              content?: string;
              data?: Record<string, unknown>;
            };
            if (event.type === "card" && event.data) {
              cardBuffer.push(event.data as RawCardItem);
            } else if (event.type === "text" && event.content) {
              responseText += event.content;
              flushCards();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId && m.kind === "text"
                    ? { ...m, content: m.content + event.content }
                    : m,
                ),
              );
            }
          } catch {
            /* malformed JSON */
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      flushCards();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.kind === "text"
            ? {
                ...m,
                content: m.content || "Ops! Tive um probleminha. Pode repetir?",
              }
            : m,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <AnimatePresence>
      {chat.isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 36, mass: 1 }}
          className="fixed inset-0 z-50 flex flex-col bg-white"
          style={{ WebkitOverflowScrolling: "touch" }}
          role="dialog"
          aria-modal="true"
          aria-label="NordestAI, seu agente de viagem do Nordeste"
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <header
            className="flex items-center gap-3 px-5 pb-3 bg-white shrink-0"
            style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
          >
            <button
              type="button"
              onClick={chat.close}
              aria-label="Fechar chat"
              className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
            >
              <Icon
                name="arrow-left"
                size={18}
                className="text-[var(--color-neutral-800)]"
              />
            </button>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative size-10 rounded-full bg-[var(--color-brand-yellow)] shrink-0 overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[var(--color-brand-yellow)] opacity-50 animate-ping"
                  style={{ animationDuration: "2.5s" }}
                />
                <Image
                  src="/images/avatar.png"
                  alt="Huan"
                  fill
                  sizes="40px"
                  className="relative object-cover"
                />
              </motion.div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-display font-medium text-[15px] text-[var(--color-neutral-800)]">
                  Huan
                </span>
                <span className="text-[12px] text-[var(--color-neutral-600)] inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Seu agente de viagem
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={clearChat}
              title="Limpar conversa"
              aria-label="Limpar conversa"
              className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
            >
              <Icon
                name="eraser"
                size={16}
                className="text-[var(--color-neutral-800)]"
              />
            </button>
          </header>

          {/* ── Messages ────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-4 flex flex-col gap-3 bg-white"
          >
            {messages.map((m) => {
              if (m.kind === "text") {
                if (m.role === "assistant" && !m.content) return null;
                return (
                  <ChatBubble key={m.id} role={m.role}>
                    <ChatMarkdown text={m.content} isUser={m.role === "user"} />
                  </ChatBubble>
                );
              }
              if (m.kind === "cards") {
                return (
                  <div key={m.id} className="w-full">
                    <ChatCarousel items={m.items} />
                  </div>
                );
              }
              if (m.kind === "card") {
                return (
                  <div
                    key={m.id}
                    className="ml-0 mr-auto max-w-[88%] w-full"
                  >
                    {m.card.type === "tour" && (
                      <ChatInlineCard
                        type="tour"
                        title={m.card.tour.title}
                        image={m.card.tour.image}
                        rating={m.card.tour.rating}
                        meta={m.card.tour.duration}
                        href={`/passeios/${m.card.tour.slug}`}
                      />
                    )}
                    {m.card.type === "restaurant" && (
                      <ChatInlineCard
                        type="restaurant"
                        title={m.card.restaurant.name}
                        image={m.card.restaurant.image}
                        rating={m.card.restaurant.rating}
                        meta={m.card.restaurant.address.split(",")[0]}
                        href={`/restaurantes/${m.card.restaurant.slug}`}
                      />
                    )}
                  </div>
                );
              }
              if (m.kind === "timeline") {
                return (
                  <div key={m.id} className="mr-auto w-full">
                    <ChatTimeline itinerary={m.itinerary} />
                  </div>
                );
              }
              return null;
            })}

            {isTyping && (
              <ChatBubble role="assistant">
                <span className="inline-flex gap-1 items-center">
                  <Dot delay={0} />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                </span>
              </ChatBubble>
            )}
          </div>

          {/* ── Suggested prompts (clean outline chips) ─────────── */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 px-5 py-2.5 bg-white">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  trackSuggestedPrompt(p);
                  send(p);
                }}
                disabled={isTyping}
                className="flex-none rounded-full bg-white border border-[var(--color-neutral-300)] text-[var(--color-neutral-800)] text-[13px] font-medium px-4 py-2 hover:border-[var(--color-neutral-800)] disabled:opacity-40 transition-colors whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* ── Composer ────────────────────────────────────────── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 px-4 pt-2 pb-4 bg-white shrink-0"
          >
            <div className="flex-1 flex items-center h-12 rounded-full bg-[var(--color-neutral-100)] px-5 has-[:focus]:ring-2 has-[:focus]:ring-[var(--color-neutral-800)]/15 transition-shadow">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre passeios, lugares, cupons..."
                className="flex-1 bg-transparent text-[var(--color-neutral-800)] placeholder:text-[var(--color-neutral-500)] border-none outline-none"
                style={{ fontSize: "16px" }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Enviar"
              className="grid size-12 place-items-center rounded-full bg-[var(--color-neutral-800)] text-white disabled:opacity-40 transition-all"
            >
              <Icon name="arrow-up" size={20} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className="block size-1.5 rounded-full bg-[var(--color-neutral-500)]"
    />
  );
}
