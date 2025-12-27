import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Plus, ChevronRight, TrendingDown, Receipt, CheckCircle2, Sparkles
} from 'lucide-react';
import { Transaction } from '../types';
import { useTransactions, useSettings, useI18n } from '../contexts';
import { storageService } from '../services/storageService';
import { parseLocalDate, getTodayDateString } from '../utils/dateHelpers';
import { useCurrency } from '../hooks/useCurrency';

interface QuickExpenseWidgetProps {
  onOpenFullScreen: () => void;
}

export const QuickExpenseWidget: React.FC<QuickExpenseWidgetProps> = ({ onOpenFullScreen }) => {
  const { transactions, addTransaction } = useTransactions();
  const { settings } = useSettings();
  const { language } = useI18n();
  const { formatAmount, convertAmount } = useCurrency();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('express');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  // Load categories (ONLY custom categories created by user)
  useEffect(() => {
    const loadCategories = async () => {
      let custom = [];
      try {
        custom = await storageService.getCategories();
      } catch { }
      // Filter only expense categories created by user
      const expenseCategories = custom.filter(c => c.type === 'expense');

      // If user has no categories, add a default "Express" option
      if (expenseCategories.length === 0) {
        expenseCategories.push({
          id: 'express',
          key: 'express',
          name: { es: 'Express', en: 'Express' },
          type: 'expense',
          color: 'amber'
        });
      }

      setCategories(expenseCategories);
      // Set first category as default
      if (expenseCategories.length > 0) {
        setCategory(expenseCategories[0].id);
      }
    };
    loadCategories();
  }, []);

  // Get today's expenses
  const todayExpenses = useMemo(() => {
    const today = getTodayDateString();
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date && tx.date.startsWith(today))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 3);
  }, [transactions]);

  const todayTotal = useMemo(() => {
    const today = getTodayDateString();
    return transactions
      .filter(tx => tx.type === 'expense' && tx.date && tx.date.startsWith(today))
      .reduce((sum, tx) => sum + convertAmount(tx.amount), 0);
  }, [transactions, convertAmount]);

  // Smart suggestion based on spending patterns and proportions
  const generateSmartSuggestion = useMemo(() => {
    if (!category || transactions.length < 5) return null;

    // Find most common descriptions for this category
    const categoryTransactions = transactions.filter(t =>
      t.type === 'expense' && t.category === category && t.description
    );

    if (categoryTransactions.length === 0) return null;

    // Group by description and count
    const descriptionMap = categoryTransactions.reduce((acc, t) => {
      const desc = t.description.trim();
      acc[desc] = (acc[desc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top 3 most common
    const topDescriptions = Object.entries(descriptionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([desc]) => desc);

    return topDescriptions.length > 0 ? topDescriptions[0] : null;
  }, [category, transactions]);

  // Update suggestion when category changes
  useEffect(() => {
    const suggestion = generateSmartSuggestion;
    if (suggestion && !description) {
      setSuggestedDescription(suggestion);
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
    }
  }, [category, generateSmartSuggestion, description]);

  // Apply suggestion
  const applySuggestion = () => {
    setDescription(suggestedDescription);
    setShowSuggestion(false);
  };

  const formatCurrency = (value: number) => {
    return formatAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const today = getTodayDateString();
      await addTransaction({
        amount: parseFloat(amount),
        type: 'expense',
        category: category || 'express',
        description: description.trim() || 'Gasto rápido',
        date: today,
        paymentMethod: 'cash',
        isRecurring: false
      });
      setAmount('');
      setDescription('');
      setCategory('express');
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
        <div className="flex gap-2 flex-wrap">
          <div className="relative w-28 shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              {formatAmount(0).replace(/[0-9.,\s]/g, '')}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-2 py-2.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex-1 min-w-[180px] relative">
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value) setShowSuggestion(false);
              }}
              placeholder={language === 'es' ? 'Descripción...' : 'Description...'}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {showSuggestion && suggestedDescription && (
              <button
                type="button"
                onClick={applySuggestion}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-medium rounded-lg transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {suggestedDescription.slice(0, 15)}{suggestedDescription.length > 15 ? '...' : ''}
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-auto min-w-[90px] max-w-[120px] px-2 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name?.[language] || cat.name?.es || cat.name?.en || cat.key}
              </option>
            ))}
          </select>
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
