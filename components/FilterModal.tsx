import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { X, Filter, Calendar, Tag, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from './Button';
import { PAYMENT_METHODS } from '../constants';
import { storageService } from '../services/storageService';
import { CustomCategory } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { ModalWrapper } from './ModalWrapper';

interface FilterModalProps {
    filters: {
        search: string;
        category: string | null;
        dateFrom: string | null;
        dateTo: string | null;
        type: 'all' | 'income' | 'expense';
        paymentMethod: string | null;
    };
    onApply: (filters: any) => void;
    onClose: () => void;
}

const FilterModalComponent: React.FC<FilterModalProps> = ({ filters, onApply, onClose }) => {
    const { t, language } = useI18n();
    const [localFilters, setLocalFilters] = useState(filters);
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

    // Load custom categories on mount
    useEffect(() => {
        storageService.getCategories().then(setCustomCategories).catch(console.error);
    }, []);

    const handleApply = useCallback(() => {
        onApply(localFilters);
        onClose();
    }, [localFilters, onApply, onClose]);

    const handleReset = useCallback(() => {
        const resetFilters = {
            search: '',
            category: null,
            dateFrom: null,
            dateTo: null,
            type: 'all' as const,
            paymentMethod: null
        };
        setLocalFilters(resetFilters);
        onApply(resetFilters);
    }, [onApply]);

    // Get categories with translated names based on filter type
    const displayCategories = useMemo(() => {
        let filtered = customCategories;

        // Filter by type if not "all"
        if (localFilters.type === 'income') {
            filtered = customCategories.filter(cat => cat.type === 'income' || cat.type === 'both');
        } else if (localFilters.type === 'expense') {
            filtered = customCategories.filter(cat => cat.type === 'expense' || cat.type === 'both');
        }

        // Map to display format with translated names
        return filtered.map(cat => ({
            key: cat.key || cat.id,
            name: cat.name[language as 'es' | 'en'] || cat.name.es || cat.name.en
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [customCategories, localFilters.type, language]);

    return (
        <ModalWrapper isOpen={true} onClose={onClose} alignment="center">
            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md sm:max-w-lg rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">


                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t.filterModal.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

                    {/* Type Filter */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                            {t.filterModal.transactionType}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            <button
                                onClick={() => setLocalFilters({ ...localFilters, type: 'all' })}
                                className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all ${localFilters.type === 'all'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {t.filterModal.all}
                            </button>
                            <button
                                onClick={() => setLocalFilters({ ...localFilters, type: 'income' })}
                                className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1 ${localFilters.type === 'income'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t.filterModal.income}</span>
                            </button>
                            <button
                                onClick={() => setLocalFilters({ ...localFilters, type: 'expense' })}
                                className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1 ${localFilters.type === 'expense'
                                    ? 'bg-rose-600 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{t.filterModal.expenses}</span>
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                            <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                            {t.filterModal.category}
                        </label>
                        <select
                            value={localFilters.category || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value || null })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-100 text-xs sm:text-sm"
                        >
                            <option value="">{t.filterModal.allCategories}</option>
                            {displayCategories.map(cat => (
                                <option key={cat.key} value={cat.key}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                            {t.filterModal.dateRange}
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                                <label className="block text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">{t.filterModal.from}</label>
                                <input
                                    type="date"
                                    value={localFilters.dateFrom || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value || null })}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-100 text-[10px] sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">{t.filterModal.to}</label>
                                <input
                                    type="date"
                                    value={localFilters.dateTo || ''}
                                    onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value || null })}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-100 text-[10px] sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Filter */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                            {t.filterModal.paymentMethod}
                        </label>
                        <select
                            value={localFilters.paymentMethod || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, paymentMethod: e.target.value || null })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-100 text-xs sm:text-sm"
                        >
                            <option value="">{t.filterModal.allMethods}</option>
                            {PAYMENT_METHODS.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex gap-2 sm:gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        {t.filterModal.clear}
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:scale-[1.02]"
                    >
                        {t.filterModal.apply}
                    </button>
                </div>

            </div>
        </ModalWrapper>
    );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: FilterModalProps, nextProps: FilterModalProps) => {
    return (
        prevProps.filters === nextProps.filters &&
        prevProps.onApply === nextProps.onApply &&
        prevProps.onClose === nextProps.onClose
    );
};

export const FilterModal = memo(FilterModalComponent, arePropsEqual);
