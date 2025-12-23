import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  ArrowLeft,
  RefreshCw,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  Zap,
  AlertTriangle,
  Award,
  ChevronRight,
  Lightbulb,
  DollarSign,
  Clock,
  Sparkles,
  PiggyBank,
  Calculator,
  Edit3,
  Play,
  Pause,
  Settings,
  ArrowUpRight,
  TrendingDown,
  Wallet,
  Plus
} from 'lucide-react';
import { Goal, Transaction, DashboardStats, SavingsPlan, SavingsMilestone } from '../types';
import { Button } from './Button';
import { useI18n } from '../contexts/I18nContext';
import { parseLocalDate } from '../utils/dateHelpers';

interface SavingsPlannerProps {
  goals: Goal[];
  transactions: Transaction[];
  stats: DashboardStats;
  currencySymbol: string;
  currencyCode: string;
  onBack: () => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal?: () => void;
}

// Helper function to generate savings plan locally
const generateLocalPlan = (goal: Goal, stats: DashboardStats, transactions: Transaction[]): SavingsPlan => {
  const remaining = goal.targetAmount - goal.currentAmount;
  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  // Calculate average monthly savings from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = transactions.filter(t => parseLocalDate(t.date) >= threeMonthsAgo);
  const recentIncome = recentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const recentExpense = recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const avgMonthlySavings = Math.max(0, (recentIncome - recentExpense) / 3);

  // Determine strategy based on available funds
  let strategy: 'aggressive' | 'moderate' | 'relaxed' = 'moderate';
  let monthlyTarget = goal.contributionAmount || 0;

  // If goal has contribution configured, use it
  if (goal.contributionAmount && goal.contributionFrequency) {
    const multiplier = goal.contributionFrequency === 'weekly' ? 4.33 :
      goal.contributionFrequency === 'biweekly' ? 2 : 1;
    monthlyTarget = goal.contributionAmount * multiplier;
  } else if (goal.targetDate) {
    // Calculate based on target date
    const targetDate = parseLocalDate(goal.targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
    monthlyTarget = remaining / monthsRemaining;
  } else {
    // Default: calculate based on 12 months
    monthlyTarget = remaining / 12;
  }

  // Determine strategy based on monthly target vs available savings
  const savingsRatio = avgMonthlySavings > 0 ? monthlyTarget / avgMonthlySavings : 1;
  if (savingsRatio > 0.7) {
    strategy = 'aggressive';
  } else if (savingsRatio > 0.4) {
    strategy = 'moderate';
  } else {
    strategy = 'relaxed';
  }

  const weeklyTarget = monthlyTarget / 4.33;
  const dailyTarget = monthlyTarget / 30;

  // Calculate projected completion
  const monthsToComplete = monthlyTarget > 0 ? Math.ceil(remaining / monthlyTarget) : 12;
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);

  // Check if on track
  const isOnTrack = goal.targetDate
    ? projectedDate <= parseLocalDate(goal.targetDate)
    : monthlyTarget <= (avgMonthlySavings * 0.8); // Can save 80% of target comfortably

  // Generate milestones
  const milestones: SavingsMilestone[] = [25, 50, 75, 100].map(percentage => {
    const amount = (goal.targetAmount * percentage) / 100;
    const monthsToMilestone = monthlyTarget > 0
      ? Math.ceil(Math.max(0, amount - goal.currentAmount) / monthlyTarget)
      : 12;
    const milestoneDate = new Date();
    milestoneDate.setMonth(milestoneDate.getMonth() + monthsToMilestone);

    return {
      percentage,
      amount,
      projectedDate: milestoneDate.toISOString(),
      isCompleted: goal.currentAmount >= amount
    };
  });

  // Generate suggestions
  const suggestions = generateSuggestions(goal, stats, strategy, remaining, monthlyTarget);

  return {
    id: `plan-${goal.id}`,
    goalId: goal.id,
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.targetDate,
    monthlyTarget,
    weeklyTarget,
    dailyTarget,
    strategy,
    projectedCompletion: projectedDate.toISOString(),
    isOnTrack,
    suggestions,
    milestones
  };
};

// Generate smart suggestions based on data
const generateSuggestions = (
  goal: Goal,
  stats: DashboardStats,
  strategy: string,
  remaining: number,
  monthlyTarget: number
): string[] => {
  const suggestions: string[] = [];
  const savingsRate = stats.totalIncome > 0 ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100 : 0;

  // Basic suggestions based on strategy
  if (strategy === 'aggressive') {
    suggestions.push('⚡ Considera reducir gastos no esenciales temporalmente para acelerar el ahorro');
    suggestions.push('🎯 Establece días de "gasto cero" cada semana');
  } else if (strategy === 'moderate') {
    suggestions.push('✨ Mantén un equilibrio: ahorra consistentemente sin sacrificar tu calidad de vida');
    suggestions.push('📊 Revisa tus suscripciones mensualmente para eliminar las que no uses');
  } else {
    suggestions.push('🌱 Pequeños ahorros consistentes suman grandes resultados a largo plazo');
    suggestions.push('💡 Automatiza tu ahorro para no tener que pensarlo cada mes');
  }

  // Savings rate suggestions
  if (savingsRate < 10) {
    suggestions.push('📈 Tu tasa de ahorro actual es baja. Intenta ahorrar al menos el 10% de tus ingresos');
  } else if (savingsRate > 30) {
    suggestions.push('🌟 ¡Excelente tasa de ahorro! Considera aumentar tu aporte mensual a esta meta');
  }

  // Goal-specific suggestions
  if (goal.autoDeduct) {
    suggestions.push('✅ El apartado automático está activo. Tu ahorro se deducirá automáticamente cada período');
  } else {
    suggestions.push('💳 Activa el apartado automático para ahorrar sin esfuerzo');
  }

  // Time-based suggestions
  if (remaining < monthlyTarget * 3) {
    suggestions.push('🎉 ¡Estás muy cerca! Solo faltan unos meses para alcanzar tu meta');
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
};

export const SavingsPlanner: React.FC<SavingsPlannerProps> = ({
  goals,
  transactions,
  stats,
  currencySymbol,
  currencyCode,
  onBack,
  onEditGoal,
  onAddGoal
}) => {
  const { t, language } = useI18n();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showAllGoals, setShowAllGoals] = useState(true);

  // Generate plan for selected goal
  const plan = useMemo(() => {
    if (!selectedGoal) return null;
    return generateLocalPlan(selectedGoal, stats, transactions);
  }, [selectedGoal, stats, transactions]);

  // Calculate overall savings stats
  const overallStats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalRemaining = totalTarget - totalSaved;
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

    return { totalTarget, totalSaved, totalRemaining, overallProgress, activeGoals, completedGoals };
  }, [goals]);

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' };
      case 'moderate': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' };
      case 'relaxed': return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' };
      default: return { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' };
    }
  };

  const labels = {
    es: {
      title: 'Planes de Ahorro',
      subtitle: 'Estrategias personalizadas para tus metas',
      noGoals: 'No tienes metas',
      noGoalsDesc: 'Crea una meta para comenzar a planificar tu ahorro',
      createGoal: 'Crear Meta',
      selectGoal: 'Selecciona una meta para ver su plan de ahorro',
      overview: 'Resumen General',
      totalSaved: 'Total Ahorrado',
      remaining: 'Restante',
      activeGoals: 'Metas Activas',
      completed: 'Completadas',
      yourGoals: 'Tus Metas',
      progress: 'Progreso',
      strategy: 'Estrategia',
      aggressive: 'Agresivo',
      moderate: 'Moderado',
      relaxed: 'Relajado',
      onTrack: 'En camino',
      needsAdjustment: 'Requiere ajuste',
      howMuchToSave: 'Cuánto Ahorrar',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      estimatedDate: 'Fecha estimada de logro',
      milestones: 'Hitos del Camino',
      achieved: '¡Logrado!',
      projected: 'Proyectado',
      suggestions: 'Recomendaciones',
      updateGoal: 'Actualizar Meta',
      contributionPlan: 'Plan de Aportes',
      frequency: 'Frecuencia',
      perPeriod: 'por período',
      autoDeduct: 'Apartado Automático',
      active: 'Activo',
      inactive: 'Inactivo',
      configureGoal: 'Configurar Plan',
      goalReached: '¡Meta Alcanzada!',
      congratulations: 'Felicitaciones, has logrado tu objetivo',
    },
    en: {
      title: 'Savings Plans',
      subtitle: 'Personalized strategies for your goals',
      noGoals: 'No goals yet',
      noGoalsDesc: 'Create a goal to start planning your savings',
      createGoal: 'Create Goal',
      selectGoal: 'Select a goal to view its savings plan',
      overview: 'Overview',
      totalSaved: 'Total Saved',
      remaining: 'Remaining',
      activeGoals: 'Active Goals',
      completed: 'Completed',
      yourGoals: 'Your Goals',
      progress: 'Progress',
      strategy: 'Strategy',
      aggressive: 'Aggressive',
      moderate: 'Moderate',
      relaxed: 'Relaxed',
      onTrack: 'On track',
      needsAdjustment: 'Needs adjustment',
      howMuchToSave: 'How Much to Save',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      estimatedDate: 'Estimated completion date',
      milestones: 'Milestones',
      achieved: 'Achieved!',
      projected: 'Projected',
      suggestions: 'Recommendations',
      updateGoal: 'Update Goal',
      contributionPlan: 'Contribution Plan',
      frequency: 'Frequency',
      perPeriod: 'per period',
      autoDeduct: 'Auto-deduct',
      active: 'Active',
      inactive: 'Inactive',
      configureGoal: 'Configure Plan',
      goalReached: 'Goal Reached!',
      congratulations: 'Congratulations, you achieved your goal',
    }
  };

  const l = labels[language] || labels.es;

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return l.aggressive;
      case 'moderate': return l.moderate;
      case 'relaxed': return l.relaxed;
      default: return strategy;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const freqLabels: Record<string, Record<string, string>> = {
      weekly: { es: 'Semanal', en: 'Weekly' },
      biweekly: { es: 'Quincenal', en: 'Biweekly' },
      monthly: { es: 'Mensual', en: 'Monthly' }
    };
    return freqLabels[freq]?.[language] || freq;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={selectedGoal ? () => setSelectedGoal(null) : onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <PiggyBank className="w-6 h-6" />
              {l.title}
            </h1>
            <p className="text-emerald-200 text-sm mt-1">
              {selectedGoal ? selectedGoal.name : l.subtitle}
            </p>
          </div>
        </div>

        {/* Goal Progress Overview */}
        {selectedGoal && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-emerald-200 text-sm">{l.progress}</p>
                <p className="text-2xl font-bold">
                  {selectedGoal.currentAmount.toLocaleString()} {currencyCode}
                  <span className="text-emerald-200 text-lg font-normal"> / {selectedGoal.targetAmount.toLocaleString()} {currencyCode}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}%
                </p>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Overview Stats (when no goal selected) */}
        {!selectedGoal && goals.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
              <p className="text-emerald-200 text-xs">{l.totalSaved}</p>
              <p className="text-xl font-bold">{overallStats.totalSaved.toLocaleString()} {currencyCode}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
              <p className="text-emerald-200 text-xs">{l.remaining}</p>
              <p className="text-xl font-bold">{overallStats.totalRemaining.toLocaleString()} {currencyCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {!selectedGoal ? (
          // Goal List View
          <div className="space-y-4 animate-in fade-in duration-300">
            {goals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <PiggyBank className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-2">
                  {l.noGoals}
                </h3>
                <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
                  {l.noGoalsDesc}
                </p>
                {onAddGoal && (
                  <Button onClick={onAddGoal}>
                    <Plus className="w-4 h-4 mr-2" />
                    {l.createGoal}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-xs font-medium">{l.activeGoals}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{overallStats.activeGoals}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-medium">{l.completed}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{overallStats.completedGoals}</p>
                  </div>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{l.yourGoals}</p>

                <div className="grid gap-4">
                  {goals.map((goal) => {
                    const progress = (goal.currentAmount / goal.targetAmount) * 100;
                    const remaining = goal.targetAmount - goal.currentAmount;
                    const isCompleted = progress >= 100;

                    return (
                      <button
                        key={goal.id}
                        onClick={() => setSelectedGoal(goal)}
                        className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-sm text-left transition-all group ${isCompleted
                          ? 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-300'
                          : 'border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-900/30'
                              : 'bg-indigo-100 dark:bg-indigo-900/30'
                              }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 dark:text-white">{goal.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isCompleted ? l.goalReached : `${l.remaining}: ${remaining.toLocaleString()} ${currencyCode}`}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>{goal.currentAmount.toLocaleString()} {currencyCode}</span>
                            <span>{Math.min(100, progress).toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Contribution Info */}
                        {goal.contributionAmount && !isCompleted && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg w-fit">
                            <Wallet className="w-3 h-3" />
                            {goal.contributionAmount.toLocaleString()} {currencyCode} {getFrequencyLabel(goal.contributionFrequency || 'monthly').toLowerCase()}
                          </div>
                        )}

                        {goal.targetDate && !isCompleted && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {parseLocalDate(goal.targetDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add Goal Button */}
                {onAddGoal && (
                  <Button onClick={onAddGoal} variant="secondary" fullWidth className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {l.createGoal}
                  </Button>
                )}
              </>
            )}
          </div>
        ) : plan ? (
          // Plan Details View
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Goal Completed State */}
            {selectedGoal.currentAmount >= selectedGoal.targetAmount ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-6 text-center border border-emerald-200 dark:border-emerald-800">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">{l.goalReached}</h3>
                <p className="text-emerald-600 dark:text-emerald-400">{l.congratulations}</p>
              </div>
            ) : (
              <>
                {/* Strategy & Status */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStrategyColor(plan.strategy).bg} ${getStrategyColor(plan.strategy).text} font-semibold border ${getStrategyColor(plan.strategy).border}`}>
                    <Zap className="w-4 h-4" />
                    {l.strategy}: {getStrategyLabel(plan.strategy)}
                  </div>
                  {plan.isOnTrack ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> {l.onTrack}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" /> {l.needsAdjustment}
                    </span>
                  )}
                </div>

                {/* Contribution Plan (if configured) */}
                {selectedGoal.contributionAmount && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      {l.contributionPlan}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                          {selectedGoal.contributionAmount.toLocaleString()} {currencyCode}
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 ml-1">{l.perPeriod}</span>
                        </p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">
                          {l.frequency}: {getFrequencyLabel(selectedGoal.contributionFrequency || 'monthly')}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${selectedGoal.autoDeduct
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                        {selectedGoal.autoDeduct ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {l.autoDeduct}: {selectedGoal.autoDeduct ? l.active : l.inactive}
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings Targets */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {l.howMuchToSave}
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">{l.daily}</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {plan.dailyTarget.toFixed(0)} {currencyCode}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">{l.weekly}</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {plan.weeklyTarget.toFixed(0)} {currencyCode}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">{l.monthly}</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {plan.monthlyTarget.toFixed(0)} {currencyCode}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    {l.estimatedDate}: {parseLocalDate(plan.projectedCompletion).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {/* Milestones */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    {l.milestones}
                  </h3>

                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

                    <div className="space-y-4">
                      {plan.milestones.map((milestone) => (
                        <div key={milestone.percentage} className="flex items-start gap-4 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${milestone.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            }`}>
                            {milestone.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <p className={`font-semibold ${milestone.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                {milestone.percentage}% - {milestone.amount.toLocaleString()} {currencyCode}
                              </p>
                              {milestone.isCompleted && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                                  {l.achieved}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              {milestone.isCompleted
                                ? l.achieved
                                : `${l.projected}: ${parseLocalDate(milestone.projectedDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}`
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800">
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    {l.suggestions}
                  </h3>
                  <div className="space-y-3">
                    {plan.suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                fullWidth
                onClick={() => onEditGoal(selectedGoal)}
                className="shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {selectedGoal.contributionAmount ? l.updateGoal : l.configureGoal}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
