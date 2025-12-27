import React, { useState, useEffect } from 'react';
import { AppSettings, QuickAction, Account, PlanId } from '../types';
import { Button } from './Button';
import { FINANCIAL_PLANS } from '../constants/financialPlans';
import {
  User, Sun, Moon, Monitor, Bell, ShieldCheck, ChevronRight, LogOut,
  Languages, Globe, Palette, CreditCard, Banknote, HelpCircle, X,
  Trash2, Building2, Wallet, Plus, ArrowUpRight, ArrowDownRight, Zap,
  Percent, Loader2, Sparkles, DollarSign, Check, Settings2, Target,
  Search, GripVertical, Download, Upload, FileText, Save, FileJson,
  Activity, AlertCircle, ChevronDown, Brain, Edit2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { backupService } from '../services/backupService';
import { reportService } from '../services/reportService';
import { useI18n } from '../contexts';
import { GeminiApiKeySettings } from './GeminiApiKeySettings';
import { APIUsageMonitor } from './APIUsageMonitor';
import { AVAILABLE_CURRENCIES, CurrencyOption } from '../constants';
import { ModalWrapper } from './ModalWrapper';
import { CurrencyModal } from './CurrencyModal';
import { AccountsHelpModal } from './AccountsHelpModal';

// Common financial institutions
const FINANCIAL_INSTITUTIONS = [
  { name: 'Banco Popular', country: 'DO', type: 'bank' },
  { name: 'Banreservas', country: 'DO', type: 'bank' },
  { name: 'BHD León', country: 'DO', type: 'bank' },
  { name: 'Scotiabank', country: 'DO', type: 'bank' },
  { name: 'Banco Santa Cruz', country: 'DO', type: 'bank' },
  { name: 'Banco Promerica', country: 'DO', type: 'bank' },
  { name: 'Asociación Popular', country: 'DO', type: 'bank' },
  { name: 'Banco Caribe', country: 'DO', type: 'bank' },
  { name: 'Banco López de Haro', country: 'DO', type: 'bank' },
  { name: 'Banco Vimenca', country: 'DO', type: 'bank' },
  { name: 'VISA', country: 'INT', type: 'card' },
  { name: 'Mastercard', country: 'INT', type: 'card' },
  { name: 'American Express', country: 'INT', type: 'card' },
  { name: 'PayPal', country: 'INT', type: 'wallet' },
  { name: 'Venmo', country: 'INT', type: 'wallet' },
  { name: 'tPago', country: 'DO', type: 'wallet' },
  { name: 'Otro', country: 'ALL', type: 'all' },
];

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  quickActions: QuickAction[];
  onUpdateQuickActions: (qa: QuickAction[]) => void;
  onLogout: () => void;
  userEmail: string;
  onOpenNotificationPrefs?: () => void;
  onOpenGoalsManagement?: () => void;
  onOpenDiagnostics?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings, onUpdateSettings, quickActions, onUpdateQuickActions, onLogout, userEmail, onOpenNotificationPrefs, onOpenGoalsManagement, onOpenDiagnostics
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'actions' | 'accounts' | 'data'>('general');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [showAccountsHelp, setShowAccountsHelp] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const { language, setLanguage, t } = useI18n();

  // Get current currency from settings
  const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === settings.currency.localCode) || AVAILABLE_CURRENCIES[0];

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // Filter currencies by search
  const filteredCurrencies = AVAILABLE_CURRENCIES.filter(c => {
    const search = currencySearch.toLowerCase();
    const name = language === 'es' ? c.nameEs : c.name;
    return c.code.toLowerCase().includes(search) ||
      name.toLowerCase().includes(search) ||
      c.symbol.toLowerCase().includes(search);
  });

  // Filter institutions by search
  const filteredInstitutions = FINANCIAL_INSTITUTIONS.filter(inst =>
    inst.name.toLowerCase().includes(institutionSearch.toLowerCase())
  );

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, acc) =>
    acc.isExcludedFromTotal ? sum : sum + acc.balance, 0
  );

  // Handle currency selection
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
    setShowCurrencyPicker(false);
    setCurrencySearch('');
  };

  useEffect(() => {
    storageService.getAccounts().then(setAccounts);
  }, []);

  // Sincronizar API key de settings a localStorage al cargar
  useEffect(() => {
    const apiKey = settings.aiConfig.userGeminiApiKey;
    if (apiKey && apiKey.trim() !== '') {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [settings.aiConfig.userGeminiApiKey]);

  const toggleNotifications = () => {
    onUpdateSettings({
      ...settings,
      notifications: { ...settings.notifications, enabled: !settings.notifications.enabled }
    });
  };

  const toggleAI = () => {
    onUpdateSettings({
      ...settings,
      aiConfig: { ...settings.aiConfig, enabled: !settings.aiConfig.enabled }
    });
  };

  const handleSaveApiKey = (apiKey: string) => {
    // Guardar en settings
    onUpdateSettings({
      ...settings,
      aiConfig: { ...settings.aiConfig, userGeminiApiKey: apiKey }
    });

    // También guardar en localStorage para que aiCoachService pueda acceder
    if (apiKey && apiKey.trim() !== '') {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const handleDeleteAction = (id: string) => {
    const updated = quickActions.filter(qa => qa.id !== id);
    onUpdateQuickActions(updated);
    storageService.saveQuickActions(updated);
  };

  const handleAddAction = () => {
    const newAction: QuickAction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'u1',
      name: 'Nuevo Botón',
      type: 'expense',
      icon: 'ArrowDownRight',
      color: 'slate',
      showOnHome: true,
      order: quickActions.length,
      defaults: {}
    };
    const updated = [...quickActions, newAction];
    onUpdateQuickActions(updated);
    storageService.saveQuickActions(updated);
  };

  const handleAddAccount = () => {
    const newAcc: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nueva Cuenta',
      type: 'bank',
      balance: 0,
      currency: settings.currency.localCode
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    storageService.saveAccounts(updated);
  };

  const handleDeleteAccount = async (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    await storageService.deleteAccount(id);
  };

  // Helper for Tab Labels
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'general': return 'General';
      case 'actions': return 'Accesos';
      case 'accounts': return 'Cuentas';
      case 'data': return 'Datos';
      default: return tab;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-24 lg:pb-8">
      <div className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">{t.settings.title}</h2>

        {/* Tabs */}
        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 sm:mb-6 overflow-x-auto no-scrollbar">
          {['general', 'actions', 'accounts', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab as any)}
              className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-lg transition-all capitalize whitespace-nowrap ${activeSection === tab ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {activeSection === 'general' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Two column grid on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Account */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-3 sm:mb-4">{t.settings.account}</h3>
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{t.auth.email}</p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>

                {onOpenDiagnostics && (
                  <Button variant="secondary" fullWidth onClick={onOpenDiagnostics} className="text-xs sm:text-sm py-2 mb-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border-indigo-100 dark:border-indigo-800">
                    <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> {language === 'es' ? 'Diagnóstico del Sistema' : 'System Diagnostics'}
                  </Button>
                )}

                <Button variant="danger" fullWidth onClick={onLogout} className="text-xs sm:text-sm py-2">
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> {t.auth.logout}
                </Button>
              </div>

              {/* Appearance */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-3 sm:mb-4">{t.settings.preferences}</h3>
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                      {settings.theme === 'dark' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : settings.theme === 'system' ? <Monitor className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{t.settings.theme}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Selecciona tu estilo preferido</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    {(['light', 'dark', 'system'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onUpdateSettings({ ...settings, theme: mode })}
                        className={`py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all capitalize ${settings.theme === mode
                          ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                      >
                        {mode === 'system' ? t.settings.system : mode === 'light' ? t.settings.light : t.settings.dark}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{t.settings.language}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Selecciona tu idioma preferido</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  <button
                    onClick={() => setLanguage('es')}
                    className={`py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'es'
                      ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {t.settings.spanish}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'en'
                      ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {t.settings.english}
                  </button>
                </div>
              </div>
            </div>

            {/* Currency Configuration */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-3 sm:mb-4">
                {language === 'es' ? 'Moneda' : 'Currency'}
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {/* Currency Selector Button */}
                <button
                  onClick={() => setShowCurrencyPicker(true)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currentCurrency.flag}</span>
                    <div className="text-left">
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        {currentCurrency.code} - {currentCurrency.symbol}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {language === 'es' ? currentCurrency.nameEs : currentCurrency.name}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>

                {/* Display Mode Toggle */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {language === 'es' ? 'Ver montos en' : 'Show amounts in'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                    <button
                      onClick={() => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, displayMode: 'local' }
                      })}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${settings.currency?.displayMode !== 'usd'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      {settings.currency.localCode} ({settings.currency.localSymbol})
                    </button>
                    <button
                      onClick={() => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, displayMode: 'usd' }
                      })}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${settings.currency?.displayMode === 'usd'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Exchange Rate Display */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'es' ? 'Tasa de Cambio' : 'Exchange Rate'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      1 USD = {settings.currency.rateUSDToLocal || (1 / settings.currency.rateToBase).toFixed(2)} {settings.currency.localCode}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 sm:left-3 top-2 sm:top-2.5 text-slate-400 text-xs sm:text-sm font-bold">$ 1 = </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-14 sm:pl-16 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white"
                      value={settings.currency.rateUSDToLocal || (1 / settings.currency.rateToBase)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        onUpdateSettings({
                          ...settings,
                          currency: {
                            ...settings.currency,
                            rateUSDToLocal: val,
                            rateToBase: 1 / val
                          }
                        });
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {language === 'es'
                      ? 'Especifica cuánto representa tu moneda local ante 1 Dólar.'
                      : 'Specify how much your local currency represents against 1 Dollar.'}
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {language === 'es' ? 'Vista previa de formato' : 'Format Preview'}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-900 dark:text-indigo-100">
                    {settings.currency.displayMode === 'usd'
                      ? `$ ${(1234.56 / (settings.currency.rateUSDToLocal || (1 / settings.currency.rateToBase))).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                      : `1,234.56 ${settings.currency.localCode}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Plan Selection */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                      {language === 'es' ? 'Modelo de Estrategia' : 'Strategy Model'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {language === 'es' ? 'Define cómo QUANTA analiza tu dinero' : 'Define how QUANTA analyzes your money'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {Object.values(FINANCIAL_PLANS).map((plan) => {
                  const isSelected = settings.aiConfig.selectedPlanId === plan.id || (!settings.aiConfig.selectedPlanId && plan.id === 'essentialist');
                  return (
                    <button
                      key={plan.id}
                      onClick={() => onUpdateSettings({
                        ...settings,
                        aiConfig: { ...settings.aiConfig, selectedPlanId: plan.id as PlanId }
                      })}
                      className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left ${isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{plan.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {plan.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI & Notifications */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-3 sm:mb-4">Inteligencia</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">Coach IA</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Consejos y análisis inteligentes</p>
                  </div>
                </div>
                <button
                  onClick={toggleAI}
                  className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors relative ${settings.aiConfig.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                >
                  <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 bg-white rounded-full absolute top-[3px] sm:top-1 transition-transform ${settings.aiConfig.enabled ? 'left-5 sm:left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Gemini API Key Configuration */}
              {settings.aiConfig.enabled && (
                <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <GeminiApiKeySettings
                    currentApiKey={settings.aiConfig.userGeminiApiKey || ''}
                    onSave={handleSaveApiKey}
                  />

                  {/* API Usage Monitor */}
                  <APIUsageMonitor />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">Notificaciones</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Alertas de pagos y servicios</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenNotificationPrefs && (
                    <button
                      onClick={onOpenNotificationPrefs}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                      title="Configuración avanzada"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={toggleNotifications}
                    className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors relative ${settings.notifications.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                  >
                    <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 bg-white rounded-full absolute top-[3px] sm:top-1 transition-transform ${settings.notifications.enabled ? 'left-5 sm:left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access - Goals & Notifications Configuration */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1">
                {language === 'es' ? 'Configuración Rápida' : 'Quick Settings'}
              </h3>

              {/* Goals Management Button */}
              {onOpenGoalsManagement && (
                <button
                  onClick={onOpenGoalsManagement}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        {language === 'es' ? 'Gestionar Metas' : 'Manage Goals'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {language === 'es' ? 'Editar montos, eliminar y agregar aportes' : 'Edit amounts, delete and add contributions'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </button>
              )}

              {/* Notification Settings Button */}
              {onOpenNotificationPrefs && (
                <button
                  onClick={onOpenNotificationPrefs}
                  className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-100 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                        {language === 'es' ? 'Configurar Notificaciones' : 'Configure Notifications'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {language === 'es' ? 'Alertas de pagos, metas y presupuesto' : 'Payment, goals and budget alerts'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </button>
              )}
            </div>
          </div>
        )}

        {activeSection === 'actions' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 sm:p-4 rounded-lg sm:rounded-xl text-indigo-800 dark:text-indigo-300 text-xs sm:text-sm mb-3 sm:mb-4">
              Personaliza los botones de tu Pantalla de Inicio. Toca el nombre para editar.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {quickActions.map((action, idx) => (
                <div key={action.id} className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-600 cursor-grab" />
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-${action.color}-50 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                      {action.type === 'income' && <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {action.type === 'expense' && <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {action.type === 'service' && <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <input
                        className="font-bold text-sm sm:text-base text-slate-800 dark:text-white bg-transparent outline-none focus:bg-slate-50 dark:focus:bg-slate-700 rounded px-1 -ml-1 w-24 sm:w-32"
                        value={action.name}
                        onChange={(e) => {
                          const updated = quickActions.map((qa, i) => i === idx ? { ...qa, name: e.target.value } : qa);
                          onUpdateQuickActions(updated);
                        }}
                        onBlur={() => storageService.saveQuickActions(quickActions)}
                      />
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {action.type === 'income' ? 'Ingreso' : action.type === 'expense' ? 'Gasto' : 'Servicio'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAction(action.id)}
                    className="p-1.5 sm:p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="secondary" fullWidth onClick={handleAddAction} className="border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 dark:bg-transparent text-xs sm:text-sm">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> Agregar Botón
            </Button>
          </div>
        )}

        {activeSection === 'accounts' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header with Help Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                  {language === 'es' ? 'Mis Cuentas' : 'My Accounts'}
                </h3>
                <button
                  onClick={() => setShowAccountsHelp(true)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'es' ? 'Agregar' : 'Add'}
              </button>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5 rounded-2xl text-white">
              <p className="text-indigo-200 text-xs font-medium mb-1">
                {language === 'es' ? 'Balance Total' : 'Total Balance'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold">
                {settings.currency.localSymbol} {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-indigo-200 text-[10px] sm:text-xs mt-2">
                {accounts.length} {language === 'es' ? 'cuentas registradas' : 'accounts registered'}
              </p>
            </div>

            {/* Info Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 sm:p-4 rounded-lg sm:rounded-xl text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm flex items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {language === 'es'
                  ? 'Registra tus cuentas bancarias, efectivo y billeteras digitales. El balance se actualiza automáticamente con tus transacciones.'
                  : 'Register your bank accounts, cash and digital wallets. Balance updates automatically with your transactions.'}
              </span>
            </div>

            {/* Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {accounts.map((acc) => (
                <div key={acc.id} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 ${acc.balance < 0
                  ? 'border-rose-200 dark:border-rose-800'
                  : 'border-slate-100 dark:border-slate-700'
                  } shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${acc.type === 'cash' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        acc.type === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          acc.type === 'card' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                            'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                        {acc.type === 'cash' ? <Banknote className="w-5 h-5" /> :
                          acc.type === 'bank' ? <Building2 className="w-5 h-5" /> :
                            acc.type === 'card' ? <CreditCard className="w-5 h-5" /> :
                              <Wallet className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white">{acc.name}</p>
                        {acc.institution && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{acc.institution}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingAccount(acc)}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'es' ? 'Balance' : 'Balance'}</span>
                    <span className={`text-lg font-bold ${acc.balance < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                      {settings.currency.localSymbol} {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Exclude from total toggle */}
                  {acc.isExcludedFromTotal && (
                    <div className="mt-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400 text-[10px] text-center">
                      {language === 'es' ? 'Excluida del total' : 'Excluded from total'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {accounts.length === 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  {language === 'es' ? 'No tienes cuentas registradas' : 'No accounts registered'}
                </p>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {language === 'es' ? 'Agregar primera cuenta' : 'Add first account'}
                </button>
              </div>
            )}

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Efectivo',
                    type: 'cash',
                    balance: 0,
                    currency: settings.currency.localCode,
                    updatedAt: Date.now()
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-dashed border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-xs sm:text-sm"
              >
                <Banknote className="w-4 h-4" /> Efectivo
              </button>
              <button
                onClick={() => setShowAddAccount(true)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs sm:text-sm"
              >
                <Building2 className="w-4 h-4" /> Banco
              </button>
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Tarjeta',
                    type: 'card',
                    balance: 0,
                    currency: settings.currency.localCode,
                    updatedAt: Date.now()
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-dashed border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs sm:text-sm"
              >
                <CreditCard className="w-4 h-4" /> Tarjeta
              </button>
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Billetera',
                    type: 'wallet',
                    balance: 0,
                    currency: settings.currency.localCode,
                    updatedAt: Date.now()
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-xs sm:text-sm"
              >
                <Wallet className="w-4 h-4" /> Billetera
              </button>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-2">
              {language === 'es' ? 'Gestión de Datos' : 'Data Management'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* BACKUP */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center group hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                  {language === 'es' ? 'Crear Respaldo' : 'Create Backup'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 flex items-center">
                  {language === 'es' ? 'Descarga una copia completa de tus datos.' : 'Download a full copy of all your data.'}
                </p>
                <Button fullWidth onClick={() => backupService.downloadBackup()} className="text-xs sm:text-sm py-2 bg-indigo-600 hover:bg-indigo-700">
                  <Download className="w-3.5 h-3.5 mr-2" /> JSON
                </Button>
              </div>

              {/* RESTORE */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center group hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                  {language === 'es' ? 'Restaurar Datos' : 'Restore Data'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 flex items-center">
                  {language === 'es' ? 'Recupera datos perdidos desde un archivo.' : 'Recover lost data from a file.'}
                </p>
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        if (confirm(language === 'es' ? '¿Estás seguro? Esto fusionará el respaldo con los datos actuales.' : 'Are you sure? This will merge the backup into your current data.')) {
                          backupService.restoreBackup(e.target.files[0]);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <Button fullWidth variant="secondary" className="text-xs sm:text-sm py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800">
                    <Upload className="w-3.5 h-3.5 mr-2" /> {language === 'es' ? 'Importar' : 'Import'}
                  </Button>
                </div>
              </div>

              {/* PDF REPORT */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center group hover:border-rose-500/50 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                  {language === 'es' ? 'Informe Profesional' : 'Pro Report'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 flex items-center">
                  {language === 'es' ? 'Genera un Estado Financiero en PDF.' : 'Generate a Financial Statement PDF.'}
                </p>
                <Button fullWidth variant="danger" onClick={() => reportService.generateFinancialReport()} className="text-xs sm:text-sm py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border-rose-100 dark:border-rose-800">
                  <Download className="w-3.5 h-3.5 mr-2" /> PDF
                </Button>
              </div>

              {/* CSV EXPORT (Legacy) */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center group hover:border-slate-400 transition-colors">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FileJson className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                  CSV / Excel
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8 flex items-center">
                  {language === 'es' ? 'Lista simple de transacciones.' : 'Simple transaction list.'}
                </p>
                <Button fullWidth variant="secondary" onClick={() => storageService.exportData()} className="text-xs sm:text-sm py-2">
                  <Download className="w-3.5 h-3.5 mr-2" /> CSV
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Currency Picker Modal */}
      <CurrencyModal
        isOpen={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Accounts Help Modal */}
      <AccountsHelpModal
        isOpen={showAccountsHelp}
        onClose={() => setShowAccountsHelp(false)}
      />

      {/* Add Account Modal */}
      <ModalWrapper isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} alignment="center">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-6 pb-2">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                {language === 'es' ? 'Agregar Cuenta' : 'Add Account'}
              </span>
            </div>
            <button onClick={() => setShowAddAccount(false)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {language === 'es' ? 'Selecciona tu banco o tipo de cuenta para comenzar.' : 'Select your bank or account type to get started.'}
            </p>

            {/* Institution Search */}
            <div className="relative mb-6">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar banco, tarjeta o billetera...' : 'Search bank, card or wallet...'}
                value={institutionSearch}
                onChange={(e) => setInstitutionSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredInstitutions.map((inst) => (
                <button
                  key={inst.name}
                  onClick={() => {
                    const newAcc: Account = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: inst.name === 'Otro' ? '' : inst.name,
                      institution: inst.name === 'Otro' ? '' : inst.name,
                      type: inst.type === 'all' ? 'bank' : inst.type as Account['type'],
                      balance: 0,
                      currency: settings.currency.localCode,
                      updatedAt: Date.now()
                    };
                    setEditingAccount(newAcc);
                    setShowAddAccount(false);
                    setInstitutionSearch('');
                  }}
                  className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left"
                >
                  <div className={`p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform ${inst.type === 'bank' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' :
                    inst.type === 'card' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' :
                      inst.type === 'wallet' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' :
                        'bg-slate-200 dark:bg-slate-600 text-slate-600'
                    }`}>
                    {inst.type === 'bank' ? <Building2 className="w-5 h-5" /> :
                      inst.type === 'card' ? <CreditCard className="w-5 h-5" /> :
                        inst.type === 'wallet' ? <Wallet className="w-5 h-5" /> :
                          <Plus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {inst.name === 'Otro' ? (language === 'es' ? 'Nueva institución personalizada' : 'New custom institution') : inst.name}
                    </p>
                    {inst.country !== 'ALL' && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 opacity-80">
                        {inst.country === 'DO' ? '🇩🇴 República Dominicana' : '🌎 Internacional'}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* Edit Account Modal */}
      {/* Edit Account Modal */}
      <ModalWrapper isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} alignment="center">
        {editingAccount && (
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            {/* Dynamic Header */}
            {(() => {
              const typeConfig = {
                bank: { color: 'blue', icon: Building2, label: language === 'es' ? 'Banco' : 'Bank' },
                card: { color: 'purple', icon: CreditCard, label: language === 'es' ? 'Tarjeta' : 'Card' },
                wallet: { color: 'amber', icon: Wallet, label: language === 'es' ? 'Billetera' : 'Wallet' },
                cash: { color: 'emerald', icon: Banknote, label: language === 'es' ? 'Efectivo' : 'Cash' },
                other: { color: 'slate', icon: Plus, label: language === 'es' ? 'Otros' : 'Other' }
              }[editingAccount.type as keyof typeof typeConfig] || { color: 'slate', icon: Plus, label: 'Otros' };

              const headColorClasses = {
                blue: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400',
                purple: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400',
                amber: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400',
                emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400',
                slate: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }[typeConfig.color as keyof typeof headColorClasses];

              return (
                <div className="flex justify-between items-center p-6 pb-2">
                  <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border ${headColorClasses}`}>
                    <typeConfig.icon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{typeConfig.label}</span>
                  </div>
                  <button onClick={() => setEditingAccount(null)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}

            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 max-h-[80vh]">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">
                  {accounts.find(a => a.id === editingAccount.id)
                    ? (language === 'es' ? 'Configurar Cuenta' : 'Configure Account')
                    : (language === 'es' ? 'Personalizar Nueva Cuenta' : 'Customize New Account')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'es' ? 'Ajusta los detalles y preferencias de esta institución.' : 'Adjust details and preferences for this institution.'}
                </p>
              </div>

              {/* General Info Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                      {language === 'es' ? 'Nombre Visual' : 'Display Name'}
                    </label>
                    <input
                      type="text"
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                      placeholder={language === 'es' ? 'Ej: Nómina Popular' : 'Ex: Popular Payroll'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                      {language === 'es' ? 'Institución' : 'Institution'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingAccount.institution || ''}
                        onChange={(e) => setEditingAccount({ ...editingAccount, institution: e.target.value })}
                        placeholder={language === 'es' ? 'Banco o Entidad' : 'Bank or Entity'}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                      />
                      <Building2 className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Account Type Grid */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    {language === 'es' ? 'Categoría de Cuenta' : 'Account Category'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: 'cash', icon: Banknote, label: 'Efectivo', color: 'emerald' },
                      { type: 'bank', icon: Building2, label: 'Banco', color: 'blue' },
                      { type: 'card', icon: CreditCard, label: 'Tarjeta', color: 'purple' },
                      { type: 'wallet', icon: Wallet, label: 'Billetera', color: 'amber' },
                    ].map(({ type, icon: Icon, label, color }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditingAccount({ ...editingAccount, type: type as Account['type'] })}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all group ${editingAccount.type === type
                          ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20 shadow-sm`
                          : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${editingAccount.type === type ? `text-${color}-600` : 'text-slate-400 group-hover:text-slate-600'
                          }`} />
                        <span className={`text-[9px] font-black uppercase ${editingAccount.type === type ? `text-${color}-700` : 'text-slate-400 group-hover:text-slate-600'
                          }`}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Balance Section */}
              <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white shadow-xl">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 block">
                  {language === 'es' ? 'Balance Actual Disponible' : 'Current Available Balance'}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black opacity-40">{settings.currency.localSymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAccount.balance}
                    onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                    className="flex-1 bg-transparent text-4xl font-black outline-none placeholder-white/20"
                    placeholder="0.00"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-[10px] opacity-60 italic leading-tight">
                    {language === 'es'
                      ? 'Usa montos negativos para representar deudas o sobregiros.'
                      : 'Use negative amounts to represent debts or overdrafts.'}
                  </p>
                </div>
              </div>

              {/* Commission Settings - Highly Enhanced */}
              {(editingAccount.type === 'bank' || editingAccount.type === 'card') && (
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                        {language === 'es' ? 'Impuestos y Mensajería' : 'Taxes & Fees'}
                      </h4>
                    </div>
                    {editingAccount.institution && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingAccount.institution) return;
                          setAiLoading(true);
                          setAiSuggestion(null);
                          const result = await geminiService.fetchBankCommissions(editingAccount.institution);
                          setAiLoading(false);
                          if (result) setAiSuggestion(result);
                        }}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                      >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {language === 'es' ? 'CONSULTAR IA' : 'ASK AI'}
                      </button>
                    )}
                  </div>

                  {aiSuggestion && (
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-300 mt-1 shrink-0" />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold leading-relaxed">
                            {language === 'es'
                              ? `Encontramos los datos para ${editingAccount.institution}: ${aiSuggestion.transferCommissionPercentage}% DGII, RD$ ${aiSuggestion.achFeeFixed} ACH.`
                              : `Found data for ${editingAccount.institution}: ${aiSuggestion.transferCommissionPercentage}% DGII, RD$ ${aiSuggestion.achFeeFixed} ACH.`}
                          </p>
                          <p className="text-[9px] opacity-70 mt-1 italic leading-tight">
                            {aiSuggestion.disclaimer}
                          </p>
                        </div>
                        <button onClick={() => setAiSuggestion(null)} className="p-1 hover:bg-white/20 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccount({
                            ...editingAccount,
                            transferCommissionPercentage: aiSuggestion.transferCommissionPercentage,
                            cardCommissionPercentage: aiSuggestion.cardCommissionPercentage,
                            achFeeFixed: aiSuggestion.achFeeFixed,
                            lbtrFeeFixed: aiSuggestion.lbtrFeeFixed
                          });
                          setAiSuggestion(null);
                        }}
                        className="w-full py-2 bg-white text-indigo-700 rounded-xl text-[11px] font-black shadow-sm hover:bg-indigo-50 transition-colors uppercase"
                      >
                        {language === 'es' ? 'Aplicar Configuración' : 'Apply Configuration'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        % DGII/Transferencia
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={editingAccount.transferCommissionPercentage || 0}
                          onChange={(e) => setEditingAccount({ ...editingAccount, transferCommissionPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        RD$ ACH (Fijo)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={editingAccount.achFeeFixed || 0}
                          onChange={(e) => setEditingAccount({ ...editingAccount, achFeeFixed: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                        />
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                      <Monitor className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {language === 'es' ? 'Excluir del Patrimonio' : 'Exclude from Net Worth'}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {language === 'es' ? 'No sumar este balance al total general.' : 'Do not add this balance to the total sum.'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingAccount.isExcludedFromTotal}
                    onChange={(e) => setEditingAccount({ ...editingAccount, isExcludedFromTotal: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-rose-600 focus:ring-rose-500 border-slate-300 pointer-events-auto"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 pb-4">
                {accounts.find(a => a.id === editingAccount.id) && (
                  <button
                    onClick={async () => {
                      if (confirm(language === 'es' ? '¿Estás seguro de eliminar esta cuenta?' : 'Are you sure you want to delete this account?')) {
                        await storageService.deleteAccount(editingAccount.id);
                        setAccounts(accounts.filter(a => a.id !== editingAccount.id));
                        setEditingAccount(null);
                      }
                    }}
                    className="p-3.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!editingAccount.name) return;
                    const existingAcc = accounts.find(a => a.id === editingAccount.id);
                    let updatedAccounts;
                    if (existingAcc) {
                      updatedAccounts = accounts.map(a => a.id === editingAccount.id ? editingAccount : a);
                    } else {
                      updatedAccounts = [...accounts, editingAccount];
                    }
                    await storageService.saveAccounts(updatedAccounts);
                    setAccounts(updatedAccounts);
                    setEditingAccount(null);
                  }}
                  disabled={!editingAccount.name}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalWrapper>
    </div>
  );
};