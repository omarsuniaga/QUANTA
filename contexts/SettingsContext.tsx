import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppSettings, QuickAction, Goal, Promo, Account, Budget } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { setUserGeminiApiKey } from '../services/geminiService';

interface SettingsContextType {
  settings: AppSettings | null;
  quickActions: QuickAction[];
  goals: Goal[];
  promos: Promo[];
  accounts: Account[];
  budgets: Budget[];
  loading: boolean;
  isDarkMode: boolean;
  currencySymbol: string;
  
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  
  // Quick Actions
  updateQuickActions: (actions: QuickAction[]) => Promise<void>;
  addQuickAction: (action: Omit<QuickAction, 'id'>) => Promise<void>;
  deleteQuickAction: (id: string) => Promise<void>;
  
  // Goals
  updateGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Promos
  updatePromos: (promos: Promo[]) => void;
  addPromo: (promo: Promo) => Promise<void>;
  updatePromo: (promo: Promo) => Promise<void>;
  deletePromo: (id: string) => Promise<void>;
  
  // Accounts
  updateAccounts: (accounts: Account[]) => Promise<void>;
  addAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  // Budgets
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (category: string) => Promise<void>;
  
  // Refresh
  refreshAll: () => Promise<void>;
}

// Default Settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'es',
  currency: { localCode: 'USD', localSymbol: '$', rateToBase: 1, baseCode: 'USD' },
  notifications: { enabled: true, billReminders: true, reminderLeadDays: 3, emailAlerts: false },
  aiConfig: { enabled: true, level: 'medium', dataSharing: false }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  
  // System theme preference
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load all data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setSettings(null);
      setQuickActions([]);
      setGoals([]);
      setPromos([]);
      setAccounts([]);
      setBudgets([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sts, qa, gs, ps, accs, bdgs] = await Promise.all([
        storageService.getSettings(),
        storageService.getQuickActions(),
        storageService.getGoals(),
        storageService.getPromos(),
        storageService.getAccounts(),
        storageService.getBudgets()
      ]);
      
      setSettings(sts);
      setQuickActions(qa);
      setGoals(gs);
      setPromos(ps);
      setAccounts(accs);
      setBudgets(bdgs);
      
      // Sync user's Gemini API key with service
      if (sts?.aiConfig?.userGeminiApiKey) {
        setUserGeminiApiKey(sts.aiConfig.userGeminiApiKey);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed values
  const isDarkMode = settings?.theme === 'dark' || (settings?.theme === 'system' && systemPrefersDark);
  const currencySymbol = settings?.currency?.localSymbol || '$';

  // Settings actions
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates } as AppSettings;
    setSettings(newSettings);
    
    // Sync Gemini API key if it was updated
    if (updates.aiConfig?.userGeminiApiKey !== undefined) {
      setUserGeminiApiKey(updates.aiConfig.userGeminiApiKey);
    }
    
    try {
      await storageService.saveSettings(newSettings);
    } catch (error) {
      console.warn('Failed to save settings', error);
    }
  }, [settings]);

  // Quick Actions
  const updateQuickActions = useCallback(async (actions: QuickAction[]) => {
    setQuickActions(actions);
    await storageService.saveQuickActions(actions);
  }, []);

  const addQuickAction = useCallback(async (action: Omit<QuickAction, 'id'>) => {
    const newAction = { ...action, id: Math.random().toString(36).substr(2, 9) } as QuickAction;
    const updated = [...quickActions, newAction];
    await updateQuickActions(updated);
  }, [quickActions, updateQuickActions]);

  const deleteQuickAction = useCallback(async (id: string) => {
    const updated = quickActions.filter(qa => qa.id !== id);
    await updateQuickActions(updated);
  }, [quickActions, updateQuickActions]);

  // Goals
  const updateGoals = useCallback((newGoals: Goal[]) => {
    setGoals(newGoals);
  }, []);

  const addGoal = useCallback(async (goal: Goal) => {
    const updated = [...goals, goal];
    setGoals(updated);
    await storageService.saveGoals(updated);
    toast.success('Meta creada', goal.name);
  }, [goals, toast]);

  const updateGoal = useCallback(async (goal: Goal) => {
    const updated = goals.map(g => g.id === goal.id ? goal : g);
    setGoals(updated);
    await storageService.saveGoals(updated);
  }, [goals]);

  const deleteGoal = useCallback(async (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    await storageService.deleteGoal(id);
    toast.info('Meta eliminada');
  }, [goals, toast]);

  // Promos
  const updatePromos = useCallback((newPromos: Promo[]) => {
    setPromos(newPromos);
  }, []);

  const addPromo = useCallback(async (promo: Promo) => {
    const updated = [...promos, promo];
    setPromos(updated);
    await storageService.savePromos(updated);
  }, [promos]);

  const updatePromo = useCallback(async (promo: Promo) => {
    const updated = promos.map(p => p.id === promo.id ? promo : p);
    setPromos(updated);
    await storageService.savePromos(updated);
  }, [promos]);

  const deletePromo = useCallback(async (id: string) => {
    const updated = promos.filter(p => p.id !== id);
    setPromos(updated);
    await storageService.savePromos(updated);
  }, [promos]);

  // Accounts
  const updateAccounts = useCallback(async (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    await storageService.saveAccounts(newAccounts);
  }, []);

  const addAccount = useCallback(async (account: Account) => {
    const updated = [...accounts, account];
    await updateAccounts(updated);
    toast.success('Cuenta agregada', account.name);
  }, [accounts, updateAccounts, toast]);

  const deleteAccount = useCallback(async (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    await updateAccounts(updated);
  }, [accounts, updateAccounts]);

  // Budgets
  const updateBudget = useCallback(async (budget: Budget) => {
    const exists = budgets.some(b => b.category === budget.category);
    const updated = exists 
      ? budgets.map(b => b.category === budget.category ? budget : b)
      : [...budgets, budget];
    setBudgets(updated);
    await storageService.saveBudgets(updated);
    toast.success('Presupuesto guardado', `${budget.category}: $${budget.limit}`);
  }, [budgets, toast]);

  const deleteBudget = useCallback(async (category: string) => {
    const updated = budgets.filter(b => b.category !== category);
    setBudgets(updated);
    await storageService.saveBudgets(updated);
  }, [budgets]);

  const refreshAll = useCallback(async () => {
    await loadAllData();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      quickActions,
      goals,
      promos,
      accounts,
      budgets,
      loading,
      isDarkMode,
      currencySymbol,
      updateSettings,
      updateQuickActions,
      addQuickAction,
      deleteQuickAction,
      updateGoals,
      addGoal,
      updateGoal,
      deleteGoal,
      updatePromos,
      addPromo,
      updatePromo,
      deletePromo,
      updateAccounts,
      addAccount,
      deleteAccount,
      updateBudget,
      deleteBudget,
      refreshAll
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
