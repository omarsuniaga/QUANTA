# PLAN DE MEJORA PROGRESIVA - QUANTA FINANCE APP

## ÍNDICE
1. [Fase 1: Seguridad Crítica (Semana 1)](#fase-1-seguridad-crítica)
2. [Fase 2: Optimización de Rendimiento (Semana 2-3)](#fase-2-optimización-de-rendimiento)
3. [Fase 3: Refactorización de Arquitectura (Semana 4-6)](#fase-3-refactorización-de-arquitectura)
4. [Fase 4: Testing y Calidad (Semana 7-8)](#fase-4-testing-y-calidad)
5. [Fase 5: Features Avanzadas (Semana 9-12)](#fase-5-features-avanzadas)

---

## FASE 1: SEGURIDAD CRÍTICA
**Duración:** Semana 1
**Prioridad:** 🔴 CRÍTICA
**Riesgo de romper:** 🟢 Bajo (cambios de configuración)

### 1.1 Asegurar Credenciales y Variables de Entorno

#### Prompt 1.1.1: Remover credenciales del repositorio
```
Necesito asegurar las credenciales de mi aplicación QUANTA. Actualmente el archivo .env.local
está en el repositorio con credenciales expuestas.

TAREAS:
1. Verifica que .env.local esté en .gitignore
2. Crea un archivo .env.example con placeholders (sin valores reales)
3. NO modifiques firebaseConfig.ts ni otros archivos funcionales
4. Asegúrate de que la app siga funcionando en desarrollo

IMPORTANTE:
- NO regeneres las credenciales aún (lo haré manualmente)
- Mantén la funcionalidad actual intacta
- Solo enfócate en la estructura de archivos
```

#### Prompt 1.1.2: Optimizar configuración de producción
```
Revisa el archivo vite.config.ts y:

1. Cambia drop_console y drop_debugger a true cuando mode === 'production'
2. Mantén el sourcemap solo en desarrollo
3. Asegúrate de que las variables de entorno se manejen correctamente
4. NO cambies la estructura de build ni los chunks existentes

El archivo está en: vite.config.ts
```

#### Prompt 1.1.3: Documentar configuración de Firebase
```
Necesito crear documentación para configurar Firebase en producción.

Crea un archivo FIREBASE_SETUP.md con:
1. Pasos para configurar Firestore Security Rules (proporciona las reglas)
2. Configuración de Firebase Hosting
3. Variables de entorno requeridas para deploy
4. Checklist de seguridad pre-deploy

NO modifiques código existente, solo documentación.
```

---

### 1.2 Implementar Firestore Security Rules

#### Prompt 1.2.1: Crear reglas de seguridad
```
Crea un archivo firestore.rules con reglas de seguridad para QUANTA.

COLECCIONES A PROTEGER:
- users/{userId}/transactions
- users/{userId}/goals
- users/{userId}/settings
- users/{userId}/accounts
- users/{userId}/budgets
- users/{userId}/subscriptions
- users/{userId}/quickActions
- users/{userId}/promos
- users/{userId}/categories

REQUISITOS:
1. Solo el propietario puede leer/escribir sus datos
2. Validar tipos de datos (amount > 0, fechas válidas, etc.)
3. Prevenir eliminación accidental de datos críticos
4. Rate limiting básico

NO modifiques ningún archivo .ts/.tsx, solo crea firestore.rules
```

---

## FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
**Duración:** Semana 2-3
**Prioridad:** 🟡 ALTA
**Riesgo de romper:** 🟡 Medio (cambios incrementales)

### 2.1 Memoización de Componentes

#### Prompt 2.1.1: Optimizar Dashboard con React.memo
```
Optimiza el componente Dashboard.tsx usando React.memo sin cambiar funcionalidad.

ARCHIVO: components/Dashboard.tsx

TAREAS:
1. Envuelve el componente con React.memo
2. Define una función de comparación personalizada para las props
3. Identifica y memoiza los cálculos pesados que aún no usen useMemo
4. Verifica que todos los callbacks dentro del componente usen useCallback

RESTRICCIONES:
- NO cambies la interfaz DashboardProps
- NO modifiques la lógica de negocio
- Mantén todos los features actuales (Oracle, gráficos, alertas)
- Ejecuta la app y verifica que todo funcione igual

TESTING:
Después de los cambios, abre la app y verifica:
- Los gráficos se renderizan correctamente
- El Oráculo Financiero calcula bien
- Las alertas aparecen
- No hay re-renders innecesarios (usa React DevTools Profiler)
```

#### Prompt 2.1.2: Optimizar componentes de modales
```
Optimiza los siguientes modales con React.memo:
- components/ActionModal.tsx
- components/GoalModal.tsx
- components/FilterModal.tsx

PARA CADA UNO:
1. Envuelve con React.memo
2. Asegura que todos los handlers usen useCallback
3. Memoiza cálculos complejos

IMPORTANTE:
- NO cambies la lógica de validación
- Mantén el manejo de errores actual
- Los formularios deben funcionar exactamente igual
```

#### Prompt 2.1.3: Optimizar lista de transacciones
```
Optimiza TransactionList.tsx para renderizar grandes cantidades de datos.

ARCHIVO: components/TransactionList.tsx

OPCIONES (elige la más apropiada según el componente):
A) Si la lista es simple: Usa React.memo en TransactionItem
B) Si la lista puede tener 100+ items: Considera react-window

PASOS:
1. Analiza el componente actual
2. Implementa la optimización elegida
3. Mantén todas las features (búsqueda, filtros, acciones)
4. Verifica que el scroll funcione correctamente

RESTRICCIÓN: Si instalas react-window, úsala solo si el componente realmente
renderiza muchos items. Si no, solo usa React.memo.
```

---

### 2.2 Optimizar useEffect y Cargas de Datos

#### Prompt 2.2.1: Optimizar carga de datos en Dashboard
```
En Dashboard.tsx, el useEffect en la línea 54 recarga datos cada vez que cambian
las transacciones. Esto es ineficiente.

ARCHIVO: components/Dashboard.tsx (líneas 54-68)

TAREAS:
1. Analiza por qué necesita recargar subscriptions y customCategories
2. Mueve esta lógica a un lugar más apropiado (¿Context? ¿Hook personalizado?)
3. Evita recargas innecesarias
4. Mantén los datos sincronizados correctamente

RESTRICCIONES:
- NO rompas la funcionalidad del Dashboard
- Los datos deben estar disponibles cuando se necesiten
- Considera crear un useSubscriptions hook si es necesario
```

#### Prompt 2.2.2: Crear custom hook para subscriptions
```
Crea un custom hook useSubscriptions() para gestionar suscripciones de forma
centralizada y evitar recargas innecesarias.

CREAR: hooks/useSubscriptions.ts

ESTRUCTURA:
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Lógica de carga optimizada con cache

  return { subscriptions, loading, refetch };
};

INTEGRAR EN:
- Dashboard.tsx
- Cualquier otro componente que use subscriptions

BENEFICIOS:
- Carga una sola vez
- Cache en memoria
- Recarga manual cuando sea necesario
```

---

### 2.3 Code Splitting y Lazy Loading

#### Prompt 2.3.1: Implementar lazy loading en screens principales
```
Implementa lazy loading para las pantallas pesadas sin afectar la UX.

EN: App.tsx

PANTALLAS A OPTIMIZAR:
- AICoachScreen
- SavingsPlanner
- ChallengesScreen
- StrategiesScreen
- GoalsManagement

PASOS:
1. Importa React.lazy y Suspense
2. Convierte los imports estáticos a dinámicos
3. Añade un Suspense con un spinner apropiado
4. Verifica que la navegación sea fluida

EJEMPLO:
const AICoachScreen = React.lazy(() => import('./components/AICoachScreen'));

<Suspense fallback={<LoadingSpinner />}>
  {showAICoach && <AICoachScreen ... />}
</Suspense>

IMPORTANTE: Mantén la UX actual, el usuario no debe notar la diferencia
```

---

## FASE 3: REFACTORIZACIÓN DE ARQUITECTURA
**Duración:** Semana 4-6
**Prioridad:** 🟡 ALTA
**Riesgo de romper:** 🟠 Alto (cambios estructurales)

### 3.1 Preparación: Crear Sistema de Rutas

#### Prompt 3.1.1: Instalar y configurar React Router
```
Instala React Router v6 y configura la estructura básica de rutas SIN modificar
App.tsx aún.

TAREAS:
1. npm install react-router-dom
2. Crea una carpeta /routes
3. Crea archivo routes/index.tsx con la configuración de rutas
4. Define las rutas principales:
   - / (Dashboard)
   - /transactions
   - /settings
   - /ai-coach
   - /goals
   - /challenges
   - /strategies
   - /savings-planner

NO APLICAR AÚN. Solo preparar la estructura.
```

#### Prompt 3.1.2: Crear layout principal
```
Crea un componente MainLayout que contenga la estructura común de la app.

CREAR: layouts/MainLayout.tsx

DEBE INCLUIR:
- Header con navegación
- Barra de tabs actual (Dashboard, Transactions, Settings)
- Outlet para las rutas hijas
- Estado compartido necesario

EXTRAER DE App.tsx:
- La lógica de activeTab
- El header/navigation actual
- Los providers que sean globales

NO ELIMINAR NADA DE App.tsx AÚN. Solo crear el layout preparatorio.
```

---

### 3.2 Dividir App.tsx en Páginas

#### Prompt 3.2.1: Crear DashboardPage
```
Crea una página DashboardPage.tsx que encapsule toda la lógica del dashboard actual.

CREAR: pages/DashboardPage.tsx

MOVER DESDE App.tsx:
- Renderizado del componente Dashboard
- Lógica de stats, transactions, goals
- Handlers relacionados al dashboard

IMPORTANTE:
- Usa los contexts (useTransactions, useSettings, etc.)
- NO dupliques lógica, muévela
- Mantén TODA la funcionalidad actual
- Verifica que los gráficos funcionen igual

DESPUÉS: Reemplaza en App.tsx el renderizado de Dashboard con <DashboardPage />
y verifica que todo funcione.
```

#### Prompt 3.2.2: Crear TransactionsPage
```
Crea TransactionsPage.tsx para gestionar la vista de transacciones.

CREAR: pages/TransactionsPage.tsx

INCLUIR:
- TransactionList component
- SearchBar
- FilterModal
- Lógica de filtros (ya está en TransactionsContext, solo consumirla)

MOVER DESDE App.tsx:
- showFilterModal state
- Handlers de filtros

VERIFICAR:
- Búsqueda funciona
- Filtros funcionan
- Agregar/editar/eliminar transacciones funciona
```

#### Prompt 3.2.3: Crear SettingsPage
```
Crea SettingsPage.tsx para la pantalla de configuración.

CREAR: pages/SettingsPage.tsx

INCLUIR:
- SettingsScreen component
- Toda la lógica de settings

MOVER DESDE App.tsx:
- Renderizado de SettingsScreen
- Handlers de logout, updates, etc.

VERIFICAR:
- Cambio de tema funciona
- Cambio de moneda funciona
- Todas las configuraciones se guardan
```

---

### 3.3 Migrar a React Router (Progresivo)

#### Prompt 3.3.1: Integrar Router sin romper la app actual
```
Integra React Router en App.tsx manteniendo compatibilidad con el sistema actual de tabs.

ESTRATEGIA DE MIGRACIÓN SEGURA:

1. Mantén el estado activeTab actual
2. Añade Router y Routes
3. Sincroniza activeTab con la ruta actual
4. Mantén los botones de navegación actuales funcionando

CÓDIGO SUGERIDO EN App.tsx:

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Dentro del componente:
const location = useLocation();
const navigate = useNavigate();

// Sincronizar activeTab con ruta
useEffect(() => {
  const path = location.pathname;
  if (path === '/' || path === '/dashboard') setActiveTab('dashboard');
  else if (path === '/transactions') setActiveTab('transactions');
  else if (path === '/settings') setActiveTab('settings');
}, [location]);

// Al cambiar tab, navegar
const handleTabChange = (tab: typeof activeTab) => {
  setActiveTab(tab);
  navigate(tab === 'dashboard' ? '/' : `/${tab}`);
};

RESULTADO: La app funciona igual pero ahora con URLs navegables.
```

#### Prompt 3.3.2: Migrar modales a rutas (opcional, avanzado)
```
SOLO SI TODO LO ANTERIOR FUNCIONA BIEN.

Convierte los modales principales en rutas modales (overlay routes).

MODALES A CONVERTIR:
- /add-transaction (ActionModal en modo create)
- /edit-transaction/:id (ActionModal en modo edit)
- /add-goal (GoalModal)
- /ai-coach (AICoachScreen como modal overlay)

BENEFICIOS:
- URLs compartibles
- Historial del navegador
- Deep linking

IMPORTANTE: Esto es OPCIONAL. Si prefieres mantener los modales como están,
está perfectamente bien. No es crítico.
```

---

### 3.4 Mejorar Sincronización Offline

#### Prompt 3.4.1: Crear sistema de cola de sincronización
```
Crea un servicio para gestionar operaciones pendientes cuando se está offline.

CREAR: services/syncQueueService.ts

DEBE INCLUIR:
- Interface SyncOperation
- Cola persistente en localStorage
- Procesamiento de cola cuando vuelve online
- Retry con backoff exponencial
- Notificaciones al usuario

ESTRUCTURA:
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'processing' | 'failed' | 'success';
}

MÉTODOS:
- addToQueue(operation)
- processQueue() - ejecuta cuando online
- clearQueue()
- getQueueStatus()

NO INTEGRAR AÚN. Solo crear el servicio.
```

#### Prompt 3.4.2: Integrar cola de sincronización en storageService
```
Integra el syncQueueService en storageService.ts para todas las operaciones de escritura.

ARCHIVO: services/storageService.ts

CAMBIOS:
1. Importa syncQueueService
2. En cada operación de escritura (add, update, delete):
   - Si online: ejecutar directamente + añadir a cola como backup
   - Si offline: añadir a cola únicamente
3. Al volver online: procesar cola automáticamente

EJEMPLO PARA addTransaction:

export const addTransaction = async (uid: string, tx: Transaction) => {
  // 1. Guardar local siempre
  const current = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
  saveToLocal(LS_KEYS.TRANSACTIONS, [...current, tx]);

  // 2. Intentar Firebase o encolar
  if (canUseFirebase() && navigator.onLine) {
    try {
      await db.collection('users').doc(uid).collection('transactions').doc(tx.id).set(tx);
      // Marcar como sincronizado
    } catch (error) {
      // Si falla, encolar
      syncQueueService.addToQueue({
        type: 'create',
        collection: 'transactions',
        documentId: tx.id,
        data: tx
      });
    }
  } else {
    // Offline, encolar directamente
    syncQueueService.addToQueue({...});
  }
};

VERIFICAR:
- La app funciona igual online
- Offline, las operaciones se encolan
- Al volver online, la cola se procesa
```

#### Prompt 3.4.3: Reconciliar IDs locales
```
Implementa reconciliación de IDs locales cuando se sincronizan a Firebase.

PROBLEMA ACTUAL:
- IDs locales: "local_1234567890_0.123"
- IDs Firebase: auto-generados
- No se reconcilian, pueden causar duplicados

SOLUCIÓN:

En services/storageService.ts, añade:

const reconcileLocalIds = async (uid: string) => {
  const localTxs = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, [])
    .filter(t => t.id.startsWith('local_'));

  for (const localTx of localTxs) {
    try {
      // Crear en Firebase con ID auto-generado
      const docRef = await db
        .collection('users')
        .doc(uid)
        .collection('transactions')
        .add(localTx);

      // Actualizar ID local con Firebase ID
      const updated = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, [])
        .map(t => t.id === localTx.id ? { ...t, id: docRef.id } : t);

      saveToLocal(LS_KEYS.TRANSACTIONS, updated);

      console.log(`Reconciled ${localTx.id} -> ${docRef.id}`);
    } catch (error) {
      console.error('Failed to reconcile:', localTx.id, error);
    }
  }
};

LLAMAR en AuthContext cuando el usuario se loguea y hay conexión.
```

---

## FASE 4: TESTING Y CALIDAD
**Duración:** Semana 7-8
**Prioridad:** 🟢 MEDIA
**Riesgo de romper:** 🟢 Bajo (tests no afectan código)

### 4.1 Configurar Testing

#### Prompt 4.1.1: Setup de Vitest y Testing Library
```
Configura Vitest y React Testing Library en el proyecto.

INSTALAR:
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

CREAR: vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
});

CREAR: tests/setup.ts
import '@testing-library/jest-dom';

AÑADIR EN package.json:
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}

NO ESCRIBIR TESTS AÚN. Solo configurar.
```

#### Prompt 4.1.2: Crear mocks para Firebase y Gemini
```
Crea mocks para los servicios externos (Firebase, Gemini) para poder testear.

CREAR: tests/mocks/firebaseMock.ts
CREAR: tests/mocks/geminiMock.ts

Incluir:
- Mock de Firestore con operaciones CRUD
- Mock de Auth
- Mock de Gemini API con respuestas predefinidas

ESTOS MOCKS SE USARÁN EN LOS TESTS.
```

---

### 4.2 Tests de Servicios

#### Prompt 4.2.1: Tests para apiRateLimiter
```
Crea tests completos para apiRateLimiter.ts

CREAR: services/__tests__/apiRateLimiter.test.ts

CASOS DE PRUEBA:
1. Respeta el límite de requests por minuto
2. Cache funciona correctamente
3. Prioridades de cola se respetan
4. Backoff exponencial funciona
5. Cooldown se activa con rate limit
6. Cache expirado se usa como fallback

COBERTURA OBJETIVO: 85%+

IMPORTANTE: Usa fake timers para pruebas de tiempo:
import { vi } from 'vitest';
vi.useFakeTimers();
```

#### Prompt 4.2.2: Tests para geminiService
```
Crea tests para geminiService.ts

CREAR: services/__tests__/geminiService.test.ts

CASOS DE PRUEBA:
1. parseTransaction devuelve estructura correcta
2. Maneja errores de API
3. Cache funciona
4. testApiKey valida correctamente
5. getFinancialInsights procesa datos correctamente

USAR: geminiMock para simular respuestas
```

#### Prompt 4.2.3: Tests para storageService (crítico)
```
Crea tests para las funciones principales de storageService.ts

CREAR: services/__tests__/storageService.test.ts

CASOS DE PRUEBA:
1. CRUD de transactions
2. Offline-first: localStorage se usa cuando no hay Firebase
3. Sincronización cuando vuelve online
4. Manejo de errores
5. Inicialización de nuevo usuario

COBERTURA OBJETIVO: 80%+ (es el servicio más crítico)

USAR: firebaseMock y mock de localStorage
```

---

### 4.3 Tests de Contexts

#### Prompt 4.3.1: Tests para TransactionsContext
```
Crea tests para TransactionsContext.tsx

CREAR: contexts/__tests__/TransactionsContext.test.tsx

CASOS DE PRUEBA:
1. addTransaction actualiza stats correctamente
2. Filtros funcionan (por categoría, fecha, tipo)
3. deleteTransaction y undo funcionan
4. Ghost money detection identifica duplicados
5. Estado se sincroniza con storageService

HELPER:
import { renderHook, act } from '@testing-library/react';

const wrapper = ({ children }) => (
  <AuthProvider>
    <TransactionsProvider>{children}</TransactionsProvider>
  </AuthProvider>
);

const { result } = renderHook(() => useTransactions(), { wrapper });
```

#### Prompt 4.3.2: Tests para AuthContext
```
Crea tests para AuthContext.tsx

CREAR: contexts/__tests__/AuthContext.test.tsx

CASOS DE PRUEBA:
1. Login correcto actualiza user
2. Logout limpia sesión
3. onAuthStateChanged detecta cambios
4. Online/offline detection funciona
5. Persistencia de sesión

COBERTURA: 70%+
```

---

### 4.4 Tests de Componentes (Selectivos)

#### Prompt 4.4.1: Tests para Dashboard
```
Crea tests básicos para Dashboard.tsx

CREAR: components/__tests__/Dashboard.test.tsx

CASOS DE PRUEBA:
1. Renderiza stats correctamente
2. Gráficos se muestran con datos
3. Oráculo calcula balance futuro
4. Alertas de pagos aparecen

NO NECESITAS 100% cobertura. Solo casos principales.
```

#### Prompt 4.4.2: Tests para ActionModal
```
Crea tests para el formulario de ActionModal.tsx

CREAR: components/__tests__/ActionModal.test.tsx

CASOS DE PRUEBA:
1. Validación de campos funciona
2. Submit crea transacción
3. Modo edición carga datos correctos
4. Recurrencia se configura bien

USAR: @testing-library/user-event para simular interacciones
```

---

## FASE 5: FEATURES AVANZADAS
**Duración:** Semana 9-12
**Prioridad:** 🟢 BAJA (Mejoras opcionales)
**Riesgo de romper:** 🟢 Bajo (features nuevas)

### 5.1 PWA Completo

#### Prompt 5.1.1: Configurar Service Worker
```
Configura un Service Worker para funcionamiento offline completo.

USAR: Vite PWA Plugin
npm install -D vite-plugin-pwa

CONFIGURAR EN vite.config.ts:
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'robots.txt'],
    manifest: {
      name: 'QUANTA Finance',
      short_name: 'QUANTA',
      description: 'Tu asistente financiero inteligente',
      theme_color: '#6366f1',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    }
  })
]

CREAR ICONOS: pwa-192x192.png y pwa-512x512.png en /public
```

#### Prompt 5.1.2: Prompt de instalación PWA
```
Crea un componente que invite al usuario a instalar la PWA.

CREAR: components/PWAInstallPrompt.tsx

MOSTRAR:
- Cuando el evento beforeinstallprompt se dispara
- Botón "Instalar App"
- Opción de "No mostrar de nuevo"

INTEGRAR EN: App.tsx o MainLayout.tsx
```

---

### 5.2 Analytics y Monitoreo

#### Prompt 5.2.1: Configurar Firebase Analytics
```
Implementa Firebase Analytics para monitorear uso de la app.

YA TIENES: Firebase Analytics en firebaseConfig.ts

CREAR: services/analyticsService.ts

EVENTOS A TRACKEAR:
- transaction_created
- goal_created
- ai_insight_generated
- notification_received
- settings_changed
- filter_applied

EJEMPLO:
import { analytics } from '../firebaseConfig';
import { logEvent } from 'firebase/analytics';

export const analyticsService = {
  logTransactionCreated(type: 'income' | 'expense', amount: number) {
    logEvent(analytics, 'transaction_created', {
      transaction_type: type,
      amount_range: amount < 100 ? 'small' : amount < 1000 ? 'medium' : 'large'
    });
  }
};

INTEGRAR EN: Los lugares donde ocurren estas acciones
```

#### Prompt 5.2.2: Dashboard de métricas
```
Crea una pantalla de Analytics para el usuario (opcional).

CREAR: components/AnalyticsScreen.tsx

MOSTRAR:
- Total de transacciones registradas
- Categorías más usadas
- Tendencias mensuales
- Metas alcanzadas
- Uso de AI Coach

ESTO ES OPCIONAL Y PARA USUARIOS AVANZADOS.
```

---

### 5.3 Mejoras de Accesibilidad

#### Prompt 5.3.1: Añadir ARIA labels
```
Mejora la accesibilidad añadiendo ARIA labels a elementos interactivos.

ARCHIVOS A REVISAR:
- components/Dashboard.tsx
- components/TransactionList.tsx
- components/ActionModal.tsx
- components/Button.tsx

AÑADIR:
- aria-label en botones con solo iconos
- aria-describedby en inputs
- role="dialog" en modales
- aria-live en notificaciones

EJEMPLO:
<button onClick={handleClose} aria-label="Cerrar modal">
  <X className="w-5 h-5" />
</button>

NO CAMBIES FUNCIONALIDAD. Solo añade atributos ARIA.
```

#### Prompt 5.3.2: Keyboard navigation en modales
```
Implementa navegación por teclado en modales.

INSTALAR: focus-trap-react
npm install focus-trap-react

ACTUALIZAR: ActionModal, GoalModal, FilterModal

ENVOLVER CONTENIDO:
import FocusTrap from 'focus-trap-react';

<FocusTrap>
  <div className="modal" role="dialog" aria-modal="true">
    {/* contenido */}
  </div>
</FocusTrap>

AÑADIR:
- ESC para cerrar
- Tab cycle dentro del modal
- Focus automático en primer input

VERIFICAR CON: Solo usar teclado para navegar
```

#### Prompt 5.3.3: Skip links y landmarks
```
Añade skip links y landmarks ARIA para mejor navegación.

EN: App.tsx o MainLayout.tsx

AÑADIR AL INICIO:
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary-600 focus:text-white">
  Saltar al contenido principal
</a>

AÑADIR LANDMARKS:
<nav aria-label="Navegación principal">...</nav>
<main id="main-content">...</main>
<aside aria-label="Filtros">...</aside>

BENEFICIO: Usuarios de screen readers pueden navegar más rápido
```

---

### 5.4 Optimizaciones Finales

#### Prompt 5.4.1: Implementar paginación de transacciones
```
Implementa paginación cursor-based para transacciones.

MODIFICAR: services/storageService.ts

NUEVO MÉTODO:
export const getTransactionsPaginated = async (
  uid: string,
  limit: number = 50,
  cursor?: string
): Promise<{ transactions: Transaction[], nextCursor: string | null }> => {
  if (!canUseFirebase()) {
    // Fallback a localStorage con paginación manual
    const all = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
    const startIndex = cursor ? parseInt(cursor) : 0;
    const page = all.slice(startIndex, startIndex + limit);
    return {
      transactions: page,
      nextCursor: startIndex + limit < all.length ? String(startIndex + limit) : null
    };
  }

  let query = db.collection('users')
    .doc(uid)
    .collection('transactions')
    .orderBy('date', 'desc')
    .limit(limit);

  if (cursor) {
    const cursorDoc = await db.collection('users')
      .doc(uid)
      .collection('transactions')
      .doc(cursor)
      .get();
    query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  // ... procesar
};

ACTUALIZAR: TransactionsContext para usar paginación

AÑADIR: Botón "Cargar más" en TransactionList
```

#### Prompt 5.4.2: Optimizar imágenes y assets
```
Optimiza los assets de la aplicación.

TAREAS:
1. Convierte imágenes PNG a WebP
2. Añade lazy loading a imágenes:
   <img src="..." loading="lazy" />
3. Implementa blur placeholder para imágenes grandes
4. Comprime iconos SVG si los hay

TOOLS:
- npm install -D vite-plugin-image-optimizer

SI NO HAY MUCHAS IMÁGENES, puedes omitir esto.
```

#### Prompt 5.4.3: Implementar error boundary
```
Crea un Error Boundary para capturar errores de React.

CREAR: components/ErrorBoundary.tsx

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Opcional: Enviar a servicio de logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
            <p className="text-slate-600 mb-4">
              Lo sentimos, ocurrió un error inesperado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Recargar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ENVOLVER EN index.tsx:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### ✅ Antes de cada prompt:
- [ ] Lee el código actual relacionado
- [ ] Entiende qué hace antes de modificar
- [ ] Haz un commit de git (por si necesitas revertir)

### ✅ Después de implementar cada prompt:
- [ ] Ejecuta `npm run dev` y prueba la app
- [ ] Verifica que la funcionalidad sigue igual
- [ ] Revisa errores en consola
- [ ] Haz commit con mensaje descriptivo
- [ ] Si algo se rompe, revierte y ajusta

### ✅ Al terminar cada fase:
- [ ] Ejecuta la app completa
- [ ] Prueba todos los flujos principales
- [ ] Verifica en móvil (responsive)
- [ ] Commit de "Fase X completada"

---

## MÉTRICAS DE ÉXITO

### Fase 1 - Seguridad
- [x] Credenciales removidas del repo
- [x] .env.example creado
- [x] firestore.rules implementado
- [x] drop_console: true en producción

### Fase 2 - Rendimiento
- [ ] Componentes clave con React.memo
- [ ] No más re-renders innecesarios en Dashboard
- [ ] Lazy loading funcionando
- [ ] Lighthouse score > 90

### Fase 3 - Arquitectura
- [ ] React Router funcionando
- [ ] App.tsx < 500 líneas
- [ ] Cola de sincronización implementada
- [ ] IDs locales reconciliados

### Fase 4 - Testing
- [ ] Cobertura de tests > 70%
- [ ] Tests de servicios críticos
- [ ] Tests de contexts principales
- [ ] CI/CD con tests

### Fase 5 - Features
- [ ] PWA instalable
- [ ] Analytics funcionando
- [ ] Accesibilidad mejorada (WCAG AA)
- [ ] Error boundary implementado

---

## NOTAS IMPORTANTES

1. **NO APRESURARSE**: Cada prompt es un paso. No hagas varios a la vez.

2. **TESTING CONTINUO**: Después de cada cambio, prueba la app. Un bug temprano es fácil de arreglar.

3. **GIT ES TU AMIGO**: Commit frecuente. Ramas para features grandes.

4. **DOCUMENTA CAMBIOS**: Actualiza README.md con cambios significativos.

5. **PRIORIZA**: Si te quedas sin tiempo, Fase 1 y 2 son CRÍTICAS. Fase 5 es opcional.

6. **PIDE AYUDA**: Si un prompt no funciona, pide variaciones o aclaraciones.

---

## PLANTILLA DE PROMPT GENÉRICO

Para cualquier mejora no cubierta en este plan:

```
Necesito mejorar [COMPONENTE/SERVICIO] en mi app QUANTA.

CONTEXTO:
- El archivo está en: [RUTA]
- Actualmente hace: [DESCRIPCIÓN]
- Quiero que: [OBJETIVO]

RESTRICCIONES:
- NO romper funcionalidad actual
- Mantener compatibilidad con: [DEPENDENCIAS]
- Verificar que [CASOS DE USO] sigan funcionando

PASOS SUGERIDOS:
1. [PASO 1]
2. [PASO 2]
3. [PASO 3]

VERIFICACIÓN:
- [ ] La app corre sin errores
- [ ] [FEATURE X] funciona
- [ ] [FEATURE Y] funciona
```

---

## SIGUIENTES PASOS INMEDIATOS

**ACCIÓN AHORA (Hoy):**

1. Ejecuta el Prompt 1.1.1 (asegurar credenciales)
2. Ejecuta el Prompt 1.1.2 (optimizar vite.config)
3. Commit y push

**ACCIÓN ESTA SEMANA:**

1. Prompt 1.2.1 (crear firestore.rules)
2. Deployar reglas a Firebase
3. Verificar en producción

**ACCIÓN PRÓXIMA SEMANA:**

1. Comenzar Fase 2 (Optimización)
2. Prompts 2.1.1, 2.1.2, 2.1.3

---

**¿TODO LISTO?** Comienza con el primer prompt de la Fase 1 y avanza paso a paso.

**¿DUDAS?** Pregunta antes de implementar. Es mejor aclarar que arreglar después.

¡Éxito con las mejoras! 🚀
