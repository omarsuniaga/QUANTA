import React from 'react';
import { SwipeHandlers } from '../../hooks/useAppNavigation';

interface MainContentProps {
  swipeHandlers: SwipeHandlers;
  mainContentRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}

/**
 * Componente wrapper para el área de contenido principal.
 * Maneja swipe gestures para navegación móvil y aplica estilos de scroll.
 *
 * @param props - swipeHandlers, mainContentRef, children
 */
export const MainContent: React.FC<MainContentProps> = ({
  swipeHandlers,
  mainContentRef,
  children,
}) => {
  return (
    <main
      ref={mainContentRef}
      className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-28 lg:pb-8 lg:pt-8"
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      {children}
    </main>
  );
};
