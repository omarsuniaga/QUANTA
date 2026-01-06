# 📘 Documentación de la Vista de Gastos (Expenses View)

## 🎯 Objetivo General
La vista de **Gastos** (`ExpensesScreen`) es el panel principal para el seguimiento del flujo de efectivo saliente. Permite al usuario registrar transacciones, monitorear el consumo de su presupuesto en tiempo real y gestionar pagos recurrentes próximos. Su diseño se enfoca en la velocidad de registro ("Gasto Rápido") y en la visibilidad inmediata del estado financiero del mes.

---

## 🏗️ Arquitectura y Datos

### 1. Centralización de Datos (`useBudgetPeriod`)
Al igual que en Ingresos, esta vista no realiza cálculos de presupuesto aislados. Consume `budgetPeriodData` del hook `useBudgetPeriod`, que actúa como la **Single Source of Truth (SSOT)**.
- **Total Presupuestado**: Suma de todos los presupuestos activos.
- **Gastado**: Suma de gastos del mes actual.
- **Relación con Ingresos**: Recibe el total de ingresos (SSOT) para calcular si existe déficit (Presupuesto > Ingresos).

### 2. Tipos de Gastos
El sistema categoriza los gastos para facilitar su gestión y filtrado:
- **Gastos Rápidos (Quick)**: Gastos cotidianos, puntuales y no recurrentes (ej. Café, Taxi).
- **Gastos Recurrentes (Recurring)**: Pagos obligatorios con frecuencia definida (ej. Renta, Netflix).
- **Gastos Planificados (Planned)**: Gastos futuros agendados pero no recurrentes (ej. Compra de Mueble en fecha X).

---

## 🖥️ Interfaz de Usuario (UI/UX)

### 1. Tarjeta de Resumen de Presupuesto (Budget Card)
Es el elemento visual principal en la parte superior.
- **Gastado vs Presupuesto**: Muestra cuánto se ha gastado este mes contra el límite total definido.
    - **Tooltips Clarificadores**: Se han añadido iconos de ayuda (ℹ️) para explicar que el "Presupuesto" no es dinero reservado y que "Gastado" es el uso real de fondos.
- **Barra de Progreso**: Visualización gráfica del consumo del porcentaje del presupuesto.
    - **Verde**: Consumo saludable.
    - **Ámbar**: Consumo medio (>70%).
    - **Rojo**: Crítico (>90%).
- **Interacción**: Al hacer clic, despliega un desglose detallado por categorías.

### 2. Gestión de Pagos Pendientes (Pending Payments)
Sección inteligente que aparece solo cuando hay pagos recurrentes próximos (próximos 7 días).
- **Lógica de Detección**:
    - Busca transacciones recurrentes cuya fecha de cobro se aproxima.
    - Verifica si ya existe un pago confirmado para este mes (evita duplicados).
    - Respeta estados de "Pospuesto" u "Omitido" guardados localmente.
- **Ayuda Contextual**: Incluye un tooltip explicando que las acciones de posponer/omitir solo afectan el recordatorio y no alteran la contabilidad ni eliminan gastos reales.
- **Acciones Rápidas**:
    - **Pagar (Check)**: Crea la transacción de gasto real y actualiza la fecha de último pago.
    - **Posponer (Reloj)**: Oculta el recordatorio por 24 horas.
    - **Omitir (X)**: Salta este mes (no crea gasto) y programa el siguiente recordatorio para el próximo mes.

### 3. Alertas Inteligentes
El sistema muestra tarjetas de advertencia automáticas (Alerts) basadas en reglas:
- **Déficit Estructural**: "Atención: Estructura de Presupuesto". Advierte si lo que planeas gastar supera lo que ganas (informativo/estructural).
- **Alerta de Consumo**: "Aviso de Consumo Elevado". Advierte amigablemente si has consumido más del 90% del presupuesto total del mes.

### 4. Historial de Gastos
Lista detallada de todas las transacciones de salida.
- **Agrupación**: Organiza los gastos por fecha (Hoy, Ayer, Fechas anteriores).
- **Filtros**: Permite filtrar por tipo (Rápido, Recurrente, Planificado).
- **Ordenamiento**: Por fecha (Reciente/Antiguo) o Monto (Mayor/Menor).

### 5. Botón de Gasto Rápido
Acceso prominente para reducir la fricción al registrar gastos en el momento.

---

## ⚙️ Lógica Técnica

### Manejo de Fechas (`parseLocalDate`)
Usa consistentemente `parseLocalDate` para evitar errores de zona horaria (UTC shifts), asegurando que un gasto hecho el día 5 se muestre el día 5, sin importar la hora del servidor.

### Estados Locales (LocalStorage)
Para mejorar la UX sin saturar la base de datos, ciertos estados efímeros se guardan en el dispositivo:
- **Posponer Pago**: `postpone_{ID}` (timestamp).
- **Omitir Pago**: `skip_{ID}_{YYYY-MM}` (flag por mes).

### Integración con Notificaciones (`smartNotificationService`)
Si un pago pendiente proviene de una notificación push/local, la acción en la UI se sincroniza con el servicio de notificaciones para limpiar la alerta del sistema.
