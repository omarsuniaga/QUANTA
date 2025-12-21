import { BudgetPeriodData } from '../hooks/useBudgetPeriod';

export type FinancialHealthStatus = 
  | 'critical_deficit'
  | 'deficit'
  | 'balanced'
  | 'healthy_surplus'
  | 'strong_surplus'
  | 'no_budget';

export interface FinancialHealthInfo {
  status: FinancialHealthStatus;
  coverageRatio: number;
}

const BALANCED_EPSILON = 500;

export const getCoverageRatio = (budgetPeriodData: BudgetPeriodData): number => {
  const { budgetTotal, incomeTotal } = budgetPeriodData;
  
  if (budgetTotal === 0) {
    return 0;
  }
  
  return incomeTotal / budgetTotal;
};

export const getFinancialStatus = (budgetPeriodData: BudgetPeriodData): FinancialHealthStatus => {
  const { budgetTotal, incomeTotal } = budgetPeriodData;
  
  if (budgetTotal === 0) {
    return 'no_budget';
  }
  
  const delta = incomeTotal - budgetTotal;
  const ratio = getCoverageRatio(budgetPeriodData);
  
  if (ratio < 0.8) return 'critical_deficit';
  if (ratio < 0.99) return 'deficit';
  if (Math.abs(delta) <= BALANCED_EPSILON) return 'balanced';
  if (ratio <= 1.2) return 'healthy_surplus';
  
  return 'strong_surplus';
};

export const getFinancialHealth = (budgetPeriodData: BudgetPeriodData): FinancialHealthInfo => {
  return {
    status: getFinancialStatus(budgetPeriodData),
    coverageRatio: getCoverageRatio(budgetPeriodData)
  };
};

export const getStatusColor = (status: FinancialHealthStatus): {
  border: string;
  bg: string;
  text: string;
  icon: string;
} => {
  switch (status) {
    case 'critical_deficit':
      return {
        border: 'border-red-500 dark:border-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        icon: 'text-red-500'
      };
    case 'deficit':
      return {
        border: 'border-orange-500 dark:border-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-300',
        icon: 'text-orange-500'
      };
    case 'balanced':
      return {
        border: 'border-amber-500 dark:border-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        icon: 'text-amber-500'
      };
    case 'healthy_surplus':
      return {
        border: 'border-emerald-500 dark:border-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: 'text-emerald-500'
      };
    case 'strong_surplus':
      return {
        border: 'border-green-600 dark:border-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600'
      };
    case 'no_budget':
      return {
        border: 'border-slate-300 dark:border-slate-600',
        bg: 'bg-slate-50 dark:bg-slate-700/50',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-500'
      };
  }
};
