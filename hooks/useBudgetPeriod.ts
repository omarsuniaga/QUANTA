import { useMemo } from 'react';
import { Budget, Transaction } from '../types';
import { BudgetService } from '../services/budgetService';
import { parseLocalDate } from '../utils/dateHelpers';

/**
 * useBudgetPeriod - Single Source of Truth for Budget Calculations
 * 
 * This hook centralizes all budget-related calculations for a given period.
 * It ensures that both ExpensesScreen and BudgetsScreen show the same numbers.
 * 
 * Key Principle: Budgets define the total budget, Expenses only consume it.
 */

export interface BudgetPeriodData {
  // Period identifier
  period: string; // Format: "YYYY-MM" for monthly
  
  // Budget totals (from Budgets screen - SOURCE OF TRUTH)
  budgetTotal: number;           // Sum of all active budget limits for this period
  budgetItemsCount: number;      // Number of active budget items
  
  // Expense breakdown
  spentBudgeted: number;         // Expenses that match a budget category (within budget)
  spentUnbudgeted: number;       // Expenses without a matching budget (out of budget)
  expensesTotal: number;         // spentBudgeted + spentUnbudgeted
  
  // Calculated values
  remaining: number;             // budgetTotal - spentBudgeted
  remainingPercentage: number;   // (spentBudgeted / budgetTotal) * 100
  
  // Income validation
  incomeTotal: number;           // Total income for this period
  incomeSurplus: number;         // incomeTotal - budgetTotal (negative if budget > income)
  hasIncomeBudgetGap: boolean;   // true if budgetTotal > incomeTotal
  
  // Detailed expense items
  budgetedExpenses: Transaction[];    // Expenses linked to a budget
  unbudgetedExpenses: Transaction[];  // Expenses not linked to any budget
}

interface UseBudgetPeriodOptions {
  year?: number;
  month?: number; // 0-indexed (0 = January)
  period?: 'monthly' | 'yearly';
  externalIncomeTotal?: number; // Override for SSOT from IncomeService
}

/**
 * Hook to get all budget calculations for a specific period
 */
export const useBudgetPeriod = (
  budgets: Budget[],
  transactions: Transaction[],
  options: UseBudgetPeriodOptions = {}
): BudgetPeriodData => {
  const now = new Date();
  const year = options.year ?? now.getFullYear();
  const month = options.month ?? now.getMonth();
  const period = options.period ?? 'monthly';

  return useMemo(() => {
    // 1. Filter active budgets for the period
    const activeBudgets = budgets.filter(b => b.isActive && b.period === period);
    
    // 2. Calculate budget total (SOURCE OF TRUTH)
    const budgetTotal = activeBudgets.reduce((sum, b) => sum + b.limit, 0);
    const budgetItemsCount = activeBudgets.length;

    // 3. Filter transactions for this period
    const periodTransactions = transactions.filter(t => {
      const txDate = parseLocalDate(t.date);
      if (period === 'monthly') {
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      } else {
        return txDate.getFullYear() === year;
      }
    });

    // 4. Separate expenses into budgeted vs unbudgeted
    const expenses = periodTransactions.filter(t => t.type === 'expense');
    const budgetedExpenses: Transaction[] = [];
    const unbudgetedExpenses: Transaction[] = [];

    expenses.forEach(expense => {
      const matchedBudget = BudgetService.findMatchingBudget(expense, activeBudgets);
      if (matchedBudget) {
        budgetedExpenses.push(expense);
      } else {
        unbudgetedExpenses.push(expense);
      }
    });

    // 5. Calculate spent amounts
    const spentBudgeted = budgetedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const spentUnbudgeted = unbudgetedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = spentBudgeted + spentUnbudgeted;

    // 6. Calculate remaining and percentage
    const remaining = budgetTotal - spentBudgeted;
    const remainingPercentage = budgetTotal > 0 ? (spentBudgeted / budgetTotal) * 100 : 0;

    // 7. Calculate income for the period
    let incomeTotal: number;
    if (options.externalIncomeTotal !== undefined) {
      incomeTotal = options.externalIncomeTotal;
    } else {
      const incomes = periodTransactions.filter(t => t.type === 'income');
      incomeTotal = incomes.reduce((sum, t) => sum + t.amount, 0);
    }

    // 8. Income vs Budget validation
    const incomeSurplus = incomeTotal - budgetTotal;
    const hasIncomeBudgetGap = budgetTotal > incomeTotal;

    // 9. Generate period identifier
    const periodId = period === 'monthly' 
      ? `${year}-${String(month + 1).padStart(2, '0')}`
      : `${year}`;

    return {
      period: periodId,
      budgetTotal,
      budgetItemsCount,
      spentBudgeted,
      spentUnbudgeted,
      expensesTotal: totalSpent,
      remaining,
      remainingPercentage,
      incomeTotal,
      incomeSurplus,
      hasIncomeBudgetGap,
      budgetedExpenses,
      unbudgetedExpenses
    };
  }, [budgets, transactions, year, month, period]);
};

/**
 * Helper to get period label for display
 */
export const getPeriodLabel = (year: number, month: number, language: 'es' | 'en' = 'es'): string => {
  const date = new Date(year, month, 1);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long' 
  };
  return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
};
