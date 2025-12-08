import React, { useState, useEffect } from 'react';
import { AppSettings, QuickAction, Account } from '../types';
import { Button } from './Button';
import { Moon, Sun, Bell, Brain, LogOut, ArrowUpRight, ArrowDownRight, Zap, Trash2, Plus, GripVertical, CreditCard, Download, User, Monitor, Globe, DollarSign, Languages } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useI18n } from '../contexts';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  quickActions: QuickAction[];
  onUpdateQuickActions: (qa: QuickAction[]) => void;
  onLogout: () => void;
  userEmail: string;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings, onUpdateSettings, quickActions, onUpdateQuickActions, onLogout, userEmail
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'actions' | 'accounts' | 'data'>('general');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { language, setLanguage, t } = useI18n();

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
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-24">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t.settings.title}</h2>

        {/* Tabs */}
        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto no-scrollbar">
          {['general', 'actions', 'accounts', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab as any)}
              className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-all capitalize whitespace-nowrap ${activeSection === tab ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {activeSection === 'general' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Account */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t.settings.account}</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{t.auth.email}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{userEmail}</p>
                </div>
              </div>
              <Button variant="danger" fullWidth onClick={onLogout} className="text-sm py-2">
                <LogOut className="w-4 h-4 mr-2" /> {t.auth.logout}
              </Button>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t.settings.preferences}</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                    {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : settings.theme === 'system' ? <Monitor className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{t.settings.theme}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona tu estilo preferido</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  {(['light', 'dark', 'system'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onUpdateSettings({ ...settings, theme: mode })}
                      className={`py-2 px-3 text-xs font-bold rounded-lg transition-all capitalize ${settings.theme === mode
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

            {/* Language Selector */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{t.settings.language}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona tu idioma preferido</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  <button
                    onClick={() => setLanguage('es')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${language === 'es'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {t.settings.spanish}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${language === 'en'
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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Moneda</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Configuración Local</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Moneda base: USD</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Código (ISO)</label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-white uppercase"
                      placeholder="USD"
                      value={settings.currency.localCode}
                      onChange={(e) => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, localCode: e.target.value.toUpperCase() }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Símbolo</label>
                    <input
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-white"
                      placeholder="$"
                      value={settings.currency.localSymbol}
                      onChange={(e) => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, localSymbol: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Tasa de Cambio (1 {settings.currency.localCode} = ? USD)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm font-bold text-slate-800 dark:text-white"
                      value={settings.currency.rateToBase}
                      onChange={(e) => onUpdateSettings({
                        ...settings,
                        currency: { ...settings.currency, rateToBase: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Usado para reportes globales en dólares.</p>
                </div>
              </div>
            </div>

            {/* AI & Notifications */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Inteligencia</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Coach IA</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Consejos y análisis inteligentes</p>
                  </div>
                </div>
                <button
                  onClick={toggleAI}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.aiConfig.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.aiConfig.enabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Notificaciones</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Alertas de pagos y servicios</p>
                  </div>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.notifications.enabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'actions' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl text-indigo-800 dark:text-indigo-300 text-sm mb-4">
              Personaliza los botones de tu Pantalla de Inicio. Toca el nombre para editar.
            </div>

            {quickActions.map((action, idx) => (
              <div key={action.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-300 dark:text-slate-600 cursor-grab" />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${action.color}-50 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                    {action.type === 'income' && <ArrowUpRight className="w-5 h-5" />}
                    {action.type === 'expense' && <ArrowDownRight className="w-5 h-5" />}
                    {action.type === 'service' && <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <input
                      className="font-bold text-slate-800 dark:text-white bg-transparent outline-none focus:bg-slate-50 dark:focus:bg-slate-700 rounded px-1 -ml-1 w-32"
                      value={action.name}
                      onChange={(e) => {
                        const updated = quickActions.map((qa, i) => i === idx ? { ...qa, name: e.target.value } : qa);
                        onUpdateQuickActions(updated);
                      }}
                      onBlur={() => storageService.saveQuickActions(quickActions)}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {action.type === 'income' ? 'Ingreso' : action.type === 'expense' ? 'Gasto' : 'Servicio'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAction(action.id)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <Button variant="secondary" fullWidth onClick={handleAddAction} className="border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 dark:bg-transparent">
              <Plus className="w-4 h-4 mr-2" /> Agregar Botón
            </Button>
          </div>
        )}

        {activeSection === 'accounts' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm mb-4">
              Gestiona tus fondos (Bancos, Efectivo, Billeteras).
            </div>

            {accounts.map((acc, idx) => (
              <div key={acc.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <input
                      className="font-bold text-slate-800 dark:text-white bg-transparent outline-none focus:bg-slate-50 dark:focus:bg-slate-700 rounded px-1 -ml-1 w-32"
                      value={acc.name}
                      onChange={(e) => {
                        const updated = accounts.map((a, i) => i === idx ? { ...a, name: e.target.value } : a);
                        setAccounts(updated);
                      }}
                      onBlur={() => storageService.saveAccounts(accounts)}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{acc.type} • {settings.currency.localCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{settings.currency.localSymbol}{acc.balance.toLocaleString()}</p>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="text-xs text-rose-500 font-medium hover:underline mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <Button variant="secondary" fullWidth onClick={handleAddAccount} className="border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 dark:bg-transparent">
              <Plus className="w-4 h-4 mr-2" /> Agregar Cuenta
            </Button>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <Download className="w-12 h-12 text-indigo-200 dark:text-indigo-900/50 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Exportar Datos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Descarga todo tu historial de transacciones en formato CSV para Excel o Google Sheets.</p>
              <Button fullWidth onClick={() => storageService.exportData()}>
                Descargar CSV
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};