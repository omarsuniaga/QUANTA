import React from 'react';
import { Goal, Promo } from '../types';
import { GOAL_ICONS } from '../constants';
import { Plane, ShoppingBag, Gift, Star, Coffee, Music, Plus, Edit2 } from 'lucide-react';

// --- GOALS WIDGET ---
interface GoalsWidgetProps {
  goals: Goal[];
  onAddContribution: (goalId: string) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: () => void;
  currencySymbol?: string;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, onAddContribution, onEditGoal, onAddGoal, currencySymbol = '$' }) => {
  const mainGoal = goals[0]; 

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-end mb-3 px-1">
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Saved</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{currencySymbol}{totalSaved.toLocaleString()}</p>
        </div>
        <button 
          onClick={onAddGoal}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> New Goal
        </button>
      </div>

      {/* Main Goal Card */}
      {mainGoal && (
        <div 
          onClick={() => onEditGoal(mainGoal)}
          className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className={`absolute top-0 right-0 w-24 h-24 bg-${mainGoal.color || 'indigo'}-50 dark:bg-${mainGoal.color || 'indigo'}-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{mainGoal.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Main Goal</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditGoal(mainGoal); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center bg-${mainGoal.color || 'indigo'}-100 dark:bg-${mainGoal.color || 'indigo'}-900/40 text-${mainGoal.color || 'indigo'}-600 dark:text-${mainGoal.color || 'indigo'}-400 hover:bg-${mainGoal.color || 'indigo'}-200 dark:hover:bg-${mainGoal.color || 'indigo'}-900/60 transition-colors`}
              >
                {mainGoal.icon && GOAL_ICONS[mainGoal.icon] 
                  ? React.createElement(GOAL_ICONS[mainGoal.icon], { className: "w-4 h-4" }) 
                  : <Edit2 className="w-4 h-4" />
                }
              </button>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">{currencySymbol}{mainGoal.currentAmount.toLocaleString()}</span>
                <span className="text-slate-400 dark:text-slate-500">Target: {currencySymbol}{mainGoal.targetAmount.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${mainGoal.color || 'indigo'}-500 rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(100, (mainGoal.currentAmount / mainGoal.targetAmount) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                You need <span className="text-slate-600 dark:text-slate-400">{currencySymbol}{(mainGoal.targetAmount - mainGoal.currentAmount).toLocaleString()}</span> more to reach your goal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mini Goals List (Horizontal) */}
      <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
        {goals.slice(1).map(goal => (
          <div 
            key={goal.id} 
            onClick={() => onEditGoal(goal)}
            className="min-w-[140px] bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{goal.name}</span>
              <div className={`w-2 h-2 rounded-full bg-${goal.color}-400`}></div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
              <div className={`h-full bg-${goal.color}-500`} style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}></div>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-right">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
          </div>
        ))}
        
        <button 
          onClick={onAddGoal}
          className="min-w-[40px] flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
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
  return (
    <div className="mt-8 mb-24">
      <div className="flex justify-between items-center px-1 mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ideas & Plans</h3>
        <button onClick={onAddPromo} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5">
        {promos.map(promo => {
          const Icon = PROMO_ICONS[promo.icon] || Star;
          return (
            <div 
              key={promo.id} 
              onClick={() => onEditPromo(promo)}
              className="min-w-[200px] bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-transform hover:scale-[1.02] cursor-pointer active:scale-95"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${promo.color}-50 dark:bg-${promo.color}-900/30 text-${promo.color}-600 dark:text-${promo.color}-400`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{promo.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{promo.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};