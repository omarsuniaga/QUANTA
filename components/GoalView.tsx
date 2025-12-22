import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ArrowLeft, Plane, Shield, Gift, Car, Home, Save, Trash2, Calculator, Calendar, Clock, Wallet, TrendingUp, Info } from 'lucide-react';
import { Goal } from '../types';
import { Button } from './Button';
import { useI18n } from '../contexts/I18nContext';

interface GoalViewProps {
  goal?: Goal | null;
  onSave: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  currencySymbol?: string;
  currencyCode?: string;
  availableBalance?: number;
}

const ICONS = [
  { name: 'plane', icon: Plane },
  { name: 'shield', icon: Shield },
  { name: 'gift', icon: Gift },
  { name: 'car', icon: Car },
  { name: 'home', icon: Home },
  { name: 'save', icon: Save },
];

const COLORS = ['indigo', 'emerald', 'purple', 'rose', 'blue', 'amber'];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', labelEs: 'Semanal', labelEn: 'Weekly', multiplier: 4.33 },
  { value: 'biweekly', labelEs: 'Quincenal', labelEn: 'Biweekly', multiplier: 2 },
  { value: 'monthly', labelEs: 'Mensual', labelEn: 'Monthly', multiplier: 1 },
];

const GoalViewComponent: React.FC<GoalViewProps> = ({
  goal,
  onSave,
  onDelete,
  onBack,
  currencySymbol = '$',
  currencyCode = 'USD',
  availableBalance = 0
}) => {
  const { t, language } = useI18n();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Basic fields
  const [name, setName] = useState(goal?.name || '');
  const [target, setTarget] = useState(goal?.targetAmount.toString() || '');
  const [current, setCurrent] = useState(goal?.currentAmount.toString() || '0');
  const [icon, setIcon] = useState(goal?.icon || 'save');
  const [color, setColor] = useState(goal?.color || 'indigo');

  // Savings plan fields
  const [calculationMode, setCalculationMode] = useState<'time' | 'amount'>(goal?.calculationMode || 'time');
  const [contributionAmount, setContributionAmount] = useState(goal?.contributionAmount?.toString() || '');
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(goal?.contributionFrequency || 'monthly');
  const [targetMonths, setTargetMonths] = useState('12');
  const [autoDeduct, setAutoDeduct] = useState(goal?.autoDeduct ?? true);

  // Calculate target date from months
  const getTargetDateFromMonths = (months: number): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  // Initialize targetMonths from goal's targetDate
  useEffect(() => {
    if (goal?.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const now = new Date();
      const diffMonths = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      setTargetMonths(Math.max(1, diffMonths).toString());
    }
  }, [goal]);

  // Get frequency multiplier (contributions per month)
  const getFrequencyMultiplier = useCallback((freq: string): number => {
    return FREQUENCY_OPTIONS.find(f => f.value === freq)?.multiplier || 1;
  }, []);

  // Calculate remaining amount
  const remainingAmount = useMemo(() => {
    const targetNum = parseFloat(target) || 0;
    const currentNum = parseFloat(current) || 0;
    return Math.max(0, targetNum - currentNum);
  }, [target, current]);

  // Calculate time to reach goal (in months)
  const calculatedTime = useMemo(() => {
    const contribution = parseFloat(contributionAmount) || 0;
    if (contribution <= 0 || remainingAmount <= 0) return null;

    const monthlyContribution = contribution * getFrequencyMultiplier(contributionFrequency);
    const months = remainingAmount / monthlyContribution;
    return Math.ceil(months);
  }, [contributionAmount, contributionFrequency, remainingAmount, getFrequencyMultiplier]);

  // Calculate required contribution to reach goal in target time
  const calculatedContribution = useMemo(() => {
    const months = parseInt(targetMonths) || 0;
    if (months <= 0 || remainingAmount <= 0) return null;

    const multiplier = getFrequencyMultiplier(contributionFrequency);
    const totalContributions = months * multiplier;
    return Math.ceil(remainingAmount / totalContributions);
  }, [targetMonths, contributionFrequency, remainingAmount, getFrequencyMultiplier]);

  // Format time display
  const formatTime = useCallback((months: number): string => {
    if (months < 1) return language === 'es' ? 'Menos de 1 mes' : 'Less than 1 month';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (language === 'es') {
      if (years === 0) return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
      if (remainingMonths === 0) return `${years} ${years === 1 ? 'año' : 'años'}`;
      return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
    } else {
      if (years === 0) return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
      return `${years} ${years === 1 ? 'year' : 'years'} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
  }, [language]);

  // Check if contribution is feasible with available balance
  const isFeasible = useMemo(() => {
    const contribution = parseFloat(contributionAmount) || 0;
    return contribution <= availableBalance;
  }, [contributionAmount, availableBalance]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const finalContribution = calculationMode === 'time'
      ? parseFloat(contributionAmount) || 0
      : calculatedContribution || 0;

    const finalTargetDate = calculationMode === 'amount'
      ? getTargetDateFromMonths(parseInt(targetMonths) || 12)
      : calculatedTime
        ? getTargetDateFromMonths(calculatedTime)
        : undefined;

    onSave({
      id: goal?.id || Math.random().toString(36).substr(2, 9),
      name,
      targetAmount: parseFloat(target) || 0,
      currentAmount: parseFloat(current) || 0,
      icon,
      color,
      contributionAmount: finalContribution,
      contributionFrequency,
      calculationMode,
      targetDate: finalTargetDate,
      autoDeduct,
    });
    onBack();
  }, [calculationMode, contributionAmount, calculatedContribution, targetMonths, calculatedTime, goal, name, target, current, icon, color, contributionFrequency, autoDeduct, onSave, onBack, getTargetDateFromMonths]);

  const handleDelete = useCallback(() => {
    if (goal) {
      onDelete(goal.id);
      onBack();
    }
  }, [goal, onDelete, onBack]);

  const labels = {
    es: {
      editGoal: 'Editar Meta',
      newGoal: 'Nueva Meta',
      goalName: 'Nombre de la Meta',
      goalNamePlaceholder: 'Ej: Viaje a Europa',
      target: 'Objetivo',
      saved: 'Ahorrado',
      icon: 'Icono',
      color: 'Color',
      savingsStrategy: 'Estrategia de Ahorro',
      calculateTime: 'Calcular Tiempo',
      calculateAmount: 'Calcular Aporte',
      contribution: 'Aporte por Período',
      frequency: 'Frecuencia',
      targetTime: 'Tiempo Objetivo',
      months: 'meses',
      autoDeduct: 'Apartar automáticamente',
      autoDeductDesc: 'Deducir de fondos disponibles cada período',
      estimatedTime: 'Tiempo Estimado',
      requiredContribution: 'Aporte Requerido',
      perPeriod: 'por período',
      remaining: 'Restante',
      save: 'Guardar Meta',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      confirmDelete: '¿Eliminar esta meta?',
      confirmDeleteDesc: 'Esta acción no se puede deshacer.',
      insufficientFunds: 'Fondos insuficientes',
      availableBalance: 'Disponible',
      goalReached: '¡Meta alcanzada!',
    },
    en: {
      editGoal: 'Edit Goal',
      newGoal: 'New Goal',
      goalName: 'Goal Name',
      goalNamePlaceholder: 'Ex: Trip to Europe',
      target: 'Target',
      saved: 'Saved',
      icon: 'Icon',
      color: 'Color',
      savingsStrategy: 'Savings Strategy',
      calculateTime: 'Calculate Time',
      calculateAmount: 'Calculate Amount',
      contribution: 'Contribution per Period',
      frequency: 'Frequency',
      targetTime: 'Target Time',
      months: 'months',
      autoDeduct: 'Auto-deduct',
      autoDeductDesc: 'Deduct from available funds each period',
      estimatedTime: 'Estimated Time',
      requiredContribution: 'Required Contribution',
      perPeriod: 'per period',
      remaining: 'Remaining',
      save: 'Save Goal',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Delete this goal?',
      confirmDeleteDesc: 'This action cannot be undone.',
      insufficientFunds: 'Insufficient funds',
      availableBalance: 'Available',
      goalReached: 'Goal reached!',
    }
  };

  const l = labels[language] || labels.es;
  const freqLabel = (freq: typeof FREQUENCY_OPTIONS[0]) => language === 'es' ? freq.labelEs : freq.labelEn;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {goal ? l.editGoal : l.newGoal}
        </h2>
      </div>

      {/* Main content scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Goal Name */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
              {l.goalName}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l.goalNamePlaceholder}
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Target & Saved */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
                {l.target} ({currencySymbol})
              </label>
              <input
                type="number"
                required
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
                {l.saved} ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Remaining Amount Info */}
          {remainingAmount > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{l.remaining}</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {remainingAmount.toLocaleString()} {currencyCode}
              </span>
            </div>
          )}

          {remainingAmount === 0 && parseFloat(target) > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{l.goalReached}</span>
            </div>
          )}

          {/* Savings Strategy Section */}
          {remainingAmount > 0 && (
            <>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  {l.savingsStrategy}
                </label>

                {/* Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setCalculationMode('time')}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      calculationMode === 'time'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {l.calculateTime}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('amount')}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      calculationMode === 'amount'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    {l.calculateAmount}
                  </button>
                </div>

                {/* Frequency Selection */}
                <div className="mb-4">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                    {l.frequency}
                  </label>
                  <div className="flex gap-2">
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => setContributionFrequency(freq.value as any)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          contributionFrequency === freq.value
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {freqLabel(freq)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode-specific inputs */}
                {calculationMode === 'time' ? (
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
                      {l.contribution} ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="1000"
                      className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    {/* Feasibility warning */}
                    {contributionAmount && !isFeasible && (
                      <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          {l.insufficientFunds} ({l.availableBalance}: {availableBalance.toLocaleString()} {currencyCode})
                        </span>
                      </div>
                    )}

                    {/* Calculated Time Result */}
                    {calculatedTime && (
                      <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                          <Clock className="w-4 h-4" />
                          {l.estimatedTime}
                        </div>
                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                          {formatTime(calculatedTime)}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(getTargetDateFromMonths(calculatedTime)).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
                      {l.targetTime} ({l.months})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={targetMonths}
                      onChange={(e) => setTargetMonths(e.target.value)}
                      placeholder="12"
                      className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    {/* Calculated Contribution Result */}
                    {calculatedContribution && (
                      <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                          <Wallet className="w-4 h-4" />
                          {l.requiredContribution}
                        </div>
                        <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                          {calculatedContribution.toLocaleString()} {currencyCode} <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{l.perPeriod}</span>
                        </p>

                        {/* Feasibility check for calculated amount */}
                        {calculatedContribution > availableBalance && (
                          <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {l.insufficientFunds} ({l.availableBalance}: {availableBalance.toLocaleString()} {currencyCode})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Auto-deduct Toggle */}
                <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{l.autoDeduct}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{l.autoDeductDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoDeduct(!autoDeduct)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      autoDeduct ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      autoDeduct ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Icon Selection */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">
              {l.icon}
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    icon === item.name
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">
              {l.color}
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: `var(--color-${c}-500, ${c})` }}
                >
                  <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Footer fixed con acciones siempre visibles */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
        {goal && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteDialog(true)}
            className="px-4"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          {l.cancel}
        </Button>
        <Button type="submit" onClick={handleSubmit} className="flex-1 shadow-lg shadow-indigo-200 dark:shadow-none">
          {l.save}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {l.confirmDelete}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              {l.confirmDeleteDesc}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
                fullWidth
              >
                {l.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setShowDeleteDialog(false);
                  handleDelete();
                }}
                fullWidth
              >
                {l.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: GoalViewProps, nextProps: GoalViewProps) => {
  return (
    prevProps.goal === nextProps.goal &&
    prevProps.currencySymbol === nextProps.currencySymbol &&
    prevProps.currencyCode === nextProps.currencyCode &&
    prevProps.availableBalance === nextProps.availableBalance &&
    prevProps.onSave === nextProps.onSave &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onBack === nextProps.onBack
  );
};

export const GoalView = memo(GoalViewComponent, arePropsEqual);
