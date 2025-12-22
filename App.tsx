import React, { useEffect } from 'react';
// Screens
import { Dashboard } from './components/Dashboard';
import { IncomeScreen } from './components/IncomeScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { BudgetsScreen } from './components/BudgetsScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LandingPage } from './components/LandingPage';
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
    filters
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
  const { activeTab, navigateToTab, swipeHandlers, swipeState, mainContentRef } = useAppNavigation('dashboard', clearFilters);
  const modalManager = useModalManager();
  const screenManager = useScreenManager();

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
    addTransaction,
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
    currencyCode,
    currencySymbol,
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
        <LandingPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  // === MAIN APP ===
  return (
    <AppLayout
      user={user}
      stats={stats}
      isOnline={isOnline}
      isDarkMode={isDarkMode}
      currencySymbol={currencySymbol}
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
            currencySymbol={currencySymbol}
            currencyCode={currencyCode}
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
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          budgetPeriodData={currentBudgetPeriod}
          onAddFixedIncome={() => modalManager.openActionModal('income', { isRecurring: true, frequency: 'monthly' })}
          onAddExtraIncome={() => modalManager.openActionModal('income', { isRecurring: false })}
          onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
          onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
          onGoalsCreated={refreshGoals}
        />
      )}

      {/* === EXPENSES SCREEN === */}
      {activeTab === 'expenses' && (
        <ExpensesScreen
          transactions={transactions}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          budgetPeriodData={currentBudgetPeriod}
          onQuickExpense={() => modalManager.openActionModal('expense', { isRecurring: false })}
          onRecurringExpense={() => modalManager.openActionModal('expense', { isRecurring: true, frequency: 'monthly' })}
          onPlannedExpense={() => modalManager.openActionModal('expense', { isRecurring: false })}
          onEditTransaction={(tx) => transactionHandlers.handleEditTransaction(tx, modalManager.openActionModal)}
          onDeleteTransaction={transactionHandlers.handleDeleteTransaction}
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
              notes: transaction.notes
            });
          }}
        />
      )}

      {/* === BUDGETS SCREEN === */}
      {activeTab === 'budgets' && (
        <BudgetsScreen
          budgets={budgets}
          transactions={transactions}
          currencySymbol={currencySymbol}
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
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
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

      {/* === MODALS === */}
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
        currencySymbol={currencySymbol}
        currencyCode={currencyCode}
        availableBalance={stats.balance}
      />

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
        currencySymbol={currencySymbol}
        currencyCode={currencyCode}
        availableBalance={stats.totalIncome - stats.totalExpense}
      />

      {/* === PWA INSTALL PROMPT === */}
      <PWAInstallPrompt />
    </AppLayout>
  );
}
