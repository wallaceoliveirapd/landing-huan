"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCategoriesSheet } from "@/components/providers/CategoriesSheetProvider";
import { Icon } from "@/components/atoms/Icon";
import { CATEGORIES } from "@/lib/categories";
import { bottomSheetSpring } from "@/lib/motion-presets";

export function CategoriesBottomSheet() {
  const sheet = useCategoriesSheet();

  return (
    <AnimatePresence>
      {sheet.isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={sheet.close}
            className="fixed inset-0 z-40 bg-black/20"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Todas as categorias"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) sheet.close();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden"
          >
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1 w-12 rounded-full bg-black/15" />
            </div>

            <header className="flex items-center justify-between px-6 pt-2 pb-4">
              <div>
                <h2 className="font-display font-medium text-[22px] text-[var(--color-ink)]">
                  Todas as categorias
                </h2>
                <p className="text-[13px] text-[var(--color-neutral-600)]">
                  Explore tudo que separamos para você em João Pessoa.
                </p>
              </div>
            </header>

            <div className="overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="grid grid-cols-2 gap-3"
              >
                {CATEGORIES.map((c) => (
                  <motion.li
                    key={c.key}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Link
                      href={c.href}
                      onClick={sheet.close}
                      className="group flex h-full flex-col gap-2 rounded-card border border-black/10 bg-white p-5 hover:border-[var(--color-neutral-800)] hover: transition-all"
                    >
                      <span className="grid size-12 place-items-center rounded-full bg-[#F2F4F5] text-[#323439] group-hover:scale-110 transition-transform">
                        <Icon name={c.icon ?? "lucide:grip"} size={22} />
                      </span>
                      <span className="font-display font-medium text-[15px] text-[var(--color-ink)]">
                        {c.label}
                      </span>
                      <span className="text-[12px] leading-[1.4] text-[var(--color-neutral-600)]">
                        {c.description}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
