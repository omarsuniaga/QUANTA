import React, { ReactNode } from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { text } from '../../styles/tokens';

interface SectionHeaderProps {
    title: string;
    icon: LucideIcon;
    iconColor: 'emerald' | 'rose' | 'purple' | 'slate';
    tooltip?: string;
    action?: ReactNode;
    subtitle?: string;
}

const iconColorClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    purple: 'text-purple-600 dark:text-purple-400',
    slate: 'text-slate-600 dark:text-slate-400',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    icon: Icon,
    iconColor,
    tooltip,
    action,
    subtitle,
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${iconColorClasses[iconColor]}`} />
                <div>
                    <div className="flex items-center gap-1 group relative">
                        <h3 className={`${text.sectionTitle} text-slate-800 dark:text-white`}>
                            {title}
                        </h3>
                        {tooltip && (
                            <>
                                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <div className="absolute left-0 top-6 w-56 p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                                    {tooltip}
                                </div>
                            </>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
