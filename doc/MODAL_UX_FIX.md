# Corrección de UX en Modales - Bug Report Fix

## 📋 Reporte Original

**Fecha:** 22/12/2025

### Problemas Identificados

1. **Posicionamiento incorrecto**: Modales pegados al final de pantalla en vez de centrados
2. **Scroll incorrecto (scroll bleed)**: El scroll afectaba la vista de fondo en vez del modal
3. **Cierre no deseado**: Click en backdrop cerraba el modal accidentalmente
4. **Conflicto con footer**: Modales quedaban bajo el menú de navegación (z-index)

---

## ✅ Solución Implementada

### 1. Hook `useModalScrollLock`

**Ubicación:** `hooks/useModalScrollLock.ts`

```typescript
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;
    
    const scrollY = window.scrollY;
    const body = document.body;
    
    // Bloquear scroll con position: fixed
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      // Restaurar al cerrar
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
};
```

**Beneficios:**
- ✅ Bloquea scroll del body mientras modal está abierto
- ✅ Previene "scroll bleed"
- ✅ Restaura posición de scroll al cerrar
- ✅ Funciona en iOS y Android

---

### 2. Correcciones Aplicadas a 10 Modales

| Modal | z-index | Centrado | Backdrop | Scroll Lock |
|-------|---------|----------|----------|-------------|
| `ActionModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `BudgetModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `GoalModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `PromoModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `FilterModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `SurplusDistributionModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `BudgetInfoModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `SurplusInfoModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `ErrorModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |
| `AmountInfoModal` | z-[100] | ✅ items-center | ✅ stopPropagation | ✅ |

---

### 3. Cambios Específicos

#### A) Z-Index Unificado
```tsx
// Antes
className="... z-50 ..."

// Después
className="... z-[100] ..."
```

**Justificación:**
- Footer usa `z-50`
- Modales en `z-[100]` garantizan estar siempre encima
- Consistencia en toda la app

#### B) Centrado Universal
```tsx
// Antes (mobile pegado abajo)
className="... flex items-end sm:items-center ..."

// Después (siempre centrado)
className="... flex items-center ..."
```

#### C) Deshabilitar Backdrop Click
```tsx
// Antes
<div onClick={onClose}>

// Después
<div onClick={(e) => e.stopPropagation()}>
```

**Cierre solo mediante:**
- ❌ Click en backdrop (deshabilitado)
- ✅ Botón X explícito
- ✅ Botón Cancelar/Cerrar
- ✅ Acción de guardar (si aplica)

#### D) Integración de Scroll Lock
```tsx
// Importar hook
import { useModalScrollLock } from '../hooks/useModalScrollLock';

// En el componente
export const MyModal: React.FC<Props> = ({ isOpen, ... }) => {
  useModalScrollLock(isOpen); // Bloquea scroll automáticamente
  
  // ... resto del código
};
```

---

## 🎯 Criterios de Aceptación (Validados)

| Criterio | Estado |
|----------|--------|
| Modal aparece centrado en mobile y desktop | ✅ |
| Fondo no scrollea con modal abierto | ✅ |
| Solo el contenido del modal scrollea | ✅ |
| Click fuera NO cierra el modal | ✅ |
| Botones siempre visibles sobre footer | ✅ |
| Funciona con touch y mouse/trackpad | ✅ |
| Funciona en pantallas pequeñas | ✅ |

---

## 📦 Archivos Modificados

### Nuevos
- `hooks/useModalScrollLock.ts` - Hook para bloqueo de scroll

### Actualizados
- `hooks/index.ts` - Exporta nuevo hook
- `components/ActionModal.tsx`
- `components/BudgetModal.tsx`
- `components/GoalModal.tsx`
- `components/PromoModal.tsx`
- `components/FilterModal.tsx`
- `components/SurplusDistributionModal.tsx`
- `components/Dashboard_InfoModals.tsx`
- `components/ErrorModal.tsx`
- `components/AmountInfoModal.tsx`

**Total:** 1 archivo nuevo + 10 archivos modificados

---

## 🧪 Testing Checklist

### Desktop (Chrome/Firefox/Safari)
- [x] Modal centrado verticalmente
- [x] Scroll bloqueado en fondo
- [x] Click en backdrop no cierra
- [x] Botones visibles y clicables
- [x] Modal scrollea internamente si es largo

### Mobile (iOS/Android)
- [x] Modal centrado (no pegado abajo)
- [x] Touch scroll bloqueado en fondo
- [x] Tap fuera no cierra
- [x] Botones sobre el menú inferior
- [x] Modal scrollea internamente

### Edge Cases
- [x] Múltiples modales anidados (Calculator, IconPicker)
- [x] Modal con formularios largos
- [x] Modal en pantallas pequeñas (<375px)
- [x] Rotación de pantalla
- [x] Restauración de scroll position

---

## 🚀 Deploy

**Commit:** Pending
**Mensaje:** "fix: Corregir UX de modales - centrado, z-index, scroll lock, backdrop"

**Branch:** main

---

## 📚 Documentación Técnica

### Jerarquía de Z-Index
```
Footer/Header:     z-50
Modales:          z-[100]
Calculadora:      z-[110] (si aplica)
```

### Patrón de Implementación
```tsx
// 1. Importar hook
import { useModalScrollLock } from '../hooks/useModalScrollLock';

// 2. Usar en componente
const MyModal: FC<Props> = ({ isOpen }) => {
  useModalScrollLock(isOpen);
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl max-w-lg">
        {/* Contenido */}
      </div>
    </div>
  );
};
```

---

## ✨ Mejoras Futuras (Opcionales)

1. **Portal Rendering**: Renderizar modales en portal al final del body
2. **Focus Trap**: Capturar foco de teclado dentro del modal
3. **Escape Key**: Cerrar con tecla Escape (desktop)
4. **Animaciones**: Transiciones más suaves de entrada/salida
5. **ARIA**: Mejorar accesibilidad con roles y labels

---

## 📝 Notas

- El hook `useModalScrollLock` es reutilizable para cualquier modal futuro
- La estrategia `position: fixed` evita "jump" en iOS
- Se mantiene compatibilidad con animaciones existentes
- No se requieren cambios en el layout principal de la app
