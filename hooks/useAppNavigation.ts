import { useState, useEffect, useRef, useCallback } from 'react';

export type TabType = 'dashboard' | 'income' | 'expenses' | 'budgets' | 'transactions' | 'settings';

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export interface SwipeState {
  isDragging: boolean;
  translateX: number;
  isTransitioning: boolean;
}

const SWIPE_THRESHOLD_PERCENTAGE = 0.25; // 25% of screen width
const GESTURE_THRESHOLD_RATIO = 1.5; // |deltaX| must be > |deltaY| * 1.5
const ANIMATION_DURATION = 250; // ms
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
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    translateX: 0,
    isTransitioning: false,
  });

  // Refs para swipe gestures mejorados
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isHorizontalGesture = useRef<boolean | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  /**
   * Navega a una tab específica y actualiza el historial del navegador
   */
  const navigateToTab = useCallback((tab: TabType, addToHistory = true) => {
    if (addToHistory && tab !== activeTab) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
    setActiveTab(tab);

    // Limpiar filtros al volver al dashboard
    if (tab === 'dashboard') {
      clearFilters();
    }

    // Reset swipe state
    setSwipeState({
      isDragging: false,
      translateX: 0,
      isTransitioning: false,
    });
  }, [activeTab, clearFilters]);

  /**
   * SCROLL RESET: Scroll to top instantly when activeTab changes
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

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
   * Handler para inicio de touch con detección de gesto mejorada
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
    isHorizontalGesture.current = null;

    setSwipeState(prev => ({
      ...prev,
      isDragging: true,
      isTransitioning: false,
    }));
  }, []);

  /**
   * Handler para movimiento de touch con feedback visual y detección de dirección
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isDragging) return;

    const touch = e.targetTouches[0];
    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;

    const deltaX = touchCurrentX.current - touchStartX.current;
    const deltaY = touchCurrentY.current - touchStartY.current;

    // Determinar dirección del gesto (solo una vez al inicio)
    if (isHorizontalGesture.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalGesture.current = Math.abs(deltaX) > Math.abs(deltaY) * GESTURE_THRESHOLD_RATIO;
    }

    // Si es claramente vertical, no procesamos el swipe horizontal
    if (isHorizontalGesture.current === false) {
      return;
    }

    // Si es horizontal, prevenir scroll vertical y aplicar feedback visual
    if (isHorizontalGesture.current === true) {
      // Solo prevenir si el evento es cancelable (evita warning cuando scroll ya empezó)
      if (e.cancelable) {
        e.preventDefault();
      }

      const currentIndex = TAB_ORDER.indexOf(activeTab);
      const canSwipeLeft = currentIndex < TAB_ORDER.length - 1;
      const canSwipeRight = currentIndex > 0;

      // Aplicar resistencia en los bordes
      let translate = deltaX;
      if ((deltaX < 0 && !canSwipeLeft) || (deltaX > 0 && !canSwipeRight)) {
        translate = deltaX * 0.3; // Resistencia elástica en bordes
      }

      setSwipeState(prev => ({
        ...prev,
        translateX: translate,
      }));
    }
  }, [activeTab, swipeState.isDragging]);

  /**
   * Handler para fin de touch con evaluación de umbral y animación
   */
  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;

    const deltaX = touchCurrentX.current - touchStartX.current;
    const threshold = window.innerWidth * SWIPE_THRESHOLD_PERCENTAGE;
    const currentIndex = TAB_ORDER.indexOf(activeTab);

    // Solo procesar si fue un gesto horizontal
    if (isHorizontalGesture.current === true) {
      const isLeftSwipe = deltaX < -threshold && currentIndex < TAB_ORDER.length - 1;
      const isRightSwipe = deltaX > threshold && currentIndex > 0;

      if (isLeftSwipe) {
        // Confirmar cambio a tab siguiente
        setSwipeState({
          isDragging: false,
          translateX: -window.innerWidth,
          isTransitioning: true,
        });
        setTimeout(() => {
          navigateToTab(TAB_ORDER[currentIndex + 1]);
        }, ANIMATION_DURATION);
      } else if (isRightSwipe) {
        // Confirmar cambio a tab anterior
        setSwipeState({
          isDragging: false,
          translateX: window.innerWidth,
          isTransitioning: true,
        });
        setTimeout(() => {
          navigateToTab(TAB_ORDER[currentIndex - 1]);
        }, ANIMATION_DURATION);
      } else {
        // Cancelar: rebotar a posición original (efecto elástico)
        setSwipeState({
          isDragging: false,
          translateX: 0,
          isTransitioning: true,
        });
      }
    } else {
      // No fue gesto horizontal, reset inmediato
      setSwipeState({
        isDragging: false,
        translateX: 0,
        isTransitioning: false,
      });
    }

    // Reset refs
    isHorizontalGesture.current = null;
  }, [activeTab, navigateToTab, swipeState.isDragging]);

  return {
    activeTab,
    navigateToTab,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swipeState,
    mainContentRef,
  };
}
