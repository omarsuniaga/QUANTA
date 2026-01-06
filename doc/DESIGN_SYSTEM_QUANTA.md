# QUANTA Design System

**Version**: 1.0  
**Last Updated**: January 2026  
**Purpose**: Unified visual language and component library for QUANTA Finance App

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Patterns](#patterns)
7. [Dark Mode](#dark-mode)

---

## Design Principles

### 1. Consistency
Every view should feel like part of the same product. Same components, same spacing, same interactions.

### 2. Clarity
Financial data must be immediately understandable. Use clear hierarchy, semantic colors, and descriptive labels.

### 3. Feedback
Every user action should have visual feedback (toasts, state changes, animations).

### 4. Accessibility
Support dark mode, keyboard navigation, and screen readers.

---

## Color Palette

### Semantic Colors (by Module)

#### Income (Green/Teal/Yellow)
- **Primary Gradient**: `from-emerald-500 to-teal-600`
- **Light Background**: `bg-emerald-100 dark:bg-emerald-900/30`
- **Icon/Text**: `text-emerald-600 dark:text-emerald-400`
- **Warning**: `from-yellow-500 to-amber-600` (low balance)

#### Expenses (Rose/Orange)
- **Primary Gradient**: `from-rose-500 to-orange-600`
- **Light Background**: `bg-rose-100 dark:bg-rose-900/30`
- **Icon/Text**: `text-rose-600 dark:text-rose-400`

#### Budgets (Purple/Violet)
- **Primary Gradient**: `from-purple-500 to-violet-600`
- **Light Background**: `bg-purple-100 dark:bg-purple-900/30`
- **Icon/Text**: `text-purple-600 dark:text-purple-400`

#### History (Grayscale)
- **Primary Gradient**: `from-slate-600 to-slate-700`
- **Light Background**: `bg-slate-100 dark:bg-slate-800`
- **Icon/Text**: `text-slate-600 dark:text-slate-400`

### Status Colors
- **Pending**: `bg-yellow-500` (yellow)
- **Paid/Complete**: `bg-emerald-600` (green)
- **Skipped**: `bg-slate-400` (gray)
- **Overdue**: `bg-rose-600` (red)

---

## Typography

### Scale

```javascript
pageTitle: 'text-xl font-bold'          // Main screen title
sectionTitle: 'text-lg font-bold'       // Section headers
cardTitle: 'text-sm font-medium uppercase tracking-wider' // Card headers
amountLarge: 'text-3xl font-extrabold tracking-tight' // Main amounts
amountMedium: 'text-xl font-bold'       // Secondary amounts
amountSmall: 'text-lg font-bold'        // Item amounts
body: 'text-sm'                         // Default text
caption: 'text-xs'                      // Labels, hints
```

### Font Family
- **Default**: System fonts (`sans-serif`)
- **Monospace** (for amounts): Optional, use `font-mono` for consistency

---

## Spacing & Layout

### Spacing Scale

```javascript
section: 'py-6'        // Vertical spacing between sections
card: 'p-5'            // Standard card padding
cardCompact: 'p-4'     // Compact card padding
item: 'px-4 py-3'      // List item padding
gap: 'gap-4'           // Standard gap between elements
gapCompact: 'gap-2'    // Compact gap
```

### Border Radius

```javascript
card: 'rounded-2xl'    // Cards, modals
button: 'rounded-lg'   // Buttons, inputs
pill: 'rounded-full'   // Pills, badges
```

### Shadows

- **Card**: `shadow-lg` (light), `dark:shadow-none` (dark)
- **Modal**: `shadow-xl`
- **Dropdown**: `shadow-xl`

---

## Components

### 1. PageHeader

**Purpose**: Consistent header for all screens

**Anatomy**:
- Icon (themed by module)
- Title
- Optional back button

**Usage**:
```tsx
<PageHeader 
  title="Mis Ingresos" 
  icon={TrendingUp} 
  iconColor="emerald" 
/>
```

**Example**:
```tsx
// In IncomeScreen
<PageHeader 
  title={language === 'es' ? 'Mis Ingresos' : 'My Income'}
  icon={TrendingUp}
  iconColor="emerald"
/>

// In ExpensesScreen
<PageHeader 
  title={language === 'es' ? 'Mis Gastos' : 'My Expenses'}
  icon={TrendingDown}
  iconColor="rose"
/>
```

---

### 2. PeriodSelector

**Purpose**: Month navigation

**Anatomy**:
- ChevronLeft button
- Current period label (e.g., "Enero 2026")
- ChevronRight button

**Usage**:
```tsx
<PeriodSelector
  currentPeriod="2026-01"
  onPrevious={handlePrev}
  onNext={handleNext}
  isCurrentMonth={true}
/>
```

**Visual**:
```
┌─────────────────────────────┐
│  ←   Enero 2026   →        │
└─────────────────────────────┘
```

---

### 3. StatsCard

**Purpose**: Main summary card with gradient and stats

**Anatomy**:
- Gradient background (semantic by module)
- Main label + amount
- Optional secondary stats
- Optional progress bar
- Optional tooltip

**Usage**:
```tsx
<StatsCard
  gradient="from-emerald-500 to-teal-600"
  mainLabel="Margen Disponible (Mes)"
  mainAmount={15000}
  showProgressBar
  progressPercentage={75}
/>
```

**Visual**:
```
╔════════════════════════════╗
║ [Gradient Background]      ║
║                            ║
║ MARGEN DISPONIBLE (MES) ℹ️ ║
║ R$ 15,000.00              ║
║                            ║
║ ▓▓▓▓▓▓▓▓▓▓░░░░ 75%        ║
║                            ║
╚════════════════════════════╝
```

---

### 4. SectionHeader

**Purpose**: Consistent section titles

**Anatomy**:
- Icon
- Title
- Optional tooltip
- Optional action button

**Usage**:
```tsx
<SectionHeader
  title="Ingresos Fijos"
  icon={Calendar}
  iconColor="emerald"
  tooltip="Ingresos que se repiten cada mes"
  action={<button>+ Nuevo</button>}
/>
```

---

### 5. ActionButton

**Purpose**: Unified button system

**Variants**:
- **Primary**: Main actions (e.g., "Pagar", "Guardar")
- **Secondary**: Less prominent actions
- **Ghost**: Tertiary actions
- **Danger**: Destructive actions (e.g., "Eliminar")

**Usage**:
```tsx
<ActionButton variant="primary" onClick={handlePay}>
  Pagar
</ActionButton>

<ActionButton variant="danger" onClick={handleDelete}>
  Eliminar
</ActionButton>
```

**Visual States**:
- Primary: `bg-emerald-600 hover:bg-emerald-700`
- Secondary: `bg-slate-200 hover:bg-slate-300`
- Ghost: `hover:bg-slate-100`
- Danger: `bg-rose-600 hover:bg-rose-700`

---

### 6. EmptyState

**Purpose**: Consistent "no data" messaging

**Anatomy**:
- Icon
- Title
- Description
- Optional CTA button

**Usage**:
```tsx
<EmptyState
  icon={Calendar}
  title="No hay ingresos fijos"
  description="Crea tu primer ingreso recurrente para comenzar."
  actionLabel="Crear Ingreso"
  onAction={handleCreate}
/>
```

**Visual**:
```
       [Icon]
   
   No hay ingresos fijos
   
   Crea tu primer ingreso 
   recurrente para comenzar.
   
   ┌──────────────┐
   │ Crear Ingreso│
   └──────────────┘
```

---

### 7. StatusBadge

**Purpose**: Unified status indicators

**Variants**:
- `pending` - Yellow
- `paid` - Green
- `skipped` - Gray
- `overdue` - Red

**Usage**:
```tsx
<StatusBadge status="paid" />
// Renders: 🟢 Pagado

<StatusBadge status="pending" />
// Renders: 🟡 Pendiente
```

---

### 8. Tooltip

**Purpose**: Consistent info tooltips

**Usage**:
```tsx
<Tooltip content="Este valor es un indicador del mes...">
  <Info className="w-4 h-4" />
</Tooltip>
```

---

## Patterns

### Pattern 1: Screen Structure

Every main screen follows this layout:

```
┌─────────────────────────────┐
│ [PageHeader]                │ Sticky
│ [PeriodSelector]            │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [StatsCard - Main Summary]  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [SectionHeader]             │
│ [List of Items]             │
└─────────────────────────────┘
┌─────────────────────────────┐
│ [SectionHeader]             │
│ [List of Items]             │
└─────────────────────────────┘
```

### Pattern 2: List Item

Consistent item cards:

```tsx
<div className="bg-white dark:bg-slate-800 rounded-2xl p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-100 rounded-xl">
        [Icon]
      </div>
      <div>
        <h3 className="font-bold">Item Title</h3>
        <p className="text-xs text-slate-500">Subtitle</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold">R$ 1,000</p>
      <StatusBadge status="paid" />
    </div>
  </div>
</div>
```

### Pattern 3: Filter Pills

```tsx
<div className="flex gap-2">
  <button className="px-4 py-2 rounded-full bg-emerald-600 text-white">
    Todos
  </button>
  <button className="px-4 py-2 rounded-full bg-slate-100">
    Pendientes
  </button>
</div>
```

---

## Dark Mode

### Principles
1. Every component must have dark mode variants
2. Use `dark:` prefix consistently
3. Test in both modes

### Key Classes
- Background: `bg-white dark:bg-slate-800`
- Text: `text-slate-800 dark:text-white`
- Borders: `border-slate-200 dark:border-slate-700`
- Cards: `bg-slate-50 dark:bg-slate-800/50`

### Gradients in Dark Mode
- Keep gradients vibrant
- Add `dark:shadow-none` to prevent weird shadows

---

## Implementation Checklist

When creating a new screen or component:

- [ ] Use base components (`PageHeader`, `StatsCard`, etc.)
- [ ] Apply spacing from design tokens
- [ ] Use semantic colors (Income=green, Expense=rose, etc.)
- [ ] Add dark mode variants to all elements
- [ ] Use `rounded-2xl` for cards
- [ ] Include tooltips for complex concepts
- [ ] Add empty states
- [ ] Test in both light and dark mode
- [ ] Ensure keyboard accessibility

---

## Examples

### Complete IncomeScreen Structure

```tsx
<div className="pb-20">
  {/* 1. HEADER */}
  <div className="bg-white dark:bg-slate-800 sticky top-0 z-10">
    <PageHeader 
      title="Mis Ingresos" 
      icon={TrendingUp} 
      iconColor="emerald" 
    />
    <PeriodSelector
      currentPeriod={period}
      onPrevious={handlePrev}
      onNext={handleNext}
      isCurrentMonth={isCurrentMonth}
    />
  </div>

  {/* 2. MAIN STATS */}
  <div className="px-4 mt-4">
    <StatsCard
      gradient="from-emerald-500 to-teal-600"
      mainLabel="Margen Disponible (Mes)"
      mainAmount={marginDisponible}
      showProgressBar
      progressPercentage={percentReceived}
    />
  </div>

  {/* 3. SECTIONS */}
  <div className="px-4 py-6 space-y-8">
    <div>
      <SectionHeader
        title="Ingresos Fijos"
        icon={Calendar}
        iconColor="emerald"
        tooltip="Ingresos recurrentes del mes"
      />
      {/* Items list */}
    </div>
  </div>
</div>
```

---

## Migration Guide

### Replacing Old Components

**Before**:
```tsx
<div className="bg-white pb-6 pt-2 px-4">
  <h1 className="text-xl font-bold">Mis Ingresos</h1>
</div>
```

**After**:
```tsx
<PageHeader title="Mis Ingresos" icon={TrendingUp} iconColor="emerald" />
```

---

## Future Enhancements

1. **Animation Library**: Consistent transitions/micro-interactions
2. **Component Playground**: Storybook for testing components
3. **Accessibility Audit**: Full WCAG 2.1 AA compliance
4. **Performance**: Lazy loading, code splitting

---

**Maintained by**: QUANTA Development Team  
**Questions?**: Open an issue in the repo
