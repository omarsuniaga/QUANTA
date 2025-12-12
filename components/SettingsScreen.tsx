import React, { useState, useEffect } from 'react';
import { AppSettings, QuickAction, Account } from '../types';
import { Button } from './Button';
import { Moon, Sun, Bell, Brain, LogOut, ArrowUpRight, ArrowDownRight, Zap, Trash2, Plus, GripVertical, CreditCard, Download, User, Monitor, Globe, DollarSign, Languages, ChevronDown, Search, Check, X, Settings2, Target, ChevronRight } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useI18n } from '../contexts';
import { GeminiApiKeySettings } from './GeminiApiKeySettings';
import { AVAILABLE_CURRENCIES, CurrencyOption } from '../constants';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  quickActions: QuickAction[];
  onUpdateQuickActions: (qa: QuickAction[]) => void;
  onLogout: () => void;
  userEmail: string;
  onOpenNotificationPrefs?: () => void;
  onOpenGoalsManagement?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings, onUpdateSettings, quickActions, onUpdateQuickActions, onLogout, userEmail, onOpenNotificationPrefs, onOpenGoalsManagement
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'actions' | 'accounts' | 'data'>('general');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const { language, setLanguage, t } = useI18n();

  // Get current currency from settings
  const currentCurrency = AVAILABLE_CURRENCIES.find(c => c.code === settings.currency.localCode) || AVAILABLE_CURRENCIES[0];

  // Filter currencies by search
  const filteredCurrencies = AVAILABLE_CURRENCIES.filter(c => {
    const search = currencySearch.toLowerCase();
    const name = language === 'es' ? c.nameEs : c.name;
    return c.code.toLowerCase().includes(search) || 
           name.toLowerCase().includes(search) ||
           c.symbol.toLowerCase().includes(search);
  });

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
    onUpdateSettings({
      ...settings,
      aiConfig: { ...settings.aiConfig, userGeminiApiKey: apiKey }
    });
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

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    storageService.saveAccounts(updated);
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

                {/* Exchange Rate Display */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'es' ? 'Tasa de Cambio' : 'Exchange Rate'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      1 {settings.currency.localCode} = {settings.currency.rateToBase.toFixed(4)} USD
                    </span>
                  </div>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2 sm:left-3 top-2 sm:top-2.5" />
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white"
                      value={settings.currency.rateToBase}
                      onChange={(e) => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, rateToBase: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {language === 'es' ? 'Ajusta manualmente si necesitas una tasa diferente.' : 'Adjust manually if you need a different rate.'}
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {language === 'es' ? 'Vista previa de formato' : 'Format Preview'}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-indigo-900 dark:text-indigo-100">
                    1,234.56 {settings.currency.localCode}
                  </p>
                </div>
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
                <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                  <GeminiApiKeySettings
                    currentApiKey={settings.aiConfig.userGeminiApiKey || ''}
                    onSave={handleSaveApiKey}
                  />
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
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 sm:p-4 rounded-lg sm:rounded-xl text-emerald-800 dark:text-emerald-400 text-xs sm:text-sm mb-3 sm:mb-4">
              Gestiona tus fondos (Bancos, Efectivo, Tarjetas, Billeteras digitales).
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {accounts.map((acc, idx) => (
                <div key={acc.id} className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                        acc.type === 'cash' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        acc.type === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        acc.type === 'card' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        <span className="text-sm sm:text-base">{acc.type === 'cash' ? '💵' : acc.type === 'bank' ? '🏦' : acc.type === 'card' ? '💳' : '👛'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          className="font-bold text-slate-800 dark:text-white bg-transparent outline-none focus:bg-slate-50 dark:focus:bg-slate-700 rounded px-1 -ml-1 w-full text-xs sm:text-sm truncate"
                          value={acc.name}
                          placeholder="Nombre de la cuenta"
                          onChange={(e) => {
                            const updated = accounts.map((a, i) => i === idx ? { ...a, name: e.target.value } : a);
                            setAccounts(updated);
                          }}
                          onBlur={() => storageService.saveAccounts(accounts)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1 sm:p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo</label>
                      <select
                        value={acc.type}
                        onChange={(e) => {
                          const updated = accounts.map((a, i) => i === idx ? { ...a, type: e.target.value as Account['type'] } : a);
                          setAccounts(updated);
                          storageService.saveAccounts(updated);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300"
                      >
                        <option value="cash">💵 Efectivo</option>
                        <option value="bank">🏦 Banco</option>
                        <option value="card">💳 Tarjeta</option>
                        <option value="wallet">👛 Billetera Digital</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1 block">Balance</label>
                      <div className="relative">
                        <span className="absolute left-1.5 sm:left-2 top-1 sm:top-1.5 text-slate-400 text-[10px] sm:text-xs">{settings.currency.localSymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-4 sm:pl-6 pr-1.5 sm:pr-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-slate-800 dark:text-white text-right"
                          value={acc.balance}
                          onChange={(e) => {
                            const updated = accounts.map((a, i) => i === idx ? { ...a, balance: parseFloat(e.target.value) || 0 } : a);
                            setAccounts(updated);
                          }}
                          onBlur={() => storageService.saveAccounts(accounts)}
                        />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Efectivo',
                    type: 'cash',
                    balance: 0,
                    currency: settings.currency.localCode
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-dashed border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-xs sm:text-sm"
              >
                💵 Efectivo
              </button>
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Banco',
                    type: 'bank',
                    balance: 0,
                    currency: settings.currency.localCode
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs sm:text-sm"
              >
                🏦 Banco
              </button>
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Tarjeta',
                    type: 'card',
                    balance: 0,
                    currency: settings.currency.localCode
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-dashed border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs sm:text-sm"
              >
                💳 Tarjeta
              </button>
              <button
                onClick={() => {
                  const newAcc: Account = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Billetera',
                    type: 'wallet',
                    balance: 0,
                    currency: settings.currency.localCode
                  };
                  const updated = [...accounts, newAcc];
                  setAccounts(updated);
                  storageService.saveAccounts(updated);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-dashed border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-xs sm:text-sm"
              >
                👛 Billetera
              </button>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <Download className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-200 dark:text-indigo-900/50 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white mb-1.5 sm:mb-2">Exportar Datos</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">Descarga todo tu historial de transacciones en formato CSV para Excel o Google Sheets.</p>
              <Button fullWidth onClick={() => storageService.exportData()} className="text-xs sm:text-sm py-2 sm:py-2.5">
                Descargar CSV
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Currency Picker Modal */}
      {showCurrencyPicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl animate-slide-up border border-white/20 dark:border-slate-700 max-h-[85vh] sm:max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {language === 'es' ? 'Seleccionar Moneda' : 'Select Currency'}
              </h2>
              <button 
                onClick={() => { setShowCurrencyPicker(false); setCurrencySearch(''); }}
                className="bg-slate-50 dark:bg-slate-800 p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Currency List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <div className="space-y-1">
                {filteredCurrencies.map((currency) => {
                  const isSelected = currency.code === settings.currency.localCode;
                  return (
                    <button
                      key={currency.code}
                      onClick={() => handleSelectCurrency(currency)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelected 
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
        </div>
      )}
    </div>
  );
};