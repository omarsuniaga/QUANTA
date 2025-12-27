# Firebase Setup Guide - QUANTA Finance App

Esta guía te ayudará a configurar Firebase correctamente para QUANTA, tanto en desarrollo como en producción.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial de Firebase](#configuración-inicial-de-firebase)
3. [Firestore Security Rules](#firestore-security-rules)
4. [Firebase Authentication](#firebase-authentication)
5. [Firebase Storage](#firebase-storage)
6. [Firebase Hosting](#firebase-hosting)
7. [Variables de Entorno](#variables-de-entorno)
8. [Deployment](#deployment)
9. [Checklist de Seguridad](#checklist-de-seguridad)

---

## Requisitos Previos

- [ ] Cuenta de Google/Gmail
- [ ] Node.js 18+ instalado
- [ ] Firebase CLI instalado: `npm install -g firebase-tools`
- [ ] Proyecto clonado localmente

---

## Configuración Inicial de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto" o "Add project"
3. Nombre del proyecto: `quanta-finance` (o el que prefieras)
4. Habilitar Google Analytics (opcional pero recomendado)
5. Click en "Crear proyecto"

### 2. Agregar Web App

1. En la página principal del proyecto, click en el ícono Web `</>`
2. Nombre de la app: `QUANTA Web`
3. **✅ Marcar:** "También configurar Firebase Hosting"
4. Click en "Registrar app"
5. **Copiar las credenciales** que aparecen:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:...",
  measurementId: "G-..."
};
```

6. Pegar estos valores en tu archivo `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

---

## Firestore Security Rules

### 1. Habilitar Firestore

1. En Firebase Console, ir a **Firestore Database**
2. Click en "Crear base de datos" o "Create database"
3. Seleccionar modo: **Producción** (production mode)
4. Seleccionar ubicación: `us-central1` (o la más cercana a tus usuarios)
5. Click en "Habilitar"

### 2. Implementar Security Rules

En Firebase Console > Firestore Database > Rules, pegar estas reglas:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidAmount(amount) {
      return amount is number && amount > 0;
    }

    function isValidDate(date) {
      return date is string && date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
    }

    // User profile (read-only by user, write on creation)
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) &&
                     request.resource.data.keys().hasOnly(['lastLoginAt', 'displayName', 'photoURL', 'status']);
      allow delete: if false; // Prevent accidental deletion

      // Transactions subcollection
      match /transactions/{transactionId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) &&
                       isValidAmount(request.resource.data.amount) &&
                       isValidDate(request.resource.data.date) &&
                       request.resource.data.type in ['income', 'expense'];
        allow update: if isOwner(userId) &&
                       isValidAmount(request.resource.data.amount);
        allow delete: if isOwner(userId);
      }

      // Goals subcollection
      match /goals/{goalId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) &&
                       isValidAmount(request.resource.data.targetAmount) &&
                       request.resource.data.currentAmount >= 0;
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      // Settings subcollection
      match /settings/{settingId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      // Accounts subcollection
      match /accounts/{accountId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) &&
                       request.resource.data.balance >= 0;
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      // Budgets subcollection
      match /budgets/{budgetId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) &&
                       isValidAmount(request.resource.data.limit);
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      // Subscriptions subcollection
      match /subscriptions/{subscriptionId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      // Quick Actions subcollection
      match /quickActions/{actionId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      // Promos subcollection
      match /promos/{promoId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      // Custom Categories subcollection
      match /categories/{categoryId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      // Notifications subcollection
      match /notifications/{notificationId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Características de estas reglas:**
- ✅ Solo el propietario accede a sus datos
- ✅ Validación de tipos de datos
- ✅ Protección contra eliminación accidental de usuarios
- ✅ Validación de montos positivos
- ✅ Validación de fechas en formato correcto
- ✅ Prevención de accesos no autorizados

### 3. Publicar las Rules

1. Copiar las reglas de arriba
2. Pegar en Firebase Console > Firestore > Rules
3. Click en **"Publicar"** o **"Publish"**
4. Verificar que no haya errores

### 4. Probar las Rules (Opcional)

En Firebase Console > Firestore > Rules > Simulador:

```javascript
// Test 1: Usuario puede leer sus propias transacciones
Location: /users/user123/transactions/tx456
Auth: user123
Operation: get
Result: ✅ Allow

// Test 2: Usuario NO puede leer transacciones de otro
Location: /users/otherUser/transactions/tx456
Auth: user123
Operation: get
Result: ❌ Deny

// Test 3: Crear transacción con monto válido
Location: /users/user123/transactions/newTx
Auth: user123
Operation: create
Data: { amount: 100, type: "income", date: "2025-01-15" }
Result: ✅ Allow

// Test 4: Crear transacción con monto inválido
Location: /users/user123/transactions/newTx
Auth: user123
Operation: create
Data: { amount: -50, type: "expense", date: "2025-01-15" }
Result: ❌ Deny
```

---

## Firebase Authentication

### 1. Habilitar Email/Password Authentication

1. En Firebase Console, ir a **Authentication**
2. Click en "Comenzar" o "Get started"
3. En la pestaña **"Sign-in method"**:
   - Habilitar **"Email/Password"** (Email/link opcional: NO)
   - Click en "Guardar"

### 2. Configuración de Dominios Autorizados

1. Ir a Authentication > Settings > Authorized domains
2. Agregar tus dominios:
   - `localhost` (ya viene por defecto)
   - Tu dominio de producción (ej: `quanta-finance.web.app`)
   - Dominios custom si los tienes

### 3. Políticas de Contraseña (Opcional)

1. En Authentication > Settings > Password policy
2. Configurar:
   - Longitud mínima: 8 caracteres
   - Requerir mayúsculas/minúsculas
   - Requerir números
   - Requerir símbolos especiales

---

## Firebase Storage

### 1. Habilitar Storage (para recibos/imágenes)

1. En Firebase Console, ir a **Storage**
2. Click en "Comenzar" o "Get started"
3. Seleccionar modo: **Producción**
4. Seleccionar ubicación: misma que Firestore
5. Click en "Listo"

### 2. Security Rules para Storage

En Storage > Rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidImageSize() {
      return request.resource.size < 5 * 1024 * 1024; // 5MB max
    }

    function isValidImageType() {
      return request.resource.contentType.matches('image/.*');
    }

    // User files (receipts, avatars)
    match /users/{userId}/{allPaths=**} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) &&
                    isValidImageSize() &&
                    isValidImageType();
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Firebase Hosting

### 1. Inicializar Firebase en el Proyecto

```bash
# En la raíz del proyecto QUANTA
firebase login
firebase init hosting
```

Responder a las preguntas:
- **Project:** Seleccionar tu proyecto Firebase
- **Public directory:** `dist`
- **Single-page app:** `Yes`
- **GitHub automatic builds:** `No` (configurar después si quieres)
- **Overwrite index.html:** `No`

### 2. Configurar firebase.json

El comando anterior creará `firebase.json`. Asegúrate de que tenga esta configuración:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          }
        ]
      }
    ]
  }
}
```

**Beneficios:**
- ✅ Cache agresivo para assets estáticos
- ✅ Headers de seguridad
- ✅ Rewrite para SPA routing

---

## Variables de Entorno

### Desarrollo Local

Archivo: `.env.local` (NO commitear)

```env
# Gemini AI
GEMINI_API_KEY=tu_clave_aqui

# Firebase
VITE_FIREBASE_API_KEY=tu_clave_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### Producción (Firebase Hosting)

Firebase Hosting **NO soporta** variables de entorno del lado del servidor. Las variables deben estar en el build.

**Solución:** Usar Firebase Environment Config o build-time variables.

**Opción 1: Build con variables** (Recomendado)

```bash
# Crear .env.production
cp .env.local .env.production

# Build con variables de producción
npm run build
```

**Opción 2: GitHub Actions** (para CI/CD)

```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
    # ... resto de variables
  run: npm run build

- name: Deploy to Firebase
  run: firebase deploy --only hosting
```

---

## Deployment

### Opción 1: Deploy Manual

```bash
# 1. Asegurarse de tener las variables de entorno
cat .env.local  # Verificar que existan

# 2. Build de producción
npm run build

# 3. Verificar el build localmente
npm run preview

# 4. Deploy a Firebase
firebase deploy --only hosting

# Ver la URL de producción
# https://tu-proyecto.web.app
```

### Opción 2: Deploy con Dominio Custom

1. **Agregar dominio custom:**
   - Firebase Console > Hosting > Add custom domain
   - Ingresar tu dominio (ej: `quanta.app`)
   - Seguir instrucciones para DNS

2. **Configurar DNS:**
   - Agregar registros A/AAAA que Firebase proporciona
   - Esperar propagación (24-48 horas)

3. **SSL Automático:**
   - Firebase provisiona SSL automáticamente
   - No requiere configuración adicional

### Opción 3: CI/CD con GitHub Actions

Crear `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: tu-proyecto-id
```

**Configurar Secrets en GitHub:**
1. GitHub Repo > Settings > Secrets and variables > Actions
2. Agregar cada variable como secret

---

## Checklist de Seguridad

### Antes de Deploy a Producción

#### Firebase Configuration
- [ ] Firestore Security Rules implementadas y publicadas
- [ ] Storage Security Rules implementadas (si usas Storage)
- [ ] Dominios autorizados configurados en Authentication
- [ ] Políticas de contraseña configuradas
- [ ] Rate limiting habilitado (App Check recomendado)

#### Environment Variables
- [ ] `.env.local` NO está en git (verificar con `git ls-files | grep env`)
- [ ] `.env.example` SÍ está en git con placeholders
- [ ] Variables de producción configuradas en CI/CD o build

#### Código
- [ ] `drop_console: true` en vite.config.ts para producción
- [ ] `sourcemap: false` en producción
- [ ] No hay credenciales hardcoded en el código
- [ ] Error boundaries implementados

#### Testing
- [ ] Build de producción funciona: `npm run build && npm run preview`
- [ ] Login/Registro funciona
- [ ] CRUD de transacciones funciona
- [ ] Firebase Rules bloquean accesos no autorizados (probar en simulador)

#### Monitoreo
- [ ] Firebase Analytics habilitado
- [ ] Error logging configurado (opcional: Sentry)
- [ ] Firebase Performance Monitoring habilitado (opcional)

#### Backup
- [ ] Exportación de Firestore configurada (opcional pero recomendado)
- [ ] Backup de reglas de seguridad guardado localmente

---

## Troubleshooting

### Error: "Firebase configuration incomplete"

**Causa:** Variables de entorno no están configuradas.

**Solución:**
```bash
# Verificar que .env.local existe
ls -la .env.local

# Verificar contenido
cat .env.local

# Si no existe, crear desde template
cp .env.example .env.local
# Editar y completar con valores reales
```

### Error: "Permission denied" en Firestore

**Causa:** Security Rules están bloqueando el acceso.

**Solución:**
1. Verificar que el usuario está autenticado
2. Verificar que `request.auth.uid` coincide con el userId en la ruta
3. Probar reglas en Firebase Console > Firestore > Rules > Simulador

### Build falla en producción

**Causa:** Variables de entorno no están disponibles en build.

**Solución:**
```bash
# Crear archivo .env.production
echo "VITE_FIREBASE_API_KEY=..." > .env.production

# Build
npm run build
```

### Deploy falla con "Project not found"

**Causa:** No has inicializado Firebase CLI o seleccionado proyecto incorrecto.

**Solución:**
```bash
firebase login
firebase use --add
# Seleccionar el proyecto correcto
```

---

## Recursos Adicionales

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Soporte

Si encuentras problemas:
1. Verificar logs en Firebase Console
2. Revisar errores en consola del navegador
3. Verificar Security Rules en simulador
4. Consultar documentación oficial

---

**Última actualización:** 2025-12-12
**Versión de guía:** 1.0
