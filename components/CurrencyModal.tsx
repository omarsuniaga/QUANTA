import React, { useState } from 'react';
import { Search, Check, Globe, X } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';
import { useI18n } from '../contexts/I18nContext';
import { AppSettings } from '../types';
import { AVAILABLE_CURRENCIES, CurrencyOption } from '../constants';

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings
}) => {
    const { language } = useI18n();
    const [currencySearch, setCurrencySearch] = useState('');

    // Filter currencies by search
    const filteredCurrencies = AVAILABLE_CURRENCIES.filter(c => {
        const search = currencySearch.toLowerCase();
        const name = language === 'es' ? c.nameEs : c.name;
        return c.code.toLowerCase().includes(search) ||
            name.toLowerCase().includes(search) ||
            c.symbol.toLowerCase().includes(search);
    });

    const handleSelectCurrency = (currency: CurrencyOption) => {
        onUpdateSettings({
            ...settings,
            currency: {
                ...settings.currency,
                localCode: currency.code,
                localSymbol: currency.symbol,
                rateToBase: currency.rateToUSD,
                flag: currency.flag,
                name: language === 'es' ? currency.nameEs : currency.name
            }
        });
        onClose();
        setCurrencySearch('');
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} alignment="center">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {language === 'es' ? 'Seleccionar Moneda' : 'Select Currency'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="bg-slate-50 dark:bg-slate-800 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={language === 'es' ? 'Buscar moneda...' : 'Search currency...'}
                            value={currencySearch}
                            onChange={(e) => setCurrencySearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Currency List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {filteredCurrencies.map((currency) => {
                            const isSelected = currency.code === settings.currency.localCode;
                            return (
                                <button
                                    key={currency.code}
                                    onClick={() => handleSelectCurrency(currency)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent'
                                        }`}
                                >
                                    <span className="text-2xl">{currency.flag}</span>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white">{currency.code}</span>
                                            <span className="text-slate-400 text-sm">{currency.symbol}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {language === 'es' ? currency.nameEs : currency.name}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                        {filteredCurrencies.length === 0 && (
                            <div className="text-center py-8">
                                <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {language === 'es' ? 'No se encontraron monedas' : 'No currencies found'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
};
