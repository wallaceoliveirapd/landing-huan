/* Service Worker — push notifications + offline fallback for huanfalcao.com.br */
/* eslint-disable no-restricted-globals */

const ICON_URL = "https://evokemedia.com.br/landing-huan/icon.png";
const SW_VERSION = "v6";
const OFFLINE_CACHE = `huan-offline-${SW_VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  console.log("[sw] installed", SW_VERSION);
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: "reload" })),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[sw] activated", SW_VERSION);
  event.waitUntil(
    (async () => {
      // Drop stale offline caches from prior SW versions.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("huan-offline-") && k !== OFFLINE_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * Navigation fallback: when the user navigates to a page and the network is
 * unreachable, serve the pre-cached /offline page so they see a branded
 * "you're offline" screen instead of the browser's native error page.
 *
 * Static assets (CSS/JS/images) are NOT cached here — we only intervene on
 * top-level navigations (mode: "navigate") so the rest of the app keeps
 * its normal fetch behavior.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(OFFLINE_CACHE);
        const cached = await cache.match(OFFLINE_URL);
        return (
          cached ??
          new Response(
            "<h1>Sem conexão</h1><p>Conecte-se à internet e tente de novo.</p>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          )
        );
      }
    })(),
  );
});

/**
 * Push event — server sent a notification payload.
 * Payload shape: { title, body, url?, icon?, tag? }
 */
self.addEventListener("push", (event) => {
  console.log("[sw] push received", event.data ? "has data" : "no data");

  if (!event.data) {
    console.warn("[sw] push with no data — showing fallback");
  }

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Huan Falcão", body: event.data ? event.data.text() : "" };
  }

  console.log("[sw] push payload:", JSON.stringify(payload));

  const title = payload.title || "Huan Falcão";
  const options = {
    body: payload.body || "",
    icon: payload.icon || ICON_URL,
    badge: payload.badge || ICON_URL,
    tag: payload.tag || "huanfalcao",
    data: { url: payload.url || "/" },
    requireInteraction: false,
    vibrate: [80, 40, 80],
  };

  console.log("[sw] calling showNotification:", title, options.body);

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => console.log("[sw] showNotification OK"))
      .catch((err) => console.error("[sw] showNotification FAILED:", err.name, err.message)),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[sw] notification clicked");
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client && client.url.includes(self.location.origin)) {
            client.focus();
            if ("navigate" in client) return client.navigate(targetUrl);
            return;
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
