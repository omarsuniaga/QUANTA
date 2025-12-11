import React, { useState, useEffect } from 'react';
import { Goal, Promo } from '../types';
import { GOAL_ICONS } from '../constants';
import { Plane, ShoppingBag, Gift, Star, Coffee, Music, Plus, Edit2, Info, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

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
  onAddContribution: (goalId: string) => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: () => void;
  currencySymbol?: string;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals, onAddContribution, onEditGoal, onAddGoal, currencySymbol = '$' }) => {
  const [showInfo, setShowInfo] = useState(false);
  const mainGoal = goals[0]; 

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

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
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Saved</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{currencySymbol}{totalSaved.toLocaleString()}</p>
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
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> New Goal
        </button>
      </div>

      {/* Goals Grid - Horizontal on mobile, Grid on tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
        {/* Main Goal Card */}
        {mainGoal && (
          <div 
            onClick={() => onEditGoal(mainGoal)}
            className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all sm:col-span-2 lg:col-span-1"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-${mainGoal.color || 'indigo'}-50 dark:bg-${mainGoal.color || 'indigo'}-900/20 rounded-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">{mainGoal.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Main Goal</p>
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

              <div className="mt-3 sm:mt-4">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">{currencySymbol}{mainGoal.currentAmount.toLocaleString()}</span>
                  <span className="text-slate-400 dark:text-slate-500">Target: {currencySymbol}{mainGoal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="h-2 sm:h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-${mainGoal.color || 'indigo'}-500 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(100, (mainGoal.currentAmount / mainGoal.targetAmount) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  You need <span className="text-slate-600 dark:text-slate-400">{currencySymbol}{(mainGoal.targetAmount - mainGoal.currentAmount).toLocaleString()}</span> more to reach your goal.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Mini Goals List (Horizontal scroll on mobile, continue grid on larger) */}
      </div>
      <div className="flex sm:hidden gap-3 mt-4 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1">
        {goals.slice(1).map(goal => (
          <div 
            key={goal.id} 
            onClick={() => onEditGoal(goal)}
            className="min-w-[120px] bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70px]">{goal.name}</span>
              <div className={`w-2 h-2 rounded-full bg-${goal.color}-400`}></div>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
              <div className={`h-full bg-${goal.color}-500`} style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}></div>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium text-right">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
          </div>
        ))}
        
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
  
  return (
    <div className="mt-6 sm:mt-8 mb-16 sm:mb-24">
      <InfoModal 
        isOpen={showInfo} 
        onClose={() => setShowInfo(false)} 
        type="ideas"
      />
      <div className="flex justify-between items-center px-1 mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Ideas & Plans</h3>
          <button 
            onClick={() => setShowInfo(true)}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Info about Ideas & Plans"
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