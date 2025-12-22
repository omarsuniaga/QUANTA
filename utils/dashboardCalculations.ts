import { Account, DashboardStats, Transaction } from '../types';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';

/**
 * Dashboard Calculations - Single Source of Truth
 * 
 * This module centralizes all dashboard-related calculations to ensure consistency
 * across components and prevent duplication of logic.
 */

/**
 * Calcula el dinero disponible en cuentas (cash real)
 * SSOT para "Disponible hoy"
 */
export const calculateAvailableCash = (accounts: Account[]): number => {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
};

/**
 * Calcula el presupuesto restante o excedente del mes
 * Retorna objeto con tipo y monto
 */
export interface BudgetStatus {
  type: 'restante' | 'excedente' | 'neutral';
  amount: number;
}

export const calculateBudgetStatus = (
  budgetTotal: number,
  spentAmount: number
): BudgetStatus => {
  const difference = budgetTotal - spentAmount;
  
  if (difference > 0) {
    return {
      type: 'restante',
      amount: difference
    };
  } else if (difference < 0) {
    return {
      type: 'excedente',
      amount: Math.abs(difference)
    };
  } else {
    return {
      type: 'neutral',
      amount: 0
    };
  }
};

/**
 * Calcula el superávit del mes (disponible para metas)
 * Superávit = Ingresos del mes - Presupuesto total
 * Si es negativo, retorna 0
 */
export const calculateMonthlySurplus = (
  monthlyIncome: number,
  budgetTotal: number
): number => {
  const surplus = monthlyIncome - budgetTotal;
  return Math.max(0, surplus);
};

/**
 * Información de proyección fin de mes
 */
export interface EndOfMonthProjection {
  projected: number;
  currentBalance: number;
  pendingRecurring: number;
  breakdown: {
    label: string;
    amount: number;
    type: 'base' | 'pending' | 'result';
  }[];
}

/**
 * Calcula la proyección de fin de mes con breakdown detallado
 * Proyección = Balance del mes - recurrentes pendientes
 */
export const calculateEndOfMonthProjection = (
  monthlyBalance: number,
  pendingRecurringAmount: number
): EndOfMonthProjection => {
  const projected = monthlyBalance - pendingRecurringAmount;
  
  return {
    projected,
    currentBalance: monthlyBalance,
    pendingRecurring: pendingRecurringAmount,
    breakdown: [
      {
        label: 'Balance del mes',
        amount: monthlyBalance,
        type: 'base'
      },
      {
        label: 'Recurrentes pendientes',
        amount: pendingRecurringAmount,
        type: 'pending'
      },
      {
        label: 'Proyección fin de mes',
        amount: projected,
        type: 'result'
      }
    ]
  };
};

/**
 * Información completa del Dashboard
 */
export interface DashboardInfo {
  // Cash (cuentas)
  availableCash: number;
  
  // Flujo del mes
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  
  // Presupuesto
  budgetTotal: number;
  budgetStatus: BudgetStatus;
  
  // Superávit
  monthlySurplus: number;
  hasSurplus: boolean;
  
  // Proyección
  endOfMonthProjection: EndOfMonthProjection;
}

/**
 * Calcula toda la información del Dashboard en un solo lugar
 * SSOT principal para el Dashboard
 */
export const calculateDashboardInfo = (
  stats: DashboardStats,
  budgetPeriodData: BudgetPeriodData,
  accounts: Account[],
  pendingRecurringAmount: number
): DashboardInfo => {
  // Cash en cuentas
  const availableCash = calculateAvailableCash(accounts);
  
  // Flujo del mes (usar budgetPeriodData que ya filtra por mes actual)
  const monthlyIncome = budgetPeriodData.incomeTotal;
  const monthlyExpenses = budgetPeriodData.totalSpent;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  
  // Presupuesto
  const budgetTotal = budgetPeriodData.budgetTotal;
  const budgetStatus = calculateBudgetStatus(budgetTotal, monthlyExpenses);
  
  // Superávit del mes
  const monthlySurplus = calculateMonthlySurplus(monthlyIncome, budgetTotal);
  const hasSurplus = monthlySurplus > 0;
  
  // Proyección fin de mes
  const endOfMonthProjection = calculateEndOfMonthProjection(
    monthlyBalance,
    pendingRecurringAmount
  );
  
  return {
    availableCash,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    budgetTotal,
    budgetStatus,
    monthlySurplus,
    hasSurplus,
    endOfMonthProjection
  };
};
