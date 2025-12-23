import { Transaction, DashboardStats, FinancialHealthMetrics } from '../types';
import { parseLocalDate } from './dateHelpers';

/**
 * Financial Math Core
 * 
 * This module contains pure, deterministic mathematical functions for financial analysis.
 * It replaces AI "guesses" with hard math for projections, burn rates, and anomaly detection.
 */

// --- TYPES ---

export interface ProjectionResult {
  projectedBalance: number;
  burnRate: number; // Daily spending average
  daysRemaining: number;
  status: 'safe' | 'warning' | 'danger';
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number; // Z-Score
  type: 'high_expense' | 'unusual_frequency' | 'normal';
  threshold: number;
}

// --- CORE CALCULATIONS ---

/**
 * Calculates the "Burn Rate" (average daily expense) over a period.
 * Only considers 'expense' transactions.
 */
export const calculateBurnRate = (transactions: Transaction[], daysLookback: number = 30): number => {
  if (transactions.length === 0) return 0;

  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - daysLookback);

  const relevantExpenses = transactions.filter(t => 
    t.type === 'expense' && 
    parseLocalDate(t.date) >= cutoffDate
  );

  const totalSpent = relevantExpenses.reduce((sum, t) => sum + t.amount, 0);
  
  // Prevent division by zero if daysLookback is 0 (unlikely but safe)
  return totalSpent / (daysLookback || 1); 
};

/**
 * Projects the end-of-month balance based on current balance and daily burn rate.
 * Uses a linear projection: Projected = Current - (BurnRate * DaysRemaining)
 */
export const projectEndOfMonthBalance = (
  currentBalance: number, 
  burnRate: number
): ProjectionResult => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Get last day of current month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const daysRemaining = Math.max(0, lastDay - today);

  const projectedSpend = burnRate * daysRemaining;
  const projectedBalance = currentBalance - projectedSpend;

  let status: ProjectionResult['status'] = 'safe';
  if (projectedBalance < 0) status = 'danger';
  else if (projectedBalance < currentBalance * 0.1) status = 'warning'; // Less than 10% buffer

  return {
    projectedBalance,
    burnRate,
    daysRemaining,
    status
  };
};

/**
 * Detects if a specific transaction amount is an anomaly using the Z-Score method.
 * A Z-Score > 2 (or < -2) is typically considered an anomaly (2 standard deviations).
 * 
 * @param amount The transaction amount to check
 * @param history Historical transactions to establish the baseline
 * @param category Optional: Filter history by category for category-specific anomalies
 */
export const detectSpendingAnomaly = (
  amount: number, 
  history: Transaction[], 
  category?: string
): AnomalyResult => {
  // Filter history
  let relevantHistory = history.filter(t => t.type === 'expense');
  if (category) {
    relevantHistory = relevantHistory.filter(t => t.category === category);
  }

  if (relevantHistory.length < 5) {
    return { isAnomaly: false, score: 0, type: 'normal', threshold: 0 }; // Not enough data
  }

  // Calculate Mean
  const total = relevantHistory.reduce((sum, t) => sum + t.amount, 0);
  const mean = total / relevantHistory.length;

  // Calculate Standard Deviation
  const variance = relevantHistory.reduce((sum, t) => sum + Math.pow(t.amount - mean, 2), 0) / relevantHistory.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
     return { isAnomaly: amount > mean * 1.5, score: 0, type: amount > mean ? 'high_expense' : 'normal', threshold: mean };
  }

  // Calculate Z-Score
  const zScore = (amount - mean) / stdDev;

  const isHighAnomaly = zScore > 2.5; // Strict threshold for high expenses

  return {
    isAnomaly: isHighAnomaly,
    score: zScore,
    type: isHighAnomaly ? 'high_expense' : 'normal',
    threshold: mean + (stdDev * 2)
  };
};

/**
 * Calculates simple Linear Regression to predict future spending trend.
 * Returns the slope (m) and y-intercept (b) for y = mx + b
 * where x is days from start of period.
 */
export const calculateSpendingTrend = (transactions: Transaction[]): { slope: number, trend: 'increasing' | 'decreasing' | 'stable' } => {
  if (transactions.length < 2) return { slope: 0, trend: 'stable' };

  // Sort by date ascending
  const sorted = [...transactions]
    .filter(t => t.type === 'expense')
    .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  if (sorted.length === 0) return { slope: 0, trend: 'stable' };

  const startDate = parseLocalDate(sorted[0].date).getTime();
  
  // Prepare data points (x = days since start, y = daily spending amount)
  const points = sorted.map(t => {
    const daysDiff = (parseLocalDate(t.date).getTime() - startDate) / (1000 * 60 * 60 * 24);
    return { x: daysDiff, y: t.amount };
  });

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + (p.x * p.y), 0);
  const sumXX = points.reduce((s, p) => s + (p.x * p.x), 0);

  const denominator = (n * sumXX) - (sumX * sumX);
  if (denominator === 0) return { slope: 0, trend: 'stable' };

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (slope > 0.5) trend = 'increasing';
  if (slope < -0.5) trend = 'decreasing';

  return { slope, trend };
};

// --- ADVANCED METRICS (DEEP MATH) ---

/**
 * Calculates financial runway in months.
 * Formula: Total Liquid Assets / Monthly Burn Rate
 */
export const calculateRunway = (totalAssets: number, monthlyBurnRate: number): number => {
  if (monthlyBurnRate <= 0) return 999; // Infinite runway theoretically
  return totalAssets / monthlyBurnRate;
};

/**
 * Calculates Savings Rate.
 * Formula: (Income - Expense) / Income
 * Returns percentage (0-100)
 */
export const calculateSavingsRate = (totalIncome: number, totalExpense: number): number => {
  if (totalIncome <= 0) return 0;
  const savings = totalIncome - totalExpense;
  return (savings / totalIncome) * 100;
};

/**
 * Calculates Debt-to-Income Ratio (DTI).
 * Formula: Monthly Debt Payments / Gross Monthly Income
 * Returns percentage (0-100)
 */
export const calculateDTI = (monthlyDebtPayments: number, monthlyIncome: number): number => {
  if (monthlyIncome <= 0) return 0;
  return (monthlyDebtPayments / monthlyIncome) * 100;
};

/**
 * Aggregates all advanced metrics into a single health report.
 * This function serves as the single source of truth for the AI context.
 */
export const calculateFinancialHealthMetrics = (
  transactions: Transaction[],
  currentBalance: number,
  totalIncomeMonth: number,
  totalExpenseMonth: number
): FinancialHealthMetrics => {
  
  // 1. Calculate Burn Rate (Monthly average based on daily * 30)
  const dailyBurnRate = calculateBurnRate(transactions, 30);
  const monthlyBurnRate = dailyBurnRate * 30;

  // 2. Calculate Runway
  const runwayMonths = calculateRunway(currentBalance, monthlyBurnRate);

  // 3. Calculate Savings Rate (Current Month)
  const savingsRate = calculateSavingsRate(totalIncomeMonth, totalExpenseMonth);

  // 4. Calculate Discretionary Income
  // Approximation: Income - Expense (Refinement: Should categorize "Needs" vs "Wants" in future)
  const discretionaryIncome = Math.max(0, totalIncomeMonth - totalExpenseMonth);

  // 5. Calculate Debt Payment (Approximation based on 'Debt' or 'Loan' category)
  const debtPayments = transactions
    .filter(t => 
      t.type === 'expense' && 
      (t.category.toLowerCase().includes('debt') || 
       t.category.toLowerCase().includes('loan') || 
       t.category.toLowerCase().includes('credit card'))
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const debtToIncomeRatio = calculateDTI(debtPayments, totalIncomeMonth);

  return {
    burnRate: monthlyBurnRate,
    runwayMonths,
    debtToIncomeRatio,
    savingsRate,
    discretionaryIncome
  };
};

/**
 * Calculates the average daily income over a period.
 * Only considers 'income' transactions.
 */
export const calculateDailyIncome = (transactions: Transaction[], daysLookback: number = 30): number => {
  if (transactions.length === 0) return 0;

  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - daysLookback);

  const relevantIncome = transactions.filter(t => 
    t.type === 'income' && 
    parseLocalDate(t.date) >= cutoffDate
  );

  const totalIncome = relevantIncome.reduce((sum, t) => sum + t.amount, 0);
  
  // Prevent division by zero
  return totalIncome / (daysLookback || 1); 
};

/**
 * Calculates the compatibility score between two numeric distributions.
 * Used for comparing user spending against ideal strategies (e.g. 50/30/20).
 * Returns a score from 0 to 100.
 */
export const calculateDistributionCompatibility = (current: number[], target: number[]): number => {
  if (current.length === 0 || target.length === 0) return 0;
  
  const diffs = current.map((c, i) => Math.abs(c - (target[i] || 0)));
  // Normalize difference. Assuming percentages (0-100).
  const maxDiff = 100; 
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  
  return Math.max(0, Math.round(100 - (avgDiff / maxDiff) * 100));
};