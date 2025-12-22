# QUANTA: Financial Strategy Framework (QFSF)

## 1. Visión: Del Registro a la Estrategia
El objetivo es transformar la aplicación de una herramienta de registro pasivo a un **Gestor de Patrimonio Activo**.
Implementaremos "Motores de Estrategia" intercambiables. El usuario (o la IA) selecciona un motor, y la aplicación reconfigura sus reglas, alertas y cálculos matemáticos.

---

## 2. Los 4 Modelos Financieros (Arquetipos)

Hemos sintetizado la teoría financiera en 4 modelos programables. Cada modelo tiene parámetros (`Properties`) y lógica (`Components`) distintos.

### Modelo A: "El Esencialista" (Regla 50/30/20)
*Ideal para: Principiantes, Estabilidad, Simplicidad.*
*   **Filosofía:** Equilibrio automático sin micro-gestión.
*   **Matemática (Allocation Logic):**
    *   `Needs (Necesidades)`: 50% del Ingreso Neto.
    *   `Wants (Deseos)`: 30% del Ingreso Neto.
    *   `Future (Ahorro/Deuda)`: 20% del Ingreso Neto.
*   **KPI Principal:** **Savings Rate (Tasa de Ahorro)**.
*   **Intervención IA:** Baja. Solo avisa si los bloques se desbordan.

### Modelo B: "El Auditor" (Presupuesto Base Cero - ZBB)
*Ideal para: Control total, Salir de deudas, Ingresos variables.*
*   **Filosofía:** "Cada dólar tiene un trabajo". El ingreso menos gastos debe ser igual a cero.
*   **Matemática:**
    *   `Unassigned = Income - (Expenses + Savings)`
    *   Objetivo: `Unassigned === 0`.
*   **KPI Principal:** **Aging of Money** (¿Cuántos días dura tu dinero desde que entra hasta que sale?).
*   **Intervención IA:** Alta. Sugiere categorización precisa y alerta sobre dinero "ocioso".

### Modelo C: "El Inversionista" (FIRE - Financial Independence)
*Ideal para: Maximización de riqueza, Usuarios avanzados, Altos ingresos.*
*   **Filosofía:** Maximizar el "Gap" entre ingreso y gasto para invertir agresivamente.
*   **Matemática:**
    *   Foco en `Net Worth` (Patrimonio Neto).
    *   Proyección de Interés Compuesto.
    *   Calculo de "Años de Libertad" (Runway).
*   **KPI Principal:** **Financial Independence Number (FI Number)** y **Safe Withdrawal Rate**.
*   **Intervención IA:** Analista de Inversiones. Sugiere reducción de gastos recurrentes (suscripciones) para maximizar el capital invertible.

### Modelo D: "El Estratega Defensivo" (Bola de Nieve / Avalancha)
*Ideal para: Crisis, Alto endeudamiento.*
*   **Filosofía:** Eliminar pasivos tóxicos lo más rápido posible.
*   **Matemática:**
    *   Ordenamiento de Deudas: Por Saldo (Nieve) o por Tasa de Interés (Avalancha).
    *   `Debt-to-Income Ratio (DTI)`.
*   **KPI Principal:** **Debt Free Date** (Fecha de Libertad).
*   **Intervención IA:** Coach de Disciplina. Celebra cada pago, bloquea gastos superfluos ("Deseos").

---

## 3. Componentes Técnicos & Estructura de Datos

Para implementar esto, necesitamos definir las siguientes interfaces en `types.ts` y lógica en `financialMathCore.ts`.

### 3.1 Propiedades del Plan (`FinancialPlan`)
```typescript
interface FinancialPlan {
  id: 'essentialist' | 'auditor' | 'investor' | 'defensive';
  name: string;
  description: string;
  
  // Reglas de Asignación (Matemática)
  allocationRules: {
    categoryGroup: 'needs' | 'wants' | 'savings' | 'debt';
    targetPercentage?: number; // Para 50/30/20
    isStrict: boolean; // Si es true, bloquea/alerta agresivamente
  }[];

  // Métricas Clave a Monitorear
  primaryKPI: 'savings_rate' | 'zero_based_gap' | 'net_worth_growth' | 'debt_reduction_velocity';
  
  // Configuración de IA
  aiPersonality: 'friendly_coach' | 'strict_accountant' | 'wealth_manager';
}
```

### 3.2 Métricas de "Matemática Profunda" (Deep Math)

Implementaremos estas fórmulas en el motor matemático:

1.  **Burn Rate & Runway:**
    *   `Burn Rate = Promedio(Gastos Últimos 3 Meses)`
    *   `Runway (Meses de Vida) = Total Liquid Assets / Burn Rate`
    *   *Uso:* Vital para todos, crítico para Freelancers.

2.  **Debt-to-Income (DTI):**
    *   `DTI = (Pagos Mensuales de Deuda / Ingreso Bruto Mensual) * 100`
    *   *Uso:* Diagnóstico de salud crediticia.

3.  **Savings Rate (SR):**
    *   `SR = ((Ingreso - Gasto) / Ingreso) * 100`
    *   *Uso:* El indicador #1 de éxito financiero a largo plazo.

4.  **Discretionary Income (Ingreso Discrecional Real):**
    *   `Real DI = Ingreso - (Costos Fijos + Deuda Mínima + Comida Básica)`
    *   *Uso:* Lo que realmente tienes para gastar o ahorrar.

---

## 4. El Rol de la IA (El Contexto)

La IA no calcula, **diagnostica y prescribe**.

**Flujo de Trabajo:**
1.  **Análisis (Input):** La IA recibe las últimas 50 transacciones y las métricas calculadas por el `MathCore` (DTI, SR, Burn Rate).
2.  **Diagnóstico:**
    *   *"El usuario intenta ahorrar pero su Gasto Hormiga es del 15% (debería ser <5%)".*
    *   *"Tiene un DTI del 45% (Peligro)".*
3.  **Propuesta (Output):**
    *   *"Detecto que estás en una zona de riesgo por deuda. Te recomiendo cambiar al plan **'Estratega Defensivo'** por 3 meses."*
    *   *"Felicidades, tu flujo es estable. ¿Quieres pasar al modo **'Inversionista'** para planear tu retiro?"*

---

## 5. Roadmap de Implementación

1.  **Fase Matemáticas (Inmediato):** Expandir `financialMathCore.ts` con las fórmulas de KPI (Runway, DTI, Savings Rate).
2.  **Fase Estructura (Corto Plazo):** Crear la interfaz `FinancialPlan` y los 4 objetos de configuración predefinidos.
3.  **Fase UI:** Crear una pantalla de "Selección de Estrategia" donde el usuario elige su modo.
4.  **Fase IA:** Crear un prompt de sistema ("The CFO Persona") que analice los KPIs y recomiende cambios de estrategia.
