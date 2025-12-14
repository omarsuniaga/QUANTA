import { Budget, BudgetAlert, Transaction } from '../types';

/**
 * Budget Service
 * Maneja la lógica de presupuestos, comparación con gastos y generación de alertas
 */

// Keywords mapping for intelligent matching between transactions and budgets
const BUDGET_CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Food & Groceries
  'mercado': ['supermercado', 'mercado', 'grocery', 'groceries', 'víveres', 'compras', 'alimentos'],
  'supermercado': ['supermercado', 'super', 'grocery', 'mercado', 'jumbo', 'la sirena', 'bravo', 'nacional', 'ole', 'carrefour', 'walmart'],
  'comida': ['comida', 'food', 'restaurante', 'restaurant', 'almuerzo', 'lunch', 'cena', 'dinner', 'desayuno', 'breakfast', 'delivery'],
  'restaurantes': ['restaurante', 'restaurant', 'pizza', 'burger', 'sushi', 'comida rápida', 'fast food'],
  
  // Transportation
  'combustible': ['gasolina', 'gas', 'fuel', 'combustible', 'diesel', 'shell', 'texaco', 'propagas', 'sunix'],
  'transporte': ['uber', 'indriver', 'taxi', 'pasaje', 'metro', 'teleférico', 'omsa', 'transporte'],
  'vehiculo': ['carro', 'auto', 'vehicle', 'mantenimiento', 'aceite', 'llanta', 'frenos', 'taller'],
  
  // Home & Utilities
  'servicios': ['luz', 'agua', 'internet', 'cable', 'teléfono', 'gas', 'electricidad', 'edenorte', 'edesur', 'edeeste', 'claro', 'altice'],
  'internet': ['internet', 'wifi', 'fibra', 'claro', 'altice', 'wind'],
  'electricidad': ['luz', 'electricidad', 'edenorte', 'edesur', 'edeeste', 'electric'],
  'agua': ['agua', 'inapa', 'caasd', 'water'],
  'alquiler': ['alquiler', 'renta', 'rent', 'arrendamiento', 'mensualidad'],
  
  // Entertainment
  'entretenimiento': ['netflix', 'spotify', 'amazon', 'hbo', 'disney', 'prime', 'cine', 'teatro', 'concierto'],
  
  // Health
  'salud': ['farmacia', 'medicina', 'doctor', 'médico', 'hospital', 'clínica', 'consulta', 'laboratorio'],
  
  // Education
  'educacion': ['colegio', 'escuela', 'universidad', 'curso', 'libro', 'educación', 'matrícula'],
  
  // Personal
  'ropa': ['ropa', 'zapatos', 'vestido', 'camisa', 'pantalón', 'zara', 'h&m'],
  'personal': ['peluquería', 'barbería', 'spa', 'gym', 'gimnasio', 'cuidado personal'],
};

export interface BudgetSuggestion {
  budgetId: string;
  budgetName: string;
  type: 'reduce' | 'increase' | 'create' | 'savings';
  message: string;
  currentAmount?: number;
  suggestedAmount?: number;
  averageSpent?: number;
  action?: () => void;
}

export class BudgetService {
  /**
   * Calcula el gasto total para una categoría específica en el período actual
   */
  static calculateSpentForCategory(
    category: string,
    transactions: Transaction[],
    period: 'monthly' | 'yearly' = 'monthly'
  ): number {
    const now = new Date();
    const startDate = new Date();

    if (period === 'monthly') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return transactions
      .filter(t => {
        const transDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          transDate >= startDate &&
          transDate <= now
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Actualiza el campo 'spent' de todos los presupuestos basándose en las transacciones
   */
  static updateBudgetsWithSpending(
    budgets: Budget[],
    transactions: Transaction[]
  ): Budget[] {
    return budgets.map(budget => ({
      ...budget,
      spent: this.calculateSpentForCategory(budget.category, transactions, budget.period)
    }));
  }

  /**
   * Compara un gasto con el presupuesto de su categoría y genera alertas
   */
  static checkBudgetAfterExpense(
    expense: Transaction,
    budget: Budget | undefined,
    allTransactions: Transaction[]
  ): BudgetAlert | null {
    if (!budget || !budget.isActive) return null;

    const totalSpent = this.calculateSpentForCategory(
      expense.category,
      allTransactions,
      budget.period
    );

    const difference = budget.limit - totalSpent;
    const percentage = (totalSpent / budget.limit) * 100;

    // Caso 1: Ahorro (gastó menos del presupuesto y es fin de período)
    if (difference > 0 && this.isEndOfPeriod(budget.period)) {
      return {
        id: `alert-${Date.now()}`,
        budgetId: budget.id,
        type: 'saving',
        amount: difference,
        percentage,
        message: `¡Ahorraste ${this.formatCurrency(difference)} en ${budget.name}!`,
        timestamp: Date.now(),
        isRead: false
      };
    }

    // Caso 2: Sobregasto (gastó más del presupuesto)
    if (difference < 0) {
      const overspent = Math.abs(difference);
      return {
        id: `alert-${Date.now()}`,
        budgetId: budget.id,
        type: 'overspending',
        amount: difference,
        percentage,
        message: `Gastaste ${this.formatCurrency(overspent)} extra en ${budget.name}`,
        timestamp: Date.now(),
        isRead: false
      };
    }

    // Caso 3: Advertencia (llegó al 80% del presupuesto)
    if (percentage >= 80 && percentage < 100) {
      return {
        id: `alert-${Date.now()}`,
        budgetId: budget.id,
        type: 'warning',
        amount: difference,
        percentage,
        message: `Has usado el ${percentage.toFixed(0)}% de tu presupuesto en ${budget.name}`,
        timestamp: Date.now(),
        isRead: false
      };
    }

    return null;
  }

  /**
   * Genera un reporte de ahorro/sobregasto para todas las categorías
   */
  static generateBudgetReport(
    budgets: Budget[],
    transactions: Transaction[]
  ): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const updatedBudgets = this.updateBudgetsWithSpending(budgets, transactions);

    updatedBudgets.forEach(budget => {
      if (!budget.isActive) return;

      const spent = budget.spent || 0;
      const difference = budget.limit - spent;
      const percentage = (spent / budget.limit) * 100;

      // Ahorro
      if (difference > 0 && spent > 0) {
        alerts.push({
          id: `report-saving-${budget.id}`,
          budgetId: budget.id,
          type: 'saving',
          amount: difference,
          percentage,
          message: `Ahorro de ${this.formatCurrency(difference)} en ${budget.name}`,
          timestamp: Date.now(),
          isRead: false
        });
      }

      // Sobregasto
      if (difference < 0) {
        alerts.push({
          id: `report-over-${budget.id}`,
          budgetId: budget.id,
          type: 'overspending',
          amount: difference,
          percentage,
          message: `Sobregasto de ${this.formatCurrency(Math.abs(difference))} en ${budget.name}`,
          timestamp: Date.now(),
          isRead: false
        });
      }

      // Advertencia
      if (percentage >= 80 && percentage < 100 && difference > 0) {
        alerts.push({
          id: `report-warn-${budget.id}`,
          budgetId: budget.id,
          type: 'warning',
          amount: difference,
          percentage,
          message: `${percentage.toFixed(0)}% del presupuesto usado en ${budget.name}`,
          timestamp: Date.now(),
          isRead: false
        });
      }
    });

    return alerts;
  }

  /**
   * Obtiene el presupuesto de una categoría específica
   */
  static getBudgetForCategory(budgets: Budget[], category: string): Budget | undefined {
    return budgets.find(b => b.category === category && b.isActive);
  }

  /**
   * Calcula el porcentaje de uso de un presupuesto
   */
  static getUsagePercentage(spent: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  }

  /**
   * Obtiene el color de la barra de progreso según el porcentaje
   */
  static getProgressColor(percentage: number): 'emerald' | 'amber' | 'rose' {
    if (percentage < 70) return 'emerald';
    if (percentage < 90) return 'amber';
    return 'rose';
  }

  /**
   * Verifica si es fin de período (para determinar si mostrar ahorro)
   */
  private static isEndOfPeriod(period: 'monthly' | 'yearly'): boolean {
    const now = new Date();

    if (period === 'monthly') {
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return now.getDate() === lastDayOfMonth;
    }

    // Para yearly, verificar si es fin de año
    return now.getMonth() === 11 && now.getDate() === 31;
  }

  /**
   * Formatea moneda (helper)
   */
  private static formatCurrency(amount: number): string {
    return `$ ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Resetea el gasto de presupuestos según su período
   */
  static shouldResetBudget(budget: Budget): boolean {
    const now = new Date();
    const resetDay = budget.resetDay || 1;

    if (budget.period === 'monthly') {
      return now.getDate() === resetDay;
    }

    // Para yearly, resetear el primer día del año
    return now.getMonth() === 0 && now.getDate() === resetDay;
  }

  /**
   * Obtiene presupuestos que necesitan ser reseteados
   */
  static getBudgetsToReset(budgets: Budget[]): Budget[] {
    return budgets.filter(budget => this.shouldResetBudget(budget));
  }

  /**
   * Finds the best matching budget for a transaction based on category and description
   * Caso #1 y #2: Match inteligente entre gastos y presupuestos
   */
  static findMatchingBudget(
    transaction: Transaction,
    budgets: Budget[]
  ): Budget | null {
    if (transaction.type !== 'expense') return null;

    const activeBudgets = budgets.filter(b => b.isActive);
    if (activeBudgets.length === 0) return null;

    // First, try exact category match
    const exactMatch = activeBudgets.find(
      b => b.category.toLowerCase() === transaction.category.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Second, try keyword matching based on description
    const description = (transaction.description || '').toLowerCase();
    const category = transaction.category.toLowerCase();
    
    for (const budget of activeBudgets) {
      const budgetName = budget.name.toLowerCase();
      const budgetCategory = budget.category.toLowerCase();
      
      // Check if budget keywords match transaction
      const keywords = BUDGET_CATEGORY_KEYWORDS[budgetName] || 
                       BUDGET_CATEGORY_KEYWORDS[budgetCategory] || [];
      
      for (const keyword of keywords) {
        if (description.includes(keyword) || category.includes(keyword)) {
          return budget;
        }
      }
      
      // Also check if description directly mentions budget name
      if (description.includes(budgetName) || description.includes(budgetCategory)) {
        return budget;
      }
    }

    // Third, try fuzzy category matching
    for (const budget of activeBudgets) {
      // Check if categories are related
      if (this.areCategoriesRelated(transaction.category, budget.category)) {
        return budget;
      }
    }

    return null;
  }

  /**
   * Checks if two categories are semantically related
   */
  private static areCategoriesRelated(transactionCategory: string, budgetCategory: string): boolean {
    const cat1 = transactionCategory.toLowerCase();
    const cat2 = budgetCategory.toLowerCase();
    
    // Check all keyword groups
    for (const [key, keywords] of Object.entries(BUDGET_CATEGORY_KEYWORDS)) {
      const allRelated = [key, ...keywords];
      const cat1Related = allRelated.some(k => cat1.includes(k) || k.includes(cat1));
      const cat2Related = allRelated.some(k => cat2.includes(k) || k.includes(cat2));
      
      if (cat1Related && cat2Related) return true;
    }
    
    return false;
  }

  /**
   * Generates smart budget suggestions based on spending patterns
   * Caso #3: Sugerencias inteligentes de ajuste de presupuesto
   * @param categoryNames - Map of category ID to display name for proper localization
   */
  static generateBudgetSuggestions(
    budgets: Budget[],
    transactions: Transaction[],
    categoryNames?: Map<string, string>
  ): BudgetSuggestion[] {
    // Helper to get category display name
    const getCategoryDisplayName = (categoryId: string): string => {
      if (categoryNames?.has(categoryId)) {
        return categoryNames.get(categoryId)!;
      }
      // Fallback: capitalize and clean the ID if it looks like a readable name
      if (categoryId.length < 20 && !categoryId.match(/[A-Z0-9]{10,}/)) {
        return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
      }
      return categoryId; // Return as-is if we can't translate
    };
    const suggestions: BudgetSuggestion[] = [];
    const now = new Date();
    
    // Get last 3 months of transactions for pattern analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date >= threeMonthsAgo;
    });

    for (const budget of budgets.filter(b => b.isActive)) {
      // Get monthly spending for this budget's category
      const monthlySpending = this.getMonthlySpendingHistory(
        budget.category,
        recentTransactions,
        3
      );

      if (monthlySpending.length < 2) continue; // Need at least 2 months of data

      const averageSpent = monthlySpending.reduce((a, b) => a + b, 0) / monthlySpending.length;
      const currentSpent = budget.spent || 0;
      const difference = budget.limit - averageSpent;
      
      // If consistently spending less than budgeted (savings opportunity)
      if (difference > budget.limit * 0.15 && averageSpent > 0) {
        const suggestedAmount = Math.ceil(averageSpent * 1.1 / 100) * 100; // Round up to nearest 100
        suggestions.push({
          budgetId: budget.id,
          budgetName: budget.name,
          type: 'reduce',
          message: `Tu gasto promedio en "${budget.name}" es ${this.formatCurrency(averageSpent)}. Podrías reducir el presupuesto de ${this.formatCurrency(budget.limit)} a ${this.formatCurrency(suggestedAmount)} y destinar la diferencia a metas o ahorros.`,
          currentAmount: budget.limit,
          suggestedAmount,
          averageSpent,
        });
      }
      
      // If consistently exceeding budget
      if (averageSpent > budget.limit * 0.95) {
        const suggestedAmount = Math.ceil(averageSpent * 1.1 / 100) * 100;
        suggestions.push({
          budgetId: budget.id,
          budgetName: budget.name,
          type: 'increase',
          message: `Regularmente gastas más de lo presupuestado en "${budget.name}". Considera aumentar de ${this.formatCurrency(budget.limit)} a ${this.formatCurrency(suggestedAmount)} para un presupuesto más realista.`,
          currentAmount: budget.limit,
          suggestedAmount,
          averageSpent,
        });
      }

      // If there are savings available this period
      if (currentSpent > 0 && currentSpent < budget.limit * 0.85) {
        const savings = budget.limit - currentSpent;
        suggestions.push({
          budgetId: budget.id,
          budgetName: budget.name,
          type: 'savings',
          message: `Tienes ${this.formatCurrency(savings)} disponibles en "${budget.name}". ¿Deseas transferirlos a tus metas de ahorro?`,
          currentAmount: savings,
        });
      }
    }

    // Check for categories with spending but no budget
    const categoriesWithSpending = new Map<string, number>();
    recentTransactions.forEach(t => {
      const current = categoriesWithSpending.get(t.category) || 0;
      categoriesWithSpending.set(t.category, current + t.amount);
    });

    for (const [category, totalSpent] of categoriesWithSpending) {
      const hasBudget = budgets.some(b => 
        b.isActive && 
        (b.category.toLowerCase() === category.toLowerCase() ||
         this.areCategoriesRelated(category, b.category))
      );
      
      if (!hasBudget && totalSpent > 1000) { // Only suggest for significant spending
        const monthlyAverage = totalSpent / 3;
        const displayName = getCategoryDisplayName(category);
        suggestions.push({
          budgetId: '',
          budgetName: displayName,
          type: 'create',
          message: `Gastas en promedio ${this.formatCurrency(monthlyAverage)}/mes en "${displayName}" pero no tienes un presupuesto. ¿Te gustaría crear uno?`,
          suggestedAmount: Math.ceil(monthlyAverage * 1.1 / 100) * 100,
          averageSpent: monthlyAverage,
        });
      }
    }

    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  /**
   * Gets monthly spending history for a category
   */
  private static getMonthlySpendingHistory(
    category: string,
    transactions: Transaction[],
    months: number
  ): number[] {
    const monthlyTotals: number[] = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTotal = transactions
        .filter(t => {
          const date = new Date(t.date);
          return (
            t.category.toLowerCase() === category.toLowerCase() &&
            date >= monthStart &&
            date <= monthEnd
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyTotals.push(monthTotal);
    }
    
    return monthlyTotals.filter(t => t > 0); // Only include months with spending
  }

  /**
   * Debit amount from matching budget when expense is added
   */
  static processExpenseForBudget(
    expense: Transaction,
    budgets: Budget[]
  ): { matchedBudget: Budget | null; alert: BudgetAlert | null } {
    const matchedBudget = this.findMatchingBudget(expense, budgets);
    
    if (!matchedBudget) {
      return { matchedBudget: null, alert: null };
    }

    // The spending will be calculated by updateBudgetsWithSpending,
    // but we can generate an alert if needed
    const alert = this.checkBudgetAfterExpense(
      expense,
      matchedBudget,
      [expense] // Current expense
    );

    return { matchedBudget, alert };
  }
}
