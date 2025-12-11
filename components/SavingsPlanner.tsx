import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Goal, Transaction, DashboardStats, SavingsPlan } from '../types';
import { aiCoachService } from '../services/aiCoachService';
import { Button } from './Button';

interface SavingsPlannerProps {
  goals: Goal[];
  transactions: Transaction[];
  stats: DashboardStats;
  currencySymbol: string;
  onBack: () => void;
  onEditGoal: (goal: Goal) => void;
}

export const SavingsPlanner: React.FC<SavingsPlannerProps> = ({
  goals,
  transactions,
  stats,
  currencySymbol,
  onBack,
  onEditGoal
}) => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [plan, setPlan] = useState<SavingsPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPlan = async (goal: Goal) => {
    setLoading(true);
    setSelectedGoal(goal);
    const result = await aiCoachService.generateSavingsPlan(goal, transactions, stats);
    setPlan(result);
    setLoading(false);
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'rose';
      case 'moderate': return 'amber';
      case 'relaxed': return 'emerald';
      default: return 'indigo';
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'Agresivo';
      case 'moderate': return 'Moderado';
      case 'relaxed': return 'Relajado';
      default: return strategy;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={selectedGoal ? () => { setSelectedGoal(null); setPlan(null); } : onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6" />
              Planes de Ahorro
            </h1>
            <p className="text-emerald-200 text-sm mt-1">
              {selectedGoal ? selectedGoal.name : 'Estrategias personalizadas para tus metas'}
            </p>
          </div>
        </div>

        {/* Goal Progress Overview */}
        {selectedGoal && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-emerald-200 text-sm">Progreso actual</p>
                <p className="text-2xl font-bold">
                  {currencySymbol}{selectedGoal.currentAmount.toLocaleString()}
                  <span className="text-emerald-200 text-lg font-normal"> / {currencySymbol}{selectedGoal.targetAmount.toLocaleString()}</span>
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
                style={{ width: `${(selectedGoal.currentAmount / selectedGoal.targetAmount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {!selectedGoal ? (
          // Goal Selection
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Selecciona una meta para generar un plan de ahorro personalizado
            </p>

            {goals.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Target className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-2">
                  No tienes metas
                </h3>
                <p className="text-slate-500 dark:text-slate-500 text-sm">
                  Crea una meta primero para generar un plan de ahorro
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const remaining = goal.targetAmount - goal.currentAmount;
                  
                  return (
                    <button
                      key={goal.id}
                      onClick={() => loadPlan(goal)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm text-left hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-${goal.color || 'indigo'}-100 dark:bg-${goal.color || 'indigo'}-900/30 flex items-center justify-center`}>
                            <Target className={`w-6 h-6 text-${goal.color || 'indigo'}-600 dark:text-${goal.color || 'indigo'}-400`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">{goal.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Faltan {currencySymbol}{remaining.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>{currencySymbol}{goal.currentAmount.toLocaleString()}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${goal.color || 'indigo'}-500 rounded-full`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {goal.deadline && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : loading ? (
          // Loading State
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : plan ? (
          // Plan Details
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Strategy Badge */}
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${getStrategyColor(plan.strategy)}-50 dark:bg-${getStrategyColor(plan.strategy)}-900/30 text-${getStrategyColor(plan.strategy)}-700 dark:text-${getStrategyColor(plan.strategy)}-300 font-semibold`}>
                <Zap className="w-4 h-4" />
                Estrategia: {getStrategyLabel(plan.strategy)}
              </div>
              {plan.isOnTrack ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> En camino
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" /> Requiere ajuste
                </span>
              )}
            </div>

            {/* Savings Targets */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Cuánto Ahorrar
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Diario</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currencySymbol}{plan.dailyTarget.toFixed(0)}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Semanal</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currencySymbol}{plan.weeklyTarget.toFixed(0)}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Mensual</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {currencySymbol}{plan.monthlyTarget.toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                Fecha estimada de logro: {new Date(plan.projectedCompletion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Hitos del Camino
              </h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                
                <div className="space-y-4">
                  {plan.milestones.map((milestone, idx) => (
                    <div key={milestone.percentage} className="flex items-start gap-4 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        milestone.isCompleted 
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
                            {milestone.percentage}% - {currencySymbol}{milestone.amount.toLocaleString()}
                          </p>
                          {milestone.isCompleted && (
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                              ¡Logrado!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {milestone.isCompleted 
                            ? 'Meta alcanzada'
                            : `Proyectado: ${new Date(milestone.projectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
              <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Sugerencias del Coach
              </h3>
              <div className="space-y-3">
                {plan.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <Button
              fullWidth
              onClick={() => onEditGoal(selectedGoal)}
              className="shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Actualizar Progreso de Meta
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-2">
              No se pudo generar el plan
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Verifica tu conexión y que tengas configurada la API de Gemini
            </p>
            <Button onClick={() => loadPlan(selectedGoal)}>
              Reintentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
