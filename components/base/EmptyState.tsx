import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { text } from '../../styles/tokens';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    iconColor = 'text-slate-400',
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className={`p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4`}>
                <Icon className={`w-12 h-12 ${iconColor}`} />
            </div>

            <h3 className={`${text.sectionTitle} text-slate-800 dark:text-white mb-2`}>
                {title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6">
                {description}
            </p>

            {actionLabel && onAction && (
                <ActionButton variant="primary" onClick={onAction}>
                    {actionLabel}
                </ActionButton>
            )}
        </div>
    );
};
