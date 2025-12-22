/**
 * Test Fixtures - Datasets reutilizables para tests
 * 
 * Regla: Números redondos, fáciles de auditar mentalmente
 */

import { Transaction, Account, Goal, Budget } from '../types';

// ============================================
// ACCOUNTS FIXTURES
// ============================================

export const mockAccounts = {
  bankAccount: (): Account => ({
    id: 'acc_bank_1',
    name: 'Cuenta Corriente',
    type: 'bank',
    balance: 10000, // $10k
    currency: 'USD',
    icon: 'bank'
  }),

  walletAccount: (): Account => ({
    id: 'acc_wallet_1',
    name: 'Efectivo',
    type: 'wallet',
    balance: 5000, // $5k
    currency: 'USD',
    icon: 'wallet'
  }),

  multipleAccounts: (): Account[] => [
    {
      id: 'acc1',
      name: 'Banco Principal',
      type: 'bank',
      balance: 8000,
      currency: 'USD',
      icon: 'bank'
    },
    {
      id: 'acc2',
      name: 'Tarjeta',
      type: 'card',
      balance: 2000,
      currency: 'USD',
      icon: 'credit-card'
    }
  ],

  emptyAccounts: (): Account[] => []
};

// ============================================
// TRANSACTIONS FIXTURES
// ============================================

export const mockTransactions = {
  incomeInAccount: (amount = 5000): Transaction => ({
    id: 'tx_inc_1',
    type: 'income',
    amount,
    description: 'Salario (ya en cuenta)',
    category: 'Salary',
    date: '2024-12-01',
    paymentMethod: 'transfer',
    isRecurring: false,
    isIncludedInAccountBalance: true, // ← NO sumar de nuevo
    createdAt: Date.now()
  }),

  incomeNotInAccount: (amount = 1000): Transaction => ({
    id: 'tx_inc_2',
    type: 'income',
    amount,
    description: 'Freelance (efectivo pendiente)',
    category: 'Freelance',
    date: '2024-12-15',
    paymentMethod: 'cash',
    isRecurring: false,
    isIncludedInAccountBalance: false, // ← SÍ sumarlo
    createdAt: Date.now()
  }),

  foodExpense: (amount = 1000): Transaction => ({
    id: 'tx_exp_1',
    type: 'expense',
    amount,
    description: 'Supermercado',
    category: 'Food',
    date: '2024-12-10',
    paymentMethod: 'card',
    isRecurring: false,
    createdAt: Date.now()
  }),

  transportExpense: (amount = 500): Transaction => ({
    id: 'tx_exp_2',
    type: 'expense',
    amount,
    description: 'Uber',
    category: 'Transport',
    date: '2024-12-12',
    paymentMethod: 'cash',
    isRecurring: false,
    createdAt: Date.now()
  }),

  unbudgetedExpense: (amount = 800): Transaction => ({
    id: 'tx_exp_3',
    type: 'expense',
    amount,
    description: 'Netflix',
    category: 'Entertainment',
    date: '2024-12-15',
    paymentMethod: 'card',
    isRecurring: false,
    createdAt: Date.now()
  }),

  // Dataset completo para test de doble conteo
  doubleCountScenario: (): { accounts: Account[], transactions: Transaction[] } => ({
    accounts: [{
      id: 'acc1',
      name: 'Banco',
      type: 'bank',
      balance: 5000, // Balance YA incluye el ingreso
      currency: 'USD',
      icon: 'bank'
    }],
    transactions: [{
      id: 'tx1',
      type: 'income',
      amount: 5000,
      description: 'Transferencia (ya reflejada)',
      category: 'Transfer',
      date: '2024-12-01',
      paymentMethod: 'transfer',
      isRecurring: false,
      isIncludedInAccountBalance: true, // ← Flag crítico
      createdAt: Date.now()
    }]
  })
};

// ============================================
// GOALS FIXTURES
// ============================================

export const mockGoals = {
  vacationGoal: (currentAmount = 3000): Goal => ({
    id: 'goal_1',
    name: 'Vacaciones',
    targetAmount: 5000,
    currentAmount
  }),

  emergencyFund: (currentAmount = 2000): Goal => ({
    id: 'goal_2',
    name: 'Fondo de Emergencia',
    targetAmount: 10000,
    currentAmount
  }),

  multipleGoals: (): Goal[] => [
    {
      id: 'goal1',
      name: 'Ahorro 1',
      targetAmount: 5000,
      currentAmount: 2000
    },
    {
      id: 'goal2',
      name: 'Ahorro 2',
      targetAmount: 3000,
      currentAmount: 1000
    }
  ],

  emptyGoals: (): Goal[] => []
};

// ============================================
// BUDGETS FIXTURES
// ============================================

export const mockBudgets = {
  foodBudget: (limit = 5000): Budget => ({
    id: 'budget_1',
    name: 'Comida',
    category: 'Food',
    limit,
    spent: 0,
    period: 'monthly',
    isActive: true
  }),

  transportBudget: (limit = 2000): Budget => ({
    id: 'budget_2',
    name: 'Transporte',
    category: 'Transport',
    limit,
    spent: 0,
    period: 'monthly',
    isActive: true
  }),

  activeBudgets: (): Budget[] => [
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
  ],

  mixedActiveBudgets: (): Budget[] => [
    {
      id: 'budget_active',
      name: 'Active',
      category: 'Food',
      limit: 2000,
      spent: 0,
      period: 'monthly',
      isActive: true
    },
    {
      id: 'budget_inactive',
      name: 'Inactive',
      category: 'Transport',
      limit: 1000,
      spent: 0,
      period: 'monthly',
      isActive: false
    }
  ]
};

// ============================================
// DATASET COMPLETOS PARA TESTS COMUNES
// ============================================

/**
 * Escenario 1: Cálculo correcto de availableBalance
 */
export const scenarioAvailableBalance = () => ({
  accounts: [mockAccounts.bankAccount()],
  transactions: [
    mockTransactions.incomeInAccount(5000),
    mockTransactions.incomeNotInAccount(1000),
    mockTransactions.foodExpense(2000)
  ],
  goals: [mockGoals.vacationGoal(3000)]
  // Esperado: availableBalance = 10,000 + 1,000 - 2,000 - 3,000 = 6,000
});

/**
 * Escenario 2: Fail-case de doble conteo
 */
export const scenarioNoDoubleCount = () => mockTransactions.doubleCountScenario();
// Esperado: availableBalance = 5,000 (NO 10,000)

/**
 * Escenario 3: Sin cuentas (fallback a totalIncome)
 */
export const scenarioWithoutAccounts = () => ({
  accounts: mockAccounts.emptyAccounts(),
  transactions: [
    mockTransactions.incomeNotInAccount(3000),
    mockTransactions.foodExpense(1000)
  ],
  goals: mockGoals.emptyGoals()
  // Esperado: availableBalance = 3,000 - 1,000 = 2,000
});

/**
 * Escenario 4: Categorización budgeted vs unbudgeted
 */
export const scenarioBudgetCategorization = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return {
    budgets: mockBudgets.activeBudgets(),
    transactions: [
      { ...mockTransactions.foodExpense(1000), date: new Date(year, month, 5).toISOString() },
      { ...mockTransactions.transportExpense(500), date: new Date(year, month, 10).toISOString() },
      { ...mockTransactions.unbudgetedExpense(800), date: new Date(year, month, 15).toISOString() }
    ],
    year,
    month
  };
  // Esperado: spentBudgeted = 1,500, spentUnbudgeted = 800
};

/**
 * Escenario 5: Keyword matching (Food/Comida)
 */
export const scenarioKeywordMatching = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return {
    budgets: [{
      id: 'budget_comida',
      name: 'comida',
      category: 'Comida',
      limit: 3000,
      spent: 0,
      period: 'monthly' as const,
      isActive: true
    }],
    transactions: [
      {
        id: 'tx_restaurant',
        type: 'expense' as const,
        amount: 500,
        description: 'Restaurant dinner',
        category: 'Dining',
        date: new Date(year, month, 5).toISOString(),
        paymentMethod: 'card',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: 'tx_food',
        type: 'expense' as const,
        amount: 300,
        description: 'Pizza delivery',
        category: 'Food',
        date: new Date(year, month, 10).toISOString(),
        paymentMethod: 'cash',
        isRecurring: false,
        createdAt: Date.now()
      }
    ],
    year,
    month
  };
  // Esperado: ambos expenses son budgeted (keyword matching)
};
