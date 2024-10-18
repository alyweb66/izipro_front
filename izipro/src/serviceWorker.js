
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';


// Version du service worker pour gérer le versioning
const SW_VERSION = '1.1.0';
const CACHE_NAME = `my-app-cache-${SW_VERSION}`;
//console.log(`Service Worker Version: ${SW_VERSION}`);

// Activer le service worker sur tous les clients
self.addEventListener('activate', (event) => {
	//console.log(`Service Worker ${SW_VERSION} activé`);
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
			);
		})
	);
	self.clients.claim();
});

// Activer immédiatement le service worker après installation
self.addEventListener('install', (event) => {
	//console.log(`Service Worker ${SW_VERSION} installé`);
	self.skipWaiting();
});

//* PWA
// ======= Intégration du cache de vite-plugin-pwa =======
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

//* End PWA

// ======= Cache dynamique pour les appels d'API =======
registerRoute(
	({ url }) => url.origin === 'https://back.betapoptest.online',
	new StaleWhileRevalidate({
		cacheName: 'api-back-cache',
		plugins: [
			{
				expiration: {
					maxEntries: 30,
					maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
				},
			},
		],
	})
);

//* Notification push

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
const CACHE_MAP = 'map-tiles-cache';
const TILE_URL_PATTERN = /https:\/\/basemaps\.cartocdn\.com\/gl\/voyager-gl-style\/.*/;


// Cache map tiles
self.addEventListener('fetch', (event) => {
	if (TILE_URL_PATTERN.test(event.request.url)) {
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response;
				}
				return fetch(event.request).then((response) => {
					return caches.open(CACHE_MAP).then((cache) => {
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

//* End cache map tiles
// Clear cache
/* self.addEventListener('message', (event) => {
	if (event.data) {
		switch (event.data.type) {
			case 'CLEAR_CACHE':
				caches.delete(CACHE_MAP).catch(error => console.error('Error clearing cache:', error));
				break;
			case 'SKIP_WAITING':
				self.skipWaiting();
				break;
		}
	}
}); */

// ======= Gestion des messages pour le cache et le skip waiting =======
self.addEventListener('message', (event) => {
	if (event.data) {
		switch (event.data.type) {
			case 'CLEAR_CACHE':
				caches.delete(CACHE_NAME).catch(error => console.error('Error clearing cache:', error));
				caches.delete(CACHE_MAP).catch(error => console.error('Error clearing cache:', error));
				break;
			case 'SKIP_WAITING':
				self.skipWaiting();
				break;
		}
	}
});


