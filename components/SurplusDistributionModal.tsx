import React, { useState } from 'react';
import { X, PiggyBank, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { BudgetPeriodData } from '../hooks/useBudgetPeriod';
import { calculatePlanAllocations, PlanId } from '../utils/surplusPlan';
import { createGoalsFromPlan, getCurrentPeriodKey, hasGoalsForPeriod, deleteGoalsForPeriod } from '../services/goalsService';

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
    description: 'Equilibrio entre seguridad, objetivos y desarrollo personal.',
    descriptionEn: 'Balance between security, objectives and personal development.'
  },
  {
    id: 'aggressive',
    name: 'Plan Agresivo',
    nameEn: 'Aggressive Plan',
    icon: TrendingUp,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-900 dark:text-amber-100',
    badge: '30/40/30',
    percentages: { savings: 0.3, goals: 0.4, personal: 0.3 },
    description: 'Enfoque en acelerar metas y eliminar deudas o invertir en crecimiento.',
    descriptionEn: 'Focus on accelerating goals and eliminating debt or investing in growth.'
  }
];

interface SurplusDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetPeriodData: BudgetPeriodData;
  currencySymbol?: string;
  language?: 'es' | 'en';
  onGoalsCreated?: () => void; // Callback para refrescar goals UI
}

export const SurplusDistributionModal: React.FC<SurplusDistributionModalProps> = ({
  isOpen,
  onClose,
  budgetPeriodData,
  currencySymbol = 'RD$',
  language = 'es',
  onGoalsCreated
}) => {
  const available = Math.max(0, budgetPeriodData.incomeSurplus);
  const [confirmPlan, setConfirmPlan] = useState<PlanId | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const formatCurrency = (amount: number) => {
    const locale = language === 'es' ? 'es-DO' : 'en-US';
    return `${currencySymbol} ${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {language === 'es' ? 'Sugerencias para tu Superávit' : 'Surplus Allocation Suggestions'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                {language === 'es' ? 'Disponible:' : 'Available:'}{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(available)}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            {language === 'es'
              ? 'Tienes dinero disponible después de cubrir tu presupuesto. Aquí hay estrategias sugeridas para aprovecharlo:'
              : 'You have money available after covering your budget. Here are suggested strategies to make the most of it:'}
          </p>
          
          {/* Plans */}
          <div className="space-y-3 sm:space-y-4">
            {ALLOCATION_PLANS.map((plan) => {
              const Icon = plan.icon;
              const amounts = {
                savings: available * plan.percentages.savings,
                goals: available * plan.percentages.goals,
                personal: available * plan.percentages.personal
              };
              
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg sm:rounded-xl p-3 sm:p-4 border ${plan.borderColor} ${plan.bgColor}`}
                >
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className={`font-bold text-sm sm:text-base ${plan.textColor} flex items-center gap-1.5 sm:gap-2`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.iconColor}`} />
                      {language === 'es' ? plan.name : plan.nameEn}
                    </h3>
                    <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${
                      plan.id === 'balanced'
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        : plan.id === 'conservative'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                  
                  {/* Allocation Breakdown */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className={plan.id === 'balanced' ? 'text-emerald-700 dark:text-emerald-300' : plan.id === 'conservative' ? 'text-slate-600 dark:text-slate-400' : 'text-amber-700 dark:text-amber-300'}>
                        {language === 'es' ? `• Ahorro (${plan.percentages.savings * 100}%)` : `• Savings (${plan.percentages.savings * 100}%)`}
                      </span>
                      <span className={`font-bold ${plan.id === 'balanced' ? 'text-emerald-800 dark:text-emerald-200' : plan.id === 'conservative' ? 'text-slate-700 dark:text-slate-200' : 'text-amber-800 dark:text-amber-200'}`}>
                        {formatCurrency(amounts.savings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className={plan.id === 'balanced' ? 'text-emerald-700 dark:text-emerald-300' : plan.id === 'conservative' ? 'text-slate-600 dark:text-slate-400' : 'text-amber-700 dark:text-amber-300'}>
                        {language === 'es' ? `• Metas (${plan.percentages.goals * 100}%)` : `• Goals (${plan.percentages.goals * 100}%)`}
                      </span>
                      <span className={`font-bold ${plan.id === 'balanced' ? 'text-emerald-800 dark:text-emerald-200' : plan.id === 'conservative' ? 'text-slate-700 dark:text-slate-200' : 'text-amber-800 dark:text-amber-200'}`}>
                        {formatCurrency(amounts.goals)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className={plan.id === 'balanced' ? 'text-emerald-700 dark:text-emerald-300' : plan.id === 'conservative' ? 'text-slate-600 dark:text-slate-400' : 'text-amber-700 dark:text-amber-300'}>
                        {language === 'es' 
                          ? `• ${plan.id === 'conservative' ? 'Ocio/Personal' : plan.id === 'balanced' ? 'Inversión Personal' : 'Inversión/Deuda'} (${plan.percentages.personal * 100}%)`
                          : `• ${plan.id === 'conservative' ? 'Leisure/Personal' : plan.id === 'balanced' ? 'Personal Investment' : 'Investment/Debt'} (${plan.percentages.personal * 100}%)`
                        }
                      </span>
                      <span className={`font-bold ${plan.id === 'balanced' ? 'text-emerald-800 dark:text-emerald-200' : plan.id === 'conservative' ? 'text-slate-700 dark:text-slate-200' : 'text-amber-800 dark:text-amber-200'}`}>
                        {formatCurrency(amounts.personal)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-[10px] sm:text-xs italic mb-3" style={{
                    color: plan.id === 'balanced' ? 'rgb(4 120 87 / 0.7)' : plan.id === 'conservative' ? 'rgb(100 116 139 / 0.7)' : 'rgb(146 64 14 / 0.7)'
                  }}>
                    {language === 'es' ? plan.description : plan.descriptionEn}
                  </p>
                  
                  {/* Action Button - Phase 2.1: Real implementation with duplicate check */}
                  <button
                    onClick={async () => {
                      const periodKey = getCurrentPeriodKey();
                      const hasDuplicates = await hasGoalsForPeriod(periodKey);
                      
                      if (hasDuplicates) {
                        setConfirmPlan(plan.id as PlanId);
                        setShowDuplicateWarning(true);
                      } else {
                        setConfirmPlan(plan.id as PlanId);
                        setShowDuplicateWarning(false);
                      }
                    }}
                    disabled={available <= 0 || isCreating}
                    className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.id === 'balanced'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md'
                        : plan.id === 'conservative'
                        ? 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {language === 'es' ? 'Aplicar Plan' : 'Apply Plan'}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Disclaimer */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center">
              {language === 'es'
                ? '💡 Estas son recomendaciones generales. Ajusta según tus prioridades y situación financiera.'
                : '💡 These are general recommendations. Adjust according to your priorities and financial situation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPlan && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                showDuplicateWarning 
                  ? 'bg-amber-100 dark:bg-amber-900/30' 
                  : 'bg-indigo-100 dark:bg-indigo-900/30'
              }`}>
                {showDuplicateWarning ? (
                  <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              {showDuplicateWarning
                ? (language === 'es' ? '⚠️ Metas Existentes' : '⚠️ Existing Goals')
                : (language === 'es' ? '¿Crear Metas Automáticas?' : 'Create Automatic Goals?')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
              {showDuplicateWarning
                ? (language === 'es'
                  ? `Ya tienes metas de planes de superávit para este mes. Al continuar, se reemplazarán las metas anteriores con ${formatCurrency(available)} en 3 nuevas metas. Tus metas manuales no se verán afectadas.`
                  : `You already have surplus plan goals for this month. Continuing will replace previous goals with ${formatCurrency(available)} in 3 new goals. Your manual goals won't be affected.`)
                : (language === 'es'
                  ? `Se crearán 3 metas automáticas por un total de ${formatCurrency(available)}`
                  : `3 automatic goals will be created for a total of ${formatCurrency(available)}`)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPlan(null)}
                disabled={isCreating}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  setIsCreating(true);
                  const periodKey = getCurrentPeriodKey();
                  
                  // Si hay duplicados, eliminarlos primero
                  if (showDuplicateWarning) {
                    const deleted = await deleteGoalsForPeriod(periodKey);
                    if (!deleted) {
                      setToast({
                        type: 'error',
                        message: language === 'es'
                          ? 'Error al eliminar metas anteriores'
                          : 'Error deleting previous goals'
                      });
                      setIsCreating(false);
                      setTimeout(() => setToast(null), 3000);
                      return;
                    }
                  }
                  
                  const allocations = calculatePlanAllocations(available, confirmPlan);
                  const result = await createGoalsFromPlan({
                    periodKey,
                    planId: confirmPlan,
                    allocations,
                    language
                  });

                  setIsCreating(false);
                  setConfirmPlan(null);
                  setShowDuplicateWarning(false);

                  if (result.success) {
                    // Refrescar goals UI inmediatamente
                    if (onGoalsCreated) {
                      onGoalsCreated();
                    }
                    
                    setToast({
                      type: 'success',
                      message: language === 'es'
                        ? `✅ ${result.goalsCreated?.length || 3} metas creadas exitosamente`
                        : `✅ ${result.goalsCreated?.length || 3} goals created successfully`
                    });
                    setTimeout(() => {
                      setToast(null);
                      onClose();
                    }, 2000);
                  } else {
                    setToast({
                      type: 'error',
                      message: result.error || (language === 'es' ? 'Error al crear metas' : 'Error creating goals')
                    });
                    setTimeout(() => setToast(null), 3000);
                  }
                }}
                disabled={isCreating}
                className={`flex-1 py-2.5 px-4 font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  showDuplicateWarning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isCreating
                  ? (language === 'es' ? 'Creando...' : 'Creating...')
                  : showDuplicateWarning
                    ? (language === 'es' ? 'Reemplazar' : 'Replace')
                    : (language === 'es' ? 'Confirmar' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
