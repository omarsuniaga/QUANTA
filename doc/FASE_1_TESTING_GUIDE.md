# 🧪 Fase 1: Testing Guide - QUANTA

**Fecha:** 22 de diciembre de 2024  
**Objetivo:** Tests financieros críticos + Medición + Sync Retry Simple

---

## 📦 Archivos Creados

### Tests
- ✅ `contexts/TransactionsContext.test.ts` (6 tests)
- ✅ `hooks/useBudgetPeriod.test.ts` (7 tests)
- ✅ `tests/fixtures.ts` (datasets reutilizables)

### Utilidades
- ✅ `utils/devMetrics.ts` (medición de data loads)
- ✅ `services/syncRetryService.ts` (retry helper simple)

---

## 🚀 Ejecutar Tests

### Todos los tests de Fase 1
```bash
npm run test -- contexts/TransactionsContext.test.ts hooks/useBudgetPeriod.test.ts
```

### Solo TransactionsContext
```bash
npm run test -- contexts/TransactionsContext.test.ts
```

### Solo useBudgetPeriod
```bash
npm run test -- hooks/useBudgetPeriod.test.ts
```

### Con cobertura
```bash
npm run test -- --coverage
```

---

## 📊 Fixtures Disponibles

Los fixtures están en `tests/fixtures.ts` para reutilización:

### Accounts
```typescript
import { mockAccounts } from '../tests/fixtures';

const account = mockAccounts.bankAccount(); // $10k
const wallet = mockAccounts.walletAccount(); // $5k
const multiple = mockAccounts.multipleAccounts(); // 2 cuentas
```

### Transactions
```typescript
import { mockTransactions } from '../tests/fixtures';

const income = mockTransactions.incomeInAccount(5000);
const expense = mockTransactions.foodExpense(1000);
```

### Scenarios Completos
```typescript
import { scenarioAvailableBalance } from '../tests/fixtures';

const { accounts, transactions, goals } = scenarioAvailableBalance();
// Listo para usar en tests
```

**Scenarios disponibles:**
- `scenarioAvailableBalance()` - Caso base con todos los elementos
- `scenarioNoDoubleCount()` - Fail-case de doble conteo
- `scenarioWithoutAccounts()` - Sin cuentas (fallback)
- `scenarioBudgetCategorization()` - Budgeted vs unbudgeted
- `scenarioKeywordMatching()` - Food/Comida alias

---

## 📈 Sistema de Medición (DevMetrics)

### ¿Para qué?
Medir si hay **duplicación de data loads** y decidir si implementar `useAppDataLoader` (Fase 2).

### Uso Básico

```typescript
import { devMetrics } from '../utils/devMetrics';

// En un componente o servicio
devMetrics.trackDataLoad('TransactionsContext', 'Dashboard');
devMetrics.trackDataLoad('SettingsContext', 'Dashboard');
```

### En Consola del Browser
```javascript
// Ver reporte completo
window.devMetrics.getReport()

// Ver total de loads
window.devMetrics.getTotalDataLoads()

// Ver loads por fuente
window.devMetrics.getDataLoadsBySource()

// Imprimir reporte formateado
window.devMetrics.printReport()
```

### Interpretación

```javascript
{
  totalLoads: 8,
  bySource: {
    'TransactionsContext': 3,  // ⚠️ Se carga 3 veces
    'SettingsContext': 2,
    'Dashboard': 3
  },
  byScreen: {
    'Dashboard': 5,
    'Expenses': 3
  },
  hasDuplication: true,  // ⚠️ EVIDENCIA de duplicación
  recommendation: '⚠️ Duplicación detectada. Considerar implementar useAppDataLoader (Fase 2).'
}
```

**Regla de decisión:**
- ✅ `totalLoads < 10` y `hasDuplication = false` → **NO necesitas useAppDataLoader**
- ⚠️ `hasDuplication = true` → **EVIDENCIA clara**, implementar en Fase 2
- 💡 `totalLoads > 10` → **Revisar** cargas innecesarias

---

## 🔄 Sync Retry Service

### ¿Para qué?
Reintentos automáticos en operaciones de sincronización (Firebase, API calls).

### Uso Básico

```typescript
import { syncWithRetry } from '../services/syncRetryService';

// Operación con reintentos
const result = await syncWithRetry(
  () => storageService.saveTransaction(tx),
  { maxRetries: 3 }
);
```

### Opciones Disponibles

```typescript
interface SyncRetryOptions {
  maxRetries?: number;      // Default: 3
  initialDelay?: number;    // Default: 1000ms
  useBackoff?: boolean;     // Default: true (exponencial)
}
```

### Ejemplos de Uso

**Ejemplo 1: Guardar transacción con retry**
```typescript
try {
  const saved = await syncWithRetry(
    () => storageService.addTransaction(newTx),
    { maxRetries: 3, initialDelay: 1000 }
  );
  console.log('✅ Transacción guardada:', saved.id);
} catch (error) {
  console.error('❌ Falló después de 3 intentos:', error);
}
```

**Ejemplo 2: Batch operations**
```typescript
import { syncBatchWithRetry } from '../services/syncRetryService';

const results = await syncBatchWithRetry(
  transactions,
  (tx) => storageService.saveTransaction(tx),
  { maxRetries: 2 }
);

// Resultados parciales
results.forEach(({ item, result, error }) => {
  if (error) {
    console.error('Failed:', item.id, error);
  } else {
    console.log('Success:', result?.id);
  }
});
```

**Ejemplo 3: Firebase específico**
```typescript
import { firebaseSyncWithRetry } from '../services/syncRetryService';

await firebaseSyncWithRetry(
  () => db.collection('transactions').add(data)
);
// Automáticamente detecta errores retryables (network, 5xx, timeouts)
```

### Backoff Exponencial

```
Intento 1: 0ms       (inmediato)
Intento 2: 1000ms    (1s después)
Intento 3: 2000ms    (2s después)
Intento 4: 4000ms    (4s después)
```

### Errores Retryables

El servicio detecta automáticamente:
- ✅ Network errors (`fetch failed`, `network error`)
- ✅ HTTP 5xx errors (500-599)
- ✅ Timeout errors
- ✅ Firebase errors (`unavailable`, `deadline-exceeded`)

---

## 🧪 Tests Implementados

### TransactionsContext.test.ts

| # | Test | Fail-Case | Valor Esperado |
|---|------|-----------|----------------|
| 1 | availableBalance correcto | - | `6,000` |
| 2 | **NO doble conteo** | ✅ Crítico | `5,000` (no 10k) |
| 3 | Sin cuentas (fallback) | - | `2,000` |
| 4 | Múltiples cuentas y metas | - | `5,500` |
| 5 | Balance negativo | - | `-2,000` ✓ |
| 6 | Multi-moneda | - | Suma directa |

**Lógica testeada:**
```typescript
availableBalance = realBalance + newIncome - expense - committedSavings
// newIncome = solo ingresos con isIncludedInAccountBalance = false
```

### useBudgetPeriod.test.ts

| # | Test | Escenario | Resultado |
|---|------|-----------|-----------|
| 1 | Categorización exacta | Food + Transport + Entertainment | `budgeted = 1,500`, `unbudgeted = 800` |
| 2 | **Keyword matching** | "comida" budget + "restaurant" expense | Match ✓ |
| 3 | Remaining/percentage | Budget $1k, Gasto $600 | `remaining = 400`, `60%` |
| 4 | Income vs Budget gap | Budget > Income | `hasIncomeBudgetGap = true` |
| 5 | Presupuestos inactivos | 1 activo + 1 inactivo | Solo cuenta activo |
| 6 | Filtrado por período | Junio 2024 + otras fechas | Solo junio |
| 7 | BudgetService directo | Keyword "jumbo" → "supermercado" | Match ✓ |

---

## 📝 Añadir Nuevos Tests

### 1. Usar Fixtures Existentes

```typescript
import { scenarioAvailableBalance } from '../tests/fixtures';

it('mi nuevo test', () => {
  const { accounts, transactions, goals } = scenarioAvailableBalance();
  
  // Tu lógica de test
  expect(calculateStats(transactions, accounts, goals).balance).toBe(4000);
});
```

### 2. Crear Fixture Custom

```typescript
// En tests/fixtures.ts
export const scenarioMyCustomCase = () => ({
  accounts: [mockAccounts.bankAccount()],
  transactions: [
    mockTransactions.incomeNotInAccount(3000),
    mockTransactions.foodExpense(1000)
  ],
  goals: mockGoals.emptyGoals()
});

// En tu test
import { scenarioMyCustomCase } from '../tests/fixtures';

it('custom scenario', () => {
  const { accounts, transactions, goals } = scenarioMyCustomCase();
  // ...
});
```

---

## 🔍 Debugging

### Tests Fallando

```bash
# Ver output detallado
npm run test -- --reporter=verbose

# Solo un test específico
npm run test -- -t "should NOT double-count"

# Watch mode (re-ejecuta al cambiar archivos)
npm run test -- --watch
```

### DevMetrics

```javascript
// En consola del browser
window.devMetrics.reset(); // Limpiar métricas
window.devMetrics.trackDataLoad('Test', 'TestScreen'); // Test manual
window.devMetrics.printReport(); // Ver reporte
```

### Sync Retry

Los logs aparecen automáticamente en consola:
```
[SyncRetry] ⚠️ Intento 1/3 falló. Reintentando en 1000ms...
[SyncRetry] ⚠️ Intento 2/3 falló. Reintentando en 2000ms...
[SyncRetry] ✅ Operación exitosa después de 2 reintentos
```

---

## ✅ Checklist de Implementación

### Fase 1 (COMPLETADO)
- [x] Tests de `TransactionsContext.stats`
- [x] Tests de `useBudgetPeriod`
- [x] Fixtures reutilizables
- [x] Sistema de medición DevMetrics
- [x] Sync retry helper simple

### Próximos Pasos (Fase 2 - Solo si hay evidencia)

**Decidir DESPUÉS de recolectar datos con DevMetrics:**

1. **Si `hasDuplication = true`:**
   - [ ] Implementar `useAppDataLoader`
   - [ ] Centralizar carga inicial
   - [ ] Eliminar `useEffect` redundantes

2. **Si reintentos simples no bastan:**
   - [ ] Implementar cola de sincronización completa
   - [ ] Estados: `pending`, `processing`, `failed`, `completed`
   - [ ] Reconciliación avanzada de IDs

---

## 🎯 Métricas de Éxito

### Fase 1
- ✅ Coverage de lógica financiera > 80%
- ✅ Tests pasan en CI/CD
- ✅ 0 bugs críticos detectados en cálculos
- ✅ DevMetrics implementado y funcional

### KPIs para decidir Fase 2
- ⚠️ Si `totalDataLoads > 10` por sesión → Investigar
- ⚠️ Si `hasDuplication = true` → Implementar `useAppDataLoader`
- ✅ Si `totalDataLoads < 10` y no duplicación → **No hacer nada**

---

## 🚨 Troubleshooting

### Tests no compilan
```bash
# Reinstalar dependencias
npm install

# Limpiar cache
npm run test -- --clearCache
```

### DevMetrics no aparece en window
```javascript
// Solo está disponible en DEV mode
// Verificar: import.meta.env.DEV === true
```

### Sync retry lanza errores inmediatamente
```typescript
// Verificar que el error sea retryable
import { isRetryableError } from '../services/syncRetryService';

if (isRetryableError(error)) {
  // Se reintentará
} else {
  // Error no retryable (4xx, validation, etc.)
}
```

---

## 📚 Referencias

- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **REFACTOR_PLAN_EVALUATION.md:** Plan completo de 3 fases
- **UX_TECHNICAL_SUMMARY.md:** UX improvements implementadas

---

**Creado por:** Cascade AI  
**Fecha:** 22 de diciembre de 2024  
**Fase:** 1 de 3 (Foundation)
