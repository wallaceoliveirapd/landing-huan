"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { toProxyUrl } from "@/lib/imageUpload";

type Tab = "tour" | "restaurant" | "praia" | "nightlife" | "dica" | "custom";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "tour", label: "Passeios", icon: "compass" },
  { key: "restaurant", label: "Restaurantes", icon: "utensils" },
  { key: "praia", label: "Praias", icon: "waves" },
  { key: "nightlife", label: "Vida noturna", icon: "moon" },
  { key: "dica", label: "Dicas", icon: "lightbulb" },
  { key: "custom", label: "Outro", icon: "plus" },
];

const KIND_TO_API: Record<Tab, "tour" | "restaurant" | "praia" | "nightlife" | "dica" | null> = {
  tour: "tour",
  restaurant: "restaurant",
  praia: "praia",
  nightlife: "nightlife",
  dica: "dica",
  custom: null,
};

interface Props {
  open: boolean;
  tripId: Id<"trips">;
  day: number;
  /** City name from trip.destination ("Cidade, Estado") used to filter results. */
  city?: string;
  onClose: () => void;
}

export function AddActivitySheet({ open, tripId, day, city, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("tour");
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customKind, setCustomKind] = useState<"tour" | "restaurant" | "praia" | "nightlife" | "activity">("activity");
  const [saving, setSaving] = useState(false);

  const addActivity = useMutation(api.trips.addActivity);

  const apiKind = KIND_TO_API[tab];
  const listArgs = useMemo(
    () => ({ activeOnly: true as const, city: city || undefined }),
    [city],
  );
  const tours = useQuery(api.tours.list, apiKind === "tour" ? listArgs : "skip");
  const restaurants = useQuery(
    api.restaurants.list,
    apiKind === "restaurant" ? listArgs : "skip",
  );
  const praias = useQuery(api.praias.list, apiKind === "praia" ? listArgs : "skip");
  const nightlife = useQuery(
    api.nightlife.list,
    apiKind === "nightlife" ? listArgs : "skip",
  );
  const dicas = useQuery(api.dicas.list, apiKind === "dica" ? listArgs : "skip");

  const items = useMemo(() => {
    if (apiKind === "tour") return tours;
    if (apiKind === "restaurant") return restaurants;
    if (apiKind === "praia") return praias;
    if (apiKind === "nightlife") return nightlife;
    if (apiKind === "dica") return dicas;
    return null;
  }, [apiKind, tours, restaurants, praias, nightlife, dicas]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return (items as Array<Record<string, unknown>>).filter((it) => {
      const text = `${String(it.name ?? it.title ?? "")} ${String(it.shortDesc ?? "")}`;
      return text.toLowerCase().includes(q);
    });
  }, [items, search]);

  function resetAndClose() {
    setTab("tour");
    setSearch("");
    setTime("");
    setCustomTitle("");
    setCustomUrl("");
    setCustomNote("");
    setCustomKind("activity");
    onClose();
  }

  async function handlePickDbItem(
    kind: "tour" | "restaurant" | "praia" | "nightlife" | "dica",
    item: Record<string, unknown>,
  ) {
    if (saving) return;
    setSaving(true);
    try {
      const title = String(item.name ?? item.title ?? "Item");
      await addActivity({
        tripId,
        day,
        activity: {
          source: "db",
          kind,
          timeOfDay: timeToTimeOfDay(time),
          title,
          itemId: String(item._id),
          note: item.shortDesc ? String(item.shortDesc) : undefined,
          time: time || undefined,
        },
      });
      toast.success("Adicionado ao roteiro!");
      resetAndClose();
    } catch (err) {
      console.error(err);
      toast.error("Não consegui adicionar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustom() {
    if (saving) return;
    const title = customTitle.trim();
    if (!title) {
      toast.error("Coloca um título pra essa atividade.");
      return;
    }
    setSaving(true);
    try {
      await addActivity({
        tripId,
        day,
        activity: {
          source: "custom",
          kind: customKind,
          timeOfDay: timeToTimeOfDay(time),
          title,
          note: customNote.trim() || undefined,
          customUrl: customUrl.trim() || undefined,
          time: time || undefined,
        },
      });
      toast.success("Adicionado ao roteiro!");
      resetAndClose();
    } catch (err) {
      console.error(err);
      toast.error("Não consegui adicionar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[70] bg-black/20"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[80] max-h-[88vh] rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)] flex flex-col"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
              <div>
                <h3 className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
                  Adicionar ao dia {day}
                </h3>
                <p className="text-[12px] text-[var(--color-neutral-600)] mt-0.5">
                  {city
                    ? `Itens em ${city}. Aba "Outro" pra adicionar algo livre.`
                    : "Escolha algo do nosso guia ou adicione um item próprio."}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0"
              >
                <Icon name="x" size={16} className="text-[var(--color-neutral-800)]" />
              </button>
            </div>

            {/* Time picker */}
            <div className="px-5 pb-3 shrink-0">
              <div className="rounded-[16px] bg-[var(--color-neutral-100)] p-3 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-white shrink-0">
                  <Icon name="clock" size={16} className="text-[var(--color-neutral-800)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--color-neutral-800)]">
                    Horário
                  </p>
                  <p className="text-[11px] text-[var(--color-neutral-600)]">
                    Opcional, pode definir depois também.
                  </p>
                </div>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-9 px-3 rounded-[10px] bg-white border border-[var(--color-neutral-300)] text-[14px] font-medium text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)]"
                />
                {time && (
                  <button
                    type="button"
                    onClick={() => setTime("")}
                    aria-label="Limpar horário"
                    className="grid size-8 place-items-center rounded-full bg-white border border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-800)] transition-colors"
                  >
                    <Icon name="x" size={12} className="text-[var(--color-neutral-700)]" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="pl-5 pb-3 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex gap-2 pr-5">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      setSearch("");
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${tab === t.key
                        ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                        : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]"
                      }`}
                  >
                    <Icon name={t.icon} size={12} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search (only for DB tabs) */}
            {tab !== "custom" && (
              <div className="px-5 pb-2 shrink-0">
                <div className="relative">
                  <Icon
                    name="search"
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] pointer-events-none"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Buscar em ${TABS.find((t) => t.key === tab)?.label.toLowerCase() ?? ""}...`}
                    className="w-full h-10 pl-9 pr-3 rounded-full border border-[var(--color-neutral-300)] text-[13px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
                  />
                </div>
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
              {tab === "custom" ? (
                <CustomForm
                  title={customTitle}
                  url={customUrl}
                  note={customNote}
                  kind={customKind}
                  onTitle={setCustomTitle}
                  onUrl={setCustomUrl}
                  onNote={setCustomNote}
                  onKind={setCustomKind}
                  onSave={handleSaveCustom}
                  saving={saving}
                />
              ) : filtered === undefined ? (
                <div className="flex flex-col gap-2 pt-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[68px] rounded-[14px] bg-[var(--color-neutral-100)] animate-pulse" />
                  ))}
                </div>
              ) : filtered === null || filtered.length === 0 ? (
                <p className="text-[12px] text-[var(--color-neutral-500)] text-center py-8">
                  {city
                    ? `Nenhum item cadastrado em ${city} ainda.`
                    : "Nenhum item encontrado."}
                </p>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {(filtered as Array<Record<string, unknown>>).map((item) => (
                    <button
                      key={String(item._id)}
                      type="button"
                      disabled={saving}
                      onClick={() => apiKind && handlePickDbItem(apiKind, item)}
                      className="flex items-center gap-3 p-2 rounded-[14px] border border-[var(--color-neutral-200)] bg-white hover:border-[var(--color-neutral-800)] transition-colors disabled:opacity-50"
                    >
                      <div className="relative size-[60px] rounded-[10px] overflow-hidden bg-[var(--color-neutral-100)] shrink-0">
                        {item.image || item.cover ? (
                          <Image
                            src={toProxyUrl(String(item.image ?? item.cover))}
                            alt={String(item.name ?? item.title ?? "")}
                            fill
                            sizes="60px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-display font-medium text-[13px] text-[var(--color-neutral-800)] line-clamp-1">
                          {String(item.name ?? item.title ?? "")}
                        </p>
                        <p className="text-[11px] text-[var(--color-neutral-600)] line-clamp-1 mt-0.5">
                          {String(item.shortDesc ?? item.excerpt ?? "")}
                        </p>
                      </div>
                      <Icon name="plus" size={14} className="text-[var(--color-neutral-600)] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const CUSTOM_KINDS: { value: "tour" | "restaurant" | "praia" | "nightlife" | "activity"; label: string; icon: string }[] = [
  { value: "activity",   label: "Atividade",    icon: "calendar"  },
  { value: "tour",       label: "Passeio",      icon: "compass"   },
  { value: "restaurant", label: "Restaurante",  icon: "utensils"  },
  { value: "praia",      label: "Praia",        icon: "waves"     },
  { value: "nightlife",  label: "Vida noturna", icon: "moon-star" },
];

function CustomForm({
  title,
  url,
  note,
  kind,
  onTitle,
  onUrl,
  onNote,
  onKind,
  onSave,
  saving,
}: {
  title: string;
  url: string;
  note: string;
  kind: "tour" | "restaurant" | "praia" | "nightlife" | "activity";
  onTitle: (v: string) => void;
  onUrl: (v: string) => void;
  onNote: (v: string) => void;
  onKind: (v: "tour" | "restaurant" | "praia" | "nightlife" | "activity") => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-[var(--color-neutral-700)]">Categoria</span>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => onKind(k.value)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
                kind === k.value
                  ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                  : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]"
              }`}
            >
              <Icon name={k.icon} size={12} />
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-[var(--color-neutral-700)]">Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Ex: Almoço no restaurante X"
          className="h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-[var(--color-neutral-700)]">Link (opcional)</span>
        <input
          type="url"
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="https://..."
          className="h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-[var(--color-neutral-700)]">Descrição (opcional)</span>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={3}
          placeholder="Detalhes que você quer lembrar..."
          className="rounded-[12px] border border-[var(--color-neutral-300)] px-3 py-2 text-[14px] outline-none focus:border-[var(--color-neutral-800)] resize-none"
        />
      </label>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !title.trim()}
        className="h-11 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[14px] disabled:opacity-50"
      >
        {saving ? "Adicionando..." : "Adicionar ao roteiro"}
      </button>
    </div>
  );
}

function timeToTimeOfDay(time: string): string {
  if (!time) return "afternoon";
  const h = Number(time.split(":")[0]);
  if (!Number.isFinite(h)) return "afternoon";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
