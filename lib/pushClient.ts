/**
 * Client-side helpers to register / unregister the Service Worker and
 * the Web Push subscription. Designed to be called from React with
 * `await registerPush()` etc.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** Convert URL-safe base64 → Uint8Array (required by pushManager.subscribe). */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(b64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await getOrRegisterServiceWorker();
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

/**
 * Request permission + subscribe. Returns the subscription on success,
 * null if user denied or browser unsupported.
 */
export async function subscribePush(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const reg = await getOrRegisterServiceWorker();
  if (!reg) return null;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // Cast to BufferSource, TS lib types are stricter than the runtime
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });
}

/** Unsubscribe locally. Caller should also tell the server. */
export async function unsubscribePush(): Promise<string | null> {
  const sub = await getCurrentSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

/**
 * Extracts (endpoint, p256dh, auth) from a PushSubscription so we can
 * send it to Convex.
 */
export function serializeSubscription(sub: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: json.endpoint ?? sub.endpoint,
    p256dh: keys.p256dh ?? "",
    auth: keys.auth ?? "",
  };
}
