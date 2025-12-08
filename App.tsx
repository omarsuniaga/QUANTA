import React, { useState, useEffect, useRef } from 'react';
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
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import { LayoutGrid, ListFilter, Plus, ArrowUpRight, ArrowDownRight, Zap, WifiOff, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { useI18n } from './contexts';
import { useAuth, useTransactions, useSettings, useToast } from './contexts';
import { Goal, Promo, Transaction } from './types';
import { pushNotificationService } from './services/pushNotificationService';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
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

  // === LOADING STATE ===
  const loading = authLoading || txLoading || settingsLoading;

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
        const hasShown = localStorage.getItem('notificationPromptShown');
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
      <div className={`min-h-screen flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100`}>

        {/* Header */}
        <header className={`px-6 pt-12 pb-4 sticky top-0 z-30 border-b flex justify-between items-start transition-all backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800`}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.hello}, {user.name} 👋</p>
              {!isOnline && (
                <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> {t.common.offline}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
              {currencySymbol}{stats.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-1 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded-md">{t.dashboard.availableToday}</p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-full transition-colors bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-white"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-28">

          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">

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

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-3">
                {quickActions.filter(qa => qa.showOnHome).sort((a, b) => a.order - b.order).map(action => (
                  <button
                    key={action.id}
                    onClick={() => openModal(action.type, action.defaults)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border active:scale-95 transition-all bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:shadow-sm`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-${action.color}-50 dark:bg-${action.color}-900/30 text-${action.color}-600 dark:text-${action.color}-400`}>
                      {action.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                        action.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> :
                          <Zap className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-bold truncate w-full text-center">{action.name}</span>
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
                onAddContribution={() => { }}
                onEditGoal={handleOpenGoalModal}
                onAddGoal={() => handleOpenGoalModal()}
                currencySymbol={currencySymbol}
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

          {activeTab === 'transactions' && (
            <div className="p-6 space-y-4">
              {/* Search Bar */}
              <SearchBar
                value={filters.search}
                onChange={(value) => setFilters({ search: value })}
                placeholder={t.transactions.searchPlaceholder}
              />

              {/* Filter Button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <ListFilter className="w-5 h-5" />
                {t.transactions.advancedFilters}
                {(filters.category || filters.dateFrom || filters.dateTo || filters.type !== 'all' || filters.paymentMethod) && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold">
                    {[
                      filters.category,
                      filters.dateFrom,
                      filters.dateTo,
                      filters.type !== 'all' ? filters.type : null,
                      filters.paymentMethod
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>

              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                activeFilter={filters.category ? { type: 'category' as const, value: filters.category } : null}
                onClearFilter={handleClearFilter}
                currencySymbol={currencySymbol}
              />
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={updateSettings}
              quickActions={quickActions}
              onUpdateQuickActions={updateQuickActions}
              onLogout={handleLogout}
              userEmail={user.email}
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

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
          <div className="h-12 pointer-events-none absolute bottom-full w-full bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
          <nav className="backdrop-blur-lg border-t px-6 py-3 flex justify-between items-center rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">

            <button
              onClick={() => { setActiveTab('dashboard'); clearFilters(); }}
              className={`flex flex-col items-center gap-1 transition-all w-16 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-6 h-6" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
            </button>

            {/* Central FAB */}
            <div className="-mt-8">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 dark:shadow-indigo-900/50 transition-all active:scale-95 ${showMenu ? 'bg-slate-800 dark:bg-slate-700 rotate-45' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <Plus className="w-8 h-8 text-white" />
              </button>
            </div>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex flex-col items-center gap-1 transition-all w-16 ${activeTab === 'transactions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <ListFilter className="w-6 h-6" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            </button>
          </nav>
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
      </div>
    </div>
  );
}
