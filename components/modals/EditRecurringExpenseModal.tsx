import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ActionButton } from '../base';
import { radius } from '../../styles/tokens';

interface EditRecurringExpenseModalProps {
    isOpen: boolean;
    itemName: string;
    currentAmount: number;
    onClose: () => void;
    onSave: (newAmount: number) => void;
}

export const EditRecurringExpenseModal: React.FC<EditRecurringExpenseModalProps> = ({
    isOpen,
    itemName,
    currentAmount,
    onClose,
    onSave,
}) => {
    const [amount, setAmount] = useState(currentAmount.toString());
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Por favor ingresa un monto válido');
            return;
        }

        onSave(numAmount);
        onClose();
    };

    const handleClose = () => {
        setAmount(currentAmount.toString());
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-slate-800 ${radius.card} max-w-md w-full shadow-xl`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Editar Monto
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Gasto
                        </label>
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-white">
                            {itemName}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nuevo Monto
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError('');
                            }}
                            className={`w-full px-3 py-2 ${radius.input} border ${error
                                    ? 'border-rose-500 dark:border-rose-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                } bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none`}
                            placeholder="0.00"
                            autoFocus
                        />
                        {error && (
                            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                            💡 Este cambio solo aplica para el mes actual. Los meses futuros mantendrán el monto original del template.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                    <ActionButton
                        variant="secondary"
                        onClick={handleClose}
                        fullWidth
                    >
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={handleSave}
                        fullWidth
                    >
                        Guardar Cambio
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};
