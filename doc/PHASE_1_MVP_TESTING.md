# 🧪 Fase 1 MVP - Checklist de Pruebas Manuales

**Fecha:** 21 de diciembre de 2025  
**Componente:** Financial Intelligence System - IncomeScreen Refactor  
**Versión:** Fase 1 MVP

---

## 📋 Resumen de Cambios

### Archivos Creados
1. `utils/financialHealth.ts` - Funciones puras para derivar estado financiero
2. `components/FinancialHealthCard.tsx` - Card compacto y colapsable
3. `components/SurplusDistributionModal.tsx` - Modal con planes de distribución

### Archivos Modificados
1. `components/IncomeScreen.tsx` - Refactorizado de ~470 líneas a ~180 líneas de UI compacta

### Reducción de Código
- **Antes:** ~320 líneas de UI para semáforo + planes inline
- **Después:** ~6 líneas para FinancialHealthCard + modal oculto
- **Reducción:** ~95% del ruido visual

---

## ✅ Checklist de Pruebas por Estado Financiero

### **Prueba 1: Estado `critical_deficit` (< 80% cobertura)**

**Configuración:**
1. Ir a **Presupuestos**
2. Establecer presupuesto total: **RD$ 100,000**
3. Ir a **Ingresos**
4. Asegurar que ingresos del mes sean **< RD$ 80,000** (ej: RD$ 60,000)

**Resultado Esperado:**
- ✅ FinancialHealthCard aparece **COLAPSADO** por defecto
- ✅ Color del card: **Rojo intenso** (border-red-500)
- ✅ Icono: **AlertTriangle** rojo
- ✅ Título: **"💰 Estado Financiero"**
- ✅ Mensaje principal: **"Te faltan RD$ 40,000.00 para cubrir tu presupuesto"**
- ✅ Botón **"Administrar Superávit"**: **NO aparece** (no hay superávit)
- ✅ Botón expandir: **Chevron Down** visible

**Al expandir:**
- ✅ Muestra descripción: "Tus ingresos no cubren el presupuesto..."
- ✅ Barra de cobertura: **60%** (roja)
- ✅ Desglose:
  - Presupuesto: RD$ 100,000.00
  - Ingresos: RD$ 60,000.00
  - **Faltante: RD$ 40,000.00** (en rojo)

---

### **Prueba 2: Estado `deficit` (80-99% cobertura)**

**Configuración:**
1. Presupuesto total: **RD$ 100,000**
2. Ingresos del mes: **RD$ 92,000** (92% cobertura)

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Naranja** (border-orange-500)
- ✅ Icono: **AlertTriangle** naranja
- ✅ Mensaje: **"Te faltan RD$ 8,000.00 para cubrir tu presupuesto"**
- ✅ NO aparece botón "Administrar Superávit"

**Al expandir:**
- ✅ Barra de cobertura: **92%** (naranja)
- ✅ **Faltante: RD$ 8,000.00**

---

### **Prueba 3: Estado `balanced` (99-101% cobertura)**

**Configuración:**
1. Presupuesto total: **RD$ 100,000**
2. Ingresos del mes: **RD$ 99,500** o **RD$ 100,000** o **RD$ 100,800**

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Amarillo** (border-amber-500)
- ✅ Icono: **CheckCircle** amarillo
- ✅ Mensaje: **"✓ Estás en equilibrio"**
- ✅ Descripción (expandido): "Tus ingresos cubren tu presupuesto perfectamente."
- ✅ NO aparece botón "Administrar Superávit" (delta mínimo)

**Al expandir:**
- ✅ Barra de cobertura: **~100%** (amarilla)
- ✅ Sección "Faltante/Superávit": **NO aparece** si delta < RD$ 1,000

**Nota importante:** Usa tolerancia `0.99-1.01` para evitar problemas de punto flotante.

---

### **Prueba 4: Estado `healthy_surplus` (100-120% cobertura)**

**Configuración:**
1. Presupuesto total: **RD$ 100,000**
2. Ingresos del mes: **RD$ 115,000** (115% cobertura)

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Verde claro** (border-emerald-500)
- ✅ Icono: **TrendingUp** verde
- ✅ Mensaje: **"Tienes RD$ 15,000.00 disponibles"**
- ✅ **SÍ aparece** botón **"💡 Administrar Superávit"** (gradiente indigo-purple)

**Al expandir:**
- ✅ Barra de cobertura: **100%** (visual max, pero ratio real 115%)
- ✅ Desglose:
  - Presupuesto: RD$ 100,000.00
  - Ingresos: RD$ 115,000.00
  - **Superávit: RD$ 15,000.00** (en verde)

**Al hacer clic en "Administrar Superávit":**
- ✅ Se abre **SurplusDistributionModal**
- ✅ Modal muestra título: "Sugerencias para tu Superávit"
- ✅ Disponible: **RD$ 15,000.00** (en verde destacado)
- ✅ Muestra **3 planes**:
  - **Conservador (70/20/10):** Ahorro RD$ 10,500 | Metas RD$ 3,000 | Personal RD$ 1,500
  - **Balanceado (50/30/20):** Ahorro RD$ 7,500 | Metas RD$ 4,500 | Personal RD$ 3,000 (destacado verde)
  - **Agresivo (30/40/30):** Ahorro RD$ 4,500 | Metas RD$ 6,000 | Inversión RD$ 4,500
- ✅ Cada plan tiene botón **"Aplicar Plan"** (placeholder por ahora)
- ✅ Disclaimer al final visible

**Al cerrar modal:**
- ✅ Modal desaparece
- ✅ IncomeScreen sigue igual (colapsado)

---

### **Prueba 5: Estado `strong_surplus` (> 120% cobertura)**

**Configuración:**
1. Presupuesto total: **RD$ 87,563.20** (presupuesto real actual)
2. Ingresos del mes: **RD$ 130,000** (~148% cobertura)

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Verde intenso** (border-green-600)
- ✅ Icono: **Sparkles** verde intenso
- ✅ Mensaje: **"Tienes RD$ 42,436.80 disponibles"**
- ✅ Botón "Administrar Superávit" presente

**Al expandir:**
- ✅ Barra de cobertura: **100%** (visual, ratio real 148%)
- ✅ Superávit: **RD$ 42,436.80**

**En modal:**
- ✅ Planes calculan correctamente sobre **RD$ 42,436.80**:
  - Conservador: Ahorro RD$ 29,705.76 + Metas RD$ 8,487.36 + Personal RD$ 4,243.68
  - Balanceado: Ahorro RD$ 21,218.40 + Metas RD$ 12,731.04 + Personal RD$ 8,487.36
  - Agresivo: Ahorro RD$ 12,731.04 + Metas RD$ 16,974.72 + Inversión RD$ 12,731.04

**Verificar suma:**
- ✅ Cada plan suma **exactamente** el superávit (sin redondeo incorrecto)

---

### **Prueba 6: Estado `no_budget` (budgetTotal === 0)**

**Configuración:**
1. Ir a **Presupuestos**
2. **Desactivar** o **eliminar** todos los presupuestos
3. Volver a **Ingresos**

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Gris** (border-slate-300)
- ✅ Icono: **AlertTriangle** gris
- ✅ Título: **"Sin Presupuesto Activo"**
- ✅ Mensaje: "Aún no tienes presupuestos activos este mes. Ve a Presupuestos..."
- ✅ **NO aparece** botón "Administrar Superávit"
- ✅ **NO aparece** barra de cobertura (expandido)
- ✅ **NO aparece** desglose de presupuesto/ingresos

---

### **Prueba 7: Presupuesto sin Ingresos (budgetTotal > 0, incomeTotal === 0)**

**Configuración:**
1. Presupuesto total: **RD$ 50,000**
2. **Eliminar** todos los ingresos del mes actual (o asegurar que sean RD$ 0)

**Resultado Esperado:**
- ✅ Card **COLAPSADO** por defecto
- ✅ Color: **Rojo** (critical_deficit, 0% cobertura)
- ✅ Icono: **AlertTriangle** rojo
- ✅ Mensaje principal: **"⚠️ Sin Ingresos Registrados"**
- ✅ Descripción (expandido): "Tienes presupuesto de RD$ 50,000.00 pero no ingresos registrados este mes."

**Al expandir:**
- ✅ Barra de cobertura: **0%** (vacía, roja)
- ✅ Faltante: **RD$ 50,000.00** (todo el presupuesto)

---

### **Prueba 8: Cambio Dinámico de Estado (SSOT Test)**

**Objetivo:** Verificar que cambios en Presupuestos se reflejan en Ingresos.

**Pasos:**
1. Estado inicial:
   - Presupuesto: **RD$ 50,000**
   - Ingresos: **RD$ 45,000**
   - Estado: **deficit** (naranja)
   - Faltante: **RD$ 5,000**

2. Ir a **Presupuestos** → Editar un ítem → **Reducir** presupuesto total a **RD$ 40,000**

3. Volver a **Ingresos** (sin refrescar página)

**Resultado Esperado:**
- ✅ Estado cambia automáticamente a **healthy_surplus** (verde)
- ✅ Superávit: **RD$ 5,000.00**
- ✅ Botón "Administrar Superávit" **aparece**
- ✅ Color del card cambia a verde

**Pasos inversos:**
4. Volver a **Presupuestos** → **Aumentar** presupuesto a **RD$ 60,000**

5. Volver a **Ingresos**

**Resultado Esperado:**
- ✅ Estado cambia a **deficit** (naranja)
- ✅ Faltante: **RD$ 15,000.00**
- ✅ Botón "Administrar Superávit" **desaparece**

**Confirmación SSOT:**
- ✅ IncomeScreen **NO recalcula** presupuesto localmente
- ✅ Consume directamente de `budgetPeriodData`

---

### **Prueba 9: Interacción Colapsable/Expandible**

**Pasos:**
1. Card aparece **colapsado**
2. Hacer clic en **Chevron Down**

**Resultado Esperado:**
- ✅ Card se **expande** suavemente
- ✅ Icono cambia a **Chevron Up**
- ✅ Aparecen:
  - Descripción contextual
  - Barra de cobertura
  - Desglose presupuesto/ingresos/delta

3. Hacer clic en **Chevron Up**

**Resultado Esperado:**
- ✅ Card vuelve a **colapsar**
- ✅ Solo quedan visibles: título, mensaje, botón (si hay superávit)

---

### **Prueba 10: Modal - Apertura y Cierre**

**Prerequisito:** Tener superávit (cualquier cantidad > 0)

**Pasos:**
1. Hacer clic en **"💡 Administrar Superávit"**

**Resultado Esperado:**
- ✅ Modal aparece con backdrop blur
- ✅ Modal centrado en pantalla
- ✅ Botón **X** visible arrarriba a la derecha

2. Hacer clic en **X**

**Resultado Esperado:**
- ✅ Modal se cierra
- ✅ IncomeScreen vuelve a estado normal

3. Abrir modal nuevamente
4. Hacer clic **fuera del modal** (en backdrop)

**Resultado Esperado:**
- ✅ Modal se cierra (clickOutside funciona)

---

### **Prueba 11: Modal - Cálculo de Planes**

**Configuración:**
- Superávit: **RD$ 10,000.00** (número redondo para fácil verificación)

**En modal, verificar:**

**Plan Conservador (70/20/10):**
- ✅ Ahorro (70%): **RD$ 7,000.00**
- ✅ Metas (20%): **RD$ 2,000.00**
- ✅ Ocio/Personal (10%): **RD$ 1,000.00**
- ✅ Suma: **RD$ 10,000.00**

**Plan Balanceado (50/30/20):**
- ✅ Ahorro (50%): **RD$ 5,000.00**
- ✅ Metas (30%): **RD$ 3,000.00**
- ✅ Inversión Personal (20%): **RD$ 2,000.00**
- ✅ Suma: **RD$ 10,000.00**
- ✅ Card destacado en **verde** (bg-emerald-50)

**Plan Agresivo (30/40/30):**
- ✅ Ahorro (30%): **RD$ 3,000.00**
- ✅ Metas (40%): **RD$ 4,000.00**
- ✅ Inversión/Deuda (30%): **RD$ 3,000.00**
- ✅ Suma: **RD$ 10,000.00**

---

### **Prueba 12: Modal - Botones "Aplicar Plan" (Placeholder)**

**Pasos:**
1. Abrir modal con superávit
2. Hacer clic en **"Aplicar Plan"** de cualquier plan

**Resultado Esperado (Fase 1):**
- ✅ `console.log` muestra: `"Plan selected: conservative"` (o el plan elegido)
- ✅ Modal se cierra automáticamente
- ✅ **NO se crean metas** (esto es Fase 2)

**Nota:** Los botones son placeholders. La accionabilidad se implementa en Fase 2.

---

### **Prueba 13: Responsive Design**

**Dispositivos a probar:**
- Desktop (> 640px)
- Mobile (< 640px)

**Verificar:**

**FinancialHealthCard:**
- ✅ Padding ajusta correctamente (`p-4 sm:p-5`)
- ✅ Tamaños de texto: `text-sm sm:text-base`
- ✅ Íconos: `w-5 h-5 sm:w-6 sm:h-6`
- ✅ Bordes: `rounded-xl sm:rounded-2xl`

**Modal:**
- ✅ Modal se adapta a pantalla pequeña
- ✅ No desborda viewport
- ✅ Scroll interno funciona (`overflow-y-auto`)
- ✅ Padding ajusta: `p-4 sm:p-6`

---

### **Prueba 14: Dark Mode**

**Pasos:**
1. Activar **Dark Mode** en la app

**Verificar en cada estado (deficit, balanced, surplus, no_budget):**
- ✅ Colores de fondo: `dark:bg-*` correctos
- ✅ Colores de texto: `dark:text-*` legibles
- ✅ Bordes: `dark:border-*` visibles
- ✅ Modal: `dark:bg-slate-800` con contraste adecuado

**Casos críticos:**
- ✅ Card rojo en dark mode no es demasiado brillante
- ✅ Texto blanco sobre fondo verde legible
- ✅ Backdrop blur funciona en dark mode

---

### **Prueba 15: Reducción de Ruido Visual (Objetivo Principal)**

**Comparativa Antes vs Después:**

**Antes (sin refactor):**
- Card semáforo: ~150 líneas inline
- Planes 70/20/10, 50/30/20, 30/40/30: ~320 líneas inline
- **Total visual en pantalla:** ~800px de altura
- Usuario obligado a ver 3 planes completos siempre

**Después (Fase 1 MVP):**
- Card colapsado: ~50px altura (1 línea título + 1 mensaje + 1 botón opcional)
- Planes: **Ocultos en modal** (solo visibles si usuario hace clic)
- **Total visual en pantalla:** ~50px (95% reducción)

**Objetivo cumplido:**
- ✅ Vista Ingresos es **menos invasiva**
- ✅ Usuario decide cuándo ver detalles (expandir/modal)
- ✅ Planes siguen disponibles, pero **no obligan atención**

---

## 🎯 Criterios de Éxito General

### **Funcionales:**
- ✅ Todos los 6 estados financieros se muestran correctamente
- ✅ SSOT intacto (cambios en Presupuestos se reflejan en Ingresos)
- ✅ Card colapsable funciona sin errores
- ✅ Modal abre/cierra correctamente
- ✅ Planes calculan montos correctos
- ✅ Botón "Administrar Superávit" solo aparece cuando hay superávit

### **UX:**
- ✅ Vista compacta por defecto (carga cognitiva baja)
- ✅ Información crítica visible sin expandir
- ✅ Expandir/colapsar es fluido (transitions)
- ✅ Modal no interrumpe flujo (se puede cerrar fácilmente)

### **Técnicos:**
- ✅ No hay errores TypeScript
- ✅ No hay warnings en consola
- ✅ Imports correctos
- ✅ Funciones puras sin side effects
- ✅ Tolerancia `0.99-1.01` para estado `balanced`

---

## 🚨 Posibles Problemas a Verificar

### **1. Punto flotante en `balanced`**
- ❌ Si ratio === 1.0 exacto no funciona
- ✅ Debe usar tolerancia `0.99 <= ratio <= 1.01`

### **2. División por cero**
- ❌ Si `budgetTotal === 0`, no calcular `coverageRatio`
- ✅ Retornar `0` y estado `no_budget`

### **3. Modal z-index**
- ❌ Modal aparece debajo de otros elementos
- ✅ Debe tener `z-50` y backdrop `z-40`

### **4. Imports faltantes**
- ❌ Error: Cannot find module '../utils/financialHealth'
- ✅ Verificar que el archivo existe y ruta es correcta

---

## ✅ Checklist Final Pre-Aprobación

Antes de marcar Fase 1 como completada, verificar:

- [ ] **Prueba 1-7:** Todos los estados funcionan
- [ ] **Prueba 8:** SSOT confirmado (cambios en Presupuestos se reflejan)
- [ ] **Prueba 9:** Colapsable/expandible funciona
- [ ] **Prueba 10-12:** Modal funciona correctamente
- [ ] **Prueba 13:** Responsive en mobile y desktop
- [ ] **Prueba 14:** Dark mode funciona
- [ ] **Prueba 15:** Reducción de ruido visual confirmada
- [ ] **Sin errores TypeScript**
- [ ] **Sin warnings en consola**
- [ ] **Performance:** No lag al expandir/colapsar

---

**Si todas las pruebas pasan: ✅ Fase 1 MVP aprobada para producción**

**Si hay fallos:** Documentar issue específico y resolver antes de continuar a Fase 2.
