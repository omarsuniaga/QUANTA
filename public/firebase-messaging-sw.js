// Firebase Cloud Messaging Service Worker
// Este archivo maneja las notificaciones push en segundo plano

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase (debes reemplazar con tus credenciales)
firebase.initializeApp({
    apiKey: "AIzaSyByrHNhGoGnQjR_9uUr11rZXEmQHtpaTaU",
    authDomain: "quanta-b5c5d.firebaseapp.com",
    projectId: "quanta-b5c5d",
    storageBucket: "quanta-b5c5d.firebasestorage.app",
    messagingSenderId: "406146417634",
    appId: "1:406146417634:web:8e96cf3ee6e67896a5d1d3"
});

const messaging = firebase.messaging();

// Manejar mensajes cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

    const notificationTitle = payload.notification?.title || 'QUANTA';
    const notificationOptions = {
        body: payload.notification?.body || 'Nueva notificación',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'default',
        data: payload.data || {},
        requireInteraction: false,
        actions: [
            { action: 'open', title: '👁️ Ver', icon: '/icons/view.png' },
            { action: 'dismiss', title: '❌ Cerrar' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clicks en las notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);

    event.notification.close();

    if (event.action === 'open') {
        const urlToOpen = event.notification.data?.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Si ya hay una ventana abierta, enfócala
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Si no hay ventana abierta, abre una nueva
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Log para confirmar que el SW está activo
console.log('[firebase-messaging-sw.js] Service Worker inicializado correctamente');
