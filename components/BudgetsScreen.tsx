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
  Target,
  Sparkles,
  DollarSign,
  ShoppingCart,
  Fuel,
  Home,
  Car,
  Utensils,
  CreditCard,
  Smartphone,
  Gamepad2,
  Shirt,
  GraduationCap,
  Heart,
  Plane,
  Gift,
  Music,
  Coffee,
  Briefcase,
  Stethoscope,
  Dumbbell,
} from 'lucide-react';
import { Budget, Transaction, CustomCategory } from '../types';
import { BudgetService } from '../services/budgetService';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { storageService } from '../services/storageService';

interface BudgetsScreenProps {
  budgets: Budget[];
  transactions: Transaction[];
  currencySymbol: string;
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  DollarSign, ShoppingCart, Fuel, Lightbulb: () => <Lightbulb className="w-6 h-6" />,
  Home, Car, Utensils, CreditCard, Smartphone, Gamepad2, Shirt, GraduationCap,
  Heart, Plane, Gift, Music, Coffee, Briefcase, Stethoscope, Dumbbell,
};

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  transactions,
  currencySymbol,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const { t, language } = useI18n();
  const { isDarkMode, settings } = useSettings();
  const [showAlerts, setShowAlerts] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

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
      .reduce((sum, b) => sum + b.limit, 0);

    const totalSpent = updatedBudgets
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + (b.spent || 0), 0);

    const totalRemaining = totalBudgeted - totalSpent;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      percentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  }, [updatedBudgets]);

  const activeBudgets = updatedBudgets.filter(b => b.isActive);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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

  // Get budget icon component
  const getBudgetIcon = (iconName?: string) => {
    if (!iconName) return DollarSign;
    return ICON_MAP[iconName] || DollarSign;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 sm:p-6 md:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {language === 'es' ? 'Presupuestos' : 'Budgets'}
            </h1>
          </div>
          <p className="text-purple-100 text-sm sm:text-base">
            {language === 'es' ? 'Controla tus gastos por categoría' : 'Control your spending by category'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Budgeted */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                {language === 'es' ? 'Total Presupuestado' : 'Total Budgeted'}
              </span>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
              {formatCurrency(summaryStats.totalBudgeted)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                {language === 'es' ? 'Total Gastado' : 'Total Spent'}
              </span>
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
              {formatCurrency(summaryStats.totalSpent)}
            </p>
          </div>

          {/* Remaining */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                {language === 'es' ? 'Restante' : 'Remaining'}
              </span>
              <PiggyBank className="w-5 h-5 text-emerald-500" />
            </div>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                summaryStats.totalRemaining >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {formatCurrency(summaryStats.totalRemaining)}
            </p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                <span>{summaryStats.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    summaryStats.percentage < 70
                      ? 'bg-emerald-500'
                      : summaryStats.percentage < 90
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(summaryStats.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

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
                          ? `Sugerencia: ${currencySymbol}${suggestion.suggestedAmount.toLocaleString()}`
                          : `Suggested: ${currencySymbol}${suggestion.suggestedAmount.toLocaleString()}`}
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

        {/* Create Budget Button */}
        <button
          onClick={onCreateBudget}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 text-base sm:text-lg"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          {language === 'es' ? 'Crear Presupuesto' : 'Create Budget'}
        </button>

        {/* Budget List */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            {language === 'es' ? 'Mis Presupuestos' : 'My Budgets'}
            {activeBudgets.length > 0 && (
              <span className="ml-3 text-sm sm:text-base font-normal text-slate-600 dark:text-slate-400">
                ({activeBudgets.length})
              </span>
            )}
          </h2>

          {activeBudgets.length === 0 ? (
            // Empty State
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 sm:p-12 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <PiggyBank className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-2">
                {language === 'es' ? 'No tienes presupuestos configurados' : 'No budgets configured'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
                {language === 'es' 
                  ? 'Crea tu primer presupuesto para empezar a controlar tus gastos por categoría'
                  : 'Create your first budget to start tracking spending by category'}
              </p>
              <button
                onClick={onCreateBudget}
                className="inline-flex items-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {language === 'es' ? 'Crear mi primer presupuesto' : 'Create my first budget'}
              </button>
            </div>
          ) : (
            // Budget Cards
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeBudgets.map(budget => {
                const spent = budget.spent || 0;
                const remaining = budget.limit - spent;
                const percentage = BudgetService.getUsagePercentage(
                  spent,
                  budget.limit
                );
                const color = BudgetService.getProgressColor(percentage);
                const BudgetIcon = getBudgetIcon(budget.icon);

                const colorClasses = {
                  emerald: 'bg-emerald-500',
                  amber: 'bg-amber-500',
                  rose: 'bg-rose-500',
                };

                const iconBgClasses: Record<string, string> = {
                  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                  rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
                  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                };

                return (
                  <div
                    key={budget.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
                  >
                    {/* Budget Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                            iconBgClasses[budget.color || 'purple'] || iconBgClasses.purple
                          }`}
                        >
                          <BudgetIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                            {budget.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            {getCategoryName(budget.category)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditBudget(budget)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          aria-label="Editar presupuesto"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteBudget(budget.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          aria-label="Eliminar presupuesto"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Budget Amounts */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {language === 'es' ? 'Gastado' : 'Spent'}
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
                          {language === 'es' ? 'Presupuesto' : 'Budget'}
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                          {formatCurrency(budget.limit)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                        <span
                          className={`font-semibold ${
                            remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {remaining >= 0 
                            ? (language === 'es' ? 'Restante:' : 'Remaining:') 
                            : (language === 'es' ? 'Excedido:' : 'Exceeded:')}{' '}
                          {formatCurrency(remaining)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Period Badge and Savings Management */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium">
                        {budget.period === 'monthly' 
                          ? (language === 'es' ? 'Mensual' : 'Monthly') 
                          : (language === 'es' ? 'Anual' : 'Yearly')}
                      </span>
                      {remaining > 0 && spent > 0 && (
                        <button
                          className="inline-flex items-center gap-1 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1 rounded-lg transition-colors"
                          title={language === 'es' ? 'Gestionar ahorro' : 'Manage savings'}
                        >
                          <Target className="w-4 h-4" />
                          {language === 'es' ? 'Ahorro disponible' : 'Savings available'}
                        </button>
                      )}
                      {percentage >= 80 && percentage < 100 && (
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-amber-600 font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {language === 'es' ? 'Cerca del límite' : 'Near limit'}
                        </span>
                      )}
                      {percentage >= 100 && (
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-rose-600 font-medium">
                          <TrendingDown className="w-4 h-4" />
                          {language === 'es' ? 'Presupuesto excedido' : 'Budget exceeded'}
                        </span>
                      )}
                    </div>
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
