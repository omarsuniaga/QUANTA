import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowDownRight, Zap, Calendar, AlertCircle, Coffee, ShoppingBag, Car, Home,
  Bell, Clock, Edit3, Trash2, Filter, Check, X, ChevronDown, ChevronUp,
  CreditCard, AlertTriangle, CalendarClock, History, Banknote, MoreVertical,
  Info, ChevronLeft, ChevronRight, CheckCircle, Smartphone, List
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

  // 2. Quick Expenses (Transactions in this month that are NOT linked to recurring items)
  // Recent Expenses: Show ALL expenses (recurring + extras) with filters
  const recentExpenses = useMemo(() => {
    let filtered = transactions.filter(tx => {
      if (tx.type !== 'expense') return false;
      const txPeriod = tx.date.substring(0, 7);

      // Must be in this period
      if (txPeriod !== currentPeriod) return false;

      // Type filter: recurring vs extras
      if (expenseTypeFilter === 'recurring' && !tx.recurringMonthlyItemId) return false;
      if (expenseTypeFilter === 'extras' && tx.recurringMonthlyItemId) return false;

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });

    return filtered;
  }, [transactions, currentPeriod, expenseTypeFilter, sortBy]);

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

      {/* 3. RECURRING EXPENSES SECTION (Renamed & Refactored) */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {language === 'es' ? 'Gastos Recurrentes' : 'Recurring Expenses'}
            </h2>
          </div>
          {/* Quick Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button onClick={() => setFilter('all')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${filter === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              {language === 'es' ? 'Todos' : 'All'}
            </button>
            <button onClick={() => setFilter('pending')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${filter === 'pending' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}>
              {language === 'es' ? 'Pendientes' : 'Pending'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {managerLoading ? (
            <div className="text-center py-4 text-slate-400 text-sm">Cargando...</div>
          ) : filteredRecurringItems.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {language === 'es' ? 'No hay gastos recurrentes para este filtro.' : 'No recurring expenses found.'}
              </p>
            </div>
          ) : (
            filteredRecurringItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                      item.status === 'skipped' ? 'bg-slate-100 text-slate-400' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                      {item.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`font-bold text-slate-800 dark:text-white ${item.status === 'skipped' ? 'line-through opacity-60' : ''}`}>
                        {item.nameSnapshot}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                          item.status === 'skipped' ? 'bg-slate-100 text-slate-500' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                          {item.status === 'paid' ? (language === 'es' ? 'PAGADO' : 'PAID') :
                            item.status === 'skipped' ? (language === 'es' ? 'OMITIDO' : 'SKIPPED') :
                              (language === 'es' ? 'PENDIENTE' : 'PENDING')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions Menu */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      {editingAmountId === item.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            autoFocus
                            value={tempAmount}
                            onChange={(e) => setTempAmount(e.target.value)}
                            className="w-20 text-right text-sm border-b-2 border-indigo-500 bg-transparent outline-none font-bold text-slate-800 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className={`text-lg font-bold ${item.status === 'skipped' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                          {formatCurrency(item.amount)}
                        </div>
                      )}
                    </div>

                    {/* Menu Dropdown for Edit/Delete */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>

                      {menuOpenId === item.id && (
                        <>
                          {/* Backdrop to close menu */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenId(null)}
                          />

                          {/* Dropdown Menu */}
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setEditingItem({
                                  id: item.id,
                                  name: item.nameSnapshot,
                                  amount: item.amount,
                                  templateId: item.templateId
                                });
                                setEditModalOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              {language === 'es' ? 'Editar Monto' : 'Edit Amount'}
                            </button>
                            <button
                              onClick={async () => {
                                setMenuOpenId(null);
                                if (confirm(language === 'es'
                                  ? `¿Eliminar "${item.nameSnapshot}"?\n\nEsto eliminará:\n• El template del gasto recurrente\n• Todos los items pendientes de meses futuros\n• NO afectará pagos ya realizados`
                                  : `Delete "${item.nameSnapshot}"?\n\nThis will remove:\n• The recurring expense template\n• All pending items from future months\n• Will NOT affect already paid expenses`
                                )) {
                                  try {
                                    await expenseActions.deleteTemplate(item.templateId);
                                    toast.success(
                                      language === 'es' ? 'Template eliminado' : 'Template deleted',
                                      language === 'es' ? `"${item.nameSnapshot}" se eliminó correctamente` : `"${item.nameSnapshot}" was deleted successfully`
                                    );
                                  } catch (error) {
                                    console.error('Error deleting template:', error);
                                    toast.error(
                                      language === 'es' ? 'Error al eliminar' : 'Error deleting',
                                      error instanceof Error ? error.message : 'Unknown error'
                                    );
                                  }
                                }
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              {language === 'es' ? 'Eliminar' : 'Delete'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => expenseActions.skipItem(item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Omitir' : 'Skip'}
                      </button>

                      {editingAmountId === item.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingAmountId(null)}
                            className="p-2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePay(item.id, item.amount)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {language === 'es' ? 'Confirmar' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // If simple click, pay default. If long press or edit mode...
                            // For now just pay default or toggle edit?
                            // Let's toggle Edit mode as the "Action" to verify amount
                            setTempAmount(item.amount.toString());
                            setEditingAmountId(item.id);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {language === 'es' ? 'Pagar' : 'Pay'}
                        </button>
                      )}
                    </>
                  )}

                  {item.status === 'paid' && (
                    <button
                      onClick={() => expenseActions.undoPayItem(item.id)}
                      className="text-xs text-rose-500 font-medium hover:underline"
                    >
                      {language === 'es' ? 'Deshacer pago' : 'Undo payment'}
                    </button>
                  )}

                  {item.status === 'skipped' && (
                    <button
                      onClick={async () => {
                        // Reactivate item to pending status
                        const doc = await import('../services/expenseService').then(m => m.expenseService.getMonthlyExpenses(currentPeriod));
                        const targetItem = doc.fixedItems.find(i => i.id === item.id);
                        if (targetItem) {
                          targetItem.status = 'pending';
                          await import('../services/expenseService').then(m => m.expenseService.saveMonthlyDoc(doc));
                          expenseActions.refresh();
                        }
                      }}
                      className="text-xs text-indigo-500 font-medium hover:underline"
                    >
                      {language === 'es' ? 'Reactivar' : 'Reactivate'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

        {/* Filters & Sorting */}
        <div className="flex gap-2 mb-3 items-center flex-wrap">
          {/* Type Filter */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setExpenseTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'all'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              {language === 'es' ? 'Todos' : 'All'}
            </button>
            <button
              onClick={() => setExpenseTypeFilter('recurring')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'recurring'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              {language === 'es' ? 'Recurrentes' : 'Recurring'}
            </button>
            <button
              onClick={() => setExpenseTypeFilter('extras')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${expenseTypeFilter === 'extras'
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              {language === 'es' ? 'Extras' : 'Extras'}
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-none rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="date-desc">{language === 'es' ? '📅 Más reciente' : '📅 Most recent'}</option>
            <option value="date-asc">{language === 'es' ? '📅 Más antiguo' : '📅 Oldest first'}</option>
            <option value="amount-desc">{language === 'es' ? '💰 Mayor monto' : '💰 Highest amount'}</option>
            <option value="amount-asc">{language === 'es' ? '💰 Menor monto' : '💰 Lowest amount'}</option>
          </select>

          {/* Active filters count */}
          {(expenseTypeFilter !== 'all' || sortBy !== 'date-desc') && (
            <button
              onClick={() => {
                setExpenseTypeFilter('all');
                setSortBy('date-desc');
              }}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {language === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              {language === 'es' ? 'No hay gastos registrados este mes.' : 'No expenses recorded this month.'}
            </div>
          ) : (
            recentExpenses.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
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
                      })} • {tx.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              </div>
            ))
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
      {editModalOpen && editingItem && (
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
      )}

    </div>
  );
};
