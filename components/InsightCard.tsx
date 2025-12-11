
import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Trophy, Lightbulb, ChevronRight, ChevronLeft, Brain } from 'lucide-react';
import { Transaction, DashboardStats, Goal, AIInsight } from '../types';
import { geminiService } from '../services/geminiService';
import { Button } from './Button';

interface InsightCardProps {
  transactions: Transaction[];
  stats: DashboardStats;
  goals: Goal[];
}

export const InsightCard: React.FC<InsightCardProps> = ({ transactions, stats, goals }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const generateInsight = async () => {
    setLoading(true);
    const result = await geminiService.getFinancialInsights(transactions, stats, goals);
    setInsights(result);
    setActiveIndex(0);
    setLoading(false);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % insights.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  if (!process.env.API_KEY) return null;

  // Define styles based on insight type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-rose-50 dark:bg-rose-900/20',
          border: 'border-rose-100 dark:border-rose-800',
          iconBg: 'bg-rose-100 dark:bg-rose-900/50',
          iconColor: 'text-rose-600 dark:text-rose-400',
          Icon: AlertTriangle
        };
      case 'kudos':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-100 dark:border-emerald-800',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          Icon: Trophy
        };
      case 'prediction':
        return {
          bg: 'bg-violet-50 dark:bg-violet-900/20',
          border: 'border-violet-100 dark:border-violet-800',
          iconBg: 'bg-violet-100 dark:bg-violet-900/50',
          iconColor: 'text-violet-600 dark:text-violet-400',
          Icon: TrendingUp
        };
      default: // tip
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          border: 'border-indigo-100 dark:border-indigo-800',
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
          iconColor: 'text-indigo-600 dark:text-indigo-400',
          Icon: Lightbulb
        };
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl sm:rounded-3xl p-1 shadow-lg shadow-indigo-200 dark:shadow-none mb-6 sm:mb-8 animate-in fade-in duration-700">
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white opacity-10 rounded-full blur-2xl -mr-8 sm:-mr-10 -mt-8 sm:-mt-10"></div>
      
      <div className="bg-white dark:bg-slate-800 rounded-[16px] sm:rounded-[20px] p-4 sm:p-6 relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg sm:rounded-xl relative">
               <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
               <div className="absolute top-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Coach IA</h3>
              {insights.length > 0 && insights[0].score && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                   <div className="h-1 sm:h-1.5 w-10 sm:w-12 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${insights[0].score}%` }}></div>
                   </div>
                   <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Salud {insights[0].score}/100</span>
                </div>
              )}
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={generateInsight} 
            isLoading={loading}
            className="!px-2 sm:!px-3 !py-1 sm:!py-1.5 !text-[10px] sm:!text-xs !rounded-lg border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 dark:bg-transparent"
          >
            {insights.length > 0 ? <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : 'Analizar Finanzas'}
          </Button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="space-y-3 sm:space-y-4 py-1 sm:py-2">
            <div className="flex gap-3 sm:gap-4">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-700 rounded-xl sm:rounded-2xl animate-pulse shrink-0"></div>
               <div className="w-full space-y-1.5 sm:space-y-2">
                 <div className="h-3 sm:h-4 bg-slate-100 dark:bg-slate-700 rounded-full w-1/3 animate-pulse"></div>
                 <div className="h-2.5 sm:h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-3/4 animate-pulse"></div>
               </div>
            </div>
            <div className="h-16 sm:h-20 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl animate-pulse"></div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && insights.length === 0 && (
          <div className="flex items-start gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-700">
             <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 mt-0.5" />
             <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
               Solicita un análisis para detectar fugas de dinero, oportunidades de ahorro y predicciones para fin de mes.
             </p>
          </div>
        )}

        {/* INSIGHTS CAROUSEL */}
        {!loading && insights.length > 0 && (
          <div className="relative">
             <div className="overflow-hidden">
               {insights.map((insight, idx) => {
                 if (idx !== activeIndex) return null;
                 const style = getTypeStyles(insight.type);
                 return (
                   <div key={idx} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${style.bg} ${style.border} animate-in slide-in-from-right-8 duration-300`}>
                      <div className="flex items-start gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${style.iconBg} ${style.iconColor}`}>
                          <style.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-xs sm:text-sm ${style.iconColor}`}>{insight.title}</h4>
                          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-0.5 sm:mt-1 leading-relaxed">{insight.message}</p>
                        </div>
                      </div>
                      {insight.action && (
                        <div className="mt-2 sm:mt-3 pl-9 sm:pl-12">
                          <button className={`text-[10px] sm:text-xs font-bold underline ${style.iconColor}`}>
                            {insight.action}
                          </button>
                        </div>
                      )}
                   </div>
                 );
               })}
             </div>

             {/* Carousel Controls */}
             {insights.length > 1 && (
               <div className="flex items-center justify-between mt-2 sm:mt-3 px-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                    {activeIndex + 1} / {insights.length}
                  </span>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button onClick={prevSlide} className="p-0.5 sm:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={nextSlide} className="p-0.5 sm:p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
