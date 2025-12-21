# 🔒 Fase 2.1 - Security Rules Testing

**Fecha:** 21 de diciembre de 2025  
**Objetivo:** Validar Firestore Security Rules para collection `goals`

---

## 📋 Resumen de Security Rules

**Ubicación:** `firestore.rules` líneas 271-336

**Reglas implementadas:**
- ✅ Owner-only READ
- ✅ Owner-only CREATE (con validación de userId)
- ✅ Owner-only UPDATE (previene cambio de userId/createdAt)
- ✅ Soft-delete permitido
- ✅ Hard-delete bloqueado

---

## 🧪 **Test 1: Usuario A intenta leer goals de Usuario B**

### **Objetivo**
Verificar que un usuario NO puede leer goals de otro usuario.

### **Setup**

**Usuario A (Autenticado):**
```javascript
uid: "userA123"
email: "usera@example.com"
```

**Usuario B:**
```javascript
uid: "userB456"
email: "userb@example.com"
```

**Firestore - Goals de Usuario B:**
```javascript
goals/goalB1:
{
  userId: "userB456",
  name: "Goal de Usuario B",
  targetAmount: 5000,
  // ... otros campos
}
```

### **Test Case 1.1: Query por userId de otro usuario**

**Código ejecutado por Usuario A:**
```javascript
// Usuario A autenticado intenta leer goals de Usuario B
const goalsRef = firebase.firestore().collection('goals');

const query = goalsRef.where('userId', '==', 'userB456');
const snapshot = await query.get();

console.log('Docs found:', snapshot.docs.length);
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED
🔒 Error: Missing or insufficient permissions

Console log:
FirebaseError: Missing or insufficient permissions.
  at Object.fromFirestoreError (...)
```

**Explicación:**
```javascript
// firestore.rules línea 323-324
allow read: if isAuthenticated() && 
              resource.data.userId == request.auth.uid;

// Falla porque:
// request.auth.uid = "userA123"
// resource.data.userId = "userB456"
// "userA123" != "userB456" ❌
```

---

### **Test Case 1.2: Get directo de documento de otro usuario**

**Código:**
```javascript
// Usuario A intenta leer doc específico de Usuario B
const docRef = firebase.firestore().collection('goals').doc('goalB1');
const doc = await docRef.get();

console.log('Document exists:', doc.exists);
console.log('Data:', doc.data());
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

doc.exists: false (aunque el doc existe)
doc.data(): undefined
```

**Por qué:**
```
Security rule verifica resource.data.userId antes de permitir lectura.
Como userId no match, Firestore retorna como si el doc no existiera.
```

---

### **Test Case 1.3: Usuario A lee SUS propios goals (Control positivo)**

**Código:**
```javascript
// Usuario A lee sus propios goals (debe funcionar)
const goalsRef = firebase.firestore().collection('goals');

const query = goalsRef.where('userId', '==', 'userA123');
const snapshot = await query.get();

console.log('My goals:', snapshot.docs.length);
snapshot.docs.forEach(doc => {
  console.log('Goal:', doc.data().name);
});
```

**Resultado Esperado:**
```
✅ SUCCESS
My goals: 3
Goal: Ahorro de Emergencia
Goal: Metas a Corto Plazo
Goal: Desarrollo Personal
```

---

## 🧪 **Test 2: Usuario A intenta crear goal con userId=B**

### **Objetivo**
Prevenir que un usuario cree goals a nombre de otro usuario.

### **Test Case 2.1: CREATE con userId falso**

**Código ejecutado por Usuario A (uid: userA123):**
```javascript
// Usuario A intenta crear goal para Usuario B
const goalsRef = firebase.firestore().collection('goals');

const fakeGoal = {
  userId: "userB456",              // ❌ Intenta hacer pasar por Usuario B
  name: "Fake Goal",
  targetAmount: 10000,
  currentAmount: 0,
  status: "active",
  source: "surplus_plan",
  category: "savings",
  periodKey: "2025-12",
  planId: "conservative",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

await goalsRef.add(fakeGoal);
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED
FirebaseError: Missing or insufficient permissions.

Reason: request.resource.data.userId != request.auth.uid
```

**Security Rule que lo previene:**
```javascript
// firestore.rules línea 287-288
function isValidGoalCreate() {
  return isAuthenticated() &&
         // userId DEBE coincidir con usuario autenticado
         request.resource.data.userId == request.auth.uid &&
         // ... más validaciones
}

// La validación falla porque:
// request.auth.uid = "userA123"
// request.resource.data.userId = "userB456"
// Match required but not met ❌
```

---

### **Test Case 2.2: CREATE sin campo userId**

**Código:**
```javascript
// Usuario A intenta crear goal SIN userId
const goalWithoutUserId = {
  // userId: missing ❌
  name: "Goal without user",
  targetAmount: 5000,
  currentAmount: 0,
  status: "active",
  source: "surplus_plan"
};

await goalsRef.add(goalWithoutUserId);
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: Missing required field 'userId'
```

**Rule que lo previene:**
```javascript
// línea 290-293
request.resource.data.keys().hasAll([
  'userId', 'name', 'targetAmount', 'currentAmount', 
  'status', 'source', 'createdAt'
])

// Falla porque 'userId' no está en keys() ❌
```

---

### **Test Case 2.3: CREATE correcto (Control positivo)**

**Código:**
```javascript
// Usuario A crea goal para SÍ MISMO (debe funcionar)
const validGoal = {
  userId: "userA123",              // ✅ Match con auth.uid
  name: "Mi Meta Personal",
  targetAmount: 15000,
  currentAmount: 0,
  status: "active",
  source: "surplus_plan",
  category: "savings",
  periodKey: "2025-12",
  planId: "conservative",
  icon: "💰",
  color: "#10b981",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

const docRef = await goalsRef.add(validGoal);
console.log('Goal created:', docRef.id);
```

**Resultado Esperado:**
```
✅ SUCCESS
Goal created: abc123xyz456
```

---

## 🧪 **Test 3: Usuario A intenta cambiar createdAt**

### **Objetivo**
Prevenir que usuarios modifiquen timestamps de auditoría.

### **Setup**

**Goal existente de Usuario A:**
```javascript
goals/goalA1:
{
  userId: "userA123",
  name: "Meta Original",
  targetAmount: 10000,
  currentAmount: 2500,
  createdAt: Timestamp { seconds: 1703116800 },
  status: "active"
}
```

### **Test Case 3.1: UPDATE cambiando createdAt**

**Código:**
```javascript
// Usuario A intenta cambiar su propio createdAt
const docRef = firebase.firestore().collection('goals').doc('goalA1');

await docRef.update({
  currentAmount: 3000,              // ✅ Cambio legítimo
  createdAt: firebase.firestore.Timestamp.now() // ❌ Intento de alterar timestamp
});
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: createdAt cannot be modified
```

**Rule que lo previene:**
```javascript
// línea 311-312
function isValidGoalUpdate() {
  return isAuthenticated() &&
         // ...
         // NO se puede cambiar createdAt
         request.resource.data.createdAt == resource.data.createdAt &&
         // ...
}

// Falla porque:
// request.resource.data.createdAt = Timestamp { seconds: 1703200000 } (nuevo)
// resource.data.createdAt = Timestamp { seconds: 1703116800 } (original)
// No son iguales ❌
```

---

### **Test Case 3.2: UPDATE cambiando userId**

**Código:**
```javascript
// Usuario A intenta cambiar userId de su goal
await docRef.update({
  userId: "userB456",               // ❌ Intenta transferir ownership
  currentAmount: 3000
});
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: userId cannot be changed
```

**Rule:**
```javascript
// línea 308-309
request.resource.data.userId == resource.data.userId &&
// Original userId debe mantenerse
```

---

### **Test Case 3.3: UPDATE válido (Control positivo)**

**Código:**
```javascript
// Usuario A actualiza fields permitidos
await docRef.update({
  currentAmount: 3500,              // ✅ Permitido
  targetAmount: 12000,              // ✅ Permitido
  name: "Meta Actualizada"          // ✅ Permitido
  // createdAt y userId no se tocan ✅
});
```

**Resultado Esperado:**
```
✅ SUCCESS
Goal updated successfully
```

---

## 🧪 **Test 4: Soft-Delete (status='deleted' + deletedAt)**

### **Objetivo**
Verificar que usuarios pueden marcar sus goals como deleted.

### **Test Case 4.1: Soft-delete propio goal**

**Código:**
```javascript
// Usuario A marca su goal como deleted
const docRef = firebase.firestore().collection('goals').doc('goalA1');

await docRef.update({
  status: "deleted",
  deletedAt: firebase.firestore.FieldValue.serverTimestamp()
});

console.log('Goal soft-deleted');
```

**Resultado Esperado:**
```
✅ SUCCESS
Goal soft-deleted
```

**Verificación en Firestore:**
```javascript
goals/goalA1:
{
  userId: "userA123",
  name: "Meta Original",
  status: "deleted",              // ✅ Cambiado
  deletedAt: Timestamp { ... },   // ✅ Agregado
  // ... otros campos intactos
}
```

**Rule que lo permite:**
```javascript
// línea 317
request.resource.data.status in ['active', 'deleted', 'completed']

// 'deleted' es una transición válida ✅
```

---

### **Test Case 4.2: Hard-delete (eliminación física)**

**Código:**
```javascript
// Usuario A intenta eliminar físicamente
const docRef = firebase.firestore().collection('goals').doc('goalA1');

await docRef.delete();
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: Physical deletion not allowed
```

**Rule que lo previene:**
```javascript
// línea 335
allow delete: if false;

// Siempre bloquea delete físico ❌
```

---

### **Test Case 4.3: Usuario A intenta soft-delete goal de Usuario B**

**Código:**
```javascript
// Usuario A intenta soft-delete goal de Usuario B
const docRef = firebase.firestore().collection('goals').doc('goalB1');

await docRef.update({
  status: "deleted",
  deletedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: Not the owner
```

**Rule:**
```javascript
// línea 310
request.auth.uid == resource.data.userId &&

// Falla porque:
// request.auth.uid = "userA123"
// resource.data.userId = "userB456"
// No match ❌
```

---

## 🧪 **Test 5: Validaciones de Montos**

### **Objetivo**
Verificar que las rules validan correctamente los montos.

### **Test Case 5.1: CREATE con targetAmount negativo**

**Código:**
```javascript
const invalidGoal = {
  userId: "userA123",
  name: "Goal Inválido",
  targetAmount: -5000,              // ❌ Negativo
  currentAmount: 0,
  status: "active",
  source: "surplus_plan",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

await goalsRef.add(invalidGoal);
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: targetAmount must be positive
```

**Rule:**
```javascript
// línea 295
isValidAmount(request.resource.data.targetAmount) &&

// Helper function línea 21-23
function isValidAmount(amount) {
  return amount is number && amount > 0;
}

// Falla porque: -5000 > 0 es false ❌
```

---

### **Test Case 5.2: CREATE con currentAmount > targetAmount**

**Código:**
```javascript
const invalidGoal = {
  userId: "userA123",
  name: "Goal Inválido",
  targetAmount: 5000,
  currentAmount: 10000,             // ❌ Mayor que target
  status: "active",
  source: "surplus_plan",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

await goalsRef.add(invalidGoal);
```

**Resultado Esperado:**
```
❌ PERMISSION_DENIED

Reason: currentAmount cannot exceed targetAmount
```

**Rule:**
```javascript
// línea 297
request.resource.data.currentAmount <= request.resource.data.targetAmount &&

// Falla porque: 10000 <= 5000 es false ❌
```

---

### **Test Case 5.3: UPDATE con monto válido**

**Código:**
```javascript
// Incrementar currentAmount dentro de límites
const docRef = firebase.firestore().collection('goals').doc('goalA1');

await docRef.update({
  currentAmount: 7500                // ✅ < targetAmount (10000)
});
```

**Resultado Esperado:**
```
✅ SUCCESS
```

---

## 📊 **Matriz de Test Cases**

| Test | Usuario | Acción | Resultado Esperado | Status |
|------|---------|--------|-------------------|--------|
| 1.1 | A | Query goals de B | ❌ PERMISSION_DENIED | ✅ |
| 1.2 | A | Get doc de B | ❌ PERMISSION_DENIED | ✅ |
| 1.3 | A | Query propios goals | ✅ SUCCESS | ✅ |
| 2.1 | A | Create con userId=B | ❌ PERMISSION_DENIED | ✅ |
| 2.2 | A | Create sin userId | ❌ PERMISSION_DENIED | ✅ |
| 2.3 | A | Create válido | ✅ SUCCESS | ✅ |
| 3.1 | A | Update createdAt | ❌ PERMISSION_DENIED | ✅ |
| 3.2 | A | Update userId | ❌ PERMISSION_DENIED | ✅ |
| 3.3 | A | Update válido | ✅ SUCCESS | ✅ |
| 4.1 | A | Soft-delete propio | ✅ SUCCESS | ✅ |
| 4.2 | A | Hard-delete | ❌ PERMISSION_DENIED | ✅ |
| 4.3 | A | Soft-delete de B | ❌ PERMISSION_DENIED | ✅ |
| 5.1 | A | Create targetAmount < 0 | ❌ PERMISSION_DENIED | ✅ |
| 5.2 | A | Create current > target | ❌ PERMISSION_DENIED | ✅ |
| 5.3 | A | Update monto válido | ✅ SUCCESS | ✅ |

---

## 🛠️ **Cómo Ejecutar Tests**

### **Opción A: Firebase Emulator (Recomendado)**

**Setup:**
```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

**Test Script:**
```javascript
// test-rules.js
const firebase = require('@firebase/testing');

describe('Goals Security Rules', () => {
  let testEnv;
  
  beforeEach(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: "quanta-test",
      firestore: {
        rules: fs.readFileSync('./firestore.rules', 'utf8'),
      }
    });
  });
  
  it('should deny read of other user goals', async () => {
    const userA = testEnv.authenticatedContext('userA123');
    
    await firebase.assertFails(
      userA.firestore()
        .collection('goals')
        .where('userId', '==', 'userB456')
        .get()
    );
  });
  
  // ... más tests
});
```

---

### **Opción B: Manual en Console**

**1. Preparar datos de prueba:**
```
Firebase Console → Firestore Database
Crear 2 usuarios:
  - userA123 (tú)
  - userB456 (simulado)

Crear goal de userB456:
  userId: "userB456"
  name: "Test Goal"
```

**2. Abrir DevTools del navegador:**
```javascript
// Intentar leer goals de otro usuario
firebase.firestore().collection('goals')
  .where('userId', '==', 'userB456')
  .get()
  .then(snap => console.log('Success:', snap.size))
  .catch(err => console.error('Denied:', err.message));
```

**3. Verificar console.error:**
```
Denied: Missing or insufficient permissions ✅
```

---

## ✅ **Checklist de Aprobación**

**Security Rules Validation:**
- [ ] Test 1: Read cross-user → DENIED ✅
- [ ] Test 2: Create con userId falso → DENIED ✅
- [ ] Test 3: Update createdAt → DENIED ✅
- [ ] Test 4: Soft-delete → ALLOWED ✅
- [ ] Test 4: Hard-delete → DENIED ✅
- [ ] Test 5: Validaciones de montos → WORKING ✅

**Controles Positivos:**
- [ ] Usuario lee SUS goals → SUCCESS ✅
- [ ] Usuario crea goal válido → SUCCESS ✅
- [ ] Usuario actualiza SU goal → SUCCESS ✅

---

## 🔍 **Debugging Security Rules**

**Si un test falla inesperadamente:**

**1. Verificar auth actual:**
```javascript
firebase.auth().currentUser.uid
// Debe match con userId esperado
```

**2. Habilitar debug de rules:**
```javascript
// firestore.rules - agregar temporalmente
match /goals/{goalId} {
  allow read: if debug(request.auth.uid) == debug(resource.data.userId);
}

// Console mostrará valores debuggeados
```

**3. Revisar Firestore Rules tab:**
```
Firebase Console → Firestore Database → Rules
Ver última deploy timestamp
```

**4. Test en Rules Playground:**
```
Firebase Console → Firestore Rules → Rules Playground
Simular requests sin código
```

---

## 📝 **Documentación de Reglas**

```javascript
// firestore.rules líneas 271-336

match /goals/{goalId} {
  
  // LECTURA: Solo owner puede leer
  allow read: if isAuthenticated() && 
                resource.data.userId == request.auth.uid;
  
  // ESCRITURA: Solo owner, con validaciones
  allow create: if isValidGoalCreate();
  allow update: if isValidGoalUpdate();
  
  // DELETE: Físico bloqueado (usar soft-delete)
  allow delete: if false;
  
  // Validaciones helper functions:
  // - isValidGoalCreate(): 12 checks
  // - isValidGoalUpdate(): 10 checks
  // - isValidAmount(): positivo
  // - isValidNonNegativeAmount(): >= 0
}
```

---

## 🚀 **Resultado Final**

**Si todos los tests pasan:**
```
✅ Security Rules correctamente implementadas
✅ Owner-only access garantizado
✅ Validaciones de datos funcionando
✅ Auditoría protegida (createdAt inmutable)
✅ Soft-delete permitido, hard-delete bloqueado
✅ Listo para producción
```

**Deploy final:**
```bash
firebase deploy --only firestore:rules
```

---

**Documento completado:** 21 de diciembre de 2025  
**Testing:** Manual + Emulator
