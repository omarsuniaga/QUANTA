# 🧪 Fase 2.1 MVP - Checklist de Pruebas Manuales

**Fecha:** 21 de diciembre de 2025  
**Componente:** Financial Intelligence System - "Aplicar Plan" Crea Metas  
**Versión:** Fase 2.1 MVP

---

## 📋 Resumen de Cambios

### Archivos Creados
1. `utils/surplusPlan.ts` - Funciones puras para cálculos de asignación
2. `services/goalsService.ts` - Servicio para crear metas en Firestore

### Archivos Modificados
1. `components/SurplusDistributionModal.tsx` - Implementación real de "Aplicar Plan"

### Nueva Funcionalidad
- **Creación automática de metas** desde planes de distribución
- **Modal de confirmación** antes de crear metas
- **Toast notifications** para feedback inmediato
- **Validaciones** de autenticación y superávit disponible

---

## ✅ Checklist de Pruebas - Creación de Metas

### **Prueba 1: Plan Conservador (70/20/10) - RD$ 10,000**

**Prerequisito:** Usuario autenticado con superávit de RD$ 10,000

**Pasos:**
1. Ir a **Ingresos** → Click "💡 Administrar Superávit"
2. Modal abre con disponible: **RD$ 10,000.00**
3. Click en **"Aplicar Plan"** del **Plan Conservador**

**Resultado Esperado - Modal de Confirmación:**
- ✅ Aparece modal de confirmación
- ✅ Título: "¿Crear Metas Automáticas?"
- ✅ Mensaje: "Se crearán 3 metas por un total de RD$ 10,000.00"
- ✅ Botones: Cancelar / Confirmar

4. Click en **Confirmar**

**Resultado Esperado - Creación:**
- ✅ Botón cambia a "Creando..."
- ✅ Toast verde aparece: "✅ 3 metas creadas exitosamente"
- ✅ Modal se cierra después de 2 segundos

**Verificación en Firestore:**
```
Colección: goals
Documentos creados: 3

Meta 1:
  - name: "Ahorro de Emergencia"
  - targetAmount: 7000.00
  - currentAmount: 0
  - category: "savings"
  - planId: "conservative"
  - source: "surplus_plan"
  - status: "active"
  - periodKey: "2025-12" (o mes actual)

Meta 2:
  - name: "Metas a Corto Plazo"
  - targetAmount: 2000.00
  - category: "goals"

Meta 3:
  - name: "Desarrollo Personal"
  - targetAmount: 1000.00
  - category: "personal"

Suma total: 10,000.00 ✅
```

---

### **Prueba 2: Plan Balanceado (50/30/20) - RD$ 15,000**

**Configuración:**
- Superávit: **RD$ 15,000**

**Pasos:**
1. Abrir modal de superávit
2. Click "Aplicar Plan" en **Plan Balanceado**
3. Confirmar

**Metas esperadas:**
- ✅ **Fondo de Ahorro:** RD$ 7,500.00 (50%)
- ✅ **Objetivos Financieros:** RD$ 4,500.00 (30%)
- ✅ **Inversión Personal:** RD$ 3,000.00 (20%)
- ✅ **Suma:** RD$ 15,000.00 exacto

---

### **Prueba 3: Plan Agresivo (30/40/30) - RD$ 42,436.80**

**Configuración:**
- Presupuesto: RD$ 87,563.20
- Ingresos: RD$ 130,000.00
- Superávit: **RD$ 42,436.80** (caso real)

**Pasos:**
1. Abrir modal
2. Click "Aplicar Plan" en **Plan Agresivo**
3. Confirmar

**Metas esperadas:**
- ✅ **Reserva Financiera:** RD$ 12,731.04 (30%)
- ✅ **Metas Prioritarias:** RD$ 16,974.72 (40%)
- ✅ **Inversión y Crecimiento:** RD$ 12,731.04 (30%)
- ✅ **Suma:** RD$ 42,436.80 exacto

**Nota crítica:** Verificar que NO hay desviación por redondeo. El último bucket (personal) debe absorber cualquier residuo.

---

### **Prueba 4: Sin Superávit (available = 0)**

**Configuración:**
- Presupuesto: RD$ 50,000
- Ingresos: RD$ 48,000
- Superávit: **-RD$ 2,000** (deficit)
- `available = Math.max(0, -2000) = 0`

**Pasos:**
1. Intentar abrir modal de superávit

**Resultado Esperado:**
- ✅ Botón "Administrar Superávit" **NO debe aparecer** (estado = deficit)
- ✅ Si por algún bug el modal abre, los botones "Aplicar Plan" deben estar **disabled**

---

### **Prueba 5: Usuario No Autenticado**

**Configuración:**
- Logout del usuario
- Intentar aplicar plan (edge case, no debería suceder en UX normal)

**Resultado Esperado:**
- ✅ Error: "Usuario no autenticado"
- ✅ Toast rojo con mensaje de error
- ✅ Modal **NO se cierra**
- ✅ NO se crean metas en Firestore

---

### **Prueba 6: Cancelar Confirmación**

**Pasos:**
1. Abrir modal de superávit
2. Click "Aplicar Plan" (cualquier plan)
3. Modal de confirmación aparece
4. Click **"Cancelar"**

**Resultado Esperado:**
- ✅ Modal de confirmación se cierra
- ✅ Vuelve a modal principal de planes
- ✅ **NO se crean metas**
- ✅ NO se cierra el modal principal

---

### **Prueba 7: Error de Firestore (Simulado)**

**Configuración:** 
- Desconectar internet o deshabilitar Firestore temporalmente

**Pasos:**
1. Intentar aplicar plan
2. Confirmar

**Resultado Esperado:**
- ✅ Toast rojo aparece: "Error al crear las metas. Intenta nuevamente."
- ✅ Modal principal **NO se cierra**
- ✅ Usuario puede reintentar

---

### **Prueba 8: Click Outside Durante Confirmación**

**Pasos:**
1. Abrir modal de superávit
2. Click "Aplicar Plan"
3. Modal de confirmación abre
4. Click **fuera del modal de confirmación** (en el overlay oscuro)

**Resultado Esperado:**
- ✅ Modal de confirmación **NO se cierra** (tiene stopPropagation)
- ✅ Solo se puede cerrar con botones Cancelar/Confirmar

---

### **Prueba 9: Redondeo Exacto - Decimales Complejos**

**Configuración:**
- Superávit: **RD$ 9,999.99**

**Plan Conservador (70/20/10):**
```
Cálculo esperado:
  savings = round(9999.99 * 0.7 * 100) / 100 = round(699999.3) / 100 = 6999.99
  goals   = round(9999.99 * 0.2 * 100) / 100 = round(199999.8) / 100 = 2000.00
  personal = 9999.99 - 6999.99 - 2000.00 = 1000.00

Suma: 6999.99 + 2000.00 + 1000.00 = 10,000.00 ❌ (INCORRECTO)

Corrección con residuo:
  personal = round((9999.99 - 6999.99 - 2000.00) * 100) / 100 = 1000.00
  
Verificar en Firestore que suma sea EXACTAMENTE 9,999.99
```

**Criterio:** Si la suma no es exacta, el algoritmo de redondeo está fallando.

---

### **Prueba 10: SSOT Compliance**

**Objetivo:** Verificar que IncomeScreen NO recalcula nada

**Pasos:**
1. Inspeccionar código de `IncomeScreen.tsx`
2. Buscar cualquier cálculo de `budgetTotal` o `incomeTotal`

**Resultado Esperado:**
- ✅ `IncomeScreen` solo consume `budgetPeriodData` (SSOT)
- ✅ `SurplusDistributionModal` recibe `budgetPeriodData` como prop
- ✅ `available = Math.max(0, budgetPeriodData.incomeSurplus)` (única transformación permitida)
- ✅ NO hay recálculos de presupuesto/ingresos en ningún componente UI

---

### **Prueba 11: PeriodKey Correcto**

**Objetivo:** Verificar que las metas se crean con el período correcto

**Pasos:**
1. Aplicar plan
2. Verificar en Firestore el campo `periodKey`

**Resultado Esperado:**
- ✅ `periodKey` formato: "YYYY-MM"
- ✅ Corresponde al mes actual (ej: "2025-12")
- ✅ Si estamos en diciembre 2025 → `periodKey = "2025-12"`

---

### **Prueba 12: Múltiples Aplicaciones del Mismo Plan**

**Escenario:** Usuario aplica el mismo plan dos veces en el mismo mes

**Pasos:**
1. Aplicar Plan Balanceado
2. Verificar 3 metas creadas
3. Volver a modal → Aplicar Plan Balanceado nuevamente

**Resultado Esperado (Actual):**
- ✅ Se crean **otras 3 metas** (total 6)
- ⚠️ **Nota:** Esto es comportamiento MVP. En Fase 2.2 se debería agregar validación para evitar duplicados usando `hasGoalsForPeriod()`

**Mejora futura:** Deshabilitar botón si ya existen metas del período actual con `source: 'surplus_plan'`

---

## 🎯 Criterios de Aceptación General

### **Funcionales:**
- ✅ Botones "Aplicar Plan" crean 3 metas reales en Firestore
- ✅ Modal de confirmación aparece antes de crear
- ✅ Montos suman **exactamente** el superávit disponible
- ✅ Toast de éxito aparece y cierra modal después de 2s
- ✅ Toast de error aparece y **NO cierra** modal
- ✅ Usuario no autenticado recibe error apropiado
- ✅ Superávit <= 0 deshabilita botones

### **SSOT:**
- ✅ `IncomeScreen` NO recalcula budget/income
- ✅ `SurplusDistributionModal` usa `budgetPeriodData.incomeSurplus`
- ✅ `calculatePlanAllocations()` es función pura
- ✅ `createGoalsFromPlan()` no altera estado local

### **UX:**
- ✅ Flujo completo: Click → Confirmar → Toast → Cerrar
- ✅ Cancelar vuelve a modal principal sin crear nada
- ✅ Loading state ("Creando...") durante operación
- ✅ Click outside no cierra modal de confirmación

### **Firestore Schema:**
- ✅ Campos obligatorios presentes: `userId`, `name`, `targetAmount`, `periodKey`, `planId`, `category`, `source`, `status`, `createdAt`
- ✅ `source: 'surplus_plan'` para distinguir de metas manuales
- ✅ `periodKey` en formato correcto
- ✅ `currentAmount: 0` por defecto

---

## 🚨 Posibles Problemas a Verificar

### **1. Redondeo incorrecto**
- ❌ Si `savings + goals + personal !== available`
- ✅ Último bucket debe recibir residuo

### **2. Firebase no inicializado**
- ❌ Error: "Firebase configuration incomplete"
- ✅ Verificar `.env.local` con credenciales

### **3. Usuario no autenticado**
- ❌ `auth.currentUser = null`
- ✅ Mostrar error, no crash

### **4. Múltiples clicks rápidos**
- ❌ Usuario hace double-click en "Confirmar"
- ✅ Estado `isCreating` previene duplicados

---

## ✅ Checklist Final Pre-Aprobación Fase 2.1

Antes de marcar Fase 2.1 como completada:

- [ ] **Prueba 1-3:** Planes crean metas correctas
- [ ] **Prueba 4:** Sin superávit no permite crear
- [ ] **Prueba 5:** Error de autenticación manejado
- [ ] **Prueba 6:** Cancelar funciona correctamente
- [ ] **Prueba 7:** Error de Firestore manejado
- [ ] **Prueba 9:** Redondeo exacto verificado
- [ ] **Prueba 10:** SSOT compliance confirmado
- [ ] **Prueba 11:** PeriodKey correcto
- [ ] **Sin errores TypeScript**
- [ ] **Sin warnings en consola**
- [ ] **Metas visibles en sección Goals de la app**

---

## 📝 Tech Debt Anotado

```typescript
// TODO Fase 2.2: Prevenir duplicados
// Usar hasGoalsForPeriod() para deshabilitar botón si ya existen metas
// del período actual con source='surplus_plan'

// TODO Fase 2.2: Sincronización UI
// Después de crear metas, actualizar contexto de goals
// para que aparezcan inmediatamente en GoalsManagement sin refresh

// TODO Fase 3: Edición de metas
// Permitir al usuario ajustar montos antes de confirmar
// (custom allocation en lugar de solo 3 planes fijos)
```

---

**Si todas las pruebas pasan: ✅ Fase 2.1 MVP aprobada para merge**

**Si hay fallos:** Documentar issue específico y resolver antes de continuar a Fase 2.2.
