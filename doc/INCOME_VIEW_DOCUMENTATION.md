# 📘 Documentación de la Vista de Ingresos (Income View)

## 🎯 Objetivo General
La vista de **Ingresos** (`IncomeScreen`) es el centro de control para la gestión del flujo de efectivo entrante en QUANTA. Su propósito principal es permitir al usuario planificar, rastrear y confirmar sus ingresos de manera mensual, asegurando que el presupuesto se base en dinero real y disponible.

---

## 🏗️ Arquitectura y Datos

### 1. Modelo Mensual (Monthly Isolation)
A diferencia de versiones anteriores, el sistema ahora funciona con **aislamiento mensual**.
- **Meses Independientes**: Cada mes (`YYYY-MM`) tiene su propio documento de registro. Lo que sucede en enero no afecta a febrero automáticamente, excepto por la generación inicial.
- **Single Source of Truth (SSOT)**: El hook `useIncomeManager` es la única fuente de verdad. La UI no calcula totales por su cuenta; los recibe procesados del hook.

### 2. Tipos de Ingresos

#### A. Ingresos Fijos (`Fixed Income`)
Son ingresos recurrentes (ej. Salario, Renta).
- **Origen**: Se generan a partir de **Plantillas** (`IncomeFixedTemplate`).
- **Comportamiento**: Al iniciar un nuevo mes, el sistema copia las plantillas activas al documento del mes.
- **Edición**:
    - Cambiar el monto en un mes específico **NO** altera la plantilla original (a menos que se implemente esa opción explícita en el futuro).
    - Esto permite recibir un bono en el salario de Enero sin inflar el salario esperado de Febrero.

#### B. Ingresos Extras (`Extra Income`)
Son ingresos únicos y esporádicos (ej. Venta de garaje, Regalo).
- **Comportamiento**: Existen solo en el mes en que se crean. No se arrastran a meses futuros.

---

## 🖥️ Interfaz de Usuario (UI/UX)

### 1. Navegación Temporal
- **Selector de Período**: Permite viajar al pasado para ver históricos o al futuro para planificar.
- **Carga Dinámica**: Al cambiar de mes, se cargan los datos correspondientes desde Firebase/LocalStorage. Si el mes futuro no existe, se inicializa automáticamente basado en las plantillas actuales.

### 2. Tarjeta de Salud Financiera
Ubicada en la parte superior, muestra el pulso financiero del mes:
- **Margen Disponible (Mes)**: Calcula `(Total Ingresos Recibidos) - (Total Presupuesto de Gastos)`.
    - **Concepto**: No representa el saldo real en cuentas bancarias, sino la capacidad del mes para cubrir el presupuesto. Incluye tooltip explicativo.
    - **Verde**: Cubres tus gastos presupuestados.
    - **Rojo**: Tus gastos presupuestados superan tus ingresos reales.
- **Pendiente por Recibir**: Suma de todos los ingresos fijos que aún no han sido marcados como "Pagados".

### 3. Sección de Ingresos Fijos
Diseñada para la **gestión de estado** con alta visibilidad.
- **Botón de Estado Grande**:
    - Muestra explícitamente el texto **"Pendiente"** o **"Pagado"**.
    - **Pendiente (Gris/Amarillo)**: El dinero aún no está en cuenta. No suma al total oficial.
    - **Pagado (Verde)**: Confirmado (antes "Recibido"). Suma al total disponible.
    - **Acción**: Un clic en cualquier parte del botón alterna el estado inmediatamente (Optimistic UI).
    - **Ayuda**: Se incluye un icono de información (ℹ️) que explica el funcionamiento del estado.
- **Edición en Línea (Inline Edit)**:
    - Permite ajustar el monto real recibido sin abrir modales complejos (reemplaza `window.prompt`).
    - Ejemplo: Esperabas $1000 pero llegaron $1050. Lo ajustas directamente en la tarjeta.

### 4. Sección de Ingresos Extras
- Lista simple para agregar entradas de dinero no planificadas.
- Se pueden eliminar si fueron agregados por error.

---

## ⚙️ Lógica Técnica (`Service Layer`)

### `useIncomeManager.ts` (Hook)
- **Gestor de Estado**: Mantiene el `monthData` (datos del mes).
- **Cálculos**: Computa `totals.received` (Recibido Fijo + Extras) y `totals.pending` (Solo Fijo Pendiente).
- **Exposición**: Provee funciones (`actions`) a la vista: `toggleFixedStatus`, `updateFixedAmount`, `addExtra`, `changePeriod`.

### `incomeService.ts` (Servicio)
- **Persistencia**: Guarda en Firestore y cachea en LocalStorage.
- **`initializeMonth(period)`**:
    1. Busca si ya existen datos para el mes.
    2. Si no, busca las Plantillas (`Templates`).
    3. Crea el documento del mes con los items en estado `pending`.
- **Migración**: Incluye lógica para convertir transacciones antiguas (`legacy`) al nuevo sistema de plantillas.
