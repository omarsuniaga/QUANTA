/**
 * QUANTA Design Tokens
 * Centralized design system values for consistent UI/UX
 */

// ==================== COLOR PALETTE ====================

export const colors = {
  // Income Module: Green/Teal/Yellow
  income: {
    primary: 'from-emerald-500 to-teal-600',
    primarySolid: 'bg-emerald-600',
    light: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    warning: 'from-yellow-500 to-amber-600',
    warningSolid: 'bg-yellow-500',
  },
  
  // Expenses Module: Rose/Orange
  expense: {
    primary: 'from-rose-500 to-orange-600',
    primarySolid: 'bg-rose-600',
    light: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  
  // Budgets Module: Purple/Violet
  budget: {
    primary: 'from-purple-500 to-violet-600',
    primarySolid: 'bg-purple-600',
    light: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  
  // History/Transactions Module: Grayscale
  history: {
    primary: 'from-slate-600 to-slate-700',
    primarySolid: 'bg-slate-600',
    light: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  
  // Status Colors
  status: {
    pending: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    },
    paid: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    },
    skipped: {
      bg: 'bg-slate-400',
      text: 'text-slate-700 dark:text-slate-300',
      badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    overdue: {
      bg: 'bg-rose-600',
      text: 'text-rose-700 dark:text-rose-300',
      badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    },
  },
};

// ==================== SPACING SCALE ====================

export const spacing = {
  section: 'py-6',
  sectionCompact: 'py-4',
  card: 'p-5',
  cardCompact: 'p-4',
  item: 'px-4 py-3',
  itemCompact: 'px-3 py-2',
  gap: 'gap-4',
  gapCompact: 'gap-2',
  gapLarge: 'gap-6',
  container: 'px-4', // Added for consistent container padding
};

// ==================== BORDER RADIUS ====================

export const radius = {
  card: 'rounded-2xl',
  button: 'rounded-lg',
  pill: 'rounded-full',
  input: 'rounded-lg',
  badge: 'rounded-full',
};

// ==================== TYPOGRAPHY ====================

export const text = {
  // Titles
  pageTitle: 'text-xl font-bold',
  sectionTitle: 'text-lg font-bold',
  cardTitle: 'text-sm font-medium uppercase tracking-wider',
  
  // Amounts
  amountLarge: 'text-3xl font-extrabold tracking-tight',
  amountMedium: 'text-xl font-bold',
  amountSmall: 'text-lg font-bold',
  
  // Body
  body: 'text-sm',
  bodyLarge: 'text-base',
  caption: 'text-xs',
  
  // Labels
  label: 'text-xs uppercase font-bold tracking-wider',
};

// ==================== SHADOWS ====================

export const shadows = {
  card: 'shadow-lg dark:shadow-none',
  modal: 'shadow-xl',
  dropdown: 'shadow-xl',
  none: 'shadow-none',
};

// ==================== TRANSITIONS ====================

export const transitions = {
  default: 'transition-colors duration-200',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
};

// ==================== LAYOUT ====================

export const layout = {
  maxWidth: 'max-w-3xl mx-auto',
  fullWidth: 'w-full',
  container: 'px-4',
  sticky: 'sticky top-0 z-10',
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get theme colors for a specific module
 */
export function getModuleColors(module: 'income' | 'expense' | 'budget' | 'history') {
  return colors[module];
}

/**
 * Get status badge classes
 */
export function getStatusClasses(status: 'pending' | 'paid' | 'skipped' | 'overdue') {
  return colors.status[status].badge;
}
