import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { Transaction, DashboardStats, Account, Goal } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { validateDate } from '../utils/validation';

interface TransactionFilters {
  search: string;
  category: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  type: 'all' | 'income' | 'expense';
  paymentMethod: string | null;
}

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  stats: DashboardStats;
  filters: TransactionFilters;
  filteredTransactions: Transaction[];
  ghostMoneyAlerts: string[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction | null>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  undoDelete: () => Promise<boolean>;

  // Filters
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;

  // Refresh
  refreshTransactions: () => Promise<void>;
}

const defaultFilters: TransactionFilters = {
  search: '',
  category: null,
  dateFrom: null,
  dateTo: null,
  type: 'all',
  paymentMethod: null
};

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<TransactionFilters>(defaultFilters);
  const [lastDeleted, setLastDeleted] = useState<Transaction | null>(null);

  // Load transactions, accounts, and goals when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setTransactions([]);
      setAccounts([]);
      setGoals([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [txs, accs, gls] = await Promise.all([
        storageService.getTransactions(),
        storageService.getAccounts(),
        storageService.getGoals()
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setGoals(gls);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats with real balance from accounts
  const stats: DashboardStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    // Patrimonio real = suma de todas las cuentas
    const realBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Total comprometido en metas
    const committedSavings = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);

    // Balance disponible:
    // Con la nueva integridad financiera, el "Disponible Hoy" es el balance real de las cuentas
    // menos lo comprometido en ahorros. Los ingresos/gastos bancarios ya están en realBalance.
    // Los ingresos/gastos en EFECTIVO (no vinculados a cuenta) se calculan aparte si no hay cuentas.

    let availableBalance = realBalance - committedSavings;

    // Si no hay cuentas, usamos el cálculo histórico
    if (accounts.length === 0) {
      availableBalance = totalIncome - totalExpense - committedSavings;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      realBalance,
      availableBalance,
      committedSavings
    };
  }, [transactions, accounts, goals]);

  // Ghost Money Detector
  const ghostMoneyAlerts = useMemo(() => {
    const warnings: string[] = [];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = transactions.filter(t =>
      t.type === 'expense' && new Date(t.date).getTime() > thirtyDaysAgo
    );

    const counts: Record<string, number> = {};
    recent.forEach(t => {
      const key = `${t.amount}-${t.description}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    Object.entries(counts).forEach(([key, count]) => {
      if (count > 1) {
        const [amt, desc] = key.split('-');
        warnings.push(`Posible cargo duplicado: ${desc} ($${amt}) aparece ${count} veces.`);
      }
    });
    return warnings;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          t.amount.toString().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category
      if (filters.category && t.category !== filters.category) return false;

      // Date range
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;

      // Type
      if (filters.type !== 'all' && t.type !== filters.type) return false;

      // Payment method
      if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  // Actions
  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
    try {
      // Validate date strictly
      const dateError = validateDate(tx.date);
      if (dateError) {
        toast.error('Error de validación', dateError);
        return null;
      }

      const newTx = await storageService.addTransaction(tx);
      setTransactions(prev => [...prev, newTx]);

      // Refresh accounts to get updated balances
      const updatedAccs = await storageService.getAccounts();
      setAccounts(updatedAccs);

      toast.success(
        tx.type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
        `${tx.description}: $${tx.amount.toLocaleString()}`
      );
      return newTx;
    } catch (error: any) {
      toast.error('Error al guardar', error.message);
      return null;
    }
  }, [toast]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
    try {
      // Validate date if present
      if (updates.date) {
        const dateError = validateDate(updates.date);
        if (dateError) {
          toast.error('Error de validación', dateError);
          return false;
        }
      }

      await storageService.updateTransaction(id, updates);
      setTransactions(prev =>
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );

      // Refresh accounts to get updated balances
      const updatedAccs = await storageService.getAccounts();
      setAccounts(updatedAccs);

      toast.success('Transacción actualizada');
      return true;
    } catch (error: any) {
      toast.error('Error al actualizar', error.message);
      return false;
    }
  }, [toast]);

  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return false;

    try {
      await storageService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));

      // Refresh accounts to get updated balances
      const updatedAccs = await storageService.getAccounts();
      setAccounts(updatedAccs);

      setLastDeleted(txToDelete);

      toast.addToast({
        type: 'info',
        title: 'Transacción eliminada',
        message: txToDelete.description,
        duration: 6000,
        action: {
          label: 'Deshacer',
          onClick: () => undoDelete()
        }
      });
      return true;
    } catch (error: any) {
      toast.error('Error al eliminar', error.message);
      return false;
    }
  }, [transactions, toast]);

  const undoDelete = useCallback(async (): Promise<boolean> => {
    if (!lastDeleted) return false;

    try {
      const restored = await storageService.addTransaction(lastDeleted);
      setTransactions(prev => [...prev, restored]);
      setLastDeleted(null);
      toast.success('Transacción restaurada');
      return true;
    } catch (error: any) {
      toast.error('Error al restaurar', error.message);
      return false;
    }
  }, [lastDeleted, toast]);

  const setFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const refreshTransactions = useCallback(async () => {
    await loadAllData();
  }, []);

  return (
    <TransactionsContext.Provider value={{
      transactions,
      loading,
      stats,
      filters,
      filteredTransactions,
      ghostMoneyAlerts,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      undoDelete,
      setFilters,
      clearFilters,
      refreshTransactions
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = (): TransactionsContextType => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};
