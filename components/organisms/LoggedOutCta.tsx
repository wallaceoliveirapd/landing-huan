"use client";

import { motion } from "motion/react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Icon } from "@/components/atoms/Icon";
import { SectionSpacer } from "@/components/organisms/SectionSpacer";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";

/**
 * Logged-out CTA — Figma node 334:36793.
 * Hidden if the user is authenticated.
 *
 * Title: "Entre ou cria sua conta para aproveitar mais" (24px medium)
 * Below: horizontal scroll of small benefit cards (180px each)
 */
const BENEFITS = [
  { icon: "heart", label: "Favorite seus passeios favoritos" },
  { icon: "ticket-percent", label: "Acesse cupons exclusivos" },
  { icon: "map", label: "Crie e salve suas viagens" },
  { icon: "sparkles", label: "Converse com o NordestAI" },
];

export function LoggedOutCta() {
  const auth = useAuth();
  if (auth.isLoading || auth.isAuthenticated) return null;

  return (
    <>
    <SectionSpacer />
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerChildren(0.08, 0)}
      className="w-full bg-white"
    >
      <div className="mx-auto flex w-full max-w-screen-md flex-col px-6 py-8">
        <motion.h2
          variants={fadeUp}
          className="font-display font-medium text-[24px] leading-tight text-[var(--color-neutral-800)] pb-6"
        >
          Entre ou cria sua conta para aproveitar mais
        </motion.h2>

        <motion.div variants={fadeUp}>
          <div className="-mx-6 px-6 no-scrollbar carousel-smooth flex gap-4 overflow-x-auto pb-2 -mb-2">
            {BENEFITS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={auth.openAuthModal}
                className="w-[180px] flex-none p-6 rounded-[24px] border border-[var(--color-neutral-300)] bg-white text-left flex flex-col gap-4 transition-colors hover:border-[var(--color-neutral-800)]"
              >
                <Icon
                  name={b.icon}
                  size={22}
                  className="text-[var(--color-neutral-800)]"
                />
                <p className="font-display font-medium text-[14px] leading-[1.4] text-black">
                  {b.label}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
    </>
  );
}
