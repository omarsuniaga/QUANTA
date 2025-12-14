import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Briefcase, Zap, Plus, Edit2, Pause, Play, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { Transaction } from '../types';
import { Button } from './Button';

interface IncomeScreenProps {
  transactions: Transaction[];
  currencySymbol?: string;
  currencyCode?: string;
  onAddFixedIncome: () => void;
  onAddExtraIncome: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const IncomeScreen: React.FC<IncomeScreenProps> = ({
  transactions,
  currencySymbol = '$',
  currencyCode = 'MXN',
  onAddFixedIncome,
  onAddExtraIncome,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'all'>('current');

  // Filtrar solo ingresos
  const incomeTransactions = useMemo(() =>
    transactions.filter(t => t.type === 'income'),
    [transactions]
  );

  // Separar ingresos fijos (recurrentes) y variables (extras)
  const fixedIncomes = useMemo(() =>
    incomeTransactions.filter(t => t.isRecurring),
    [incomeTransactions]
  );

  const extraIncomes = useMemo(() =>
    incomeTransactions.filter(t => !t.isRecurring),
    [incomeTransactions]
  );

  // Calcular totales del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthIncome = useMemo(() => {
    return incomeTransactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [incomeTransactions, currentMonth, currentYear]);

  // Calcular promedio mensual (últimos 6 meses)
  const averageMonthlyIncome = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentIncomes = incomeTransactions.filter(t => new Date(t.date) >= sixMonthsAgo);
    const monthsCount = Math.min(6, new Date().getMonth() + 1);

    return recentIncomes.reduce((sum, t) => sum + t.amount, 0) / (monthsCount || 1);
  }, [incomeTransactions]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
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

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7" />
          Mis Ingresos
        </h1>
        <p className="text-emerald-100 text-xs sm:text-sm">Gestiona tu dinero que entra</p>
      </div>

      {/* Stats Cards */}
      <div className="px-3 sm:px-4 -mt-5 sm:-mt-6 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Este Mes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Este Mes
              </span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(thisMonthIncome)}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
              {currencyCode}
            </div>
          </div>

          {/* Promedio */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Promedio Mensual (6 meses)
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatCurrency(averageMonthlyIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={onAddFixedIncome}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
        >
          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">Ingreso Fijo</span>
        </button>
        <button
          onClick={onAddExtraIncome}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors shadow-lg shadow-amber-200 dark:shadow-none"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm">Ingreso Extra</span>
        </button>
      </div>

      {/* Fixed Incomes Section */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Ingresos Fijos (Recurrentes)
          </h2>
          <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 sm:py-1 rounded-full">
            {fixedIncomes.length}
          </span>
        </div>

        {fixedIncomes.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
            <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
              No tienes ingresos fijos registrados
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
              Los ingresos fijos se registran automáticamente cada mes
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {fixedIncomes.map(income => (
              <div
                key={income.id}
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {income.description}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{getFrequencyLabel(income.frequency)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(income.amount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => onEditTransaction(income)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar este ingreso fijo?')) {
                        onDeleteTransaction(income.id);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra Incomes Section */}
      <div className="px-3 sm:px-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Ingresos Variables (Extras)
          </h2>
          <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 sm:py-1 rounded-full">
            {extraIncomes.length}
          </span>
        </div>

        {extraIncomes.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
            <Zap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
              No tienes ingresos extras registrados
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
              Freelance, bonos, ventas, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {extraIncomes.slice(0, 10).map(income => (
              <div
                key={income.id}
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {income.description}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(income.date)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(income.amount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => onEditTransaction(income)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar este ingreso extra?')) {
                        onDeleteTransaction(income.id);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {extraIncomes.length > 10 && (
              <div className="text-center pt-1 sm:pt-2">
                <button className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  Ver todos ({extraIncomes.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
