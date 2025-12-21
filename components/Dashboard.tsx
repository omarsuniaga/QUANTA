
import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Transaction, DashboardStats, Category, AppSettings, Goal, Subscription, CustomCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

// Tailwind color name to hex mapping for custom categories
const TAILWIND_COLORS: Record<string, string> = {
  orange: '#f97316',
  blue: '#3b82f6',
  purple: '#a855f7',
  amber: '#f59e0b',
  indigo: '#6366f1',
  rose: '#f43f5e',
  teal: '#14b8a6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  slate: '#64748b',
  emerald: '#10b981',
  violet: '#8b5cf6',
  lime: '#84cc16',
  fuchsia: '#d946ef',
  sky: '#0ea5e9',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  gray: '#6b7280',
};
import { Wallet, ArrowUpRight, ArrowDownRight, BellRing, TrendingUp, HelpCircle, Smile, Frown, Zap, Trophy, PieChart as PieChartIcon, Filter, Info, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { InsightCard } from './InsightCard';
import { useI18n } from '../contexts/I18nContext';
import { AmountInfoModal, AmountBreakdownItem } from './AmountInfoModal';

interface DashboardProps {
  stats: DashboardStats;
  transactions: Transaction[];
  goals: Goal[]; // Added goals prop
  onAddClick: () => void;
  onFilter: (type: 'category' | 'date', value: string) => void;
  currencyConfig: AppSettings['currency'];
}

const DashboardComponent: React.FC<DashboardProps> = ({ stats, transactions, goals, onAddClick, onFilter, currencyConfig }) => {
  const { t, language } = useI18n();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showOracleHelp, setShowOracleHelp] = useState(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [showIncomeInfo, setShowIncomeInfo] = useState(false);
  const [showExpenseInfo, setShowExpenseInfo] = useState(false);

  // Load subscriptions and custom categories on mount
  // Optimized: Only reload when transactions length changes significantly
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subs, cats] = await Promise.all([
          storageService.getSubscriptions(),
          storageService.getCategories()
        ]);
        setSubscriptions(subs);
        setCustomCategories(cats);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [transactions.length]); // Only reload when transactions count changes
  
  // Check for notifications (memoized to avoid recalculation on every render)
  const upcomingPayments = useMemo(() =>
    notificationService.getUpcomingTransactions(transactions),
    [transactions]
  );

  const symbol = currencyConfig?.localSymbol || '$';
  const code = currencyConfig?.localCode || 'USD';

  // Helper to format currency as "RD$ 1,234.56" (memoized with useCallback)
  const formatCurrency = useCallback((amount: number) =>
    `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [symbol]
  );

  const formatCurrencyShort = useCallback((amount: number) =>
    `${symbol} ${amount.toLocaleString('en-US')}`,
    [symbol]
  );

  // --- ORACLE: CASH FLOW PREDICTION ---
  // Calculate balance breakdown for info modal
  const balanceBreakdown = useMemo((): AmountBreakdownItem[] => {
    const breakdown: AmountBreakdownItem[] = [];
    
    // Base balance from income and expenses
    breakdown.push({
      label: language === 'es' ? 'Balance Base' : 'Base Balance',
      amount: stats.totalIncome - stats.totalExpense,
      type: 'neutral',
      icon: 'info',
      description: language === 'es' 
        ? `Total de ingresos (${formatCurrencyShort(stats.totalIncome)}) menos gastos (${formatCurrencyShort(stats.totalExpense)})`
        : `Total income (${formatCurrencyShort(stats.totalIncome)}) minus expenses (${formatCurrencyShort(stats.totalExpense)})`
    });

    // Goals contributions
    const goalsTotal = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    if (goalsTotal > 0) {
      breakdown.push({
        label: language === 'es' ? 'Dinero en Metas' : 'Money in Goals',
        amount: goalsTotal,
        type: 'subtraction',
        icon: 'goal',
        description: language === 'es'
          ? `Total ahorrado en ${goals.length} meta(s) activa(s)`
          : `Total saved in ${goals.length} active goal(s)`
      });
    }

    return breakdown;
  }, [stats, goals, language, formatCurrencyShort]);

  // --- ANALYTICS: Top Spending Categories & Pie Data ---
  // IMPORTANT: Define categoryData FIRST as it's used by expenseBreakdown
  const categoryData = useMemo(() => {
    const data = transactions.reduce((acc, curr) => {
      if (curr.type === 'expense') {
        if (!acc[curr.category]) {
          // First, try to find in custom categories (by id or key)
          const customCat = customCategories.find(c => c.id === curr.category || c.key === curr.category);
          let translatedName: string;
          let categoryColor: string;
          
          if (customCat) {
            // Use custom category name based on language
            translatedName = customCat.name[language as 'es' | 'en'] || customCat.name.es || customCat.name.en;
            // Convert Tailwind color name to hex
            categoryColor = TAILWIND_COLORS[customCat.color] || CATEGORY_COLORS[curr.category] || '#94a3b8';
          } else {
            // Fallback to translation system for default categories
            translatedName = (t.categories as Record<string, string>)[curr.category] || curr.category;
            categoryColor = CATEGORY_COLORS[curr.category] || '#94a3b8';
          }
          
          acc[curr.category] = { 
            name: translatedName, 
            originalName: curr.category, // Keep original for filtering
            value: 0, 
            color: categoryColor
          };
        }
        acc[curr.category].value += curr.amount;
      }
      return acc;
    }, {} as Record<string, any>);
    return Object.values(data).sort((a: any, b: any) => b.value - a.value);
  }, [transactions, t.categories, customCategories, language]);

  // Calculate income breakdown
  const incomeBreakdown = useMemo((): AmountBreakdownItem[] => {
    const breakdown: AmountBreakdownItem[] = [];
    
    const salaryIncome = transactions
      .filter(t => t.type === 'income' && (t as any).incomeType === 'salary')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const extraIncome = transactions
      .filter(t => t.type === 'income' && (t as any).incomeType === 'extra')
      .reduce((sum, t) => sum + t.amount, 0);

    if (salaryIncome > 0) {
      breakdown.push({
        label: language === 'es' ? 'Ingresos por Salario' : 'Salary Income',
        amount: salaryIncome,
        type: 'addition',
        icon: 'income',
        description: language === 'es' ? 'Ingresos regulares (sueldo, nómina)' : 'Regular income (salary, payroll)'
      });
    }

    if (extraIncome > 0) {
      breakdown.push({
        label: language === 'es' ? 'Ingresos Extra' : 'Extra Income',
        amount: extraIncome,
        type: 'addition',
        icon: 'income',
        description: language === 'es' ? 'Ingresos adicionales (freelance, bonos, ventas)' : 'Additional income (freelance, bonuses, sales)'
      });
    }

    const recurringIncome = transactions
      .filter(t => t.type === 'income' && t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);

    if (recurringIncome > 0) {
      breakdown.push({
        label: language === 'es' ? 'Ingresos Recurrentes' : 'Recurring Income',
        amount: recurringIncome,
        type: 'neutral',
        icon: 'recurring',
        description: language === 'es' ? 'Ingresos que se repiten automáticamente' : 'Income that repeats automatically'
      });
    }

    return breakdown;
  }, [transactions, language]);

  // Calculate expense breakdown (depends on categoryData)
  const expenseBreakdown = useMemo((): AmountBreakdownItem[] => {
    const breakdown: AmountBreakdownItem[] = [];
    
    // Group by category
    categoryData.slice(0, 5).forEach((cat: any) => {
      breakdown.push({
        label: cat.name,
        amount: cat.value,
        type: 'subtraction',
        icon: 'expense',
        description: language === 'es' 
          ? `Gastos en categoría ${cat.name}`
          : `Expenses in ${cat.name} category`
      });
    });

    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.isRecurring)
      .reduce((sum, t) => sum + t.amount, 0);

    if (recurringExpenses > 0) {
      breakdown.push({
        label: language === 'es' ? 'Gastos Recurrentes' : 'Recurring Expenses',
        amount: recurringExpenses,
        type: 'neutral',
        icon: 'recurring',
        description: language === 'es' ? 'Gastos que se repiten automáticamente' : 'Expenses that repeat automatically'
      });
    }

    return breakdown;
  }, [transactions, categoryData, language]);

  // --- ORACLE: CASH FLOW PREDICTION ---
  const predictedBalance = useMemo(() => {
    // Calculate all recurring payments until end of month (handles weekly payments correctly)
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get ALL recurring payment occurrences from transactions until end of month
    const allRecurringPayments = notificationService.getAllRecurringPaymentsUntil(transactions, endOfMonth);
    const totalFromTransactions = allRecurringPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Get ALL subscription payments until end of month (for legacy subscriptions without linked transactions)
    // Filter out subscriptions that already have linked transactions to avoid double counting
    const transactionSubscriptionIds = new Set(
      transactions
        .filter(t => (t as any).subscriptionId)
        .map(t => (t as any).subscriptionId)
    );
    const unlinkedSubscriptions = subscriptions.filter(s => !transactionSubscriptionIds.has(s.id));
    const subscriptionPayments = notificationService.getSubscriptionPaymentsUntil(unlinkedSubscriptions, endOfMonth);
    const totalFromSubscriptions = subscriptionPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = totalFromTransactions + totalFromSubscriptions;
    
    return stats.balance - totalPending;
  }, [stats.balance, transactions, subscriptions]);

  // --- EMOTIONAL DASHBOARD: Mood Correlation ---
  const moodStats = useMemo(() => {
    const moods = { happy: 0, tired: 0, stressed: 0, neutral: 0 };
    let hasMoods = false;
    transactions.forEach(t => {
      if (t.type === 'expense' && t.mood) {
        hasMoods = true;
        moods[t.mood] = (moods[t.mood] || 0) + t.amount;
      }
    });
    return hasMoods ? moods : null;
  }, [transactions]);

  // --- CHART DATA: Real Monthly Aggregation ---
  const barData = useMemo(() => {
    const today = new Date();
    const data = [];
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      const name = d.toLocaleString(locale, { month: 'short' });

      const monthTx = transactions.filter(t => t.date.startsWith(key));
      const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        key, // Store the YYYY-MM key for filtering
        income,
        expense
      });
    }
    return data;
  }, [transactions, language]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-xs" style={{ color: p.color }}>
              {p.name === 'income' ? t.dashboard.income : t.dashboard.expenses}: {formatCurrencyShort(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">

      {/* AI COACH INSIGHTS */}
      <InsightCard transactions={transactions} stats={stats} goals={goals} />

      {/* Notifications Banner */}
      {upcomingPayments.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full text-amber-600 dark:text-amber-400 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 text-sm">{t.dashboard.upcomingPayments}</h4>
            <ul className="mt-1 space-y-1">
              {upcomingPayments.slice(0, 3).map(({ transaction, nextDate }) => {
                const locale = language === 'es' ? 'es-ES' : 'en-US';
                return (
                  <li key={transaction.id} className="text-xs text-amber-800 dark:text-amber-400 flex justify-between w-full gap-4">
                    <span>{transaction.description || (t.categories as Record<string, string>)[transaction.category] || transaction.category}</span>
                    <span className="font-medium">{nextDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ORACLE PREDICTION CARD */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/30 rounded-lg">
                <HelpCircle className="w-4 h-4 text-indigo-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">{t.dashboard.oracle}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOracleHelp(true)}
                className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-lg transition-colors"
                aria-label="Info"
              >
                <Info className="w-4 h-4 text-indigo-300" />
              </button>
              <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700">{t.dashboard.endOfMonth}</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">{t.dashboard.balanceProjection}</p>
              <h3 className="text-3xl font-bold">{formatCurrencyShort(predictedBalance)}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-rose-300 mb-0.5">{t.dashboard.pending}</p>
              <p className="font-semibold text-rose-400">-{formatCurrencyShort(stats.balance - predictedBalance)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
            {t.dashboard.recurringBillsInfo}
          </div>
        </div>

        {/* Oracle Help Modal */}
        {showOracleHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowOracleHelp(false)}>
            <div 
              className="bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-indigo-500/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/30 rounded-xl">
                    <HelpCircle className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.dashboard.oracleHelpTitle}</h3>
                </div>
                <button
                  onClick={() => setShowOracleHelp(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {t.dashboard.oracleHelpContent}
              </p>
              <div className="bg-indigo-500/20 rounded-xl p-3 mb-4">
                <p className="text-indigo-200 text-sm">
                  {t.dashboard.oracleHelpTip}
                </p>
              </div>
              <button
                onClick={() => setShowOracleHelp(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                {t.dashboard.gotIt}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-full">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">{t.dashboard.income}</span>
            <button
              onClick={() => setShowIncomeInfo(true)}
              className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Info"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{formatCurrencyShort(stats.totalIncome)}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-1.5 rounded-full">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">{t.dashboard.expenses}</span>
            <button
              onClick={() => setShowExpenseInfo(true)}
              className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Info"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{formatCurrencyShort(stats.totalExpense)}</span>
        </div>
        {/* Balance Card - Visible on tablet/desktop */}
        <div className="hidden md:flex bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl p-3 sm:p-4 shadow-sm flex-col text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold opacity-90">Balance</span>
            <button
              onClick={() => setShowBalanceInfo(true)}
              className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-lg sm:text-xl font-bold">{formatCurrencyShort(stats.balance)}</span>
        </div>
        {/* Savings Rate - Visible on tablet/desktop */}
        <div className="hidden md:flex bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex-col">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">Tasa de Ahorro</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
            {stats.totalIncome > 0 ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* SPENDING RANKINGS & PIE CHART */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{t.dashboard.expenseDistribution}</h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md hidden sm:block">{t.dashboard.tapToFilter}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Pie Chart */}
          <div className="h-[180px] sm:h-[200px] w-full md:w-1/2 relative min-w-0" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => onFilter('category', data.originalName)}
                  cursor="pointer"
                  stroke="none"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                  formatter={(value: number) => formatCurrencyShort(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 dark:text-slate-600 opacity-50" />
            </div>
          </div>

          {/* Ranking List - Scrollable to show all categories */}
          <div className="space-y-2 sm:space-y-3 md:flex-1 max-h-[300px] overflow-y-auto pr-1">
            {categoryData.map((cat: any, idx: number) => (
              <div
                key={cat.originalName}
                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors -mx-2"
                onClick={() => onFilter('category', cat.originalName)}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</p>
                    <div className="h-1 sm:h-1.5 w-16 sm:w-24 bg-slate-100 dark:bg-slate-600 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(cat.value / stats.totalExpense) * 100}%`, backgroundColor: cat.color }}></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">{formatCurrencyShort(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EMOTIONAL DASHBOARD (If data exists) */}
      {moodStats && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 p-4 sm:p-6 rounded-3xl border border-indigo-100 dark:border-slate-700">
          <h3 className="font-bold text-sm sm:text-base text-indigo-900 dark:text-indigo-300 mb-3 sm:mb-4 flex items-center gap-2">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" /> {t.dashboard.emotionalDashboard}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white dark:bg-slate-700 p-2 sm:p-3 rounded-xl border border-indigo-50 dark:border-slate-600 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <Frown className="w-3 h-3 text-rose-500" /> {t.dashboard.stress}
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{formatCurrencyShort(moodStats.stressed || 0)}</p>
            </div>
            <div className="bg-white dark:bg-slate-700 p-2 sm:p-3 rounded-xl border border-indigo-50 dark:border-slate-600 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <Zap className="w-3 h-3 text-amber-500" /> {t.dashboard.tiredness}
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{formatCurrencyShort(moodStats.tired || 0)}</p>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-2 sm:mt-3 font-medium">
            {t.dashboard.moodTip.replace('{percent}', String(Math.round(((moodStats.stressed || 0) / stats.totalExpense) * 100)))}
          </p>
        </div>
      )}

      {/* TREND BAR CHART */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">{t.dashboard.trend6Months}</h3>
          <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md hidden sm:block">{t.dashboard.tapBarsToFilter}</span>
        </div>
        <div className="h-[180px] sm:h-[200px] md:h-[250px] w-full min-w-0" style={{ minHeight: 180 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <BarChart
              data={barData}
              barGap={4}
              margin={{ left: -20, right: 0 }}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  onFilter('date', data.activePayload[0].payload.key);
                }
              }}
              cursor="pointer"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k ${code}`} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 4, 4]} barSize={8} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 4, 4]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Amount Info Modals */}
      <AmountInfoModal
        isOpen={showBalanceInfo}
        onClose={() => setShowBalanceInfo(false)}
        title={language === 'es' ? 'Información del Balance' : 'Balance Information'}
        subtitle={language === 'es' ? '¿De dónde sale este monto?' : 'Where does this amount come from?'}
        totalAmount={stats.balance}
        breakdown={balanceBreakdown}
        currencySymbol={symbol}
        language={language as 'es' | 'en'}
      />

      <AmountInfoModal
        isOpen={showIncomeInfo}
        onClose={() => setShowIncomeInfo(false)}
        title={language === 'es' ? 'Información de Ingresos' : 'Income Information'}
        subtitle={language === 'es' ? 'Desglose de tus ingresos' : 'Breakdown of your income'}
        totalAmount={stats.totalIncome}
        breakdown={incomeBreakdown}
        currencySymbol={symbol}
        language={language as 'es' | 'en'}
      />

      <AmountInfoModal
        isOpen={showExpenseInfo}
        onClose={() => setShowExpenseInfo(false)}
        title={language === 'es' ? 'Información de Gastos' : 'Expenses Information'}
        subtitle={language === 'es' ? 'Desglose de tus gastos' : 'Breakdown of your expenses'}
        totalAmount={stats.totalExpense}
        breakdown={expenseBreakdown}
        currencySymbol={symbol}
        language={language as 'es' | 'en'}
      />
    </div>
  );
};

// Custom comparison function for React.memo
// Only re-render if these props actually change
const arePropsEqual = (prevProps: DashboardProps, nextProps: DashboardProps) => {
  return (
    // Compare stats object (shallow comparison of key values)
    prevProps.stats.balance === nextProps.stats.balance &&
    prevProps.stats.income === nextProps.stats.income &&
    prevProps.stats.expenses === nextProps.stats.expenses &&
    // Compare transactions array length and reference
    prevProps.transactions.length === nextProps.transactions.length &&
    prevProps.transactions === nextProps.transactions &&
    // Compare goals array length and reference
    prevProps.goals.length === nextProps.goals.length &&
    prevProps.goals === nextProps.goals &&
    // Compare currency config
    prevProps.currencyConfig?.localSymbol === nextProps.currencyConfig?.localSymbol &&
    prevProps.currencyConfig?.localCode === nextProps.currencyConfig?.localCode &&
    // Functions are assumed stable (from parent with useCallback)
    prevProps.onAddClick === nextProps.onAddClick &&
    prevProps.onFilter === nextProps.onFilter
  );
};

// Export memoized component to prevent unnecessary re-renders
export const Dashboard = memo(DashboardComponent, arePropsEqual);
