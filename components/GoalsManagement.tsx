import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Target,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  Wallet,
  ChevronRight,
  Trophy,
  AlertCircle,
  Settings2,
  Clock,
  RefreshCcw,
  PiggyBank,
  Check,
  Minus,
  DollarSign
} from 'lucide-react';
import { Goal } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { Button } from './Button';
import { ModalWrapper } from './ModalWrapper';
import { useCurrency } from '../hooks/useCurrency';

interface GoalsManagementProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (goal: Goal) => void;
  availableBalance?: number;
}

export const GoalsManagement: React.FC<GoalsManagementProps> = ({
  isOpen,
  onClose,
  goals,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onUpdateGoal,
  availableBalance = 0
}) => {
  const { formatAmount, parseAmount, currencySymbol, currencyCode } = useCurrency();
  const { language } = useI18n();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionType, setContributionType] = useState<'add' | 'subtract'>('add');

  // Labels bilingües
  const l = {
    title: language === 'es' ? 'Gestión de Metas' : 'Goals Management',
    subtitle: language === 'es' ? 'Administra tus metas de ahorro' : 'Manage your savings goals',
    noGoals: language === 'es' ? 'No tienes metas aún' : 'No goals yet',
    noGoalsDesc: language === 'es' ? 'Crea tu primera meta para comenzar a ahorrar' : 'Create your first goal to start saving',
    addGoal: language === 'es' ? 'Nueva Meta' : 'New Goal',
    editGoal: language === 'es' ? 'Editar Meta' : 'Edit Goal',
    deleteGoal: language === 'es' ? 'Eliminar' : 'Delete',
    deleteConfirm: language === 'es' ? '¿Estás seguro de eliminar esta meta?' : 'Are you sure you want to delete this goal?',

    // Estados
    progress: language === 'es' ? 'Progreso' : 'Progress',
    remaining: language === 'es' ? 'Faltan' : 'Remaining',
    saved: language === 'es' ? 'Ahorrado' : 'Saved',
    target: language === 'es' ? 'Objetivo' : 'Target',
    completed: language === 'es' ? '¡Completada!' : 'Completed!',

    // Contribuciones
    contribution: language === 'es' ? 'Aporte' : 'Contribution',
    contributionFreq: language === 'es' ? 'Frecuencia de aporte' : 'Contribution frequency',
    weekly: language === 'es' ? 'Semanal' : 'Weekly',
    biweekly: language === 'es' ? 'Quincenal' : 'Biweekly',
    monthly: language === 'es' ? 'Mensual' : 'Monthly',
    estimatedDate: language === 'es' ? 'Fecha estimada' : 'Estimated date',
    nextContribution: language === 'es' ? 'Próximo aporte' : 'Next contribution',

    // Acciones
    addContribution: language === 'es' ? 'Agregar Aporte' : 'Add Contribution',
    adjustAmount: language === 'es' ? 'Ajustar Monto' : 'Adjust Amount',
    quickAdd: language === 'es' ? 'Aporte rápido' : 'Quick add',
    quickSubtract: language === 'es' ? 'Corregir monto' : 'Correct amount',
    add: language === 'es' ? 'Agregar' : 'Add',
    subtract: language === 'es' ? 'Restar' : 'Subtract',

    // Modal de contribución
    contributionTitle: language === 'es' ? 'Registrar Aporte' : 'Record Contribution',
    contributionSubtitle: language === 'es' ? 'Actualiza el progreso de tu meta' : 'Update your goal progress',
    amount: language === 'es' ? 'Monto' : 'Amount',
    currentBalance: language === 'es' ? 'Balance actual de meta' : 'Current goal balance',
    newBalance: language === 'es' ? 'Nuevo balance' : 'New balance',
    save: language === 'es' ? 'Guardar' : 'Save',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',

    // Alertas
    noFunds: language === 'es' ? 'Fondos insuficientes' : 'Insufficient funds',
    available: language === 'es' ? 'Disponible' : 'Available',

    // Estadísticas
    totalSaved: language === 'es' ? 'Total Ahorrado' : 'Total Saved',
    activeGoals: language === 'es' ? 'Metas Activas' : 'Active Goals',
    completedGoals: language === 'es' ? 'Metas Completadas' : 'Completed Goals',
    avgProgress: language === 'es' ? 'Progreso Promedio' : 'Average Progress',
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const completed = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const active = goals.length - completed;
    const avgProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return { totalSaved, totalTarget, completed, active, avgProgress };
  }, [goals]);

  // Calcular progreso y tiempo restante
  const getGoalDetails = (goal: Goal) => {
    const progress = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const isCompleted = goal.currentAmount >= goal.targetAmount;

    // Calcular tiempo restante
    let estimatedDate = null;
    if (goal.contributionAmount && goal.contributionFrequency && remaining > 0) {
      const multiplier = goal.contributionFrequency === 'weekly' ? 4.33
        : goal.contributionFrequency === 'biweekly' ? 2 : 1;
      const monthlyContribution = goal.contributionAmount * multiplier;
      const monthsRemaining = Math.ceil(remaining / monthlyContribution);
      const date = new Date();
      date.setMonth(date.getMonth() + monthsRemaining);
      estimatedDate = date;
    }

    return { progress, remaining, isCompleted, estimatedDate };
  };

  // Manejar contribución
  const handleContribution = () => {
    if (!selectedGoal || !contributionAmount) return;

    const amount = parseAmount(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newAmount = contributionType === 'add'
      ? selectedGoal.currentAmount + amount
      : Math.max(0, selectedGoal.currentAmount - amount);

    onUpdateGoal({
      ...selectedGoal,
      currentAmount: newAmount,
      lastContributionDate: new Date().toISOString(),
      contributionHistory: [
        ...(selectedGoal.contributionHistory || []),
        { date: new Date().toISOString(), amount: contributionType === 'add' ? amount : -amount }
      ]
    });

    setShowContributionModal(false);
    setContributionAmount('');
    setSelectedGoal(null);
  };

  // Abrir modal de contribución
  const openContributionModal = (goal: Goal, type: 'add' | 'subtract') => {
    setSelectedGoal(goal);
    setContributionType(type);
    setContributionAmount('');
    setShowContributionModal(true);
  };

  // Confirmar eliminación
  const confirmDelete = (goal: Goal) => {
    if (window.confirm(l.deleteConfirm)) {
      onDeleteGoal(goal.id);
    }
  };

  // Color según progreso
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'emerald';
    if (progress >= 75) return 'green';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    return 'rose';
  };

  // Formato de fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  // Formato de frecuencia
  const formatFrequency = (freq?: string) => {
    if (!freq) return '';
    if (freq === 'weekly') return l.weekly;
    if (freq === 'biweekly') return l.biweekly;
    return l.monthly;
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl lg:max-w-3xl max-h-[85vh] mt-12 mb-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{l.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{l.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Stats Summary */}
          {goals.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{l.totalSaved}</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatAmount(stats.totalSaved)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{l.activeGoals}</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.active}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{l.completedGoals}</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.completed}</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{l.avgProgress}</p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{stats.avgProgress}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{l.noGoals}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{l.noGoalsDesc}</p>
              <Button onClick={onAddGoal}>
                <Plus className="w-4 h-4 mr-2" />
                {l.addGoal}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const { progress, remaining, isCompleted, estimatedDate } = getGoalDetails(goal);
                const colorName = getProgressColor(progress);

                return (
                  <div
                    key={goal.id}
                    className={`bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border-2 ${isCompleted
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-transparent'
                      }`}
                  >
                    {/* Goal Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${goal.color || 'indigo'}-100 dark: bg-${goal.color || 'indigo'}-900/30 text-${goal.color || 'indigo'}-600 dark: text-${goal.color || 'indigo'}-400`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {goal.name}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                <Trophy className="w-3 h-3" />
                                {l.completed}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {l.target}: {formatAmount(goal.targetAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditGoal(goal)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(goal)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {formatAmount(goal.currentAmount)}
                        </span>
                        <span className={`text-sm font-bold text-${colorName}-600 dark: text-${colorName}-400`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from -${colorName}-400 to-${colorName}-500 dark: from -${colorName}-500 dark: to-${colorName}-400 rounded-full transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-xs">
                      {!isCompleted && (
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg">
                          <p className="text-slate-500 dark:text-slate-400">{l.remaining}</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {formatAmount(remaining)}
                          </p>
                        </div>
                      )}
                      {goal.contributionAmount && (
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg">
                          <p className="text-slate-500 dark:text-slate-400">{l.contribution}</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {formatAmount(goal.contributionAmount)} / {formatFrequency(goal.contributionFrequency)}
                          </p>
                        </div>
                      )}
                      {estimatedDate && !isCompleted && (
                        <div className="bg-white dark:bg-slate-700 p-2 rounded-lg">
                          <p className="text-slate-500 dark:text-slate-400">{l.estimatedDate}</p>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {formatDate(estimatedDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openContributionModal(goal, 'add')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {l.quickAdd}
                      </button>
                      <button
                        onClick={() => openContributionModal(goal, 'subtract')}
                        className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                        {l.quickSubtract}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700">
          <Button fullWidth onClick={onAddGoal}>
            <Plus className="w-4 h-4 mr-2" />
            {l.addGoal}
          </Button>
        </div>

        {/* Contribution Modal */}
        {showContributionModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowContributionModal(false)}>
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contributionType === 'add'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                  {contributionType === 'add' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{l.contributionTitle}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedGoal.name}</p>
                </div>
              </div>

              {/* Current Balance */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{l.currentBalance}</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {formatAmount(selectedGoal.currentAmount)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">
                  {l.amount} ({currencySymbol})
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={contributionAmount}
                    onChange={e => setContributionAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* New Balance Preview */}
              {contributionAmount && (
                <div className={`p-3 rounded-xl mb-4 ${contributionType === 'add'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${contributionType === 'add'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                      }`}>{l.newBalance}</span>
                    <span className={`font-bold ${contributionType === 'add'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                      }`}>
                      {(contributionType === 'add'
                        ? formatAmount(selectedGoal.currentAmount + (parseAmount(contributionAmount) || 0))
                        : formatAmount(Math.max(0, selectedGoal.currentAmount - (parseAmount(contributionAmount) || 0)))
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContributionModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  {l.cancel}
                </button>
                <button
                  onClick={handleContribution}
                  disabled={!contributionAmount || parseAmount(contributionAmount) <= 0}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-colors disabled: opacity-50 disabled: cursor-not-allowed ${contributionType === 'add'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {l.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
