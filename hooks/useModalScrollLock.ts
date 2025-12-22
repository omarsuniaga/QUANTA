import { useEffect } from 'react';

/**
 * Hook para bloquear el scroll del body cuando un modal está abierto.
 * Previene "scroll bleed" donde el usuario hace scroll en el fondo en vez del modal.
 * 
 * @param isOpen - Estado del modal (true = abierto, false = cerrado)
 */
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Guardar el scroll actual
    const scrollY = window.scrollY;
    const body = document.body;
    
    // Guardar estilos originales
    const originalOverflow = body.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;

    // Aplicar bloqueo de scroll
    // Usamos position: fixed para evitar "jump" en iOS
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    // Cleanup: restaurar al cerrar
    return () => {
      body.style.overflow = originalOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;

      // Restaurar posición de scroll
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
};
