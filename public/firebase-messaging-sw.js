// Firebase Cloud Messaging Service Worker
// Sistema profesional de notificaciones push para QUANTA

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
firebase.initializeApp({
    apiKey: "AIzaSyByrHNhGoGnQjR_9uUr11rZXEmQHtpaTaU",
    authDomain: "quanta-b5c5d.firebaseapp.com",
    projectId: "quanta-b5c5d",
    storageBucket: "quanta-b5c5d.firebasestorage.app",
    messagingSenderId: "406146417634",
    appId: "1:406146417634:web:8e96cf3ee6e67896a5d1d3"
});

const messaging = firebase.messaging();

// Iconos por tipo de notificación
const NOTIFICATION_ICONS = {
    service_payment: '💳',
    insufficient_funds: '⚠️',
    goal_contribution: '🎯',
    goal_milestone: '🏆',
    goal_completed: '🎉',
    budget_warning: '📊',
    budget_exceeded: '🚨',
    weekly_summary: '📈',
    savings_tip: '💡',
    achievement: '🌟',
    streak_reminder: '🔥',
    unusual_expense: '👀',
    default: '🔔'
};

// Colores por prioridad
const PRIORITY_COLORS = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
};

// Manejar mensajes cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('[QUANTA SW] Mensaje recibido en segundo plano:', payload);

    const data = payload.data || {};
    const notificationType = data.type || 'default';
    const priority = data.priority || 'medium';
    const icon = NOTIFICATION_ICONS[notificationType] || NOTIFICATION_ICONS.default;
    
    const notificationTitle = payload.notification?.title || `${icon} QUANTA`;
    const notificationOptions = {
        body: payload.notification?.body || 'Nueva notificación',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: priority === 'high' ? [200, 100, 200, 100, 200] : [200, 100, 200],
        tag: notificationType,
        renotify: priority === 'high',
        requireInteraction: priority === 'high',
        silent: false,
        data: {
            ...data,
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: getActionsForType(notificationType, data.language || 'es')
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Obtener acciones según el tipo de notificación
function getActionsForType(type, language) {
    const isSpanish = language === 'es';
    
    switch (type) {
        case 'service_payment':
            return [
                { action: 'pay', title: isSpanish ? '💰 Pagar' : '💰 Pay' },
                { action: 'snooze', title: isSpanish ? '⏰ Recordar luego' : '⏰ Remind later' }
            ];
        case 'goal_contribution':
            return [
                { action: 'contribute', title: isSpanish ? '✅ Aportar' : '✅ Contribute' },
                { action: 'dismiss', title: isSpanish ? '❌ Cerrar' : '❌ Dismiss' }
            ];
        case 'insufficient_funds':
            return [
                { action: 'review', title: isSpanish ? '📊 Revisar' : '📊 Review' },
                { action: 'dismiss', title: isSpanish ? '❌ Cerrar' : '❌ Dismiss' }
            ];
        case 'budget_exceeded':
        case 'budget_warning':
            return [
                { action: 'view_budget', title: isSpanish ? '📊 Ver presupuesto' : '📊 View budget' },
                { action: 'dismiss', title: isSpanish ? '❌ Cerrar' : '❌ Dismiss' }
            ];
        default:
            return [
                { action: 'open', title: isSpanish ? '👁️ Ver' : '👁️ View' },
                { action: 'dismiss', title: isSpanish ? '❌ Cerrar' : '❌ Dismiss' }
            ];
    }
}

// Manejar clicks en las notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('[QUANTA SW] Notificación clickeada:', event.action);

    event.notification.close();
    
    const data = event.notification.data || {};
    let urlToOpen = '/';

    // Determinar URL según la acción
    switch (event.action) {
        case 'pay':
        case 'contribute':
        case 'review':
            urlToOpen = '/?view=transactions';
            break;
        case 'view_budget':
            urlToOpen = '/?view=settings';
            break;
        case 'snooze':
            // Programar recordatorio para más tarde (30 minutos)
            scheduleReminder(event.notification, 30);
            return;
        case 'dismiss':
            // Solo cerrar, ya está hecho arriba
            return;
        default:
            urlToOpen = data.url || '/';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Si ya hay una ventana abierta, enfócala y navega
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            action: event.action,
                            data: data
                        });
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abre una nueva
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Programar un recordatorio
function scheduleReminder(notification, minutesLater) {
    const delay = minutesLater * 60 * 1000;
    setTimeout(() => {
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            tag: notification.tag + '_reminder',
            data: notification.data
        });
    }, delay);
}

// Manejar cuando se cierra una notificación
self.addEventListener('notificationclose', (event) => {
    console.log('[QUANTA SW] Notificación cerrada:', event.notification.tag);
    
    // Enviar evento a la app para marcar como leída
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'NOTIFICATION_CLOSED',
                notificationId: event.notification.data?.id
            });
        });
    });
});

// Sincronización en background (para notificaciones programadas)
self.addEventListener('sync', (event) => {
    console.log('[QUANTA SW] Sync event:', event.tag);
    
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkScheduledNotifications());
    }
});

async function checkScheduledNotifications() {
    // Este método se llamará periódicamente para verificar notificaciones programadas
    console.log('[QUANTA SW] Checking scheduled notifications...');
}

// Evento de instalación
self.addEventListener('install', (event) => {
    console.log('[QUANTA SW] Service Worker instalado');
    self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', (event) => {
    console.log('[QUANTA SW] Service Worker activado');
    event.waitUntil(clients.claim());
});

console.log('[QUANTA SW] Service Worker inicializado correctamente');
