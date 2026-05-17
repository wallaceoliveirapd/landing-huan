"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import Script from "next/script";
import {
  readConsent,
  writeConsent,
  type CookieConsent,
} from "@/lib/cookieConsent";

// ── Context ──────────────────────────────────────────────────

interface CookieConsentCtx {
  /** null = not decided yet (banner shows) */
  consent: CookieConsent | null;
  decided: boolean;
  /** Accept recommended: analytics yes, marketing no */
  acceptRecommended: () => void;
  /** Accept all */
  acceptAll: () => void;
  /** Save custom preferences */
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  /** Reopen config sheet (e.g. from footer link) */
  openConfig: () => void;
  configOpen: boolean;
  setConfigOpen: (v: boolean) => void;
}

const Ctx = createContext<CookieConsentCtx | null>(null);

export function useCookieConsent() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCookieConsent must be used inside CookieConsentProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Push Consent Mode v2 update to GTM dataLayer */
function pushGtmConsent(prefs: { analytics: boolean; marketing: boolean }) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  // Use gtag function if available, else push directly
  const gtag: (...args: unknown[]) => void =
    typeof w.gtag === "function"
      ? w.gtag
      : (...args: unknown[]) => w.dataLayer.push(args);

  gtag("consent", "update", {
    analytics_storage: prefs.analytics ? "granted" : "denied",
    ad_storage: prefs.marketing ? "granted" : "denied",
    ad_user_data: prefs.marketing ? "granted" : "denied",
    ad_personalization: prefs.marketing ? "granted" : "denied",
  });
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [decided, setDecided] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // Hydrate from localStorage and push consent state to GTM on mount
  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      setConsent(saved);
      setDecided(true);
      pushGtmConsent(saved);
    } else {
      setDecided(false);
    }
  }, []);

  const apply = useCallback((prefs: { analytics: boolean; marketing: boolean }) => {
    const saved = writeConsent(prefs);
    setConsent(saved);
    setDecided(true);
    setConfigOpen(false);
    // Tell GTM to update consent state immediately
    pushGtmConsent(prefs);
  }, []);

  const acceptRecommended = useCallback(() => apply({ analytics: true, marketing: false }), [apply]);
  const acceptAll = useCallback(() => apply({ analytics: true, marketing: true }), [apply]);
  const savePreferences = useCallback((prefs: { analytics: boolean; marketing: boolean }) => apply(prefs), [apply]);
  const openConfig = useCallback(() => setConfigOpen(true), []);

  return (
    <Ctx.Provider
      value={{
        consent,
        decided,
        acceptRecommended,
        acceptAll,
        savePreferences,
        openConfig,
        configOpen,
        setConfigOpen,
      }}
    >
      {children}

      {/* ── Meta Pixel, only after explicit marketing consent ── */}
      {consent?.marketing && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      )}
    </Ctx.Provider>
  );
}
