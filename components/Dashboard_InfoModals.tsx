import React from 'react';
import { X, Info, Wallet, TrendingUp } from 'lucide-react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

interface BudgetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetTotal: number;
  monthlyExpenses: number;
  budgetStatus: {
    type: 'restante' | 'excedente' | 'neutral';
    amount: number;
  };
  formatCurrency: (amount: number) => string;
  language: 'es' | 'en';
}

export const BudgetInfoModal: React.FC<BudgetInfoModalProps> = ({
  isOpen,
  onClose,
  budgetTotal,
  monthlyExpenses,
  budgetStatus,
  formatCurrency,
  language
}) => {
  useModalScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'es' ? 'Presupuesto del Mes' : 'Monthly Budget'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
          {language === 'es' 
            ? 'El presupuesto muestra cuánto planeas gastar este mes y si estás dentro o fuera de ese límite.'
            : 'The budget shows how much you plan to spend this month and whether you are within or over that limit.'}
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {language === 'es' ? 'Presupuesto total:' : 'Total budget:'}
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(budgetTotal)}
            </span>
          </div>
          
          <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {language === 'es' ? 'Gastado a la fecha:' : 'Spent to date:'}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {formatCurrency(monthlyExpenses)}
            </span>
          </div>
          
          {budgetStatus.type === 'restante' && (
            <div className="flex justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {language === 'es' ? '✓ Restante:' : '✓ Remaining:'}
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(budgetStatus.amount)}
              </span>
            </div>
          )}
          
          {budgetStatus.type === 'excedente' && (
            <div className="flex justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {language === 'es' ? '⚠ Excedente:' : '⚠ Overspent:'}
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(budgetStatus.amount)}
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>{language === 'es' ? 'Fórmula:' : 'Formula:'}</strong> {language === 'es' ? 'Restante = Presupuesto - Gastos' : 'Remaining = Budget - Expenses'}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {language === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>
    </div>
  );
};

interface SurplusInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlySurplus: number;
  monthlyIncome: number;
  budgetTotal: number;
  formatCurrency: (amount: number) => string;
  language: 'es' | 'en';
}

export const SurplusInfoModal: React.FC<SurplusInfoModalProps> = ({
  isOpen,
  onClose,
  monthlySurplus,
  monthlyIncome,
  budgetTotal,
  formatCurrency,
  language
}) => {
  useModalScrollLock(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
      <div 
        className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-emerald-400"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {language === 'es' ? 'Superávit del Mes' : 'Monthly Surplus'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <p className="text-emerald-50 text-sm leading-relaxed mb-4">
          {language === 'es' 
            ? 'El superávit es el dinero disponible después de cubrir tu presupuesto. Es ideal para ahorros o metas financieras.'
            : 'The surplus is money available after covering your budget. It\'s ideal for savings or financial goals.'}
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between p-3 rounded-lg bg-white/20">
            <span className="text-sm font-medium text-white">
              {language === 'es' ? 'Ingresos del mes:' : 'Monthly income:'}
            </span>
            <span className="text-sm font-bold text-white">
              {formatCurrency(monthlyIncome)}
            </span>
          </div>
          
          <div className="flex justify-between p-3 rounded-lg bg-white/20">
            <span className="text-sm font-medium text-white">
              {language === 'es' ? 'Presupuesto total:' : 'Total budget:'}
            </span>
            <span className="text-sm font-bold text-white">
              {formatCurrency(budgetTotal)}
            </span>
          </div>
          
          <div className="flex justify-between p-3 rounded-lg bg-white/30">
            <span className="text-sm font-medium text-white">
              {language === 'es' ? '💰 Superávit:' : '💰 Surplus:'}
            </span>
            <span className="text-sm font-bold text-white">
              {formatCurrency(monthlySurplus)}
            </span>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-xl p-3 mb-4">
          <p className="text-white text-sm">
            <strong>{language === 'es' ? 'Fórmula:' : 'Formula:'}</strong> {language === 'es' ? 'Superávit = Ingresos - Presupuesto' : 'Surplus = Income - Budget'}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors"
        >
          {language === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>
    </div>
  );
};
