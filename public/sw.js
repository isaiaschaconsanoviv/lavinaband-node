// Activar las nuevas versiones de este archivo de inmediato, sin esperar a que se
// cierren todas las pestañas o la PWA
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Avisa al servidor qué pasó con la notificación (llegó, la abrieron, la descartaron).
// Ver api/notifications/track. Si falla, no afecta a la notificación.
function track(data, event) {
  if (!data || !data.trackId) return Promise.resolve();
  return fetch('/api/notifications/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: data.trackId, token: data.trackToken, event: event }),
    keepalive: true,
  }).catch(function () {});
}

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/logo.png?v=3',
      badge: '/badge.png?v=3',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/',
        trackId: data.trackId,
        trackToken: data.trackToken
      },
    };
    event.waitUntil(Promise.all([
      self.registration.showNotification(data.title, options),
      track(data, 'received'),
    ]));
  }
});

// Al tocar la notificación: si la app ya está abierta, llevarla a la página del aviso;
// si no, abrirla ahí.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const opened = track(event.notification.data, 'opened');
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(Promise.all([opened,
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async function (clientList) {
      const client = clientList.find(function (c) { return c.focused; }) || clientList[0];
      if (!client) return clients.openWindow(url);

      try {
        const focused = await client.focus();
        if (focused.url !== url) await focused.navigate(url);
      } catch {
        // navigate() falla si la ventana no está controlada por este service worker
        return clients.openWindow(url);
      }
    })
  ]));
});

self.addEventListener('notificationclose', function (event) {
  event.waitUntil(track(event.notification.data, 'dismissed'));
});
