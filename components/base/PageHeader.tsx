import React from 'react';
import { LucideIcon } from 'lucide-react';
import { text, spacing, radius } from '../../styles/tokens';

interface PageHeaderProps {
    title: string;
    icon: LucideIcon;
    iconColor: 'emerald' | 'rose' | 'purple' | 'slate';
    onBack?: () => void;
}

const iconColorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    icon: Icon,
    iconColor,
    onBack,
}) => {
    return (
        <div className={`flex items-center justify-between mb-4 h-[40px] ${spacing.container}`}>
            <h1 className={`${text.pageTitle} text-slate-800 dark:text-white flex items-center gap-2`}>
                <div className={`p-2 ${radius.card} ${iconColorClasses[iconColor]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {title}
            </h1>
            {onBack && (
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    ← Back
                </button>
            )}
        </div>
    );
};
