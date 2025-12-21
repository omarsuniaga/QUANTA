import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownRight, Zap, Calendar, AlertCircle, Coffee, ShoppingBag, Car, Home, 
  Bell, Clock, Edit3, Trash2, Filter, Check, X, ChevronDown, ChevronUp,
  CreditCard, AlertTriangle, CalendarClock, History, Banknote, MoreVertical, Info
} from 'lucide-react';
import { Transaction, CustomCategory } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../contexts/I18nContext';
import { storageService } from '../services/storageService';
import { smartNotificationService } from '../services/smartNotificationService';
import { AmountInfoModal, AmountBreakdownItem } from './AmountInfoModal';

interface ExpensesScreenProps {
  transactions: Transaction[];
  currencySymbol?: string;
  currencyCode?: string;
  monthlyBudget?: number;
  onQuickExpense: () => void;
  onRecurringExpense: () => void;
  onPlannedExpense: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onPaymentConfirmed?: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
}

type FilterType = 'all' | 'quick' | 'recurring' | 'planned';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

interface PendingPayment {
  id: string;
  transaction: Transaction;
  dueDate: Date;
  daysUntilDue: number;
  status: 'pending' | 'paid' | 'postponed' | 'rejected';
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  transactions,
  currencySymbol = '$',
  currencyCode = 'MXN',
  monthlyBudget = 0,
  onQuickExpense,
  onRecurringExpense,
  onPlannedExpense,
  onEditTransaction,
  onDeleteTransaction,
  onPaymentConfirmed
}) => {
  const { settings } = useSettings();
  const { t, language } = useI18n();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Map<string, 'paid' | 'postponed' | 'rejected'>>(new Map());
  const [expandedSection, setExpandedSection] = useState<'pending' | 'history' | null>('pending');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [showMonthExpenseInfo, setShowMonthExpenseInfo] = useState(false);
  const [showBudgetInfo, setShowBudgetInfo] = useState(false);

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
    
    // If no translation or it's an ID (long string), return generic name
    return language === 'es' ? 'Otra categoría' : 'Other category';
  };

  // Filter only expenses
  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  // Current month expenses total
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpenses = useMemo(() => {
    return expenses
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [expenses, currentMonth, currentYear]);

  // Category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const currentMonthExpenses = expenses.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const breakdown: { category: string; amount: number; count: number }[] = [];
    const categoryMap = new Map<string, { amount: number; count: number }>();

    currentMonthExpenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1
      });
    });

    categoryMap.forEach((data, category) => {
      breakdown.push({ category, amount: data.amount, count: data.count });
    });

    // Sort by amount descending
    return breakdown.sort((a, b) => b.amount - a.amount);
  }, [expenses, currentMonth, currentYear]);

  // Budget calculations
  const budgetUsedPercent = monthlyBudget > 0 ? (thisMonthExpenses / monthlyBudget) * 100 : 0;
  const budgetRemaining = monthlyBudget - thisMonthExpenses;

  // Month expense breakdown for info modal
  const monthExpenseBreakdown = useMemo((): AmountBreakdownItem[] => {
    const breakdown: AmountBreakdownItem[] = [];
    
    // Group by category for top 5
    categoryBreakdown.slice(0, 5).forEach(item => {
      const categoryName = getCategoryName(item.category);
      const percentage = thisMonthExpenses > 0 ? (item.amount / thisMonthExpenses) * 100 : 0;
      
      breakdown.push({
        label: categoryName,
        amount: item.amount,
        type: 'subtraction',
        icon: 'expense',
        description: language === 'es'
          ? `${item.count} gasto(s) - ${percentage.toFixed(1)}% del total`
          : `${item.count} expense(s) - ${percentage.toFixed(1)}% of total`
      });
    });

    // Add recurring expenses info
    const recurringExpenses = expenses.filter(t => {
      const date = new Date(t.date);
      return t.isRecurring && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    if (recurringExpenses.length > 0) {
      const recurringTotal = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);
      breakdown.push({
        label: language === 'es' ? 'Gastos Recurrentes' : 'Recurring Expenses',
        amount: recurringTotal,
        type: 'neutral',
        icon: 'recurring',
        description: language === 'es'
          ? `${recurringExpenses.length} gasto(s) recurrente(s) este mes`
          : `${recurringExpenses.length} recurring expense(s) this month`
      });
    }

    return breakdown;
  }, [categoryBreakdown, thisMonthExpenses, expenses, currentMonth, currentYear, language, getCategoryName]);

  // Budget breakdown for info modal
  const budgetBreakdown = useMemo((): AmountBreakdownItem[] => {
    const breakdown: AmountBreakdownItem[] = [];
    
    breakdown.push({
      label: language === 'es' ? 'Presupuesto Mensual' : 'Monthly Budget',
      amount: monthlyBudget,
      type: 'neutral',
      icon: 'info',
      description: language === 'es'
        ? 'Límite de gasto establecido para este mes'
        : 'Spending limit set for this month'
    });

    breakdown.push({
      label: language === 'es' ? 'Gastado Este Mes' : 'Spent This Month',
      amount: thisMonthExpenses,
      type: 'subtraction',
      icon: 'expense',
      description: language === 'es'
        ? `Has usado el ${budgetUsedPercent.toFixed(1)}% de tu presupuesto`
        : `You've used ${budgetUsedPercent.toFixed(1)}% of your budget`
    });

    breakdown.push({
      label: language === 'es' ? 'Restante' : 'Remaining',
      amount: budgetRemaining,
      type: budgetRemaining >= 0 ? 'addition' : 'subtraction',
      icon: budgetRemaining >= 0 ? 'savings' : 'info',
      description: budgetRemaining >= 0
        ? (language === 'es' ? 'Disponible para gastar este mes' : 'Available to spend this month')
        : (language === 'es' ? '¡Has excedido tu presupuesto!' : 'You have exceeded your budget!')
    });

    return breakdown;
  }, [monthlyBudget, thisMonthExpenses, budgetRemaining, budgetUsedPercent, language]);

  // Get pending recurring payments (upcoming payments that need confirmation)
  const pendingRecurringPayments = useMemo((): PendingPayment[] => {
    const now = new Date();
    const upcoming: PendingPayment[] = [];

    const recurringExpenses = expenses.filter(t => t.isRecurring);
    
    recurringExpenses.forEach(expense => {
      const chargeDay = new Date(expense.date).getDate();
      const nextDueDate = new Date(now.getFullYear(), now.getMonth(), chargeDay);
      
      // If charge day has passed this month, look at next month
      if (nextDueDate < now) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
      
      const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show payments due within next 7 days
      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        const status = pendingPayments.get(expense.id) || 'pending';
        upcoming.push({
          id: expense.id,
          transaction: expense,
          dueDate: nextDueDate,
          daysUntilDue,
          status
        });
      }
    });

    return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [expenses, pendingPayments]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...expenses];

    // Apply filter
    switch (filter) {
      case 'quick':
        filtered = filtered.filter(t => !t.isRecurring && !t.isPlanned);
        break;
      case 'recurring':
        filtered = filtered.filter(t => t.isRecurring);
        break;
      case 'planned':
        filtered = filtered.filter(t => t.isPlanned);
        break;
    }

    // Apply sort
    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }

    return filtered;
  }, [expenses, filter, sortOrder]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredHistory.forEach(expense => {
      const date = new Date(expense.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Hoy';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Ayer';
      } else {
        key = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(expense);
    });

    return groups;
  }, [filteredHistory]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePayment = async (payment: PendingPayment, action: 'paid' | 'postponed' | 'rejected') => {
    // Update local UI state
    setPendingPayments(prev => new Map(prev).set(payment.id, action));
    
    // Handle notification service action
    const pendingNotification = smartNotificationService.hasPendingNotification(payment.id);
    if (pendingNotification) {
      await smartNotificationService.handleScheduledPaymentAction(
        pendingNotification.id,
        action === 'rejected' ? 'cancel' : action === 'paid' ? 'pay' : 'postpone',
        async (transactionId, amount, dueDate) => {
          // When user confirms payment, create a new expense transaction
          if (onPaymentConfirmed) {
            const newTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
              type: 'expense',
              amount: payment.transaction.amount,
              category: payment.transaction.category,
              description: `${payment.transaction.description} (${language === 'es' ? 'Pago confirmado' : 'Payment confirmed'})`,
              date: new Date().toISOString().split('T')[0],
              isRecurring: false, // This is the actual payment, not the recurring definition
              notes: `${language === 'es' ? 'Pago de gasto recurrente:' : 'Recurring expense payment:'} ${payment.transaction.description}`
            };
            await onPaymentConfirmed(newTransaction);
          }
        }
      );
    } else if (action === 'paid' && onPaymentConfirmed) {
      // No notification exists, but user still wants to pay - create transaction directly
      const newTransaction: Omit<Transaction, 'id' | 'createdAt'> = {
        type: 'expense',
        amount: payment.transaction.amount,
        category: payment.transaction.category,
        description: `${payment.transaction.description} (${language === 'es' ? 'Pago confirmado' : 'Payment confirmed'})`,
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        notes: `${language === 'es' ? 'Pago de gasto recurrente:' : 'Recurring expense payment:'} ${payment.transaction.description}`
      };
      await onPaymentConfirmed(newTransaction);
    }
  };

  const getDueDateLabel = (daysUntilDue: number): { text: string; color: string } => {
    if (daysUntilDue === 0) return { text: 'Vence hoy', color: 'text-rose-600 dark:text-rose-400' };
    if (daysUntilDue === 1) return { text: 'Vence mañana', color: 'text-amber-600 dark:text-amber-400' };
    if (daysUntilDue <= 3) return { text: `Vence en ${daysUntilDue} días`, color: 'text-amber-600 dark:text-amber-400' };
    return { text: `Vence en ${daysUntilDue} días`, color: 'text-slate-500 dark:text-slate-400' };
  };

  const getExpenseTypeIcon = (expense: Transaction) => {
    if (expense.isRecurring) return Calendar;
    if (expense.isPlanned) return Clock;
    return Zap;
  };

  const getExpenseTypeBadge = (expense: Transaction) => {
    if (expense.isRecurring) return { text: 'Recurrente', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' };
    if (expense.isPlanned) return { text: 'Planificado', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' };
    return { text: 'Rápido', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' };
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
          <ArrowDownRight className="w-6 h-6 sm:w-7 sm:h-7" />
          {language === 'es' ? 'Mis Gastos' : 'My Expenses'}
        </h1>
        <p className="text-rose-100 text-xs sm:text-sm">
          {language === 'es' ? 'Controla tu dinero que sale' : 'Track your spending'}
        </p>
      </div>

      {/* Budget Card - Clickable */}
      <div className="px-3 sm:px-4 -mt-5 sm:-mt-6 mb-4 sm:mb-6">
        <div 
          onClick={() => setShowCategoryBreakdown(true)}
          className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {language === 'es' ? 'Gastado Este Mes' : 'Spent This Month'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthExpenseInfo(true);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Info"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(thisMonthExpenses)}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-0.5 sm:mb-1">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                  {language === 'es' ? 'Presupuesto' : 'Budget'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBudgetInfo(true);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Info"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">
                {formatCurrency(monthlyBudget)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-1.5 sm:mb-2">
            <div className="h-2 sm:h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetUsedPercent >= 90 ? 'bg-rose-500' :
                  budgetUsedPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className={`font-medium ${budgetRemaining < 0 ? 'text-rose-600' : 'text-slate-600'} dark:text-slate-400`}>
              {language === 'es' ? 'Restante' : 'Remaining'}: {formatCurrency(budgetRemaining)}
            </span>
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {budgetUsedPercent.toFixed(0)}%
            </span>
          </div>
          
          {/* Hint to tap */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {language === 'es' ? 'Toca para ver desglose por categoría' : 'Tap to view category breakdown'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Expense Button */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <button
          onClick={onQuickExpense}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-rose-200 dark:shadow-none"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-base sm:text-lg">{language === 'es' ? 'Gasto Rápido' : 'Quick Expense'}</span>
        </button>
      </div>

      {/* Pending Payments Section */}
      {pendingRecurringPayments.filter(p => p.status === 'pending').length > 0 && (
        <div className="px-3 sm:px-4 mb-4 sm:mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === 'pending' ? null : 'pending')}
            className="w-full flex items-center justify-between mb-2 sm:mb-3"
          >
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
              <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              {language === 'es' ? 'Pagos Próximos' : 'Upcoming Payments'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 sm:py-1 rounded-full">
                {pendingRecurringPayments.filter(p => p.status === 'pending').length}
              </span>
              {expandedSection === 'pending' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {expandedSection === 'pending' && (
            <div className="space-y-2 sm:space-y-3">
              {pendingRecurringPayments.filter(p => p.status === 'pending').map(payment => {
                const dueLabel = getDueDateLabel(payment.daysUntilDue);
                return (
                  <div
                    key={payment.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border-2 border-amber-200 dark:border-amber-800/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {payment.transaction.description}
                          </h3>
                          <p className={`text-xs sm:text-sm font-medium ${dueLabel.color}`}>
                            {dueLabel.text}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                          {formatCurrency(payment.transaction.amount)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => handlePayment(payment, 'paid')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>{language === 'es' ? 'Pagar' : 'Pay'}</span>
                      </button>
                      <button
                        onClick={() => handlePayment(payment, 'postponed')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        <span>{language === 'es' ? 'Posponer' : 'Postpone'}</span>
                      </button>
                      <button
                        onClick={() => handlePayment(payment, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-2 px-3 rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span>{language === 'es' ? 'Omitir' : 'Skip'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Budget Alert */}
      {budgetUsedPercent >= 90 && (
        <div className="px-3 sm:px-4 mb-4 sm:mb-6">
          <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-900 dark:text-rose-100 text-xs sm:text-sm mb-0.5">
                {language === 'es' ? '¡Cuidado con tu presupuesto!' : 'Watch your budget!'}
              </h3>
              <p className="text-[10px] sm:text-xs text-rose-700 dark:text-rose-300">
                {language === 'es' 
                  ? `Has gastado el ${budgetUsedPercent.toFixed(0)}% de tu presupuesto mensual.`
                  : `You've spent ${budgetUsedPercent.toFixed(0)}% of your monthly budget.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expense History */}
      <div className="px-3 sm:px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            {language === 'es' ? 'Historial de Gastos' : 'Expense History'}
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showFilters 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {language === 'es' ? 'Filtros' : 'Filters'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-3 space-y-3">
            {/* Filter Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                {language === 'es' ? 'Tipo' : 'Type'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: language === 'es' ? 'Todos' : 'All' },
                  { value: 'quick', label: language === 'es' ? 'Rápidos' : 'Quick' },
                  { value: 'recurring', label: language === 'es' ? 'Recurrentes' : 'Recurring' },
                  { value: 'planned', label: language === 'es' ? 'Planificados' : 'Planned' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as FilterType)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                {language === 'es' ? 'Ordenar por' : 'Sort by'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'newest', label: language === 'es' ? 'Más recientes' : 'Newest' },
                  { value: 'oldest', label: language === 'es' ? 'Más antiguos' : 'Oldest' },
                  { value: 'highest', label: language === 'es' ? 'Mayor monto' : 'Highest' },
                  { value: 'lowest', label: language === 'es' ? 'Menor monto' : 'Lowest' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortOrder(option.value as SortOrder)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortOrder === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grouped History */}
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
            <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'es' ? 'No hay gastos registrados' : 'No expenses recorded'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([date, dayExpenses]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {date}
                  </h3>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(dayExpenses.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayExpenses.map(expense => {
                    const TypeIcon = getExpenseTypeIcon(expense);
                    const typeBadge = getExpenseTypeBadge(expense);
                    return (
                      <div
                        key={expense.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm relative"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            expense.isRecurring 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                              : expense.isPlanned 
                                ? 'bg-purple-50 dark:bg-purple-900/30' 
                                : 'bg-rose-50 dark:bg-rose-900/30'
                          }`}>
                            <TypeIcon className={`w-5 h-5 ${
                              expense.isRecurring 
                                ? 'text-indigo-500' 
                                : expense.isPlanned 
                                  ? 'text-purple-500' 
                                  : 'text-rose-500'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                                    {expense.description || getCategoryName(expense.category)}
                                  </h4>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${typeBadge.color}`}>
                                    {typeBadge.text}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {formatTime(expense.date)} • {getCategoryName(expense.category)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                  -{formatCurrency(expense.amount)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(activeMenu === expense.id ? null : expense.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenu === expense.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-3 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden min-w-[140px]">
                              <button
                                onClick={() => {
                                  onEditTransaction?.(expense);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-indigo-500" />
                                {language === 'es' ? 'Editar' : 'Edit'}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({ 
                                    id: expense.id, 
                                    name: expense.description || getCategoryName(expense.category) 
                                  });
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                {language === 'es' ? 'Eliminar' : 'Delete'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown Modal */}
      {showCategoryBreakdown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCategoryBreakdown(false)}>
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category'}
                </h3>
                <button
                  onClick={() => setShowCategoryBreakdown(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'es' 
                  ? `Total del mes: ${formatCurrency(thisMonthExpenses)}`
                  : `Month total: ${formatCurrency(thisMonthExpenses)}`}
              </p>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {language === 'es' ? 'No hay gastos este mes' : 'No expenses this month'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map((item, index) => {
                    const percentage = thisMonthExpenses > 0 ? (item.amount / thisMonthExpenses) * 100 : 0;
                    const categoryName = getCategoryName(item.category);
                    
                    return (
                      <div
                        key={item.category}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                {categoryName}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({item.count} {item.count === 1 ? (language === 'es' ? 'gasto' : 'expense') : (language === 'es' ? 'gastos' : 'expenses')})
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-300"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowCategoryBreakdown(false)}
                className="w-full py-2.5 px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              {language === 'es' ? '¿Eliminar transacción?' : 'Delete transaction?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-2">
              {language === 'es' 
                ? '¿Estás seguro de que deseas eliminar esta transacción?' 
                : 'Are you sure you want to delete this transaction?'}
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg py-2 px-3">
              "{deleteConfirm.name}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction?.(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors"
              >
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amount Info Modals */}
      <AmountInfoModal
        isOpen={showMonthExpenseInfo}
        onClose={() => setShowMonthExpenseInfo(false)}
        title={language === 'es' ? 'Gastos del Mes' : 'Month Expenses'}
        subtitle={language === 'es' ? '¿De dónde vienen tus gastos?' : 'Where do your expenses come from?'}
        totalAmount={thisMonthExpenses}
        breakdown={monthExpenseBreakdown}
        currencySymbol={currencySymbol}
        language={language as 'es' | 'en'}
      />

      <AmountInfoModal
        isOpen={showBudgetInfo}
        onClose={() => setShowBudgetInfo(false)}
        title={language === 'es' ? 'Información del Presupuesto' : 'Budget Information'}
        subtitle={language === 'es' ? 'Desglose de tu presupuesto mensual' : 'Breakdown of your monthly budget'}
        totalAmount={monthlyBudget}
        breakdown={budgetBreakdown}
        currencySymbol={currencySymbol}
        language={language as 'es' | 'en'}
      />
    </div>
  );
};
