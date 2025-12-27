import React from 'react';
import { X, Info, TrendingUp, TrendingDown, Target, PiggyBank, RefreshCw, Percent, AlertCircle } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { useCurrency } from '../hooks/useCurrency';

export interface AmountBreakdownItem {
  label: string;
  amount: number;
  type: 'addition' | 'subtraction' | 'neutral';
  icon?: 'income' | 'expense' | 'goal' | 'savings' | 'recurring' | 'percent' | 'info';
  description?: string;
}

interface AmountInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalAmount: number;
  breakdown: AmountBreakdownItem[];
  language?: 'es' | 'en';
  subtitle?: string;
}

export const AmountInfoModal: React.FC<AmountInfoModalProps> = ({
  isOpen,
  onClose,
  title,
  totalAmount,
  breakdown,
  language = 'es',
  subtitle
}) => {
  if (!isOpen) return null;

  const { formatAmount } = useCurrency();
  const formatCurrency = formatAmount;

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'income':
        return <TrendingUp className="w-4 h-4" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4" />;
      case 'goal':
        return <Target className="w-4 h-4" />;
      case 'savings':
        return <PiggyBank className="w-4 h-4" />;
      case 'recurring':
        return <RefreshCw className="w-4 h-4" />;
      case 'percent':
        return <Percent className="w-4 h-4" />;
      case 'info':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getItemColor = (type: 'addition' | 'subtraction' | 'neutral') => {
    switch (type) {
      case 'addition':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'subtraction':
        return 'text-rose-600 dark:text-rose-400';
      case 'neutral':
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getItemBg = (type: 'addition' | 'subtraction' | 'neutral') => {
    switch (type) {
      case 'addition':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'subtraction':
        return 'bg-rose-50 dark:bg-rose-900/20';
      case 'neutral':
        return 'bg-slate-50 dark:bg-slate-800/50';
    }
  };

  const getSign = (type: 'addition' | 'subtraction' | 'neutral', amount: number) => {
    if (type === 'neutral' || amount === 0) return '';
    return type === 'addition' ? '+' : '-';
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} alignment="start">
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] mt-16 mb-8 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-indigo-100 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Total Amount Display */}
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="text-xs font-bold text-white/80 uppercase tracking-wide mb-1">
              {language === 'es' ? 'Monto Total' : 'Total Amount'}
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              {language === 'es' ? 'Desglose del Monto' : 'Amount Breakdown'}
            </h4>
          </div>

          {breakdown.length === 0 ? (
            <div className="text-center py-8">
              <Info className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'es' ? 'No hay información de desglose disponible' : 'No breakdown information available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {breakdown.map((item, index) => (
                <div
                  key={index}
                  className={`${getItemBg(item.type)} rounded-xl p-4 border border-slate-200 dark:border-slate-800/50`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getItemBg(item.type)} ${getItemColor(item.type)}`}>
                      {getIcon(item.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.label}
                        </h5>
                        <span className={`text-base font-bold ${getItemColor(item.type)} whitespace-nowrap`}>
                          {getSign(item.type, item.amount)}{formatCurrency(item.amount)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            {language === 'es' ? 'Entendido' : 'Got it'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

