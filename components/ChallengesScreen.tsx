import React, { useState, useEffect } from 'react';
import {
  Zap,
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  Coffee,
  Bike,
  Utensils,
  Tv,
  Ban,
  Shield,
  TrendingUp,
  Calendar,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Star,
  Sparkles,
  PiggyBank
} from 'lucide-react';
import { Transaction, DashboardStats, Goal, SavingsChallenge } from '../types';
import { aiCoachService, CHALLENGE_TEMPLATES } from '../services/aiCoachService';
import { Button } from './Button';

interface ChallengesScreenProps {
  transactions: Transaction[];
  stats: DashboardStats;
  goals: Goal[];
  currencySymbol: string;
  currencyCode: string;
  onBack: () => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  transactions,
  stats,
  goals,
  currencySymbol,
  currencyCode,
  onBack
}) => {
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<SavingsChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<SavingsChallenge | null>(null);

  useEffect(() => {
    loadChallenges();
    loadActiveChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const generated = await aiCoachService.generateChallenges(transactions, stats, goals);
      setChallenges(generated);
    } catch (error: any) {
      // Silenciar errores de rate limit - usar challenges del cache
      if (!error.message?.includes('Rate limit')) {
        console.error('[Challenges] Error loading challenges:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActiveChallenges = () => {
    // Load from localStorage
    const stored = localStorage.getItem('active_challenges');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavingsChallenge[];
        // Update progress based on current date
        const updated = parsed.map(c => updateChallengeProgress(c, transactions));
        setActiveChallenges(updated);
        localStorage.setItem('active_challenges', JSON.stringify(updated));
      } catch (e) {
        setActiveChallenges([]);
      }
    }
  };

  const updateChallengeProgress = (challenge: SavingsChallenge, txs: Transaction[]): SavingsChallenge => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const today = new Date();

    if (today > endDate) {
      const completed = challenge.currentProgress >= challenge.targetProgress;
      return { ...challenge, status: completed ? 'completed' : 'failed' };
    }

    // Calculate progress based on challenge type
    let progress = 0;
    const relevantTxs = txs.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= today && t.type === 'expense';
    });

    switch (challenge.type) {
      case 'no_spend':
        // Progress = days without spending
        const daysWithoutSpend = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        progress = relevantTxs.length === 0 ? daysWithoutSpend : 0;
        break;
      case 'reduce_category':
        if (challenge.targetCategory) {
          const categorySpend = relevantTxs
            .filter(t => t.category === challenge.targetCategory)
            .reduce((sum, t) => sum + t.amount, 0);
          // Lower spending = more progress
          progress = Math.max(0, challenge.targetProgress - categorySpend);
        }
        break;
      case 'save_amount':
        // Track actual savings (income - expenses during period)
        const periodIncome = txs
          .filter(t => new Date(t.date) >= startDate && new Date(t.date) <= today && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const periodExpense = relevantTxs.reduce((sum, t) => sum + t.amount, 0);
        progress = Math.max(0, periodIncome - periodExpense);
        break;
      case 'streak':
        // Count consecutive days with transactions logged
        let streak = 0;
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          const dayStr = d.toISOString().split('T')[0];
          if (txs.some(t => t.date === dayStr)) {
            streak++;
          } else if (d < today) {
            streak = 0; // Reset streak if a day was missed
          }
        }
        progress = streak;
        break;
      default:
        progress = challenge.currentProgress;
    }

    return { ...challenge, currentProgress: progress, status: 'active' };
  };

  const startChallenge = (challenge: SavingsChallenge) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + challenge.duration);

    const activeChallenge: SavingsChallenge = {
      ...challenge,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active',
      currentProgress: 0
    };

    const updated = [...activeChallenges, activeChallenge];
    setActiveChallenges(updated);
    localStorage.setItem('active_challenges', JSON.stringify(updated));
    setSelectedChallenge(null);
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      'ban': Ban,
      'shield': Shield,
      'utensils': Utensils,
      'tv': Tv,
      'piggy-bank': PiggyBank,
      'trending-up': TrendingUp,
      'flame': Flame,
      'calendar-check': Calendar,
      'coffee': Coffee,
      'bike': Bike
    };
    return icons[iconName] || Zap;
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Fácil', color: 'emerald' };
      case 'medium':
        return { label: 'Medio', color: 'amber' };
      case 'hard':
        return { label: 'Difícil', color: 'rose' };
      default:
        return { label: difficulty, color: 'slate' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Challenges de Ahorro
            </h1>
            <p className="text-amber-100 text-sm mt-1">
              Desafíos gamificados para mejorar tus finanzas
            </p>
          </div>
        </div>

        {/* Active Challenges Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-3xl font-bold">{activeChallenges.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-amber-100">Activos</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-3xl font-bold">{activeChallenges.filter(c => c.status === 'completed').length}</p>
            <p className="text-xs text-amber-100">Completados</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-3xl font-bold flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {Math.max(...activeChallenges.map(c => c.streakDays || 0), 0)}
            </p>
            <p className="text-xs text-amber-100">Racha Máx</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Active Challenges */}
        {activeChallenges.filter(c => c.status === 'active').length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Challenges Activos
            </h2>
            {activeChallenges
              .filter(c => c.status === 'active')
              .map(challenge => {
                const Icon = getIconComponent(challenge.icon);
                const progress = (challenge.currentProgress / challenge.targetProgress) * 100;
                const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                return (
                  <div
                    key={challenge.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 border-${challenge.color}-200 dark:border-${challenge.color}-800 shadow-sm`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${challenge.color}-100 dark:bg-${challenge.color}-900/30 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${challenge.color}-600 dark:text-${challenge.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-white">{challenge.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{challenge.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Progreso: {challenge.currentProgress} / {challenge.targetProgress}</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-${challenge.color}-400 to-${challenge.color}-600 rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {daysLeft} días restantes
                          </span>
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {challenge.reward}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Completed Challenges */}
        {activeChallenges.filter(c => c.status === 'completed').length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Logros Desbloqueados
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {activeChallenges
                .filter(c => c.status === 'completed')
                .map(challenge => (
                  <div
                    key={challenge.id}
                    className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 text-center"
                  >
                    <div className="text-3xl mb-2">{challenge.reward.split(' ')[0]}</div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{challenge.title}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      {challenge.reward.split(' ').slice(1).join(' ')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Available Challenges */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Challenges Recomendados
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {challenges
                .filter(c => !activeChallenges.some(ac => ac.id.startsWith(c.id.split('_')[0])))
                .map(challenge => {
                  const Icon = getIconComponent(challenge.icon);
                  const difficulty = getDifficultyBadge(challenge.difficulty);

                  return (
                    <button
                      key={challenge.id}
                      onClick={() => setSelectedChallenge(challenge)}
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm text-left hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${challenge.color}-100 dark:bg-${challenge.color}-900/30 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${challenge.color}-600 dark:text-${challenge.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 dark:text-white">{challenge.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${difficulty.color}-100 dark:bg-${difficulty.color}-900/30 text-${difficulty.color}-700 dark:text-${difficulty.color}-300 font-medium`}>
                              {difficulty.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{challenge.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {challenge.duration} días
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {challenge.reward}
                            </span>
                          </div>
                        </div>
                        <Play className="w-5 h-5 text-amber-500" />
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* All Templates */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Todos los Challenges
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CHALLENGE_TEMPLATES.map(template => {
              const Icon = getIconComponent(template.icon);
              const isActive = activeChallenges.some(c => c.id.startsWith(template.id) && c.status === 'active');
              const isCompleted = activeChallenges.some(c => c.id.startsWith(template.id) && c.status === 'completed');

              return (
                <button
                  key={template.id}
                  disabled={isActive}
                  onClick={() => {
                    const today = new Date();
                    const endDate = new Date(today);
                    endDate.setDate(endDate.getDate() + template.duration);
                    
                    setSelectedChallenge({
                      id: `${template.id}_${Date.now()}`,
                      type: template.type,
                      title: template.title,
                      description: template.description,
                      icon: template.icon,
                      color: template.color,
                      difficulty: template.difficulty,
                      duration: template.duration,
                      startDate: today.toISOString().split('T')[0],
                      endDate: endDate.toISOString().split('T')[0],
                      targetAmount: template.targetAmount,
                      targetCategory: template.targetCategory,
                      currentProgress: 0,
                      targetProgress: template.type === 'streak' ? template.duration : (template.targetAmount || 100),
                      status: 'not_started',
                      reward: template.reward
                    });
                  }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 opacity-50'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-${template.color}-100 dark:bg-${template.color}-900/30 flex items-center justify-center mx-auto mb-2`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Icon className={`w-5 h-5 text-${template.color}-600 dark:text-${template.color}-400`} />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2">{template.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{template.duration} días</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className={`p-6 bg-gradient-to-br from-${selectedChallenge.color}-500 to-${selectedChallenge.color}-600 text-white rounded-t-3xl sm:rounded-t-3xl`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  {React.createElement(getIconComponent(selectedChallenge.icon), { className: 'w-8 h-8' })}
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium`}>
                    {getDifficultyBadge(selectedChallenge.difficulty).label}
                  </span>
                  <h2 className="text-xl font-bold mt-1">{selectedChallenge.title}</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-300">{selectedChallenge.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Duración</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedChallenge.duration} días</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recompensa</p>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedChallenge.reward}</p>
                </div>
              </div>

              {selectedChallenge.targetAmount && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center gap-3">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Meta de ahorro</p>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">
                      {selectedChallenge.targetAmount} {currencyCode}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedChallenge(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => startChallenge(selectedChallenge)}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Challenge
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
