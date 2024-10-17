
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
const SW_VERSION = '1.0.0';
console.log(`Service Worker Version: ${SW_VERSION}`);

self.addEventListener('install', (event) => {
	console.log(`Service Worker ${SW_VERSION} installed`);
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

//* End cache map tiles
// Clear cache
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

//* End PWA

//* Cache API
//const CACHE_NAME_SERVEUR = 'api-back-cache';
//const API_URL_PATTERN = /^https:\/\/back\.betapoptest\.online\/.*/i;

/* const CACHE_NAME_STATIC = 'app-static-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME_STATIC).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});
// Ajoute une règle de mise en cache pour les requêtes d'API
self.addEventListener('fetch', (event) => {
	if (API_URL_PATTERN.test(event.request.url)) {
	  console.log('Interception de la requête API : ', event.request.url);
	  event.respondWith(
		fetch(event.request)
		  .then((response) => {
			// Si la requête est réussie, on met à jour le cache
			return caches.open(CACHE_NAME_SERVEUR).then((cache) => {
			  console.log('Ajout de la réponse au cache pour:', event.request.url);
			  cache.put(event.request, response.clone());
			  return response;
			});
		  })
		  .catch((error) => {
			console.error('Récupération réseau échouée, utilisation du cache pour:', event.request.url);
			// En cas d'erreur réseau, on cherche dans le cache
			return caches.match(event.request).then((cachedResponse) => {
			  if (cachedResponse) {
				console.log('Réponse trouvée dans le cache:', event.request.url);
				return cachedResponse;
			  }
			  // Si rien n'est trouvé dans le cache, renvoyer une erreur personnalisée ou une réponse par défaut
			  return new Response('Ressource non disponible', { status: 503, statusText: 'Service Unavailable' });
			});
		  })
	  );
	}
  }); */

  //* End cache API