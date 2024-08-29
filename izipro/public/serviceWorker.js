
/* Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
    });
} */

// organize push event
self.addEventListener('install', () => {
    self.skipWaiting();
});

// listen for push event and show notification
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.message,
            icon: data.icon,
        })
    );
});

// open client url when notification is clicked
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        openUrl('https://betapoptest.online//dashboard')
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