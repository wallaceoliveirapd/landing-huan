"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { useStoryQueue } from "@/components/providers/StoryQueueProvider";

type CaptionAlign = "top" | "center" | "bottom";

type ReactionItem = { emoji: string; count: number };

function normalizeReactions(rc: unknown): ReactionItem[] {
  if (Array.isArray(rc)) return rc as ReactionItem[];
  if (rc && typeof rc === "object") {
    return Object.entries(rc as Record<string, number>).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  }
  return [];
}

export default function StoriesAdminPage() {
  const stories = useQuery(api.stories.adminListAll, {});
  const deleteStory = useMutation(api.stories.adminDelete);
  const { enqueue } = useStoryQueue();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [align, setAlign] = useState<CaptionAlign>("bottom");
  const [color, setColor] = useState("#FFFFFF");
  const [bg, setBg] = useState("#00000080");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit() {
    if (!file) {
      toast.error("Escolha um arquivo");
      return;
    }
    enqueue({
      file,
      caption: caption.trim() || undefined,
      captionStyle: caption.trim() ? { color, bg, align } : undefined,
    });
    toast.success("Adicionado à fila");
    setFile(null);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar este story agora?")) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deleteStory({ id: id as any });
      toast.success("Story removido");
    } catch {
      toast.error("Falha ao remover");
    }
  }

  function formatTimeLeft(expiresAt: number): string {
    const ms = expiresAt - Date.now();
    if (ms <= 0) return "expirado";
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rest = mins % 60;
    return `${hrs}h ${rest}m`;
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-700">
          <Icon name="lucide:image-plus" size={18} />
        </span>
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--color-neutral-800)]">
            Stories
          </h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Stories expiram automaticamente em 24h. Imagens e vídeos até 50 MB.
          </p>
        </div>
      </div>

      {/* Upload form */}
      <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-4">
        <h2 className="text-sm font-medium text-[var(--color-neutral-800)]">
          Publicar novo story
        </h2>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[var(--color-neutral-700)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-neutral-800)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />

        {file && (
          <div className="rounded-xl border border-[var(--color-neutral-200)] p-3 flex items-center gap-3">
            <Icon
              name={file.type.startsWith("video") ? "lucide:video" : "lucide:image"}
              size={16}
              className="text-[var(--color-neutral-600)]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--color-neutral-800)] truncate">
                {file.name}
              </p>
              <p className="text-[11px] text-[var(--color-neutral-500)]">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="grid size-7 place-items-center rounded-full hover:bg-[var(--color-neutral-100)]"
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
            Texto sobre a imagem (opcional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: Pôr do sol em Jacaré 🌅"
            maxLength={200}
            className="min-h-[72px] rounded-[12px] border border-[var(--color-neutral-300)] px-3 py-2 text-[14px] outline-none focus:border-[var(--color-neutral-800)] bg-white resize-y"
          />
        </div>

        {caption.trim() && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-neutral-500)]">Posição</span>
              <div className="flex gap-1">
                {(["top", "center", "bottom"] as CaptionAlign[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlign(a)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                      align === a
                        ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                        : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]"
                    }`}
                  >
                    {a === "top" ? "Topo" : a === "center" ? "Centro" : "Base"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-neutral-500)]">Texto</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border border-[var(--color-neutral-300)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-neutral-500)]">Fundo</span>
              <input
                type="color"
                value={bg.slice(0, 7)}
                onChange={(e) => setBg(`${e.target.value}80`)}
                className="h-8 w-12 rounded cursor-pointer border border-[var(--color-neutral-300)]"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file}
          className="self-start inline-flex items-center gap-2 rounded-full bg-[var(--color-neutral-800)] text-white px-5 py-3 text-[13px] font-medium disabled:opacity-50"
        >
          <Icon name="lucide:upload" size={14} />
          Publicar
        </button>
      </div>

      {/* Active stories list */}
      <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--color-neutral-800)]">
          Stories publicados
        </h2>
        {stories === undefined ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Carregando…</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-500)]">
            Nenhum story ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stories.map((s) => (
              <div
                key={s._id}
                className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-[var(--color-neutral-300)] group"
              >
                {s.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.url}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <video
                    src={s.url}
                    muted
                    playsInline
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent text-white text-[11px] flex flex-col gap-1.5">
                  {(() => {
                    const reactions = normalizeReactions(s.reactionCounts);
                    const total = reactions.reduce((sum, r) => sum + r.count, 0);
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span>👁 {s.viewCount ?? 0}</span>
                          <span>💬 {total}</span>
                        </div>
                        {reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reactions
                              .slice()
                              .sort((a, b) => b.count - a.count)
                              .map((r) => (
                                <span
                                  key={r.emoji}
                                  className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm px-1.5 py-0.5 text-[10px]"
                                >
                                  <span className="text-[12px] leading-none">{r.emoji}</span>
                                  <span className="font-medium">{r.count}</span>
                                </span>
                              ))}
                          </div>
                        )}
                        <p className="opacity-80">{formatTimeLeft(s.expiresAt)}</p>
                      </>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s._id)}
                  aria-label="Apagar"
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="trash-2" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

