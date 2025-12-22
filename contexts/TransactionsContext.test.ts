import { describe, it, expect } from 'vitest';
import { Transaction, Account, Goal, DashboardStats } from '../types';
import {
  scenarioAvailableBalance,
  scenarioNoDoubleCount,
  scenarioWithoutAccounts
} from '../tests/fixtures';

/**
 * Tests para TransactionsContext - Cálculo de stats
 * 
 * Objetivo: Validar que availableBalance se calcula correctamente
 * sin duplicar ingresos que ya están reflejados en el balance de cuentas.
 * 
 * Lógica a testear (líneas 92-131 de TransactionsContext.tsx):
 * - newIncome = ingresos donde isIncludedInAccountBalance = false
 * - realBalance = suma de balances de cuentas
 * - committedSavings = suma de currentAmount de metas
 * - availableBalance = realBalance + newIncome - expense - committedSavings
 */

/**
 * Función auxiliar que replica la lógica de cálculo de stats
 * del TransactionsContext (líneas 92-131)
 */
function calculateStats(
  transactions: Transaction[],
  accounts: Account[],
  goals: Goal[]
): DashboardStats {
  let totalIncome = 0;
  let newIncome = 0;
  let expense = 0;
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (!t.isIncludedInAccountBalance) {
        newIncome += t.amount;
      }
    } else {
      expense += t.amount;
    }
  });

  const realBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const committedSavings = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);

  const hasAccounts = accounts.length > 0;
  const availableBalance = hasAccounts 
    ? realBalance + newIncome - expense - committedSavings
    : totalIncome - expense - committedSavings;

  return {
    totalIncome,
    totalExpense: expense,
    balance: totalIncome - expense,
    realBalance,
    availableBalance,
    committedSavings
  };
}

describe('TransactionsContext - stats calculation', () => {
  
  // ============================================
  // TEST 1: availableBalance correcto (caso base)
  // ============================================
  it('should calculate availableBalance correctly with accounts', () => {
    // Usar fixture reutilizable
    const { accounts, transactions, goals } = scenarioAvailableBalance();

    const stats = calculateStats(transactions, accounts, goals);

    // Cálculo esperado:
    // realBalance = 10,000 (cuenta)
    // newIncome = 1,000 (solo tx2, tx1 ya está en realBalance)
    // expense = 2,000
    // committedSavings = 3,000
    // availableBalance = 10,000 + 1,000 - 2,000 - 3,000 = 6,000

    expect(stats.totalIncome).toBe(6000); // 5000 + 1000
    expect(stats.totalExpense).toBe(2000);
    expect(stats.realBalance).toBe(10000);
    expect(stats.committedSavings).toBe(3000);
    expect(stats.availableBalance).toBe(6000); // ← VALOR CLAVE
  });

  // ============================================
  // TEST 2: NO doble conteo (fail-case crítico)
  // ============================================
  it('should NOT double-count income already in account balance', () => {
    // Escenario: Ingreso de $5,000 YA reflejado en cuenta
    // Si se suma de nuevo, availableBalance estaría inflado
    
    const { accounts, transactions } = scenarioNoDoubleCount();

    const goals: Goal[] = [];

    const stats = calculateStats(transactions, accounts, goals);

    // Si el cálculo es CORRECTO:
    // availableBalance = 5,000 (realBalance) + 0 (newIncome) - 0 (expense) - 0 (goals) = 5,000
    
    // Si hubiera BUG de doble conteo:
    // availableBalance = 5,000 + 5,000 - 0 - 0 = 10,000 ❌

    expect(stats.availableBalance).toBe(5000); // ← FAIL-CASE: debe ser 5k, no 10k
    expect(stats.totalIncome).toBe(5000);
    expect(stats.realBalance).toBe(5000);
  });

  // ============================================
  // TEST 3: Caso sin cuentas (fallback a totalIncome)
  // ============================================
  it('should use totalIncome when no accounts exist', () => {
    // Escenario: Usuario sin cuentas registradas
    // availableBalance = totalIncome - expense - committedSavings
    
    const { accounts, transactions, goals } = scenarioWithoutAccounts();

    const stats = calculateStats(transactions, accounts, goals);

    // Cálculo esperado (sin cuentas):
    // availableBalance = 3,000 (totalIncome) - 1,000 (expense) - 0 (goals) = 2,000

    expect(stats.realBalance).toBe(0); // Sin cuentas
    expect(stats.availableBalance).toBe(2000);
    expect(stats.balance).toBe(2000); // totalIncome - expense
  });

  // ============================================
  // TEST 4: Múltiples cuentas y metas
  // ============================================
  it('should calculate availableBalance correctly with accounts', () => {
    // Usar fixture reutilizable
    const { accounts, transactions, goals } = scenarioAvailableBalance();

    const stats = calculateStats(transactions, accounts, goals);

    // Cálculo esperado:
    // realBalance = 10,000 (cuenta)
    // newIncome = 1,000 (solo tx2, tx1 ya está en realBalance)
    // expense = 2,000
    // committedSavings = 3,000
    // availableBalance = 10,000 + 1,000 - 2,000 - 3,000 = 6,000
    // newIncome = 2,000
    // expense = 1,500
    // committedSavings = 2,000 + 1,000 = 3,000
    // availableBalance = 8,000 + 2,000 - 1,500 - 3,000 = 5,500

    expect(stats.realBalance).toBe(8000);
    expect(stats.committedSavings).toBe(3000);
    expect(stats.availableBalance).toBe(5500);
  });

  // ============================================
  // TEST 5: Edge case - Solo gastos, sin ingresos
  // ============================================
  it('should handle negative availableBalance (more expenses than income)', () => {
    const accounts: Account[] = [
      { id: 'acc1', name: 'Cuenta', type: 'wallet', balance: 1000, currency: 'USD', icon: 'wallet' }
    ];

    const transactions: Transaction[] = [
      { id: 'tx1', type: 'expense', amount: 3000, description: 'Gasto grande', category: 'Emergency', date: '2024-12-01', paymentMethod: 'card', isRecurring: false, createdAt: Date.now() }
    ];

    const goals: Goal[] = [];

    const stats = calculateStats(transactions, accounts, goals);

    // Cálculo esperado:
    // availableBalance = 1,000 (realBalance) + 0 (newIncome) - 3,000 (expense) - 0 (goals) = -2,000

    expect(stats.availableBalance).toBe(-2000); // Negativo válido
    expect(stats.totalExpense).toBe(3000);
  });

  // ============================================
  // TEST 6: Multi-moneda (comportamiento actual)
  // ============================================
  it('should sum amounts directly (no currency conversion in current implementation)', () => {
    // NOTA: La app actual NO hace conversión de monedas
    // Solo suma amounts directamente
    // Este test documenta el comportamiento actual
    
    const accounts: Account[] = [
      { id: 'acc1', name: 'Cuenta USD', type: 'wallet', balance: 1000, currency: 'USD', icon: 'wallet' },
      { id: 'acc2', name: 'Cuenta EUR', type: 'bank', balance: 500, currency: 'EUR', icon: 'bank' }
    ];

    const transactions: Transaction[] = [];
    const goals: Goal[] = [];

    const stats = calculateStats(transactions, accounts, goals);

    // Comportamiento actual: suma 1000 + 500 = 1500 (sin conversión)
    expect(stats.realBalance).toBe(1500);
    expect(stats.availableBalance).toBe(1500);
    
    // NOTA: Si en el futuro se implementa conversión de monedas,
    // este test deberá actualizarse para incluir rates de conversión
  });
});
