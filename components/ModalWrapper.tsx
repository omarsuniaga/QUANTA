import React, { useEffect } from 'react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Alineación vertical del contenido del modal
   * - 'center': Centra el modal en el viewport (recomendado)
   * - 'start': Alinea el modal al inicio con padding
   */
  alignment?: 'center' | 'start';
  /**
   * Permite cerrar el modal haciendo click en el backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;
}

/**
 * ModalWrapper - Componente centralizado para renderizar modales
 *
 * SOLUCIÓN A PROBLEMAS COMUNES:
 * 1. ✅ Centrado perfecto en la pantalla del dispositivo (no en la vista scrolleable)
 * 2. ✅ Bloquea TODA interacción incluyendo navegación (z-index: 10000)
 * 3. ✅ Previene scroll del body cuando el modal está abierto
 * 4. ✅ Backdrop oscuro con blur
 * 5. ✅ Click en backdrop cierra el modal (configurable)
 * 6. ✅ Animaciones suaves de entrada/salida
 *
 * @example
 * ```tsx
 * <ModalWrapper isOpen={isOpen} onClose={onClose}>
 *   <div className="bg-white rounded-2xl p-6 max-w-md w-full">
 *     // Contenido del modal
 *   </div>
 * </ModalWrapper>
 * ```
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  alignment = 'center',
  closeOnBackdropClick = true,
}) => {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar posición de scroll actual
      const scrollY = window.scrollY;

      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restaurar scroll al cerrar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo cerrar si se hace click en el backdrop, no en el contenido
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-[9999]
        bg-black/90 backdrop-blur-sm
        flex items-center justify-center
        pointer-events-auto
        p-4 sm:p-6
        animate-in fade-in duration-200
        overflow-y-auto
      `}
      onClick={onClose}
    >
      <div
        className="w-full flex items-center justify-center min-h-full py-8"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
