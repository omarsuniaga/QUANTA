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

  // Load custom categories from storage
  useEffect(() => {
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  // Calculate updated budgets with current spending
  const updatedBudgets = useMemo(
    () => BudgetService.updateBudgetsWithSpending(budgets, transactions),
    [budgets, transactions]
  );

  // Generate alerts for all budgets
  const alerts = useMemo(
    () => BudgetService.generateBudgetReport(budgets, transactions),
    [budgets, transactions]
  );

  // Build category names map for displaying names instead of IDs
  const categoryNamesMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add custom categories from storageService
    customCategories.forEach(cat => {
      const name = cat.name[language as 'es' | 'en'] || cat.name.es || cat.name.en;
      map.set(cat.id, name);
    });

    return map;
  }, [customCategories, language]);

  // Generate smart suggestions based on spending patterns
  const suggestions = useMemo(
    () => BudgetService.generateBudgetSuggestions(budgets, transactions, categoryNamesMap),
    [budgets, transactions, categoryNamesMap]
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalBudgeted = updatedBudgets
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + convertAmount(b.limit), 0);

    const expensesTotal = updatedBudgets
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + convertAmount(b.spent || 0), 0);

    const totalRemaining = totalBudgeted - expensesTotal;

    return {
      totalBudgeted,
      expensesTotal,
      totalRemaining,
      percentage: totalBudgeted > 0 ? (expensesTotal / totalBudgeted) * 100 : 0,
    };
  }, [updatedBudgets, convertAmount]);

  const activeBudgets = updatedBudgets.filter(b => b.isActive);

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  const getAlertIcon = (type: 'saving' | 'overspending' | 'warning') => {
    switch (type) {
      case 'saving':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'overspending':
        return <TrendingDown className="w-5 h-5 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getAlertColor = (type: 'saving' | 'overspending' | 'warning') => {
    switch (type) {
      case 'saving':
        return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'overspending':
        return 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    }
  };

  // Get category name in current language
  const getCategoryName = (categoryId: string): string => {
    // First check the categoryNamesMap
    if (categoryNamesMap.has(categoryId)) {
      return categoryNamesMap.get(categoryId)!;
    }
    // Fallback: return the ID as-is (or formatted if it's short enough)
    if (categoryId.length < 20 && !categoryId.match(/[A-Z0-9]{10,}/)) {
      return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    }
    return categoryId;
  };

  // Get transactions for a specific budget category
  const getTransactionsForBudget = (budget: Budget) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(tx => {
      if (tx.type !== 'expense' || tx.category !== budget.category) return false;

      const txDate = parseLocalDate(tx.date); // Ensure txDate is defined here

      if (budget.period === 'monthly') {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      } else {
        return txDate.getFullYear() === currentYear;
      }
    }).sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  };

  // Toggle budget expansion
  const toggleBudget = (budgetId: string) => {
    setExpandedBudget(expandedBudget === budgetId ? null : budgetId);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
          <PiggyBank className="w-6 h-6 sm:w-7 sm:h-7" />
          {language === 'es' ? 'Presupuestos' : 'Budgets'}
        </h1>
        <p className="text-purple-100 text-xs sm:text-sm">
          {language === 'es' ? 'Controla tus gastos por categoría' : 'Control your spending by category'}
        </p>
      </div>

      {/* Stats Card */}
      <div className="px-3 sm:px-4 -mt-5 sm:-mt-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Total Budgeted */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {language === 'es' ? 'Total Presupuestado' : 'Total Budgeted'}
              </span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(summaryStats.totalBudgeted)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span className="font-medium">{language === 'es' ? 'Gastado' : 'Spent'}: <span className="text-slate-800 dark:text-white font-bold">{formatCurrency(summaryStats.expensesTotal)}</span></span>
              <span className="font-bold">{summaryStats.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${summaryStats.percentage < 70
                  ? 'bg-emerald-500'
                  : summaryStats.percentage < 90
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                  }`}
                style={{ width: `${Math.min(summaryStats.percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{language === 'es' ? 'Restante' : 'Remaining'}: <span className={`font-bold ${summaryStats.totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(summaryStats.totalRemaining)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Budget Button */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <button
          onClick={onCreateBudget}
          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">{language === 'es' ? 'Crear Presupuesto' : 'Create Budget'}</span>
        </button>
      </div>

      <div className="px-3 sm:px-4 space-y-4 sm:space-y-6">

        {/* Smart Suggestions Section */}
        {suggestions.length > 0 && showSuggestions && (
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl p-4 sm:p-6 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
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
                    <p className="text-sm sm:text-base text-slate-800 dark:text-white font-medium">
                      {suggestion.message}
                    </p>
                    {suggestion.suggestedAmount && (
                      <p className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 mt-1">
                        {language === 'es'
                          ? `Sugerencia: ${formatAmount(suggestion.suggestedAmount)}`
                          : `Suggested: ${formatAmount(suggestion.suggestedAmount)}`}
                      </p>
                    )}
                    {suggestion.action && (
                      <button
                        onClick={() => suggestion.action?.()}
                        className="mt-2 text-xs sm:text-sm bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
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
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
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
              {alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border ${getAlertColor(
                    alert.type
                  )}`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-slate-800 dark:text-white font-medium">
                      {alert.message}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {alert.percentage.toFixed(0)}% {language === 'es' ? 'del presupuesto' : 'of budget'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {language === 'es' ? 'Mis Presupuestos' : 'My Budgets'}
            </h2>
            {activeBudgets.length > 0 && (
              <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 sm:py-1 rounded-full">
                {activeBudgets.length}
              </span>
            )}
          </div>

          {activeBudgets.length === 0 ? (
            // Empty State
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
              <PiggyBank className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
                {language === 'es' ? 'No tienes presupuestos configurados' : 'No budgets configured'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                {language === 'es'
                  ? 'Crea tu primer presupuesto para controlar tus gastos'
                  : 'Create your first budget to track your spending'}
              </p>
            </div>
          ) : (
            // Budget Cards
            <div className="space-y-2 sm:space-y-3">
              {activeBudgets.map(budget => {
                const spent = budget.spent || 0;
                const remaining = budget.limit - spent;
                const percentage = BudgetService.getUsagePercentage(
                  spent,
                  budget.limit
                );
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
                    className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
                  >
                    {/* Budget Header - Clickable */}
                    <div
                      onClick={() => toggleBudget(budget.id)}
                      className="p-3 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-1">
                          <div
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${budgetColorClasses.bg} ${budgetColorClasses.text}`}
                          >
                            <DynamicIcon name={budget.icon || 'PiggyBank'} className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                {budget.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditBudget(budget);
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title={language === 'es' ? 'Editar presupuesto' : 'Edit budget'}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(language === 'es' ? '¿Eliminar este presupuesto?' : 'Delete this budget?')) {
                                    onDeleteBudget(budget.id);
                                  }
                                }}
                                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded transition-colors"
                                title={language === 'es' ? 'Eliminar presupuesto' : 'Delete budget'}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBudget(budget.id);
                                }}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                title={language === 'es' ? 'Ver transacciones' : 'View transactions'}
                              >
                                <List className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
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
                            <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                              {formatAmount(convertAmount(budget.limit))}
                            </div>
                            <div className={`text-[10px] sm:text-xs font-medium ${remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
                        <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">
                            {language === 'es' ? 'Gastado' : 'Spent'}: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(spent)}</span>
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
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-rose-600 font-medium mt-1.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            {language === 'es' ? 'Excedido' : 'Exceeded'}
                          </div>
                        )}
                        {percentage >= 80 && percentage < 100 && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-600 font-medium mt-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {language === 'es' ? 'Cerca del límite' : 'Near limit'}
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
                                className="px-3 sm:px-4 py-2.5 flex items-center gap-2 hover:bg-white dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {tx.description || (language === 'es' ? 'Sin descripción' : 'No description')}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                                    {parseLocalDate(tx.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                                  -{formatCurrency(tx.amount)}
                                </div>
                                <div className="flex items-center gap-1">
                                  {onEditTransaction && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTransaction(tx);
                                      }}
                                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                      title={language === 'es' ? 'Editar transacción' : 'Edit transaction'}
                                    >
                                      <Edit2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    </button>
                                  )}
                                  {onDeleteTransaction && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(language === 'es' ? '¿Eliminar esta transacción?' : 'Delete this transaction?')) {
                                          onDeleteTransaction(tx.id);
                                        }
                                      }}
                                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded transition-colors"
                                      title={language === 'es' ? 'Eliminar transacción' : 'Delete transaction'}
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 sm:px-4 py-6 text-center">
                            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                              {language === 'es' ? 'No hay transacciones en este período' : 'No transactions in this period'}
                            </p>
                          </div>
                        )}
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
