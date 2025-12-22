import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Briefcase, Zap, Edit2, Trash2, TrendingUp, Calendar, MoreVertical } from 'lucide-react';
import { Transaction } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { FinancialHealthCard } from './FinancialHealthCard';
import { SurplusDistributionView } from './SurplusDistributionView';
import { getFinancialHealth } from '../utils/financialHealth';

interface IncomeScreenProps {
  transactions: Transaction[];
  currencySymbol?: string;
  currencyCode?: string;
  budgetPeriodData: BudgetPeriodData;
  onAddFixedIncome: () => void;
  onAddExtraIncome: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onGoalsCreated?: () => void;
}

export const IncomeScreen: React.FC<IncomeScreenProps> = ({
  transactions,
  currencySymbol = 'RD$',
  currencyCode = 'DOP',
  budgetPeriodData,
  onAddFixedIncome,
  onAddExtraIncome,
  onEditTransaction,
  onDeleteTransaction,
  onGoalsCreated
}) => {
  const { language } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'all'>('current');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'fixed' | 'extra' } | null>(null);
  const [showSurplusView, setShowSurplusView] = useState(false);

  // Extract financial health status from SSOT
  const { status } = getFinancialHealth(budgetPeriodData);
  const hasSurplus = status === 'healthy_surplus' || status === 'strong_surplus';

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
    const locale = language === 'es' ? 'es-DO' : 'en-US';
    return `${currencySymbol} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
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

      {/* Financial Health Card - Compact by default */}
      <FinancialHealthCard
        budgetPeriodData={budgetPeriodData}
        currencySymbol={currencySymbol}
        language={language}
        onManageSurplus={hasSurplus ? () => setShowSurplusView(true) : undefined}
      />

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
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm relative"
              >
                <div className="flex items-start justify-between">
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
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(income.amount)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === income.id ? null : income.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {activeMenu === income.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setActiveMenu(null)}
                    />
                    <div className="absolute right-3 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden min-w-[140px]">
                      <button
                        onClick={() => {
                          onEditTransaction(income);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        {language === 'es' ? 'Editar' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm({ 
                            id: income.id, 
                            name: income.description,
                            type: 'fixed'
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
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-sm relative"
              >
                <div className="flex items-start justify-between">
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
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(income.amount)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === income.id ? null : income.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu */}
                {activeMenu === income.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setActiveMenu(null)}
                    />
                    <div className="absolute right-3 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden min-w-[140px]">
                      <button
                        onClick={() => {
                          onEditTransaction(income);
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        {language === 'es' ? 'Editar' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm({ 
                            id: income.id, 
                            name: income.description,
                            type: 'extra'
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
            ))}

            {extraIncomes.length > 10 && (
              <div className="text-center pt-1 sm:pt-2">
                <button className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  {language === 'es' ? 'Ver todos' : 'See all'} ({extraIncomes.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Surplus Distribution View */}
      {showSurplusView && (
        <SurplusDistributionView
          budgetPeriodData={budgetPeriodData}
          currencySymbol={currencySymbol}
          language={language}
          onBack={() => setShowSurplusView(false)}
          onGoalsCreated={onGoalsCreated}
        />
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
              {language === 'es' 
                ? `¿Eliminar ingreso ${deleteConfirm.type === 'fixed' ? 'fijo' : 'extra'}?` 
                : `Delete ${deleteConfirm.type === 'fixed' ? 'fixed' : 'extra'} income?`}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-2">
              {language === 'es' 
                ? '¿Estás seguro de que deseas eliminar este ingreso?' 
                : 'Are you sure you want to delete this income?'}
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
                  onDeleteTransaction(deleteConfirm.id);
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
    </div>
  );
};
