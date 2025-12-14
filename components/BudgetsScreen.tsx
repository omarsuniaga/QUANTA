import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Budget, Transaction } from '../types';
import { BudgetService } from '../services/budgetService';

interface BudgetsScreenProps {
  budgets: Budget[];
  transactions: Transaction[];
  currencySymbol: string;
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  transactions,
  currencySymbol,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
}) => {
  const [showAlerts, setShowAlerts] = useState(true);

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
    return `${currencySymbol}${Math.abs(amount).toLocaleString(undefined, {
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
        return 'bg-emerald-50 border-emerald-200';
      case 'overspending':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 sm:p-6 md:p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Presupuestos
            </h1>
          </div>
          <p className="text-purple-100 text-sm sm:text-base">
            Controla tus gastos por categoría
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Budgeted */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm sm:text-base">
                Total Presupuestado
              </span>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
              {formatCurrency(summaryStats.totalBudgeted)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm sm:text-base">
                Total Gastado
              </span>
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">
              {formatCurrency(summaryStats.totalSpent)}
            </p>
          </div>

          {/* Remaining */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-sm sm:text-base">
                Restante
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
              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-1">
                <span>Progreso</span>
                <span>{summaryStats.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

        {/* Alerts Section */}
        {alerts.length > 0 && showAlerts && (
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                Alertas de Presupuesto
              </h2>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Ocultar
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
                    <p className="text-sm sm:text-base text-slate-800 font-medium">
                      {alert.message}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {alert.percentage.toFixed(0)}% del presupuesto
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
          Crear Presupuesto
        </button>

        {/* Budget List */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Mis Presupuestos
            {activeBudgets.length > 0 && (
              <span className="ml-3 text-sm sm:text-base font-normal text-slate-600">
                ({activeBudgets.length})
              </span>
            )}
          </h2>

          {activeBudgets.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-xl p-8 sm:p-12 shadow-lg border border-slate-200 text-center">
              <PiggyBank className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                No tienes presupuestos configurados
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-6">
                Crea tu primer presupuesto para empezar a controlar tus gastos por
                categoría
              </p>
              <button
                onClick={onCreateBudget}
                className="inline-flex items-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear mi primer presupuesto
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

                const colorClasses = {
                  emerald: 'bg-emerald-500',
                  amber: 'bg-amber-500',
                  rose: 'bg-rose-500',
                };

                return (
                  <div
                    key={budget.id}
                    className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                  >
                    {/* Budget Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl ${
                            budget.color || 'bg-purple-100'
                          }`}
                        >
                          {budget.icon || '💰'}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-800">
                            {budget.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {budget.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditBudget(budget)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          aria-label="Editar presupuesto"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => onDeleteBudget(budget.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          aria-label="Eliminar presupuesto"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Budget Amounts */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 mb-1">
                          Gastado
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-slate-800">
                          {formatCurrency(spent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 mb-1">
                          Presupuesto
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-slate-800">
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
                          {remaining >= 0 ? 'Restante:' : 'Excedido:'}{' '}
                          {formatCurrency(remaining)}
                        </span>
                        <span className="text-slate-600 font-semibold">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Period Badge */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium">
                        {budget.period === 'monthly' ? 'Mensual' : 'Anual'}
                      </span>
                      {percentage >= 80 && percentage < 100 && (
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-amber-600 font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          Cerca del límite
                        </span>
                      )}
                      {percentage >= 100 && (
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-rose-600 font-medium">
                          <TrendingDown className="w-4 h-4" />
                          Presupuesto excedido
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
