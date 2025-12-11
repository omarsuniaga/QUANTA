import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Buscar transacciones...',
    className = ''
}) => {
    const [localValue, setLocalValue] = useState(value);

    // Debounce search to avoid too many re-renders
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue]);

    // Sync external changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={`relative ${className}`}>
            <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm"
            />

            {localValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            )}
        </div>
    );
};
