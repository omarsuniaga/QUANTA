import React, { useEffect } from 'react';
import { SwipeHandlers, SwipeState } from '../../hooks/useAppNavigation';

interface MainContentProps {
  swipeHandlers: SwipeHandlers;
  swipeState: SwipeState;
  mainContentRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}

/**
 * Componente wrapper para el área de contenido principal.
 * Maneja swipe gestures para navegación móvil con feedback visual.
 * Aplica transformaciones CSS para mostrar el gesto de swipe en tiempo real.
 *
 * @param props - swipeHandlers, swipeState, mainContentRef, children
 */
export const MainContent: React.FC<MainContentProps> = ({
  swipeHandlers,
  swipeState,
  mainContentRef,
  children,
}) => {
  // Construir estilo inline para transformación y transición
  const transform = `translateX(${swipeState.translateX}px)`;
  const transition = swipeState.isTransitioning ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none';

  // Adjuntar event listeners nativos con passive:false para permitir preventDefault()
  useEffect(() => {
    const element = mainContentRef.current;
    if (!element) return;

    // Wrapeamos los handlers para compatibilidad con eventos nativos
    const handleTouchStart = (e: TouchEvent) => {
      swipeHandlers.onTouchStart(e as any);
    };
    const handleTouchMove = (e: TouchEvent) => {
      swipeHandlers.onTouchMove(e as any);
    };
    const handleTouchEnd = () => {
      swipeHandlers.onTouchEnd();
    };

    // Agregar listeners con passive:false para permitir preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeHandlers, mainContentRef]);

  return (
    <main
      ref={mainContentRef}
      className="flex-1 overflow-y-auto no-scrollbar pb-28 lg:pb-8 lg:pt-8"
      style={{
        transform,
        transition,
        willChange: swipeState.isDragging ? 'transform' : 'auto',
      }}
    >
      {children}
    </main>
  );
};
