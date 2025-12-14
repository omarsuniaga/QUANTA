import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { ActionModal } from './components/ActionModal';
import { GoalModal } from './components/GoalModal';
import { PromoModal } from './components/PromoModal';
import { GoalsWidget, PromoCarousel } from './components/HomeWidgets';
import { SettingsScreen } from './components/SettingsScreen';
import { LandingPage } from './components/LandingPage';
import { SearchBar } from './components/SearchBar';
import { FilterModal } from './components/FilterModal';
import { IncomeScreen } from './components/IncomeScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import { AICoachWidget } from './components/AICoachWidget';
import { AICoachScreen } from './components/AICoachScreen';
import { SavingsPlanner } from './components/SavingsPlanner';
import { ChallengesScreen } from './components/ChallengesScreen';
import { StrategiesScreen } from './components/StrategiesScreen';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { QuickExpenseWidget } from './components/QuickExpenseWidget';
import { QuickExpenseScreen } from './components/QuickExpenseScreen';
import { LayoutGrid, ListFilter, Plus, ArrowUpRight, ArrowDownRight, Zap, WifiOff, AlertTriangle, Settings as SettingsIcon, Brain, List, DollarSign } from 'lucide-react';
import { useI18n } from './contexts';
import { useAuth, useTransactions, useSettings, useToast } from './contexts';
import { Goal, Promo, Transaction } from './types';
import { pushNotificationService } from './services/pushNotificationService';
import { smartNotificationService } from './services/smartNotificationService';
import { NotificationCenter, NotificationBell } from './components/NotificationCenter';
import { NotificationPreferences } from './components/NotificationPreferences';
import { GoalsManagement } from './components/GoalsManagement';

export default function App() {
  // === CONTEXT HOOKS (replacing local state) ===
  const { user, loading: authLoading, isOnline, login, register, logout } = useAuth();
  const {
    transactions,
    stats,
    filteredTransactions,
    ghostMoneyAlerts,
    loading: txLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    clearFilters,
    filters
  } = useTransactions();
  const {
    settings,
    goals,
    promos,
    quickActions,
    isDarkMode,
    currencySymbol,
    currencyCode,
    updateSettings,
    updateQuickActions,
    addGoal,
    updateGoal,
    deleteGoal,
    addPromo,
    updatePromo,
    deletePromo,
    loading: settingsLoading
  } = useSettings();
  const toast = useToast();
  const { t } = useI18n();

  // === LOCAL UI STATE (not business logic) ===
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses' | 'transactions' | 'settings'>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [modalMode, setModalMode] = useState<'income' | 'expense' | 'service'>('income');
  const [modalInitialValues, setModalInitialValues] = useState<any>(undefined);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  // AI Coach screens state
  const [showAICoach, setShowAICoach] = useState(false);
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showQuickExpenses, setShowQuickExpenses] = useState(false);

  // Notification system state
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showGoalsManagement, setShowGoalsManagement] = useState(false);

  // === LOADING STATE ===
  const loading = authLoading || txLoading || settingsLoading;

  // === TAB NAVIGATION ORDER FOR SWIPE ===
  const tabOrder: Array<'dashboard' | 'income' | 'expenses' | 'transactions' | 'settings'> = ['dashboard', 'income', 'expenses', 'transactions', 'settings'];
  
  // Swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const minSwipeDistance = 80; // Minimum swipe distance to trigger navigation

  // Navigation with history management
  const navigateToTab = useCallback((tab: typeof activeTab, addToHistory = true) => {
    if (addToHistory && tab !== activeTab) {
      // Push state to browser history
      window.history.pushState({ tab }, '', `#${tab}`);
    }
    setActiveTab(tab);
    if (tab === 'dashboard') {
      clearFilters();
    }
  }, [activeTab, clearFilters]);

  // Handle browser back button
  useEffect(() => {
    // Set initial state
    if (!window.location.hash) {
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    } else {
      const hash = window.location.hash.replace('#', '') as typeof activeTab;
      if (tabOrder.includes(hash)) {
        setActiveTab(hash);
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tab) {
        navigateToTab(event.state.tab, false);
      } else {
        navigateToTab('dashboard', false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigateToTab]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const currentIndex = tabOrder.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabOrder.length - 1) {
      // Swipe left -> go to next tab
      navigateToTab(tabOrder[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right -> go to previous tab
      navigateToTab(tabOrder[currentIndex - 1]);
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeTab, navigateToTab]);

  // === EFFECTS ===
  // Ref to track if notifications have been initialized
  const notificationsInitialized = useRef(false);

  // Inicializar notificaciones push (solo una vez)
  useEffect(() => {
    if (notificationsInitialized.current) return;

    const initializeNotifications = async () => {
      if (user && pushNotificationService.isNotificationSupported()) {
        await pushNotificationService.initialize();
        notificationsInitialized.current = true;

        // Mostrar prompt si no se ha mostrado antes y hay transacciones
        const hasShown = typeof window !== 'undefined' && localStorage.getItem('notificationPromptShown');
        if (!hasShown && transactions.length > 0) {
          // Esperar 5 segundos después de que el usuario vea la app
          setTimeout(() => {
            setShowNotificationPrompt(true);
          }, 5000);
        }
      }
    };

    initializeNotifications();
  }, [user, transactions.length]);

  // Ejecutar verificaciones de notificaciones inteligentes
  useEffect(() => {
    if (!user || transactions.length === 0 || !stats) return;
    
    // Ejecutar verificaciones de notificaciones (pagos, metas, presupuesto, etc.)
    const runNotificationChecks = async () => {
      try {
        await smartNotificationService.runAllChecks(
          transactions,
          [], // subscriptions - not implemented yet
          goals,
          [], // budgets - not implemented yet
          stats,
          currencyCode,
          'es'
        );
      } catch (error) {
        console.error('Error running notification checks:', error);
      }
    };

    // Ejecutar al cargar y cada 30 minutos
    const timeoutId = setTimeout(runNotificationChecks, 2000); // Delay initial check
    const interval = setInterval(runNotificationChecks, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [user, transactions, goals, stats, currencyCode]);

  if (loading) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // === NOT LOGGED IN - SHOW LANDING PAGE ===
  if (!user) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <LandingPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  // === HANDLERS (now simplified to use contexts) ===
  const openModal = (mode: 'income' | 'expense' | 'service', initialValues?: any) => {
    setModalMode(mode);
    setModalInitialValues(initialValues);
    setTransactionToEdit(null);
    setShowModal(true);
    setShowMenu(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setModalMode(transaction.type as 'income' | 'expense');
    setModalInitialValues(transaction);
    setShowModal(true);
  };

  const handleSaveFromModal = async (data: any) => {
    try {
      if (modalMode === 'service') {
        // Handle subscription (service)
        const sub = await import('./services/storageService').then(m => m.storageService.addSubscription(data));
        
        // Also create a recurring transaction so it appears in the transaction list and affects balance
        const today = new Date();
        // Calculate the next charge date based on chargeDay
        let chargeDate = new Date(today.getFullYear(), today.getMonth(), data.chargeDay);
        // If the charge day has already passed this month, use next month
        if (chargeDate < today) {
          chargeDate = new Date(today.getFullYear(), today.getMonth() + 1, data.chargeDay);
        }
        
        const transactionData = {
          type: 'expense' as const,
          amount: data.amount,
          category: data.category || 'Services',
          description: data.name,
          date: chargeDate.toISOString().split('T')[0],
          isRecurring: true,
          frequency: data.frequency || 'monthly',
          paymentMethod: data.paymentMethod,
          subscriptionId: sub.id, // Link to subscription for future reference
        };
        
        await addTransaction(transactionData);
        toast.success(t.common.serviceSaved, `${data.name} - ${t.common.remindersActive}`);
      } else {
        // Handle transaction (income/expense)
        if (transactionToEdit) {
          // Edit existing transaction
          await updateTransaction(transactionToEdit.id, data);
        } else {
          // Add new transaction
          await addTransaction(data);
        }
      }
      setShowModal(false);
      setTransactionToEdit(null);
    } catch (error: any) {
      toast.error(t.common.saveError, error.message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleOpenGoalModal = (goal?: Goal) => {
    setEditingGoal(goal || null);
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (goal: Goal) => {
    const exists = goals.some(g => g.id === goal.id);
    if (exists) {
      await updateGoal(goal);
    } else {
      await addGoal(goal);
    }
    setShowGoalModal(false);
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    setShowGoalModal(false);
  };

  // Handle goal contribution
  const handleAddContribution = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Check if there are sufficient funds
    if (stats.balance < amount) {
      toast.error('Fondos insuficientes', `Necesitas ${amount.toLocaleString()} ${currencyCode} para hacer esta reservación`);
      return;
    }

    // Update the goal with new contribution
    const updatedGoal: Goal = {
      ...goal,
      currentAmount: goal.currentAmount + amount,
      lastContributionDate: new Date().toISOString(),
      contributionHistory: [
        ...(goal.contributionHistory || []),
        { date: new Date().toISOString(), amount }
      ]
    };

    // Calculate next contribution date
    const nextDate = new Date();
    switch (goal.contributionFrequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    updatedGoal.nextContributionDate = nextDate.toISOString();

    await updateGoal(updatedGoal);
    
    // Create a transaction to record this transfer to savings
    await addTransaction({
      type: 'expense',
      category: 'savings' as any,
      amount: amount,
      description: `Aporte a meta: ${goal.name}`,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transferencia'
    });

    toast.success('Aporte realizado', `Se han reservado ${amount.toLocaleString()} ${currencyCode} para "${goal.name}"`);
  };

  // Handle delete contribution from goal
  const handleDeleteContribution = async (goalId: string, contributionIndex: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.contributionHistory) return;
    
    const contribution = goal.contributionHistory[contributionIndex];
    if (!contribution) return;
    
    // Remove the contribution from history
    const newHistory = goal.contributionHistory.filter((_, idx) => idx !== contributionIndex);
    
    // Update the goal with reduced amount
    const updatedGoal: Goal = {
      ...goal,
      currentAmount: Math.max(0, goal.currentAmount - contribution.amount),
      contributionHistory: newHistory,
      lastContributionDate: newHistory.length > 0 ? newHistory[newHistory.length - 1].date : undefined
    };

    await updateGoal(updatedGoal);
    toast.success(
      t.common.delete || 'Eliminado', 
      `Se ha eliminado el aporte de ${contribution.amount.toLocaleString()} ${currencyCode}`
    );
  };

  const handleOpenPromoModal = (promo?: Promo) => {
    setEditingPromo(promo || null);
    setShowPromoModal(true);
  };

  const handleSavePromo = async (promo: Promo) => {
    const exists = promos.some(p => p.id === promo.id);
    if (exists) {
      await updatePromo(promo);
    } else {
      await addPromo(promo);
    }
    setShowPromoModal(false);
  };

  const handleDeletePromo = async (id: string) => {
    await deletePromo(id);
    setShowPromoModal(false);
  };

  const handleFilter = (type: 'category' | 'date', value: string) => {
    if (type === 'category') {
      setFilters({ category: value });
    } else if (type === 'date') {
      setFilters({ dateFrom: value, dateTo: value });
    }
    setActiveTab('transactions');
  };

  const handleClearFilter = () => {
    clearFilters();
  };

  // Inicializar notificaciones push
  const handleLogout = async () => {
    await logout();
    setActiveTab('dashboard');
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full`}>
      <div className={`min-h-screen flex flex-col lg:flex-row max-w-7xl mx-auto relative overflow-hidden font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100`}>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:left-1/2 lg:-translate-x-[calc(50%+28rem)] xl:-translate-x-[calc(50%+32rem)] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 overflow-y-auto">
          <div className="flex-1 flex flex-col p-6 pb-8">
            {/* Logo/Brand */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">QUANTA</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Finance Tracker</p>
            </div>

            {/* User Info */}
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.hello}, {user.name}</p>
                <NotificationBell onClick={() => setShowNotificationCenter(true)} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencyCode}
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1">{t.dashboard.availableToday}</p>
              {!isOnline && (
                <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 w-fit">
                  <WifiOff className="w-3 h-3" /> {t.common.offline}
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              <button
                onClick={() => navigateToTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <LayoutGrid className="w-5 h-5" />
                {t.nav.dashboard}
              </button>
              <button
                onClick={() => navigateToTab('income')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <ArrowUpRight className="w-5 h-5" />
                💰 Ingresos
              </button>
              <button
                onClick={() => navigateToTab('expenses')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'expenses' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <ArrowDownRight className="w-5 h-5" />
                💸 Gastos
              </button>
              <button
                onClick={() => navigateToTab('transactions')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'transactions' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <List className="w-5 h-5" />
                📋 Historial
              </button>
              <button
                onClick={() => navigateToTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <SettingsIcon className="w-5 h-5" />
                {t.nav.settings}
              </button>
            </nav>

            {/* Quick Actions */}
            <div className="mt-8">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">Acciones Rápidas</p>
              <div className="space-y-2">
                <button onClick={() => setShowAICoach(true)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/30 dark:hover:to-violet-900/30 transition-colors border border-indigo-100 dark:border-indigo-800">
                  <Brain className="w-4 h-4" /> Coach IA
                </button>
                <button onClick={() => openModal('income')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                  <ArrowUpRight className="w-4 h-4" /> Nuevo Ingreso
                </button>
                <button onClick={() => openModal('expense')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                  <ArrowDownRight className="w-4 h-4" /> Nuevo Gasto
                </button>
                <button onClick={() => openModal('service')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                  <Zap className="w-4 h-4" /> Nuevo Servicio
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col max-w-3xl mx-auto w-full">

        {/* Header - Mobile/Tablet only */}
        <header className={`px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sticky top-0 z-30 border-b flex justify-between items-start transition-all backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 lg:hidden`}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.hello}, {user.name} 👋</p>
              {!isOnline && (
                <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> {t.common.offline}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
              {stats.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currencyCode}
            </h2>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded-md">{t.dashboard.availableToday}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell onClick={() => setShowNotificationCenter(true)} />
            <button
              onClick={() => navigateToTab('settings')}
              className="p-2 rounded-full transition-colors bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-28 lg:pb-8 lg:pt-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          {activeTab === 'dashboard' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">

              {/* Ghost Money Alerts */}
              {ghostMoneyAlerts.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mb-1">{t.dashboard.ghostMoneyDetector}</p>
                    {ghostMoneyAlerts.map((msg, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{msg}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Coach Widget */}
              <AICoachWidget
                transactions={transactions}
                stats={stats}
                goals={goals}
                onOpenAICoach={() => setShowAICoach(true)}
                onOpenSavingsPlanner={() => setShowSavingsPlanner(true)}
                onOpenChallenges={() => setShowChallenges(true)}
                onOpenStrategies={() => setShowStrategies(true)}
              />

              {/* Quick Expense Widget */}
              <QuickExpenseWidget onOpenFullScreen={() => setShowQuickExpenses(true)} />

              {/* Quick Actions Grid - Mobile/Tablet only (hidden on desktop since it's in sidebar) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 lg:hidden">
                {quickActions.filter(qa => qa.showOnHome).sort((a, b) => a.order - b.order).map(action => (
                  <button
                    key={action.id}
                    onClick={() => openModal(action.type, action.defaults)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border active:scale-95 transition-all bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:shadow-sm`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm bg-${action.color}-50 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                      {action.type === 'income' ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> :
                        action.type === 'expense' ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> :
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold truncate w-full text-center">{action.name}</span>
                  </button>
                ))}

                {quickActions.filter(qa => qa.showOnHome).length === 0 && (
                  <div className="col-span-3 text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 text-sm">
                    {t.dashboard.noQuickActions}
                  </div>
                )}
              </div>

              <GoalsWidget
                goals={goals}
                onAddContribution={handleAddContribution}
                onEditGoal={handleOpenGoalModal}
                onAddGoal={() => handleOpenGoalModal()}
                onDeleteContribution={handleDeleteContribution}
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                availableBalance={stats.balance}
              />

              <PromoCarousel
                promos={promos}
                onEditPromo={handleOpenPromoModal}
                onAddPromo={() => handleOpenPromoModal()}
              />

              <Dashboard
                stats={stats}
                transactions={transactions}
                goals={goals}
                onAddClick={() => openModal('expense')}
                onFilter={handleFilter}
                currencyConfig={settings?.currency || { localCode: 'USD', localSymbol: '$', rateToBase: 1 }}
              />
            </div>
          )}

          {activeTab === 'income' && (
            <IncomeScreen
              transactions={transactions}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onAddFixedIncome={() => {
                setModalMode('income');
                setModalInitialValues({ isRecurring: true, frequency: 'monthly' });
                setShowModal(true);
              }}
              onAddExtraIncome={() => {
                setModalMode('income');
                setModalInitialValues({ isRecurring: false });
                setShowModal(true);
              }}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesScreen
              transactions={transactions}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              monthlyBudget={45000} // TODO: Get from user settings
              onQuickExpense={() => {
                setModalMode('expense');
                setModalInitialValues({ isRecurring: false });
                setShowModal(true);
              }}
              onRecurringExpense={() => {
                setModalMode('expense');
                setModalInitialValues({ isRecurring: true, frequency: 'monthly' });
                setShowModal(true);
              }}
              onPlannedExpense={() => {
                setModalMode('expense');
                setModalInitialValues({ isRecurring: false });
                setShowModal(true);
              }}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsScreen
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
            />
          )}

          {activeTab === 'settings' && settings && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={updateSettings}
              quickActions={quickActions}
              onUpdateQuickActions={updateQuickActions}
              onLogout={handleLogout}
              userEmail={user.email}
              onOpenNotificationPrefs={() => setShowNotificationPrefs(true)}
              onOpenGoalsManagement={() => setShowGoalsManagement(true)}
            />
          )}
        </main>

        {/* Floating Action Menu */}
        {showMenu && (
          <div className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-200">
              <button onClick={() => openModal('income')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-emerald-600 dark:text-emerald-400 font-bold hover:scale-105 transition-transform">
                <ArrowUpRight className="w-5 h-5" /> Nuevo Ingreso
              </button>
              <button onClick={() => openModal('expense')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-rose-600 dark:text-rose-400 font-bold hover:scale-105 transition-transform">
                <ArrowDownRight className="w-5 h-5" /> Nuevo Gasto
              </button>
              <button onClick={() => openModal('service')} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-lg text-indigo-600 dark:text-indigo-400 font-bold hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" /> Nuevo Servicio
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation - Mobile/Tablet only */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 pointer-events-none absolute bottom-full w-full bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
            <nav className="backdrop-blur-lg border-t px-3 py-3 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">

            <button
              onClick={() => navigateToTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-5 h-5" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Inicio</span>
            </button>

            <button
              onClick={() => navigateToTab('income')}
              className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            >
              <ArrowUpRight className="w-5 h-5" strokeWidth={activeTab === 'income' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Ingresos</span>
            </button>

            <button
              onClick={() => navigateToTab('expenses')}
              className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${activeTab === 'expenses' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}
            >
              <ArrowDownRight className="w-5 h-5" strokeWidth={activeTab === 'expenses' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Gastos</span>
            </button>

            <button
              onClick={() => navigateToTab('transactions')}
              className={`flex flex-col items-center gap-0.5 transition-all flex-1 ${activeTab === 'transactions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <List className="w-5 h-5" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Historial</span>
            </button>
            </nav>
          </div>
        </div>

        {/* Modals */}
        {showModal && (
          <ActionModal
            mode={modalMode}
            onClose={() => {
              setShowModal(false);
              setTransactionToEdit(null);
            }}
            onSave={handleSaveFromModal}
            initialValues={modalInitialValues}
            currencySymbol={currencySymbol}
          />
        )}

        {showGoalModal && (
          <GoalModal
            goal={editingGoal}
            onClose={() => setShowGoalModal(false)}
            onSave={handleSaveGoal}
            onDelete={handleDeleteGoal}
            currencySymbol={currencySymbol}
            currencyCode={currencyCode}
            availableBalance={stats.balance}
          />
        )}

        {showPromoModal && (
          <PromoModal
            promo={editingPromo}
            onClose={() => setShowPromoModal(false)}
            onSave={handleSavePromo}
            onDelete={handleDeletePromo}
          />
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <FilterModal
            filters={filters}
            onApply={(newFilters) => {
              setFilters(newFilters);
              setShowFilterModal(false);
            }}
            onClose={() => setShowFilterModal(false)}
          />
        )}

        {/* Notification Permission Prompt */}
        {showNotificationPrompt && (
          <NotificationPermissionPrompt
            onClose={() => setShowNotificationPrompt(false)}
          />
        )}

        {/* AI Coach Full Screen */}
        {showAICoach && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <AICoachScreen
              transactions={transactions}
              stats={stats}
              goals={goals}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onBack={() => setShowAICoach(false)}
              onOpenSavingsPlanner={() => {
                setShowAICoach(false);
                setShowSavingsPlanner(true);
              }}
              onOpenChallenges={() => {
                setShowAICoach(false);
                setShowChallenges(true);
              }}
              onOpenStrategies={() => {
                setShowAICoach(false);
                setShowStrategies(true);
              }}
            />
          </div>
        )}

        {/* Savings Planner Full Screen */}
        {showSavingsPlanner && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <SavingsPlanner
              goals={goals}
              transactions={transactions}
              stats={stats}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onBack={() => setShowSavingsPlanner(false)}
              onEditGoal={(goal) => {
                setShowSavingsPlanner(false);
                handleOpenGoalModal(goal);
              }}
              onAddGoal={() => {
                setShowSavingsPlanner(false);
                handleOpenGoalModal();
              }}
            />
          </div>
        )}

        {/* Challenges Full Screen */}
        {showChallenges && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <ChallengesScreen
              transactions={transactions}
              stats={stats}
              goals={goals}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onBack={() => setShowChallenges(false)}
            />
          </div>
        )}

        {/* Strategies Full Screen */}
        {showStrategies && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
            <StrategiesScreen
              transactions={transactions}
              stats={stats}
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
              onBack={() => setShowStrategies(false)}
            />
          </div>
        )}

        {/* Quick Expenses Full Screen */}
        <QuickExpenseScreen
          isOpen={showQuickExpenses}
          onClose={() => setShowQuickExpenses(false)}
        />

        {/* Notification Center Modal */}
        {showNotificationCenter && (
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
            onOpenSettings={() => {
              setShowNotificationCenter(false);
              setShowNotificationPrefs(true);
            }}
          />
        )}

        {/* Notification Preferences Modal */}
        {showNotificationPrefs && (
          <NotificationPreferences
            isOpen={showNotificationPrefs}
            onClose={() => setShowNotificationPrefs(false)}
          />
        )}

        {/* Goals Management Modal */}
        {showGoalsManagement && (
          <GoalsManagement
            isOpen={showGoalsManagement}
            onClose={() => setShowGoalsManagement(false)}
            goals={goals}
            onAddGoal={() => {
              setShowGoalsManagement(false);
              handleOpenGoalModal();
            }}
            onEditGoal={(goal) => {
              setShowGoalsManagement(false);
              handleOpenGoalModal(goal);
            }}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoal={updateGoal}
            currencySymbol={currencySymbol}
            currencyCode={currencyCode}
            availableBalance={stats.income - stats.expenses}
          />
        )}

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        </div>
      </div>
    </div>
  );
}
