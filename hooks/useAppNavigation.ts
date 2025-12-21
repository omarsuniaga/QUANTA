import { useState, useEffect, useRef, useCallback } from 'react';

export type TabType = 'dashboard' | 'income' | 'expenses' | 'budgets' | 'transactions' | 'settings';

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const MIN_SWIPE_DISTANCE = 80; // pixels
const TAB_ORDER: TabType[] = ['dashboard', 'income', 'expenses', 'budgets', 'transactions', 'settings'];

/**
 * Hook para gestionar la navegación entre tabs de la aplicación.
 * Incluye soporte para:
 * - Navegación programática con historial del navegador
 * - Swipe gestures para cambiar tabs (mobile)
 * - Sincronización con URL hash
 *
 * @param initialTab - Tab inicial al montar la aplicación
 * @param clearFilters - Función para limpiar filtros al navegar a dashboard
 * @returns Estado de navegación y handlers de swipe
 */
export function useAppNavigation(
  initialTab: TabType = 'dashboard',
  clearFilters: () => void
) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Refs para swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  /**
   * Navega a una tab específica y actualiza el historial del navegador
   */
  const navigateToTab = useCallback((tab: TabType, addToHistory = true) => {
    if (addToHistory && tab !== activeTab) {
      // Agregar estado al historial del navegador
      window.history.pushState({ tab }, '', `#${tab}`);
    }
    setActiveTab(tab);

    // Limpiar filtros al volver al dashboard
    if (tab === 'dashboard') {
      clearFilters();
    }
  }, [activeTab, clearFilters]);

  /**
   * Inicializar navegación desde URL hash y configurar listener de navegador
   */
  useEffect(() => {
    // Configurar estado inicial basado en URL hash
    if (!window.location.hash) {
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    } else {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (TAB_ORDER.includes(hash)) {
        setActiveTab(hash);
      }
    }

    // Handler para botón "Atrás" del navegador
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tab) {
        navigateToTab(event.state.tab, false);
      } else {
        navigateToTab('dashboard', false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToTab]);

  /**
   * Handler para inicio de touch (swipe)
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  /**
   * Handler para movimiento de touch (swipe)
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  /**
   * Handler para fin de touch (swipe)
   * Detecta dirección y cambia de tab si supera el threshold
   */
  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    const currentIndex = TAB_ORDER.indexOf(activeTab);

    if (isLeftSwipe && currentIndex < TAB_ORDER.length - 1) {
      // Swipe izquierda -> tab siguiente
      navigateToTab(TAB_ORDER[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe derecha -> tab anterior
      navigateToTab(TAB_ORDER[currentIndex - 1]);
    }

    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeTab, navigateToTab]);

  return {
    activeTab,
    navigateToTab,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    mainContentRef,
  };
}
