import React from 'react';
import { Building2, ArrowDownRight, Bell, CreditCard, X } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { useI18n } from '../contexts/I18nContext';

interface AccountsHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AccountsHelpModal: React.FC<AccountsHelpModalProps> = ({ isOpen, onClose }) => {
    const { language } = useI18n();

    if (!isOpen) return null;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} alignment="center">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {language === 'es' ? '¿Para qué sirven las cuentas?' : 'What are accounts for?'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg mt-0.5">
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                                {language === 'es' ? 'Registra tus balances reales' : 'Track your real balances'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {language === 'es'
                                    ? 'Ingresa el monto actual de cada cuenta bancaria, efectivo o billetera digital.'
                                    : 'Enter the current amount in each bank account, cash or digital wallet.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mt-0.5">
                            <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                                {language === 'es' ? 'Actualización automática' : 'Automatic updates'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {language === 'es'
                                    ? 'Cuando registras ingresos o gastos, puedes seleccionar de qué cuenta provienen y el balance se actualiza.'
                                    : 'When you record income or expenses, you can select which account they come from and the balance updates.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg mt-0.5">
                            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                                {language === 'es' ? 'Alertas de saldo bajo' : 'Low balance alerts'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {language === 'es'
                                    ? 'Recibe notificaciones cuando el balance de una cuenta sea insuficiente para cubrir pagos próximos.'
                                    : 'Receive notifications when an account balance is insufficient to cover upcoming payments.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg mt-0.5">
                            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                                {language === 'es' ? 'Tarjetas de crédito' : 'Credit cards'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {language === 'es'
                                    ? 'Puedes registrar tarjetas con balance negativo para controlar tu deuda.'
                                    : 'You can register cards with negative balance to track your debt.'}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                    {language === 'es' ? 'Entendido' : 'Got it'}
                </button>
            </div>
        </ModalWrapper>
    );
};
