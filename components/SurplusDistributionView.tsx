import React, { useState } from 'react';
import { ArrowLeft, PiggyBank, Target, Sparkles, TrendingUp, Shield, Info, Check, AlertTriangle } from 'lucide-react';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { calculatePlanAllocations, PlanId } from '../utils/surplusPlan';
import { createGoalsFromPlan, getCurrentPeriodKey, hasGoalsForPeriod, deleteGoalsForPeriod } from '../services/goalsService';
import { useI18n } from '../contexts/I18nContext';
import { useCurrency } from '../hooks/useCurrency';

interface AllocationPlan {
  id: string;
  name: string;
  nameEn: string;
  icon: typeof PiggyBank;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badge: string;
  percentages: {
    savings: number;
    goals: number;
    personal: number;
  };
  description: string;
  descriptionEn: string;
}

const ALLOCATION_PLANS: AllocationPlan[] = [
  {
    id: 'conservative',
    name: 'Plan Conservador',
    nameEn: 'Conservative Plan',
    icon: PiggyBank,
    iconColor: 'text-blue-500',
    bgColor: 'bg-slate-50 dark:bg-slate-700/50',
    borderColor: 'border-slate-200 dark:border-slate-600',
    textColor: 'text-slate-900 dark:text-white',
    badge: '70/20/10',
    percentages: { savings: 0.7, goals: 0.2, personal: 0.1 },
    description: 'Ideal para construir seguridad financiera y fondo de emergencia.',
    descriptionEn: 'Ideal for building financial security and emergency fund.'
  },
  {
    id: 'balanced',
    name: 'Plan Balanceado',
    nameEn: 'Balanced Plan',
    icon: Target,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-900 dark:text-emerald-100',
    badge: '50/30/20',
    percentages: { savings: 0.5, goals: 0.3, personal: 0.2 },
    description: 'Balance perfecto entre ahorro, metas y disfrute personal.',
    descriptionEn: 'Perfect balance between savings, goals, and personal enjoyment.'
  },
  {
    id: 'aggressive',
    name: 'Plan Agresivo',
    nameEn: 'Aggressive Plan',
    icon: TrendingUp,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-900 dark:text-rose-100',
    badge: '30/40/30',
    percentages: { savings: 0.3, goals: 0.4, personal: 0.3 },
    description: 'Maximiza crecimiento de metas con ahorro moderado.',
    descriptionEn: 'Maximizes goal growth with moderate savings.'
  },
  {
    id: 'growth',
    name: 'Plan Crecimiento',
    nameEn: 'Growth Plan',
    icon: Sparkles,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-900 dark:text-purple-100',
    badge: '40/35/25',
    percentages: { savings: 0.4, goals: 0.35, personal: 0.25 },
    description: 'Enfoque en metas futuras con buen fondo de seguridad.',
    descriptionEn: 'Focus on future goals with good security fund.'
  },
  {
    id: 'secure',
    name: 'Plan Seguro',
    nameEn: 'Secure Plan',
    icon: Shield,
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-900 dark:text-indigo-100',
    badge: '60/25/15',
    percentages: { savings: 0.6, goals: 0.25, personal: 0.15 },
    description: 'Prioridad absoluta en seguridad financiera.',
    descriptionEn: 'Absolute priority on financial security.'
  }
];

interface SurplusDistributionViewProps {
  budgetPeriodData: BudgetPeriodData;
  language: string;
  onBack: () => void;
  onGoalsCreated?: () => void;
}

import { useSettings } from '../contexts/SettingsContext';

// ... imports

export const SurplusDistributionView: React.FC<SurplusDistributionViewProps> = ({
  budgetPeriodData,
  language,
  onBack,
  onGoalsCreated
}) => {
  const { t } = useI18n();
  const { formatAmount } = useCurrency();
  const { settings, updateSettings } = useSettings(); // Use settings context

  // Initialize selectedPlan from settings if available
  const [selectedPlan, setSelectedPlan] = useState<AllocationPlan | null>(() => {
    if (settings?.aiConfig?.selectedPlanId) {
      return ALLOCATION_PLANS.find(p => p.id === settings.aiConfig.selectedPlanId) || null;
    }
    return null;
  });

  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasExistingGoals, setHasExistingGoals] = useState(false);

  // Check for existing goals
  React.useEffect(() => {
    const checkGoals = async () => {
      const currentPeriod = getCurrentPeriodKey();
      const hasGoals = await hasGoalsForPeriod(currentPeriod);
      setHasExistingGoals(hasGoals);
    };
    checkGoals();
  }, []);

  const surplus = Math.max(0, budgetPeriodData.incomeTotal - budgetPeriodData.expensesTotal);
  const allocations = selectedPlan ? calculatePlanAllocations(surplus, selectedPlan.id as PlanId) : null;

  const handlePlanSelect = async (plan: AllocationPlan) => {
    setSelectedPlan(plan);
    // Persist immediately when user selects a plan
    try {
      await updateSettings({
        aiConfig: {
          ...settings?.aiConfig,
          // Cast to any because surplusId and financialPlanId are currently conflicting types in the system
          // TODO: Unify PlanId types or separate into financialPlanId vs distributionPlanId
          selectedPlanId: plan.id as any,
          enabled: settings?.aiConfig?.enabled ?? true,
          level: settings?.aiConfig?.level ?? 'medium'
        }
      });
    } catch (error) {
      console.error('Error persisting selected plan:', error);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !allocations) return;

    setIsCreating(true);
    try {
      const currentPeriod = getCurrentPeriodKey();

      // Delete existing goals for this period if any
      if (hasExistingGoals) {
        await deleteGoalsForPeriod(currentPeriod);
      }

      // Fix: Call with correct object signature
      await createGoalsFromPlan({
        periodKey: currentPeriod,
        planId: selectedPlan.id as PlanId,
        allocations,
        language: language as 'es' | 'en'
      });

      setShowConfirmDialog(false);
      onGoalsCreated?.();
      onBack(); // Go back after successful creation
    } catch (error) {
      console.error('Error creating goals:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* ... (Header same as before) ... */}
      {/* Header content repeated for context stability if needed, or leave unchanged parts */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {language === 'es' ? 'Distribuir Excedente' : 'Distribute Surplus'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'es' ? 'Elige un plan para tu superávit' : 'Choose a plan for your surplus'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {/* ... (Available Surplus Card same as before) ... */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {language === 'es' ? 'Superávit Disponible:' : 'Available Surplus:'}
            </span>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-lg font-bold">{formatCurrency(surplus)}</span>
            </div>
          </div>

          {hasExistingGoals && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                    {language === 'es' ? 'Ya existen metas para este período' : 'Goals already exist for this period'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {language === 'es'
                      ? 'Se reemplazarán las metas existentes con las nuevas.'
                      : 'Existing goals will be replaced with new ones.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {language === 'es' ? 'Planes de Distribución' : 'Distribution Plans'}
          </h2>

          <div className="grid gap-4">
            {ALLOCATION_PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan)}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all ${selectedPlan?.id === plan.id
                  ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${plan.bgColor}`}>
                    <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${plan.textColor}`}>
                        {language === 'es' ? plan.name : plan.nameEn}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 rounded-lg">
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {language === 'es' ? plan.description : plan.descriptionEn}
                    </p>

                    {/* ... (Percentages same as before) ... */}
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">
                          {language === 'es' ? 'Ahorro' : 'Savings'}
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(plan.percentages.savings * 100)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">
                          {language === 'es' ? 'Metas' : 'Goals'}
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(plan.percentages.goals * 100)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">
                          {language === 'es' ? 'Personal' : 'Personal'}
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(plan.percentages.personal * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedPlan?.id === plan.id && (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Allocation Preview */}
                {selectedPlan?.id === plan.id && allocations && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      {language === 'es' ? 'Distribución Detallada' : 'Detailed Distribution'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'es' ? 'Ahorro:' : 'Savings:'}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(allocations.savings)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'es' ? 'Metas:' : 'Goals:'}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(allocations.goals)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'es' ? 'Personal:' : 'Personal:'}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(allocations.personal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Section moved out of view, will be replaced by modal on click */}
      </main>

      {/* Sticky Footer - Inside Modal */}
      <footer className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 z-10">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!selectedPlan || isCreating}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating
              ? (language === 'es' ? 'Creando...' : 'Creating...')
              : (language === 'es' ? 'Confirmar' : 'Confirm')
            }
          </button>
        </div>
      </footer>

      {/* Updated Explanation + Confirmation Modal */}
      {showConfirmDialog && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 animate-in zoom-in-50 duration-200">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedPlan.bgColor}`}>
                <selectedPlan.icon className={`w-8 h-8 ${selectedPlan.iconColor}`} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              {language === 'es' ? selectedPlan.name : selectedPlan.nameEn}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {language === 'es' ? 'Cómo funciona:' : 'How it works:'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'es'
                  ? 'Al confirmar, el sistema distribuirá automáticamente tu excedente en 3 metas financieras según los porcentajes del plan, y deducirá el monto de tu saldo disponible hoy mismo.'
                  : 'Upon confirmation, the system will automatically distribute your surplus into 3 financial goals according to the plan percentages, and deduct the amount from your available balance today.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {language === 'es' ? 'Volver' : 'Back'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isCreating}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/30"
              >
                {isCreating
                  ? (language === 'es' ? 'Aplicando...' : 'Applying...')
                  : (language === 'es' ? 'Aplicar Plan' : 'Apply Plan')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
