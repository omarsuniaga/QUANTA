import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Download, List, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Calculator, Calendar } from 'lucide-react';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';
import { FilterModal } from './FilterModal';
import { parseLocalDate } from '../utils/dateHelpers';
import { useCurrency } from '../hooks/useCurrency';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onEdit,
  onDelete
}) => {
  const { formatAmount, convertAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Period State (YYYY-MM)
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, monthVal] = currentPeriod.split('-').map(Number);
  const monthIndex = monthVal - 1;

  // Change Month Logic
  const changeMonth = (direction: 'next' | 'prev') => {
    const date = new Date(year, monthIndex + (direction === 'next' ? 1 : -1), 1);
    setCurrentPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return currentPeriod === current;
  }, [currentPeriod]);

  // Quick Filters state
  const [quickFilter, setQuickFilter] = useState<'all' | 'recurring' | 'unique'>('all');

  // Detailed filters
  const [filters, setFilters] = useState({
    category: null as string | null,
    dateFrom: null as string | null, // These can override the month selector if set
    dateTo: null as string | null,
    type: 'all' as 'all' | 'income' | 'expense',
    paymentMethod: null as string | null
  });

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Period Filter (Only if Date Range is NOT manually set in detailed filters)
    if (!filters.dateFrom && !filters.dateTo) {
      result = result.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
      });
    }

    // 2. Search filter
    if (searchTerm) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 3. Quick Filter (Recurring/Unique)
    if (quickFilter !== 'all') {
      // Assuming we have a way to know if it is recurring. 
      // The Transaction model might have 'isRecurring' or similar. 
      // Checking types.ts previously: Transaction has 'recurringTemplateId'.
      if (quickFilter === 'recurring') {
        result = result.filter(t => !!t.recurringTemplateId || !!t.recurringMonthlyItemId);
      } else if (quickFilter === 'unique') {
        result = result.filter(t => !t.recurringTemplateId && !t.recurringMonthlyItemId);
      }
    }

    // 4. Detailed Filters
    if (filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.dateFrom) {
      result = result.filter(t => parseLocalDate(t.date) >= parseLocalDate(filters.dateFrom!));
    }
    if (filters.dateTo) {
      result = result.filter(t => parseLocalDate(t.date) <= parseLocalDate(filters.dateTo!));
    }
    if (filters.paymentMethod) {
      result = result.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    return result.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [transactions, searchTerm, filters, currentPeriod, quickFilter, year, monthIndex]);

  // Stats for the current view
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount), 0);

    return {
      total: filteredTransactions.length,
      income,
      expenses,
      balance: income - expenses
    };
  }, [filteredTransactions, convertAmount]);

  const formatCurrency = (amount: number) => formatAmount(amount);

  const handleApplyFilters = (newFilters: any) => setFilters(newFilters);

  const handleClearFilters = () => {
    setFilters({
      category: null,
      dateFrom: null,
      dateTo: null,
      type: 'all',
      paymentMethod: null
    });
    setSearchTerm('');
    setQuickFilter('all');
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Método de Pago'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.amount.toString(),
      t.paymentMethod || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${currentPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFiltered = filters.type !== 'all' || filters.category || filters.dateFrom || filters.dateTo || filters.paymentMethod || searchTerm || quickFilter !== 'all';

  return (
    <div className="flex-1 overflow-y-auto pb-20 bg-slate-50 dark:bg-slate-900">
      {/* Header (Unified) */}
      <div className="bg-white dark:bg-slate-800 pb-6 pt-2 px-4 shadow-sm sticky top-0 z-10 transition-colors">
        <div className="flex items-center justify-between mb-4 h-[40px]">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
              <List className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            Historial
          </h1>

          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector (Consolidated with Search? No, separate block like Income) */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 mb-4">
          <button onClick={() => changeMonth('prev')} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
            {new Date(currentPeriod + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => changeMonth('next')}
            className={`p-1 rounded-md transition-colors ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-600'}`}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Search Bar (Unified Style) */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-slate-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 mt-4 mb-6">
        {/* Main Stats Card (Grayscale Theme) */}
        <div className="bg-gradient-to-br from-slate-700 to-zinc-800 rounded-2xl p-5 text-white shadow-lg shadow-slate-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">
                Balance del Mes
              </p>
              <h3 className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(stats.balance)}
              </h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-emerald-300 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Ingresos
              </p>
              <p className="text-lg font-bold text-emerald-100">
                {formatCurrency(stats.income)}
              </p>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20">
              <p className="text-rose-300 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Gastos
              </p>
              <p className="text-lg font-bold text-rose-100">
                {formatCurrency(stats.expenses)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters (Pills) */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setQuickFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${quickFilter === 'all'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
        >
          Todos
        </button>
        <button
          onClick={() => setQuickFilter('recurring')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${quickFilter === 'recurring'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
        >
          Recurrentes
        </button>
        <button
          onClick={() => setQuickFilter('unique')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${quickFilter === 'unique'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
        >
          Únicos
        </button>

        <button
          onClick={() => setShowFilterModal(true)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${(filters.category || filters.type !== 'all' || filters.paymentMethod)
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
        >
          <Filter className="w-3 h-3" />
          Más filtros
        </button>
      </div>

      {/* Transaction List */}
      <div className="px-4 pb-4">
        <TransactionList
          transactions={filteredTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
          activeFilter={isFiltered ? { type: 'category', value: 'filtered' } : null}
          onClearFilter={handleClearFilters}
        />
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
};
