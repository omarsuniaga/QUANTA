import React, { useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { parseLocalDate } from '../utils/dateHelpers';
import {
    TrendingDown,
    CreditCard,
    Building2,
    ArrowLeft,
    Receipt
} from 'lucide-react';
import { Transaction, Account, AppSettings } from '../types';

interface CommissionsReportProps {
    transactions: Transaction[];
    accounts: Account[];
    settings: AppSettings;
    onBack: () => void;
}

const CommissionsReport: React.FC<CommissionsReportProps> = ({
    transactions,
    accounts,
    settings,
    onBack
}) => {
    const currencySymbol = settings.currency.localSymbol;
    const { language } = useI18n();

    // YTD Calculations
    const metrics = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        const ytdTransactions = transactions.filter(tx => {
            const txDate = parseLocalDate(tx.date);
            return txDate.getFullYear() === currentYear && (tx.commissionAmount || 0) > 0;
        });

        const totalLost = ytdTransactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0);

        const byAccount = accounts.reduce((acc, account) => {
            const accountCommissions = ytdTransactions
                .filter(tx => tx.paymentMethodId === account.id)
                .reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0);

            if (accountCommissions > 0) {
                acc.push({
                    name: account.name,
                    institution: account.institution,
                    type: account.type,
                    amount: accountCommissions
                });
            }
            return acc;
        }, [] as any[]);

        const byType = {
            bank: ytdTransactions
                .filter(tx => tx.paymentMethodType === 'bank')
                .reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0),
            card: ytdTransactions
                .filter(tx => tx.paymentMethodType === 'card')
                .reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0)
        };

        return { totalLost, byAccount, byType, count: ytdTransactions.length };
    }, [transactions, accounts]);

    const l = {
        es: {
            title: 'Reporte de Comisiones',
            subtitle: 'Capital perdido en comisiones bancarias (YTD)',
            totalLost: 'Total perdido este año',
            calculatedOn: 'Calculado sobre',
            transactions: 'transacciones',
            transfers: 'Transferencias',
            cards: 'Tarjetas',
            accountDetail: 'Detalle por cuenta',
            noCommissions: 'No hay comisiones registradas aún este año.',
            insightTitle: '💡 Recomendación Pro',
            insight: 'Has perdido un monto considerable en comisiones. Considera consolidar tus transferencias o buscar cuentas con tasas de comisión más bajas.'
        },
        en: {
            title: 'Commissions Report',
            subtitle: 'Capital lost to banking fees (YTD)',
            totalLost: 'Total lost this year',
            calculatedOn: 'Calculated over',
            transactions: 'transactions',
            transfers: 'Transfers',
            cards: 'Cards',
            accountDetail: 'Breakdown by account',
            noCommissions: 'No commissions recorded yet this year.',
            insightTitle: '💡 Pro Insight',
            insight: 'You have lost a significant amount in fees. Consider consolidating your transfers or looking for accounts with lower commission rates.'
        }
    }[language.startsWith('es') ? 'es' : 'en'];

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {l.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {l.subtitle}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium opacity-90">
                            {l.totalLost}
                        </p>
                    </div>
                    <h1 className="text-4xl font-black mb-1">
                        {currencySymbol}{metrics.totalLost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                    <p className="text-xs opacity-75">
                        {l.calculatedOn} {metrics.count} {l.transactions}
                    </p>
                </div>

                {/* Breakdown by Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                {l.transfers}
                            </span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {currencySymbol}{metrics.byType.bank.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                {l.cards}
                            </span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {currencySymbol}{metrics.byType.card.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Account List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase px-1">
                        {l.accountDetail}
                    </h3>
                    {metrics.byAccount.length > 0 ? (
                        metrics.byAccount.map((acc: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${acc.type === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                                        }`}>
                                        {acc.type === 'bank' ? <Building2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">{acc.name}</h4>
                                        <p className="text-[10px] text-slate-500">{acc.institution || (acc.type === 'bank' ? 'Banco' : 'Tarjeta')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                        -{currencySymbol}{acc.amount.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {((acc.amount / metrics.totalLost) * 100).toFixed(1)}% {language.startsWith('es') ? 'del total' : 'of total'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                                {l.noCommissions}
                            </p>
                        </div>
                    )}
                </div>

                {/* Insight */}
                {metrics.totalLost > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
                        <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                            {l.insightTitle}
                        </h4>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-300 leading-relaxed">
                            {l.insight}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommissionsReport;
