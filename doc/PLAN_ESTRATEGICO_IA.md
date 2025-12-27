# Plan Estratégico de Optimización de IA en QUANTA

## 1. Visión y Filosofía: "Inteligencia Híbrida"

Para garantizar la sostenibilidad, precisión y escalabilidad de QUANTA, adoptaremos una arquitectura de **Inteligencia Híbrida**.
La premisa fundamental es: **"La IA razona y contextualiza; el Código calcula y ejecuta."**

Los LLMs (Modelos de Lenguaje) son excelentes para entender el lenguaje natural y patrones difusos, pero son costosos, lentos y propensos a errores en cálculos aritméticos complejos. Por ello, moveremos toda la lógica financiera a un motor matemático determinista.

---

## 2. Arquitectura Propuesta

Dividiremos la lógica "inteligente" en tres capas jerárquicas:

### Capa 1: Motor Matemático (Deterministic Core)
*   **Función:** Cálculos financieros, proyecciones, amortizaciones y estadísticas.
*   **Tecnología:** TypeScript puro (sin llamadas a API).
*   **Ubicación:** `utils/financialMathCore.ts`
*   **Ventaja:** Costo cero, latencia cero, 100% precisión.

### Capa 2: Heurística Local (Rule-based Engine)
*   **Función:** Clasificación rápida basada en reglas predefinidas y palabras clave.
*   **Ejemplo:** Si la descripción contiene "Starbucks" -> Categoría "Comida".
*   **Ventaja:** Respuesta inmediata, reduce llamadas a la IA en un 40-60%.

### Capa 3: Inteligencia Generativa (AI Layer)
*   **Función:** Entender intenciones complejas, análisis de sentimiento financiero, categorización de descripciones ambiguas y sugerencias estratégicas cualitativas.
*   **Tecnología:** Gemini 2.5 Flash (vía `geminiService.ts`).
*   **Ventaja:** Manejo de ambigüedad y experiencia de usuario "humana".

---

## 3. Implementación de Funcionalidades

### A. Auto-Categorización Inteligente (Hybrid approach)

**Problema:** El usuario ingresa "Cena con amigos".
**Solución:**

1.  **Intento Local:** El sistema busca "Cena" en un diccionario local de palabras clave (`utils/categoryKeywords.ts`).
2.  **Fallback a IA:** Si no hay coincidencia, se envía a Gemini: *"Categoriza 'Cena con amigos' en una de estas categorías: [Lista]"*.
3.  **Aprendizaje:** La respuesta de la IA se guarda localmente (o en DB) para que la próxima vez "Cena con amigos" sea un acierto local (Capa 2).

### B. Análisis Predictivo y Proyecciones (Math Core)

**Problema:** "¿Me alcanzará el dinero hasta fin de mes?"
**Solución (Capa 1 - Matemático):**
La IA **NO** debe calcular esto. Crearemos funciones en `financialMathCore.ts`:

*   `calculateBurnRate(transactions: Transaction[]): number` (Gasto diario promedio).
*   `projectEndOfMonthBalance(currentBalance: number, burnRate: number): number`.
*   `detectSeasonality(history: Transaction[]): number` (Coeficiente de ajuste).

**Rol de la IA aquí:**
La IA solo analiza el *resultado* de la fórmula para dar el mensaje:
*   *Input:* `projection: -200`
*   *AI Output:* "Cuidado, a este ritmo te faltarán $200. Te sugiero reducir gastos en Ocio."

### C. Distribución de Superávit (Savings Strategy)

**Problema:** "¿Qué hago con los $500 que me sobraron?"
**Solución:**
La lógica financiera (`financialMathCore.ts`) ejecuta estrategias estándar:
1.  **Fondo de Emergencia:** Si `ahorro < 3 * gastos_mensuales`, asignar 50%.
2.  **Deuda:** Si hay deuda con interés alto, asignar 30%.
3.  **Inversión:** Resto.

La IA explica *por qué* se eligió esa estrategia, pero no inventa los números.

---

## 4. Estructura de Archivos Recomendada

```text
src/
├── utils/
│   ├── financialMathCore.ts    <-- NUEVO: Motor de cálculo (Regresión lineal, medias móviles, etc.)
│   ├── categoryKeywords.ts     <-- NUEVO: Diccionario local para categorización rápida.
│   └── dashboardCalculations.ts <-- (Existente) Migrar lógica compleja al MathCore.
├── services/
│   ├── geminiService.ts        <-- REFACTOR: Solo para NLP y razonamiento cualitativo.
│   └── aiCoachService.ts       <-- REFACTOR: Orquestador que une MathCore + Gemini.
```

---

## 5. Hoja de Ruta (Roadmap) Fase Actual

### Fase 1: Cimientos (Inmediato)
1.  Crear `utils/financialMathCore.ts`.
2.  Implementar fórmulas de:
    *   Proyección lineal simple (Gastos vs Días restantes).
    *   Detección de anomalías estadísticas (Z-Score simple para gastos inusuales).
3.  Implementar `utils/categoryKeywords.ts` con 50-100 palabras comunes.

### Fase 2: Integración (Corto Plazo)
1.  Modificar `geminiService.ts` para usar el diccionario de keywords antes de llamar a la API.
2.  Actualizar el `AICoach` para que primero ejecute los cálculos matemáticos y le pase los *resultados* a la IA para que genere el texto, reduciendo drásticamente el tamaño del prompt y el riesgo de alucinación numérica.

### Fase 3: Optimización Avanzada (Futuro)
1.  **Embeddings Locales:** Usar modelos pequeños (TensorFlow.js) en el navegador para categorización semántica sin salir a internet.
2.  **Cache Persistente:** Guardar las respuestas de categorización de la IA en Firestore para crear una base de datos de conocimiento global compartida (anonimizada).

---

## 6. Buenas Prácticas de Consumo de IA (Cost & Performance)

1.  **Pattern Batching:** Si hay que categorizar 5 transacciones importadas, enviar 1 sola petición a la IA con las 5, no 5 peticiones.
2.  **Output Estructurado:** Siempre forzar respuesta JSON (ya implementado, mantener).
3.  **Contexto Mínimo:** No enviar todo el historial de transacciones. Enviar solo agregados (sumas por categoría) calculados previamente por `financialMathCore.ts`.
