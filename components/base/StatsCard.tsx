import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { radius, shadows, text } from '../../styles/tokens';

interface StatsCardProps {
    gradient: string; // e.g., 'from-emerald-500 to-teal-600'
    mainLabel: string;
    mainAmount: string | number;
    secondaryLabel?: string;
    secondaryAmount?: string | number;
    showProgressBar?: boolean;
    progressPercentage?: number;
    tooltip?: string;
    children?: ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    gradient,
    mainLabel,
    mainAmount,
    secondaryLabel,
    secondaryAmount,
    showProgressBar,
    progressPercentage = 0,
    tooltip,
    children,
}) => {
    return (
        <div
            className={`relative overflow-hidden ${radius.card} p-5 text-white ${shadows.card} transition-colors bg-gradient-to-br ${gradient}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-1 group relative cursor-help">
                        <p className={`text-white/80 ${text.cardTitle} mb-1`}>
                            {mainLabel}
                        </p>
                        {tooltip && (
                            <>
                                <Info className="w-3 h-3 text-white/70" />
                                <div className="absolute left-0 top-6 w-56 p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                    {tooltip}
                                </div>
                            </>
                        )}
                    </div>
                    <h3 className={text.amountLarge}>
                        {typeof mainAmount === 'number' ? mainAmount.toLocaleString() : mainAmount}
                    </h3>
                </div>

                {secondaryLabel && secondaryAmount !== undefined && (
                    <div className="text-right">
                        <p className={`text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1`}>
                            {secondaryLabel}
                        </p>
                        <div className={`${text.amountMedium} text-white/90`}>
                            {typeof secondaryAmount === 'number' ? secondaryAmount.toLocaleString() : secondaryAmount}
                        </div>
                    </div>
                )}
            </div>

            {showProgressBar && (
                <div className="mb-3 relative">
                    <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full transition-all duration-300 shadow-sm bg-white/90"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {children}
        </div>
    );
};
