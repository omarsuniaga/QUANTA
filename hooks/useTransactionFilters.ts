import { useState, useMemo } from 'react';
import { Transaction } from '../types';

export type SortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'amount-desc' 
  | 'amount-asc' 
  | 'name-asc' 
  | 'name-desc';

export interface AmountRange {
  min?: number;
  max?: number;
}

export interface UseTransactionFiltersOptions {
  defaultSort?: SortOption;
  enableStatusFilter?: boolean;
  enableAmountFilter?: boolean;
}

export interface FilterableItem {
  id: string;
  description?: string;
  amount: number;
  category: string;
  date: string;
  status?: string;
  [key: string]: any;
}

/**
 * Universal hook for filtering and sorting transactions/items
 * Works with Expenses, Income, Budget items, etc.
 */
export function useTransactionFilters<T extends FilterableItem>(
  items: T[],
  options: UseTransactionFiltersOptions = {}
) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountRange, setAmountRange] = useState<AmountRange>({});
  const [sortBy, setSortBy] = useState<SortOption>(options.defaultSort || 'date-desc');

  // Apply all filters and sorting
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Search by text (description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    // 2. Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // 3. Filter by status (if enabled and applicable)
    if (statusFilter !== 'all' && options.enableStatusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }

    // 4. Filter by amount range
    if (amountRange.min !== undefined) {
      result = result.filter(item => item.amount >= amountRange.min!);
    }
    if (amountRange.max !== undefined) {
      result = result.filter(item => item.amount <= amountRange.max!);
    }

    // 5. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'name-asc':
          return (a.description || '').localeCompare(b.description || '');
        case 'name-desc':
          return (b.description || '').localeCompare(a.description || '');
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, categoryFilter, statusFilter, amountRange, sortBy, options.enableStatusFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAmountRange({});
    setSortBy(options.defaultSort || 'date-desc');
  };

  // Count active filters
  const activeFiltersCount = [
    searchQuery.trim() !== '',
    categoryFilter !== 'all',
    statusFilter !== 'all',
    amountRange.min !== undefined || amountRange.max !== undefined,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    // Filtered data
    filteredItems,
    resultCount: filteredItems.length,

    // Filter states
    searchQuery,
    categoryFilter,
    statusFilter,
    amountRange,
    sortBy,

    // Filter setters
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    setAmountRange,
    setSortBy,

    // Utilities
    clearFilters,
    activeFiltersCount,
    hasActiveFilters,
  };
}
