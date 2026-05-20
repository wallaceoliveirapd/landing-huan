"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/atoms/Icon";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const DURATION_OPTIONS = [
  { value: 1, label: "1 dia" },
  { value: 2, label: "Final de semana" },
  { value: 3, label: "3 dias" },
  { value: 5, label: "5 dias" },
  { value: 7, label: "Uma semana" },
  { value: 14, label: "Duas semanas" },
];

const BUDGET_OPTIONS = [
  { value: "baixo", label: "Econômico", desc: "Hostel, refeições simples" },
  { value: "medio", label: "Moderado", desc: "Pousada, restaurantes locais" },
  { value: "alto", label: "Confortável", desc: "Hotel, experiências premium" },
];

const TRIP_TYPE_OPTIONS = [
  { value: "praia", label: "Praia", icon: "waves" },
  { value: "natureza", label: "Natureza", icon: "trees" },
  { value: "historica", label: "Histórica", icon: "landmark" },
  { value: "aventura", label: "Aventura", icon: "mountain" },
  { value: "gastronomia", label: "Gastronomia", icon: "utensils" },
  { value: "festa", label: "Festa", icon: "party-popper" },
  { value: "familia", label: "Família", icon: "users" },
  { value: "solo", label: "Solo", icon: "user" },
  { value: "cultural", label: "Cultural", icon: "palette" },
  { value: "roadtrip", label: "Road trip", icon: "car" },
];

interface Props {
  open: boolean;
  tripId: Id<"trips">;
  initialDuration: number;
  initialGroupSize: number;
  initialBudget: string;
  initialTitle: string;
  initialType: string;
  /** Timestamp (ms). Undefined if trip has no start date set. */
  initialStartDate?: number;
  onClose: () => void;
}

function tsToIsoDate(ts: number | undefined): string {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 10);
}

export function EditTripSheet({
  open,
  tripId,
  initialDuration,
  initialGroupSize,
  initialBudget,
  initialTitle,
  initialType,
  initialStartDate,
  onClose,
}: Props) {
  useBodyScrollLock(open);
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState(initialType);
  const [duration, setDuration] = useState(initialDuration);
  const [groupSize, setGroupSize] = useState(initialGroupSize);
  const [budget, setBudget] = useState(initialBudget);
  const [startDate, setStartDate] = useState(tsToIsoDate(initialStartDate));
  const [endDate, setEndDate] = useState(() => {
    if (!initialStartDate) return "";
    const end = new Date(initialStartDate + initialDuration * 86400000);
    return end.toISOString().slice(0, 10);
  });
  const [durationOpen, setDurationOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("2");
  const [customUnit, setCustomUnit] = useState<"dias" | "semanas" | "meses">("semanas");
  const [saving, setSaving] = useState(false);

  const updateBasics = useMutation(api.trips.updateBasics);

  // Reset local state to current trip values each time sheet opens
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setType(initialType);
    setDuration(initialDuration);
    setGroupSize(initialGroupSize);
    setBudget(initialBudget);
    setStartDate(tsToIsoDate(initialStartDate));
    setEndDate(
      initialStartDate
        ? new Date(initialStartDate + initialDuration * 86400000)
            .toISOString()
            .slice(0, 10)
        : "",
    );
    setDurationOpen(false);
    setBudgetOpen(false);
    setCustomMode(false);
  }, [open, initialTitle, initialType, initialDuration, initialGroupSize, initialBudget, initialStartDate]);

  // When duration changes, keep endDate in sync if start is set
  function applyDuration(days: number) {
    setDuration(days);
    if (startDate) {
      const s = new Date(startDate).getTime();
      const end = new Date(s + days * 86400000);
      setEndDate(end.toISOString().slice(0, 10));
    }
  }

  function unitToDays(amount: number, unit: "dias" | "semanas" | "meses") {
    const factor = unit === "dias" ? 1 : unit === "semanas" ? 7 : 30;
    return Math.max(1, Math.round(amount * factor));
  }

  function resetAndClose() {
    setDurationOpen(false);
    setBudgetOpen(false);
    setCustomMode(false);
    onClose();
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const startTs = startDate ? new Date(startDate).getTime() : undefined;
      await updateBasics({
        id: tripId,
        title: title.trim() || undefined,
        type: type || undefined,
        duration,
        groupSize,
        budget,
        startDate: startTs,
      });
      toast.success("Viagem atualizada!");
      resetAndClose();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Não consegui salvar. Tente de novo.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? `${duration} dias`;
  const budgetLabel =
    BUDGET_OPTIONS.find((b) => b.value === budget)?.label ?? "Moderado";

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
                  Editar viagem
                </h3>
                <p className="text-[12px] text-[var(--color-neutral-600)] mt-0.5">
                  Ajuste duração, datas, grupo e orçamento.
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

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-3">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
                  Título da viagem
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Férias em João Pessoa"
                  className="w-full h-11 px-3 rounded-[12px] border border-[var(--color-neutral-300)] text-[14px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
                />
              </div>

              {/* Trip type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--color-neutral-600)]">
                  Tipo de viagem
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRIP_TYPE_OPTIONS.map((t) => {
                    const sel = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium border transition-colors ${sel
                          ? "bg-[var(--color-neutral-800)] text-white border-[var(--color-neutral-800)]"
                          : "bg-white text-[var(--color-neutral-700)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-600)]"
                          }`}
                      >
                        <Icon name={t.icon} size={13} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <ConfigRow
                  icon="calendar-days"
                  label="Duração"
                  value={durationLabel}
                  onClick={() => setDurationOpen((v) => !v)}
                />
                <AnimatePresence initial={false}>
                  {durationOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-3">
                        {DURATION_OPTIONS.map((d) => {
                          const sel = !customMode && duration === d.value;
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => {
                                setCustomMode(false);
                                applyDuration(d.value);
                                setDurationOpen(false);
                              }}
                              className={`rounded-full px-4 py-2 text-[13px] font-medium bg-white border transition-colors ${
                                sel
                                  ? "border-[var(--color-neutral-800)] border-2 text-[var(--color-neutral-800)]"
                                  : "border-[var(--color-neutral-300)] text-[var(--color-neutral-800)]"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMode(true);
                            const n = Math.max(1, Number(customAmount) || 1);
                            applyDuration(unitToDays(n, customUnit));
                          }}
                          className={`rounded-full px-4 py-2 text-[13px] font-medium bg-white border transition-colors ${
                            customMode
                              ? "border-[var(--color-neutral-800)] border-2 text-[var(--color-neutral-800)]"
                              : "border-[var(--color-neutral-300)] text-[var(--color-neutral-800)]"
                          }`}
                        >
                          Personalizado
                        </button>
                      </div>
                      {customMode && (
                        <div className="flex items-center gap-2 pt-3">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={customAmount}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setCustomAmount(raw);
                              const n = Number(raw);
                              if (Number.isFinite(n) && n >= 1) {
                                applyDuration(unitToDays(n, customUnit));
                              }
                            }}
                            className="w-20 h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)]"
                          />
                          <select
                            value={customUnit}
                            onChange={(e) => {
                              const u = e.target.value as "dias" | "semanas" | "meses";
                              setCustomUnit(u);
                              const n = Math.max(1, Number(customAmount) || 1);
                              applyDuration(unitToDays(n, u));
                            }}
                            className="flex-1 h-11 rounded-[12px] border border-[var(--color-neutral-300)] px-3 text-[14px] outline-none focus:border-[var(--color-neutral-800)] bg-white"
                          >
                            <option value="dias">dias</option>
                            <option value="semanas">semanas</option>
                            <option value="meses">meses</option>
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dates */}
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col gap-1.5 p-3 rounded-[16px] border border-[var(--color-neutral-300)] bg-white">
                  <span className="text-[11px] font-medium text-[var(--color-neutral-600)] uppercase tracking-wide">
                    Ida
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartDate(v);
                      if (!v) {
                        setEndDate("");
                        return;
                      }
                      const s = new Date(v).getTime();
                      const end = new Date(s + duration * 86400000);
                      setEndDate(end.toISOString().slice(0, 10));
                    }}
                    className="text-[14px] text-[var(--color-neutral-800)] outline-none bg-transparent"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1.5 p-3 rounded-[16px] border border-[var(--color-neutral-300)] bg-white">
                  <span className="text-[11px] font-medium text-[var(--color-neutral-600)] uppercase tracking-wide">
                    Volta
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEndDate(v);
                      if (v && startDate) {
                        const s = new Date(startDate).getTime();
                        const en = new Date(v).getTime();
                        const days = Math.max(1, Math.round((en - s) / 86400000));
                        if (Number.isFinite(days)) setDuration(days);
                      }
                    }}
                    className="text-[14px] text-[var(--color-neutral-800)] outline-none bg-transparent"
                  />
                </label>
              </div>

              {/* Group size */}
              <ConfigRow
                icon="users"
                label="Tamanho do grupo"
                trailing={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGroupSize((n) => Math.max(1, n - 1)); }}
                      className="grid size-7 place-items-center rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-800)]"
                      aria-label="Diminuir"
                    >
                      <Icon name="minus" size={14} />
                    </button>
                    <span className="font-display font-medium text-[14px] w-3 text-center text-[var(--color-neutral-800)]">
                      {groupSize}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGroupSize((n) => Math.min(20, n + 1)); }}
                      className="grid size-7 place-items-center rounded-full border border-[var(--color-neutral-300)] text-[var(--color-neutral-800)]"
                      aria-label="Aumentar"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                }
              />

              {/* Budget */}
              <div>
                <ConfigRow
                  icon="wallet"
                  label="Orçamento"
                  value={budgetLabel}
                  onClick={() => setBudgetOpen((v) => !v)}
                />
                <AnimatePresence initial={false}>
                  {budgetOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 pt-3">
                        {BUDGET_OPTIONS.map((b) => {
                          const sel = budget === b.value;
                          return (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => { setBudget(b.value); setBudgetOpen(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-[16px] bg-white border text-left transition-colors ${
                                sel
                                  ? "border-[var(--color-neutral-800)] border-2"
                                  : "border-[var(--color-neutral-300)]"
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-display font-medium text-[14px] text-[var(--color-neutral-800)]">{b.label}</p>
                                <p className="text-[12px] text-[var(--color-neutral-600)]">{b.desc}</p>
                              </div>
                              {sel && <Icon name="check" size={18} className="text-[var(--color-neutral-800)]" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Save button */}
            <div className="px-5 pt-2 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[15px] text-white disabled:opacity-50 transition-all"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfigRow({
  icon,
  label,
  value,
  trailing,
  onClick,
}: {
  icon: string;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-[16px] border border-[var(--color-neutral-300)] bg-white text-left ${interactive ? "cursor-pointer" : ""}`}
    >
      <Icon name={icon} size={20} className="text-[var(--color-neutral-800)] shrink-0" />
      <p className="flex-1 font-display font-medium text-[14px] text-[var(--color-neutral-800)]">
        {label}
      </p>
      {trailing ?? (
        <>
          {value && (
            <span className="font-display text-[14px] text-[var(--color-neutral-600)]">
              {value}
            </span>
          )}
          <Icon name="chevron-right" size={16} className="text-[var(--color-neutral-600)] ml-1" />
        </>
      )}
    </div>
  );
}
