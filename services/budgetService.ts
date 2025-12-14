import { Budget, BudgetAlert, Transaction } from '../types';

/**
 * Budget Service
 * Maneja la lógica de presupuestos, comparación con gastos y generación de alertas
 */

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
    return `$${amount.toLocaleString(undefined, {
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
}
