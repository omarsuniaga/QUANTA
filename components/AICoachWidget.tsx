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
  Award,
  Info,
  X
} from 'lucide-react';
import { Transaction, DashboardStats, Goal, SavingsChallenge } from '../types';
import { aiCoachService } from '../services/aiCoachService';
import { useI18n } from '../contexts/I18nContext';

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
  const { language } = useI18n();
  const [quickTips, setQuickTips] = useState<string[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showInfoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInfoModal]);

  const modalContent = {
    es: {
      title: 'Coach Financiero IA',
      description: 'Tu asistente financiero inteligente que analiza tus transacciones, comportamiento de gasto y metas para ofrecerte consejos personalizados.',
      features: [
        '🧠 Análisis inteligente de tus finanzas',
        '💡 Consejos personalizados en tiempo real',
        '📊 Identifica patrones de gasto',
        '🎯 Recomendaciones para tus metas',
        '⚡ Alertas de gastos inusuales',
        '🏆 Desafíos de ahorro gamificados'
      ],
      howItWorks: '¿Cómo funciona?',
      howItWorksText: 'El Coach IA utiliza modelos de lenguaje avanzados (Gemini) para analizar tu historial financiero y darte insights accionables. Puedes usar tu propia API key de Google AI Studio o usar el servicio predeterminado.'
    },
    en: {
      title: 'AI Financial Coach',
      description: 'Your intelligent financial assistant that analyzes your transactions, spending behavior and goals to offer personalized advice.',
      features: [
        '🧠 Smart analysis of your finances',
        '💡 Personalized real-time tips',
        '📊 Identifies spending patterns',
        '🎯 Recommendations for your goals',
        '⚡ Unusual spending alerts',
        '🏆 Gamified savings challenges'
      ],
      howItWorks: 'How it works?',
      howItWorksText: 'The AI Coach uses advanced language models (Gemini) to analyze your financial history and give you actionable insights. You can use your own Google AI Studio API key or use the default service.'
    }
  };

  const content = modalContent[language as 'es' | 'en'] || modalContent.es;

  return (
    <div className="space-y-4">
      {/* Info Modal */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" 
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-xl my-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 text-indigo-600 dark:text-indigo-400">
                <Brain className="w-6 h-6" />
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{content.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{content.description}</p>
            
            <div className="space-y-2 mb-4">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">{content.howItWorks}</h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">{content.howItWorksText}</p>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Información sobre el Coach IA"
              >
                <Info className="w-4 h-4" />
              </button>
              <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
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
              <p className="text-xs text-indigo-200">{language === 'es' ? 'Desafíos' : 'Challenges'}</p>
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
            {language === 'es' ? 'Desafíos' : 'Challenges'}
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
