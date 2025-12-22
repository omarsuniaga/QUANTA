import { describe, it, expect } from 'vitest';
import {
  calculateAvailableCash,
  calculateBudgetStatus,
  calculateMonthlySurplus,
  calculateEndOfMonthProjection,
  calculateDashboardInfo
} from './dashboardCalculations';
import { Account, DashboardStats } from '../types';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';

describe('dashboardCalculations', () => {
  describe('calculateAvailableCash', () => {
    it('should calculate total cash from accounts', () => {
      const accounts: Account[] = [
        { id: '1', name: 'Checking', type: 'bank', balance: 5000, currency: 'USD' },
        { id: '2', name: 'Savings', type: 'bank', balance: 10000, currency: 'USD' },
        { id: '3', name: 'Cash', type: 'cash', balance: 500, currency: 'USD' }
      ];

      const result = calculateAvailableCash(accounts);
      expect(result).toBe(15500);
    });

    it('should return 0 for empty accounts array', () => {
      const result = calculateAvailableCash([]);
      expect(result).toBe(0);
    });

    it('should handle negative balances', () => {
      const accounts: Account[] = [
        { id: '1', name: 'Checking', type: 'bank', balance: 5000, currency: 'USD' },
        { id: '2', name: 'Credit Card', type: 'card', balance: -1000, currency: 'USD' }
      ];

      const result = calculateAvailableCash(accounts);
      expect(result).toBe(4000);
    });
  });

  describe('calculateBudgetStatus', () => {
    it('should return "restante" when under budget', () => {
      const result = calculateBudgetStatus(10000, 7000);
      
      expect(result.type).toBe('restante');
      expect(result.amount).toBe(3000);
    });

    it('should return "excedente" when over budget', () => {
      const result = calculateBudgetStatus(10000, 12000);
      
      expect(result.type).toBe('excedente');
      expect(result.amount).toBe(2000);
    });

    it('should return "neutral" when exactly on budget', () => {
      const result = calculateBudgetStatus(10000, 10000);
      
      expect(result.type).toBe('neutral');
      expect(result.amount).toBe(0);
    });

    it('should handle zero budget', () => {
      const result = calculateBudgetStatus(0, 5000);
      
      expect(result.type).toBe('excedente');
      expect(result.amount).toBe(5000);
    });

    it('should handle zero expenses', () => {
      const result = calculateBudgetStatus(10000, 0);
      
      expect(result.type).toBe('restante');
      expect(result.amount).toBe(10000);
    });
  });

  describe('calculateMonthlySurplus', () => {
    it('should calculate surplus when income exceeds budget', () => {
      const result = calculateMonthlySurplus(50000, 30000);
      expect(result).toBe(20000);
    });

    it('should return 0 when income equals budget', () => {
      const result = calculateMonthlySurplus(30000, 30000);
      expect(result).toBe(0);
    });

    it('should return 0 when income is less than budget (no negative surplus)', () => {
      const result = calculateMonthlySurplus(25000, 30000);
      expect(result).toBe(0);
    });

    it('should handle zero income', () => {
      const result = calculateMonthlySurplus(0, 30000);
      expect(result).toBe(0);
    });

    it('should handle zero budget', () => {
      const result = calculateMonthlySurplus(50000, 0);
      expect(result).toBe(50000);
    });
  });

  describe('calculateEndOfMonthProjection', () => {
    it('should calculate projection with pending recurring expenses', () => {
      const result = calculateEndOfMonthProjection(15000, 3000);
      
      expect(result.projected).toBe(12000);
      expect(result.currentBalance).toBe(15000);
      expect(result.pendingRecurring).toBe(3000);
      expect(result.breakdown).toHaveLength(3);
    });

    it('should create correct breakdown structure', () => {
      const result = calculateEndOfMonthProjection(20000, 5000);
      
      expect(result.breakdown[0]).toEqual({
        label: 'Balance del mes',
        amount: 20000,
        type: 'base'
      });
      expect(result.breakdown[1]).toEqual({
        label: 'Recurrentes pendientes',
        amount: 5000,
        type: 'pending'
      });
      expect(result.breakdown[2]).toEqual({
        label: 'Proyección fin de mes',
        amount: 15000,
        type: 'result'
      });
    });

    it('should handle negative projection', () => {
      const result = calculateEndOfMonthProjection(5000, 8000);
      
      expect(result.projected).toBe(-3000);
      expect(result.breakdown[2].amount).toBe(-3000);
    });

    it('should handle zero pending recurring', () => {
      const result = calculateEndOfMonthProjection(10000, 0);
      
      expect(result.projected).toBe(10000);
      expect(result.pendingRecurring).toBe(0);
    });
  });

  describe('calculateDashboardInfo', () => {
    const mockStats: DashboardStats = {
      totalIncome: 60000,
      totalExpense: 45000,
      balance: 15000,
      realBalance: 20000,
      availableBalance: 18000,
      committedSavings: 2000
    };

    const mockBudgetPeriodData: BudgetPeriodData = {
      period: '2024-12',
      budgetTotal: 40000,
      budgetItemsCount: 5,
      spentBudgeted: 25000,
      spentUnbudgeted: 5000,
      totalSpent: 30000,
      remaining: 15000,
      remainingPercentage: 62.5,
      incomeTotal: 50000,
      incomeSurplus: 10000,
      hasIncomeBudgetGap: false,
      budgetedExpenses: [],
      unbudgetedExpenses: []
    };

    const mockAccounts: Account[] = [
      { id: '1', name: 'Bank', type: 'bank', balance: 20000, currency: 'USD' }
    ];

    it('should calculate complete dashboard info', () => {
      const result = calculateDashboardInfo(mockStats, mockBudgetPeriodData, mockAccounts, 5000);
      
      expect(result.availableCash).toBe(20000);
      expect(result.monthlyIncome).toBe(50000);
      expect(result.monthlyExpenses).toBe(30000);
      expect(result.monthlyBalance).toBe(20000);
      expect(result.budgetTotal).toBe(40000);
      expect(result.monthlySurplus).toBe(10000);
      expect(result.hasSurplus).toBe(true);
    });

    it('should calculate budget status as restante', () => {
      const result = calculateDashboardInfo(mockStats, mockBudgetPeriodData, mockAccounts, 5000);
      
      expect(result.budgetStatus.type).toBe('restante');
      expect(result.budgetStatus.amount).toBe(10000); // 40000 budget - 30000 spent
    });

    it('should calculate budget status as excedente when overspending', () => {
      const overspentBudget: BudgetPeriodData = {
        ...mockBudgetPeriodData,
        budgetTotal: 25000,
        totalSpent: 30000
      };
      
      const result = calculateDashboardInfo(mockStats, overspentBudget, mockAccounts, 5000);
      
      expect(result.budgetStatus.type).toBe('excedente');
      expect(result.budgetStatus.amount).toBe(5000); // 30000 spent - 25000 budget
    });

    it('should set hasSurplus to false when no surplus', () => {
      const noSurplusBudget: BudgetPeriodData = {
        ...mockBudgetPeriodData,
        incomeTotal: 40000,
        budgetTotal: 45000
      };
      
      const result = calculateDashboardInfo(mockStats, noSurplusBudget, mockAccounts, 5000);
      
      expect(result.monthlySurplus).toBe(0);
      expect(result.hasSurplus).toBe(false);
    });

    it('should calculate end of month projection correctly', () => {
      const result = calculateDashboardInfo(mockStats, mockBudgetPeriodData, mockAccounts, 8000);
      
      expect(result.endOfMonthProjection.currentBalance).toBe(20000);
      expect(result.endOfMonthProjection.pendingRecurring).toBe(8000);
      expect(result.endOfMonthProjection.projected).toBe(12000);
    });

    it('should handle zero accounts', () => {
      const result = calculateDashboardInfo(mockStats, mockBudgetPeriodData, [], 5000);
      
      expect(result.availableCash).toBe(0);
    });

    it('should handle zero budget', () => {
      const zeroBudget: BudgetPeriodData = {
        ...mockBudgetPeriodData,
        budgetTotal: 0
      };
      
      const result = calculateDashboardInfo(mockStats, zeroBudget, mockAccounts, 5000);
      
      expect(result.budgetTotal).toBe(0);
      expect(result.monthlySurplus).toBe(50000); // All income is surplus
      expect(result.hasSurplus).toBe(true);
    });
  });

  describe('Integration: Real-world scenarios', () => {
    it('Scenario: User with healthy surplus', () => {
      const stats: DashboardStats = {
        totalIncome: 100000,
        totalExpense: 60000,
        balance: 40000,
        realBalance: 50000,
        availableBalance: 45000,
        committedSavings: 5000
      };

      const budgetPeriod: BudgetPeriodData = {
        period: '2024-12',
        budgetTotal: 50000,
        budgetItemsCount: 8,
        spentBudgeted: 35000,
        spentUnbudgeted: 5000,
        totalSpent: 40000,
        remaining: 15000,
        remainingPercentage: 70,
        incomeTotal: 70000,
        incomeSurplus: 20000,
        hasIncomeBudgetGap: false,
        budgetedExpenses: [],
        unbudgetedExpenses: []
      };

      const accounts: Account[] = [
        { id: '1', name: 'Checking', type: 'bank', balance: 30000, currency: 'DOP' },
        { id: '2', name: 'Savings', type: 'bank', balance: 20000, currency: 'DOP' }
      ];

      const result = calculateDashboardInfo(stats, budgetPeriod, accounts, 10000);

      // User should see:
      expect(result.availableCash).toBe(50000); // Cash in accounts
      expect(result.monthlyIncome).toBe(70000); // Income this month
      expect(result.monthlyExpenses).toBe(40000); // Expenses this month
      expect(result.budgetStatus.type).toBe('restante'); // Under budget
      expect(result.budgetStatus.amount).toBe(10000); // 50k budget - 40k spent
      expect(result.monthlySurplus).toBe(20000); // 70k income - 50k budget
      expect(result.hasSurplus).toBe(true);
      expect(result.endOfMonthProjection.projected).toBe(20000); // 30k balance - 10k pending
    });

    it('Scenario: User overspending with no surplus', () => {
      const stats: DashboardStats = {
        totalIncome: 50000,
        totalExpense: 60000,
        balance: -10000,
        realBalance: 5000,
        availableBalance: 5000,
        committedSavings: 0
      };

      const budgetPeriod: BudgetPeriodData = {
        period: '2024-12',
        budgetTotal: 45000,
        budgetItemsCount: 6,
        spentBudgeted: 40000,
        spentUnbudgeted: 8000,
        totalSpent: 48000,
        remaining: -3000,
        remainingPercentage: 106.7,
        incomeTotal: 45000,
        incomeSurplus: 0,
        hasIncomeBudgetGap: false,
        budgetedExpenses: [],
        unbudgetedExpenses: []
      };

      const accounts: Account[] = [
        { id: '1', name: 'Checking', type: 'bank', balance: 5000, currency: 'DOP' }
      ];

      const result = calculateDashboardInfo(stats, budgetPeriod, accounts, 5000);

      expect(result.budgetStatus.type).toBe('excedente'); // Over budget
      expect(result.budgetStatus.amount).toBe(3000); // 48k spent - 45k budget
      expect(result.monthlySurplus).toBe(0); // No surplus (income = budget)
      expect(result.hasSurplus).toBe(false);
      expect(result.endOfMonthProjection.projected).toBe(-13000); // Negative projection
    });
  });
});
