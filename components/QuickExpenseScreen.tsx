import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Trash2, Edit3, Calendar, Search, Filter, 
  ChevronDown, ChevronLeft, ChevronRight, Zap, Receipt,
  Clock, TrendingDown, CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';
import { useTransactions, useSettings, useI18n } from '../contexts';

interface QuickExpenseScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

type DateFilter = 'today' | 'week' | 'month' | 'custom';

export const QuickExpenseScreen: React.FC<QuickExpenseScreenProps> = ({ isOpen, onClose }) => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { settings, currencySymbol, currencyCode } = useSettings();
  const { t, language } = useI18n();
  
  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get expense categories from settings
  const expenseCategories = useMemo(() => {
    return settings.categories?.filter(c => c.type === 'expense') || [];
  }, [settings.categories]);

  // Filter quick expenses (category = 'express' or gastos rápidos)
  const quickExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = transactions.filter(tx => tx.type === 'expense');
    
    // Apply date filter
    if (dateFilter === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      filtered = filtered.filter(tx => tx.date === todayStr);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(tx => new Date(tx.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(tx => new Date(tx.date) >= monthAgo);
    } else if (dateFilter === 'custom' && customFrom && customTo) {
      filtered = filtered.filter(tx => tx.date >= customFrom && tx.date <= customTo);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query)
      );
    }
    
    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateFilter, customFrom, customTo, searchQuery]);

  // Calculate total for filtered period
  const periodTotal = useMemo(() => {
    return quickExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  }, [quickExpenses]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    quickExpenses.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [quickExpenses]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return language === 'es' ? 'Hoy' : 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return language === 'es' ? 'Ayer' : 'Yesterday';
    }
    
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
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

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditCategory(tx.category);
    setEditDate(tx.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditDescription('');
    setEditCategory('');
    setEditDate('');
  };

  const saveEdit = async () => {
    if (!editingId || !editAmount) return;
    
    await updateTransaction(editingId, {
      amount: parseFloat(editAmount),
      description: editDescription.trim() || 'Gasto rápido',
      category: editCategory,
      date: editDate
    });
    
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'es' ? '¿Eliminar este gasto?' : 'Delete this expense?')) {
      await deleteTransaction(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {language === 'es' ? 'Gastos Express' : 'Quick Expenses'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'es' ? 'Registro rápido de gastos diarios' : 'Quick daily expense tracking'}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Add Form */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-shrink-0 w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 font-medium">
                {currencySymbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-2 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-white/50 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
            className="px-4 py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {showSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Date Filter Pills */}
          {(['today', 'week', 'month'] as DateFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilter === filter
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {filter === 'today' && (language === 'es' ? 'Hoy' : 'Today')}
              {filter === 'week' && (language === 'es' ? 'Esta semana' : 'This week')}
              {filter === 'month' && (language === 'es' ? 'Este mes' : 'This month')}
            </button>
          ))}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              dateFilter === 'custom'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {language === 'es' ? 'Personalizado' : 'Custom'}
          </button>

          <div className="flex-1" />
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'es' ? 'Buscar...' : 'Search...'}
              className="pl-8 pr-3 py-1.5 w-32 bg-slate-100 dark:bg-slate-700 border-0 rounded-full text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {showFilters && (
          <div className="mt-3 flex items-center gap-2 animate-in slide-in-from-top-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setDateFilter('custom'); }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-xs text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setDateFilter('custom'); }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-xs text-slate-700 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="p-4 shrink-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'es' ? 'Total del período' : 'Period total'}
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(periodTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {language === 'es' ? 'Transacciones' : 'Transactions'}
            </p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
              {quickExpenses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {language === 'es' ? 'No hay gastos en este período' : 'No expenses in this period'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {language === 'es' ? 'Agrega tu primer gasto arriba' : 'Add your first expense above'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedExpenses).map(([date, txs]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {formatDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs font-semibold text-rose-500">
                    {formatCurrency(txs.reduce((sum, tx) => sum + tx.amount, 0))}
                  </span>
                </div>

                {/* Transactions */}
                <div className="space-y-2">
                  {txs.map(tx => (
                    <div
                      key={tx.id}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      {editingId === tx.id ? (
                        /* Edit Mode */
                        <div className="p-3 space-y-3">
                          <div className="flex gap-2">
                            <div className="relative w-24">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                {currencySymbol}
                              </span>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-full pl-7 pr-2 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200"
                              />
                            </div>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                            />
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                            >
                              <option value="express">Express</option>
                              {expenseCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                            >
                              {language === 'es' ? 'Guardar' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                              {tx.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
                                {tx.category === 'express' ? 'Express' : tx.category}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(tx.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                              -{formatCurrency(tx.amount)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(tx)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickExpenseScreen;
