import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// Version du service worker pour gérer le versioning
const SW_VERSION = '0.0.110';
const CACHE_NAME = `my-app-cache-${SW_VERSION}`;
//console.log(`Service Worker Version: ${SW_VERSION}`);
const urlsToCache = [
  '/',
  '/manifest.json?v=0.0.9', //! Change version in HTML too
  /* '/assets/FetchButton-CmI3IYuX.css' */
  // add other static assets to force cache
];

// Open IndexedDB and get unreadCount
function getUnreadCount() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationsDB', 1);

    // Create the object store if it doesn't exist
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('counts')) {
        db.createObjectStore('counts', { keyPath: 'id' });
      }
    };

    // Get the unreadCount from the object store
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['counts'], 'readonly');
      const store = transaction.objectStore('counts');
      const getRequest = store.get('unreadCount');

      // Resolve the promise with the unreadCount
      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.value : 0);
      };

      // Reject the promise with the error
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    };

    // Reject the promise with the error
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Update unreadCount in IndexedDB
function updateUnreadCount(count) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notificationsDB', 1);

    // Create the object store if it doesn't exist
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['counts'], 'readwrite');
      const store = transaction.objectStore('counts');
      const putRequest = store.put({ id: 'unreadCount', value: count });

      // Resolve the promise when the transaction is complete
      putRequest.onsuccess = () => {
        resolve();
      };

      // Reject the promise with the error
      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    };

    // Reject the promise with the error
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Function to update badge
function updateBadge(count) {
  console.log('setAppBadge', navigator);

  if ('setAppBadge' in navigator) {
    console.log('count', count);

    navigator.setAppBadge(count).catch((error) => {
      console.error('Erreur lors de la mise à jour du badge:', error);
    });
  }
}

// Function to clear badge
function clearBadge() {
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch((error) => {
      console.error('Erreur lors de la réinitialisation du badge:', error);
    });
  }
}
// Activer le service worker sur tous les clients
self.addEventListener('activate', (event) => {
  //console.log(`Service Worker ${SW_VERSION} activé`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        /* cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)) */
          cacheNames.map((cacheName) => {
            console.log(`Suppression du cache : ${cacheName}`);
            return caches.delete(cacheName); // Supprime tous les caches
          })
      );
    })
  );
  self.clients.claim();
});

// Activer immédiatement le service worker après installation
self.addEventListener('install', (event) => {
  //console.log(`Service Worker ${SW_VERSION} installé`);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
      // or that, to update a specific file
      /* return cache.addAll([
        '/', 
        '/manifest.json', 
        '/assets/FetchButton-CmI3IYuX.css' // Met à jour le fichier CSS
      ]); */
    })
  );
});

//* PWA
// ======= Intégration du cache de vite-plugin-pwa =======
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || [{ url: '/assets/FetchButton-CmI3IYuX.css', revision: null }]);

//* End PWA

// ======= dynamical cache for API call =======
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
let selectedConversationId = null;
let selectedTab = null;
let isPageVisible = true;
// Get the unread count from IndexedDB
let unreadCount = 0;
getUnreadCount().then((count) => {
  unreadCount = count;
});

// Listen for messages from the client to update the selected conversation ID
self.addEventListener('message', (event) => {
  // listen for page visibility change
  if (event.data && event.data.action) {
    if (event.data.action === 'page-hidden') {
      console.log('page-hidden');

      isPageVisible = false;
    } else if (event.data.action === 'page-visible') {
      console.log('page-visible');

      isPageVisible = true;
    }
  }

  // listen for message from client
  if (event.data && event.data.type === 'UPDATE_SELECTED_CONVERSATION') {
    selectedConversationId = event.data.conversationId;
  }

  // listen for request from client
  if (event.data && event.data.type === 'UPDATE_SELECTED_TAB') {
    selectedTab = event.data.tab;
  }

  // listen for request from client to clear cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches
      .delete(CACHE_NAME)
      .catch((error) => console.error('Error clearing cache:', error));
    caches
      .delete(CACHE_MAP)
      .catch((error) => console.error('Error clearing cache:', error));
  }

  // listen for request from client to skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // listen for request from client to clear badge
  if (event.data && event.data.type === 'RESET_BADGE') {
    updateUnreadCount(0)
      .then(() => {
        unreadCount = 0;
        updateBadge(0);
        console.log('unreadCount', 0);
        return self.registration.getNotifications();
      })
      .then((notifications) => {
        notifications.forEach((notification) => {
          notification.close();
        });
        clearBadge();
      })
      .catch((error) => {
        console.error(
          'Erreur lors de la mise à jour du compteur de notifications non lues:',
          error
        );
      });
  }
});

// listen for push event and show notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  console.log('isPageVisible', isPageVisible);
  console.log('data', data);
  console.log('selectedConversationId', selectedConversationId);

  // Check if the conversation ID matches the selected conversation ID
  if (
    data.message &&
    data.tag &&
    data.tag === selectedConversationId &&
    isPageVisible
  ) {
    // Do not show notification if the user is already viewing the conversation
    return;
  }

  if (!data.message && selectedTab === 'Client request' && isPageVisible) {
    // Do not show notification if the user is already viewing the conversation
    return;
  }
  console.log('data', data);

  if (data.silent) {
    console.log('silent');

    return;
  } else {
    console.log('not silent');
    // add count to notification badge
    unreadCount++;
    console.log('unreadCount', unreadCount);
    updateUnreadCount(unreadCount)
      .then(() => {
        console.log('unreadCount', unreadCount);
      })
      .catch((error) => {
        console.error(
          'Erreur lors de la mise à jour du compteur de notifications non lues:',
          error
        );
      });
    updateBadge(unreadCount);
    // get the event data and show notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'https://betapoptest.online/logos/logo-toupro-250x250.png',
        badge: 'https://betapoptest.online/android/badge.png',
        tag: data.tag,
        renotify: data.renotify,
      })
    );
  }
});

// open client url when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(openUrl('https://betapoptest.online/dashboard'));
});

// listen for push subscription change
async function openUrl(url) {
  // Get all window clients of this service worker
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
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
const TILE_URL_PATTERN =
  /https:\/\/basemaps\.cartocdn\.com\/gl\/voyager-gl-style\/.*/;

// Cache map tiles
self.addEventListener('fetch', (event) => {
  if (TILE_URL_PATTERN.test(event.request.url)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              return caches
                .open(CACHE_MAP)
                .then((cache) => {
                  cache.put(event.request, response.clone());
                  return response;
                })
                .catch((error) => {
                  console.error('Error opening cache for fetch:', error);
                });
            })
            .catch((error) => {
              console.error('Fetch error:', error);
            });
        })
        .catch((error) => {
          console.error('Cache match error:', error);
        })
    );
  }
});

//* End cache map tiles
