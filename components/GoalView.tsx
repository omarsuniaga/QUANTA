import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ArrowLeft, Plane, Shield, Gift, Car, Home, Save, Trash2, Calculator, Calendar, Clock, Wallet, TrendingUp, Info, Target } from 'lucide-react';
import { Goal, Transaction } from '../types';
import { parseLocalDate } from '../utils/dateHelpers';
import { Button } from './Button';
import { useI18n } from '../contexts/I18nContext';

interface GoalViewProps {
  goal: Goal;
  transactions: Transaction[];
  onBack: () => void;
  onSave: (goal: Goal) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

import { useCurrency } from '../hooks/useCurrency';

export const GoalView: React.FC<GoalViewProps> = memo(({
  goal,
  transactions,
  onBack,
  onSave,
  onDelete
}) => {
  const { formatAmount, fromBase, toBase, currencySymbol } = useCurrency();
  const { t, language } = useI18n();
  const [editingGoal, setEditingGoal] = useState<Goal>({ ...goal });
  const [isSaving, setIsSaving] = useState(false);
  const [targetMonths, setTargetMonths] = useState<string>('');
  const [calculationMode, setCalculationMode] = useState<'monthly' | 'targetDate'>(
    goal.targetDate ? 'targetDate' : 'monthly'
  );

  // Initialize targetMonths from goal's targetDate
  useEffect(() => {
    if (goal?.targetDate) {
      const targetDate = parseLocalDate(goal.targetDate);
      const now = new Date();
      const diffMonths = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      setTargetMonths(Math.max(1, diffMonths).toString());
    }
  }, [goal]);

  const progress = useMemo(() => {
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }, [goal.currentAmount, goal.targetAmount]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, goal.targetAmount - goal.currentAmount);
  }, [goal.currentAmount, goal.targetAmount]);

  const estimatedCompletion = useMemo(() => {
    if (!goal.contributionAmount || goal.contributionAmount <= 0) return null;

    let monthlyContribution = goal.contributionAmount;
    if (goal.contributionFrequency === 'weekly') monthlyContribution *= 4.33;
    else if (goal.contributionFrequency === 'biweekly') monthlyContribution *= 2.16;

    const monthsRemaining = Math.ceil(remainingAmount / monthlyContribution);
    const date = new Date();
    date.setMonth(date.getMonth() + monthsRemaining);
    return date;
  }, [remainingAmount, goal.contributionAmount, goal.contributionFrequency]);

  const getTimeRemainingLabel = () => {
    if (!estimatedCompletion) return null;
    const now = new Date();
    const diffMonths = (estimatedCompletion.getFullYear() - now.getFullYear()) * 12 + (estimatedCompletion.getMonth() - now.getMonth());

    if (diffMonths <= 0) return language === 'es' ? 'Menos de 1 mes' : 'Less than 1 month';
    if (diffMonths < 12) return `${diffMonths} ${language === 'es' ? 'meses' : 'months'}`;

    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (months === 0) return `${years} ${language === 'es' ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'year' : 'years')}`;
    return `${years} ${language === 'es' ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'year' : 'years')} ${language === 'es' ? 'y' : 'and'} ${months} ${language === 'es' ? 'meses' : 'months'}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalGoal = { ...editingGoal };

      if (calculationMode === 'targetDate' && targetMonths) {
        const months = parseInt(targetMonths);
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        finalGoal.targetDate = date.toISOString().split('T')[0];

        // Calculate recommended contribution
        const monthlyNeeded = remainingAmount / months;
        if (finalGoal.contributionFrequency === 'weekly') finalGoal.contributionAmount = monthlyNeeded / 4.33;
        else if (finalGoal.contributionFrequency === 'biweekly') finalGoal.contributionAmount = monthlyNeeded / 2.16;
        else finalGoal.contributionAmount = monthlyNeeded;
      } else {
        finalGoal.targetDate = undefined;
      }

      await onSave(finalGoal);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      'plane': Plane,
      'shield': Shield,
      'gift': Gift,
      'car': Car,
      'home': Home,
      'piggy-bank': Clock,
      'target': Target,
      'trending-up': TrendingUp
    };
    return icons[iconName] || Target;
  };

  const Icon = getIconComponent(goal.icon || 'target');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{goal.name}</h2>
            <p className="text-xs text-slate-500">{t.goals?.editGoal || 'Editar Meta'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => onDelete(goal.id)}
          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Progress Card */}
        <div className={`p-6 rounded-3xl bg-gradient-to-br from-${goal.color || 'indigo'}-500 to-${goal.color || 'indigo'}-600 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Icon className="w-8 h-8" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium opacity-80">{language === 'es' ? 'Progreso' : 'Progress'}</p>
              <p className="text-3xl font-black">{progress.toFixed(0)}%</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-70 mb-1">{language === 'es' ? 'Ahorrado' : 'Saved'}</p>
                <p className="text-xl font-bold">{formatAmount(goal.currentAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 mb-1">{language === 'es' ? 'Meta' : 'Target'}</p>
                <p className="text-xl font-bold">{formatAmount(goal.targetAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'es' ? 'Tiempo Estimado' : 'Estimated Time'}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {getTimeRemainingLabel() || '---'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'es' ? 'Faltante' : 'Remaining'}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {formatAmount(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
            {language === 'es' ? 'Configuración de Ahorro' : 'Savings Configuration'}
          </h3>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {/* Amount Input */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-white">
                    {language === 'es' ? 'Monto Objetivo' : 'Target Amount'}
                  </p>
                  <p className="text-[10px] text-slate-400">{language === 'es' ? '¿Cuánto quieres juntar?' : 'How much to save?'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={fromBase(editingGoal.targetAmount)}
                  onChange={(e) => setEditingGoal({ ...editingGoal, targetAmount: toBase(parseFloat(e.target.value) || 0) })}
                  className="w-24 text-right font-bold text-slate-800 dark:text-white bg-transparent border-b-2 border-slate-100 focus:border-indigo-500 transition-colors focus:outline-none"
                />
              </div>
            </div>

            {/* Strategy Select */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-white">
                    {language === 'es' ? 'Estrategia de Aporte' : 'Contribution Strategy'}
                  </p>
                  <p className="text-[10px] text-slate-400">{language === 'es' ? '¿Cómo vas a ahorrar?' : 'How will you save?'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCalculationMode('monthly')}
                  className={`p-3 rounded-2xl border text-center transition-all ${calculationMode === 'monthly'
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                  <p className={`text-xs font-bold ${calculationMode === 'monthly' ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {language === 'es' ? 'Monto Fijo' : 'Fixed Amount'}
                  </p>
                </button>
                <button
                  onClick={() => setCalculationMode('targetDate')}
                  className={`p-3 rounded-2xl border text-center transition-all ${calculationMode === 'targetDate'
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                  <p className={`text-xs font-bold ${calculationMode === 'targetDate' ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {language === 'es' ? 'Fecha Objetivo' : 'Target Date'}
                  </p>
                </button>
              </div>

              <div className="mt-4">
                {calculationMode === 'monthly' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{language === 'es' ? 'Aporte por período' : 'Contribution per period'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">{currencySymbol}</span>
                        <input
                          type="number"
                          value={fromBase(editingGoal.contributionAmount || 0)}
                          onChange={(e) => setEditingGoal({ ...editingGoal, contributionAmount: toBase(parseFloat(e.target.value) || 0) })}
                          className="w-20 text-right font-bold text-slate-800 dark:text-white bg-transparent border-b-2 border-slate-100 focus:border-indigo-500 transition-colors focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setEditingGoal({ ...editingGoal, contributionFrequency: freq })}
                          className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all ${editingGoal.contributionFrequency === freq
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500'
                            }`}
                        >
                          {freq === 'weekly' ? (language === 'es' ? 'Semanal' : 'Weekly') :
                            freq === 'biweekly' ? (language === 'es' ? 'Quincenal' : 'Biweekly') :
                              (language === 'es' ? 'Mensual' : 'Monthly')}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{language === 'es' ? 'Meses sugeridos' : 'Suggested months'}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={targetMonths}
                          onChange={(e) => setTargetMonths(e.target.value)}
                          className="w-16 text-right font-bold text-slate-800 dark:text-white bg-transparent border-b-2 border-slate-100 focus:border-indigo-500 transition-colors focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">{language === 'es' ? 'meses' : 'months'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto Deduct Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${editingGoal.autoDeduct ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                  <Save className={`w-5 h-5 ${editingGoal.autoDeduct ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-white">
                    {language === 'es' ? 'Apartado Automático' : 'Auto Deduct'}
                  </p>
                  <p className="text-[10px] text-slate-400">{language === 'es' ? 'Efectivizar ahorro al cobrar' : 'Effect savings on income'}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingGoal({ ...editingGoal, autoDeduct: !editingGoal.autoDeduct })}
                className={`w-12 h-6 rounded-full p-1 transition-all ${editingGoal.autoDeduct ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${editingGoal.autoDeduct ? 'translate-x-6' : 'translate-x-0'
                  }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          fullWidth
          onClick={handleSave}
          disabled={isSaving}
          className={`shadow-xl ${isSaving ? 'opacity-70' : ''}`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            language === 'es' ? 'Guardar Cambios' : 'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
});
