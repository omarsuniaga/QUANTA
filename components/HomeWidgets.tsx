import React, { useState, useEffect, useMemo } from 'react';
import { Goal, Promo } from '../types';
import { GOAL_ICONS } from '../constants';
import { Plane, ShoppingBag, Gift, Star, Coffee, Music, Plus, Edit2, Info, X, Calendar, Clock, AlertTriangle, CheckCircle2, Wallet, TrendingUp, Play, Trash2 } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { parseLocalDate } from '../utils/dateHelpers';

// --- INFO CONTENT BY LANGUAGE ---
const INFO_CONTENT = {
  goals: {
    en: {
      title: 'Goals',
      description: 'Goals are financial objectives with specific amounts and measurable progress. Set a target amount and track your savings over time until you reach your goal.',
      examplesLabel: 'Examples',
      examples: [
        '🚗 Save $5,000 for a car',
        '🏠 Emergency fund of $10,000',
        '🎓 Pay for college tuition',
        '💻 Buy a new laptop',
      ]
    },
    es: {
      title: 'Metas',
      description: 'Las metas son objetivos financieros con montos específicos y progreso medible. Establece un monto objetivo y rastrea tus ahorros hasta alcanzar tu meta.',
      examplesLabel: 'Ejemplos',
      examples: [
        '🚗 Ahorrar $5,000 para un auto',
        '🏠 Fondo de emergencia de $10,000',
        '🎓 Pagar la universidad',
        '💻 Comprar una laptop nueva',
      ]
    }
  },
  ideas: {
    en: {
      title: 'Ideas & Plans',
      description: 'Visual reminders for future ideas, plans, or aspirations related to your finances. Unlike Goals, these don\'t have specific amounts - they\'re notes to keep in mind.',
      examplesLabel: 'Examples',
      examples: [
        '✈️ Trip to Europe next year',
        '🎁 Gift ideas for Christmas',
        '☕ Try that new coffee shop',
        '🛒 Future shopping list',
      ]
    },
    es: {
      title: 'Ideas y Planes',
      description: 'Recordatorios visuales para ideas, planes o aspiraciones futuras relacionadas con tus finanzas. A diferencia de las Metas, no tienen montos específicos, son notas para tener presentes.',
      examplesLabel: 'Ejemplos',
      examples: [
        '✈️ Viaje a Europa el próximo año',
        '🎁 Ideas de regalos para navidad',
        '☕ Probar esa cafetería nueva',
        '🛒 Lista de compras futuras',
      ]
    }
  }
};

// --- INFO MODAL COMPONENT ---
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'goals' | 'ideas';
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, type }) => {
  const { language } = useI18n();
  const content = INFO_CONTENT[type][language];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <Info className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{content.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{content.description}</p>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{content.examplesLabel}:</p>
          {content.examples.map((example, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {example}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- GOALS WIDGET ---
interface GoalsWidgetProps {
  goals: Goal[];
  onAddContribution: (goalId: string, amount: number) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: () => void;
  onDeleteContribution?: (goalId: string, contributionIndex: number) => void;
  currencySymbol?: string;
  currencyCode?: string;
  availableBalance?: number;
}

// Check if contribution was made in current period
const hasContributionInCurrentPeriod = (goal: Goal): boolean => {
  if (!goal.contributionHistory || goal.contributionHistory.length === 0) return false;
  if (!goal.contributionFrequency) return false;

  const now = new Date();
  const lastContrib = goal.contributionHistory[goal.contributionHistory.length - 1];
  const lastDate = parseLocalDate(lastContrib.date);

  // Calculate the start of the current period
  let periodStart = new Date(now);
  switch (goal.contributionFrequency) {
    case 'weekly':
      // Start of current week (Sunday)
      periodStart.setDate(now.getDate() - now.getDay());
      periodStart.setHours(0, 0, 0, 0);
      break;
    case 'biweekly':
      // Approximate: last 14 days
      periodStart.setDate(now.getDate() - 14);
      periodStart.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    default:
      // Start of current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return lastDate >= periodStart;
};

// Helper to calculate time remaining
const calculateTimeRemaining = (goal: Goal): { months: number; text: string; textEs: string } => {
  if (goal.currentAmount >= goal.targetAmount) {
    return { months: 0, text: 'Goal reached!', textEs: '¡Meta alcanzada!' };
  }

  const remaining = goal.targetAmount - goal.currentAmount;

  // If has contribution amount, calculate based on that
  if (goal.contributionAmount && goal.contributionAmount > 0) {
    let periodsNeeded = remaining / goal.contributionAmount;
    let months = 0;

    switch (goal.contributionFrequency) {
      case 'weekly': months = periodsNeeded / 4.33; break;
      case 'biweekly': months = periodsNeeded / 2; break;
      case 'monthly':
      default: months = periodsNeeded; break;
    }

    if (months < 1) {
      const weeks = Math.ceil(months * 4.33);
      return {
        months,
        text: `~${weeks} week${weeks > 1 ? 's' : ''} remaining`,
        textEs: `~${weeks} semana${weeks > 1 ? 's' : ''} restante${weeks > 1 ? 's' : ''}`
      };
    } else if (months < 12) {
      const m = Math.ceil(months);
      return {
        months,
        text: `~${m} month${m > 1 ? 's' : ''} remaining`,
        textEs: `~${m} mes${m > 1 ? 'es' : ''} restante${m > 1 ? 's' : ''}`
      };
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = Math.ceil(months % 12);
      if (remainingMonths > 0) {
        return {
          months,
          text: `~${years}y ${remainingMonths}m remaining`,
          textEs: `~${years}a ${remainingMonths}m restantes`
        };
      }
      return {
        months,
        text: `~${years} year${years > 1 ? 's' : ''} remaining`,
        textEs: `~${years} año${years > 1 ? 's' : ''} restante${years > 1 ? 's' : ''}`
      };
    }
  }

  // If has target date
  if (goal.targetDate) {
    const targetDate = parseLocalDate(goal.targetDate);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { months: 0, text: 'Deadline passed', textEs: 'Fecha límite pasada' };
    } else if (diffDays < 30) {
      return {
        months: diffDays / 30,
        text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`,
        textEs: `${diffDays} día${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`
      };
    } else {
      const months = Math.ceil(diffDays / 30);
      return {
        months,
        text: `${months} month${months > 1 ? 's' : ''} left`,
        textEs: `${months} mes${months > 1 ? 'es' : ''} restante${months > 1 ? 's' : ''}`
      };
    }
  }

  return { months: -1, text: 'No plan set', textEs: 'Sin plan definido' };
};

// Get next contribution date
const getNextContributionDate = (goal: Goal): Date | null => {
  if (!goal.contributionAmount || !goal.contributionFrequency) return null;

  const now = new Date();
  let nextDate: Date;

  if (goal.nextContributionDate) {
    nextDate = parseLocalDate(goal.nextContributionDate);
    if (nextDate > now) return nextDate;
  }

  // Calculate from last contribution or from now
  const baseDate = goal.lastContributionDate ? parseLocalDate(goal.lastContributionDate) : now;
  nextDate = new Date(baseDate);

  switch (goal.contributionFrequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  // If next date is in the past, calculate from now
  while (nextDate <= now) {
    switch (goal.contributionFrequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
  }

  return nextDate;
};

// Check if contribution is due
const isContributionDue = (goal: Goal): boolean => {
  const nextDate = getNextContributionDate(goal);
  if (!nextDate) return false;

  const now = new Date();
  const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 3; // Due within 3 days
};

// Generate upcoming contribution dates (next N)
const getUpcomingContributionDates = (goal: Goal, count = 3): Date[] => {
  const dates: Date[] = [];
  const next = getNextContributionDate(goal);
  if (!next) return dates;
  const freq = goal.contributionFrequency || 'monthly';
  let cur = new Date(next);
  for (let i = 0; i < count; i++) {
    dates.push(new Date(cur));
    switch (freq) {
      case 'weekly': cur.setDate(cur.getDate() + 7); break;
      case 'biweekly': cur.setDate(cur.getDate() + 14); break;
      case 'monthly':
      default: cur.setMonth(cur.getMonth() + 1); break;
    }
  }
  return dates;
};

// Calculate contributions needed to reach goal
const getContributionsNeeded = (goal: Goal): number | null => {
  if (!goal.contributionAmount || goal.contributionAmount <= 0) return null;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  return Math.ceil(remaining / goal.contributionAmount);
};

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({
  goals,
  onAddContribution,
  onEditGoal,
  onAddGoal,
  onDeleteContribution,
  currencySymbol = '$',
  currencyCode = 'USD',
  availableBalance = 0
}) => {
  const { language } = useI18n();
  const [showInfo, setShowInfo] = useState(false);
  const [showContribConfirm, setShowContribConfirm] = useState<string | null>(null);
  const mainGoal = goals[0];

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Labels
  const l = useMemo(() => ({
    percentCompleted: language === 'es' ? 'Progreso' : 'Progress',
    lastContribution: language === 'es' ? 'Último aporte' : 'Last contribution',
    contributionsNeeded: language === 'es' ? 'Aportes restantes' : 'Contributions needed',
    upcomingContributions: language === 'es' ? 'Próx. aportes' : 'Upcoming contributions',
    recentContributions: language === 'es' ? 'Aportes recientes' : 'Recent contributions',
    viewDetails: language === 'es' ? 'Ver detalles' : 'View details',
    totalSaved: language === 'es' ? 'Total Ahorrado' : 'Total Saved',
    newGoal: language === 'es' ? 'Nueva Meta' : 'New Goal',
    mainGoal: language === 'es' ? 'Meta Principal' : 'Main Goal',
    target: language === 'es' ? 'Objetivo' : 'Target',
    remaining: language === 'es' ? 'Faltan' : 'Remaining',
    toReachGoal: language === 'es' ? 'para alcanzar tu meta' : 'to reach your goal',
    nextContribution: language === 'es' ? 'Próx. aporte' : 'Next contribution',
    contributionOf: language === 'es' ? 'Aporte de' : 'Contribution of',
    insufficientFunds: language === 'es' ? 'Fondos insuficientes' : 'Insufficient funds',
    makeContribution: language === 'es' ? 'Aportar' : 'Contribute',
    goalReached: language === 'es' ? '¡Meta Alcanzada!' : 'Goal Reached!',
    configurePlan: language === 'es' ? 'Configurar plan' : 'Configure plan',
    due: language === 'es' ? 'Pendiente' : 'Due',
    availableBalance: language === 'es' ? 'Saldo disponible' : 'Available balance',
    alreadyContributed: language === 'es' ? 'Ya aportaste en este período' : 'Already contributed this period',
    confirmAnotherContrib: language === 'es' ? '¿Agregar otro aporte?' : 'Add another contribution?',
    yes: language === 'es' ? 'Sí, aportar' : 'Yes, contribute',
    no: language === 'es' ? 'Cancelar' : 'Cancel',
    deleteContribution: language === 'es' ? 'Eliminar' : 'Delete',
  }), [language]);

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, Record<string, string>> = {
      weekly: { es: 'semanal', en: 'weekly' },
      biweekly: { es: 'quincenal', en: 'biweekly' },
      monthly: { es: 'mensual', en: 'monthly' }
    };
    return labels[freq]?.[language] || freq;
  };

  // Handle contribution click - check if already contributed in period
  const handleContribute = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    if (!goal.contributionAmount || availableBalance < goal.contributionAmount) return;

    // Check if already contributed in this period
    if (hasContributionInCurrentPeriod(goal)) {
      setShowContribConfirm(goal.id);
    } else {
      onAddContribution(goal.id, goal.contributionAmount);
    }
  };

  // Confirm adding another contribution
  const confirmContribution = (goal: Goal) => {
    if (goal.contributionAmount) {
      onAddContribution(goal.id, goal.contributionAmount);
    }
    setShowContribConfirm(null);
  };

  // Handle delete contribution
  const handleDeleteContribution = (e: React.MouseEvent, goalId: string, index: number) => {
    e.stopPropagation();
    if (onDeleteContribution && window.confirm(language === 'es' ? '¿Eliminar este aporte?' : 'Delete this contribution?')) {
      onDeleteContribution(goalId, index);
    }
  };

  return (
    <div className="mt-4 sm:mt-6">
      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        type="goals"
      />
      <div className="flex justify-between items-end mb-3 px-1">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{l.totalSaved}</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{totalSaved.toLocaleString()} {currencyCode}</p>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Info about Goals"
          >
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
        <button
          onClick={onAddGoal}
          className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {l.newGoal}
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
        {/* Main Goal Card */}
        {mainGoal && (() => {
          const timeInfo = calculateTimeRemaining(mainGoal);
          const nextContribDate = getNextContributionDate(mainGoal);
          const isDue = isContributionDue(mainGoal);
          const hasContribution = mainGoal.contributionAmount && mainGoal.contributionAmount > 0;
          const canContribute = hasContribution && availableBalance >= (mainGoal.contributionAmount || 0);
          const insufficientFunds = hasContribution && !canContribute;
          const isCompleted = mainGoal.currentAmount >= mainGoal.targetAmount;
          const progress = Math.min(100, (mainGoal.currentAmount / mainGoal.targetAmount) * 100);
          const contributionsNeeded = getContributionsNeeded(mainGoal);

          return (
            <div
              onClick={() => onEditGoal(mainGoal)}
              className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all sm:col-span-2 lg:col-span-1"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-${mainGoal.color || 'indigo'}-50 dark:bg-${mainGoal.color || 'indigo'}-900/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110`}></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">{mainGoal.name}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{l.mainGoal}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditGoal(mainGoal); }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-${mainGoal.color || 'indigo'}-100 dark:bg-${mainGoal.color || 'indigo'}-900/40 text-${mainGoal.color || 'indigo'}-600 dark:text-${mainGoal.color || 'indigo'}-400 hover:bg-${mainGoal.color || 'indigo'}-200 dark:hover:bg-${mainGoal.color || 'indigo'}-900/60 transition-colors`}
                  >
                    {mainGoal.icon && GOAL_ICONS[mainGoal.icon]
                      ? React.createElement(GOAL_ICONS[mainGoal.icon], { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" })
                      : <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    }
                  </button>
                </div>

                {/* Progress Section */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">{mainGoal.currentAmount.toLocaleString()} {currencyCode}</span>
                    <span className="text-slate-400 dark:text-slate-500">{l.target}: {mainGoal.targetAmount.toLocaleString()} {currencyCode}</span>
                  </div>
                  <div className="h-2 sm:h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isCompleted ? 'bg-emerald-500' : `bg-${mainGoal.color || 'indigo'}-500`} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  {/* Info Row */}
                  <div className="flex justify-between items-center mt-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] sm:text-xs font-bold">{l.goalReached}</span>
                      </div>
                    ) : (
                      <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {l.remaining}: <span className="text-slate-600 dark:text-slate-400 font-bold">{(mainGoal.targetAmount - mainGoal.currentAmount).toLocaleString()} {currencyCode}</span>
                      </p>
                    )}

                    {/* Time remaining */}
                    {!isCompleted && timeInfo.months >= 0 && (
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px] sm:text-[10px] font-medium">
                          {language === 'es' ? timeInfo.textEs : timeInfo.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Extra details: progress, contributions needed, last contribution */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-[12px] sm:text-sm font-bold text-slate-700 dark:text-slate-200">{Math.round(progress)}%</div>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">{l.percentCompleted}</p>
                      </div>
                      {hasContribution && (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">{l.contributionsNeeded}:</span>
                          <span className="text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-200">{contributionsNeeded !== null ? contributionsNeeded : '-'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                      {mainGoal.contributionHistory && mainGoal.contributionHistory.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] sm:text-[10px] font-medium">{l.lastContribution}:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{mainGoal.contributionHistory[mainGoal.contributionHistory.length - 1].amount.toLocaleString()} {currencyCode}</span>
                          <span className="text-slate-400 dark:text-slate-500">·</span>
                          <span>{parseLocalDate(mainGoal.contributionHistory[mainGoal.contributionHistory.length - 1].date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500">{l.configurePlan}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditGoal(mainGoal); }}
                      className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      {l.viewDetails}
                    </button>
                  </div>
                </div>

                {/* Contribution Info */}
                {hasContribution && !isCompleted && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    {/* Next contribution date */}
                    {nextContribDate && (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[9px] sm:text-[10px] font-medium">
                            {l.nextContribution}: {nextContribDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {isDue && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
                            {l.due}
                          </span>
                        )}
                      </div>
                    )}
                    {hasContribution && (
                      <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        {getUpcomingContributionDates(mainGoal, 2).map((d, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                        ))}
                      </div>
                    )}

                    {/* Contribution amount and action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-indigo-500" />
                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {l.contributionOf} <span className="font-bold">{mainGoal.contributionAmount?.toLocaleString()} {currencyCode}</span> {getFrequencyLabel(mainGoal.contributionFrequency || 'monthly')}
                        </span>
                      </div>
                    </div>

                    {/* Insufficient funds warning */}
                    {insufficientFunds && (
                      <div className="mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-1.5 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[9px] sm:text-[10px] font-medium">
                          {l.insufficientFunds} ({l.availableBalance}: {availableBalance.toLocaleString()} {currencyCode})
                        </span>
                      </div>
                    )}

                    {/* Contribute button - More discrete, not full width */}
                    {canContribute && (
                      <div className="mt-2 flex items-center justify-between">
                        {/* Already contributed warning */}
                        {hasContributionInCurrentPeriod(mainGoal) && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                            ⚠️ {l.alreadyContributed}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleContribute(e, mainGoal)}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors ml-auto"
                        >
                          <Play className="w-3 h-3" />
                          {l.makeContribution} ({mainGoal.contributionAmount?.toLocaleString()} {currencyCode})
                        </button>
                      </div>
                    )}

                    {/* Confirmation modal for duplicate contribution */}
                    {showContribConfirm === mainGoal.id && (
                      <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 mb-2">
                          {l.confirmAnotherContrib}
                        </p>
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mb-3">
                          {l.alreadyContributed}
                        </p>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowContribConfirm(null); }}
                            className="px-3 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            {l.no}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmContribution(mainGoal); }}
                            className="px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                          >
                            {l.yes}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recent contributions with delete option */}
                    {mainGoal.contributionHistory && mainGoal.contributionHistory.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                        <p className="text-[10px] sm:text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">{l.recentContributions}</p>
                        <div className="space-y-1.5">
                          {mainGoal.contributionHistory.slice(-5).reverse().map((c, idx) => {
                            // Calculate the actual index in the original array
                            const actualIndex = mainGoal.contributionHistory!.length - 1 - idx;
                            return (
                              <div key={idx} className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 group">
                                <span>{parseLocalDate(c.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">{c.amount.toLocaleString()} {currencyCode}</span>
                                  {onDeleteContribution && (
                                    <button
                                      onClick={(e) => handleDeleteContribution(e, mainGoal.id, actualIndex)}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all"
                                      title={l.deleteContribution}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No plan configured */}
                {!hasContribution && !isCompleted && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-[9px] sm:text-[10px] font-medium">{l.configurePlan}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Mini Goals List (Horizontal scroll on mobile) */}
      <div className="flex sm:hidden gap-3 mt-4 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
        {goals.slice(1).map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          return (
            <div
              key={goal.id}
              onClick={() => onEditGoal(goal)}
              className="min-w-[120px] bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70px]">{goal.name}</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <div className={`w-2 h-2 rounded-full bg-${goal.color}-400`}></div>
                )}
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <div className={`h-full ${isCompleted ? 'bg-emerald-500' : `bg-${goal.color}-500`}`} style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{(goal.targetAmount - goal.currentAmount).toLocaleString()} {currencyCode} {language === 'es' ? 'faltan' : 'left'}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium text-right">{Math.round(progress)}%</span>
              </div>
            </div>
          );
        })}

        <button
          onClick={onAddGoal}
          className="min-w-[40px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- PROMOS WIDGET ---
interface PromoCarouselProps {
  promos: Promo[];
  onEditPromo: (promo: Promo) => void;
  onAddPromo: () => void;
}

const PROMO_ICONS: Record<string, any> = {
  Plane, ShoppingBag, Gift, Star, Coffee, Music
};

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ promos, onEditPromo, onAddPromo }) => {
  const [showInfo, setShowInfo] = useState(false);
  const { language } = useI18n();

  const labels = useMemo(() => ({
    title: language === 'es' ? 'Ideas y Planes' : 'Ideas & Plans',
    infoAriaLabel: language === 'es' ? 'Información sobre Ideas y Planes' : 'Info about Ideas & Plans',
  }), [language]);

  return (
    <div className="mt-6 sm:mt-8 mb-16 sm:mb-24">
      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        type="ideas"
      />
      <div className="flex justify-between items-center px-1 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{labels.title}</h3>
          <button
            onClick={() => setShowInfo(true)}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={labels.infoAriaLabel}
          >
            <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        </div>
        <button onClick={onAddPromo} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-1 sm:p-1.5 rounded-lg">
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 sm:-mx-5 px-4 sm:px-5">
        {promos.map(promo => {
          const Icon = PROMO_ICONS[promo.icon] || Star;
          return (
            <div
              key={promo.id}
              onClick={() => onEditPromo(promo)}
              className="min-w-[160px] sm:min-w-[200px] bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02] cursor-pointer active:scale-95"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center bg-${promo.color}-50 dark:bg-${promo.color}-900/30 text-${promo.color}-600 dark:text-${promo.color}-400 shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">{promo.title}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{promo.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};