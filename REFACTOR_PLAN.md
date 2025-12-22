# Plan de Refactorización y Mejora de Calidad - QUANTA

**Fecha:** 21 de diciembre de 2025
**Objetivo:** Abordar debilidades estructurales en la aplicación para mejorar el rendimiento, la mantenibilidad, la escalabilidad y la fiabilidad de los datos. Este plan se centra en la refactorización del código existente y la adición de tests críticos.

---

## 📋 Resumen de Problemas Identificados

1.  **Arquitectura Centralizada en `App.tsx`**: `App.tsx` actúa como un "God Component", manejando la navegación y el renderizado de todas las pantallas. Esto perjudica el rendimiento, dificulta el mantenimiento y no permite URLs navegables.
2.  **Carga de Datos Ineficiente**: Múltiples componentes realizan cargas de datos redundantes y en cascada, provocando re-renderizados innecesarios y posibles inconsistencias en la UI.
3.  **Lógica Financiera Crítica sin Tests**: Cálculos clave como el "saldo disponible" están dispersos (`TransactionsContext`, `useBudgetPeriod`) y carecen de tests unitarios, lo que es un riesgo para la fiabilidad de los datos mostrados al usuario.
4.  **Sincronización Offline Débil**: El `storageService` actual es propenso a errores de duplicación o pérdida de datos debido a una frágil reconciliación de IDs y la falta de una cola de sincronización robusta con reintentos.

---

## 🚀 Plan de Acción Detallado

### Tarea 1: Refactorizar la Arquitectura de Navegación

**Descripción:** Reemplazar el sistema de navegación basado en estado (`activeTab`) por una solución de enrutamiento del lado del cliente (`react-router-dom`).

**Pasos de Implementación:**

1.  **Instalar y Configurar `react-router-dom`**:
    *   Ejecutar `npm install react-router-dom`.
    *   Crear un nuevo directorio `/routes` para definir la estructura de rutas de la aplicación.

2.  **Crear Componentes de Página y Layout**:
    *   Crear componentes de página dedicados (ej. `DashboardPage.tsx`, `IncomePage.tsx`, `ExpensesPage.tsx`).
    *   Mover la lógica de renderizado condicional de `App.tsx` a estas nuevas páginas.
    *   Extraer la estructura de UI común (navegación, header) a un componente `AppLayout.tsx` que contendrá el `Outlet` de React Router.

3.  **Simplificar `App.tsx`**:
    *   Refactorizar `App.tsx` para que su única responsabilidad sea envolver la aplicación en los providers de contexto y configurar el `BrowserRouter`.

**Estrategia de Testing:**

*   **Test Unitario (`AppLayout.test.tsx`):**
    *   Verificar que al interactuar con los elementos de navegación, la URL se actualiza correctamente dentro de un `MemoryRouter`.
    *   Asegurar que el indicador de la pestaña activa refleje la ruta actual.

*   **Test de Integración (`Navigation.test.tsx`):**
    *   Confirmar que al navegar entre rutas (ej. de `/ingresos` a `/gastos`), el componente de la página anterior se desmonta correctamente del DOM, validando la mejora de rendimiento.

---

### Tarea 2: Centralizar y Optimizar la Carga de Datos

**Descripción:** Crear un punto de entrada único para la carga de datos iniciales para eliminar cargas redundantes y mejorar la experiencia de usuario.

**Pasos de Implementación:**

1.  **Crear Hook `useAppDataLoader.ts`**:
    *   Centralizar en este hook la carga de todos los datos iniciales (transacciones, metas, presupuestos, etc.) después del login.
    *   Gestionará un estado de carga global y unificado.

2.  **Utilizar el Hook en `App.tsx`**:
    *   `App.tsx` usará este hook para mostrar un spinner de carga global hasta que todos los datos estén disponibles.

3.  **Eliminar Cargas Redundantes**:
    *   Suprimir los `useEffect` de carga de datos en componentes hijos como `Dashboard.tsx`. Los componentes recibirán los datos a través de contextos o props.

**Estrategia de Testing:**

*   **Test Unitario (`useAppDataLoader.test.tsx`):**
    *   Mockear `storageService` para simular respuestas exitosas y de error.
    *   Verificar que el estado `loading` del hook cambia de `true` a `false` en un caso de éxito.
    *   Verificar que un fallo en la carga mantiene el estado de `loading` y reporta un error.

---

### Tarea 3: Añadir Tests para la Lógica Financiera Crítica

**Descripción:** Crear tests unitarios para los cálculos financieros clave y así garantizar su precisión.

**Pasos de Implementación:**

1.  Crear un archivo de test `stats.test.ts` para validar los cálculos de `stats` en `TransactionsContext`.
2.  Crear un archivo de test `useBudgetPeriod.test.ts` para validar los cálculos del hook de presupuesto.

**Estrategia de Testing:**

*   **Test Unitario (`stats.test.ts`):**
    *   **Fail-case (Doble Conteo):** Diseñar un test que falle si un ingreso ya incluido en el balance de una cuenta se suma de nuevo al saldo disponible.
    *   **Pass-case (Cálculo Correcto):** Con un conjunto de datos predefinido (cuentas, metas, ingresos, gastos), afirmar que el `availableBalance` final es el esperado.

*   **Test Unitario (`useBudgetPeriod.test.ts`):**
    *   **Fail-case (Categorización Incorrecta):** Simular un gasto en una categoría que podría no coincidir con la del presupuesto (ej. "Comida" vs. "Food") y verificar que el test falle si no se computa correctamente.
    *   **Pass-case (Desglose Correcto):** Con un presupuesto y un conjunto de gastos (dentro y fuera del presupuesto), afirmar que `spentBudgeted`, `spentUnbudgeted`, y `remaining` se calculan correctamente.

---

### Tarea 4: Implementar una Cola de Sincronización Robusta

**Descripción:** Mejorar `storageService` para manejar de forma fiable fallos de red y la sincronización de datos creados offline.

**Pasos de Implementación:**

1.  **Crear `SyncQueueService.ts`**:
    *   Implementar un servicio que gestione una cola de operaciones de escritura (`create`, `update`, `delete`) en `localStorage`.
    *   La cola debe manejar estados (`pending`, `processing`, `failed`) y reintentar operaciones fallidas con un backoff exponencial cuando se recupere la conexión a internet.

2.  **Refactorizar `storageService.ts`**:
    *   Modificar las operaciones de escritura (`addTransaction`, etc.) para que, en lugar de llamar directamente a Firebase, añadan la operación a la nueva `SyncQueueService`. La UI seguirá actualizándose de forma optimista.

3.  **Mejorar la Reconciliación de IDs**:
    *   El `SyncQueueService` será responsable de recibir el ID de Firebase tras una creación exitosa y actualizar el registro correspondiente en `localStorage`, reemplazando el ID temporal (`localId_...`).

**Estrategia de Testing:**

*   **Test de Integración (`SyncQueue.test.tsx`):**
    *   **Fail-case (Duplicación de Datos):** Simular un flujo donde la reconciliación del ID falla y verificar que la cola de sincronización intentaría subir el mismo dato de nuevo, causando un duplicado.
    *   **Pass-case (Flujo Offline-Online Exitoso):**
        1.  Simular modo `offline` y crear una transacción.
        2.  Verificar que se guarda en `localStorage` con un `localId` y se añade a la cola.
        3.  Simular modo `online`.
        4.  Verificar que la cola se procesa, la transacción en `localStorage` se actualiza con el nuevo `firebaseId`, y la cola queda vacía.

---

## ✅ Criterios de Aceptación

Cada tarea se considerará completada cuando:
- El código de la implementación esté finalizado.
- Todos los tests (unitarios y de integración) asociados a la tarea pasen exitosamente.
- La funcionalidad existente en la aplicación no presente regresiones tras la refactorización.
- La documentación relevante (si la hubiera) esté actualizada.
