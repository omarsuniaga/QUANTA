import React, { useEffect, useCallback } from 'react';
// Lazy load screens to optimize initial load
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const IncomeScreen = React.lazy(() => import('./components/IncomeScreen').then(m => ({ default: m.IncomeScreen })));
const ExpensesScreen = React.lazy(() => import('./components/ExpensesScreen').then(m => ({ default: m.ExpensesScreen })));
const BudgetsScreen = React.lazy(() => import('./components/BudgetsScreen').then(m => ({ default: m.BudgetsScreen })));
const TransactionsScreen = React.lazy(() => import('./components/TransactionsScreen').then(m => ({ default: m.TransactionsScreen })));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const LandingPage = React.lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const AdminDiagnosticsScreen = React.lazy(() => import('./components/AdminDiagnosticsScreen').then(m => ({ default: m.AdminDiagnosticsScreen })));

// Widgets and small components remain direct imports as they are small
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { GoalsWidget, PromoCarousel } from './components/HomeWidgets';
import { AICoachWidget } from './components/AICoachWidget';
import { QuickExpenseWidget } from './components/QuickExpenseWidget';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

// Layout components
import { AppLayout } from './components/layout/AppLayout';
import { ModalRenderer } from './components/modals/ModalRenderer';
import { ScreenRenderer } from './components/modals/ScreenRenderer';

// Contexts
import { useI18n, useAuth, useTransactions, useSettings, useToast } from './contexts';

// Custom hooks
import { useAppNavigation } from './hooks/useAppNavigation';
import { useModalManager } from './hooks/useModalManager';
import { useScreenManager } from './hooks/useScreenManager';
import { useNotificationSystem } from './hooks/useNotificationSystem';
import { useTransactionHandlers } from './hooks/useTransactionHandlers';
import { useGoalHandlers } from './hooks/useGoalHandlers';
import { useBudgetHandlers } from './hooks/useBudgetHandlers';
import { useBudgetPeriod } from './hooks/useBudgetPeriod';

// Services
import { storageService } from './services/storageService';

export default function App() {
  // === CONTEXT HOOKS ===
  const { user, loading: authLoading, isOnline, login, register, logout } = useAuth();
  const {
    transactions,
    stats,
    filteredTransactions,
    ghostMoneyAlerts,
    loading: txLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    clearFilters,
    filters,
    // Expose refreshTransactions
    refreshTransactions
  } = useTransactions();
  const {
    settings,
    goals,
    promos,
    quickActions,
    budgets,
    accounts,
    isDarkMode,
    currencySymbol,
    currencyCode,
    updateSettings,
    updateQuickActions,
    addGoal,
    updateGoal,
    deleteGoal,
    addPromo,
    updatePromo,
    deletePromo,
    updateBudget,
    deleteBudget,
    refreshGoals,
    loading: settingsLoading
  } = useSettings();
  const toast = useToast();
  const { t } = useI18n();

  // === CUSTOM HOOKS ===
  const { activeTab, navigateToTab: baseNavigateToTab, swipeHandlers, swipeState, mainContentRef } = useAppNavigation('dashboard', clearFilters);
  const modalManager = useModalManager();
  const screenManager = useScreenManager();

  // Custom navigateToTab that closes all modals/screens
  const navigateToTab = useCallback((tab: any) => {
    modalManager.closeAllModals();
    screenManager.closeAllScreens();
    baseNavigateToTab(tab);
  }, [baseNavigateToTab, modalManager, screenManager]);


  // Transaction handlers
  const transactionHandlers = useTransactionHandlers({
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    clearFilters,
    toast,
    t,
    closeActionModal: modalManager.closeActionModal,
    navigateToTab,
  });

  // Goal handlers
  const goalHandlers = useGoalHandlers({
    goals,
    stats,
    addGoal,
    updateGoal,
    deleteGoal,
    addTransaction: async (tx) => { await addTransaction(tx); },
    currencyCode,
    currencySymbol,
    toast,
    t,
    closeGoalModal: modalManager.closeGoalModal,
  });

  // Budget handlers
  const budgetHandlers = useBudgetHandlers({
    budgets,
    user: user!,
    updateBudget,
    deleteBudget,
    toast,
    closeBudgetModal: screenManager.closeBudgetView,
  });

  // Budget period calculations (Single Source of Truth)
  const currentBudgetPeriod = useBudgetPeriod(budgets, transactions);

  // Notification system
  useNotificationSystem({
    user,
    transactions,
    goals,
    stats,
    language: settings?.language || 'es',
    onShowPrompt: modalManager.showNotificationPrompt,
  });

  // === EFFECTS ===
  // Load custom categories
  useEffect(() => {
    if (user) {
      storageService.getCategories().then(screenManager.setCustomCategories).catch(console.error);
    }
  }, [user]);

  // Sync API key to localStorage for aiCoachService
  useEffect(() => {
    if (settings?.aiConfig?.userGeminiApiKey) {
      localStorage.setItem('gemini_api_key', settings.aiConfig.userGeminiApiKey);
    }
  }, [settings?.aiConfig?.userGeminiApiKey]);

  // === LOADING STATE ===
  if (authLoading || txLoading || settingsLoading) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // === NOT LOGGED IN - SHOW LANDING PAGE ===
  if (!user) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <React.Suspense fallback={
          <div className={`h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <LandingPage onLogin={login} onRegister={register} />
        </React.Suspense>
      </div>
    );
  }

  // === MAIN APP ===
  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300`}>
      <AppLayout
        user={user}
        stats={stats}
        isOnline={isOnline}
        isDarkMode={isDarkMode}
        activeTab={activeTab}
        onNavigateToTab={navigateToTab}
        onOpenNotificationCenter={screenManager.openNotificationCenter}
        onOpenActionModal={modalManager.openActionModal}
        onOpenAICoach={screenManager.openAICoach}
        swipeHandlers={swipeHandlers}
        swipeState={swipeState}
        mainContentRef={mainContentRef}
        t={t}
      >
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Cargando...</p>
          </div>
        }>
          {/* === DASHBOARD === */}
          {activeTab === 'dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              {/* Ghost Money Alerts */}
              {ghostMoneyAlerts.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mb-1">
                      {t.dashboard.ghostMoneyDetector}
                    </p>
                    {ghostMoneyAlerts.map((msg, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{msg}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Coach Widget */}
              <AICoachWidget
                transactions={transactions}
                stats={stats}
                goals={goals}
                onOpenAICoach={screenManager.openAICoach}
                onOpenSavingsPlanner={screenManager.openSavingsPlanner}
                onOpenChallenges={screenManager.openChallenges}
                onOpenStrategies={screenManager.openStrategies}
              />

              {/* Quick Expense Widget */}
              <QuickExpenseWidget onOpenFullScreen={screenManager.openQuickExpenses} />

              {/* Quick Actions Grid - Mobile/Tablet only */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 lg:hidden">
                {quickActions.filter(qa => qa.showOnHome).sort((a, b) => a.order - b.order).map(action => (
                  <button
                    key={action.id}
                    onClick={() => modalManager.openActionModal(action.type, action.defaults)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border active:scale-95 transition-all bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:shadow-sm`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm bg-${action.color}-50 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                      {action.type === 'income' ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> :
                        action.type === 'expense' ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> :
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold truncate w-full text-center">{action.name}</span>
                  </button>
                ))}
              </div>

              {/* Goals Widget */}
              <GoalsWidget
                goals={goals}
                onAddContribution={goalHandlers.handleAddContribution}
                onEditGoal={screenManager.openGoalView}
                onAddGoal={() => screenManager.openGoalView()}
                onDeleteContribution={goalHandlers.handleDeleteContribution}
                availableBalance={stats.balance}
              />

              {/* Promo Carousel */}
              <PromoCarousel
                promos={promos}
                onEditPromo={screenManager.openPromoView}
                onAddPromo={() => screenManager.openPromoView()}
              />

              {/* Dashboard Stats */}
              <Dashboard
                stats={stats}
                transactions={transactions}
                goals={goals}
                accounts={accounts}
                budgetPeriodData={currentBudgetPeriod}
                onAddClick={() => modalManager.openActionModal('expense')}
                onFilter={(type, value) => transactionHandlers.handleFilter(type, value, screenManager.openCategoryProfile)}
                onManageSurplus={() => navigateToTab('income')}
                currencyConfig={settings?.currency || { localCode: 'USD', localSymbol: '$', rateToBase: 1 }}
                isActive={activeTab === 'dashboard'}
              />
            </div>
          )}

          {/* === INCOME SCREEN === */}
          {activeTab === 'income' && (
            <IncomeScreen
              transactions={transactions}
              stats={stats}
              budgetPeriodData={currentBudgetPeriod}
              onAddFixedIncome={() => modalManager.openActionModal('income', { isRecurring: true, frequency: 'monthly' })}
              onAddExtraIncome={() => modalManager.openActionModal('income', { isRecurring: false })}
              onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
              onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
              onGoalsCreated={async () => {
                // Refresh both goals (to show new goals) AND transactions (to show balance deduction)
                await Promise.all([
                  refreshGoals(),
                  refreshTransactions()
                ]);
                navigateToTab('dashboard');
              }}
            />
          )}

          {/* === EXPENSES SCREEN === */}
          {activeTab === 'expenses' && (
            <ExpensesScreen
              transactions={transactions}
              budgetPeriodData={currentBudgetPeriod}
              onQuickExpense={() => modalManager.openActionModal('expense', { isRecurring: false })}
              onRecurringExpense={() => modalManager.openActionModal('expense', { isRecurring: true, frequency: 'monthly' })}
              onPlannedExpense={() => modalManager.openActionModal('expense', { isRecurring: false })}
              onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
              onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
              onUpdateTransaction={updateTransaction}
              onPaymentConfirmed={async (transaction) => {
                await addTransaction({
                  type: transaction.type,
                  amount: transaction.amount,
                  category: transaction.category,
                  description: transaction.description,
                  date: transaction.date,
                  isRecurring: transaction.isRecurring,
                  frequency: transaction.frequency,
                  paymentMethod: transaction.paymentMethod,
                  notes: transaction.notes,
                  relatedRecurringId: transaction.relatedRecurringId,
                });
              }}
            />
          )}

          {/* === BUDGETS SCREEN === */}
          {activeTab === 'budgets' && (
            <BudgetsScreen
              budgets={budgets}
              transactions={transactions}
              onCreateBudget={() => screenManager.openBudgetView()}
              onEditBudget={screenManager.openBudgetView}
              onDeleteBudget={budgetHandlers.handleDeleteBudget}
              onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
              onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
            />
          )}

          {/* === TRANSACTIONS SCREEN === */}
          {activeTab === 'transactions' && (
            <TransactionsScreen
              transactions={transactions}
              onEdit={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
              onDelete={transactionHandlers.handleDeleteTransaction}
            />
          )}

          {/* === SETTINGS SCREEN === */}
          {activeTab === 'settings' && settings && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={updateSettings}
              quickActions={quickActions}
              onUpdateQuickActions={updateQuickActions}
              onLogout={logout}
              userEmail={user.email}
              onOpenNotificationPrefs={screenManager.openNotificationPrefs}
              onOpenGoalsManagement={screenManager.openGoalsManagement}
              onOpenDiagnostics={() => navigateToTab('admin')}
            />
          )}

          {/* === FLOATING ACTION MENU === */}
          {modalManager.menu.show && (
            <div className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm" onClick={modalManager.closeMenu}>
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <button onClick={() => modalManager.openActionModal('income')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-emerald-600 dark:text-emerald-400 font-bold hover:scale-105 transition-transform">
                  <ArrowUpRight className="w-5 h-5" /> Nuevo Ingreso
                </button>
                <button onClick={() => modalManager.openActionModal('expense')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-rose-600 dark:text-rose-400 font-bold hover:scale-105 transition-transform">
                  <ArrowDownRight className="w-5 h-5" /> Nuevo Gasto
                </button>
                <button onClick={() => modalManager.openActionModal('service')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-indigo-600 dark:text-indigo-400 font-bold hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" /> Nuevo Servicio
                </button>
              </div>
            </div>
          )}


          {/* === FULL SCREEN COMPONENTS === */}
          <ScreenRenderer
            aiCoachScreen={screenManager.aiCoachScreen}
            savingsPlannerScreen={screenManager.savingsPlannerScreen}
            challengesScreen={screenManager.challengesScreen}
            strategiesScreen={screenManager.strategiesScreen}
            quickExpensesScreen={screenManager.quickExpensesScreen}
            notificationCenterScreen={screenManager.notificationCenterScreen}
            notificationPrefsScreen={screenManager.notificationPrefsScreen}
            goalsManagementScreen={screenManager.goalsManagementScreen}
            goalViewScreen={screenManager.goalViewScreen}
            promoViewScreen={screenManager.promoViewScreen}
            budgetViewScreen={screenManager.budgetViewScreen}
            categoryProfileScreen={screenManager.categoryProfileScreen}
            onCloseScreens={{
              aiCoach: screenManager.closeAICoach,
              savingsPlanner: screenManager.closeSavingsPlanner,
              challenges: screenManager.closeChallenges,
              strategies: screenManager.closeStrategies,
              quickExpenses: screenManager.closeQuickExpenses,
              notificationCenter: screenManager.closeNotificationCenter,
              notificationPrefs: screenManager.closeNotificationPrefs,
              goalsManagement: screenManager.closeGoalsManagement,
              goalView: screenManager.closeGoalView,
              promoView: screenManager.closePromoView,
              budgetView: screenManager.closeBudgetView,
              categoryProfile: screenManager.closeCategoryProfile,
            }}
            onOpenRelatedScreens={{
              savingsPlanner: screenManager.openSavingsPlanner,
              challenges: screenManager.openChallenges,
              strategies: screenManager.openStrategies,
              notificationPrefs: screenManager.openNotificationPrefs,
            }}
            onAddGoal={() => screenManager.openGoalView()}
            onEditGoal={screenManager.openGoalView}
            onSaveGoal={goalHandlers.handleSaveGoal}
            onDeleteGoal={deleteGoal}
            onUpdateGoal={updateGoal}
            onSavePromo={async (promo) => {
              const exists = promos.some(p => p.id === promo.id);
              exists ? await updatePromo(promo) : await addPromo(promo);
              screenManager.closePromoView();
            }}
            onDeletePromo={async (id) => {
              await deletePromo(id);
              screenManager.closePromoView();
            }}
            onSaveBudget={budgetHandlers.handleSaveBudget}
            onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
            onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
            goals={goals}
            transactions={transactions}
            stats={stats}
            customCategories={screenManager.customCategories}
            settings={settings}
            availableBalance={stats.totalIncome - stats.totalExpense}
          />

          {/* === PWA INSTALL PROMPT === */}
          <PWAInstallPrompt />

          {/* Admin Diagnostics (Overlay) */}
          {activeTab === 'admin' && (
            <AdminDiagnosticsScreen onClose={() => navigateToTab('settings')} />
          )}
        </React.Suspense>
      </AppLayout>

      {/* === MODALS (Rendered outside AppLayout for absolute top-level overlay) === */}
      <ModalRenderer
        actionModal={modalManager.actionModal}
        filterModal={modalManager.filterModal}
        notificationPrompt={modalManager.notificationPrompt}
        onSaveFromModal={(data) => transactionHandlers.handleSaveFromModal(data, modalManager.actionModal.mode!, modalManager.actionModal.editingItem)}
        onApplyFilters={setFilters}
        onCloseModals={{
          action: modalManager.closeActionModal,
          filter: modalManager.closeFilterModal,
          notificationPrompt: modalManager.hideNotificationPrompt,
        }}
        filters={filters}
        availableBalance={stats.balance}
      />
    </div>
  );
}
