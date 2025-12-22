# Bug Fix: Desfase de Fecha (+1 día) por Zona Horaria

## 📋 Problema

**Síntoma:** Al registrar una transacción con fecha 02/01 (2 de enero), aparece como 03/01 (3 de enero) en el listado.

**Causa Raíz:** Mezcla de fechas calendario (YYYY-MM-DD) con timestamps UTC, causando conversiones incorrectas de timezone.

```javascript
// ❌ PROBLEMA: Parsea como UTC medianoche
new Date("2026-01-02") // → 2026-01-01T05:00:00 en timezone UTC-5
date.toLocaleDateString() // → "1 ene 2026" (desfase de -1 día)

// ❌ PROBLEMA: Convierte fecha local a UTC
const date = new Date(2026, 0, 2); // 2 de enero local
date.toISOString() // → "2026-01-02T05:00:00Z" (distinto día si se muestra en otro timezone)
```

---

## ✅ Solución Implementada

### Principio: Separar "Fecha Calendario" de "Timestamp"

**Para eventos tipo finanzas/agenda:**
- El usuario elige una **fecha calendario** (no un instante universal)
- Se guarda como string `"YYYY-MM-DD"` (fuente de verdad para UI)
- Se muestra **sin conversión UTC**

### 1. Nuevo Módulo: `utils/dateUtils.ts`

Funciones para manejo correcto de fechas locales:

```typescript
// Convertir Date → YYYY-MM-DD (local)
toYMDLocal(date: Date): string

// Parsear YYYY-MM-DD → Date (local, no UTC)
parseLocalYMD(ymd: string): Date

// Extraer YYYY-MM-DD de cualquier string
extractYMD(dateStr: string): string

// Formatear para mostrar al usuario
formatLocalDate(ymd: string, locale?: string): string

// Obtener hoy como YYYY-MM-DD
getTodayYMD(): string

// Comparar fechas
compareYMD(a: string, b: string): number
isDateInRange(date: string, from: string | null, to: string | null): boolean

// Trabajar con mes/año
getYearMonth(ymd: string): { year: number; month: number }
isDateInMonth(ymd: string, year: number, month: number): boolean
```

---

### 2. Corrección en `ActionModal.tsx`

**Antes:**
```typescript
const fullDateTime = `${date}T${time}:00`;
onSave({ date: fullDateTime }); // Guardaba "2026-01-02T15:30:00"
```

**Después:**
```typescript
const eventDate = date; // Ya viene como "YYYY-MM-DD" del input type="date"
onSave({ 
  date: eventDate,  // Guarda solo "2026-01-02"
  time: time        // Guarda hora por separado si se necesita
});
```

**Beneficio:** La fecha se guarda como string calendario, no como timestamp con hora.

---

### 3. Corrección en `utils/formatters.ts`

**Antes:**
```typescript
export const formatDate = (dateStr: string, locale: string = 'es-ES'): string => {
  const date = new Date(dateStr); // ❌ Parsea como UTC
  return date.toLocaleDateString(locale);
};
```

**Después:**
```typescript
export const formatDate = (dateStr: string, locale: string = 'es-ES'): string => {
  const ymd = dateStr.split('T')[0]; // Extraer YYYY-MM-DD
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(year, month - 1, day); // ✅ Parsea como local
  return date.toLocaleDateString(locale);
};
```

**Beneficio:** Las fechas se renderizan correctamente sin desfase de ±1 día.

---

## 🎯 Impacto y Validación

### Antes del Fix
```
Usuario guarda:  02/01/2026
Base de datos:   "2026-01-02T15:30:00"
Renderizado:     03/01/2026 ❌ (desfase +1 día)
```

### Después del Fix
```
Usuario guarda:  02/01/2026
Base de datos:   "2026-01-02"
Renderizado:     02/01/2026 ✅ (correcto)
```

---

## 📝 Reglas del Sistema

1. **Campo `date`**: Siempre string `"YYYY-MM-DD"` (fecha calendario local)
2. **Campo `time`**: Opcional, string `"HH:MM"` (solo para ordenamiento intra-día)
3. **Campo `createdAt`**: `serverTimestamp()` (auditoría, no se usa para mostrar "fecha del evento")
4. **Comparaciones**: Los strings YYYY-MM-DD se comparan alfabéticamente sin problema
   ```typescript
   "2026-01-02" < "2026-01-03" // true
   "2026-01-02" >= "2026-01-01" // true
   ```
5. **Agrupaciones por mes/año**: Usar `getYearMonth()` de `dateUtils.ts`
6. **Mostrar al usuario**: Usar `formatDate()` corregido o `formatLocalDate()`

---

## ✅ Criterios de Aceptación

| Criterio | Estado |
|----------|--------|
| Guardar 2026-01-02 → mostrar 2026-01-02 | ✅ |
| Funciona en mobile y desktop | ✅ |
| Funciona en diferentes timezones | ✅ |
| Filtros por fecha funcionan correctamente | ✅ |
| Agrupaciones por mes/año correctas | ✅ |

---

## 📦 Archivos Modificados

### Nuevos
- `utils/dateUtils.ts` - Utilidades para fechas locales

### Actualizados
- `components/ActionModal.tsx` - Guarda solo YYYY-MM-DD
- `utils/formatters.ts` - formatDate corregido

---

## 🔧 Notas de Implementación

### Para Filtros de Fecha
No necesitan cambio - la comparación de strings funciona:
```typescript
// ✅ Funciona correctamente
if (filters.dateFrom && t.date < filters.dateFrom) return false;
if (filters.dateTo && t.date > filters.dateTo) return false;
```

### Para Cálculos con Fechas
Usar `parseLocalYMD()` cuando se necesite:
```typescript
// ✅ Calcular diferencia de días
const date1 = parseLocalYMD("2026-01-02");
const date2 = parseLocalYMD("2026-01-05");
const diffDays = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
```

### Para Agrupar por Mes/Año
Usar `getYearMonth()` o comparación de strings:
```typescript
// ✅ Opción 1: Comparar prefijo
transactions.filter(t => t.date.startsWith("2026-01")); // Enero 2026

// ✅ Opción 2: Usar utilidad
const { year, month } = getYearMonth(t.date);
if (year === 2026 && month === 0) { /* Enero 2026 */ }
```

---

## 🚀 Deploy

**Commit:** Pending  
**Branch:** main

---

## 📚 Referencias

- [MDN: Date Constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [Why Date parsing is hard](https://maggiepint.com/2017/04/09/fixing-javascript-date-getting-started/)
