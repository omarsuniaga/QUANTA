# Plan de Acción y Refactorización - QUANTA

**Fecha:** 21 de diciembre de 2025
**Objetivo Principal:** Solucionar bugs funcionales críticos, mejorar la experiencia de usuario en flujos clave y optimizar el uso de servicios de IA.

---

## ✅ Prioridad 1: [BUG] Restaurar la Vinculación de Cuentas en Métodos de Pago

**Estado:** **PENDIENTE**
**Criticidad:** 🔴 **ALTA** - Afecta la lógica contable principal de la aplicación.

### **Descripción del Problema**
Los formularios para registrar transacciones (ingresos/gastos) han perdido la capacidad de seleccionar una cuenta interna registrada (`Account`). En su lugar, guardan un `string` genérico, lo que impide que el sistema actualice el balance de la cuenta correspondiente. Esto rompe el flujo contable central.

### **Plan de Implementación**

1.  **Actualizar Modelo de Datos (`types.ts`)**
    *   **Acción:** Asegurar que la interfaz `Transaction` soporte una referencia de cuenta explícita.
    *   **Detalles:**
        *   Añadir/verificar el campo `paymentMethodType: 'cash' | 'bank' | 'card' | 'other'`.
        *   Añadir/verificar el campo `accountId: string | null` para almacenar la referencia al documento de la cuenta en Firestore.
        *   Marcar el campo `paymentMethod: string` como `@deprecated` para mantener la compatibilidad con transacciones antiguas, pero evitar su uso futuro.

2.  **Restaurar Selector de Cuentas en el Formulario (`components/ActionModal.tsx`)**
    *   **Acción:** Reintroducir la lógica para que el usuario pueda seleccionar una de sus cuentas registradas.
    *   **Detalles:**
        *   Cargar las cuentas del usuario (`storageService.getAccounts()`) al abrir el modal.
        *   Añadir un campo `select` para `paymentMethodType`.
        *   Mostrar condicionalmente un segundo `select` (poblado con las cuentas) cuando `paymentMethodType` sea `'bank'` o `'card'`.
        *   Implementar una validación en el `handleSubmit` que impida guardar si se requiere una cuenta y no se ha seleccionado, mostrando un error al usuario.

3.  **Aplicar Lógica de Actualización de Balance (`services/storageService.ts`)**
    *   **Acción:** Modificar el servicio de almacenamiento para que use el `accountId` y actualice el balance de la cuenta de forma atómica y segura.
    *   **Detalles:**
        *   Ajustar `addTransaction` y `updateTransaction` para que acepten y procesen el `accountId`.
        *   Utilizar una **transacción de Firestore (`db.runTransaction`)** en una función `_updateAccountBalance` para leer el balance actual y escribir el nuevo. Esto es crucial para prevenir condiciones de carrera y garantizar la consistencia de los datos.

4.  **Asegurar Compatibilidad Hacia Atrás**
    *   **Acción:** Garantizar que las transacciones antiguas (sin `accountId`) no rompan la interfaz de usuario.
    *   **Detalles:**
        *   En componentes como `TransactionList.tsx`, la UI deberá mostrar el nombre de la cuenta si `transaction.accountId` existe. Si no, deberá recurrir al campo obsoleto `transaction.paymentMethod` o al `paymentMethodType`.

### **Estrategia de Testing**

*   **Test Unitario (`storageService.test.ts`):**
    *   **`pass-case`:** Mockear una cuenta con un balance de `1000`. Llamar a `addTransaction` con un gasto de `200` para esa cuenta y afirmar que la transacción de Firestore se intenta ejecutar con un nuevo balance de `800`.
    *   **`fail-case`:** Mockear la transacción de Firestore para que falle y verificar que la función `addTransaction` maneja el error correctamente sin dejar el estado inconsistente.

*   **Test de Integración (`ActionModal.integration.test.tsx`):**
    *   **`fail-case`:** Simular el guardado de un gasto tipo `bank` sin seleccionar una cuenta. Afirmar que la función de guardado **no** es invocada y se muestra un error de validación.
    *   **`pass-case`:** Simular el flujo completo (seleccionar tipo y cuenta). Afirmar que `addTransaction` es invocado con los datos correctos, incluyendo el `accountId`.

### **Criterio de Aceptación**
Un usuario puede seleccionar una de sus cuentas registradas en el formulario de transacción y, al guardar, el balance de dicha cuenta se actualiza correctamente en la aplicación.

---

## ✅ Prioridad 2: [UX] Migrar Modales a Vistas Dedicadas

**Estado:** **PENDIENTE**
**Criticidad:** 🟡 **MEDIA** - Mejora de UX y estabilidad.

### **Descripción del Problema**
Modales con contenido extenso o flujos complejos (`GoalModal`, `PromoModal`, `BudgetModal`) presentan problemas de usabilidad en dispositivos móviles (scroll, elementos fuera de pantalla, acciones no visibles).

### **Plan de Implementación**

1.  **Crear Componentes de Vista Dedicada**:
    *   `GoalModal` → `components/views/GoalView.tsx`
    *   `PromoModal` → `components/views/PromoView.tsx`
    *   `BudgetModal` → `components/views/BudgetView.tsx`

2.  **Estructura de las Vistas**:
    *   Cada vista tendrá una estructura consistente:
        *   **Header Fijo (`sticky`):** Con un título y un botón de "Atrás" para cerrar la vista.
        *   **Contenido Principal:** El contenido del formulario actual, ahora dentro de un contenedor que permita el scroll vertical.
        *   **Footer Fijo (`sticky`):** Con los botones de acción principales ("Guardar", "Cancelar") siempre visibles en la parte inferior de la pantalla.

3.  **Refactorizar `ScreenRenderer.tsx`**:
    *   Modificar el `ScreenRenderer` para que pueda montar estas nuevas vistas a pantalla completa, similar a como ya se hace con `AICoachScreen`.

4.  **Actualizar Flujos de Navegación**:
    *   Modificar los `onClick` que abrían los modales para que ahora abran las vistas correspondientes a través del `screenManager`.

### **Estrategia de Testing**

*   **Test Visual/Manual:**
    *   Verificar en resoluciones móviles que el header y el footer permanecen fijos al hacer scroll en el contenido.
    *   Confirmar que el botón "Atrás" cierra la vista y devuelve al usuario a la pantalla anterior.
    *   Asegurar que toda la funcionalidad de los formularios originales se mantiene intacta.

### **Criterio de Aceptación**
Los flujos de creación/edición de Metas, Promos y Presupuestos ocurren en vistas de pantalla completa donde las acciones principales están siempre visibles, eliminando los problemas de scroll y usabilidad de los modales.

---

## 🔬 Análisis Crítico y Plan de Optimización de IA

**Estado:** **PENDIENTE**
**Criticidad:** 🟢 **BAJA** - Optimización de costos y buenas prácticas.

### **Observaciones**
1.  **Consumo Potencialmente Innecesario:** Las llamadas a la IA se activan por interacción del usuario, lo cual es correcto. Sin embargo, no parece haber un sistema de caché, lo que podría llevar a generar el mismo insight repetidamente si los datos del usuario no cambian.
2.  **Calidad de Prompts:** La efectividad de la IA depende de la calidad de los prompts. Es crucial que sean específicos, contextualizados y que soliciten un formato de salida estructurado (JSON).
3.  **Seguridad de la API Key:** La clave de la API de Gemini se maneja en el lado del cliente. Esto es aceptable si es la clave del *usuario*, pero es una **vulnerabilidad crítica** si es una clave propiedad de la aplicación.

### **Plan de Racionalización y Mejora**

1.  **Implementar Caché para Insights de IA (`aiCoachService.ts`)**:
    *   **Acción:** Antes de llamar a la API de Gemini, verificar si existe un insight reciente y válido en `localStorage`.
    *   **Lógica de Invalidación:** Invalidar el caché solo si ha pasado un tiempo determinado (ej. 24 horas) o si los datos financieros del usuario han cambiado significativamente (ej. +5 nuevas transacciones).
    *   **Testing:** Crear un test para `aiCoachService` que verifique que la API de Gemini no es llamada una segunda vez si los datos no han cambiado.

2.  **Optimizar y Centralizar Prompts**:
    *   **Acción:** Revisar los prompts enviados a Gemini. Deben ser concisos, ricos en contexto (enviar resúmenes, no datos brutos) y solicitar una salida estructurada (JSON).
    *   **Refactorización:** Mover las plantillas de los prompts a un archivo de constantes (`constants/aiPrompts.ts`) para facilitar su mantenimiento y mejora.

3.  **Plan a Largo Plazo: Migrar Llamadas de IA a un Backend Seguro**:
    *   **Acción:** Crear una **Firebase Function** que actúe como un proxy seguro.
    *   **Flujo:** La PWA llama a la Firebase Function → La función (única con acceso a la API key) llama a la API de Gemini → La función devuelve el resultado a la PWA.
    *   **Beneficios:** La API key nunca se expone al cliente, permite un control de costos y cuotas por usuario más robusto, y facilita la actualización de los prompts sin redesplegar la Pwa.

---
### Tareas Futuras (Del Plan Anterior)

Las siguientes tareas, aunque importantes, se despriorizan temporalmente para enfocarse en los puntos anteriores:

-   **Refactorizar `App.tsx` a una arquitectura basada en rutas.**
-   **Implementar una cola de sincronización offline más robusta.**
-   **Añadir cobertura de tests a contextos y componentes UI.**
