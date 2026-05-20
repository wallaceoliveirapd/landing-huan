"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/atoms/Icon";
import { useStoryQueue, type StoryJob } from "@/components/providers/StoryQueueProvider";

function phaseLabel(j: StoryJob): string {
  switch (j.phase) {
    case "queued":
      return "Na fila";
    case "analyzing":
      return "Analisando…";
    case "compressing": {
      const pct = j.ratio !== undefined ? ` ${Math.round(j.ratio * 100)}%` : "";
      return `Comprimindo${pct}${j.attempt && j.attempt > 1 ? ` (passo ${j.attempt})` : ""}`;
    }
    case "uploading": {
      const pct = j.ratio !== undefined ? ` ${Math.round(j.ratio * 100)}%` : "";
      return `Enviando${pct}`;
    }
    case "publishing":
      return "Publicando…";
    case "done":
      return "Publicado";
    case "error":
      return j.error ?? "Erro";
  }
}

function phaseRatio(j: StoryJob): number | undefined {
  if (j.phase === "compressing" || j.phase === "uploading") return j.ratio;
  if (j.phase === "publishing") return 0.95;
  if (j.phase === "done") return 1;
  return undefined;
}

export function StoryQueueToast() {
  const { jobs, dismiss, clearDone } = useStoryQueue();
  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.phase !== "done" && j.phase !== "error").length;
  const finished = jobs.length - active;

  return (
    <div
      className="fixed bottom-4 right-4 z-[80] w-[320px] max-w-[calc(100vw-32px)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl bg-white shadow-xl border border-[var(--color-neutral-200)] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--color-neutral-100)]">
          <span className="text-[12px] font-medium text-[var(--color-neutral-800)] flex items-center gap-2">
            <Icon name="lucide:upload-cloud" size={14} className="text-[var(--color-brand-purple)]" />
            Fila de stories ({active}/{jobs.length})
          </span>
          {finished > 0 && (
            <button
              type="button"
              onClick={clearDone}
              className="text-[11px] text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-3 max-h-[320px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {jobs.map((j) => {
              const ratio = phaseRatio(j);
              const errored = j.phase === "error";
              const done = j.phase === "done";
              return (
                <motion.div
                  key={j.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-[var(--color-neutral-200)] p-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={
                        errored
                          ? "lucide:alert-circle"
                          : done
                            ? "lucide:check-circle"
                            : j.file.type.startsWith("video")
                              ? "lucide:video"
                              : "lucide:image"
                      }
                      size={14}
                      className={
                        errored
                          ? "text-red-600"
                          : done
                            ? "text-emerald-600"
                            : "text-[var(--color-neutral-600)]"
                      }
                    />
                    <span className="text-[12px] font-medium text-[var(--color-neutral-800)] truncate flex-1">
                      {j.file.name}
                    </span>
                    {(done || errored) && (
                      <button
                        type="button"
                        onClick={() => dismiss(j.id)}
                        aria-label="Remover"
                        className="grid size-6 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
                      >
                        <Icon name="x" size={11} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] ${errored ? "text-red-600" : "text-[var(--color-neutral-500)]"}`}
                    >
                      {phaseLabel(j)}
                    </span>
                    {j.caption && (
                      <span className="text-[10px] text-[var(--color-neutral-500)] truncate max-w-[160px]">
                        “{j.caption}”
                      </span>
                    )}
                  </div>
                  {!errored && !done && (
                    <div className="h-1 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--color-brand-purple)]"
                        animate={{ width: ratio !== undefined ? `${ratio * 100}%` : "30%" }}
                        transition={{ duration: 0.25 }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
