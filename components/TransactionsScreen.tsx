import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Calendar, TrendingUp, TrendingDown, List } from 'lucide-react';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';
import { FilterModal } from './FilterModal';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  currencySymbol?: string;
  currencyCode?: string;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onEdit,
  onDelete,
  currencySymbol = '$',
  currencyCode = 'MXN'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
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
      result = result.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      result = result.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
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
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

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
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 p-6 pb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <List className="w-7 h-7" />
          Historial
        </h1>
        <p className="text-indigo-100 text-sm">Todas tus transacciones</p>
      </div>

      {/* Search and Filters */}
      <div className="px-4 -mt-4 mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-lg"
          />
        </div>

        {/* Filter and Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilterModal(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
              hasActiveFilters
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">
              {hasActiveFilters ? `Filtros (${filteredTransactions.length})` : 'Filtrar'}
            </span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {hasActiveFilters && (
        <div className="px-4 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Ingresos
                </div>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stats.income)}
                  </span>
                </div>
              </div>

              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Gastos
                </div>
                <div className="flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(stats.expenses)}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Balance
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {formatCurrency(stats.balance)}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto">
        <TransactionList
          transactions={filteredTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
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
