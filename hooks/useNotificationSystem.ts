import { useEffect, useRef } from 'react';
import { User, Transaction, Goal, DashboardStats } from '../types';
import { pushNotificationService } from '../services/pushNotificationService';
import { smartNotificationService } from '../services/smartNotificationService';

import { useCurrency } from './useCurrency';

interface UseNotificationSystemParams {
  user: User | null;
  transactions: Transaction[];
  goals: Goal[];
  stats: DashboardStats;
  language: string;
  onShowPrompt: () => void;
}

/**
 * Hook de side-effect para inicializar y gestionar el sistema de notificaciones.
 * Incluye push notifications y smart notifications checks.
 *
 * @param params - Parámetros del hook
 */
export function useNotificationSystem({
  user,
  transactions,
  goals,
  stats,
  language,
  onShowPrompt,
}: UseNotificationSystemParams) {
  const { currencyCode, currencySymbol } = useCurrency();
  // Ref para evitar inicialización duplicada
  const notificationsInitialized = useRef(false);

  /**
   * Inicializar push notifications (solo una vez)
   */
  useEffect(() => {
    if (notificationsInitialized.current) return;

    const initializeNotifications = async () => {
      if (user && pushNotificationService.isNotificationSupported()) {
        await pushNotificationService.initialize();
        notificationsInitialized.current = true;

        // Mostrar prompt si no se ha mostrado antes y hay transacciones
        const hasShown = typeof window !== 'undefined' && localStorage.getItem('notificationPromptShown');
        if (!hasShown && transactions.length > 0) {
          // Esperar 5 segundos después de que el usuario vea la app
          setTimeout(() => {
            onShowPrompt();
          }, 5000);
        }
      }
    };

    initializeNotifications();
  }, [user, transactions.length, onShowPrompt]);

  /**
   * Ejecutar verificaciones de notificaciones inteligentes
   * (pagos próximos, metas, presupuestos, etc.)
   */
  useEffect(() => {
    if (!user || transactions.length === 0 || !stats) return;

    const runNotificationChecks = async () => {
      try {
        await smartNotificationService.runAllChecks(
          transactions,
          [], // subscriptions - no implementado aún
          goals,
          [], // budgets - no implementado aún
          stats,
          currencyCode,
          language as 'es' | 'en',
          currencySymbol
        );
      } catch (error) {
        console.error('Error running notification checks:', error);
      }
    };

    // Ejecutar checks después de un delay inicial
    const timeoutId = setTimeout(runNotificationChecks, 2000);

    // Ejecutar checks cada 30 minutos
    const intervalId = setInterval(runNotificationChecks, 30 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [user, transactions, goals, stats, currencyCode, currencySymbol, language]);
}
