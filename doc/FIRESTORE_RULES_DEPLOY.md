# 🔥 Firestore Rules - Despliegue y Validación

## 🐛 Problema Resuelto

**Error original**: `FirebaseError: Missing or insufficient permissions`

**Causa raíz**: Las reglas requerían `createdAt` en `hasAll()`, pero `serverTimestamp()` NO está disponible durante la validación. Firebase procesa timestamps DESPUÉS de que las reglas pasan.

**Solución**: Excluir campos `serverTimestamp()` de validaciones `hasAll()`.

---

## 📋 Cambios Aplicados en `firestore.rules`

### ✅ Regla para `/goals/{goalId}` (root-level)

**CREATE:**
- ✅ Requiere: `userId`, `name`, `targetAmount`, `currentAmount`, `status`, `source`
- ✅ **NO** requiere `createdAt` (se agrega automáticamente por serverTimestamp)
- ✅ Validación: `userId == request.auth.uid` (solo el owner)
- ✅ Status permitido: `active`, `completed`
- ✅ Amounts: `targetAmount > 0`, `currentAmount >= 0`, `currentAmount <= targetAmount`

**READ:**
- ✅ Solo el owner: `resource.data.userId == request.auth.uid`
- ✅ Soporta queries con filtro `userId`

**UPDATE:**
- ✅ Solo el owner puede actualizar
- ✅ `userId` y `createdAt` inmutables
- ✅ Status permitido: `active`, `completed`, `deleted` (soft-delete)
- ✅ Permite agregar `deletedAt` (serverTimestamp) en soft-delete

**DELETE:**
- ❌ **BLOQUEADO** - usar soft-delete: `status='deleted'` + `deletedAt`

---

## 🚀 Desplegar las Reglas

### 1️⃣ Verificar Firebase CLI instalado

```bash
firebase --version
```

Si no está instalado:
```bash
npm install -g firebase-tools
```

### 2️⃣ Autenticarse (si es necesario)

```bash
firebase login
```

### 3️⃣ Verificar proyecto actual

```bash
firebase use
```

Si necesitas cambiar de proyecto:
```bash
firebase use <project-id>
```

### 4️⃣ **DESPLEGAR SOLO REGLAS** (sin afectar funciones/hosting)

```bash
firebase deploy --only firestore:rules
```

**Salida esperada:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/<project-id>/overview
```

⏱️ **Tiempo:** ~10-15 segundos

---

## ✅ Validación Rápida

### Test 1: Lectura (READ)

Ejecuta esto en tu app (con usuario autenticado):

```typescript
import { db, auth } from './firebaseConfig';

const testRead = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Usuario no autenticado');
    return;
  }

  try {
    const snapshot = await db
      .collection('goals')
      .where('userId', '==', user.uid)
      .limit(1)
      .get();
    
    console.log('✅ READ exitoso - Goals encontrados:', snapshot.size);
  } catch (error) {
    console.error('❌ READ falló:', error);
  }
};

testRead();
```

**Resultado esperado:** `✅ READ exitoso`

---

### Test 2: Creación (CREATE)

Ejecuta esto en tu app (con usuario autenticado):

```typescript
import { db, auth } from './firebaseConfig';
import firebase from 'firebase/compat/app';

const testCreate = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Usuario no autenticado');
    return;
  }

  try {
    const docRef = await db.collection('goals').add({
      userId: user.uid,
      name: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 0,
      status: 'active',
      source: 'manual',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ CREATE exitoso - Goal ID:', docRef.id);
    
    // Cleanup: soft-delete
    await docRef.update({
      status: 'deleted',
      deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Cleanup exitoso (soft-delete)');
  } catch (error) {
    console.error('❌ CREATE falló:', error);
  }
};

testCreate();
```

**Resultado esperado:** `✅ CREATE exitoso` + `✅ Cleanup exitoso`

---

### Test 3: Soft-Delete (UPDATE con status='deleted')

```typescript
const testSoftDelete = async (goalId: string) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Usuario no autenticado');
    return;
  }

  try {
    await db.collection('goals').doc(goalId).update({
      status: 'deleted',
      deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ SOFT-DELETE exitoso');
  } catch (error) {
    console.error('❌ SOFT-DELETE falló:', error);
  }
};
```

---

### Test 4: Verificar DELETE físico está bloqueado

```typescript
const testPhysicalDelete = async (goalId: string) => {
  try {
    await db.collection('goals').doc(goalId).delete();
    console.error('❌ DELETE físico NO debería estar permitido');
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log('✅ DELETE físico bloqueado correctamente');
    } else {
      console.error('❌ Error inesperado:', error);
    }
  }
};
```

**Resultado esperado:** `✅ DELETE físico bloqueado correctamente`

---

## 🧪 Validación Automática (Opcional pero Recomendado)

Ver archivo: `firestore.rules.test.ts`

Ejecutar tests:
```bash
npm test -- firestore.rules.test.ts
```

---

## 📊 Verificar en Firebase Console

1. Ir a: https://console.firebase.google.com/project/<project-id>/firestore/rules
2. Verificar que la versión desplegada sea la más reciente
3. Ver timestamp de último despliegue

---

## 🔍 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa posible:**
- Usuario no autenticado (`auth.currentUser` es null)
- El documento no tiene `userId` o no coincide con `request.auth.uid`
- Las reglas no se desplegaron correctamente

**Solución:**
1. Verificar autenticación: `console.log(auth.currentUser?.uid)`
2. Re-desplegar reglas: `firebase deploy --only firestore:rules`
3. Esperar ~10 segundos para propagación

### Error: "Cannot read property 'createdAt'"

**Causa:** Intentando validar `serverTimestamp()` en las reglas

**Solución:** ✅ Ya corregido - `createdAt` excluido de `hasAll()`

### Error: "status is not defined"

**Causa:** Goal antiguo sin campo `status`

**Solución:** ✅ Ya manejado en `goalsService.ts` - se consideran `active` por defecto

---

## 📝 Notas Importantes

1. **serverTimestamp()** se procesa DESPUÉS de la validación de reglas
2. **Soft-delete** es obligatorio - delete físico bloqueado
3. **Backwards compatibility** con goals antiguos sin `status`
4. **userId** siempre debe coincidir con `request.auth.uid`
5. Las reglas se propagan en ~10-30 segundos globalmente

---

## ✅ Checklist Post-Despliegue

- [ ] Despliegue exitoso: `firebase deploy --only firestore:rules`
- [ ] Test READ ejecutado y exitoso
- [ ] Test CREATE ejecutado y exitoso
- [ ] Test SOFT-DELETE ejecutado y exitoso
- [ ] Test DELETE físico bloqueado confirmado
- [ ] Verificado en Firebase Console
- [ ] Tests automatizados ejecutados (opcional)
- [ ] `hasGoalsForPeriod()` funcionando sin errores
- [ ] `createGoalsFromPlan()` funcionando sin errores

---

**Estado:** ✅ Reglas actualizadas y listas para desplegar
