import React from 'react';
import { WifiOff, Settings as SettingsIcon } from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { NotificationBell } from '../NotificationCenter';

interface TranslationObject {
  dashboard: {
    hello: string;
    availableToday: string;
  };
  common: {
    offline: string;
  };
}

interface MobileHeaderProps {
  user: User;
  stats: DashboardStats;
  isOnline: boolean;
  isDarkMode: boolean;
  currencySymbol: string;
  onNavigateToSettings: () => void;
  onOpenNotificationCenter: () => void;
  t: TranslationObject;
}

/**
 * Header para mobile/tablet.
 * Muestra saludo, balance disponible, indicador offline, notificaciones y settings.
 * Hidden en desktop (lg+).
 *
 * @param props - user, stats, isOnline, isDarkMode, currencySymbol, handlers, translations
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  stats,
  isOnline,
  isDarkMode,
  currencySymbol,
  onNavigateToSettings,
  onOpenNotificationCenter,
  t,
}) => {
  return (
    <header
      className={`px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sticky top-0 z-30 border-b flex justify-between items-start transition-all backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 lg:hidden`}
    >
      {/* Left side - User info and balance */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t.dashboard.hello}, {user.name} 👋
          </p>
          {!isOnline && (
            <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" /> {t.common.offline}
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
          {currencySymbol}{' '}
          {(stats.realBalance > 0 ? stats.realBalance : stats.balance).toLocaleString('en-US', {
            minimumFractionDigits: 2,
          })}
        </h2>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded-md">
          {t.dashboard.availableToday}
        </p>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell onClick={onOpenNotificationCenter} />
        <button
          onClick={onNavigateToSettings}
          className="p-2 rounded-full transition-colors bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
