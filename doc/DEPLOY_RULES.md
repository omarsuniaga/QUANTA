# 🔐 Deploying Firestore Security Rules

Este documento explica cómo desplegar las reglas de seguridad de Firestore a producción.

---

## 📋 Contenido

1. [Verificación Local](#verificación-local)
2. [Deploy Manual](#deploy-manual)
3. [Deploy con Firebase CLI](#deploy-con-firebase-cli)
4. [Testing de Reglas](#testing-de-reglas)
5. [Troubleshooting](#troubleshooting)

---

## Verificación Local

Antes de desplegar, verifica que el archivo `firestore.rules` existe:

```bash
# Debe existir este archivo
ls firestore.rules
```

---

## Deploy Manual (Opción 1)

### Paso 1: Abrir Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto QUANTA
3. Ve a **Firestore Database** en el menú lateral
4. Click en la pestaña **Rules**

### Paso 2: Copiar y Pegar Reglas

1. Abre el archivo `firestore.rules` en tu editor
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)
3. Pega en el editor de Firebase Console
4. Click en **"Publicar"** o **"Publish"**

### Paso 3: Verificar

- Verás un mensaje de confirmación
- Las reglas estarán activas en 1-2 minutos
- Revisa que no haya errores de sintaxis

---

## Deploy con Firebase CLI (Opción 2 - Recomendada)

### Requisitos Previos

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Verificar proyecto
firebase projects:list
```

### Inicializar Firebase (Primera vez)

```bash
# En la raíz del proyecto QUANTA
firebase init firestore

# Responder:
# - Firestore Rules: firestore.rules ✓ (ya existe)
# - Firestore Indexes: firestore.indexes.json
```

### Deploy de Reglas

```bash
# Deploy SOLO las reglas (sin tocar hosting ni functions)
firebase deploy --only firestore:rules

# Ver output:
# === Deploying to 'quanta-xxxxx'...
# ✔  firestore: released rules firestore.rules to cloud.firestore
```

### Verificar Deploy

```bash
# Ver reglas activas
firebase firestore:rules get

# Debe mostrar el contenido de firestore.rules
```

---

## Testing de Reglas

### Opción 1: Simulador en Firebase Console

1. Firebase Console > Firestore > Rules
2. Click en **"Simulador"** o **"Simulator"**
3. Probar escenarios:

**Test 1: Usuario puede leer sus propias transacciones**
```javascript
Location: /users/user123/transactions/tx456
Auth: user123
Operation: get
Expected: ✅ Allow
```

**Test 2: Usuario NO puede leer transacciones ajenas**
```javascript
Location: /users/otherUser/transactions/tx456
Auth: user123
Operation: get
Expected: ❌ Deny
```

**Test 3: Crear transacción con monto válido**
```javascript
Location: /users/user123/transactions/newTx
Auth: user123
Operation: create
Data: {
  id: "newTx",
  amount: 100,
  type: "income",
  category: "Salary",
  description: "Test",
  date: "2025-01-15",
  isRecurring: false,
  createdAt: 1234567890
}
Expected: ✅ Allow
```

**Test 4: Crear transacción con monto negativo**
```javascript
Location: /users/user123/transactions/badTx
Auth: user123
Operation: create
Data: {
  id: "badTx",
  amount: -50,
  type: "expense",
  category: "Food",
  description: "Invalid",
  date: "2025-01-15",
  isRecurring: false,
  createdAt: 1234567890
}
Expected: ❌ Deny (amount must be > 0)
```

**Test 5: Usuario sin autenticar**
```javascript
Location: /users/user123/transactions/tx456
Auth: null
Operation: get
Expected: ❌ Deny (not authenticated)
```

**Test 6: Actualizar transacción cambiando ID**
```javascript
Location: /users/user123/transactions/tx456
Auth: user123
Operation: update
Existing Data: { id: "tx456", amount: 100, ... }
New Data: { id: "tx999", amount: 200, ... }
Expected: ❌ Deny (ID cannot be changed)
```

### Opción 2: Test desde la App

1. Abre tu app en desarrollo
2. Intenta crear una transacción normal
3. Verifica que funcione ✅
4. Intenta acciones prohibidas en la consola:

```javascript
// En la consola del navegador (debe fallar)
firebase.firestore()
  .collection('users')
  .doc('otherUserId')  // ID de otro usuario
  .collection('transactions')
  .get()
  .then(docs => console.log('Success:', docs))
  .catch(err => console.log('Denied:', err.message));

// Expected: "Denied: Missing or insufficient permissions"
```

---

## Características de las Reglas

### ✅ Seguridad Implementada

**Control de Acceso:**
- ✅ Solo el propietario puede leer/escribir sus datos
- ✅ Validación de autenticación en todas las operaciones
- ✅ IDs de usuario protegidos contra cambios
- ✅ Prevención de eliminación accidental de usuarios

**Validación de Datos:**
- ✅ Montos siempre positivos (> 0)
- ✅ Fechas en formato correcto (YYYY-MM-DD)
- ✅ Tipos de transacción válidos (income/expense)
- ✅ Frecuencias válidas (weekly, monthly, yearly)
- ✅ Emails con formato válido
- ✅ Tamaño máximo de documentos (1MB)

**Validación de Campos Requeridos:**
- ✅ Transactions: id, amount, type, category, description, date, createdAt
- ✅ Goals: id, name, targetAmount, currentAmount
- ✅ Accounts: id, name, balance, type
- ✅ Budgets: id, category, limit

**Protecciones Especiales:**
- ✅ IDs inmutables (no se pueden cambiar)
- ✅ createdAt inmutable en transacciones
- ✅ uid y email inmutables en usuarios
- ✅ currentAmount no puede exceder targetAmount en metas
- ✅ Audit logs read-only para usuarios

---

## Verificación Post-Deploy

### Checklist

- [ ] Deploy exitoso (sin errores)
- [ ] Reglas visibles en Firebase Console
- [ ] App puede crear transacciones
- [ ] App puede leer transacciones propias
- [ ] App NO puede leer transacciones de otros usuarios
- [ ] Validación de montos funciona (rechaza negativos)
- [ ] Validación de fechas funciona

### Comandos de Verificación

```bash
# Ver reglas activas
firebase firestore:rules get

# Ver logs de Firestore (errores de permisos)
firebase projects:list
# Luego ir a Firebase Console > Firestore > Usage tab
```

---

## Rollback (Si algo sale mal)

### Opción 1: Desde Firebase Console

1. Firebase Console > Firestore > Rules
2. Click en **"Historial"** o **"History"**
3. Seleccionar versión anterior
4. Click en **"Restaurar"** o **"Restore"**

### Opción 2: Desde Git

```bash
# Ver versión anterior de firestore.rules
git log --oneline -- firestore.rules

# Restaurar versión anterior
git checkout HEAD~1 -- firestore.rules

# Deploy versión anterior
firebase deploy --only firestore:rules
```

### Reglas de Emergencia (Modo Lectura/Escritura)

**⚠️ SOLO EN DESARROLLO - NUNCA EN PRODUCCIÓN**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Troubleshooting

### Error: "Permission denied"

**Síntoma:** La app no puede leer/escribir datos

**Causas posibles:**
1. Usuario no está autenticado
2. Intento de acceder a datos de otro usuario
3. Datos no cumplen validación

**Solución:**
```javascript
// Verificar en la consola del navegador
firebase.auth().currentUser
// Debe retornar el usuario actual, no null
```

### Error: "Document validation failed"

**Síntoma:** No se puede crear/actualizar documento

**Causas posibles:**
1. Monto negativo o cero
2. Fecha en formato incorrecto
3. Campos requeridos faltantes
4. Tipo de transacción inválido

**Solución:**
```javascript
// Verificar estructura de datos
const transaction = {
  id: "tx123",
  amount: 100,           // ✅ Positivo
  type: "income",        // ✅ Valid type
  category: "Salary",
  description: "Test",
  date: "2025-01-15",    // ✅ YYYY-MM-DD
  isRecurring: false,
  createdAt: Date.now()  // ✅ Timestamp
};
```

### Error: "Rules syntax error"

**Síntoma:** Deploy falla con error de sintaxis

**Solución:**
1. Copiar el contenido de `firestore.rules`
2. Pegar en [Rules Playground](https://firebase.google.com/docs/rules/simulator)
3. Verificar errores de sintaxis
4. Corregir y volver a desplegar

---

## Monitoreo

### Logs de Permisos Denegados

1. Firebase Console > Firestore > Usage
2. Revisar "Denied requests"
3. Identificar patrones sospechosos

### Métricas a Monitorear

- **Denied requests:** Debería ser bajo en uso normal
- **High denied rate:** Puede indicar problema en reglas o ataque
- **Read/Write patterns:** Verificar que sean normales

---

## Mejores Prácticas

### ✅ DO (Hacer)

- ✅ Probar reglas en simulador antes de deploy
- ✅ Desplegar en horarios de bajo tráfico
- ✅ Monitorear logs después de deploy
- ✅ Mantener backup de reglas anteriores
- ✅ Documentar cambios en reglas

### ❌ DON'T (No Hacer)

- ❌ Desplegar reglas sin probar
- ❌ Usar `allow read, write: if true` en producción
- ❌ Desactivar validaciones "temporalmente"
- ❌ Ignorar errores de permisos denegados
- ❌ Cambiar reglas sin revisar impacto

---

## Próximos Pasos

Una vez desplegadas las reglas:

1. ✅ Probar la app completa
2. ✅ Verificar que todas las operaciones funcionen
3. ✅ Monitorear logs por 24 horas
4. ✅ Continuar con Phase 2 (Performance Optimization)

---

## Recursos Adicionales

- [Firestore Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Rules Cookbook](https://firebase.google.com/docs/firestore/security/rules-cookbook)
- [Rules Simulator](https://firebase.google.com/docs/rules/simulator)

---

**Última actualización:** 2025-12-12
