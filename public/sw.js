// Patak service worker: shows reminder notifications and opens the app when one
// is tapped. It does not cache anything.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Chrome's automatic install prompt looks for a fetch handler. This one does
// nothing, so every request still goes straight to the network.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Patak", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      // Same tag replaces the earlier notification, and renotify makes the
      // phone alert again, so a repeat reminder does not pile up.
      tag: data.tag,
      renotify: Boolean(data.tag),
      // Alarm-like: a long buzz pattern, never muted by the app, and it stays
      // on screen until it is tapped. The loudness of the sound itself is an
      // Android setting for the notification channel, not something a web app
      // can change.
      vibrate: [600, 250, 600, 250, 600, 250, 600],
      silent: false,
      requireInteraction: true,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
