# 🧪 Setup de Tests para Firestore Rules

## 📦 Instalación de Dependencias

```bash
npm install --save-dev @firebase/rules-unit-testing
```

## 🔥 Firebase Emulator Setup

### 1. Instalar Firebase CLI (si no está instalado)

```bash
npm install -g firebase-tools
```

### 2. Inicializar Emulators (solo primera vez)

```bash
firebase init emulators
```

Seleccionar:
- ✅ Firestore Emulator
- Puerto: 8080 (default)

### 3. Configurar `firebase.json`

Asegurar que existe esta configuración:

```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## ▶️ Ejecutar Tests

### Opción 1: Manual (2 terminales)

**Terminal 1 - Iniciar emulator:**
```bash
firebase emulators:start --only firestore
```

**Terminal 2 - Ejecutar tests:**
```bash
npm test -- firestore.rules.test.ts
```

### Opción 2: Script Automatizado

Agregar a `package.json`:

```json
{
  "scripts": {
    "test:rules": "firebase emulators:exec --only firestore 'npm test -- firestore.rules.test.ts'"
  }
}
```

Ejecutar:
```bash
npm run test:rules
```

## 📊 Resultados Esperados

```
✓ ✅ Permite crear goal con datos válidos y usuario autenticado
✓ ✅ Permite crear goal sin createdAt (se agrega por serverTimestamp)
✓ ❌ Rechaza crear goal sin autenticación
✓ ❌ Rechaza crear goal para otro usuario (userId diferente)
✓ ❌ Rechaza crear goal sin campo userId
✓ ❌ Rechaza crear goal con targetAmount negativo
✓ ❌ Rechaza crear goal con currentAmount > targetAmount
✓ ❌ Rechaza crear goal con status inválido
✓ ✅ Permite leer propios goals
✓ ✅ Permite query con filtro userId
✓ ❌ Rechaza leer goals de otro usuario
✓ ❌ Rechaza leer sin autenticación
✓ ✅ Permite actualizar propio goal
✓ ✅ Permite soft-delete (status=deleted + deletedAt)
✓ ✅ Permite marcar goal como completed
✓ ❌ Rechaza cambiar userId
✓ ❌ Rechaza actualizar goal de otro usuario
✓ ❌ Rechaza actualizar con currentAmount > targetAmount
✓ ❌ Rechaza delete físico (debe usar soft-delete)
✓ ✅ Permite crear 3 goals desde surplus plan
✓ ✅ Permite soft-delete batch de goals surplus_plan
✓ ✅ Permite query hasGoalsForPeriod

Test Files  1 passed (1)
     Tests  22 passed (22)
```

## 🔍 Troubleshooting

### Error: "Emulator not running"

**Solución:**
```bash
firebase emulators:start --only firestore
```

### Error: "Cannot find module '@firebase/rules-unit-testing'"

**Solución:**
```bash
npm install --save-dev @firebase/rules-unit-testing
```

### Error: "Port 8080 already in use"

**Solución 1 - Cambiar puerto en `firebase.json`:**
```json
{
  "emulators": {
    "firestore": {
      "port": 8081
    }
  }
}
```

**Solución 2 - Matar proceso:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8080 | xargs kill -9
```

### Tests fallan después de desplegar nuevas reglas

**Solución:**
1. Reiniciar emulator
2. Re-ejecutar tests
3. Verificar que `RULES_PATH` apunta a `./firestore.rules`

## 🎯 CI/CD Integration

### GitHub Actions

```yaml
name: Firestore Rules Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm install -g firebase-tools
      - run: npm run test:rules
```

## 📝 Notas

- Los tests usan Firebase Emulator LOCAL (no producción)
- Cada test limpia la DB antes de ejecutarse
- `withSecurityRulesDisabled()` permite setup sin validación
- Los tests validan EXACTAMENTE lo que sucederá en producción

---

**Estado:** ✅ Tests configurados y listos para ejecutar
