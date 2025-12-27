import React from 'react';
import {
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Settings as SettingsIcon,
  Brain,
  Zap,
  WifiOff,
} from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { TabType } from '../../hooks/useAppNavigation';
import { NotificationBell } from '../NotificationCenter';
import { useCurrency } from '../../hooks/useCurrency';

interface TranslationObject {
  nav: {
    dashboard: string;
    settings: string;
  };
  dashboard: {
    hello: string;
    availableToday: string;
  };
  common: {
    offline: string;
  };
}

interface DesktopSidebarProps {
  user: User;
  stats: DashboardStats;
  isOnline: boolean;
  isDarkMode: boolean;
  activeTab: TabType;
  onNavigateToTab: (tab: TabType) => void;
  onOpenNotificationCenter: () => void;
  onOpenActionModal: (mode: 'income' | 'expense' | 'service') => void;
  onOpenAICoach: () => void;
  t: TranslationObject;
}

/**
 * Sidebar lateral completo para desktop.
 * Incluye logo, info de usuario, navegación, y quick actions.
 * Hidden en mobile/tablet (< lg).
 *
 * @param props - user, stats, activeTab, handlers, translations
 */
export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  user,
  stats,
  isOnline,
  isDarkMode,
  activeTab,
  onNavigateToTab,
  onOpenNotificationCenter,
  onOpenActionModal,
  onOpenAICoach,
  t,
}) => {
  const { formatAmount } = useCurrency();
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:left-1/2 lg:-translate-x-[calc(50%+28rem)] xl:-translate-x-[calc(50%+32rem)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 overflow-y-auto">
      <div className="flex-1 flex flex-col p-6 pb-8">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">QUANTA</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Finance Tracker</p>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard.hello}, {user.name}
            </p>
            <NotificationBell onClick={onOpenNotificationCenter} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatAmount(stats.realBalance || stats.balance || 0)}
          </p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1">
            {t.dashboard.availableToday}
          </p>
          {!isOnline && (
            <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 w-fit">
              <WifiOff className="w-3 h-3" /> {t.common.offline}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <button
            onClick={() => onNavigateToTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'dashboard'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <LayoutGrid className="w-5 h-5" />
            {t.nav.dashboard}
          </button>
          <button
            onClick={() => onNavigateToTab('income')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'income'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            💰 Ingresos
          </button>
          <button
            onClick={() => onNavigateToTab('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'expenses'
              ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <ArrowDownRight className="w-5 h-5" />
            💸 Gastos
          </button>
          <button
            onClick={() => onNavigateToTab('budgets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'budgets'
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <PiggyBank className="w-5 h-5" />
            💰 Presupuestos
          </button>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'transactions'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <List className="w-5 h-5" />
            📋 Historial
          </button>
          <button
            onClick={() => onNavigateToTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            <SettingsIcon className="w-5 h-5" />
            {t.nav.settings}
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Acciones Rápidas</p>
          <div className="space-y-2">
            <button
              onClick={onOpenAICoach}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/30 dark:hover:to-violet-900/30 transition-colors border border-indigo-100 dark:border-indigo-800"
            >
              <Brain className="w-4 h-4" /> Coach IA
            </button>
            <button
              onClick={() => onOpenActionModal('income')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" /> Nuevo Ingreso
            </button>
            <button
              onClick={() => onOpenActionModal('expense')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
            >
              <ArrowDownRight className="w-4 h-4" /> Nuevo Gasto
            </button>
            <button
              onClick={() => onOpenActionModal('service')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Zap className="w-4 h-4" /> Nuevo Servicio
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
