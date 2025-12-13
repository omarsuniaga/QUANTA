import React, { useState, useMemo } from 'react';
import { ArrowDownRight, Zap, Calendar, AlertCircle, Plus, Coffee, ShoppingBag, Car, Home, Bell, TrendingDown, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { Button } from './Button';

interface ExpensesScreenProps {
  transactions: Transaction[];
  currencySymbol?: string;
  currencyCode?: string;
  monthlyBudget?: number;
  onQuickExpense: () => void;
  onRecurringExpense: () => void;
  onPlannedExpense: () => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  transactions,
  currencySymbol = '$',
  currencyCode = 'MXN',
  monthlyBudget = 0,
  onQuickExpense,
  onRecurringExpense,
  onPlannedExpense
}) => {
  // Filtrar solo gastos
  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  // Gastos de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayExpenses = useMemo(() =>
    expenses.filter(t => {
      const expenseDate = new Date(t.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    }),
    [expenses, today]
  );

  // Gastos recurrentes
  const recurringExpenses = useMemo(() =>
    expenses.filter(t => t.isRecurring),
    [expenses]
  );

  // Gastos del mes actual
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

  // Total de gastos de hoy
  const todayTotal = useMemo(() =>
    todayExpenses.reduce((sum, t) => sum + t.amount, 0),
    [todayExpenses]
  );

  // Calcular presupuesto disponible
  const budgetUsedPercent = monthlyBudget > 0 ? (thisMonthExpenses / monthlyBudget) * 100 : 0;
  const budgetRemaining = monthlyBudget - thisMonthExpenses;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hrs`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getFrequencyLabel = (frequency?: string) => {
    const labels: Record<string, string> = {
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual',
      'yearly': 'Anual'
    };
    return labels[frequency || 'monthly'] || 'Mensual';
  };

  const getNextChargeDate = (chargeDay: number) => {
    const now = new Date();
    const nextCharge = new Date(now.getFullYear(), now.getMonth(), chargeDay);

    if (nextCharge < now) {
      nextCharge.setMonth(nextCharge.getMonth() + 1);
    }

    const daysUntil = Math.ceil((nextCharge.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `En ${daysUntil} días`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'food': Coffee,
      'shopping': ShoppingBag,
      'transport': Car,
      'housing': Home,
      'default': ShoppingBag
    };
    return icons[category.toLowerCase()] || icons.default;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
          <ArrowDownRight className="w-6 h-6 sm:w-7 sm:h-7" />
          Mis Gastos
        </h1>
        <p className="text-rose-100 text-xs sm:text-sm">Controla tu dinero que sale</p>
      </div>

      {/* Budget Card */}
      <div className="px-3 sm:px-4 -mt-5 sm:-mt-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                Gastado Este Mes
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(thisMonthExpenses)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                Presupuesto
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
                  budgetUsedPercent >= 90
                    ? 'bg-rose-500'
                    : budgetUsedPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className={`font-medium ${
              budgetRemaining < 0 ? 'text-rose-600' : 'text-slate-600'
            } dark:text-slate-400`}>
              Restante: {formatCurrency(budgetRemaining)}
            </span>
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {budgetUsedPercent.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <button
          onClick={onQuickExpense}
          className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-rose-200 dark:shadow-none mb-2 sm:mb-3"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-base sm:text-lg">Gasto Rápido</span>
        </button>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={onRecurringExpense}
            className="flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Recurrente</span>
          </button>
          <button
            onClick={onPlannedExpense}
            className="flex items-center justify-center gap-1.5 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Planificado</span>
          </button>
        </div>
      </div>

      {/* Today's Expenses */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
            Gastos de Hoy
          </h2>
          <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(todayTotal)}
          </span>
        </div>

        {todayExpenses.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
            <Coffee className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No has registrado gastos hoy
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {todayExpenses.map(expense => {
              const Icon = getCategoryIcon(expense.category);
              return (
                <div
                  key={expense.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-2.5 sm:p-3 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {expense.description}
                        </h3>
                        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                          {formatTime(expense.date)} • {expense.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 ml-2">
                      -{formatCurrency(expense.amount)}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => {}} // TODO: Link to full history
              className="w-full text-center py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver todos los gastos de hoy
            </button>
          </div>
        )}
      </div>

      {/* Recurring Expenses */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
            Gastos Recurrentes
          </h2>
          <span className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 sm:py-1 rounded-full">
            {recurringExpenses.length}
          </span>
        </div>

        {recurringExpenses.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
              No tienes gastos recurrentes
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
              Netflix, luz, renta, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recurringExpenses.map(expense => (
              <div
                key={expense.id}
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {expense.description}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 ml-8 sm:ml-10">
                      <span>{getFrequencyLabel(expense.frequency)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      /{expense.frequency === 'monthly' ? 'mes' : 'año'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex-1 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400">
                    <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="truncate">Próximo: {getNextChargeDate(new Date(expense.date).getDate())}</span>
                  </div>
                  <button className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert if over budget */}
      {budgetUsedPercent >= 90 && (
        <div className="px-3 sm:px-4 mb-4 sm:mb-6">
          <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-900 dark:text-rose-100 text-xs sm:text-sm mb-0.5 sm:mb-1">
                ¡Cuidado con tu presupuesto!
              </h3>
              <p className="text-[10px] sm:text-xs text-rose-700 dark:text-rose-300">
                Has gastado el {budgetUsedPercent.toFixed(0)}% de tu presupuesto mensual.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
