import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Calendar, TrendingUp, TrendingDown, List } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const { formatAmount, convertAmount } = useCurrency();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: null as string | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
    type: 'all' as 'all' | 'income' | 'expense',
    paymentMethod: null as string | null
  });

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (searchTerm) {
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type);
    }

    // Category filter
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(t => parseLocalDate(t.date) >= parseLocalDate(filters.dateFrom!));
    }
    if (filters.dateTo) {
      result = result.filter(t => parseLocalDate(t.date) <= parseLocalDate(filters.dateTo!));
    }

    // Payment method filter
    if (filters.paymentMethod) {
      result = result.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    return result;
  }, [transactions, searchTerm, filters]);

  // Calculate stats for filtered results
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
  }, [filteredTransactions]);

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: null,
      dateFrom: null,
      dateTo: null,
      type: 'all',
      paymentMethod: null
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.type !== 'all' || filters.category || filters.dateFrom || filters.dateTo || filters.paymentMethod || searchTerm;

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Método de Pago'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.amount.toString(),
      t.paymentMethod || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-4 sm:p-6 pb-6 sm:pb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2">
          <List className="w-6 h-6 sm:w-7 sm:h-7" />
          Historial
        </h1>
        <p className="text-indigo-100 text-xs sm:text-sm">Todas tus transacciones</p>
      </div>

      {/* Search and Filters */}
      <div className="px-3 sm:px-4 -mt-3 sm:-mt-4 mb-3 sm:mb-4 space-y-2 sm:space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-lg"
          />
        </div>

        {/* Filter and Export Buttons */}
        <div className="flex gap-1.5 sm:gap-2 sm:mx-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold transition-all text-xs sm:text-sm ${hasActiveFilters
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              {hasActiveFilters ? `Filtros (${filteredTransactions.length})` : 'Filtrar'}
            </span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {hasActiveFilters && (
        <div className="px-3 sm:px-4 space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                  Ingresos
                </div>
                <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stats.income)}
                  </span>
                </div>
              </div>

              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                  Gastos
                </div>
                <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                  <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
                  <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(stats.expenses)}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">
                  Balance
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatCurrency(stats.balance)}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="px-3 sm:px-4 space-y-4 sm:space-y-6">
        <TransactionList
          transactions={filteredTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
          activeFilter={hasActiveFilters ? { type: 'category', value: 'filtered' } : null}
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
