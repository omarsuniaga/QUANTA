import React from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export interface CategoryOption {
    value: string;
    label: string;
    count?: number;
}

export interface SortOption {
    value: string;
    label: string;
}

export interface StatusOption {
    value: string;
    label: string;
}

export interface FilterBarProps {
    // Search
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchPlaceholder?: string;

    // Category filter
    categoryFilter: string;
    onCategoryChange: (category: string) => void;
    categories: CategoryOption[];

    // Status filter (optional)
    statusFilter?: string;
    onStatusChange?: (status: string) => void;
    statusOptions?: StatusOption[];

    // Sort
    sortBy: string;
    onSortChange: (sort: string) => void;
    sortOptions: SortOption[];

    // Clear filters
    onClearFilters: () => void;
    activeFiltersCount: number;

    // Results count
    resultCount?: number;
    totalCount?: number;

    // Optional amount filter
    showAmountFilter?: boolean;
    amountRange?: { min?: number; max?: number };
    onAmountRangeChange?: (range: { min?: number; max?: number }) => void;
}

/**
 * Universal filter bar component
 * Reusable across Expenses, Income, Budget screens
 */
export function FilterBar({
    searchQuery,
    onSearchChange,
    searchPlaceholder,
    categoryFilter,
    onCategoryChange,
    categories,
    statusFilter,
    onStatusChange,
    statusOptions,
    sortBy,
    onSortChange,
    sortOptions,
    onClearFilters,
    activeFiltersCount,
    resultCount,
    totalCount,
    showAmountFilter,
    amountRange,
    onAmountRangeChange,
}: FilterBarProps) {
    const { language } = useI18n();

    return (
        <div className="space-y-3">
            {/* Main filter row */}
            <div className="flex gap-2 flex-wrap items-center">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder || (language === 'es' ? 'Buscar...' : 'Search...')}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>

                {/* Category filter */}
                <select
                    value={categoryFilter}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                >
                    <option value="all">
                        {language === 'es' ? 'Todas las categorías' : 'All categories'}
                    </option>
                    {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label} {cat.count !== undefined ? `(${cat.count})` : ''}
                        </option>
                    ))}
                </select>

                {/* Status filter (optional) */}
                {statusOptions && statusFilter !== undefined && onStatusChange && (
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}

                {/* Sort dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                >
                    {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Clear filters button */}
                {activeFiltersCount > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {language === 'es' ? 'Limpiar' : 'Clear'} ({activeFiltersCount})
                    </button>
                )}
            </div>

            {/* Active filters chips */}
            {activeFiltersCount > 0 && (
                <div className="flex gap-2 flex-wrap items-center">
                    {/* Search chip */}
                    {searchQuery && (
                        <FilterChip
                            label={`${language === 'es' ? 'Búsqueda' : 'Search'}: "${searchQuery}"`}
                            onRemove={() => onSearchChange('')}
                        />
                    )}

                    {/* Category chip */}
                    {categoryFilter !== 'all' && (
                        <FilterChip
                            label={categories.find((c) => c.value === categoryFilter)?.label || categoryFilter}
                            onRemove={() => onCategoryChange('all')}
                        />
                    )}

                    {/* Status chip */}
                    {statusFilter && statusFilter !== 'all' && statusOptions && (
                        <FilterChip
                            label={statusOptions.find((s) => s.value === statusFilter)?.label || statusFilter}
                            onRemove={() => onStatusChange?.('all')}
                        />
                    )}

                    {/* Amount range chip */}
                    {(amountRange?.min !== undefined || amountRange?.max !== undefined) && (
                        <FilterChip
                            label={`${amountRange.min ? `≥ $${amountRange.min}` : ''} ${amountRange.min && amountRange.max ? '&' : ''
                                } ${amountRange.max ? `≤ $${amountRange.max}` : ''}`}
                            onRemove={() => onAmountRangeChange?.({})}
                        />
                    )}

                    {/* Result count */}
                    {resultCount !== undefined && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                            {resultCount} {language === 'es' ? 'resultados' : 'results'}
                            {totalCount !== undefined && totalCount !== resultCount && (
                                <span className="text-slate-400 dark:text-slate-500">
                                    {' '}
                                    {language === 'es' ? 'de' : 'of'} {totalCount}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Filter chip component for active filters
 */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full p-0.5 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}
