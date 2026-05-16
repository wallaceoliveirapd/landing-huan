"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { SimpleMarkdown } from "@/components/molecules/SimpleMarkdown";
import { bottomSheetSpring } from "@/lib/motion-presets";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  source: string;
};

/**
 * Reusable bottom sheet for legal documents (terms / privacy).
 *
 * Renders provided markdown source inside a scrollable sheet with a
 * sticky header and a sticky "Entendi" button at the bottom.
 *
 * Drag-down to dismiss is enabled.
 */
export function LegalSheet({ open, onClose, title, source }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/20"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[92vh] rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <span className="h-1 w-12 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-2 pb-3 shrink-0 border-b border-[var(--color-neutral-100)]">
              <h2 className="font-display font-medium text-[20px] text-[var(--color-neutral-800)]">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)]"
              >
                <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
              </button>
            </div>

            {/* Body — scrollable markdown */}
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <SimpleMarkdown source={source} />
            </div>

            {/* Footer — sticky Entendi button */}
            <div className="px-6 pt-3 pb-6 shrink-0 border-t border-[var(--color-neutral-100)] bg-white">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px]"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
