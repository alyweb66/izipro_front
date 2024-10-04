
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
/* Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
    });
} */
//* Notification push
// organize push event
/* self.addEventListener('install', () => {
    self.skipWaiting();
}); */

self.addEventListener('install', (event) => {
	self.skipWaiting(); // pour activer le service worker immédiatement
	event.waitUntil(
		caches.open(CACHE_NAME).then(() => {
			// Ajoute ici des éléments à mettre en cache si nécessaire
		})
	);
});

// listen for push event and show notification
self.addEventListener('push', (event) => {
	const data = event.data ? event.data.json() : {};
	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon,
			// badge: data.badge,
			tag: data.tag,
			renotify: data.renotify
		})
	);
});

// open client url when notification is clicked
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil(
		openUrl('https://betapoptest.online/dashboard')
	);
});

// listen for push subscription change
async function openUrl(url) {
	// Get all window clients of this service worker
	const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
	// Check if there is already a window/tab open with the target URL
	for (let i = 0; i < windowClients.length; i++) {
		const client = windowClients[i];
		if (client.url === url && 'focus' in client) {
			return client.focus();
		}
	}
	if (self.clients.openWindow) {
		return self.clients.openWindow(url);
	}
	return null;
}
//* End notification push

//* Cache map tiles
const CACHE_NAME = 'map-tiles-cache';
const TILE_URL_PATTERN = /https:\/\/basemaps\.cartocdn\.com\/gl\/voyager-gl-style\/.*/;

// Prepare cache for map tiles
/* self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
    })
  );
}); */

// Cache map tiles
self.addEventListener('fetch', (event) => {
	if (TILE_URL_PATTERN.test(event.request.url)) {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response;
				}
				return fetch(event.request).then((response) => {
					return caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, response.clone());
						return response;
					}).catch((error) => {
						console.error('Error opening cache for fetch:', error);
					});
				}).catch((error) => {
					console.error('Fetch error:', error);
				});
			}).catch((error) => {
				console.error('Cache match error:', error);
			})
		);
	}
});

// Clear cache when user is not login
/* self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
    }).catch((error) => {
      console.error('Error clearing cache:', error);
    });
  }
}); */
//* End cache map tiles
self.addEventListener('message', (event) => {
	if (event.data) {
		switch (event.data.type) {
		case 'CLEAR_CACHE':
			caches.delete(CACHE_NAME).catch(error => console.error('Error clearing cache:', error));
			break;
		case 'SKIP_WAITING':
			self.skipWaiting();
			break;
		}
	}
});

//* PWA
// ======= Intégration du cache de vite-plugin-pwa =======
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST || []);

/* self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')
    self.skipWaiting()
}) */

//* End PWA