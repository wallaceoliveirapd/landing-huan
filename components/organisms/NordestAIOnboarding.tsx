"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";

const FEATURES = [
  {
    icon: "message-circle",
    title: "10 mensagens por dia, grátis",
    desc: "Cada conta tem 10 conversas diárias comigo. Esse limite mantém o app gratuito durante a fase de testes.",
  },
  {
    icon: "map-pin",
    title: "Conheça lugares incríveis",
    desc: "Praias, restaurantes, atrações culturais e dicas locais, tudo selecionado pra você.",
  },
  {
    icon: "ticket-percent",
    title: "Cupons e ofertas exclusivas",
    desc: "Te aviso dos descontos dos nossos parceiros enquanto a gente conversa.",
  },
  {
    icon: "messages-square",
    title: "Tire qualquer dúvida",
    desc: "Sobre o que comer, onde ficar, como chegar, é só perguntar.",
  },
];

/**
 * Fullscreen onboarding shown when a logged-out user taps the NordestAI
 * chat button. Explains what the assistant can do and prompts login.
 */
export function NordestAIOnboarding({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sobre o NordestAI"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-white flex flex-col"
        >
          {/* Header */}
          <div
            className="flex items-center justify-end px-5 shrink-0"
            style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)]"
            >
              <Icon name="x" size={18} className="text-[var(--color-neutral-800)]" />
            </button>
          </div>

          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="flex-1 overflow-y-auto px-6 pt-4 pb-32"
          >
            {/* Hero */}
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <motion.div
                animate={{
                  scale: [1, 1.06, 1],
                  rotate: [0, -4, 4, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative size-24 rounded-full bg-[var(--color-brand-yellow)] overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[var(--color-brand-yellow)] opacity-40 animate-ping"
                  style={{ animationDuration: "2.5s" }}
                />
                <Image
                  src="/images/avatar.png"
                  alt="NordestAI"
                  fill
                  sizes="96px"
                  className="relative object-cover"
                  priority
                />
              </motion.div>

              <div className="flex flex-col gap-2 mt-2">
                <h1 className="font-display font-medium text-[28px] leading-[1.15] text-[var(--color-neutral-800)]">
                  Oi! Eu sou o Huan
                </h1>
                <p className="font-display text-[14px] leading-[1.5] text-[var(--color-neutral-600)] max-w-[32ch] mx-auto">
                  Seu agente de viagem pelo Nordeste. Me conta o que você procura e eu te ajudo do roteiro até a reserva.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-col">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                  className={`flex items-start gap-4 py-5 ${i !== FEATURES.length - 1
                      ? "border-b border-[var(--color-neutral-100)]"
                      : ""
                    }`}
                >
                  <div className="grid size-11 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0">
                    <Icon name={f.icon} size={20} className="text-[var(--color-neutral-800)]" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="font-display font-medium text-[15px] leading-[1.2] text-[var(--color-neutral-800)]">
                      {f.title}
                    </p>
                    <p className="font-display text-[13px] leading-[1.45] text-[var(--color-neutral-600)]">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <div className="fixed bottom-0 inset-x-0 p-5 bg-white border-t border-[var(--color-neutral-200)] flex flex-col gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="h-12 w-full rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[15px] text-white transition-all"
            >
              Entrar ou criar conta
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-full font-display font-medium text-[13px] text-[var(--color-neutral-600)]"
            >
              Agora não
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
