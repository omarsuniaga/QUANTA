# QUANTA Design System

## Design Principles

1. **Simplicity**: Clean, uncluttered interfaces
2. **Consistency**: Reusable components and patterns
3. **Accessibility**: WCAG 2.1 compliant
4. **Responsiveness**: Mobile-first, works on all devices
5. **Performance**: Fast, smooth interactions

## Color System

### Primary Colors
```css
--blue-600: #2563eb  /* Primary brand color */
--blue-700: #1d4ed8  /* Hover state */
--blue-50:  #dbeafe  /* Light backgrounds */
```

### Semantic Colors
```css
/* Success (Income, Positive) */
--green-600: #10b981
--green-700: #059669
--green-50:  #d1fae5

/* Danger (Expense, Negative) */
--red-600: #ef4444
--red-700: #dc2626
--red-50:  #fee2e2

/* Warning (Alert, Caution) */
--amber-600: #f59e0b
--amber-700: #d97706
--amber-50:  #fef3c7

/* Info (Neutral, General) */
--blue-600: #3b82f6
```

### Neutral Colors
```css
--gray-50:  #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

### Usage Guidelines
- **Primary**: CTAs, links, active states
- **Success**: Income, positive trends, success messages
- **Danger**: Expenses, negative trends, destructive actions
- **Warning**: Alerts, budget warnings
- **Neutral**: Text, borders, backgrounds

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
             'Helvetica Neue', sans-serif;
```

### Type Scale
```css
--text-xs:   0.75rem   /* 12px - Tiny labels */
--text-sm:   0.875rem  /* 14px - Secondary text */
--text-base: 1rem      /* 16px - Body text */
--text-lg:   1.125rem  /* 18px - Subheadings */
--text-xl:   1.25rem   /* 20px - Section titles */
--text-2xl:  1.5rem    /* 24px - Page headings */
--text-3xl:  1.875rem  /* 30px - Hero text */
```

### Font Weights
```css
--font-normal:   400  /* Body text */
--font-medium:   500  /* Emphasized text */
--font-semibold: 600  /* Subheadings */
--font-bold:     700  /* Headings */
```

### Line Heights
```css
--leading-tight:  1.25  /* Headings */
--leading-normal: 1.5   /* Body */
--leading-relaxed: 1.75 /* Readable paragraphs */
```

## Spacing System

### Scale (4px base unit)
```css
--spacing-0: 0
--spacing-1: 0.25rem  /* 4px */
--spacing-2: 0.5rem   /* 8px */
--spacing-3: 0.75rem  /* 12px */
--spacing-4: 1rem     /* 16px */
--spacing-5: 1.25rem  /* 20px */
--spacing-6: 1.5rem   /* 24px */
--spacing-8: 2rem     /* 32px */
--spacing-10: 2.5rem  /* 40px */
--spacing-12: 3rem    /* 48px */
--spacing-16: 4rem    /* 64px */
```

### Usage
- **Padding**: `--spacing-4` (16px) for cards
- **Margins**: `--spacing-4` between sections
- **Gaps**: `--spacing-3` (12px) in flex/grid

## Components

### Button
```tsx
// Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors">
  Primary Button
</button>

// Secondary
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                   hover:bg-gray-200 transition-colors">
  Secondary Button
</button>

// Danger
<button className="px-4 py-2 bg-red-50 text-red-700 rounded-lg
                   hover:bg-red-100 transition-colors">
  Delete
</button>

// Sizes
sm: px-3 py-1.5 text-sm
md: px-4 py-2 text-base (default)
lg: px-6 py-3 text-lg
```

### Card
```tsx
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

### Input
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg
             focus:ring-2 focus:ring-blue-600 focus:border-transparent
             outline-none transition-all"
  placeholder="Enter text"
/>
```

### Badge
```tsx
<span className="inline-flex px-2 py-1 text-xs font-medium
                 rounded-full bg-green-50 text-green-700">
  Active
</span>
```

### Modal
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white rounded-lg p-6 w-full max-w-lg">
    <h2 className="text-xl font-bold mb-4">Modal Title</h2>
    {/* Content */}
  </div>
</div>
```

## Iconography

### Icon Library
**Lucide React** - 20x20px default, 24x24px large

### Common Icons
- **Money**: Wallet, DollarSign, Banknote
- **Trends**: TrendingUp, TrendingDown, BarChart3
- **Actions**: Plus, Minus, Edit, Trash2, Check, X
- **Navigation**: ChevronRight, ChevronLeft, Menu, Home
- **Categories**: ShoppingCart, Home, Car, Coffee, Film

### Icon Sizing
```tsx
// Small (16x16)
<Icon className="w-4 h-4" />

// Default (20x20)
<Icon className="w-5 h-5" />

// Large (24x24)
<Icon className="w-6 h-6" />
```

### Icon Colors
```tsx
// Inherit from parent
<Icon className="w-5 h-5 text-blue-600" />

// Contextual
<TrendingUp className="w-5 h-5 text-green-600" />  // Income
<TrendingDown className="w-5 h-5 text-red-600" />  // Expense
```

## Layout Patterns

### Page Layout
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <header className="bg-white border-b">
    {/* ... */}
  </header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-6">
    {/* ... */}
  </main>

  {/* Footer/Navigation */}
  <nav className="fixed bottom-0 w-full bg-white border-t md:hidden">
    {/* Mobile nav */}
  </nav>
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-white rounded-lg p-6">Item 1</div>
  <div className="bg-white rounded-lg p-6">Item 2</div>
  <div className="bg-white rounded-lg p-6">Item 3</div>
</div>
```

### List Layout
```tsx
<div className="space-y-2">
  {items.map(item => (
    <div key={item.id}
         className="flex items-center justify-between
                    py-3 px-4 bg-white rounded-lg">
      {/* Item content */}
    </div>
  ))}
</div>
```

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Mobile-First Approach
```tsx
// Default: Mobile
<div className="text-sm p-4">

// Tablet and up
<div className="text-sm md:text-base p-4 md:p-6">

// Desktop and up
<div className="text-sm md:text-base lg:text-lg p-4 md:p-6 lg:p-8">
```

## Animations

### Transitions
```css
transition: all 0.2s ease-in-out;  /* Standard */
transition: opacity 0.15s;          /* Fade */
transition: transform 0.2s;         /* Move/Scale */
```

### Hover Effects
```tsx
<button className="transform hover:scale-105 transition-transform">
  Hover me
</button>
```

### Loading Skeleton
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

## Accessibility

### Color Contrast
- **Normal text**: 4.5:1 minimum
- **Large text (18px+)**: 3:1 minimum
- **Interactive**: 3:1 minimum

### Focus States
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-blue-600
                   focus:ring-offset-2 rounded">
  Button
</button>
```

### Screen Reader Text
```tsx
<span className="sr-only">Screen reader only text</span>
```

## Best Practices

1. **Reuse Base Components**: Use existing components from `components/base/`
2. **Consistent Spacing**: Use spacing scale, not arbitrary values
3. **Semantic Colors**: Use semantic colors (success/danger) not generic (green/red)
4. **Mobile-First**: Design for mobile, enhance for desktop
5. **Accessible**: Always include ARIA labels, focus states, semantic HTML
