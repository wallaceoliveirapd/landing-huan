/**
 * Cookie consent helpers, LGPD-compliant.
 *
 * Categories:
 *   essential , always on, cannot be disabled
 *   analytics , GTM / Google Analytics
 *   marketing , Meta Pixel / remarketing
 */

export interface CookieConsent {
  /** Schema version so we can migrate in the future */
  v: 1;
  analytics: boolean;
  marketing: boolean;
  decidedAt: number; // ms timestamp
}

const KEY = "huan_cookie_consent";

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<CookieConsent, "v" | "decidedAt">): CookieConsent {
  const full: CookieConsent = { v: 1, ...consent, decidedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(full));
  return full;
}

/** Preset: analytics yes, marketing no, "recommended" for LGPD */
export const RECOMMENDED_CONSENT: Omit<CookieConsent, "v" | "decidedAt"> = {
  analytics: true,
  marketing: false,
};

/** Preset: accept everything */
export const ACCEPT_ALL_CONSENT: Omit<CookieConsent, "v" | "decidedAt"> = {
  analytics: true,
  marketing: true,
};
