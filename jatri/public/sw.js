// Service Worker for RideNow / Jatri Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "RideNow Notification",
    body: "You have an update on your ride.",
    url: "/",
    tag: "ridenow-notification",
  };

  try {
    payload = event.data.json();
  } catch (err) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/logo.jpeg",
    badge: payload.badge || "/logo.jpeg",
    tag: payload.tag || "ridenow-ride-update",
    renotify: true,
    data: {
      url: payload.url || "/",
      timestamp: Date.now(),
    },
    vibrate: [200, 100, 200],
    actions: payload.actions || [
      { action: "open", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "RideNow", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open with the target URL or on the site, focus and navigate it
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl) || targetUrl === "/") {
            return client.focus();
          }
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
