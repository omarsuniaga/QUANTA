# 🎨 QUANTA - Sistema de Diseño y Plan de Unificación Visual

## 1. 🔍 Diagnóstico Visual Actual

Tras las recientes actualizaciones, las vistas principales (**Ingresos, Gastos, Presupuestos, Historial**) han alcanzado un alto nivel de alineación fundamental. Sin embargo, para consolidar QUANTA como un producto coherente, se formaliza el siguiente diagnóstico:

*   ✅ **Estructura Macro**: Todas las vistas principales ahora comparten el patrón "Sticky Header Blanco" + "Hero Card con Gradiente".
*   ⚠️ **Micro-Inconsistencias Detectadas**:
    *   **Dashboard**: Aún utiliza patrones antiguos (cards blancas simples sin gradientes semánticos fuertes) que contrastan con las nuevas vistas internas.
    *   **Listas de Items**: Pequeñas variaciones en `padding` y `border-radius` entre la lista de Transacciones e Ingresos Fijos.
    *   **Empty States**: Los mensajes de "No hay datos" varían en tono y estilo iconográfico entre pantallas.

---

## 2. 📐 Patrones Comunes (Design Patterns)

Estos son los patrones oficiales que **deben** usarse en nuevas pantallas o refactorizaciones:

### A. Pattern: "Sticky View Header"
Encabezado fijo blanco que maximiza el espacio vertical y da contexto inmediato.
*   **Composición**: Fondo `bg-white dark:bg-slate-800`, Sombra `shadow-sm`, Icono enmarcado en caja de color suave (`bg-indigo-100`, `bg-rose-100`, etc.), Título `text-xl font-bold`.
*   **Uso**: En TODAS las vistas de nivel superior del Tab Bar.

### B. Pattern: "Semantic Hero Card"
Tarjeta principal que resume el estado de la vista en un solo vistazo.
*   **Composición**: Fondo gradiente (`bg-gradient-to-br`), Texto Blanco, Sombra de color (`shadow-lg`).
*   **Contenido**:
    *   **Título**: Uppercase, pequeño (`text-xs font-bold`), con opacidad (`text-white/80`).
    *   **Valor Principal**: Grande, negrita (`text-3xl font-extrabold`).
    *   **Indicadores Secundarios**: A la derecha o abajo, más pequeños.
    *   **Status de Color**:
        *   🟢 **Saludable**: `from-emerald-500 to-teal-600`
        *   🟡 **Advertencia**: `from-amber-400 to-orange-500`
        *   🔴 **Crítico/Gasto**: `from-rose-500 to-orange-600` (Gasto), `from-purple-500 to-violet-600` (Presupuesto Neutro).

### C. Pattern: "Action List Item"
Elementos de lista para transacciones, presupuestos o categorías.
*   **Estilo**: `bg-white dark:bg-slate-800`, `rounded-xl`, `border border-slate-100`, `shadow-sm`.
*   **Interacción**: Siempre debe tener feedback visual al toque (`active:scale-[0.99]`, `bg-slate-50` en hover).

---

## 3. 🎨 Lenguaje Visual Unificado

### 🌈 Colores Semánticos (Single Source of Truth)
El color no es decorativo, es **información**.

| Estado | Clases Tailwind (Light/Dark) | Uso Estricto |
| :--- | :--- | :--- |
| **Positivo / Ingreso** | `text-emerald-600 dark:text-emerald-400` | Ingresos recibidos, Presupuesto sobrante, Ahorro. |
| **Negativo / Salida** | `text-rose-600 dark:text-rose-400` | Gastos, Déficit, Deuda, Presupuesto excedido. |
| **Advertencia** | `text-amber-600 dark:text-amber-400` | Presupuesto >70%, Pagos próximos (3 días). |
| **Neutro / Estructura** | `text-slate-500 dark:text-slate-400` | Etiquetas, fechas, iconos inactivos. |
| **Acción / Marca** | `text-indigo-600 dark:text-indigo-400` | Enlaces, botones primarios, selección. |

### 🔤 Jerarquía Tipográfica
Evitar tamaños arbitrarios. Usar esta escala:

*   **Display / Valor Hero**: `text-3xl` o `text-4xl` (font-extrabold).
*   **Título Vista**: `text-xl` (font-bold).
*   **Título Card/Sección**: `text-sm` (font-bold, uppercase opcional).
*   **Cuerpo / Lista**: `text-base` o `text-sm` (font-medium).
*   **Meta / Label**: `text-[10px]` o `text-xs` (font-medium, uppercase, tracking-wide).

---

## 4. 🏗️ Estructura de Vista Recomendada (Layout Base)

Toda pantalla principal debe seguir este esqueleto en el código:

```tsx
<div className="flex-1 overflow-y-auto pb-20"> {/* Contenedor Principal con Scroll */}
  
  {/* 1. STICKY HEADER */}
  <div className="sticky top-0 z-10 bg-white shadow-sm...">
    <h1>Título</h1>
  </div>

  {/* 2. HERO SECTION (Margen negativo para compensar si se desea efecto superpuesto, o standard) */}
  <div className="p-4">
    <HeroCard /> {/* Gradiente según estado */}
  </div>

  {/* 3. QUICK ACTIONS (Opcional) */}
  <div className="mb-6 px-4">
    <Button>Agregar X</Button> 
  </div>

  {/* 4. CONTENT LIST */}
  <div className="space-y-4 px-4">
    <SectionTitle>Hoy</SectionTitle>
    <List>...</List>
  </div>

</div>
```

---

## 5. 🚀 Recomendaciones de Implementación

Para finalizar la unificación:

1.  **Dashboard Refactor**: Aplicar el patrón "Sticky Header" y "Hero Card" al Dashboard (Home), que actualmente usa un diseño más antiguo.
2.  **Componente `ScreenHeader`**: Crear un componente reutilizable `<ScreenHeader title={...} icon={...} color={...} />` para evitar repetir el bloque `div sticky...` en cada archivo.
3.  **Componente `HeroCard`**: Abstraer la tarjeta de gradiente en un componente `<HeroCard value={...} label={...} variant="success|warning|danger|neutral" />`.
4.  **Unificar Empty States**: Crear `<EmptyState icon={...} message={...} />` para usar el mismo estilo en todas las listas vacías.

Este plan garantiza que QUANTA escale visualmente sin acumular deuda de diseño.
