import React from 'react';
import { LayoutGrid, List, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { TabType } from '../../hooks/useAppNavigation';

interface BottomNavigationProps {
  activeTab: TabType;
  onNavigateToTab: (tab: TabType) => void;
}

/**
 * Barra de navegación inferior para mobile/tablet.
 * Incluye 5 tabs principales: Dashboard, Ingresos, Gastos, Presupuestos, Historial.
 * Hidden en desktop (lg+).
 *
 * @param props - activeTab, onNavigateToTab
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onNavigateToTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="max-w-3xl mx-auto">
        {/* Gradient fade to content */}
        <div className="h-12 pointer-events-none absolute bottom-full w-full bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>

        {/* Navigation bar */}
        <nav className="backdrop-blur-lg border-t px-3 py-3 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">

          {/* Dashboard */}
          <button
            onClick={() => onNavigateToTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${
              activeTab === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400'
            }`}
          >
            <LayoutGrid
              className="w-5 h-5"
              strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>

          {/* Ingresos */}
          <button
            onClick={() => onNavigateToTab('income')}
            className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${
              activeTab === 'income'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <ArrowUpRight
              className="w-5 h-5"
              strokeWidth={activeTab === 'income' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Ingresos</span>
          </button>

          {/* Gastos */}
          <button
            onClick={() => onNavigateToTab('expenses')}
            className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${
              activeTab === 'expenses'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-400'
            }`}
          >
            <ArrowDownRight
              className="w-5 h-5"
              strokeWidth={activeTab === 'expenses' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Gastos</span>
          </button>

          {/* Presupuestos */}
          <button
            onClick={() => onNavigateToTab('budgets')}
            className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${
              activeTab === 'budgets'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-400'
            }`}
          >
            <PiggyBank
              className="w-5 h-5"
              strokeWidth={activeTab === 'budgets' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Presupuesto</span>
          </button>

          {/* Historial */}
          <button
            onClick={() => onNavigateToTab('transactions')}
            className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${
              activeTab === 'transactions'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400'
            }`}
          >
            <List
              className="w-5 h-5"
              strokeWidth={activeTab === 'transactions' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">Historial</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
