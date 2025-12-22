import { describe, it, expect } from 'vitest';
import { Budget, Transaction } from '../types';
import { useBudgetPeriod, BudgetPeriodData } from './useBudgetPeriod';
import { BudgetService } from '../services/budgetService';
import { renderHook } from '@testing-library/react';
import {
  scenarioBudgetCategorization,
  scenarioKeywordMatching
} from '../tests/fixtures';

/**
 * Tests para useBudgetPeriod - Categorización de gastos
 * 
 * Objetivo: Validar que los gastos se categorizan correctamente como
 * budgeted (dentro de presupuesto) vs unbudgeted (fuera de presupuesto)
 * usando el matching inteligente de BudgetService.findMatchingBudget
 * 
 * Lógica a testear:
 * - Exact category match
 * - Keyword matching (Food/Comida, etc.)
 * - Cálculo de remaining y spent correcto
 */

describe('useBudgetPeriod - Budget categorization', () => {
  
  // ============================================
  // TEST 1: Categorización exacta (budgeted vs unbudgeted)
  // ============================================
  it('should categorize expenses as budgeted vs unbudgeted correctly', () => {
    // Dataset: 2 presupuestos activos
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Comida',
        category: 'Food',
        limit: 5000,
        spent: 0,
        period: 'monthly',
        isActive: true
      },
      {
        id: 'budget2',
        name: 'Transporte',
        category: 'Transport',
        limit: 2000,
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Transacciones del mes actual
    const transactions: Transaction[] = [
      // Gasto que SÍ tiene presupuesto (budgeted)
      {
        id: 'tx1',
        type: 'expense',
        amount: 1000,
        description: 'Supermercado',
        category: 'Food', // ← Match exacto con budget1
        date: new Date(year, month, 5).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Gasto que SÍ tiene presupuesto (budgeted)
      {
        id: 'tx2',
        type: 'expense',
        amount: 500,
        description: 'Uber',
        category: 'Transport', // ← Match exacto con budget2
        date: new Date(year, month, 10).toISOString(),
        paymentMethod: 'cash',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Gasto que NO tiene presupuesto (unbudgeted)
      {
        id: 'tx3',
        type: 'expense',
        amount: 800,
        description: 'Netflix',
        category: 'Entertainment', // ← Sin presupuesto matching
        date: new Date(year, month, 15).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Ingreso (no debe afectar budgets)
      {
        id: 'tx4',
        type: 'income',
        amount: 10000,
        description: 'Salario',
        category: 'Salary',
        date: new Date(year, month, 1).toISOString(),
        paymentMethod: 'transfer',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Validaciones esperadas:
    // budgetTotal = 5,000 + 2,000 = 7,000
    // spentBudgeted = 1,000 (Food) + 500 (Transport) = 1,500
    // spentUnbudgeted = 800 (Entertainment) = 800
    // totalSpent = 1,500 + 800 = 2,300
    // remaining = 7,000 - 1,500 = 5,500
    // incomeTotal = 10,000

    expect(data.budgetTotal).toBe(7000);
    expect(data.spentBudgeted).toBe(1500);
    expect(data.spentUnbudgeted).toBe(800);
    expect(data.totalSpent).toBe(2300);
    expect(data.remaining).toBe(5500);
    expect(data.incomeTotal).toBe(10000);
    expect(data.budgetedExpenses.length).toBe(2); // tx1, tx2
    expect(data.unbudgetedExpenses.length).toBe(1); // tx3
  });

  // ============================================
  // TEST 2: Keyword matching (Food/Comida alias)
  // ============================================
  it('should match expenses using keyword aliases (Food vs Comida)', () => {
    // Presupuesto con categoría "Comida" (español)
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'comida', // ← keyword que matchea con 'food', 'restaurante', etc.
        category: 'Comida',
        limit: 3000,
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const transactions: Transaction[] = [
      // Gasto con descripción que contiene keyword 'restaurant'
      {
        id: 'tx1',
        type: 'expense',
        amount: 500,
        description: 'Restaurant dinner', // ← Debería matchear via keywords
        category: 'Dining',
        date: new Date(year, month, 5).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Gasto con categoría 'Food' (inglés)
      {
        id: 'tx2',
        type: 'expense',
        amount: 300,
        description: 'Pizza delivery',
        category: 'Food', // ← Debería matchear via areCategoriesRelated
        date: new Date(year, month, 10).toISOString(),
        paymentMethod: 'cash',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Ambos gastos deberían ser budgeted gracias al keyword matching
    expect(data.spentBudgeted).toBe(800); // 500 + 300
    expect(data.spentUnbudgeted).toBe(0);
    expect(data.budgetedExpenses.length).toBe(2);
  });

  // ============================================
  // TEST 3: Cálculo de remaining y percentage
  // ============================================
  it('should calculate remaining budget and percentage correctly', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Shopping',
        category: 'Shopping',
        limit: 1000, // Límite pequeño para test simple
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const transactions: Transaction[] = [
      {
        id: 'tx1',
        type: 'expense',
        amount: 600, // 60% del presupuesto
        description: 'Compras',
        category: 'Shopping',
        date: new Date(year, month, 5).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Cálculos esperados:
    // spentBudgeted = 600
    // remaining = 1,000 - 600 = 400
    // remainingPercentage = (600 / 1,000) * 100 = 60%

    expect(data.spentBudgeted).toBe(600);
    expect(data.remaining).toBe(400);
    expect(data.remainingPercentage).toBe(60);
  });

  // ============================================
  // TEST 4: Income vs Budget gap detection
  // ============================================
  it('should detect when budget exceeds income (hasIncomeBudgetGap)', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Total',
        category: 'General',
        limit: 10000, // Presupuesto alto
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const transactions: Transaction[] = [
      {
        id: 'tx1',
        type: 'income',
        amount: 5000, // Ingreso menor que presupuesto
        description: 'Salario parcial',
        category: 'Salary',
        date: new Date(year, month, 1).toISOString(),
        paymentMethod: 'transfer',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Validaciones:
    // incomeTotal = 5,000
    // budgetTotal = 10,000
    // incomeSurplus = 5,000 - 10,000 = -5,000 (negativo)
    // hasIncomeBudgetGap = true (presupuesto > ingreso)

    expect(data.incomeTotal).toBe(5000);
    expect(data.budgetTotal).toBe(10000);
    expect(data.incomeSurplus).toBe(-5000);
    expect(data.hasIncomeBudgetGap).toBe(true);
  });

  // ============================================
  // TEST 5: Presupuestos inactivos no deben contar
  // ============================================
  it('should ignore inactive budgets', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Active',
        category: 'Food',
        limit: 2000,
        spent: 0,
        period: 'monthly',
        isActive: true // ← Activo
      },
      {
        id: 'budget2',
        name: 'Inactive',
        category: 'Transport',
        limit: 1000,
        spent: 0,
        period: 'monthly',
        isActive: false // ← Inactivo
      }
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const transactions: Transaction[] = [
      {
        id: 'tx1',
        type: 'expense',
        amount: 500,
        description: 'Food expense',
        category: 'Food',
        date: new Date(year, month, 5).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: 'tx2',
        type: 'expense',
        amount: 300,
        description: 'Transport expense',
        category: 'Transport',
        date: new Date(year, month, 10).toISOString(),
        paymentMethod: 'cash',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Solo budget1 (activo) debe contar
    // budgetTotal = 2,000 (solo budget1)
    // spentBudgeted = 500 (solo Food)
    // spentUnbudgeted = 300 (Transport sin presupuesto activo)

    expect(data.budgetTotal).toBe(2000);
    expect(data.budgetItemsCount).toBe(1); // Solo 1 activo
    expect(data.spentBudgeted).toBe(500);
    expect(data.spentUnbudgeted).toBe(300);
  });

  // ============================================
  // TEST 6: Filtrado por período (monthly)
  // ============================================
  it('should only include transactions from the specified month', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Monthly Food',
        category: 'Food',
        limit: 3000,
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const year = 2024;
    const month = 5; // Junio (0-indexed)

    const transactions: Transaction[] = [
      // Transacción del mes correcto (Junio 2024)
      {
        id: 'tx1',
        type: 'expense',
        amount: 500,
        description: 'June expense',
        category: 'Food',
        date: new Date(2024, 5, 15).toISOString(), // ← Junio
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Transacción de otro mes (Mayo 2024)
      {
        id: 'tx2',
        type: 'expense',
        amount: 800,
        description: 'May expense',
        category: 'Food',
        date: new Date(2024, 4, 20).toISOString(), // ← Mayo
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      // Transacción de otro año (Junio 2023)
      {
        id: 'tx3',
        type: 'expense',
        amount: 300,
        description: 'Last year expense',
        category: 'Food',
        date: new Date(2023, 5, 15).toISOString(), // ← 2023
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      }
    ];

    const { result } = renderHook(() => 
      useBudgetPeriod(budgets, transactions, { year, month })
    );

    const data: BudgetPeriodData = result.current;

    // Solo tx1 debe contar (Junio 2024)
    expect(data.spentBudgeted).toBe(500);
    expect(data.budgetedExpenses.length).toBe(1);
    expect(data.period).toBe('2024-06'); // Formato: YYYY-MM
  });
});

// ============================================
// TEST BONUS: BudgetService.findMatchingBudget directo
// ============================================
describe('BudgetService.findMatchingBudget - Keyword matching', () => {
  it('should match transaction with budget using keywords', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'supermercado', // ← Keyword en español
        category: 'Groceries',
        limit: 5000,
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const transaction: Transaction = {
      id: 'tx1',
      type: 'expense',
      amount: 1000,
      description: 'Jumbo - compras', // ← 'jumbo' está en keywords de 'supermercado'
      category: 'Shopping',
      date: new Date().toISOString(),
      paymentMethod: 'card',
      isRecurring: false,
      createdAt: Date.now()
    };

    const matchedBudget = BudgetService.findMatchingBudget(transaction, budgets);

    // Debería encontrar budget1 por keyword 'jumbo' → 'supermercado'
    expect(matchedBudget).not.toBeNull();
    expect(matchedBudget?.id).toBe('budget1');
  });

  it('should return null when no budget matches', () => {
    const budgets: Budget[] = [
      {
        id: 'budget1',
        name: 'Food',
        category: 'Food',
        limit: 3000,
        spent: 0,
        period: 'monthly',
        isActive: true
      }
    ];

    const transaction: Transaction = {
      id: 'tx1',
      type: 'expense',
      amount: 500,
      description: 'Electronics - laptop',
      category: 'Electronics', // ← No relacionado con Food
      date: new Date().toISOString(),
      paymentMethod: 'card',
      isRecurring: false,
      createdAt: Date.now()
    };

    const matchedBudget = BudgetService.findMatchingBudget(transaction, budgets);

    expect(matchedBudget).toBeNull();
  });
});
