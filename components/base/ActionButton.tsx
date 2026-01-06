import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { radius, transitions } from '../../styles/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ActionButtonProps {
    variant: ButtonVariant;
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    icon?: LucideIcon;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
    variant,
    children,
    onClick,
    disabled = false,
    icon: Icon,
    fullWidth = false,
    size = 'md',
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${radius.button}
        ${transitions.default}
        ${fullWidth ? 'w-full' : ''}
        font-medium
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};
