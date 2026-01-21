import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowDownRight, Zap, Calendar, AlertCircle, Coffee, ShoppingBag, Car, Home,
  Bell, Clock, Edit3, Trash2, Filter, Check, X, ChevronDown, ChevronUp,
  CreditCard, AlertTriangle, CalendarClock, History, Banknote, MoreVertical,
  Info, ChevronLeft, ChevronRight, CheckCircle, Smartphone, List, RotateCcw, Search
} from 'lucide-react';
import { PageHeader, PeriodSelector, StatsCard } from './base';
import { colors } from '../styles/tokens';
import { EditRecurringExpenseModal } from './modals/EditRecurringExpenseModal';
import { Transaction, CustomCategory } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { storageService } from '../services/storageService';
import { parseLocalDate } from '../utils/dateHelpers';
import { AmountInfoModal, AmountBreakdownItem } from './AmountInfoModal';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { ModalWrapper } from './ModalWrapper';
import { useCurrency } from '../hooks/useCurrency';
import { useExpenseManager } from '../hooks/useExpenseManager';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { FilterBar, CategoryOption, SortOption, StatusOption } from './FilterBar';

interface ExpensesScreenProps {
  transactions: Transaction[];
  budgetPeriodData: BudgetPeriodData;
  onQuickExpense: () => void;
  onRecurringExpense: () => void;
  onPlannedExpense: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  onPaymentConfirmed?: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
}

type FilterType = 'all' | 'pending' | 'paid' | 'skipped';

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  transactions,
  budgetPeriodData,
  onQuickExpense,
  onRecurringExpense,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { t, language } = useI18n();
  const { formatAmount, convertAmount } = useCurrency();
  const formatCurrency = formatAmount;
  const toast = useToast();

  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { monthlyDoc, loading: managerLoading, actions: expenseActions, totals } = useExpenseManager(currentPeriod);

  const [filter, setFilter] = useState<FilterType>('all');
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showBudgetInfo, setShowBudgetInfo] = useState(false);
  const [showMonthExpenseInfo, setShowMonthExpenseInfo] = useState(false);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string, name: string, amount: number, templateId: string } | null>(null);

  // Recent Expenses filters and sorting
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<'all' | 'recurring' | 'extras'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Check if viewing current month
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return currentPeriod === current;
  }, [currentPeriod]);

  // Load custom categories
  useEffect(() => {
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  // Helper to get category display name
  const getCategoryName = (categoryId: string): string => {
    if (categoryId === 'express') return 'Express';
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat) {
      return customCat.name[language as 'es' | 'en'] || customCat.name.es || customCat.name.en || customCat.key || (language === 'es' ? 'Sin categoría' : 'No category');
    }
    const translated = (t.categories as Record<string, string>)?.[categoryId];
    if (translated && translated !== categoryId) return translated;
    return language === 'es' ? 'Otra categoría' : 'Other category';
  };

  // --- PERIOD NAVIGATION ---
  const changeMonth = (direction: 'next' | 'prev') => {
    const [year, month] = currentPeriod.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    setCurrentPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // --- DATA PROCESSING ---

  // 1. Recurring Items (from hook)
  const filteredRecurringItems = useMemo(() => {
    if (!monthlyDoc) return [];

    // Sort logic: Pending first -> Paid/Skipped last
    // Within Pending: Active -> Postponed
    return monthlyDoc.fixedItems.filter(item => {
      if (filter === 'all') return true;
      return item.status === filter;
    }).sort((a, b) => {
      // Custom sort: Pending first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });
  }, [monthlyDoc, filter]);

  // 2. Recent Expenses: Show ALL expenses (recurring items from monthlyDoc + regular transactions)
  const recentExpensesBase = useMemo(() => {
    // If "Recurrentes" tab is selected, show items from monthlyDoc instead of transactions
    if (expenseTypeFilter === 'recurring') {
      // Return filtered recurring items from monthlyDoc
      return filteredRecurringItems.map(item => ({
        // Convert ExpenseMonthlyItem to Transaction-like object for rendering
        id: item.id,
        type: 'expense' as const,
        amount: item.amount,
        description: item.nameSnapshot,
        category: item.category,
        date: `${currentPeriod}-01`, // Use first day of month as placeholder
        isRecurring: true,
        recurringMonthlyItemId: item.id,
        recurringTemplateId: item.templateId,
        status: item.status,
        // Add these for rendering compatibility
        _isMonthlyItem: true, // Flag to identify it's from monthlyDoc
        _monthlyItem: item, // Keep reference to original item
      })) as any[];
    }

    // For "Todos" and "Extras", show regular transactions
    let filtered = transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const txPeriod = tx.date.substring(0, 7);

      // Must be in this period
      if (txPeriod !== currentPeriod) return false;

      // Type filter: extras only (no recurring)
      if (expenseTypeFilter === 'extras' && tx.recurringMonthlyItemId) return false;

      return true;
    });

    return filtered;
  }, [transactions, currentPeriod, expenseTypeFilter, filteredRecurringItems]);

  // 3. Apply advanced filters using universal hook
  const {
    filteredItems: recentExpenses,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy: filterSortBy,
    setSortBy: setFilterSortBy,
    clearFilters,
    activeFiltersCount,
    resultCount
  } = useTransactionFilters(recentExpensesBase, {
    enableStatusFilter: expenseTypeFilter === 'recurring',
    defaultSort: sortBy
  });

  // Get unique categories with counts
  const categoryOptions: CategoryOption[] = useMemo(() => {
    const categoryCounts = recentExpensesBase.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([cat, count]) => ({
      value: cat,
      label: getCategoryName(cat),
      count: count as number
    }));
  }, [recentExpensesBase, customCategories, language]);

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'date-desc', label: language === 'es' ? '📅 Más reciente' : '📅 Most recent' },
    { value: 'date-asc', label: language === 'es' ? '📅 Más antiguo' : '📅 Oldest first' },
    { value: 'amount-desc', label: language === 'es' ? '💰 Mayor monto' : '💰 Highest amount' },
    { value: 'amount-asc', label: language === 'es' ? '💰 Menor monto' : '💰 Lowest amount' },
    { value: 'name-asc', label: language === 'es' ? '🔤 A-Z' : '🔤 A-Z' },
    { value: 'name-desc', label: language === 'es' ? '🔤 Z-A' : '🔤 Z-A' },
  ];

  // Status options (for recurring items)
  const statusOptions: StatusOption[] = [
    { value: 'all', label: language === 'es' ? 'Todos los estados' : 'All statuses' },
    { value: 'pending', label: language === 'es' ? 'Pendientes' : 'Pending' },
    { value: 'paid', label: language === 'es' ? 'Pagados' : 'Paid' },
    { value: 'skipped', label: language === 'es' ? 'Omitidos' : 'Skipped' },
  ];

  // --- HANDLERS ---
  const handlePay = async (itemId: string, defaultAmount: number) => {
    const amountToPay = editingAmountId === itemId ? parseFloat(tempAmount) : defaultAmount;
    if (isNaN(amountToPay) || amountToPay <= 0) return;

    await expenseActions.payItem(itemId, amountToPay);
    setEditingAmountId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 bg-slate-50 dark:bg-slate-900">

      {/* 1. STICKY HEADER      {/* Header (Design System) */}
      <div className="bg-white dark:bg-slate-800 pb-6 pt-2 shadow-sm sticky top-0 z-10 transition-colors">
        <PageHeader
          title={language === 'es' ? 'Mis Gastos' : 'My Expenses'}
          icon={ArrowDownRight}
          iconColor="rose"
        />

        <div className="px-4">
          <PeriodSelector
            currentPeriod={currentPeriod}
            onPrevious={() => changeMonth('prev')}
            onNext={() => changeMonth('next')}
            isCurrentMonth={isCurrentMonth}
            language={language as 'es' | 'en'}
          />
        </div>
      </div>

      {/* 2. MAIN STATE CARD (Budget for this month) */}
      <div className="px-4 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-5 text-white shadow-lg shadow-rose-200 dark:shadow-none">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1 group relative cursor-help" onClick={() => setShowMonthExpenseInfo(true)}>
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Gastado este Mes' : 'Spent This Month'}
                </p>
                <Info className="w-3 h-3 text-white/70" />
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(budgetPeriodData.expensesTotal)}
              </h3>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1 group relative cursor-help" onClick={() => setShowBudgetInfo(true)}>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Presupuesto' : 'Budget'}
                </p>
                <Info className="w-3 h-3 text-white/70" />
              </div>
              <div className="text-xl font-bold text-white/90">
                {formatCurrency(budgetPeriodData.budgetTotal)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 relative">
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className={`h-full transition-all duration-300 shadow-sm ${budgetPeriodData.remainingPercentage > 90 ? 'bg-white' : 'bg-white/90'}`}
                style={{ width: `${Math.min(budgetPeriodData.remainingPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-white/80">
            <span>
              {budgetPeriodData.remaining >= 0
                ? (language === 'es' ? `Quedan ${formatCurrency(budgetPeriodData.remaining)}` : `${formatCurrency(budgetPeriodData.remaining)} Left`)
                : (language === 'es' ? `Excedido por ${formatCurrency(Math.abs(budgetPeriodData.remaining))}` : `Over by ${formatCurrency(Math.abs(budgetPeriodData.remaining))}`)
              }
            </span>
            <span>
              {budgetPeriodData.remainingPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. RECURRING EXPENSES SECTION - REMOVED (Now shown in "Recurrentes" tab below) */}

      {/* 4. RECENT EXPENSES (Últimos Gastos) */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {language === 'es' ? 'Últimos Gastos' : 'Recent Expenses'}
            </h2>
          </div>
          {isCurrentMonth && (
            <button onClick={onQuickExpense} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full px-3 py-1.5 transition-colors">
              <Zap className="w-3 h-3" />
              {language === 'es' ? 'Nuevo' : 'New'}
            </button>
          )}
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 mb-3">
          <button
            onClick={() => setExpenseTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'all'
              ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            {language === 'es' ? 'Todos' : 'All'}
            <span className="ml-1.5 text-[10px] opacity-60">({transactions.filter(tx => tx.type === 'expense' && tx.date.substring(0, 7) === currentPeriod).length})</span>
          </button>
          <button
            onClick={() => setExpenseTypeFilter('recurring')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'recurring'
              ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            {language === 'es' ? 'Recurrentes' : 'Recurring'}
            <span className="ml-1.5 text-[10px] opacity-60">({filteredRecurringItems.length})</span>
          </button>
          <button
            onClick={() => setExpenseTypeFilter('extras')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'extras'
              ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            {language === 'es' ? 'Extras' : 'Extras'}
            <span className="ml-1.5 text-[10px] opacity-60">({transactions.filter(tx => tx.type === 'expense' && tx.date.substring(0, 7) === currentPeriod && !tx.recurringMonthlyItemId).length})</span>
          </button>
        </div>

        {/* Advanced Filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={language === 'es' ? 'Buscar gastos...' : 'Search expenses...'}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categoryOptions}
          statusFilter={expenseTypeFilter === 'recurring' ? statusFilter : undefined}
          onStatusChange={expenseTypeFilter === 'recurring' ? setStatusFilter : undefined}
          statusOptions={expenseTypeFilter === 'recurring' ? statusOptions : undefined}
          sortBy={filterSortBy}
          onSortChange={(value) => setFilterSortBy(value as any)}
          sortOptions={sortOptions}
          onClearFilters={clearFilters}
          activeFiltersCount={activeFiltersCount}
          resultCount={resultCount}
          totalCount={recentExpensesBase.length}
        />

        <div className="space-y-2">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              {expenseTypeFilter === 'recurring'
                ? (language === 'es' ? 'No hay gastos recurrentes registrados este mes.' : 'No recurring expenses recorded this month.')
                : expenseTypeFilter === 'extras'
                  ? (language === 'es' ? 'No hay gastos extras registrados este mes.' : 'No extra expenses recorded this month.')
                  : (language === 'es' ? 'No hay gastos registrados este mes.' : 'No expenses recorded this month.')
              }
            </div>
          ) : (
            recentExpenses.map(tx => {
              // Check if this is a monthly item (from monthlyDoc) or a regular transaction
              const isMonthlyItem = (tx as any)._isMonthlyItem;
              const monthlyItem = (tx as any)._monthlyItem;

              if (isMonthlyItem && monthlyItem) {
                // Render as recurring item with UNIFIED design
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Icon with status color */}
                      <div className={`p-2 rounded-full ${monthlyItem.status === 'paid'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : monthlyItem.status === 'skipped'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                        }`}>
                        {monthlyItem.status === 'paid' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : monthlyItem.status === 'skipped' ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-bold text-slate-800 dark:text-white truncate ${monthlyItem.status === 'skipped' ? 'line-through opacity-60' : ''
                            }`}>
                            {monthlyItem.nameSnapshot}
                          </p>
                          {/* Status badge */}
                          <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${monthlyItem.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : monthlyItem.status === 'skipped'
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            }`}>
                            {monthlyItem.status === 'paid' ? (language === 'es' ? 'Pagado' : 'Paid') :
                              monthlyItem.status === 'skipped' ? (language === 'es' ? 'Omitido' : 'Skipped') :
                                (language === 'es' ? 'Pendiente' : 'Pending')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {getCategoryName(monthlyItem.category)} • {language === 'es' ? 'Recurrente' : 'Recurring'}
                        </p>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center gap-3">
                      <p className={`text-base font-bold ${monthlyItem.status === 'skipped'
                        ? 'text-slate-400 line-through'
                        : 'text-rose-600 dark:text-rose-400'
                        }`}>
                        {formatCurrency(monthlyItem.amount)}
                      </p>

                      {/* Action buttons - show on hover or always for pending */}
                      <div className={`flex items-center gap-1 ${monthlyItem.status === 'pending' ? '' : 'opacity-0 group-hover:opacity-100'
                        } transition-opacity`}>
                        {monthlyItem.status === 'pending' && (
                          <>
                            <button
                              onClick={() => expenseActions.skipItem(monthlyItem.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                              title={language === 'es' ? 'Omitir' : 'Skip'}
                            >
                              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </button>
                            <button
                              onClick={() => handlePay(monthlyItem.id, monthlyItem.amount)}
                              className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                              title={language === 'es' ? 'Pagar' : 'Pay'}
                            >
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </button>
                          </>
                        )}

                        {monthlyItem.status === 'paid' && (
                          <button
                            onClick={() => expenseActions.undoPayItem(monthlyItem.id)}
                            className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-md transition-colors"
                            title={language === 'es' ? 'Deshacer' : 'Undo'}
                          >
                            <RotateCcw className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          </button>
                        )}

                        {monthlyItem.status === 'skipped' && (
                          <button
                            onClick={async () => {
                              const doc = await import('../services/expenseService').then(m => m.expenseService.getMonthlyExpenses(currentPeriod));
                              const targetItem = doc.fixedItems.find(i => i.id === monthlyItem.id);
                              if (targetItem) {
                                targetItem.status = 'pending';
                                await import('../services/expenseService').then(m => m.expenseService.saveMonthlyDoc(doc));
                                expenseActions.refresh();
                              }
                            }}
                            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                            title={language === 'es' ? 'Reactivar' : 'Reactivate'}
                          >
                            <RotateCcw className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular transaction rendering
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${tx.recurringMonthlyItemId
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                      }`}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {tx.description}
                        </p>
                        {tx.recurringMonthlyItemId && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                            {language === 'es' ? 'Recurrente' : 'Recurring'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                          day: '2-digit',
                          month: 'short'
                        })} • {getCategoryName(tx.category)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(tx.amount)}
                    </p>
                    {/* Action buttons - show on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          title={language === 'es' ? 'Editar' : 'Edit'}
                        >
                          <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button
                          onClick={async () => {
                            if (confirm(language === 'es'
                              ? `¿Eliminar "${tx.description}"?`
                              : `Delete "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title={language === 'es' ? 'Eliminar' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Modals */}
      <ModalWrapper
        isOpen={showMonthExpenseInfo}
        onClose={() => setShowMonthExpenseInfo(false)}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-xl w-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg dark:text-white">{language === 'es' ? 'Gastado este Mes' : 'Spent This Month'}</h3>
            <button onClick={() => setShowMonthExpenseInfo(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              {language === 'es'
                ? 'Suma de todos los gastos (recurrentes pagados + rápidos) registrados en el período actual.'
                : 'Sum of all expenses (paid recurring + quick) recorded in the current period.'}
            </p>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        isOpen={showBudgetInfo}
        onClose={() => setShowBudgetInfo(false)}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-xl w-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg dark:text-white">{language === 'es' ? 'Presupuesto Mensual' : 'Monthly Budget'}</h3>
            <button onClick={() => setShowBudgetInfo(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              {language === 'es'
                ? 'Límite total de gasto definido en tus presupuestos activos.'
                : 'Total spending limit defined in your active budgets.'}
            </p>
          </div>
        </div>
      </ModalWrapper>

      {/* Edit Recurring Expense Modal */}
      {
        editModalOpen && editingItem && (
          <EditRecurringExpenseModal
            isOpen={editModalOpen}
            itemName={editingItem.name}
            currentAmount={editingItem.amount}
            onClose={() => {
              setEditModalOpen(false);
              setEditingItem(null);
            }}
            onSave={async (newAmount) => {
              if (!editingItem) return;

              try {
                // CRITICAL FIX: Update the template (not just the current month's item)
                // This ensures future months get the new amount
                await expenseActions.editTemplate(editingItem.templateId, {
                  defaultAmount: newAmount
                });

                toast.success(
                  language === 'es' ? 'Monto actualizado' : 'Amount updated',
                  language === 'es' ? 'Se aplicará a los meses pendientes' : 'Will apply to pending months'
                );
              } catch (error) {
                console.error('Error updating template:', error);
                toast.error(
                  language === 'es' ? 'Error al actualizar' : 'Error updating',
                  error instanceof Error ? error.message : 'Unknown error'
                );
              }

              setEditModalOpen(false);
              setEditingItem(null);
            }}
          />
        )
      }

    </div >
  );
};
