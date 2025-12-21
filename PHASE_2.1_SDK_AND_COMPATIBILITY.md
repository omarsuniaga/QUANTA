# 🔧 Fase 2.1 - SDK y Estrategia de Compatibilidad

**Fecha:** 21 de diciembre de 2025  
**Objetivo:** Documentar decisiones técnicas de SDK y backwards compatibility

---

## 📦 **1. Firebase SDK - Compat vs Modular**

### **Decisión: Firebase Compat SDK (v12.6.0)**

**Evidencia en el código:**
```typescript
// firebaseConfig.ts (líneas 1-3)
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

export const db = app.firestore();
export const auth = app.auth();
```

**Por qué Compat:**
- ✅ Todo el proyecto usa imports compat consistentemente
- ✅ `db.collection()`, `db.batch()` son APIs compat
- ✅ Evita migración masiva a SDK modular
- ✅ Compatible con firebase v12.6.0

---

### **Imports Correctos en goalsService.ts**

```typescript
// ✅ CORRECTO (Compat SDK)
import firebase from 'firebase/compat/app';
import { db, auth } from '../firebaseConfig';

// Uso correcto:
firebase.firestore.FieldValue.serverTimestamp()
db.collection('goals')
db.batch()
```

```typescript
// ❌ INCORRECTO (Modular SDK - NO usar)
import { serverTimestamp } from 'firebase/firestore';
import { collection, query, where } from 'firebase/firestore';

// Estos son imports modulares y causarían errores
```

---

### **No Mezclar SDKs**

**Problema detectado y corregido:**
```typescript
// ❌ ANTES (mezcla incorrecta)
import { db } from '../firebaseConfig';              // compat
import { serverTimestamp } from 'firebase/firestore'; // modular ❌

createdAt: serverTimestamp() // Error en runtime
```

```typescript
// ✅ DESPUÉS (consistente)
import firebase from 'firebase/compat/app';
import { db, auth } from '../firebaseConfig';

createdAt: firebase.firestore.FieldValue.serverTimestamp() // ✅
```

---

### **APIs Compat Usadas en goalsService**

| Operación | API Compat | Equivalente Modular |
|-----------|------------|---------------------|
| **Timestamp** | `firebase.firestore.FieldValue.serverTimestamp()` | `serverTimestamp()` |
| **Batch** | `db.batch()` | `writeBatch(db)` |
| **Collection** | `db.collection('goals')` | `collection(db, 'goals')` |
| **Query** | `.where('userId', '==', uid)` | `query(col, where(...))` |
| **Get** | `.get()` | `getDocs(query)` |

---

## 🔄 **2. Backwards Compatibility - Status Field**

### **Problema**

Goals creadas antes de Fase 2.1 pueden no tener campo `status`:

```typescript
// Goal antigua (antes de Fase 2.1)
{
  id: "abc123",
  name: "Emergency Fund",
  targetAmount: 5000,
  currentAmount: 1000
  // ❌ No tiene campo 'status'
}

// Goal nueva (después de Fase 2.1)
{
  id: "def456",
  name: "Ahorro de Emergencia",
  targetAmount: 7000,
  currentAmount: 0,
  status: "active" // ✅ Campo presente
}
```

---

### **Estrategia Elegida: Opción B - Fallback en Lectura**

**Decisión:** Tratar goals sin `status` como `active` en queries.

**Ventajas:**
- ✅ No requiere migración masiva
- ✅ Goals antiguos funcionan inmediatamente
- ✅ Nuevos goals siempre tienen `status='active'`
- ✅ Implementación simple

**Alternativa descartada (Opción A - Migración):**
- ❌ Requiere script de migración one-time
- ❌ Riesgo si el script falla mid-execution
- ❌ Complejidad adicional

---

### **Implementación de Fallback**

**hasGoalsForPeriod() con fallback:**

```typescript
export const hasGoalsForPeriod = async (periodKey: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  // Query SIN filtro de status (captura goals antiguos)
  const snapshot = await db
    .collection('goals')
    .where('userId', '==', user.uid)
    .where('periodKey', '==', periodKey)
    .where('source', '==', 'surplus_plan')
    .get();

  // Filtrar en cliente: status='active' OR status=undefined
  const activeGoals = snapshot.docs.filter(doc => {
    const status = doc.data().status;
    return status === 'active' || status === undefined; // ✅ Fallback
  });

  return activeGoals.length > 0;
};
```

**Por qué filtrar en cliente:**
- Firestore no soporta `where('status', 'in', ['active', undefined])`
- Query sin filtro de status + filtro en cliente = solución efectiva
- Performance aceptable (pocos docs por usuario/período)

---

**deleteGoalsForPeriod() con fallback:**

```typescript
export const deleteGoalsForPeriod = async (periodKey: string): Promise<boolean> => {
  // Query sin filtro de status
  const snapshot = await db
    .collection('goals')
    .where('userId', '==', user.uid)
    .where('periodKey', '==', periodKey)
    .where('source', '==', 'surplus_plan')
    .get();

  // Filtrar: status='active' OR status=undefined
  const goalsToDelete = snapshot.docs.filter(doc => {
    const status = doc.data().status;
    return status === 'active' || status === undefined; // ✅ Fallback
  });

  // Batch update a status='deleted'
  const batch = db.batch();
  goalsToDelete.forEach(doc => {
    batch.update(doc.ref, {
      status: 'deleted',
      deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  return true;
};
```

**Comportamiento:**
- Goals antiguas sin `status` → se marcan como `deleted`
- Goals con `status='active'` → se marcan como `deleted`
- Goals con `status='deleted'` → NO se afectan (ya filtradas)

---

### **Testing del Fallback**

**Caso 1: Goal antigua sin status**
```typescript
// Firestore actual
{
  userId: "user123",
  periodKey: "2025-12",
  source: "surplus_plan",
  name: "Old Goal"
  // NO tiene status
}

// hasGoalsForPeriod("2025-12") → true ✅
// deleteGoalsForPeriod("2025-12") → marca como deleted ✅
```

**Caso 2: Goal nueva con status**
```typescript
// Firestore actual
{
  userId: "user123",
  periodKey: "2025-12",
  source: "surplus_plan",
  status: "active",
  name: "New Goal"
}

// hasGoalsForPeriod("2025-12") → true ✅
// deleteGoalsForPeriod("2025-12") → marca como deleted ✅
```

**Caso 3: Goal ya eliminada**
```typescript
{
  status: "deleted",
  deletedAt: timestamp
}

// hasGoalsForPeriod() → false (filtrada) ✅
// deleteGoalsForPeriod() → NO afectada ✅
```

---

## 🔒 **3. Firestore Security Rules**

### **Ubicación:** `firestore.rules` (líneas 271-336)

### **Reglas Implementadas para Goals Collection**

**READ (líneas 322-324):**
```javascript
allow read: if isAuthenticated() && 
              resource.data.userId == request.auth.uid;
```
- ✅ Usuario solo lee SUS goals
- ❌ No puede leer goals de otros usuarios

**CREATE (línea 327):**
```javascript
allow create: if isValidGoalCreate();
```

Validaciones:
```javascript
function isValidGoalCreate() {
  return isAuthenticated() &&
         // userId DEBE coincidir con usuario autenticado
         request.resource.data.userId == request.auth.uid &&
         // Campos obligatorios
         request.resource.data.keys().hasAll([
           'userId', 'name', 'targetAmount', 'currentAmount', 
           'status', 'source', 'createdAt'
         ]) &&
         // Montos válidos
         isValidAmount(request.resource.data.targetAmount) &&
         isValidNonNegativeAmount(request.resource.data.currentAmount) &&
         request.resource.data.currentAmount <= request.resource.data.targetAmount &&
         // Status inicial válido
         request.resource.data.status in ['active', 'completed'] &&
         // Tamaño razonable
         isValidSize();
}
```

**Previene:**
- ❌ Usuario A crea goal con `userId` de Usuario B
- ❌ Crear goals sin campos obligatorios
- ❌ Montos negativos o inválidos

---

**UPDATE (línea 331):**
```javascript
allow update: if isValidGoalUpdate();
```

Validaciones:
```javascript
function isValidGoalUpdate() {
  return isAuthenticated() &&
         // NO se puede cambiar userId
         request.resource.data.userId == resource.data.userId &&
         // Solo el owner puede actualizar
         request.auth.uid == resource.data.userId &&
         // NO se puede cambiar createdAt
         request.resource.data.createdAt == resource.data.createdAt &&
         // Montos válidos
         isValidAmount(request.resource.data.targetAmount) &&
         isValidNonNegativeAmount(request.resource.data.currentAmount) &&
         // Transiciones de status válidas
         request.resource.data.status in ['active', 'deleted', 'completed'] &&
         isValidSize();
}
```

**Permite:**
- ✅ Actualizar `currentAmount`
- ✅ Actualizar `targetAmount`
- ✅ Cambiar `status` a 'deleted' (soft-delete)
- ✅ Cambiar `status` a 'completed'

**Previene:**
- ❌ Cambiar `userId` de la goal
- ❌ Cambiar `createdAt`
- ❌ Usuario B actualiza goal de Usuario A

---

**DELETE (línea 335):**
```javascript
allow delete: if false;
```
- ❌ **Eliminación física prohibida**
- ✅ Usar soft-delete (`status='deleted'`) vía UPDATE

**Razón:** Mantener auditoría e historial.

---

### **Índices Firestore Necesarios**

Firestore sugerirá crear estos índices al ejecutar las queries:

```
Collection: goals
Composite Index 1:
  - userId (ASC)
  - periodKey (ASC)
  - source (ASC)

Uso: hasGoalsForPeriod(), deleteGoalsForPeriod()
```

**Crear índice:**
1. Ejecutar query por primera vez
2. Firestore mostrará error con link
3. Click en link → índice se crea automáticamente
4. Esperar ~2 minutos para activación

---

## 🧪 **Testing de Security Rules**

### **Escenario 1: Usuario intenta leer goals de otro**

```javascript
// Usuario A autenticado (uid: "userA")
// Intenta leer goal de Usuario B

db.collection('goals')
  .where('userId', '==', 'userB') // ❌
  .get()

// Resultado: PERMISSION_DENIED
// Rule: resource.data.userId == request.auth.uid
```

---

### **Escenario 2: Usuario intenta crear goal para otro**

```javascript
// Usuario A autenticado (uid: "userA")
// Intenta crear goal con userId de Usuario B

db.collection('goals').add({
  userId: "userB", // ❌ Mismatch
  name: "Hack Goal",
  targetAmount: 1000,
  ...
})

// Resultado: PERMISSION_DENIED
// Rule: request.resource.data.userId == request.auth.uid
```

---

### **Escenario 3: Usuario cambia userId en update**

```javascript
// Usuario A intenta cambiar userId de su goal a Usuario B

db.collection('goals').doc('goalId').update({
  userId: "userB" // ❌ No permitido
})

// Resultado: PERMISSION_DENIED
// Rule: request.resource.data.userId == resource.data.userId
```

---

### **Escenario 4: Soft-delete válido**

```javascript
// Usuario A actualiza su propia goal

db.collection('goals').doc('goalId').update({
  status: "deleted",
  deletedAt: firebase.firestore.FieldValue.serverTimestamp()
})

// Resultado: SUCCESS ✅
// Rule: status in ['active', 'deleted', 'completed']
```

---

## 📊 **Resumen de Decisiones**

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| **SDK** | Firebase Compat (v12.6.0) | Consistencia con proyecto existente |
| **Timestamps** | `firebase.firestore.FieldValue.serverTimestamp()` | Server-side, zona horaria consistente |
| **Backwards Compat** | Fallback en lectura (Opción B) | No requiere migración, funciona inmediato |
| **Status antiguos** | Tratar como `active` | Goals sin status = activos por defecto |
| **Security** | Owner-only R/W | Usuario solo accede a SUS goals |
| **Delete** | Soft-delete obligatorio | Mantener auditoría |

---

## ✅ **Checklist de Validación**

**SDK Consistency:**
- [x] Todos los imports usan `firebase/compat/app`
- [x] `serverTimestamp()` usa sintaxis compat
- [x] No hay mezcla con modular SDK
- [x] `db.collection()` usado consistentemente

**Backwards Compatibility:**
- [x] Fallback implementado en `hasGoalsForPeriod()`
- [x] Fallback implementado en `deleteGoalsForPeriod()`
- [x] Goals antiguos sin status funcionan
- [x] Documentación clara de estrategia

**Security Rules:**
- [x] Owner-only read implementado
- [x] Create valida userId match
- [x] Update previene cambios de userId
- [x] Soft-delete permitido
- [x] Physical delete bloqueado
- [x] Validaciones de montos implementadas

---

## 🚀 **Deploy de Security Rules**

**Comando:**
```bash
firebase deploy --only firestore:rules
```

**Pre-deploy checklist:**
1. Backup de rules actuales
2. Test en Firebase Emulator si es posible
3. Deploy en horario de bajo tráfico
4. Monitorear logs después de deploy

---

## 📝 **Notas Finales**

### **Migración Futura (Opcional)**

Si en el futuro se decide migrar a SDK modular:

1. Actualizar imports globalmente
2. Reemplazar `db.collection()` → `collection(db, ...)`
3. Reemplazar `firebase.firestore.FieldValue.serverTimestamp()` → `serverTimestamp()`
4. Testing exhaustivo antes de merge

**Estimación:** 2-4 horas de trabajo + testing

### **Alternativa a Fallback (No implementada)**

Script de migración one-time para agregar `status='active'` a goals antiguos:

```typescript
// scripts/migrateGoalStatus.ts (NO implementado)
const migrateOldGoals = async () => {
  const snapshot = await db.collection('goals')
    .where('status', '==', null)
    .get();
    
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: 'active' });
  });
  
  await batch.commit();
};
```

**Por qué NO se implementó:**
- Fallback en lectura es más robusto
- Migración puede fallar mid-execution
- Complejidad adicional innecesaria

---

**Documento completado:** 21 de diciembre de 2025  
**Revisado por:** Cascade AI
