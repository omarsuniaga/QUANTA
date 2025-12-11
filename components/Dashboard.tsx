
import React, { useMemo, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Transaction, DashboardStats, Category, AppSettings, Goal, Subscription } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Wallet, ArrowUpRight, ArrowDownRight, BellRing, TrendingUp, HelpCircle, Smile, Frown, Zap, Trophy, PieChart as PieChartIcon, Filter } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { InsightCard } from './InsightCard';
import { useI18n } from '../contexts/I18nContext';

interface DashboardProps {
  stats: DashboardStats;
  transactions: Transaction[];
  goals: Goal[]; // Added goals prop
  onAddClick: () => void;
  onFilter: (type: 'category' | 'date', value: string) => void;
  currencyConfig: AppSettings['currency'];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, transactions, goals, onAddClick, onFilter, currencyConfig }) => {
  const { t, language } = useI18n();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  // Load subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const subs = await storageService.getSubscriptions();
        setSubscriptions(subs);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      }
    };
    loadSubscriptions();
  }, [transactions]); // Reload when transactions change (in case a new service was added)
  
  // Check for notifications
  const upcomingPayments = notificationService.getUpcomingTransactions(transactions);
  const symbol = currencyConfig?.localSymbol || '$';

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

  // --- ANALYTICS: Top Spending Categories & Pie Data ---
  const categoryData = useMemo(() => {
    const data = transactions.reduce((acc, curr) => {
      if (curr.type === 'expense') {
        if (!acc[curr.category]) {
          // Get translated category name
          const translatedName = (t.categories as Record<string, string>)[curr.category] || curr.category;
          acc[curr.category] = { 
            name: translatedName, 
            originalName: curr.category, // Keep original for filtering
            value: 0, 
            color: CATEGORY_COLORS[curr.category] || '#94a3b8' 
          };
        }
        acc[curr.category].value += curr.amount;
      }
      return acc;
    }, {} as Record<string, any>);
    return Object.values(data).sort((a: any, b: any) => b.value - a.value);
  }, [transactions, t.categories]);

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
              {p.name === 'income' ? t.dashboard.income : t.dashboard.expenses}: {symbol}{p.value.toLocaleString()}
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
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700">{t.dashboard.endOfMonth}</span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">{t.dashboard.balanceProjection}</p>
              <h3 className="text-3xl font-bold">{symbol}{predictedBalance.toLocaleString()}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-rose-300 mb-0.5">{t.dashboard.pending}</p>
              <p className="font-semibold text-rose-400">-{symbol}{(stats.balance - predictedBalance).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
            {t.dashboard.recurringBillsInfo}
          </div>
        </div>
      </div>

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-full">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">{t.dashboard.income}</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{symbol}{stats.totalIncome.toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-1.5 rounded-full">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold">{t.dashboard.expenses}</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">{symbol}{stats.totalExpense.toLocaleString()}</span>
        </div>
        {/* Balance Card - Visible on tablet/desktop */}
        <div className="hidden md:flex bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl p-3 sm:p-4 shadow-sm flex-col text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold opacity-90">Balance</span>
          </div>
          <span className="text-lg sm:text-xl font-bold">{symbol}{stats.balance.toLocaleString()}</span>
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
          <div className="h-[180px] sm:h-[200px] w-full md:w-1/2 relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                  formatter={(value: number) => `${symbol}${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PieChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 dark:text-slate-600 opacity-50" />
            </div>
          </div>

          {/* Ranking List */}
          <div className="space-y-3 sm:space-y-4 md:flex-1">
            {categoryData.slice(0, 4).map((cat: any, idx: number) => (
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
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">{symbol}{cat.value.toLocaleString()}</span>
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
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{symbol}{(moodStats.stressed || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-slate-700 p-2 sm:p-3 rounded-xl border border-indigo-50 dark:border-slate-600 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                <Zap className="w-3 h-3 text-amber-500" /> {t.dashboard.tiredness}
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{symbol}{(moodStats.tired || 0).toLocaleString()}</p>
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
        <div className="h-[180px] sm:h-[200px] md:h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${symbol}${val / 1000}k`} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 4, 4]} barSize={8} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 4, 4]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
