# 🧪 Fase 2.1 - Smoke Tests Pre-Merge

**Fecha:** 21 de diciembre de 2025  
**Objetivo:** Pruebas manuales reales sin suposiciones antes del merge definitivo

---

## ⚠️ Pre-requisitos

**Setup:**
1. Usuario autenticado en Firebase
2. Firestore configurado y accesible
3. Security rules deployadas (firestore.rules)
4. App corriendo en dev mode

**Datos iniciales:**
- Presupuesto: RD$ 87,563.20 (configurable)
- Ingresos: RD$ 130,000.00 (configurable)
- Superávit calculado: RD$ 42,436.80

---

## 📋 **Smoke Test 1: Aplicar Plan con Surplus Real**

### **Objetivo**
Verificar que se crean 3 documentos en Firestore con montos exactos y serverTimestamp.

### **Pasos de Ejecución**

**1. Preparar estado inicial**
```
- Navegar a tab "Ingresos"
- Verificar que hay superávit visible
- Verificar que aparece botón "💡 Administrar Superávit"
```

**2. Abrir modal de planes**
```
- Click en "💡 Administrar Superávit"
- Modal se abre con título "Distribución de Superávit"
- Verificar disponible: "RD$ 42,436.80"
```

**3. Seleccionar Plan Conservador (70/20/10)**
```
- Verificar cálculos mostrados:
  • Ahorro de Emergencia (70%): RD$ 29,705.76
  • Metas a Corto Plazo (20%): RD$ 8,487.36
  • Desarrollo Personal (10%): RD$ 4,243.68
  • Suma: RD$ 42,436.80 ✅
```

**4. Click "Aplicar Plan"**
```
- Debe aparecer modal de confirmación
- Título: "¿Crear Metas Automáticas?"
- Mensaje: "Se crearán 3 metas automáticas por un total de RD$ 42,436.80"
- Botones: Cancelar | Confirmar
```

**5. Click "Confirmar"**
```
- Botón cambia a "Creando..."
- Esperar 1-2 segundos
```

### **Resultado Esperado**

**UI:**
- ✅ Toast verde aparece: "✅ 3 metas creadas exitosamente"
- ✅ Modal se cierra automáticamente después de 2 segundos
- ✅ No errores en consola del navegador

**Firestore Verification (Manual):**

Abrir Firebase Console → Firestore Database → Collection `goals`

**Verificar 3 documentos creados:**

**Documento 1 - Ahorro de Emergencia:**
```javascript
{
  userId: "tu_uid_real",              // ✅ Match con auth.currentUser.uid
  name: "Ahorro de Emergencia",       // ✅ Español si language='es'
  targetAmount: 29705.76,             // ✅ 70% exacto
  currentAmount: 0,                   // ✅ Inicial
  periodKey: "2025-12",               // ✅ Formato YYYY-MM
  planId: "conservative",             // ✅
  category: "savings",                // ✅
  source: "surplus_plan",             // ✅ Distingue de manuales
  status: "active",                   // ✅
  icon: "💰",                         // ✅
  color: "#10b981",                   // ✅ Verde
  createdAt: Timestamp {              // ✅ CRÍTICO: serverTimestamp
    seconds: 1703116800,
    nanoseconds: 123456789
  },
  contributionAmount: 0,
  contributionFrequency: "monthly",
  calculationMode: "time",
  autoDeduct: false
}
```

**Documento 2 - Metas a Corto Plazo:**
```javascript
{
  // ... campos similares
  name: "Metas a Corto Plazo",
  targetAmount: 8487.36,              // ✅ 20% exacto
  category: "goals",
  icon: "🎯",
  color: "#6366f1"                    // ✅ Índigo
}
```

**Documento 3 - Desarrollo Personal:**
```javascript
{
  // ... campos similares
  name: "Desarrollo Personal",
  targetAmount: 4243.68,              // ✅ 10% exacto (residuo)
  category: "personal",
  icon: "📈",
  color: "#f59e0b"                    // ✅ Ámbar
}
```

### **Validaciones Críticas**

**Suma Exacta:**
```
29705.76 + 8487.36 + 4243.68 = 42,436.80 ✅
```

**serverTimestamp:**
```
✅ Campo createdAt es Timestamp object (NO number)
✅ Timestamp tiene seconds y nanoseconds
✅ NO es Date.now() o timestamp del cliente
```

**userId Match:**
```
✅ userId en docs = auth.currentUser.uid
✅ Verificar en Firebase Console → Authentication
```

### **Goals UI Refresh**

**Verificar actualización inmediata:**
```
1. Después de crear metas, ir a tab "Dashboard" o donde se muestren goals
2. Las 3 metas deben aparecer INMEDIATAMENTE (sin refresh manual)
3. Si hay GoalsWidget o GoalsManagement, verificar que muestra las nuevas metas
```

**Código que lo hace posible:**
```typescript
// App.tsx línea 277
onGoalsCreated={refreshGoals}

// SettingsContext.tsx línea 265-272
const refreshGoals = useCallback(async () => {
  const gs = await storageService.getGoals();
  setGoals(gs);
}, []);
```

---

## 📋 **Smoke Test 2: Aplicar Plan con Duplicados (Reemplazo)**

### **Objetivo**
Verificar que aplicar un plan en el mismo mes muestra modal de reemplazo y hace soft-delete correcto.

### **Pre-requisito**
Completar Smoke Test 1 primero (ya existen 3 metas del mes actual).

### **Pasos de Ejecución**

**1. Volver a abrir modal**
```
- Tab "Ingresos" → "💡 Administrar Superávit"
- Modal abre con mismo disponible: RD$ 42,436.80
```

**2. Seleccionar Plan Balanceado (50/30/20)**
```
- Verificar cálculos diferentes:
  • Fondo de Ahorro (50%): RD$ 21,218.40
  • Objetivos Financieros (30%): RD$ 12,731.04
  • Inversión Personal (20%): RD$ 8,487.36
```

**3. Click "Aplicar Plan"**
```
- ⚠️ Debe aparecer modal DIFERENTE (amarillo)
- Título: "⚠️ Metas Existentes"
- Mensaje: "Ya tienes metas de planes de superávit para este mes. 
           Al continuar, se reemplazarán las metas anteriores con 
           RD$ 42,436.80 en 3 nuevas metas. 
           Tus metas manuales no se verán afectadas."
- Botón: "Reemplazar" (color amarillo) | "Cancelar"
- Icono: AlertCircle (⚠️) en lugar de Target
```

### **Resultado Esperado - Opción A: Cancelar**

**Si click "Cancelar":**
```
✅ Modal de confirmación se cierra
✅ Vuelve a modal principal de planes
✅ NO se modifican metas existentes
✅ NO se crean metas nuevas
```

### **Resultado Esperado - Opción B: Reemplazar**

**Si click "Reemplazar":**

**1. Proceso:**
```
- Botón cambia a "Creando..."
- Backend ejecuta:
  1. deleteGoalsForPeriod("2025-12") → soft-delete de 3 metas antiguas
  2. createGoalsFromPlan(...) → crear 3 metas nuevas
```

**2. UI:**
```
✅ Toast verde: "✅ 3 metas creadas exitosamente"
✅ Modal se cierra después de 2s
✅ Goals UI se actualiza inmediatamente
```

**3. Firestore Verification:**

**Metas antiguas (Plan Conservador):**
```javascript
// Doc 1 (antes: Ahorro de Emergencia)
{
  // ... campos originales
  status: "deleted",                  // ✅ Soft-delete
  deletedAt: Timestamp {              // ✅ Nuevo campo
    seconds: 1703117000
  }
}

// Docs 2 y 3 también tienen status='deleted'
```

**Metas nuevas (Plan Balanceado):**
```javascript
// Doc 4 - Fondo de Ahorro
{
  name: "Fondo de Ahorro",
  targetAmount: 21218.40,             // ✅ 50% del nuevo plan
  category: "savings",
  planId: "balanced",                 // ✅ Nuevo planId
  status: "active",                   // ✅
  createdAt: Timestamp { seconds: 1703117000 }
}

// Doc 5 - Objetivos Financieros (12731.04)
// Doc 6 - Inversión Personal (8487.36)
```

**Verificar suma:**
```
21218.40 + 12731.04 + 8487.36 = 42,436.80 ✅
```

### **Validaciones Críticas**

**Soft-Delete NO Hard-Delete:**
```
✅ Metas antiguas TODAVÍA existen en Firestore
✅ Tienen status='deleted'
✅ Tienen campo deletedAt con serverTimestamp
✅ NO fueron eliminadas físicamente
```

**Scoping Correcto:**
```
✅ Solo metas con:
  - userId = current user
  - periodKey = "2025-12"
  - source = 'surplus_plan'
  - status = 'active' (antes de delete)
✅ Metas manuales NO afectadas
✅ Metas de otros períodos NO afectadas
```

---

## 📋 **Smoke Test 3: Offline / Permission Denied**

### **Objetivo**
Verificar error handling cuando Firestore no está disponible.

### **Escenario A: Offline (Sin Internet)**

**Setup:**
```
1. Con DevTools abierto
2. Network tab → Throttling → Offline
3. O desconectar WiFi físicamente
```

**Pasos:**
```
1. Abrir modal de superávit
2. Seleccionar cualquier plan
3. Click "Aplicar Plan" → Confirmar
```

**Resultado Esperado:**
```
❌ Toast rojo aparece después de ~5-10 segundos
📱 Mensaje: "Error al crear las metas. Intenta nuevamente."
✅ Modal NO se cierra
✅ Usuario puede reintentar cuando vuelva la conexión
✅ Console muestra error de Firestore
```

### **Escenario B: Permission Denied (Sin Auth)**

**Setup:**
```
1. Abrir Firebase Console
2. Authentication → Buscar tu usuario → Disable user
3. O ejecutar: firebase.auth().signOut()
```

**Pasos:**
```
1. Intentar aplicar plan
```

**Resultado Esperado:**
```
❌ Toast rojo: "Usuario no autenticado"
✅ Modal NO se cierra
✅ NO se crean documentos en Firestore
✅ Console muestra error de auth
```

### **Escenario C: Firestore Rules Block (Simulado)**

**Setup (Temporal):**
```javascript
// firestore.rules - cambiar temporalmente
match /goals/{goalId} {
  allow write: if false; // ❌ Bloquear todo
}

// Deploy: firebase deploy --only firestore:rules
```

**Pasos:**
```
1. Aplicar plan
2. Confirmar
```

**Resultado Esperado:**
```
❌ Toast rojo: "Error al crear las metas. Intenta nuevamente."
✅ Modal NO se cierra
✅ Console muestra: "PERMISSION_DENIED"
```

**Restaurar rules:**
```javascript
allow write: if isValidGoalCreate(); // ✅ Restaurar
```

---

## 🎯 **Criterios de Éxito Global**

### **Smoke Test 1: ✅ Pasa si...**
- [x] 3 documentos creados en Firestore
- [x] Montos suman exactamente el superávit disponible
- [x] createdAt es serverTimestamp (NO Date.now())
- [x] userId match con usuario autenticado
- [x] Toast verde aparece
- [x] Modal se cierra automáticamente
- [x] Goals UI se actualiza inmediatamente

### **Smoke Test 2: ✅ Pasa si...**
- [x] Modal de advertencia aparece al re-aplicar plan
- [x] Botón dice "Reemplazar" (NO "Confirmar")
- [x] Color amarillo (warning) visible
- [x] Soft-delete funciona (status='deleted' + deletedAt)
- [x] 3 metas nuevas se crean correctamente
- [x] Metas antiguas NO eliminadas físicamente
- [x] Metas manuales NO afectadas

### **Smoke Test 3: ✅ Pasa si...**
- [x] Error offline manejado con toast rojo
- [x] Error auth manejado con mensaje apropiado
- [x] Modal NO se cierra en error
- [x] Usuario puede reintentar
- [x] No crashes o bugs visuales

---

## 🐛 **Posibles Problemas a Documentar**

### **Si Smoke Test 1 falla:**

**Problema: createdAt es number (Date.now())**
```javascript
// ❌ INCORRECTO
createdAt: 1703116800000 // number

// ✅ CORRECTO
createdAt: Timestamp { seconds: 1703116800, nanoseconds: ... }
```

**Solución:** Verificar que goalsService.ts usa:
```typescript
firebase.firestore.FieldValue.serverTimestamp()
```

---

**Problema: Suma no exacta (drift)**
```
Ejemplo: 29705.76 + 8487.36 + 4243.69 = 42,436.81 ❌ (1 centavo de más)
```

**Solución:** Verificar algoritmo de redondeo en surplusPlan.ts:
```typescript
const personal = Math.round((available - savings - goals) * 100) / 100;
```

---

**Problema: Goals UI no se actualiza**
```
Metas creadas en Firestore pero NO aparecen en UI sin refresh
```

**Solución:** Verificar que App.tsx pasa callback:
```typescript
<IncomeScreen onGoalsCreated={refreshGoals} />
```

---

### **Si Smoke Test 2 falla:**

**Problema: NO muestra modal de reemplazo**
```
Aplica plan en mismo mes pero no detecta duplicados
```

**Solución:** Verificar hasGoalsForPeriod() query:
```typescript
// Debe incluir backwards compatibility
const status = doc.data().status;
return status === 'active' || status === undefined;
```

---

**Problema: Hard-delete en lugar de soft-delete**
```
Metas antiguas desaparecen de Firestore
```

**Solución:** Verificar deleteGoalsForPeriod():
```typescript
// ✅ CORRECTO
batch.update(doc.ref, {
  status: 'deleted',
  deletedAt: timestamp
});

// ❌ INCORRECTO
batch.delete(doc.ref);
```

---

### **Si Smoke Test 3 falla:**

**Problema: App crash en error**
```
App se congela o muestra pantalla blanca
```

**Solución:** Verificar try-catch en createGoalsFromPlan():
```typescript
catch (error) {
  console.error('Error creating goals from plan:', error);
  return { success: false, error: '...' };
}
```

---

## 📊 **Checklist de Aprobación Final**

Antes de marcar Fase 2.1 como lista para merge:

- [ ] **Smoke Test 1:** Crear metas - PASSED
  - [ ] 3 docs en Firestore ✅
  - [ ] serverTimestamp ✅
  - [ ] Suma exacta ✅
  - [ ] Goals UI refresh ✅

- [ ] **Smoke Test 2:** Reemplazo - PASSED
  - [ ] Modal de advertencia ✅
  - [ ] Soft-delete ✅
  - [ ] Metas nuevas ✅

- [ ] **Smoke Test 3:** Error handling - PASSED
  - [ ] Offline ✅
  - [ ] Auth error ✅
  - [ ] Modal NO cierra ✅

- [ ] **Sin regresiones:**
  - [ ] Tests unitarios: 22/22 passing
  - [ ] No console errors
  - [ ] Performance OK (<2s crear metas)

---

## 🚀 **Próximo Paso**

**Si todos los smoke tests pasan:**
```bash
git add .
git commit -m "feat(phase-2.1): implement auto goal creation from surplus plans"
git push origin main
```

**Si algún smoke test falla:**
```
1. Documentar el problema específico aquí
2. Abrir issue si es crítico
3. Fix antes de merge
4. Re-ejecutar smoke tests
```

---

**Documento completado:** 21 de diciembre de 2025  
**Próximo:** PHASE_2.1_RULES_TESTING.md
