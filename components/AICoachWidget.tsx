import React, { useState, useEffect } from 'react';
import {
  Brain,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  PieChart,
  TrendingUp,
  Flame,
  Award
} from 'lucide-react';
import { Transaction, DashboardStats, Goal, SavingsChallenge } from '../types';
import { aiCoachService } from '../services/aiCoachService';

interface AICoachWidgetProps {
  transactions: Transaction[];
  stats: DashboardStats;
  goals: Goal[];
  onOpenAICoach: () => void;
  onOpenSavingsPlanner: () => void;
  onOpenChallenges: () => void;
  onOpenStrategies: () => void;
}

export const AICoachWidget: React.FC<AICoachWidgetProps> = ({
  transactions,
  stats,
  goals,
  onOpenAICoach,
  onOpenSavingsPlanner,
  onOpenChallenges,
  onOpenStrategies
}) => {
  const [quickTips, setQuickTips] = useState<string[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, [transactions.length]);

  useEffect(() => {
    // Rotate tips every 5 seconds
    if (quickTips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % quickTips.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [quickTips.length]);

  const loadData = async () => {
    // Load active challenges count
    const stored = localStorage.getItem('active_challenges');
    if (stored) {
      try {
        const challenges = JSON.parse(stored) as SavingsChallenge[];
        setActiveChallenges(challenges.filter(c => c.status === 'active').length);
      } catch (e) {
        setActiveChallenges(0);
      }
    }

    // Load quick tips if we have an API key
    if (transactions.length > 5) {
      setLoading(true);
      const tips = await aiCoachService.getQuickTips(transactions, stats);
      setQuickTips(tips);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main AI Coach Card */}
      <button
        onClick={onOpenAICoach}
        className="w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-5 text-white text-left relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-200 dark:hover:shadow-indigo-900/30 transition-all duration-300"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-400 opacity-20 rounded-full blur-2xl -ml-12 -mb-12" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Coach Financiero IA</h3>
                <p className="text-indigo-200 text-sm">Análisis inteligente personalizado</p>
              </div>
            </div>
            <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Tip Carousel */}
          {!loading && quickTips.length > 0 && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed animate-in fade-in duration-500" key={currentTipIndex}>
                {quickTips[currentTipIndex]}
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4" />
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
              <p className="text-xs text-indigo-200">Tasa Ahorro</p>
              <p className="text-sm font-bold">
                {stats.totalIncome > 0 
                  ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
              <Target className="w-4 h-4 mx-auto mb-1 text-amber-300" />
              <p className="text-xs text-indigo-200">Metas</p>
              <p className="text-sm font-bold">{goals.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
              <Flame className="w-4 h-4 mx-auto mb-1 text-orange-300" />
              <p className="text-xs text-indigo-200">Challenges</p>
              <p className="text-sm font-bold">{activeChallenges}</p>
            </div>
          </div>
        </div>
      </button>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onOpenSavingsPlanner}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
            Planes de Ahorro
          </p>
        </button>

        <button
          onClick={onOpenChallenges}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group relative"
        >
          {activeChallenges > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeChallenges}
            </span>
          )}
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
            Challenges
          </p>
        </button>

        <button
          onClick={onOpenStrategies}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <PieChart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
            Estrategias
          </p>
        </button>
      </div>
    </div>
  );
};
