import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { getFinancialHealth, getStatusColor, FinancialHealthStatus } from '../utils/financialHealth';

interface FinancialHealthCardProps {
  budgetPeriodData: BudgetPeriodData;
  currencySymbol?: string;
  language?: 'es' | 'en';
  onManageSurplus?: () => void;
}

const getStatusIcon = (status: FinancialHealthStatus) => {
  switch (status) {
    case 'critical_deficit':
    case 'deficit':
    case 'no_budget':
      return AlertTriangle;
    case 'balanced':
      return CheckCircle;
    case 'healthy_surplus':
      return TrendingUp;
    case 'strong_surplus':
      return Sparkles;
  }
};

const getStatusMessage = (
  status: FinancialHealthStatus,
  delta: number,
  budgetTotal: number,
  incomeTotal: number,
  language: 'es' | 'en',
  formatCurrency: (amount: number) => string
): { title: string; description: string } => {
  switch (status) {
    case 'no_budget':
      return {
        title: language === 'es' ? 'Sin Presupuesto Activo' : 'No Active Budget',
        description: language === 'es'
          ? 'Aún no tienes presupuestos activos este mes. Ve a Presupuestos para crear tu distribución.'
          : 'You have no active budgets this month. Go to Budgets to create your distribution.'
      };
    
    case 'critical_deficit':
    case 'deficit':
      if (incomeTotal === 0) {
        return {
          title: language === 'es' ? '⚠️ Sin Ingresos Registrados' : '⚠️ No Income Recorded',
          description: language === 'es'
            ? `Tienes presupuesto de ${formatCurrency(budgetTotal)} pero no ingresos registrados este mes.`
            : `You have a budget of ${formatCurrency(budgetTotal)} but no income recorded this month.`
        };
      }
      return {
        title: language === 'es' 
          ? `Te faltan ${formatCurrency(Math.abs(delta))} para cubrir tu presupuesto`
          : `You need ${formatCurrency(Math.abs(delta))} to cover your budget`,
        description: language === 'es'
          ? 'Tus ingresos no cubren el presupuesto del mes. Considera registrar ingresos adicionales o revisar gastos.'
          : 'Your income doesn\'t cover this month\'s budget. Consider recording additional income or reviewing expenses.'
      };
    
    case 'balanced':
      return {
        title: language === 'es' ? '✓ Estás en equilibrio' : '✓ You\'re balanced',
        description: language === 'es'
          ? 'Tus ingresos cubren tu presupuesto perfectamente.'
          : 'Your income covers your budget perfectly.'
      };
    
    case 'healthy_surplus':
    case 'strong_surplus':
      return {
        title: language === 'es'
          ? `Tienes ${formatCurrency(delta)} disponibles`
          : `You have ${formatCurrency(delta)} available`,
        description: language === 'es'
          ? 'Tienes un superávit después de cubrir tu presupuesto. Considera distribuirlo estratégicamente.'
          : 'You have a surplus after covering your budget. Consider distributing it strategically.'
      };
  }
};

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  budgetPeriodData,
  currencySymbol = 'RD$',
  language = 'es',
  onManageSurplus
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { budgetTotal, incomeTotal, incomeSurplus } = budgetPeriodData;
  const { status, coverageRatio } = getFinancialHealth(budgetPeriodData);
  const colors = getStatusColor(status);
  const StatusIcon = getStatusIcon(status);
  
  const formatCurrency = (amount: number) => {
    const locale = language === 'es' ? 'es-DO' : 'en-US';
    return `${currencySymbol} ${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  
  const { title, description } = getStatusMessage(
    status,
    incomeSurplus,
    budgetTotal,
    incomeTotal,
    language,
    formatCurrency
  );
  
  const hasSurplus = status === 'healthy_surplus' || status === 'strong_surplus';
  const showCoverageBar = status !== 'no_budget';
  
  return (
    <div className="px-3 sm:px-4 mb-4 sm:mb-6">
      <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 ${colors.border} ${colors.bg}`}>
        {/* Collapsed View */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3 flex-1">
              <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 ${colors.icon}`} />
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm sm:text-base ${colors.text}`}>
                  {language === 'es' ? '💰 Estado Financiero' : '💰 Financial Status'}
                </h3>
                <p className={`text-xs sm:text-sm font-semibold mt-1 ${colors.text}`}>
                  {title}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg transition-colors ${colors.text} hover:bg-white/50 dark:hover:bg-black/20`}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
          
          {/* Actions */}
          {!isExpanded && hasSurplus && onManageSurplus && (
            <button
              onClick={onManageSurplus}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              {language === 'es' ? '💡 Administrar Superávit' : '💡 Manage Surplus'}
            </button>
          )}
        </div>
        
        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-current/10 space-y-4">
            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
            
            {/* Coverage Bar */}
            {showCoverageBar && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    {language === 'es' ? 'Cobertura' : 'Coverage'}
                  </span>
                  <span className={`text-xs sm:text-sm font-bold ${colors.text}`}>
                    {(coverageRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 sm:h-2.5 bg-white dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      status === 'critical_deficit' || status === 'deficit'
                        ? 'bg-red-500'
                        : status === 'balanced'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, coverageRatio * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Budget Breakdown */}
            {budgetTotal > 0 && (
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {language === 'es' ? 'Presupuesto del mes:' : 'Monthly budget:'}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {formatCurrency(budgetTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {language === 'es' ? 'Ingresos del mes:' : 'Monthly income:'}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {formatCurrency(incomeTotal)}
                  </span>
                </div>
                {incomeSurplus !== 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-current/10">
                    <span className={`font-semibold ${colors.text}`}>
                      {incomeSurplus < 0
                        ? (language === 'es' ? 'Faltante:' : 'Shortage:')
                        : (language === 'es' ? 'Superávit:' : 'Surplus:')}
                    </span>
                    <span className={`font-bold ${colors.text}`}>
                      {formatCurrency(Math.abs(incomeSurplus))}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions (Expanded) */}
            {hasSurplus && onManageSurplus && (
              <button
                onClick={onManageSurplus}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
              >
                {language === 'es' ? '💡 Administrar Superávit' : '💡 Manage Surplus'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
