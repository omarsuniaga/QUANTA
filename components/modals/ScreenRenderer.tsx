import React from 'react';
import { AICoachScreen } from '../AICoachScreen';
import { SavingsPlanner } from '../SavingsPlanner';
import { ChallengesScreen } from '../ChallengesScreen';
import { StrategiesScreen } from '../StrategiesScreen';
import { QuickExpenseScreen } from '../QuickExpenseScreen';
import { NotificationCenter } from '../NotificationCenter';
import { NotificationPreferences } from '../NotificationPreferences';
import { GoalsManagement } from '../GoalsManagement';
import { CategoryProfileScreen } from '../CategoryProfileScreen';
import { GoalView } from '../GoalView';
import { PromoView } from '../PromoView';
import { BudgetView } from '../BudgetView';
import { Transaction, Goal, DashboardStats, CustomCategory, Promo, Budget, AppSettings } from '../../types';

interface ScreenRendererProps {
  // Screen states
  aiCoachScreen: { show: boolean };
  savingsPlannerScreen: { show: boolean };
  challengesScreen: { show: boolean };
  strategiesScreen: { show: boolean };
  quickExpensesScreen: { show: boolean };
  notificationCenterScreen: { show: boolean };
  notificationPrefsScreen: { show: boolean };
  goalsManagementScreen: { show: boolean };
  goalViewScreen: { show: boolean; goal: Goal | null };
  promoViewScreen: { show: boolean; promo: Promo | null };
  budgetViewScreen: { show: boolean; budget: Budget | null };
  categoryProfileScreen: { show: boolean; category: string | null };

  // Handlers
  onCloseScreens: {
    aiCoach: () => void;
    savingsPlanner: () => void;
    challenges: () => void;
    strategies: () => void;
    quickExpenses: () => void;
    notificationCenter: () => void;
    notificationPrefs: () => void;
    goalsManagement: () => void;
    goalView: () => void;
    promoView: () => void;
    budgetView: () => void;
    categoryProfile: () => void;
  };

  // Navigation between screens
  onOpenRelatedScreens: {
    savingsPlanner: () => void;
    challenges: () => void;
    strategies: () => void;
    notificationPrefs: () => void;
  };

  // Goal handlers
  onAddGoal: () => void;
  onEditGoal: (goal?: Goal) => void;
  onSaveGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onUpdateGoal: (goal: Goal) => Promise<void>;

  // Promo handlers
  onSavePromo: (promo: Promo) => Promise<void>;
  onDeletePromo: (id: string) => Promise<void>;

  // Budget handlers
  onSaveBudget: (budget: Partial<Budget>) => Promise<void>;

  // Transaction handlers
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;

  // Data
  goals: Goal[];
  transactions: Transaction[];
  stats: DashboardStats;
  customCategories: CustomCategory[];
  settings?: AppSettings;
  availableBalance: number;
}

/**
 * Componente que renderiza todas las pantallas completas (full-screen) de la aplicación.
 * Renderiza condicionalmente basándose en el estado de cada screen.
 *
 * @param props - estados de screens, handlers, data
 */
export const ScreenRenderer: React.FC<ScreenRendererProps> = ({
  aiCoachScreen,
  savingsPlannerScreen,
  challengesScreen,
  strategiesScreen,
  quickExpensesScreen,
  notificationCenterScreen,
  notificationPrefsScreen,
  goalsManagementScreen,
  goalViewScreen,
  promoViewScreen,
  budgetViewScreen,
  categoryProfileScreen,
  onCloseScreens,
  onOpenRelatedScreens,
  onAddGoal,
  onEditGoal,
  onSaveGoal,
  onDeleteGoal,
  onUpdateGoal,
  onSavePromo,
  onDeletePromo,
  onSaveBudget,
  onEditTransaction,
  onDeleteTransaction,
  goals,
  transactions,
  stats,
  customCategories,
  settings,
  availableBalance,
}) => {
  return (
    <>
      {/* AI Coach Full Screen */}
      {aiCoachScreen.show && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <AICoachScreen
            transactions={transactions}
            stats={stats}
            goals={goals}
            selectedPlanId={settings?.aiConfig?.selectedPlanId}
            onBack={onCloseScreens.aiCoach}
            onOpenSavingsPlanner={() => {
              onCloseScreens.aiCoach();
              onOpenRelatedScreens.savingsPlanner();
            }}
            onOpenChallenges={() => {
              onCloseScreens.aiCoach();
              onOpenRelatedScreens.challenges();
            }}
            onOpenStrategies={() => {
              onCloseScreens.aiCoach();
              onOpenRelatedScreens.strategies();
            }}
          />
        </div>
      )}

      {/* Savings Planner Full Screen */}
      {savingsPlannerScreen.show && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <SavingsPlanner
            goals={goals}
            transactions={transactions}
            stats={stats}
            onBack={onCloseScreens.savingsPlanner}
            onEditGoal={(goal) => {
              onCloseScreens.savingsPlanner();
              onEditGoal(goal);
            }}
            onAddGoal={() => {
              onCloseScreens.savingsPlanner();
              onAddGoal();
            }}
          />
        </div>
      )}

      {/* Challenges Full Screen */}
      {challengesScreen.show && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <ChallengesScreen
            transactions={transactions}
            stats={stats}
            goals={goals}
            onBack={onCloseScreens.challenges}
          />
        </div>
      )}

      {/* Strategies Full Screen */}
      {strategiesScreen.show && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <StrategiesScreen
            transactions={transactions}
            stats={stats}
            onBack={onCloseScreens.strategies}
          />
        </div>
      )}

      {/* Quick Expenses Full Screen */}
      <QuickExpenseScreen
        isOpen={quickExpensesScreen.show}
        onClose={onCloseScreens.quickExpenses}
      />

      {/* Notification Center Modal */}
      {notificationCenterScreen.show && (
        <NotificationCenter
          isOpen={notificationCenterScreen.show}
          onClose={onCloseScreens.notificationCenter}
          onOpenSettings={() => {
            onCloseScreens.notificationCenter();
            onOpenRelatedScreens.notificationPrefs();
          }}
        />
      )}

      {/* Notification Preferences Modal */}
      {notificationPrefsScreen.show && (
        <NotificationPreferences
          isOpen={notificationPrefsScreen.show}
          onClose={onCloseScreens.notificationPrefs}
        />
      )}

      {/* Goals Management Modal */}
      {goalsManagementScreen.show && (
        <GoalsManagement
          isOpen={goalsManagementScreen.show}
          onClose={onCloseScreens.goalsManagement}
          goals={goals}
          onAddGoal={() => {
            onCloseScreens.goalsManagement();
            onAddGoal();
          }}
          onEditGoal={(goal) => {
            onCloseScreens.goalsManagement();
            onEditGoal(goal);
          }}
          onDeleteGoal={onDeleteGoal}
          onUpdateGoal={onUpdateGoal}
          availableBalance={availableBalance}
        />
      )}

      {/* Goal View Full Screen */}
      {goalViewScreen.show && (
        <GoalView
          goal={goalViewScreen.goal}
          transactions={transactions}
          onSave={onSaveGoal}
          onDelete={onDeleteGoal}
          onBack={onCloseScreens.goalView}
        />
      )}

      {/* Promo View Full Screen */}
      {promoViewScreen.show && (
        <PromoView
          promo={promoViewScreen.promo}
          onSave={onSavePromo}
          onDelete={onDeletePromo}
          onBack={onCloseScreens.promoView}
        />
      )}

      {/* Budget View Full Screen */}
      {budgetViewScreen.show && (
        <BudgetView
          budget={budgetViewScreen.budget}
          categories={customCategories.map(c => c.id)}
          onSave={onSaveBudget}
          onBack={onCloseScreens.budgetView}
        />
      )}

      {/* Category Profile Full Screen */}
      {categoryProfileScreen.show && categoryProfileScreen.category && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <CategoryProfileScreen
            category={categoryProfileScreen.category}
            transactions={transactions}
            customCategories={customCategories}
            onBack={onCloseScreens.categoryProfile}
            onEditTransaction={(tx) => {
              onCloseScreens.categoryProfile();
              onEditTransaction(tx);
            }}
            onDeleteTransaction={onDeleteTransaction}
          />
        </div>
      )}
    </>
  );
};
