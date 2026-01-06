import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { radius } from '../../styles/tokens';

interface PeriodSelectorProps {
    currentPeriod: string; // YYYY-MM format
    onPrevious: () => void;
    onNext: () => void;
    isCurrentMonth: boolean;
    language?: 'es' | 'en';
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
    currentPeriod,
    onPrevious,
    onNext,
    isCurrentMonth,
    language = 'es',
}) => {
    // Parse period to display label
    const [year, month] = currentPeriod.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    const periodLabel = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
            <button
                onClick={onPrevious}
                className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors"
                aria-label="Previous month"
            >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                {periodLabel}
            </span>

            <button
                onClick={onNext}
                disabled={isCurrentMonth}
                className={`p-1 rounded-md transition-colors ${isCurrentMonth
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-white dark:hover:bg-slate-600'
                    }`}
                aria-label="Next month"
            >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
        </div>
    );
};
