import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, CustomCategory } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Trash2, Edit2, RefreshCcw, Calendar, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, CalendarDays, MoreHorizontal, Repeat } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { storageService } from '../services/storageService';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  activeFilter?: { type: 'category' | 'date', value: string } | null;
  onClearFilter?: () => void;
  currencySymbol?: string;
  currencyCode?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete, activeFilter, onClearFilter, currencySymbol = '$', currencyCode = 'USD' }) => {
  const { t, language } = useI18n();
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'non-recurring' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Load custom categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await storageService.getCategories();
        setCustomCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Helper to get translated category name
  const getCategoryName = (categoryId: string): string => {
    // First try custom categories
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat) {
      return customCat.name[language as 'es' | 'en'] || customCat.name.es || customCat.name.en;
    }
    // Fallback to translations
    return (t.categories as Record<string, string>)[categoryId] || categoryId;
  };

  // Helper to get category icon
  const getCategoryIcon = (categoryId: string): any => {
    // First check default category icons
    if (CATEGORY_ICONS[categoryId]) {
      return CATEGORY_ICONS[categoryId];
    }
    // Then check custom categories
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat && customCat.icon) {
      // Try to find the icon in LucideIcons
      const iconName = customCat.icon;
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) {
        return IconComponent;
      }
    }
    // Fallback to default
    return MoreHorizontal;
  };

  // Helper to get category color
  const getCategoryColor = (categoryId: string): string => {
    // First check default category colors
    if (CATEGORY_COLORS[categoryId]) {
      return CATEGORY_COLORS[categoryId];
    }
    // Then check custom categories
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat && customCat.color) {
      // Convert Tailwind color name to hex (approximate)
      const colorMap: Record<string, string> = {
        'slate': '#64748b', 'gray': '#6b7280', 'zinc': '#71717a', 'neutral': '#737373', 'stone': '#78716c',
        'red': '#ef4444', 'orange': '#f97316', 'amber': '#f59e0b', 'yellow': '#eab308',
        'lime': '#84cc16', 'green': '#22c55e', 'emerald': '#10b981', 'teal': '#14b8a6',
        'cyan': '#06b6d4', 'sky': '#0ea5e9', 'blue': '#3b82f6', 'indigo': '#6366f1',
        'violet': '#8b5cf6', 'purple': '#a855f7', 'fuchsia': '#d946ef', 'pink': '#ec4899', 'rose': '#f43f5e'
      };
      return colorMap[customCat.color] || '#94a3b8';
    }
    // Fallback to slate
    return '#94a3b8';
  };
  
  // Sort transactions based on selected option
  const sorted = useMemo(() => {
    let copy = [...transactions];
    
    // Apply recurrence filter
    if (recurrenceFilter === 'recurring') {
      copy = copy.filter(tx => tx.isRecurring);
    } else if (recurrenceFilter === 'non-recurring') {
      copy = copy.filter(tx => !tx.isRecurring);
    } else if (recurrenceFilter === 'weekly') {
      copy = copy.filter(tx => tx.isRecurring && tx.frequency === 'weekly');
    } else if (recurrenceFilter === 'monthly') {
      copy = copy.filter(tx => tx.isRecurring && tx.frequency === 'monthly');
    } else if (recurrenceFilter === 'yearly') {
      copy = copy.filter(tx => tx.isRecurring && tx.frequency === 'yearly');
    }
    
    switch (sortBy) {
      case 'date-desc':
        return copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'date-asc':
        return copy.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount-desc':
        return copy.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return copy.sort((a, b) => a.amount - b.amount);
      default:
        return copy;
    }
  }, [transactions, sortBy, recurrenceFilter]);

  const sortLabels = {
    en: {
      'date-desc': 'Newest first',
      'date-asc': 'Oldest first',
      'amount-desc': 'Highest amount',
      'amount-asc': 'Lowest amount',
    },
    es: {
      'date-desc': 'Más reciente',
      'date-asc': 'Más antiguo',
      'amount-desc': 'Mayor monto',
      'amount-asc': 'Menor monto',
    }
  };

  const locale = language === 'es' ? 'es-ES' : 'en-US';

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg">
          {activeFilter ? t.transactions.noResults : t.transactions.noTransactions}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">
          {activeFilter 
            ? t.transactions.noResultsDesc
            : t.transactions.noTransactionsDesc}
        </p>
        {activeFilter && onClearFilter && (
          <button 
            onClick={onClearFilter}
            className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl"
          >
            {t.transactions.clearFilter}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 pb-24 lg:pb-8 animate-in fade-in duration-500">
      
      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        <button
          onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            sortBy.startsWith('date') 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {sortBy === 'date-desc' && <ArrowDown className="w-3 h-3" />}
          {sortBy === 'date-asc' && <ArrowUp className="w-3 h-3" />}
          {!sortBy.startsWith('date') && <ArrowUpDown className="w-3 h-3" />}
          {language === 'es' ? 'Fecha' : 'Date'}
        </button>
        
        <button
          onClick={() => setSortBy(sortBy === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            sortBy.startsWith('amount') 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          {sortBy === 'amount-desc' && <ArrowDown className="w-3 h-3" />}
          {sortBy === 'amount-asc' && <ArrowUp className="w-3 h-3" />}
          {!sortBy.startsWith('amount') && <ArrowUpDown className="w-3 h-3" />}
          {language === 'es' ? 'Monto' : 'Amount'}
        </button>
        
        <span className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium px-2">
          {sortLabels[language][sortBy]}
        </span>
      </div>
      
      {/* Recurrence Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        <button
          onClick={() => setRecurrenceFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'all'
              ? 'bg-slate-700 dark:bg-slate-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {language === 'es' ? 'Todos' : 'All'}
        </button>
        <button
          onClick={() => setRecurrenceFilter('recurring')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'recurring'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Repeat className="w-3 h-3" />
          {language === 'es' ? 'Recurrentes' : 'Recurring'}
        </button>
        <button
          onClick={() => setRecurrenceFilter('non-recurring')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'non-recurring'
              ? 'bg-rose-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <X className="w-3 h-3" />
          {language === 'es' ? 'Únicos' : 'One-time'}
        </button>
        <button
          onClick={() => setRecurrenceFilter('weekly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'weekly'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {language === 'es' ? 'Semanal' : 'Weekly'}
        </button>
        <button
          onClick={() => setRecurrenceFilter('monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'monthly'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {language === 'es' ? 'Mensual' : 'Monthly'}
        </button>
        <button
          onClick={() => setRecurrenceFilter('yearly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
            recurrenceFilter === 'yearly'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {language === 'es' ? 'Anual' : 'Yearly'}
        </button>
        {recurrenceFilter !== 'all' && (
          <span className="flex items-center text-[10px] text-indigo-500 dark:text-indigo-400 font-medium px-2">
            {sorted.length} {language === 'es' ? 'resultados' : 'results'}
          </span>
        )}
      </div>
      
      {/* Filter Banner */}
      {activeFilter && onClearFilter && (
        <div className="bg-indigo-600 dark:bg-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-200 dark:shadow-none mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">{t.transactions.activeFilter}</p>
              <p className="font-bold text-sm">
                {activeFilter.type === 'category' ? t.transactions.category : (language === 'es' ? 'Mes' : 'Month')}: {activeFilter.type === 'category' ? getCategoryName(activeFilter.value) : activeFilter.value}
              </p>
            </div>
          </div>
          <button 
            onClick={onClearFilter}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sorted.map((tx) => {
        const Icon = getCategoryIcon(tx.category);
        const color = getCategoryColor(tx.category);
        const dateObj = new Date(tx.date);

        return (
          <div key={tx.id} className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm mb-0.5 truncate">{tx.description || getCategoryName(tx.category)}</h4>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                  {tx.isRecurring && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800">
                      <RefreshCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {tx.frequency}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-2">
              <span className={`font-bold text-sm sm:text-base whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {currencyCode}
              </span>
              
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(tx); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};