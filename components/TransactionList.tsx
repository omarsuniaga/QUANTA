import React from 'react';
import { Transaction, Category } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Trash2, Edit2, RefreshCcw, Calendar, Filter, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  activeFilter?: { type: 'category' | 'date', value: string } | null;
  onClearFilter?: () => void;
  currencySymbol?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete, activeFilter, onClearFilter, currencySymbol = '$' }) => {
  // Sort by date descending
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-slate-900 dark:text-white font-semibold text-lg">
          {activeFilter ? 'Sin resultados' : 'Sin transacciones'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">
          {activeFilter 
            ? 'No hay transacciones que coincidan con tu filtro actual.' 
            : 'Comienza agregando tus ingresos y gastos para verlos aquí.'}
        </p>
        {activeFilter && onClearFilter && (
          <button 
            onClick={onClearFilter}
            className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl"
          >
            Limpiar Filtro
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-500">
      
      {/* Filter Banner */}
      {activeFilter && onClearFilter && (
        <div className="bg-indigo-600 dark:bg-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-200 dark:shadow-none mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">Filtro Activo</p>
              <p className="font-bold text-sm">
                {activeFilter.type === 'category' ? 'Categoría' : 'Mes'}: {activeFilter.value}
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

      {sorted.map((t) => {
        const Icon = CATEGORY_ICONS[t.category] || CATEGORY_ICONS[Category.Other];
        const color = CATEGORY_COLORS[t.category] || CATEGORY_COLORS[Category.Other];
        const dateObj = new Date(t.date);

        return (
          <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0.5">{t.description || t.category}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  {t.isRecurring && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-indigo-100 dark:border-indigo-800">
                      <RefreshCcw className="w-3 h-3" /> {t.frequency}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={`font-bold text-base ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </span>
              
              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
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