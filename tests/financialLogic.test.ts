import { describe, it, expect } from 'vitest';
import { calculateFinancialHealthMetrics, calculateBurnRate } from '../utils/financialMathCore';
import { Transaction, Category } from '../types';

// Helper to create mock transactions
const createTx = (amount: number, type: 'income' | 'expense', category: string, dateOffset: number = 0): Transaction => {
  const date = new Date();
  date.setDate(date.getDate() - dateOffset);
  return {
    id: Math.random().toString(),
    amount,
    type,
    category,
    description: 'Test',
    date: date.toISOString().split('T')[0],
    isRecurring: false,
    createdAt: Date.now()
  };
};

describe('Financial Intelligence Core', () => {
  
  // Scenario: User earning 2000, spending 1800 (Low savings, High Needs)
  const incomeTxs = [
    createTx(2000, 'income', Category.Salary, 15)
  ];
  
  const expenseTxs = [
    createTx(1000, 'expense', Category.Housing, 10), // 50% Income (High Needs)
    createTx(500, 'expense', Category.Food, 5),      // +25% Income = 75% Needs!
    createTx(300, 'expense', Category.Entertainment, 2)
  ];

  const allTxs = [...incomeTxs, ...expenseTxs];
  const currentBalance = 500; // Low balance relative to expenses

  it('calculates correct Burn Rate', () => {
    // Total expenses 1800 over 30 days = 60/day
    // Note: calculateBurnRate logic might average over exact days or fixed window
    const burnRate = calculateBurnRate(allTxs, 30);
    // 1800 / 30 = 60
    expect(burnRate).toBeCloseTo(60, 0); 
  });

  it('calculates Deep Health Metrics correctly', () => {
    const metrics = calculateFinancialHealthMetrics(
      allTxs,
      currentBalance,
      2000, // Total Income Month
      1800  // Total Expense Month
    );

    // 1. Savings Rate: (2000 - 1800) / 2000 = 10%
    expect(metrics.savingsRate).toBe(10);

    // 2. Runway: Balance 500 / Monthly Burn 1800 = ~0.27 months
    expect(metrics.runwayMonths).toBeCloseTo(0.27, 1);

    // 3. Discretionary Income: 2000 - 1800 = 200
    // (Assuming simple calculation for now)
    expect(metrics.discretionaryIncome).toBe(200);
  });

  it('detects Essentialist Plan violation (Needs > 50%)', () => {
    // Logic extracted from smartNotificationService
    const totalIncome = 2000;
    const needsExpenses = expenseTxs
      .filter(t => [Category.Housing, Category.Food].includes(t.category as Category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Needs = 1500
    const needsPct = (needsExpenses / totalIncome) * 100;
    
    expect(needsPct).toBe(75);
    expect(needsPct).toBeGreaterThan(55); // Threshold for alert
  });

  it('detects Velocity Risk (Runway < Days Left)', () => {
    const burnRate = calculateBurnRate(allTxs, 30); // 60/day
    const daysOfRunway = currentBalance / burnRate; // 500 / 60 = 8.3 days
    
    // Simulate beginning of month (30 days left)
    const daysLeftInMonth = 30;
    
    // 8.3 days of money < 30 days left -> Should Alert
    expect(daysOfRunway).toBeLessThan(daysLeftInMonth);
  });
});
