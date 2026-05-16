/**
 * Centralized error helpers.
 *
 * - `getErrorMessage(err, fallback)` normalizes any thrown value to a user-safe string.
 *   Handles plain Error, ConvexError (with structured `data`), strings, and unknown.
 *
 * - `getErrorCode(err)` extracts a code from a ConvexError-shaped payload, if any.
 *
 * Convex throws plain Error or ConvexError. We pattern-match on:
 *   - err.data.code (preferred)
 *   - err.data.message
 *   - err.message
 *
 * Never expose stack traces / raw payloads. Log full err to console for devs.
 */

type ConvexErrorShape = {
  data?: { code?: string; message?: string } | string;
  message?: string;
};

export function getErrorMessage(
  err: unknown,
  fallback = "Algo deu errado. Tente de novo em alguns segundos.",
): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const e = err as ConvexErrorShape;

  // ConvexError with structured data: { code, message }
  if (e.data && typeof e.data === "object" && typeof e.data.message === "string") {
    return e.data.message;
  }
  // ConvexError with string data
  if (typeof e.data === "string" && e.data.trim().length > 0) {
    return e.data;
  }
  // Plain Error
  if (e.message && typeof e.message === "string") {
    // Strip Convex prefix noise like "[Request ID: ...] Server Error\nUncaught Error: ..."
    const cleaned = e.message
      .replace(/\[Request ID:[^\]]+\]\s*/g, "")
      .replace(/^Uncaught Error:\s*/i, "")
      .replace(/^Server Error\n?/i, "")
      .trim();
    return cleaned || fallback;
  }
  return fallback;
}

export function getErrorCode(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as ConvexErrorShape;
  if (e.data && typeof e.data === "object" && typeof e.data.code === "string") {
    return e.data.code;
  }
  return null;
}

/**
 * Logs full error to console for dev visibility + returns user-safe message.
 * Use in catch blocks where you want both: a clean string for UI and full
 * detail in dev tools.
 */
export function logAndGetMessage(
  context: string,
  err: unknown,
  fallback?: string,
): string {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err);
  return getErrorMessage(err, fallback);
}
