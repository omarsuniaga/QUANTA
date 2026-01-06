import React, { useState, useMemo, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  Lightbulb,
  Sparkles,
  List,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Budget, Transaction, CustomCategory } from '../types';
import { BudgetService } from '../services/budgetService';
import { useI18n } from '../contexts/I18nContext';
import { storageService } from '../services/storageService';
import { DynamicIcon, getColorClasses } from './IconPicker';
import { parseLocalDate } from '../utils/dateHelpers';
import { useCurrency } from '../hooks/useCurrency';

interface BudgetsScreenProps {
  budgets: Budget[];
  transactions: Transaction[];
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  transactions,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { language } = useI18n();
  const { formatAmount, convertAmount } = useCurrency();
  const [showAlerts, setShowAlerts] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [expandedBudget, setExpandedBudget] = useState<string | null>(null);

  // Period State (YYYY-MM)
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, monthVal] = currentPeriod.split('-').map(Number);
  const monthIndex = monthVal - 1; // 0-indexed for Date

  // Change Month Logic
  const changeMonth = (direction: 'next' | 'prev') => {
    const date = new Date(year, monthIndex + (direction === 'next' ? 1 : -1), 1);
    setCurrentPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return currentPeriod === current;
  }, [currentPeriod]);

  // Load custom categories from storage
  useEffect(() => {
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  // Wrap formatAmount for consistency
  const formatCurrency = (amount: number) => formatAmount(amount);

  // Build category names map
  const categoryNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    customCategories.forEach(cat => {
      const name = cat.name[language as 'es' | 'en'] || cat.name.es || cat.name.en;
      map.set(cat.id, name);
    });
    return map;
  }, [customCategories, language]);

  // Helper to get category name
  const getCategoryName = (categoryId: string): string => {
    if (categoryNamesMap.has(categoryId)) {
      return categoryNamesMap.get(categoryId)!;
    }
    if (categoryId.length < 20 && !categoryId.match(/[A-Z0-9]{10,}/)) {
      return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    }
    return categoryId;
  };

  // Get transactions for a specific budget in the SELECTED period
  const getTransactionsForBudget = (budget: Budget) => {
    return transactions.filter(tx => {
      if (tx.type !== 'expense' || tx.category !== budget.category) return false;

      const txDate = parseLocalDate(tx.date);

      if (budget.period === 'monthly') {
        return txDate.getFullYear() === year && txDate.getMonth() === monthIndex;
      } else {
        // For 'annual' budgets, we usually show year-to-date.
        // If the user navigates to a specific month, strictly speaking, they are viewing that month's slice of the annual budget?
        // Or should we show ALL transactions for the selected Year if budget is annual?
        // Let's stick to: Annual Budget = Show all transactions for the *Year of the selected period*
        return txDate.getFullYear() === year;
      }
    }).sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  };

  // Calculate Budgets with Period Data
  const budgetsWithPeriodData = useMemo(() => {
    return budgets.map(b => {
      const txs = getTransactionsForBudget(b);
      const spent = txs.reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent, isActive: b.isActive };
    }).sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit)); // Sort by most overspent/used? Or just keep original order? Keeping original order might be safer, but let's sort by name for stability or created order? 
    // Actually, let's keep array order stable or sort by limit size.
    // The original code didn't explicitly sort differently than input.
  }, [budgets, transactions, currentPeriod]);

  const activeBudgets = budgetsWithPeriodData.filter(b => b.isActive);

  // Generate Reports/Alerts (We use current period data for alerts shown in UI)
  const alerts = useMemo(() => {
    // We can reuse BudgetService.generateBudgetReport if we pass the *updated* budgets (with spent for this period)
    // But BudgetService might re-calculate. Let's do a lightweight alert gen here or mock it.
    // BudgetService.generateBudgetReport takes (budgets, transactions). It calculates internally.
    // If we want it to respect the period, we'd need to filter transactions passed to it.

    // Filter transactions to only those in this period/year for relevant budgets
    // excessive optimization? maybe. Let's just manually generate simple alerts for UI parity.
    const newAlerts = [];
    for (const b of activeBudgets) {
      const percentage = (b.spent / b.limit) * 100;
      if (percentage >= 100) {
        newAlerts.push({ id: b.id, type: 'overspending' as const, message: `${b.name}: ${language === 'es' ? 'Excedido' : 'Exceeded'}`, percentage });
      } else if (percentage >= 80) {
        newAlerts.push({ id: b.id, type: 'warning' as const, message: `${b.name}: ${language === 'es' ? 'Cerca del límite' : 'Near limit'}`, percentage });
      }
    }
    return newAlerts.sort((a, b) => b.percentage - a.percentage);
  }, [activeBudgets]);

  // Suggestions
  const suggestions = useMemo(() => {
    // BudgetService.generateBudgetSuggestions is complex ML-lite logic. 
    // We can pass the full transaction history? Or just this period? 
    // Improvements usually need history. Let's pass all transactions but maybe it triggers based on "current status".
    // For now, let's disable suggestions for historical views if complicated, or just let it run on current global transactions.
    return BudgetService.generateBudgetSuggestions(budgets, transactions, categoryNamesMap);
  }, [budgets, transactions, categoryNamesMap]);


  const summaryStats = useMemo(() => {
    const totalBudgeted = activeBudgets.reduce((sum, b) => sum + convertAmount(b.limit), 0);
    const expensesTotal = activeBudgets.reduce((sum, b) => sum + convertAmount(b.spent || 0), 0);
    const totalRemaining = totalBudgeted - expensesTotal;

    return {
      totalBudgeted,
      expensesTotal,
      totalRemaining,
      percentage: totalBudgeted > 0 ? (expensesTotal / totalBudgeted) * 100 : 0,
    };
  }, [activeBudgets, convertAmount]);


  const getAlertIcon = (type: 'saving' | 'overspending' | 'warning') => {
    switch (type) {
      case 'saving': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'overspending': return <TrendingDown className="w-5 h-5 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getAlertColor = (type: 'saving' | 'overspending' | 'warning') => {
    switch (type) {
      case 'saving': return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'overspending': return 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    }
  };

  const toggleBudget = (budgetId: string) => {
    setExpandedBudget(expandedBudget === budgetId ? null : budgetId);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 bg-slate-50 dark:bg-slate-900">
      {/* Header (Unified) */}
      <div className="bg-white dark:bg-slate-800 pb-6 pt-2 px-4 shadow-sm sticky top-0 z-10 transition-colors">
        <div className="flex items-center justify-between mb-4 h-[40px]">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            {language === 'es' ? 'Presupuestos' : 'Budgets'}
          </h1>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
          <button onClick={() => changeMonth('prev')} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
            {(() => {
              const [y, m] = currentPeriod.split('-').map(Number);
              const date = new Date(y, m - 1, 1);
              return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
            })()}
          </span>
          <button
            onClick={() => changeMonth('next')}
            className={`p-1 rounded-md transition-colors ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-600'}`}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 mb-6">
        {/* Main Stats Card */}
        <div className={`rounded-2xl p-5 text-white shadow-lg transition-all hover:shadow-xl
            ${summaryStats.percentage >= 90
            ? 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-200 dark:shadow-none' // Critical
            : summaryStats.percentage >= 70
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200 dark:shadow-none' // Warning
              : 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-purple-200 dark:shadow-none' // Good (Purple Theme)
          }`}>

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1 group relative cursor-help">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  {language === 'es' ? 'Total Presupuestado' : 'Total Budgeted'}
                </p>
                <Info className="w-3 h-3 text-white/70" />
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(summaryStats.totalBudgeted)}
              </h3>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                {language === 'es' ? 'Gastado Real' : 'Actual Spent'}
              </p>
              <div className="text-xl font-bold text-white/90">
                {formatCurrency(summaryStats.expensesTotal)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 relative">
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white/90 transition-all duration-300 shadow-sm"
                style={{ width: `${Math.min(summaryStats.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-white/80">
            <span>
              {language === 'es' ? 'Restante' : 'Remaining'}: <strong>{formatCurrency(summaryStats.totalRemaining)}</strong>
            </span>
            <span>
              {summaryStats.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Create Budget Button */}
      <div className="px-4 mb-6">
        <button
          onClick={onCreateBudget}
          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">{language === 'es' ? 'Crear Presupuesto' : 'Create Budget'}</span>
        </button>
      </div>

      <div className="px-4 space-y-6">

        {/* Smart Suggestions Section */}
        {suggestions.length > 0 && showSuggestions && (
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl p-4 sm:p-6 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {language === 'es' ? 'Sugerencias Inteligentes' : 'Smart Suggestions'}
                </h2>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
              >
                {language === 'es' ? 'Ocultar' : 'Hide'}
              </button>
            </div>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-violet-100 dark:border-violet-800"
                >
                  <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {suggestion.message}
                    </p>
                    {suggestion.suggestedAmount && (
                      <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                        {language === 'es'
                          ? `Sugerencia: ${formatAmount(suggestion.suggestedAmount)}`
                          : `Suggested: ${formatAmount(suggestion.suggestedAmount)}`}
                      </p>
                    )}
                    {suggestion.action && (
                      <button
                        onClick={() => suggestion.action?.()}
                        className="mt-2 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {language === 'es' ? 'Aplicar sugerencia' : 'Apply suggestion'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && showAlerts && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {language === 'es' ? 'Alertas de Presupuesto' : 'Budget Alerts'}
              </h2>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
              >
                {language === 'es' ? 'Ocultar' : 'Hide'}
              </button>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border ${getAlertColor(
                    alert.type
                  )}`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {alert.percentage.toFixed(0)}% {language === 'es' ? 'del presupuesto' : 'of budget'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {language === 'es' ? 'Mis Presupuestos' : 'My Budgets'}
            </h2>
            {activeBudgets.length > 0 && (
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                {activeBudgets.length}
              </span>
            )}
          </div>

          {activeBudgets.length === 0 ? (
            // Empty State
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <PiggyBank className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                {language === 'es' ? 'No tienes presupuestos configurados' : 'No budgets configured'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {language === 'es'
                  ? 'Crea tu primer presupuesto para controlar tus gastos'
                  : 'Create your first budget to track your spending'}
              </p>
            </div>
          ) : (
            // Budget Cards
            <div className="space-y-3">
              {activeBudgets.map(budget => {
                const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
                const remaining = budget.limit - budget.spent;
                const progressColor = BudgetService.getProgressColor(percentage);
                const budgetColorClasses = getColorClasses(budget.color || 'purple');

                const progressColorClasses = {
                  emerald: 'bg-emerald-500',
                  amber: 'bg-amber-500',
                  rose: 'bg-rose-500',
                };

                const budgetTransactions = getTransactionsForBudget(budget);
                const isExpanded = expandedBudget === budget.id;

                return (
                  <div
                    key={budget.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
                  >
                    {/* Budget Header - Clickable */}
                    <div
                      onClick={() => toggleBudget(budget.id)}
                      className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center ${budgetColorClasses.bg} ${budgetColorClasses.text}`}
                          >
                            <DynamicIcon name={budget.icon || 'PiggyBank'} className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                                {budget.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="truncate">{getCategoryName(budget.category)}</span>
                              <span>•</span>
                              <span>{budget.period === 'monthly'
                                ? (language === 'es' ? 'Mensual' : 'Monthly')
                                : (language === 'es' ? 'Anual' : 'Yearly')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-800 dark:text-white">
                              {formatAmount(convertAmount(budget.limit))}
                            </div>
                            <div className={`text-xs font-medium ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                              {remaining >= 0
                                ? (language === 'es' ? `Quedan ${formatAmount(convertAmount(remaining))}` : `${formatAmount(convertAmount(remaining))} left`)
                                : (language === 'es' ? `Excedido ${formatAmount(convertAmount(Math.abs(remaining)))}` : `${formatAmount(convertAmount(Math.abs(remaining)))} over`)}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">
                            {language === 'es' ? 'Gastado' : 'Spent'}: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(budget.spent)}</span>
                          </span>
                          <span className={`font-semibold ${percentage < 70 ? 'text-emerald-600' : percentage < 90 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColorClasses[progressColor]} rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        {percentage >= 100 && (
                          <div className="flex items-center gap-1 text-xs text-rose-600 font-medium mt-1.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {language === 'es' ? 'Excedido' : 'Exceeded'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Transactions List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                        {budgetTransactions.length > 0 ? (
                          <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {budgetTransactions.map(tx => (
                              <div
                                key={tx.id}
                                className="px-4 py-3 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {tx.description || (language === 'es' ? 'Sin descripción' : 'No description')}
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">
                                    {parseLocalDate(tx.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </p>
                                </div>
                                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                  -{formatCurrency(tx.amount)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {onEditTransaction && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTransaction(tx);
                                      }}
                                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </button>
                                  )}
                                  {onDeleteBudget && (
                                    // Logic: we are listing transactions here, but the props passed are onDeleteTransaction.
                                    // The button below calls onDeleteTransaction.
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(language === 'es' ? '¿Eliminar esta transacción?' : 'Delete this transaction?')) {
                                          onDeleteTransaction?.(tx.id);
                                        }
                                      }}
                                      className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                              {language === 'es' ? 'No hay transacciones en este período' : 'No transactions in this period'}
                            </p>
                          </div>
                        )}

                        <div className="p-3 bg-slate-100 dark:bg-slate-800/50 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditBudget(budget);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            {language === 'es' ? 'Editar Presupuesto' : 'Edit Budget'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(language === 'es' ? '¿Eliminar este presupuesto?' : 'Delete this budget?')) {
                                onDeleteBudget(budget.id);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            {language === 'es' ? 'Eliminar' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
