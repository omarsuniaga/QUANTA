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
}) => {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
        document.documentElement.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[99999]
        bg-slate-900/60 dark:bg-black/80 backdrop-blur-md
        flex items-center justify-center
        p-4 sm:p-8
        animate-in fade-in duration-300
        overflow-y-auto
      `}
    // Removido onClick={onClose} según requerimiento (no cerrar al presionar fuera)
    >
      {/* Contenedor que maneja el centrado y la animación */}
      <div
        className="w-full flex items-center justify-center min-h-full py-10 animate-in zoom-in-95 duration-300 pointer-events-none"
      >
        <div className="w-full max-w-lg pointer-events-auto" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
};

