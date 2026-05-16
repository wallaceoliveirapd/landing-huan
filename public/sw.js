/* Service Worker — push notifications for huanfalcao.com.br */
/* eslint-disable no-restricted-globals */

const ICON_URL = "https://evokemedia.com.br/landing-huan/icon.png";
const SW_VERSION = "v5";

self.addEventListener("install", () => {
  console.log("[sw] installed", SW_VERSION);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[sw] activated", SW_VERSION);
  event.waitUntil(self.clients.claim());
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
