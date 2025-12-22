import React, { useState } from 'react';
import { ArrowLeft, PiggyBank, Target, Sparkles, TrendingUp, Shield, Info, Check, AlertTriangle } from 'lucide-react';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { calculatePlanAllocations, PlanId } from '../utils/surplusPlan';
import { createGoalsFromPlan, getCurrentPeriodKey, hasGoalsForPeriod, deleteGoalsForPeriod } from '../services/goalsService';
import { useI18n } from '../contexts/I18nContext';

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
  currencySymbol: string;
  language: string;
  onBack: () => void;
  onGoalsCreated?: () => void;
}

export const SurplusDistributionView: React.FC<SurplusDistributionViewProps> = ({
  budgetPeriodData,
  currencySymbol,
  language,
  onBack,
  onGoalsCreated
}) => {
  const { t } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<AllocationPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasExistingGoals, setHasExistingGoals] = useState(false);

  // Check for existing goals
  React.useEffect(() => {
    const currentPeriod = getCurrentPeriodKey();
    setHasExistingGoals(hasGoalsForPeriod(currentPeriod));
  }, []);

  const surplus = Math.max(0, budgetPeriodData.totalIncome - budgetPeriodData.totalExpenses);
  const allocations = selectedPlan ? calculatePlanAllocations(selectedPlan.id as PlanId, surplus) : null;

  const handlePlanSelect = (plan: AllocationPlan) => {
    setSelectedPlan(plan);
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

      // Create new goals based on selected plan
      await createGoalsFromPlan(selectedPlan.id as PlanId, allocations, currencySymbol, language);
      
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
    const locale = language === 'es' ? 'es-DO' : 'en-US';
    return `${currencySymbol} ${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
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
      <main className="flex-1 overflow-auto p-4 pb-28">
        {/* Available Surplus Card */}
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
                className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
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

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                {language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {language === 'es'
                  ? 'Elige un plan de distribución y crearemos automáticamente metas de ahorro basadas en tu superávit. Podrás ajustarlas más tarde.'
                  : 'Choose a distribution plan and we\'ll automatically create savings goals based on your surplus. You can adjust them later.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!selectedPlan || isCreating}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating 
              ? (language === 'es' ? 'Creando...' : 'Creating...')
              : (language === 'es' ? 'Confirmar' : 'Confirm')
            }
          </button>
        </div>
      </footer>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-2">
              {language === 'es' ? 'Confirmar Plan' : 'Confirm Plan'}
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
              {language === 'es'
                ? `¿Crear metas basadas en el plan "${language === 'es' ? selectedPlan.name : selectedPlan.nameEn}"?`
                : `Create goals based on the "${language === 'es' ? selectedPlan.name : selectedPlan.nameEn}" plan?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isCreating}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating 
                  ? (language === 'es' ? 'Creando...' : 'Creating...')
                  : (language === 'es' ? 'Crear' : 'Create')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
