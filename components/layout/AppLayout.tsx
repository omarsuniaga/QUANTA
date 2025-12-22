import React from 'react';
import { User, DashboardStats } from '../../types';
import { TabType, SwipeHandlers, SwipeState } from '../../hooks/useAppNavigation';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileHeader } from './MobileHeader';
import { MainContent } from './MainContent';
import { BottomNavigation } from './BottomNavigation';

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

interface AppLayoutProps {
  user: User;
  stats: DashboardStats;
  isOnline: boolean;
  isDarkMode: boolean;
  currencySymbol: string;
  activeTab: TabType;
  onNavigateToTab: (tab: TabType) => void;
  onOpenNotificationCenter: () => void;
  onOpenActionModal: (mode: 'income' | 'expense' | 'service') => void;
  onOpenAICoach: () => void;
  swipeHandlers: SwipeHandlers;
  swipeState: SwipeState;
  mainContentRef: React.RefObject<HTMLElement>;
  t: TranslationObject;
  children: React.ReactNode;
}

/**
 * Layout principal de la aplicación autenticada.
 * Orquesta DesktopSidebar, MobileHeader, MainContent y BottomNavigation.
 * Responsivo: muestra diferentes layouts para desktop vs mobile.
 *
 * @param props - user, stats, activeTab, handlers, children
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  stats,
  isOnline,
  isDarkMode,
  currencySymbol,
  activeTab,
  onNavigateToTab,
  onOpenNotificationCenter,
  onOpenActionModal,
  onOpenAICoach,
  swipeHandlers,
  swipeState,
  mainContentRef,
  t,
  children,
}) => {
  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className="min-h-screen flex flex-col lg:flex-row max-w-7xl mx-auto relative overflow-hidden font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

        {/* Desktop Sidebar - hidden on mobile */}
        <DesktopSidebar
          user={user}
          stats={stats}
          isOnline={isOnline}
          isDarkMode={isDarkMode}
          currencySymbol={currencySymbol}
          activeTab={activeTab}
          onNavigateToTab={onNavigateToTab}
          onOpenNotificationCenter={onOpenNotificationCenter}
          onOpenActionModal={onOpenActionModal}
          onOpenAICoach={onOpenAICoach}
          t={t}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col max-w-3xl mx-auto w-full">

          {/* Mobile Header - hidden on desktop */}
          <MobileHeader
            user={user}
            stats={stats}
            isOnline={isOnline}
            isDarkMode={isDarkMode}
            currencySymbol={currencySymbol}
            onNavigateToSettings={() => onNavigateToTab('settings')}
            onOpenNotificationCenter={onOpenNotificationCenter}
            t={t}
          />

          {/* Main Content with swipe support */}
          <MainContent
            swipeHandlers={swipeHandlers}
            swipeState={swipeState}
            mainContentRef={mainContentRef}
          >
            {children}
          </MainContent>
        </div>

        {/* Bottom Navigation - hidden on desktop */}
        <BottomNavigation
          activeTab={activeTab}
          onNavigateToTab={onNavigateToTab}
        />
      </div>
    </div>
  );
};
