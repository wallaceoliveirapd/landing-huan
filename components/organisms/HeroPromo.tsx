"use client";

import { motion } from "motion/react";
import { SearchBar } from "@/components/molecules/SearchBar";
import { CategoryGrid } from "./CategoryGrid";
import { fadeUp, staggerChildren } from "@/lib/motion-presets";
import { useChat } from "@/components/providers/ChatProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { trackChatOpen } from "@/lib/analytics";

/**
 * Hero — matches Figma node 334:35954 + 334:35967.
 * White background, clean typography (Asap Medium 32px),
 * search bar + greeting copy + 3 stacked-polaroid categories.
 */
export function HeroPromo({
  title,
  subtitle,
  searchPlaceholder,
}: {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
}) {
  const chat = useChat();
  const auth = useAuth();

  function handleSearchOpen() {
    trackChatOpen();
    if (auth.requireAuth()) {
      chat.open();
    }
  }

  return (
    <section className="w-full bg-white">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren(0.08, 0.0)}
        className="mx-auto flex w-full max-w-screen-md flex-col px-6 pt-4 pb-6"
      >
        {/* Search bar — opens chat with NordestAI */}
        <motion.div variants={fadeUp}>
          <SearchBar placeholder={searchPlaceholder} onClick={handleSearchOpen} />
        </motion.div>

        {/* Headline + subtitle */}
        <motion.div variants={fadeUp} className="flex flex-col gap-2 pt-8">
          <h1 className="font-display font-medium text-[32px] leading-[1.3] text-[var(--color-neutral-800)] tracking-[-0.01em]">
            {title}
          </h1>
          <p className="font-display text-[14px] leading-[1.45] text-[var(--color-neutral-600)]">
            {subtitle}
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div variants={fadeUp} className="pt-6">
          <CategoryGrid />
        </motion.div>
      </motion.div>
    </section>
  );
}
