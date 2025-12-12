import React, { useState, useMemo } from 'react';
import { 
  Zap, Plus, ChevronRight, TrendingDown, Receipt, CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';
import { useTransactions, useSettings, useI18n } from '../contexts';

interface QuickExpenseWidgetProps {
  onOpenFullScreen: () => void;
}

export const QuickExpenseWidget: React.FC<QuickExpenseWidgetProps> = ({ onOpenFullScreen }) => {
  const { transactions, addTransaction } = useTransactions();
  const { currencySymbol, currencyCode } = useSettings();
  const { language } = useI18n();
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get today's expenses
  const todayExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date === today)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 3);
  }, [transactions]);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date === today)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addTransaction({
        amount: parseFloat(amount),
        type: 'expense',
        category: 'express',
        description: description.trim() || 'Gasto rápido',
        date: today,
        paymentMethod: 'cash'
      });
      
      setAmount('');
      setDescription('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error adding quick expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-soft">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'es' ? 'Gasto Express' : 'Quick Expense'}
              </h3>
              <p className="text-[10px] text-white/70">
                {language === 'es' ? `Hoy: ${formatCurrency(todayTotal)}` : `Today: ${formatCurrency(todayTotal)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFullScreen}
            className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
          >
            {language === 'es' ? 'Ver todo' : 'View all'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleSubmit} className="p-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex gap-2">
          <div className="relative w-32 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              {currencySymbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-2 py-2.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'es' ? 'Descripción...' : 'Description...'}
            className="flex-1 min-w-0 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-600 text-white disabled:text-slate-400 rounded-xl font-semibold transition-colors flex items-center justify-center"
          >
            {showSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Recent Expenses (mini list) */}
      <div className="p-2">
        {todayExpenses.length === 0 ? (
          <div className="py-4 text-center">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              {language === 'es' ? 'Sin gastos hoy' : 'No expenses today'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {todayExpenses.map(tx => (
              <div
                key={tx.id}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {tx.description}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(tx.createdAt || Date.now()).toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickExpenseWidget;
