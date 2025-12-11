import React, { useState, useEffect } from 'react';
import {
  PieChart,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Target,
  Lightbulb,
  ChevronRight,
  DollarSign,
  Percent,
  Award,
  Sparkles
} from 'lucide-react';
import { Transaction, DashboardStats, FinancialStrategy, StrategyAllocation } from '../types';
import { aiCoachService } from '../services/aiCoachService';
import { Button } from './Button';

interface StrategiesScreenProps {
  transactions: Transaction[];
  stats: DashboardStats;
  currencySymbol: string;
  currencyCode: string;
  onBack: () => void;
}

export const StrategiesScreen: React.FC<StrategiesScreenProps> = ({
  transactions,
  stats,
  currencySymbol,
  currencyCode,
  onBack
}) => {
  const [strategies, setStrategies] = useState<FinancialStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<FinancialStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, [transactions]);

  const loadStrategies = async () => {
    setLoading(true);
    const result = await aiCoachService.analyzeStrategy(transactions, stats);
    setStrategies(result);
    // Auto-select the first (most compatible) strategy
    if (result.length > 0) {
      const sorted = [...result].sort((a, b) => b.compatibility - a.compatibility);
      setSelectedStrategy(sorted[0]);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return CheckCircle2;
      case 'over': return AlertTriangle;
      case 'under': return TrendingDown;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'emerald';
      case 'over': return 'rose';
      case 'under': return 'amber';
      default: return 'slate';
    }
  };

  const getCompatibilityColor = (compatibility: number) => {
    if (compatibility >= 80) return 'emerald';
    if (compatibility >= 60) return 'blue';
    if (compatibility >= 40) return 'amber';
    return 'rose';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'needs': return 'Necesidades';
      case 'wants': return 'Deseos';
      case 'savings': return 'Ahorros';
      case 'investments': return 'Inversiones';
      case 'debt': return 'Deudas';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'needs': return 'blue';
      case 'wants': return 'purple';
      case 'savings': return 'emerald';
      case 'investments': return 'amber';
      case 'debt': return 'rose';
      default: return 'slate';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 sm:px-6 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <PieChart className="w-6 h-6" />
              Estrategias Financieras
            </h1>
            <p className="text-violet-200 text-sm mt-1">
              Planes de distribución de ingresos
            </p>
          </div>
        </div>

        {/* Strategy Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {strategies.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy)}
              className={`shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedStrategy?.id === strategy.id
                  ? 'bg-white text-violet-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {strategy.rule}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : selectedStrategy ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Strategy Overview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedStrategy.name}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {selectedStrategy.description}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-bold bg-${getCompatibilityColor(selectedStrategy.compatibility)}-100 dark:bg-${getCompatibilityColor(selectedStrategy.compatibility)}-900/30 text-${getCompatibilityColor(selectedStrategy.compatibility)}-700 dark:text-${getCompatibilityColor(selectedStrategy.compatibility)}-300`}>
                  {selectedStrategy.compatibility}% compatible
                </div>
              </div>

              {/* Compatibility Meter */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Tu compatibilidad con esta estrategia</span>
                  <span>{selectedStrategy.compatibility}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-${getCompatibilityColor(selectedStrategy.compatibility)}-400 to-${getCompatibilityColor(selectedStrategy.compatibility)}-600 rounded-full transition-all duration-700`}
                    style={{ width: `${selectedStrategy.compatibility}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Visual Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                Distribución Ideal vs Actual
              </h3>

              {/* Pie Chart Visualization */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {selectedStrategy.allocations.reduce((acc, alloc, idx) => {
                      const prevOffset = acc.offset;
                      const strokeDasharray = `${alloc.targetPercentage} ${100 - alloc.targetPercentage}`;
                      const color = getCategoryColor(alloc.category);
                      
                      acc.elements.push(
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={`var(--color-${color}-500, #6366f1)`}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-prevOffset}
                          className="opacity-30"
                        />
                      );
                      
                      // Current percentage overlay
                      acc.elements.push(
                        <circle
                          key={`current-${idx}`}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={`var(--color-${color}-500, #6366f1)`}
                          strokeWidth="20"
                          strokeDasharray={`${Math.min(alloc.currentPercentage, alloc.targetPercentage)} ${100 - Math.min(alloc.currentPercentage, alloc.targetPercentage)}`}
                          strokeDashoffset={-prevOffset}
                        />
                      );
                      
                      acc.offset += alloc.targetPercentage;
                      return acc;
                    }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{selectedStrategy.rule}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Objetivo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allocation Breakdown */}
              <div className="space-y-4">
                {selectedStrategy.allocations.map((alloc) => {
                  const StatusIcon = getStatusIcon(alloc.status);
                  const statusColor = getStatusColor(alloc.status);
                  const categoryColor = getCategoryColor(alloc.category);
                  const diff = alloc.currentPercentage - alloc.targetPercentage;

                  return (
                    <div key={alloc.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-${categoryColor}-500`} />
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {alloc.label || getCategoryLabel(alloc.category)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 text-${statusColor}-500`} />
                          <span className={`text-sm font-semibold text-${statusColor}-600 dark:text-${statusColor}-400`}>
                            {alloc.currentPercentage}% / {alloc.targetPercentage}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        {/* Target line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
                          style={{ left: `${alloc.targetPercentage}%` }}
                        />
                        {/* Current fill */}
                        <div
                          className={`h-full bg-${categoryColor}-500 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, alloc.currentPercentage)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          Actual: {alloc.currentAmount.toLocaleString()} {currencyCode}
                        </span>
                        <span className={`font-medium ${
                          alloc.status === 'on_track' 
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : alloc.status === 'over'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {diff > 0 ? `+${diff}%` : `${diff}%`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-violet-100 dark:border-violet-800">
              <h3 className="font-bold text-violet-800 dark:text-violet-300 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Cómo Mejorar tu Distribución
              </h3>
              <div className="space-y-3">
                {selectedStrategy.allocations
                  .filter(a => a.status !== 'on_track')
                  .map((alloc, idx) => {
                    const isOver = alloc.status === 'over';
                    const diff = Math.abs(alloc.currentPercentage - alloc.targetPercentage);
                    const amountDiff = Math.abs(alloc.currentAmount - (stats.totalIncome * alloc.targetPercentage / 100));

                    return (
                      <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-start gap-3">
                        {isOver ? (
                          <TrendingDown className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <Target className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {isOver ? 'Reducir' : 'Aumentar'} {getCategoryLabel(alloc.category)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {isOver 
                              ? `Estás gastando ${diff}% más de lo recomendado. Intenta reducir ${amountDiff.toFixed(0)} ${currencyCode} este mes.`
                              : `Estás ${diff}% por debajo. Intenta destinar ${amountDiff.toFixed(0)} ${currencyCode} adicionales.`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}

                {selectedStrategy.allocations.every(a => a.status === 'on_track') && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-start gap-3">
                    <Award className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        ¡Excelente trabajo!
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tu distribución actual está alineada con esta estrategia. Sigue así para mantener finanzas saludables.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Other Strategies */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Otras Estrategias
              </h3>
              {strategies
                .filter(s => s.id !== selectedStrategy.id)
                .map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy)}
                    className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-left hover:border-violet-300 dark:hover:border-violet-700 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{strategy.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${getCompatibilityColor(strategy.compatibility)}-100 dark:bg-${getCompatibilityColor(strategy.compatibility)}-900/30 text-${getCompatibilityColor(strategy.compatibility)}-700 dark:text-${getCompatibilityColor(strategy.compatibility)}-300`}>
                          {strategy.compatibility}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{strategy.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <PieChart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-2">
              No hay estrategias disponibles
            </h3>
            <p className="text-slate-500 text-sm">
              Agrega más transacciones para analizar tu distribución
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
