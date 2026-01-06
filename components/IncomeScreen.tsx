import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Calendar, AlertCircle, Info,
  CheckCircle2, Clock, Plus, DollarSign, Edit, Trash2, MoreVertical, Save, X
} from 'lucide-react';
import { PageHeader, PeriodSelector, StatsCard, SectionHeader } from './base';
import { colors } from '../styles/tokens';
import { useIncomeManager } from '../hooks/useIncomeManager';
import { useBudgetPeriod } from '../hooks/useBudgetPeriod';
import { useSettings } from '../contexts/SettingsContext';
import { Transaction, Budget, MonetaryAmount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getPeriodLabel } from '../hooks/useBudgetPeriod';
import { ModalWrapper } from './ModalWrapper';
import { ActionModal } from './ActionModal';
import { parseLocalDate } from '../utils/dateHelpers';

interface IncomeScreenProps {
  transactions: Transaction[];
  stats: any;
  budgetPeriodData: any; // Legacy prop, we might ignore or use for initial
  onAddFixedIncome: () => void; // Legacy
  onAddExtraIncome: () => void; // Legacy
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string, type: string) => void;
  onGoalsCreated: () => void;
}

export const IncomeScreen: React.FC<IncomeScreenProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const { budgets, currencySymbol, currencyCode } = useSettings();

  // Local State for Navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  // Derived Period Strings
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const selectedPeriod = `${year}-${String(month + 1).padStart(2, '0')}`;

  // === HOOKS ===
  // 1. New Income Manager (The SSOT for Income)
  const {
    selectedPeriod: hookPeriod,
    monthData: hookMonthData,
    totals: hookTotals,
    loading: hookLoading,
    actions: hookActions
  } = useIncomeManager();

  // Parse hook period back to date for display
  const [pYear, pMonth] = hookPeriod.split('-').map(Number);
  const periodDate = new Date(pYear, pMonth - 1, 1);

  // 2. Budget Period (For Expenses/Budget Context)
  // We pass the Hook's INCOME TOTAL to useBudgetPeriod to get the correct Surplus/Gap
  const periodData = useBudgetPeriod(budgets, transactions, {
    year: pYear,
    month: pMonth - 1,
    period: 'monthly',
    externalIncomeTotal: hookTotals.received // SSOT!
  });

  // === MODAL STATE ===
  const [showAddModal, setShowAddModal] = useState<'fixed' | 'extra' | null>(null);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState('');

  // Quick Filter for Fixed Items (Parity with Expenses)
  const [filter, setFilter] = useState<'all' | 'pending'>('all');

  // Check if viewing current month
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return hookPeriod === current;
  }, [hookPeriod]);

  // Filter the items
  const filteredFixedItems = useMemo(() => {
    if (!hookMonthData?.fixedItems) return [];
    if (filter === 'all') return hookMonthData.fixedItems;
    return hookMonthData.fixedItems.filter(i => i.status !== 'received');
  }, [hookMonthData, filter]);

  // === HANDLERS ===
  const handlePrevMonth = () => hookActions.changePeriod(-1);
  const handleNextMonth = () => hookActions.changePeriod(1);

  const handleSaveIncome = async (data: any) => {
    // data comes from ActionModal
    if (showAddModal === 'fixed') {
      await hookActions.saveFixedTemplate({
        id: 'temp_' + Date.now(), // Service replaces this
        name: data.description,
        defaultAmount: data.amount,
        active: true,
        frequency: data.frequency || 'monthly',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // Refresh handled by action

    } else if (showAddModal === 'extra') {
      if (editingExtraId) {
        await hookActions.addExtra(data.description, data.amount); // Fallback
        if (editingExtraId) await hookActions.deleteExtra(editingExtraId);
      } else {
        await hookActions.addExtra(data.description, data.amount);
      }
    }

    setShowAddModal(null);
    setEditingExtraId(null);
  };

  return (
    <div className="pb-20">
      {/* 1. STICKY HEADER (Design System) */}
      <div className="bg-white dark:bg-slate-800 pb-6 pt-2 shadow-sm sticky top-0 z-10 transition-colors">
        <PageHeader
          title="Mis Ingresos"
          icon={TrendingUp}
          iconColor="emerald"
        />

        <div className="px-4">
          <PeriodSelector
            currentPeriod={hookPeriod}
            onPrevious={handlePrevMonth}
            onNext={handleNextMonth}
            isCurrentMonth={isCurrentMonth}
            language="es"
          />
        </div>
      </div>

      {/* 2. MAIN STATE CARD (Financial Health) */}
      <div className="px-4 mt-4">
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-colors ${periodData.incomeSurplus >= 0
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-none'
          : 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-200 dark:shadow-none'
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1 group relative cursor-help">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  Margen Disponible (Mes)
                </p>
                <Info className="w-3 h-3 text-white/70" />
                {/* Tooltip */}
                <div className="absolute left-0 top-6 w-56 p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  Este valor es un indicador del mes y no representa el saldo real en cuentas.
                </div>
              </div>
              <h3 className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(periodData.incomeSurplus, currencyCode)}
              </h3>
            </div>

            <div className="text-right">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">
                Ingresos Recibidos
              </p>
              <div className="text-xl font-bold text-white/90">
                {formatCurrency(hookTotals.received, currencyCode)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3 relative">
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full transition-all duration-300 shadow-sm bg-white/90"
                style={{ width: `${Math.min((hookTotals.received / periodData.budgetTotal) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-white/80">
            <span>
              {periodData.incomeSurplus >= 0
                ? `Margen libre: ${formatCurrency(periodData.incomeSurplus, currencyCode)}`
                : `Déficit: ${formatCurrency(Math.abs(periodData.incomeSurplus), currencyCode)}`
              }
            </span>
            <span>
              {hookTotals.pending > 0 && `Pendiente: ${formatCurrency(hookTotals.pending, currencyCode)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-3xl mx-auto">

        {/* SECTION 1: FIXED INCOMES */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Ingresos Fijos</h3>
                <div className="flex items-center gap-1 mt-1 group relative cursor-help">
                  <Info className="w-3 h-3 text-indigo-500" />
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 border-b border-dotted border-slate-400">
                    Ayuda: Estados
                  </p>
                  {/* Tooltip for Status Help */}
                  <div className="absolute left-0 top-6 w-56 p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-lg shadow-xl border border-slate-100 dark:border-slate-600 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    Haz clic en el botón de estado (Pendiente/Pagado) para marcar el ingreso. Solo los ingresos pagados suman al total del mes.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Filter Pills */}
              <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all ${filter === 'all'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all ${filter === 'pending'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                >
                  Pendientes
                </button>
              </div>

              <button
                onClick={() => setShowAddModal('fixed')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                title="Nuevo Ingreso Fijo"
              >
                + Nuevo
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredFixedItems.map(item => {
              const isEditing = editingAmountId === item.id;

              return (
                <div key={item.id} className={`p-4 rounded-2xl border transition-all ${item.status === 'received'
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50'
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Left: Info & Amount */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                        <h4 className={`font-bold text-lg ${item.status === 'received' ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'}`}>
                          {item.nameSnapshot}
                        </h4>
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingAmountId(item.id);
                              setTempAmount(item.amount.toString());
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Editar monto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                            <input
                              type="number"
                              value={tempAmount}
                              onChange={(e) => setTempAmount(e.target.value)}
                              className="w-24 pl-5 py-1 text-sm font-bold border rounded-lg outline-none focus:ring-2 ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => {
                              const val = parseFloat(tempAmount);
                              if (!isNaN(val)) {
                                hookActions.updateFixedAmount(item.id, val, false);
                              }
                              setEditingAmountId(null);
                            }}
                            className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingAmountId(null)}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold tracking-tight ${item.status === 'received' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {formatCurrency(item.amount, currencyCode)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Status Button (Big & Interactive) */}
                    <button
                      onClick={() => hookActions.toggleFixedStatus(item)}
                      className={`group relative overflow-hidden flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 ${item.status === 'received'
                        ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200/50'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${item.status === 'received'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                        {item.status === 'received' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>

                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          Estado
                        </span>
                        <span className={`text-sm font-bold ${item.status === 'received' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.status === 'received' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Hover Effect Hint */}
                      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </button>

                  </div>
                </div>
              );
            })}

            {(!filteredFixedItems || filteredFixedItems.length === 0) && (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-sm">No tienes ingresos fijos configurados.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: EXTRA INCOMES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ingresos Extras</h3>
            </div>
            <button
              onClick={() => setShowAddModal('extra')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
            >
              + Agregar Extra
            </button>
          </div>

          <div className="grid gap-3">
            {hookMonthData?.extras.map(item => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{item.description}</h4>
                    <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount, currencyCode)}</span>
                  <button
                    onClick={() => hookActions.deleteExtra(item.id)}
                    className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {(!hookMonthData?.extras || hookMonthData.extras.length === 0) && (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-sm">No hay ingresos extras este mes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {
        showAddModal && (
          <ActionModal
            mode="income"
            onClose={() => setShowAddModal(null)}
            onSave={handleSaveIncome}
            initialValues={{}}
          />
        )
      }
    </div >
  );
};
