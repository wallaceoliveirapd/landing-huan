"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "@/components/atoms/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { bottomSheetSpring } from "@/lib/motion-presets";
import { LegalSheet } from "@/components/organisms/LegalSheet";
import { TERMS_MD } from "@/content/terms";
import { PRIVACY_MD } from "@/content/privacy";
import { gtmUserLoggedIn, gtmUserSignedUp } from "@/lib/gtm";

/** Mask Brazilian WhatsApp number as the user types: (DD) 9XXXX-XXXX */
function maskWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ── Password strength ────────────────────────────────────────
type StrengthLevel = "fraca" | "média" | "forte";

function getStrength(pwd: string): StrengthLevel | null {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1 || pwd.length < 8) return "fraca";
  if (score === 2) return "média";
  return "forte";
}

const STRENGTH_COLOR: Record<StrengthLevel, string> = {
  fraca: "bg-red-500",
  média: "bg-yellow-400",
  forte: "bg-green-500",
};
const STRENGTH_BARS: Record<StrengthLevel, number> = { fraca: 1, média: 2, forte: 3 };

type Step = "form" | "otp";

export function AuthModal() {
  const { authModalOpen, closeAuthModal, authModalOptions } = useAuth();
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [tab, setTab] = useState<"signIn" | "signUp">("signIn");

  // Apply caller-provided options (initial tab, prefilled / locked email)
  // whenever the modal opens.
  useEffect(() => {
    if (!authModalOpen) return;
    if (authModalOptions.initialTab) setTab(authModalOptions.initialTab);
    if (authModalOptions.initialEmail) setEmail(authModalOptions.initialEmail);
  }, [authModalOpen, authModalOptions]);

  const emailLocked = !!authModalOptions.lockEmail;

  // Form fields
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP step
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [legalOpen, setLegalOpen] = useState<"terms" | "privacy" | null>(null);

  function reset() {
    setStep("form");
    setName("");
    setWhatsapp("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtpCode("");
    setResendCooldown(0);
    setError("");
    setLoading(false);
  }

  function handleClose(didAuth?: boolean) {
    reset();
    closeAuthModal();
    if (didAuth) router.refresh();
  }

  function handleCloseClick() { handleClose(); }

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  // ── Step 1: form submit ──────────────────────────────────────────────────
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    if (tab === "signUp") {
      if (!name.trim() || whatsapp.replace(/\D/g, "").length < 10) {
        setError("Preencha seu nome e WhatsApp para criar a conta.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }
      if (getStrength(password) === "fraca") {
        setError("Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.");
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      const params: Record<string, string> = { email, password, flow: tab };
      if (tab === "signUp") {
        params.name = name.trim();
        params.whatsapp = whatsapp.replace(/\D/g, "");
      }

      // Convex Auth returns `{ signingIn: boolean }`. When `verify` is set
      // on Password, `signingIn === false` means an OTP was sent and we
      // need a verification step, regardless of signUp or signIn flow.
      const result = await signIn("password", params);

      if (result && result.signingIn === false) {
        // Either: brand new signUp waiting for OTP, OR existing account
        // that wasn't verified yet and the system just sent a code.
        setStep("otp");
        setResendCooldown(45);
      } else {
        // Direct sign-in (no OTP required)
        gtmUserLoggedIn("email");
        handleClose(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (tab === "signIn" && (msg.includes("not found") || msg.includes("InvalidSecret"))) {
        setError("E-mail ou senha incorretos.");
      } else if (tab === "signUp" && msg.includes("already exists")) {
        setError("Esse e-mail já tem conta. Faça login.");
        setTab("signIn");
      } else {
        setError("Algo deu errado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: OTP submit ────────────────────────────────────────────────────
  async function handleSubmitOtp(e: React.FormEvent) {
    e.preventDefault();
    const digits = otpCode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Digite os 6 dígitos do código.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn("resend-otp", { email, code: digits });
      if (tab === "signUp") {
        gtmUserSignedUp("email");
      } else {
        gtmUserLoggedIn("email");
      }
      handleClose(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setError("Código inválido ou expirado. Tente novamente ou peça um novo.");
      } else {
        setError("Não consegui verificar. Tente de novo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      // Re-trigger the OTP by repeating the signUp flow. Convex's Password
      // provider will see the unverified account and just re-send.
      const params: Record<string, string> = {
        email,
        password,
        flow: "signUp",
      };
      if (name) params.name = name.trim();
      if (whatsapp) params.whatsapp = whatsapp.replace(/\D/g, "");
      await signIn("password", params);
      setResendCooldown(45);
    } catch {
      setError("Não consegui reenviar agora. Tente em alguns segundos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseClick}
            className="fixed inset-0 z-[60] bg-black/20"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={bottomSheetSpring}
            className="fixed inset-x-0 bottom-0 z-[70] rounded-t-[28px] bg-white flex flex-col overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.2)] max-h-[92vh]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <span className="h-1 w-12 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-2 pb-4 shrink-0">
              <div>
                <h2 className="font-display font-medium text-[24px] leading-[1.2] text-[var(--color-neutral-800)]">
                  {step === "otp"
                    ? "Confirme seu email"
                    : tab === "signIn"
                      ? "Bem-vindo de volta"
                      : "Criar conta grátis"}
                </h2>
                <p className="text-[13px] text-[var(--color-neutral-600)] mt-1">
                  {step === "otp"
                    ? `Mandei um código pra ${email}.`
                    : tab === "signIn"
                      ? "Acesse seus favoritos, cupons e o NordestAI"
                      : "Crie sua conta para salvar viagens e favoritos"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseClick}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-[var(--color-neutral-100)]"
              >
                <Icon name="x" size={18} className="text-[var(--color-neutral-800)]" />
              </button>
            </div>

            {/* Tabs, only on form step */}
            {step === "form" && (
              <div className="flex gap-1 mx-6 p-1 rounded-full bg-[var(--color-neutral-100)] shrink-0">
                {(["signIn", "signUp"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setError(""); }}
                    className={`flex-1 py-2 rounded-full text-[14px] font-medium transition-all ${tab === t
                        ? "bg-white text-[var(--color-neutral-800)]"
                        : "text-[var(--color-neutral-600)]"
                      }`}
                  >
                    {t === "signIn" ? "Entrar" : "Criar conta"}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            {step === "form" ? (
              <form
                onSubmit={handleSubmitForm}
                className="flex flex-col gap-4 px-6 pt-5 pb-8 overflow-y-auto"
              >
                {tab === "signUp" && (
                  <>
                    <Field
                      label="Seu nome"
                      value={name}
                      onChange={setName}
                      placeholder="João Viajante"
                      required
                    />
                    <Field
                      label="WhatsApp"
                      value={whatsapp}
                      onChange={(v) => setWhatsapp(maskWhatsapp(v))}
                      placeholder="(83) 99999-9999"
                      inputMode="numeric"
                      required
                      hint="Para enviarmos seu roteiro pronto e ofertas relevantes."
                    />
                  </>
                )}

                <Field
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="voce@email.com"
                  required
                  disabled={emailLocked}
                  hint={
                    emailLocked
                      ? "Convite enviado pra esse e-mail — não pode mudar."
                      : undefined
                  }
                />

                <PasswordField
                  label="Senha"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  showStrength={tab === "signUp"}
                />

                {tab === "signIn" && (
                  <a
                    href={email ? `/esqueci-senha?email=${encodeURIComponent(email)}` : "/esqueci-senha"}
                    className="self-end -mt-2 text-[12px] font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)]"
                  >
                    Esqueci minha senha
                  </a>
                )}

                {tab === "signUp" && (
                  <PasswordField
                    label="Confirmar senha"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repita a senha"
                    confirmValue={password}
                  />
                )}

                {error && (
                  <p className="text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="mt-1 h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Icon name="svg-spinners:ring-resize" size={20} />
                  ) : tab === "signIn" ? (
                    "Entrar"
                  ) : (
                    "Criar conta grátis"
                  )}
                </button>

                <p className="text-center text-[12px] text-[var(--color-neutral-600)] leading-relaxed">
                  Ao continuar você concorda com nossos{" "}
                  <button
                    type="button"
                    onClick={() => setLegalOpen("terms")}
                    className="underline underline-offset-2 text-[var(--color-neutral-800)] font-medium"
                  >
                    termos de uso
                  </button>{" "}
                  e{" "}
                  <button
                    type="button"
                    onClick={() => setLegalOpen("privacy")}
                    className="underline underline-offset-2 text-[var(--color-neutral-800)] font-medium"
                  >
                    política de privacidade
                  </button>
                  .
                </p>
              </form>
            ) : (
              // ── OTP step ──────────────────────────────────────────────
              <form
                onSubmit={handleSubmitOtp}
                className="flex flex-col gap-5 px-6 pt-3 pb-8 overflow-y-auto"
              >
                <OtpInput value={otpCode} onChange={setOtpCode} length={6} />

                {error && (
                  <p className="text-[13px] text-red-600 bg-red-50 rounded-[12px] px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otpCode.replace(/\D/g, "").length !== 6}
                  className="h-12 rounded-full bg-[var(--color-neutral-800)] text-white font-display font-medium text-[15px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Icon name="svg-spinners:ring-resize" size={20} />
                  ) : (
                    "Confirmar e entrar"
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[13px]">
                  <span className="text-[var(--color-neutral-600)]">Não recebeu?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="font-medium text-[var(--color-neutral-800)] disabled:text-[var(--color-neutral-400)] underline underline-offset-2"
                  >
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtpCode("");
                    setError("");
                  }}
                  className="text-center text-[12px] text-[var(--color-neutral-600)] underline underline-offset-2"
                >
                  Usar outro email
                </button>
              </form>
            )}
          </motion.div>

          {/* Legal sheets */}
          <LegalSheet
            open={legalOpen === "terms"}
            onClose={() => setLegalOpen(null)}
            title="Termos de uso"
            source={TERMS_MD}
          />
          <LegalSheet
            open={legalOpen === "privacy"}
            onClose={() => setLegalOpen(null)}
            title="Política de privacidade"
            source={PRIVACY_MD}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ─── PasswordField ──────────────────────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  showStrength,
  confirmValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  confirmValue?: string; // if set, shows match indicator instead of strength
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? getStrength(value) : null;
  const mismatch = confirmValue !== undefined && value.length > 0 && value !== confirmValue;
  const match = confirmValue !== undefined && value.length > 0 && value === confirmValue;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[var(--color-neutral-800)]">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={8}
          className="h-12 w-full rounded-[16px] border border-[var(--color-neutral-300)] px-4 pr-12 text-[15px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)] transition-colors"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          <Icon name={visible ? "eye-off" : "eye"} size={18} />
        </button>
      </div>

      {/* Strength meter */}
      {showStrength && value.length > 0 && strength && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {[1, 2, 3].map((bar) => (
              <div
                key={bar}
                className={`h-1 flex-1 rounded-full transition-colors ${bar <= STRENGTH_BARS[strength]
                    ? STRENGTH_COLOR[strength]
                    : "bg-[var(--color-neutral-200)]"
                  }`}
              />
            ))}
          </div>
          <p className={`text-[11px] font-medium ${strength === "forte" ? "text-green-600" :
              strength === "média" ? "text-yellow-600" : "text-red-600"
            }`}>
            Senha {strength}
            {strength === "fraca" && ", adicione maiúsculas, números ou símbolos"}
          </p>
        </div>
      )}

      {/* Confirm match indicator */}
      {confirmValue !== undefined && value.length > 0 && (
        <p className={`text-[11px] font-medium ${match ? "text-green-600" : "text-red-600"}`}>
          {match ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
        </p>
      )}
    </div>
  );
}

// ─── Field ──────────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  required,
  minLength,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password";
  inputMode?: "text" | "numeric" | "tel" | "email";
  required?: boolean;
  minLength?: number;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[var(--color-neutral-800)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        minLength={minLength}
        disabled={disabled}
        readOnly={disabled}
        className={`h-12 rounded-[16px] border border-[var(--color-neutral-300)] px-4 text-[15px] text-[var(--color-neutral-800)] outline-none focus:border-[var(--color-neutral-800)] transition-colors ${disabled ? "bg-[var(--color-neutral-100)] cursor-not-allowed" : ""}`}
      />
      {hint && (
        <p className="text-[11px] text-[var(--color-neutral-600)]">{hint}</p>
      )}
    </div>
  );
}

// ─── OtpInput ───────────────────────────────────────────────────────────────
/**
 * Six digit OTP input with focus auto-advance.
 * Single hidden input controls the actual value; the visible boxes are
 * driven by the value string and clicks/focus jump to it.
 */
function OtpInput({
  value,
  onChange,
  length,
}: {
  value: string;
  onChange: (v: string) => void;
  length: number;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  }

  const digits = (value.replace(/\D/g, "").padEnd(length, " ")).slice(0, length);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[var(--color-neutral-800)]">
        Código de 6 dígitos
      </label>
      <div
        className="flex items-center gap-2 cursor-text"
        onClick={() => hiddenRef.current?.focus()}
      >
        {Array.from({ length }).map((_, i) => {
          const ch = digits[i].trim();
          const isCursor = value.replace(/\D/g, "").length === i;
          return (
            <div
              key={i}
              className={`flex-1 h-14 rounded-[14px] border flex items-center justify-center font-display font-medium text-[22px] text-[var(--color-neutral-800)] ${ch
                  ? "border-[var(--color-neutral-800)] bg-white"
                  : isCursor
                    ? "border-[var(--color-neutral-800)] bg-white"
                    : "border-[var(--color-neutral-300)] bg-white"
                }`}
            >
              {ch || (isCursor ? <span className="opacity-30">•</span> : "")}
            </div>
          );
        })}
      </div>
      <input
        ref={hiddenRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        autoFocus
        className="sr-only"
      />
    </div>
  );
}
