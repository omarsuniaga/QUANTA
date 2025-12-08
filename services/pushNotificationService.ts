import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from '../firebaseConfig';

interface FCMTokenData {
  token: string;
  deviceInfo: {
    browser: string;
    timestamp: number;
  };
}

class PushNotificationService {
  private messaging: Messaging | null = null;
  private fcmToken: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
    }
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Cannot initialize: notifications not supported');
      return false;
    }

    try {
      this.messaging = getMessaging(app);
      await this.registerServiceWorker();
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        await this.saveFCMToken();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async saveFCMToken() {
    if (!this.messaging) {
      console.warn('Messaging not initialized');
      return;
    }

    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn('VAPID key not configured. Add VITE_FIREBASE_VAPID_KEY to .env.local');
        console.warn('Get your VAPID key from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates');
        return;
      }

      const token = await getToken(this.messaging, { vapidKey });
      
      if (token) {
        this.fcmToken = token;
        
        const tokenData: FCMTokenData = {
          token,
          deviceInfo: {
            browser: navigator.userAgent,
            timestamp: Date.now()
          }
        };

        // Guardar en localStorage por ahora
        if (typeof window !== 'undefined') {
            localStorage.setItem('fcm_token', JSON.stringify(tokenData));
        }
        
        console.log('FCM Token obtained and saved:', token.substring(0, 20) + '...');
      } else {
        console.warn('No FCM token obtained');
      }
    } catch (error) {
      console.error('Error obtaining FCM token:', error);
    }
  }

  listenForMessages(callback: (payload: any) => void) {
    if (!this.messaging) {
      console.warn('Messaging not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
      
      // Mostrar notificación nativa si tenemos permisos
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'QUANTA', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png',
          badge: '/badge-72.png'
        });
      }
    });
  }

  scheduleLocalNotification(title: string, body: string, scheduledDate: Date) {
    const now = Date.now();
    const scheduledTime = scheduledDate.getTime();
    const delay = scheduledTime - now;

    // Solo programar si la fecha está en el futuro y dentro de 24 horas
    if (delay > 0 && delay < 86400000) { // 24 horas en ms
      console.log(`Scheduling notification "${title}" in ${Math.round(delay / 1000 / 60)} minutes`);
      
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(title, { 
            body, 
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [200, 100, 200]
          });
          console.log(`Notification shown: ${title}`);
        }
      }, delay);
      
      return true;
    } else {
      console.warn(`Cannot schedule notification: delay=${delay}ms (must be 0 < delay < 86400000)`);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

export const pushNotificationService = new PushNotificationService();
