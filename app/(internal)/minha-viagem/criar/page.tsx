"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/atoms/Icon";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { AiLoader } from "@/components/ui/ai-loader";
import { getErrorCode, logAndGetMessage } from "@/lib/errors";
import {
  searchCities,
  type NordesteCity,
} from "@/lib/nordeste-cities";
import dynamic from "next/dynamic";
import { gtmTripCreated } from "@/lib/gtm";

/** Maximum number of trip plans per user */
export const TRIP_LIMIT = 3;

const MapView = dynamic(
  () => import("@/components/molecules/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[var(--color-neutral-100)] animate-pulse" />
    ),
  },
);

// ─── Trip types (Lucide icons, stroke 1.7) ──────────────────────────────────
const TRIP_TYPES = [
  { key: "praia", label: "Praia", icon: "waves" },
  { key: "historica", label: "Cidade Histórica", icon: "building-2" },
  { key: "natureza", label: "Natureza", icon: "trees" },
  { key: "aventura", label: "Aventura", icon: "mountain-snow" },
  { key: "gastronomia", label: "Gastronomia", icon: "utensils-crossed" },
  { key: "festa", label: "Festa", icon: "party-popper" },
  { key: "roadtrip", label: "Road Trip", icon: "car-front" },
  { key: "familia", label: "Família", icon: "users" },
  { key: "solo", label: "Solo", icon: "user" },
  { key: "cultural", label: "Cultural", icon: "palette" },
] as const;

type TripTypeKey = (typeof TRIP_TYPES)[number]["key"];

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

const ONBOARDING_STEPS = [
  {
    icon: "rocket",
    title: "Conta sobre sua viagem",
    desc: "Compartilhe o estilo, o destino e quantos dias você pretende ficar no Nordeste.",
  },
  {
    icon: "sparkles",
    title: "A IA monta seu roteiro",
    desc: "O NordestAI sugere passeios, restaurantes e dicas reais, com endereço e link do Google Maps.",
  },
  {
    icon: "map-pin-check",
    title: "Tudo pronto pra embarcar",
    desc: "Sua viagem fica salva no seu perfil, pronta pra consultar a qualquer momento.",
  },
  {
    icon: "cloud-sun",
    title: "Previsão do clima inclusa",
    desc: "Temperatura, chuva e dica de mala pra cada dia, tempo real até 16 dias antes.",
  },
  {
    icon: "clock",
    title: "Horários por atividade",
    desc: "Defina o horário de cada item do roteiro pra organizar bem o dia.",
  },
  {
    icon: "pencil",
    title: "Customize do seu jeito",
    desc: "Depois da IA gerar, adicione, remova ou reordene passeios, restaurantes, praias e dicas.",
  },
];

// ─── Step indicator ─────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 px-6 pt-3 pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full overflow-hidden bg-[var(--color-neutral-200)]"
        >
          <motion.div
            className="h-full rounded-full bg-[var(--color-neutral-800)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i <= current ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ originX: 0 }}
          />
        </div>
      ))}
    </div>
  );
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const pageVariants = {
  initial: (dir: number) => ({ x: dir > 0 ? "40px" : "-40px", opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: (dir: number) => ({
    x: dir > 0 ? "-40px" : "40px",
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

// ─── Selectable square card ────────────────────────────────────────────────
function SelectableCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex flex-col items-start justify-between bg-white rounded-[16px] text-left transition-colors p-5 h-[120px] border ${selected
        ? "border-[var(--color-neutral-800)] border-2"
        : "border-[var(--color-neutral-300)]"
        }`}
    >
      <Icon name={icon} size={28} className="text-[var(--color-neutral-800)]" />
      <p className="font-display font-medium text-[15px] leading-tight text-[var(--color-neutral-800)]">
        {label}
      </p>
    </motion.button>
  );
}

// ─── Config row (icon + label + value + chevron) ───────────────────────────
// Uses a <div role="button"> wrapper so child interactive elements (like the
// group-size +/- buttons in `trailing`) don't violate HTML's no-nested-button
// rule. Acts as a button only when onClick is provided.
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
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-[16px] border border-[var(--color-neutral-300)] bg-white text-left ${interactive ? "cursor-pointer" : ""
        }`}
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

// ─── Page ──────────────────────────────────────────────────────────────────
export default function CriarViagemPage() {
  const router = useRouter();
  const auth = useAuth();
  const createTrip = useMutation(api.trips.create);
  const generateItinerary = useAction(api.itineraryGen.generate);
  const myTrips = useQuery(api.trips.myTrips);

  // Skeleton-first: don't display fake counts while loading.
  const tripsLoading = myTrips === undefined;
  const tripsCount = myTrips?.length;
  const reachedLimit = tripsCount !== undefined && tripsCount >= TRIP_LIMIT;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [limitError, setLimitError] = useState(false);

  const [tripType, setTripType] = useState<TripTypeKey | "">("");
  const [city, setCity] = useState<NordesteCity | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NordesteCity[]>([]);
  const [duration, setDuration] = useState<number>(3);
  const [groupSize, setGroupSize] = useState<number>(2);
  const [budget, setBudget] = useState<string>("medio");
  const [tripTitle, setTripTitle] = useState("");
  const [durationOpen, setDurationOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>("");
  // Custom duration controls
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("2");
  const [customUnit, setCustomUnit] = useState<"dias" | "semanas" | "meses">("semanas");

  function unitToDays(amount: number, unit: "dias" | "semanas" | "meses") {
    const factor = unit === "dias" ? 1 : unit === "semanas" ? 7 : 30;
    return Math.max(1, Math.round(amount * factor));
  }

  function applyDuration(days: number) {
    setDuration(days);
    if (startDate) {
      const s = new Date(startDate).getTime();
      const end = new Date(s + days * 86400000);
      const iso = end.toISOString().slice(0, 10);
      setEndDate(iso);
    }
  }
  const searchRef = useRef<HTMLInputElement>(null);

  // 5 steps total: onboarding (0) + 4 actual steps (1..4)
  const TOTAL_STEPS = 5;
  const isOnboarding = step === 0;

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) auth.openAuthModal();
  }, [auth.isLoading, auth.isAuthenticated]);

  useEffect(() => {
    if (city && tripType) {
      const typeLabel = TRIP_TYPES.find((t) => t.key === tripType)?.label ?? "";
      setTripTitle(`${typeLabel} em ${city.name}`);
    }
  }, [city, tripType]);

  useEffect(() => {
    setSuggestions(searchCities(cityQuery));
  }, [cityQuery]);

  function goNext() {
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function goBack() {
    if (step === 0) { router.back(); return; }
    setDir(-1);
    setStep((s) => s - 1);
  }

  async function handleSave() {
    if (!city || !tripType || saving) return;
    if (reachedLimit) {
      setLimitError(true);
      return;
    }
    setSaving(true);
    try {
      const startTs = startDate ? new Date(startDate).getTime() : undefined;
      const tripId = await createTrip({
        title: tripTitle || `Viagem a ${city.name}`,
        destination: `${city.name}, ${city.state}`,
        lat: city.lat,
        lng: city.lng,
        type: tripType,
        duration,
        groupSize,
        budget,
        startDate: startTs,
      });
      // Wait for the itinerary to be generated so the detail page already
      // has the days ready when the user lands. The fullscreen AiLoader
      // covers the whole wait, typically 5-15s for Gemini + OSM.
      try {
        await generateItinerary({ tripId });
      } catch (e) {
        console.warn("Itinerary generation failed:", e);
        toast.warning("Sua viagem foi criada, mas o roteiro automático falhou. Você pode regenerar na tela da viagem.");
        // Even on failure we still navigate, detail page will show
        // a fallback or empty state.
      }
      if (city && tripType) {
        gtmTripCreated({
          trip_type: tripType,
          trip_city: `${city.name}, ${city.state}`,
          trip_duration: duration,
        });
      }
      router.push(`/minha-viagem/${tripId}`);
    } catch (err) {
      setSaving(false);
      if (getErrorCode(err) === "TRIP_LIMIT_REACHED") {
        setLimitError(true);
      } else {
        toast.error(logAndGetMessage("trip.create", err, "Não consegui criar sua viagem agora."));
      }
    }
  }

  // canNext per real step (1..4); onboarding (0) always advances
  const canNext = [
    () => true,        // 0 onboarding
    () => !!tripType,  // 1 trip type
    () => !!city,      // 2 destination
    () => true,        // 3 basics
    () => true,        // 4 summary
  ][step]?.() ?? true;

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? `${duration} dias`;
  const budgetLabel =
    BUDGET_OPTIONS.find((b) => b.value === budget)?.label ?? "Moderado";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Fullscreen AI loader while the itinerary is being generated.
          Sits on top of everything (z-100) so the user can't interact
          with the wizard mid-save. */}
      <AiLoader show={saving} />

      {/* ── Header, close icon + title ─────────────────────────── */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={goBack}
          aria-label={step === 0 ? "Fechar" : "Voltar"}
          className="grid size-10 place-items-center rounded-full bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] transition-colors"
        >
          <Icon
            name={step === 0 ? "x" : "arrow-left"}
            size={20}
            className="text-[var(--color-neutral-800)]"
          />
        </button>
        {!isOnboarding && (
          <span className="font-display font-medium text-[16px] text-[var(--color-neutral-800)]">
            Criar viagem
          </span>
        )}
      </div>

      {!isOnboarding && <StepBar current={step - 1} total={TOTAL_STEPS - 1} />}

      {/* ── Steps ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          {/* Step 0: Onboarding ─────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step-onboarding"
              custom={dir}
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="absolute inset-0 overflow-y-auto px-6 pt-6 pb-40 flex flex-col"
            >
              <div>
                <h1 className="font-display font-medium text-[28px] leading-[1.2] text-[var(--color-neutral-800)]">
                  É fácil planejar sua viagem
                </h1>
                <p className="font-display text-[14px] leading-[1.5] text-[var(--color-neutral-600)] mt-2">
                  Em 3 passos a gente monta um roteiro pessoal pelo Nordeste pra você.
                </p>
              </div>

              {/* Trip limit indicator, skeleton-first to avoid 0/3 → N/3 flash */}
              {tripsLoading ? (
                <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-[16px] border border-[var(--color-neutral-300)] bg-white">
                  <div className="size-[18px] rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-32 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
                    <div className="h-2.5 w-48 rounded-full bg-[var(--color-neutral-100)] animate-pulse" />
                  </div>
                </div>
              ) : (
                <div
                  className={`mt-5 flex items-center gap-3 px-4 py-3 rounded-[16px] border ${reachedLimit
                    ? "border-red-300 bg-red-50"
                    : "border-[var(--color-neutral-300)] bg-white"
                    }`}
                >
                  <Icon
                    name={reachedLimit ? "alert-circle" : "info"}
                    size={18}
                    className={reachedLimit ? "text-red-600" : "text-[var(--color-neutral-800)]"}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-medium text-[13px] leading-[1.3] text-[var(--color-neutral-800)]">
                      {reachedLimit
                        ? "Você atingiu o limite de viagens"
                        : `${tripsCount} de ${TRIP_LIMIT} viagens criadas`}
                    </p>
                    <p className="text-[12px] text-[var(--color-neutral-600)]">
                      {reachedLimit
                        ? `Cada conta pode ter até ${TRIP_LIMIT} viagens. Exclua uma para criar outra.`
                        : `Cada conta pode ter até ${TRIP_LIMIT} viagens.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-0 mt-6">
                {ONBOARDING_STEPS.map((s, i) => (
                  <div
                    key={s.title}
                    className={`flex items-start gap-4 py-5 ${i !== ONBOARDING_STEPS.length - 1
                      ? "border-b border-[var(--color-neutral-100)]"
                      : ""
                      }`}
                  >
                    <div className="grid size-12 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0">
                      <Icon
                        name={s.icon}
                        size={22}
                        className="text-[var(--color-neutral-800)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-display font-medium text-[15px] leading-[1.2] text-[var(--color-neutral-800)]">
                        {s.title}
                      </p>
                      <p className="font-display text-[13px] leading-[1.45] text-[var(--color-neutral-600)]">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Trip type ──────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step-type"
              custom={dir}
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="absolute inset-0 overflow-y-auto px-6 pt-6 pb-40"
            >
              <h1 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)]">
                Qual é o estilo da sua viagem?
              </h1>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {TRIP_TYPES.map((t) => (
                  <SelectableCard
                    key={t.key}
                    icon={t.icon}
                    label={t.label}
                    selected={tripType === t.key}
                    onClick={() => setTripType(t.key)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Destination, FULLSCREEN MAP ───────────── */}
          {step === 2 && (
            <motion.div
              key="step-dest"
              custom={dir}
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="absolute inset-0 flex flex-col"
            >
              {/* Title block */}
              <div className="px-6 pt-4 pb-4 shrink-0">
                <h1 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)]">
                  Para onde você vai?
                </h1>
                <p className="text-[14px] text-[var(--color-neutral-600)] mt-1">
                  Escolha uma cidade no Nordeste do Brasil.
                </p>
              </div>

              {/* Map area (edge-to-edge) + floating search overlay.
                  pb leaves room for the fixed bottom buttons so the mapbox
                  attribution doesn't overlap. */}
              <div className="relative flex-1 overflow-hidden bg-[var(--color-neutral-100)] pb-[96px]">
                {/* Default view: full Northeast region (center ≈ Pernambuco/Bahia border, zoom 4.6).
                    When a city is selected, the map smoothly flies to it. */}
                <MapView
                  lat={city?.lat ?? -10.2}
                  lng={city?.lng ?? -41.5}
                  zoom={city ? 11 : 4.6}
                  label={city?.name}
                  showMarker={!!city}
                  staticView
                  className="absolute inset-0 h-full !rounded-none"
                />

                {/* Floating search bar */}
                <div className="absolute top-3 left-3 right-3 z-10">
                  <div className="relative">
                    <div className="flex items-center gap-3 h-12 px-4 rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                      <Icon
                        name="search"
                        size={18}
                        className="text-[var(--color-neutral-600)] shrink-0"
                      />
                      <input
                        ref={searchRef}
                        type="text"
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        placeholder="Buscar cidade no Nordeste"
                        className="flex-1 text-[14px] text-[var(--color-neutral-800)] bg-transparent outline-none placeholder:text-[var(--color-neutral-500)] min-w-0"
                        autoFocus
                      />
                      {cityQuery && (
                        <button
                          type="button"
                          onClick={() => { setCityQuery(""); setCity(null); }}
                          aria-label="Limpar"
                          className="grid size-6 place-items-center rounded-full bg-[var(--color-neutral-100)] shrink-0"
                        >
                          <Icon name="x" size={12} className="text-[var(--color-neutral-700)]" />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {suggestions.length > 0 && !city && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 mt-2 rounded-[16px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] overflow-hidden"
                        >
                          {suggestions.map((c) => (
                            <button
                              key={`${c.name}-${c.state}`}
                              type="button"
                              onClick={() => {
                                setCity(c);
                                setCityQuery(`${c.name}, ${c.state}`);
                                setSuggestions([]);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--color-neutral-100)] transition-colors border-b border-[var(--color-neutral-100)] last:border-0 text-left"
                            >
                              <Icon name="map-pin" size={16} className="text-[var(--color-neutral-600)] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[14px] font-medium text-[var(--color-neutral-800)] truncate">
                                  {c.name}
                                </p>
                                <p className="text-[12px] text-[var(--color-neutral-600)] truncate">
                                  {c.state}
                                </p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Basics ─────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step-basics"
              custom={dir}
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="absolute inset-0 overflow-y-auto px-6 pt-6 pb-40"
            >
              <h1 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)] mb-6">
                Conta um pouco mais sobre sua viagem
              </h1>

              <div className="flex flex-col gap-3">
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
                                className={`rounded-full px-4 py-2 text-[13px] font-medium bg-white border transition-colors ${sel
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
                            className={`rounded-full px-4 py-2 text-[13px] font-medium bg-white border transition-colors ${customMode
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
                  <label className="flex-1 flex flex-col gap-1.5 p-3 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
                    <span className="text-[11px] font-medium text-[var(--color-neutral-600)] uppercase tracking-wide">
                      Ida
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStartDate(v);
                        if (!v) return;
                        // Auto-fill volta from current duration so the two
                        // stay in sync.
                        const s = new Date(v).getTime();
                        const end = new Date(s + duration * 86400000);
                        setEndDate(end.toISOString().slice(0, 10));
                      }}
                      className="text-[14px] text-[var(--color-neutral-800)] outline-none bg-transparent"
                    />
                  </label>
                  <label className="flex-1 flex flex-col gap-1.5 p-3 rounded-[16px] border border-[var(--color-neutral-200)] bg-white">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-[16px] bg-white border text-left transition-colors ${sel
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
            </motion.div>
          )}

          {/* Step 4: Summary ────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step-summary"
              custom={dir}
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              className="absolute inset-0 overflow-y-auto px-6 pt-6 pb-40"
            >
              <h1 className="font-display font-medium text-[24px] leading-[1.3] text-[var(--color-neutral-800)] mb-2">
                Tudo pronto?
              </h1>
              <p className="text-[14px] text-[var(--color-neutral-600)] mb-6">
                Revise os detalhes da sua viagem.
              </p>

              <div className="mb-5">
                <label className="font-display font-medium text-[13px] mb-2 block text-[var(--color-neutral-800)]">
                  Nome da viagem
                </label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  className="w-full h-14 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[14px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors"
                />
              </div>

              {city && (
                <div className="mb-5 rounded-[16px] overflow-hidden">
                  <MapView lat={city.lat} lng={city.lng} zoom={10} label={city.name} className="h-[180px]" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <ConfigRow icon="map-pin" label="Destino" value={city ? `${city.name}, ${city.state}` : ","} />
                <ConfigRow icon="compass" label="Tipo" value={TRIP_TYPES.find((t) => t.key === tripType)?.label ?? ","} />
                <ConfigRow icon="calendar-days" label="Duração" value={durationLabel} />
                <ConfigRow icon="users" label="Grupo" value={`${groupSize} ${groupSize === 1 ? "pessoa" : "pessoas"}`} />
                <ConfigRow icon="wallet" label="Orçamento" value={budgetLabel} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-5 bg-white border-t border-[var(--color-neutral-200)] flex flex-col gap-2">
        {limitError && (
          <p className="text-[12px] text-red-600 text-center">
            Limite de {TRIP_LIMIT} viagens atingido. Exclua uma no seu perfil para criar outra.
          </p>
        )}

        <div className="flex gap-3">
          {isOnboarding ? (
            tripsLoading ? (
              <button
                type="button"
                disabled
                className="h-12 flex-1 rounded-full bg-[var(--color-neutral-300)] font-display font-medium text-[15px] text-white cursor-not-allowed"
              >
                Carregando…
              </button>
            ) : reachedLimit ? (
              <Link
                href="/perfil"
                className="h-12 flex-1 inline-flex items-center justify-center rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[14px] text-white"
              >
                Ver minhas viagens
              </Link>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="h-12 flex-1 rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[15px] text-white transition-all"
              >
                Começar
              </button>
            )
          ) : (
            <>
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="h-12 flex-1 rounded-full bg-white border border-[var(--color-neutral-800)] font-display font-medium text-[15px] text-[var(--color-neutral-800)] transition-colors"
                >
                  Voltar
                </button>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className="h-12 flex-1 rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[15px] text-white disabled:opacity-40 transition-all"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving || !city || !tripType || reachedLimit ||
                    (customMode && (Number(customAmount) || 0) < 1)
                  }
                  className="h-12 flex-1 rounded-full bg-[var(--color-neutral-800)] font-display font-medium text-[15px] text-white disabled:opacity-40 transition-all"
                >
                  {saving ? "Criando..." : "Criar viagem"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
