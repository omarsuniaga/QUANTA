import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
  ChevronRight,
  Activity,
  PieChart,
  Lightbulb,
  RefreshCw,
  Shield,
  Zap,
  Award,
  ArrowLeft,
  Heart,
  AlertCircle,
  ThumbsUp,
  DollarSign
} from 'lucide-react';
import { Transaction, DashboardStats, Goal, FinancialAnalysis, AIRecommendation } from '../types';
import { aiCoachService } from '../services/aiCoachService';
import { storageService } from '../services/storageService';
import { useI18n } from '../contexts';
import { Button } from './Button';

interface AICoachScreenProps {
  transactions: Transaction[];
  stats: DashboardStats;
  goals: Goal[];
  currencySymbol: string;
  currencyCode: string;
  onBack: () => void;
  onOpenSavingsPlanner: () => void;
  onOpenChallenges: () => void;
  onOpenStrategies: () => void;
}

export const AICoachScreen: React.FC<AICoachScreenProps> = ({
  transactions,
  stats,
  goals,
  currencySymbol,
  currencyCode,
  onBack,
  onOpenSavingsPlanner,
  onOpenChallenges,
  onOpenStrategies
}) => {
  const { language, t } = useI18n();
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickTips, setQuickTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'insights'>('overview');
  const [customCategories, setCustomCategories] = useState<any[]>([]);

  useEffect(() => {
    loadAnalysis();
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  const loadAnalysis = async () => {
    setLoading(true);
    const result = await aiCoachService.analyzeFinances(transactions, stats, goals);
    if (result) {
      setAnalysis(result);
    }
    const tips = await aiCoachService.getQuickTips(transactions, stats);
    setQuickTips(tips);
    setLoading(false);
  };

  // Helper to get category display name
  const getCategoryName = (categoryId: string): string => {
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat) {
      return customCat.name[language as 'es' | 'en'] || customCat.name.es || customCat.name.en || customCat.key || (language === 'es' ? 'Sin categoría' : 'No category');
    }
    
    const translated = (t.categories as Record<string, string>)?.[categoryId];
    if (translated && translated !== categoryId) return translated;
    
    // If no translation or it's an ID (long string), return generic name
    return language === 'es' ? 'Otra categoría' : 'Other category';
  };

  // Process recommendation text to replace category IDs with names
  const processRecommendationText = (text: string): string => {
    let processedText = text;
    
    // Find all potential category IDs in the text (alphanumeric strings 15+ chars)
    const potentialIds = text.match(/[A-Za-z0-9]{15,}/g);
    
    if (potentialIds) {
      potentialIds.forEach(id => {
        const categoryName = getCategoryName(id);
        // Only replace if we found a valid category name (not generic fallback)
        if (categoryName !== 'Otra categoría' && categoryName !== 'Other category') {
          processedText = processedText.replace(new RegExp(id, 'g'), categoryName);
        }
      });
    }
    
    return processedText;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'emerald';
      case 'good': return 'blue';
      case 'warning': return 'amber';
      case 'critical': return 'rose';
      default: return 'slate';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return ThumbsUp;
      case 'good': return CheckCircle2;
      case 'warning': return AlertCircle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'rose';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'slate';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return Target;
      case 'budget': return PieChart;
      case 'investment': return TrendingUp;
      case 'expense_reduction': return TrendingDown;
      case 'goal': return Award;
      default: return Lightbulb;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="px-4 sm:px-6 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Coach Financiero IA
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                Análisis inteligente de tus finanzas
              </p>
            </div>
            <button
              onClick={loadAnalysis}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Health Score Card */}
          {analysis && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm font-medium">Salud Financiera</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold">{analysis.healthScore}</span>
                    <span className="text-indigo-200">/100</span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl bg-${getHealthColor(analysis.healthStatus)}-500/20`}>
                  {React.createElement(getHealthIcon(analysis.healthStatus), {
                    className: `w-8 h-8 text-${getHealthColor(analysis.healthStatus)}-300`
                  })}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 bg-${getHealthColor(analysis.healthStatus)}-400`}
                    style={{ width: `${analysis.healthScore}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-indigo-200">
                  <span>Crítico</span>
                  <span>Alerta</span>
                  <span>Bueno</span>
                  <span>Excelente</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex px-4 gap-1 -mb-px">
          {['overview', 'recommendations', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-t-xl transition-colors ${
                activeTab === tab
                  ? 'bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400'
                  : 'text-indigo-200 hover:bg-white/10'
              }`}
            >
              {tab === 'overview' && 'Resumen'}
              {tab === 'recommendations' && 'Acciones'}
              {tab === 'insights' && 'Insights'}
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
        ) : analysis ? (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">Análisis del Coach</h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  </div>
                  
                  {/* Trend Indicator */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    analysis.monthlyTrend === 'improving' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : analysis.monthlyTrend === 'declining'
                      ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {analysis.monthlyTrend === 'improving' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : analysis.monthlyTrend === 'declining' ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    Tendencia: {analysis.monthlyTrend === 'improving' ? 'Mejorando' : analysis.monthlyTrend === 'declining' ? 'Declinando' : 'Estable'}
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold">Tasa de Ahorro</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                      {analysis.savingsRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-bold">Nivel de Riesgo</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                      {analysis.riskLevel === 'low' ? 'Bajo' : analysis.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                    </p>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4" /> Fortalezas
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-800">
                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4" /> Áreas de Mejora
                    </h4>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Shortcuts */}
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-5 text-white">
                  <h3 className="font-bold mb-4">Herramientas del Coach</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={onOpenSavingsPlanner}
                      className="bg-white/10 hover:bg-white/20 rounded-xl p-3 text-center transition-colors"
                    >
                      <Target className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs font-medium">Planes de Ahorro</span>
                    </button>
                    <button
                      onClick={onOpenChallenges}
                      className="bg-white/10 hover:bg-white/20 rounded-xl p-3 text-center transition-colors"
                    >
                      <Zap className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs font-medium">Challenges</span>
                    </button>
                    <button
                      onClick={onOpenStrategies}
                      className="bg-white/10 hover:bg-white/20 rounded-xl p-3 text-center transition-colors"
                    >
                      <PieChart className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs font-medium">Estrategias</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Acciones recomendadas ordenadas por prioridad
                </p>
                {analysis.recommendations
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.priority] - order[b.priority];
                  })
                  .map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      currencySymbol={currencySymbol}
                      currencyCode={currencyCode}
                      processText={processRecommendationText}
                    />
                  ))}
              </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Top Expense Categories */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Top Categorías de Gasto
                  </h3>
                  <div className="space-y-3">
                    {analysis.topExpenseCategories.map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {getCategoryName(cat.category)}
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {cat.amount.toLocaleString()} {currencyCode}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">
                          {cat.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800">
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Tips Rápidos del Coach
                  </h3>
                  <div className="space-y-3">
                    {quickTips.map((tip, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-bold text-slate-600 dark:text-slate-400 mb-2">
              No hay análisis disponible
            </h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
              {(() => {
                if (!localStorage.getItem('gemini_api_key')) {
                  return 'Configura tu API key de Gemini en Ajustes para habilitar el análisis de IA.';
                }
                if (!transactions || transactions.length === 0) {
                  return 'Agrega algunas transacciones para obtener insights personalizados.';
                }
                return 'No se pudo generar el análisis. Intenta nuevamente o revisa tu configuración de IA.';
              })()}
            </p>
            <Button onClick={loadAnalysis} isLoading={loading}>
              Generar Análisis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard: React.FC<{
  recommendation: AIRecommendation;
  currencySymbol: string;
  currencyCode: string;
  processText: (text: string) => string;
}> = ({ recommendation, currencySymbol, currencyCode, processText }) => {
  const TypeIcon = getTypeIconForRec(recommendation.type);
  const priorityColor = recommendation.priority === 'high' ? 'rose' : recommendation.priority === 'medium' ? 'amber' : 'blue';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl bg-${priorityColor}-50 dark:bg-${priorityColor}-900/30`}>
          <TypeIcon className={`w-5 h-5 text-${priorityColor}-600 dark:text-${priorityColor}-400`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-${priorityColor}-100 dark:bg-${priorityColor}-900/50 text-${priorityColor}-700 dark:text-${priorityColor}-300`}>
              {recommendation.priority === 'high' ? 'Alta' : recommendation.priority === 'medium' ? 'Media' : 'Baja'} prioridad
            </span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white">
            {processText(recommendation.title)}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {processText(recommendation.description)}
          </p>
          
          {recommendation.potentialSavings && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <DollarSign className="w-4 h-4" />
              Ahorro potencial: {recommendation.potentialSavings.toLocaleString()} {currencyCode}
            </div>
          )}

          {recommendation.actionLabel && (
            <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              {recommendation.actionLabel}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function getTypeIconForRec(type: string) {
  switch (type) {
    case 'savings': return Target;
    case 'budget': return PieChart;
    case 'investment': return TrendingUp;
    case 'expense_reduction': return TrendingDown;
    case 'goal': return Award;
    default: return Lightbulb;
  }
}
