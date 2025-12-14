import {
  Transaction, User, Goal, Subscription, AppSettings, QuickAction, Account, Promo, AuditLog, MonetaryAmount, CustomCategory, Budget
} from '../types';
import { auth, db } from '../firebaseConfig';
import firebase from 'firebase/compat/app';

// ============ LOCAL STORAGE HELPERS ============
// Prefix for all localStorage keys
const LS_PREFIX = 'quanta_';

// Local Storage Keys
const LS_KEYS = {
  SETTINGS: `${LS_PREFIX}settings`,
  TRANSACTIONS: `${LS_PREFIX}transactions`,
  ACCOUNTS: `${LS_PREFIX}accounts`,
  GOALS: `${LS_PREFIX}goals`,
  PROMOS: `${LS_PREFIX}promos`,
  QUICK_ACTIONS: `${LS_PREFIX}quick_actions`,
  SUBSCRIPTIONS: `${LS_PREFIX}subscriptions`,
  BUDGETS: `${LS_PREFIX}budgets`,
  CATEGORIES: `${LS_PREFIX}categories`,
  USER: `${LS_PREFIX}user`,
  LAST_SYNC: `${LS_PREFIX}last_sync`,
};

// Safe localStorage getter
const getFromLocal = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
};

// Safe localStorage setter
const saveToLocal = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage`, e);
  }
};

// Check if online
const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

// Check if Firebase is available and user is authenticated
const canUseFirebase = (): boolean => {
  return !!(auth?.currentUser && db && isOnline());
};

// Helper to get current User ID or throw
const getUserId = () => {
  const user = auth?.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Helper for references
const getUserRef = (uid: string) => db!.collection('users').doc(uid);

// Default Settings Object
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'es-ES',
  currency: { localCode: 'USD', localSymbol: '$', rateToBase: 1, baseCode: 'USD' },
  notifications: { enabled: true, billReminders: true, reminderLeadDays: 3, emailAlerts: false },
  aiConfig: { enabled: true, level: 'medium', dataSharing: false }
};

export const storageService = {
  
  // --- AUTHENTICATION & USER PROFILE ---

  async getUser(): Promise<User | null> {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return null;

    try {
      const doc = await getUserRef(firebaseUser.uid).get();
      if (doc.exists) {
        const data = doc.data() as any;
        // Map Firestore fields to Internal User Interface
        const displayName = data.displayName || firebaseUser.displayName || data.email?.split('@')[0] || 'User';
        return {
          id: data.uid,
          uid: data.uid,
          email: data.email,
          name: displayName,
          displayName: displayName,
          photoUrl: data.photoURL,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
          status: data.status
        } as User;
      }
      return null;
    } catch (e) {
      console.warn("Error fetching user profile (Using Auth Fallback)", e);
      // Fallback to auth data if Firestore blocked/fails
      const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
      return {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: fallbackName,
        displayName: fallbackName,
        status: 'active'
      };
    }
  },

  async login(email: string, password?: string): Promise<User> {
    if (!auth || !password) throw new Error("Auth not configured");
    
    // Set Persistence
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const credential = await auth.signInWithEmailAndPassword(email, password);
    const uid = credential.user?.uid;
    if (!uid) throw new Error("Login failed");

    // Update Login Timestamp (Silent fail if permissions denied)
    try {
      await getUserRef(uid).set({ lastLoginAt: Date.now(), email: email, uid: uid }, { merge: true });
    } catch (e) {
      console.warn("Could not update lastLoginAt (Permissions?)", e);
    }

    // Log Audit (Silent fail)
    this._logAudit(uid, 'login');

    const profile = await this.getUser();
    return profile!;
  },

  async register(email: string, password?: string, name?: string): Promise<User> {
    if (!auth || !password) throw new Error("Auth not configured");

    const credential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = credential.user?.uid;
    if (!uid) throw new Error("Registration failed");

    // Construct User Object matching schema
    const newUserPayload = {
      uid: uid,
      email: email,
      displayName: name || email.split('@')[0],
      photoURL: '',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      status: 'active'
    };

    // Save User Profile (Handle permission errors gracefully)
    try {
      await getUserRef(uid).set(newUserPayload);
      
      // SEED DEFAULT DATA
      await this.initializeNewUser(uid);
    } catch (e) {
      console.warn("Registration setup incomplete due to permissions", e);
    }

    return {
      id: uid,
      name: newUserPayload.displayName,
      ...newUserPayload
    } as User;
  },

  async logout(): Promise<void> {
    const uid = auth?.currentUser?.uid;
    if (uid) this._logAudit(uid, 'logout');
    await auth?.signOut();
  },

  // --- SEEDING / INSTANTIATION ---
  
  async initializeNewUser(uid: string) {
    const batch = db!.batch();
    const userRef = getUserRef(uid);

    // 1. Default Settings (Matches Schema)
    batch.set(userRef.collection('settings').doc('config'), DEFAULT_SETTINGS);

    // 2. Default Accounts
    const accountsData = [
      { id: db!.collection('_').doc().id, name: 'Efectivo', type: 'cash', balance: 0, currency: 'USD', updatedAt: Date.now() },
      { id: db!.collection('_').doc().id, name: 'Banco Principal', type: 'bank', balance: 0, currency: 'USD', updatedAt: Date.now() },
    ];
    accountsData.forEach(acc => {
      const ref = userRef.collection('accounts').doc(acc.id);
      batch.set(ref, acc);
    });

    // 3. Default Quick Actions
    const actionsData = [
      { id: db!.collection('_').doc().id, name: 'Ingreso', type: 'income', icon: 'ArrowUpRight', color: 'emerald', showOnHome: true, order: 0, defaults: { category: 'Salary' } },
      { id: db!.collection('_').doc().id, name: 'Comida', type: 'expense', icon: 'ArrowDownRight', color: 'rose', showOnHome: true, order: 1, defaults: { category: 'Food' } },
      { id: db!.collection('_').doc().id, name: 'Servicio', type: 'service', icon: 'Zap', color: 'indigo', showOnHome: true, order: 2, defaults: {} },
    ];
    actionsData.forEach(qa => {
      const ref = userRef.collection('quick_actions').doc(qa.id);
      batch.set(ref, qa);
    });

    // 4. Default Promos
    const promosData = [
      { id: db!.collection('_').doc().id, title: 'Fondo de Emergencia', subtitle: 'Comienza hoy', icon: 'Shield', color: 'emerald' },
      { id: db!.collection('_').doc().id, title: 'Viaje Soñado', subtitle: 'Planifica tu aventura', icon: 'Plane', color: 'blue' },
    ];
    promosData.forEach(p => {
      const ref = userRef.collection('promos').doc(p.id);
      batch.set(ref, p);
    });

    await batch.commit();
  },

  // --- TRANSACTIONS ---

  async getTransactions(): Promise<Transaction[]> {
    // 1. Get from localStorage first
    const localTxs = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('transactions').get();
        const firebaseTxs = snapshot.docs.map(doc => {
          const data = doc.data();
          const amountVal = typeof data.amount === 'object' ? data.amount.value : data.amount;
          
          return { 
            id: doc.id,
            ...data,
            amount: amountVal,
            monetaryDetails: typeof data.amount === 'object' ? data.amount : undefined,
            paymentMethod: data.paymentMethodId,
            description: data.description || '' 
          } as Transaction;
        });
        // Save to local for offline use
        saveToLocal(LS_KEYS.TRANSACTIONS, firebaseTxs);
        return firebaseTxs;
      } catch(e) { 
        console.warn("Failed to fetch transactions from Firebase (using local)", e);
      }
    }
    
    return localTxs;
  },

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const settings = await this.getSettings(); 
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Construct Monetary Structure
    const monetaryAmount: MonetaryAmount = {
      value: transaction.amount,
      currency: settings.currency?.localCode || 'USD',
      exchangeRate: settings.currency?.rateToBase || 1,
      valueInBase: transaction.amount * (settings.currency?.rateToBase || 1),
      baseCurrency: settings.currency?.baseCode || 'USD'
    };

    const newTransaction: Transaction = {
      id: localId,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date,
      amount: transaction.amount,
      notes: transaction.notes || '',
      paymentMethod: transaction.paymentMethod,
      isRecurring: !!transaction.isRecurring,
      frequency: transaction.isRecurring ? (transaction.frequency || 'monthly') : undefined,
      gigType: transaction.gigType,
      mood: transaction.mood,
      receiptUrl: transaction.receiptUrl,
      sharedWith: transaction.sharedWith || [],
      monetaryDetails: monetaryAmount,
      createdAt: Date.now()
    };

    // 1. Always save to localStorage first
    const localTxs = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
    localTxs.push(newTransaction);
    saveToLocal(LS_KEYS.TRANSACTIONS, localTxs);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const newTxPayload = {
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          notes: transaction.notes || '',
          amount: monetaryAmount,
          paymentMethodId: transaction.paymentMethod,
          isRecurring: !!transaction.isRecurring,
          frequency: transaction.isRecurring ? (transaction.frequency || 'monthly') : null,
          gigType: transaction.gigType || null,
          mood: transaction.mood || null,
          receiptUrl: transaction.receiptUrl || null,
          sharedWith: transaction.sharedWith || [],
          createdAt: Date.now()
        };

        const docRef = await getUserRef(uid).collection('transactions').add(newTxPayload);
        
        // Update local with Firebase ID
        newTransaction.id = docRef.id;
        const updatedLocalTxs = localTxs.map(t => t.id === localId ? newTransaction : t);
        saveToLocal(LS_KEYS.TRANSACTIONS, updatedLocalTxs);
        
        // Update Account Balance
        if (transaction.paymentMethod) {
          this._updateAccountBalance(uid, transaction.paymentMethod, transaction.amount, transaction.type === 'income');
        }
      } catch(e) {
        console.warn("Failed to save transaction to Firebase (saved locally)", e);
      }
    }

    return newTransaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const settings = await this.getSettings();
    
    // 1. Update in localStorage first
    const localTxs = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
    const updatedLocalTxs = localTxs.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    });
    saveToLocal(LS_KEYS.TRANSACTIONS, updatedLocalTxs);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      // Construct update payload
      const updatePayload: any = {};
      
      if (updates.type) updatePayload.type = updates.type;
      if (updates.category) updatePayload.category = updates.category;
      if (updates.description) updatePayload.description = updates.description;
      if (updates.date) updatePayload.date = updates.date;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes;
      if (updates.paymentMethod) updatePayload.paymentMethodId = updates.paymentMethod;
      if (updates.isRecurring !== undefined) updatePayload.isRecurring = updates.isRecurring;
      if (updates.frequency) updatePayload.frequency = updates.frequency;
      if (updates.gigType) updatePayload.gigType = updates.gigType;
      if (updates.mood) updatePayload.mood = updates.mood;
      if (updates.receiptUrl) updatePayload.receiptUrl = updates.receiptUrl;
      if (updates.sharedWith) updatePayload.sharedWith = updates.sharedWith;
      
      // Update amount if provided
      if (updates.amount !== undefined) {
        const monetaryAmount: MonetaryAmount = {
          value: updates.amount,
          currency: settings.currency?.localCode || 'USD',
          exchangeRate: settings.currency?.rateToBase || 1,
          valueInBase: updates.amount * (settings.currency?.rateToBase || 1),
          baseCurrency: settings.currency?.baseCode || 'USD'
        };
        updatePayload.amount = monetaryAmount;
      }
      
      try {
        await getUserRef(uid).collection('transactions').doc(id).update(updatePayload);
      } catch(e) {
        console.warn("Update transaction in Firebase failed (saved locally)", e);
      }
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    // 1. Delete from localStorage first
    const localTxs = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
    const filteredTxs = localTxs.filter(t => t.id !== id);
    saveToLocal(LS_KEYS.TRANSACTIONS, filteredTxs);
    
    // 2. Try to delete from Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('transactions').doc(id).delete();
      } catch (e) { 
        console.warn("Delete transaction from Firebase failed (deleted locally)", e); 
      }
    }
  },

  // --- ACCOUNTS ---

  async getAccounts(): Promise<Account[]> {
    // 1. Get from localStorage first
    const localAccounts = getFromLocal<Account[]>(LS_KEYS.ACCOUNTS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('accounts').get();
        const firebaseAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
        saveToLocal(LS_KEYS.ACCOUNTS, firebaseAccounts);
        return firebaseAccounts;
      } catch (e) { 
        console.warn("Failed to fetch accounts from Firebase (using local)", e);
      }
    }
    
    return localAccounts;
  },

  async saveAccounts(accounts: Account[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.ACCOUNTS, accounts);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      accounts.forEach(acc => {
        const ref = getUserRef(uid).collection('accounts').doc(acc.id);
        batch.set(ref, { ...acc, updatedAt: Date.now() });
      });
      try {
        await batch.commit();
      } catch(e) { 
        console.warn("Save accounts to Firebase failed (saved locally)", e); 
      }
    }
  },

  async deleteAccount(accountId: string): Promise<void> {
    // 1. Get current accounts from localStorage, filter out the deleted one
    const currentAccounts = getFromLocal<Account[]>(LS_KEYS.ACCOUNTS, []);
    const updatedAccounts = currentAccounts.filter(a => a.id !== accountId);
    saveToLocal(LS_KEYS.ACCOUNTS, updatedAccounts);
    
    // 2. Delete from Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('accounts').doc(accountId).delete();
        console.log('[Storage] Account deleted from Firebase:', accountId);
      } catch(e) { 
        console.warn("Delete account from Firebase failed", e); 
      }
    }
  },

  async _updateAccountBalance(uid: string, accountId: string, amount: number, isIncome: boolean) {
    if (accountId === 'cash') return; 
    const accRef = getUserRef(uid).collection('accounts').doc(accountId);
    try {
      await db!.runTransaction(async (t) => {
        const doc = await t.get(accRef);
        if (!doc.exists) return;
        const data = doc.data() as Account;
        const newBalance = isIncome ? data.balance + amount : data.balance - amount;
        t.update(accRef, { balance: newBalance, updatedAt: Date.now() });
      });
    } catch(e) { console.warn("Balance update failed", e); }
  },

  // --- GOALS ---

  async getGoals(): Promise<Goal[]> {
    // 1. Get from localStorage first
    const localGoals = getFromLocal<Goal[]>(LS_KEYS.GOALS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('goals').get();
        const firebaseGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
        saveToLocal(LS_KEYS.GOALS, firebaseGoals);
        return firebaseGoals;
      } catch(e) { 
        console.warn("Failed to fetch goals from Firebase (using local)", e);
      }
    }
    
    return localGoals;
  },

  async saveGoals(goals: Goal[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.GOALS, goals);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      goals.forEach(g => {
        const ref = getUserRef(uid).collection('goals').doc(g.id);
        batch.set(ref, g);
      });
      try {
        await batch.commit();
      } catch(e) { 
        console.warn("Save goals to Firebase failed (saved locally)", e); 
      }
    }
  },

  async deleteGoal(id: string): Promise<void> {
    // 1. Delete from localStorage first
    const localGoals = getFromLocal<Goal[]>(LS_KEYS.GOALS, []);
    const filteredGoals = localGoals.filter(g => g.id !== id);
    saveToLocal(LS_KEYS.GOALS, filteredGoals);
    
    // 2. Try to delete from Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('goals').doc(id).delete();
      } catch(e) { 
        console.warn("Delete goal from Firebase failed (deleted locally)", e); 
      }
    }
  },

  // --- SETTINGS ---

  async getSettings(): Promise<AppSettings> {
    // 1. Always try to get from localStorage first (fast)
    const localSettings = getFromLocal<AppSettings | null>(LS_KEYS.SETTINGS, null);
    
    // 2. If online and authenticated, try to sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const doc = await getUserRef(uid).collection('settings').doc('config').get();
        if (doc.exists) {
          const data = doc.data() as Partial<AppSettings>;
          const mergedSettings: AppSettings = {
            theme: data.theme || DEFAULT_SETTINGS.theme,
            language: data.language || DEFAULT_SETTINGS.language,
            currency: { ...DEFAULT_SETTINGS.currency, ...data.currency },
            notifications: { ...DEFAULT_SETTINGS.notifications, ...data.notifications },
            aiConfig: { ...DEFAULT_SETTINGS.aiConfig, ...data.aiConfig },
          };
          // Save to local for offline use
          saveToLocal(LS_KEYS.SETTINGS, mergedSettings);
          return mergedSettings;
        }
      } catch(e) {
        console.warn("Failed to load settings from Firebase (using local/defaults)", e);
      }
    }
    
    // 3. Return local settings or defaults
    return localSettings || DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    // Always save to localStorage first
    saveToLocal(LS_KEYS.SETTINGS, settings);
    
    // Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('settings').doc('config').set(settings);
        this._logAudit(uid, 'settings_update');
      } catch(e) { 
        console.warn("Save settings to Firebase failed (saved locally)", e); 
      }
    }
  },

  // --- QUICK ACTIONS ---

  async getQuickActions(): Promise<QuickAction[]> {
    // 1. Get from localStorage first
    const localActions = getFromLocal<QuickAction[]>(LS_KEYS.QUICK_ACTIONS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('quick_actions').get();
        const firebaseActions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickAction));
        saveToLocal(LS_KEYS.QUICK_ACTIONS, firebaseActions);
        return firebaseActions;
      } catch(e) { 
        console.warn("Failed to fetch quick actions from Firebase (using local)", e);
      }
    }
    
    return localActions;
  },

  async saveQuickActions(actions: QuickAction[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.QUICK_ACTIONS, actions);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      actions.forEach(qa => {
        const ref = getUserRef(uid).collection('quick_actions').doc(qa.id);
        batch.set(ref, qa);
      });
      try {
        await batch.commit();
      } catch(e) { 
        console.warn("Save quick actions to Firebase failed (saved locally)", e); 
      }
    }
  },

  // --- SUBSCRIPTIONS ---

  async getSubscriptions(): Promise<Subscription[]> {
    // 1. Get from localStorage first
    const localSubs = getFromLocal<Subscription[]>(LS_KEYS.SUBSCRIPTIONS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('subscriptions').get();
        const firebaseSubs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            paymentMethod: data.autoPaymentAccount
          } as Subscription;
        });
        saveToLocal(LS_KEYS.SUBSCRIPTIONS, firebaseSubs);
        return firebaseSubs;
      } catch(e) { 
        console.warn("Failed to fetch subscriptions from Firebase (using local)", e);
      }
    }
    
    return localSubs;
  },

  async addSubscription(sub: Omit<Subscription, 'id'>): Promise<Subscription> {
    const localId = `local_sub_${Date.now()}`;
    const newSub: Subscription = { id: localId, ...sub };
    
    // 1. Save to localStorage first
    const localSubs = getFromLocal<Subscription[]>(LS_KEYS.SUBSCRIPTIONS, []);
    localSubs.push(newSub);
    saveToLocal(LS_KEYS.SUBSCRIPTIONS, localSubs);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const newSubPayload = {
        name: sub.name,
        amount: sub.amount,
        chargeDay: sub.chargeDay,
        frequency: sub.frequency,
        autoPaymentAccount: sub.paymentMethod,
        reminderDays: sub.reminderDays,
        category: sub.category,
        lastPaidDate: sub.lastPaidDate || null,
        isActive: true
      };
      
      try {
        const docRef = await getUserRef(uid).collection('subscriptions').add(newSubPayload);
        // Update local with Firebase ID
        const updatedSubs = localSubs.map(s => s.id === localId ? { ...s, id: docRef.id } : s);
        saveToLocal(LS_KEYS.SUBSCRIPTIONS, updatedSubs);
        return { id: docRef.id, ...sub };
      } catch(e) {
        console.warn("Add subscription to Firebase failed (saved locally)", e);
      }
    }
    
    return newSub;
  },

  async checkDueSubscriptions(): Promise<Subscription[]> {
    const subs = await this.getSubscriptions();
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthStr = today.toISOString().slice(0, 7); 

    return subs.filter(s => {
      if (s.frequency !== 'monthly') return false; 
      if (s.chargeDay > currentDay) return false;
      const lastPaid = s.lastPaidDate ? s.lastPaidDate.slice(0, 7) : '';
      return lastPaid !== currentMonthStr;
    });
  },

  async markSubscriptionPaid(id: string): Promise<void> {
    const paidDate = new Date().toISOString();
    
    // 1. Update localStorage first
    const localSubs = getFromLocal<Subscription[]>(LS_KEYS.SUBSCRIPTIONS, []);
    const updatedSubs = localSubs.map(s => s.id === id ? { ...s, lastPaidDate: paidDate } : s);
    saveToLocal(LS_KEYS.SUBSCRIPTIONS, updatedSubs);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('subscriptions').doc(id).update({
          lastPaidDate: paidDate
        });
      } catch(e) { 
        console.warn("Mark subscription paid in Firebase failed (updated locally)", e); 
      }
    }
  },

  // --- PROMOS ---
  
  async getPromos(): Promise<Promo[]> {
    // 1. Get from localStorage first
    const localPromos = getFromLocal<Promo[]>(LS_KEYS.PROMOS, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('promos').get();
        const firebasePromos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promo));
        saveToLocal(LS_KEYS.PROMOS, firebasePromos);
        return firebasePromos;
      } catch(e) { 
        console.warn("Failed to fetch promos from Firebase (using local)", e);
      }
    }
    
    return localPromos;
  },

  async savePromos(promos: Promo[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.PROMOS, promos);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      promos.forEach(p => {
        const ref = getUserRef(uid).collection('promos').doc(p.id);
        batch.set(ref, p);
      });
      try {
        await batch.commit();
      } catch(e) { 
        console.warn("Save promos to Firebase failed (saved locally)", e); 
      }
    }
  },

  // --- EXPORT ---

  async exportData(): Promise<void> {
    const txs = await this.getTransactions();
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Type,Category,Amount,Currency,Description,PaymentMethod\n"
      + txs.map(t => `${t.date},${t.type},${t.category},${t.amount},${t.monetaryDetails?.currency || ''},"${t.description}",${t.paymentMethod || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quanta_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const uid = getUserId();
    this._logAudit(uid, 'data_export');
  },

  // --- HELPERS ---

  async getCommonConcepts(type: 'income' | 'expense' | 'service'): Promise<string[]> {
    if (type === 'service') return ['Netflix', 'Spotify', 'Internet', 'Electricidad', 'Agua', 'Renta'];
    if (type === 'income') return ['Honorarios', 'Salario', 'Evento Privado', 'Clase', 'Bono'];
    return ['Supermercado', 'Delivery', 'Uber', 'Gasolina', 'Restaurante', 'Farmacia'];
  },

  // --- BUDGETS ---

  async getBudgets(): Promise<Budget[]> {
    // 1. Get from localStorage first
    const localBudgets = getFromLocal<Budget[]>(LS_KEYS.BUDGETS, []);

    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('budgets').get();
        const firebaseBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
        saveToLocal(LS_KEYS.BUDGETS, firebaseBudgets);
        return firebaseBudgets;
      } catch(e) {
        console.warn("Failed to fetch budgets from Firebase (using local)", e);
      }
    }

    return localBudgets;
  },

  async addBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const localId = `local_budget_${Date.now()}`;
    const newBudget: Budget = {
      id: localId,
      ...budget,
      isActive: budget.isActive !== undefined ? budget.isActive : true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 1. Save to localStorage first
    const localBudgets = getFromLocal<Budget[]>(LS_KEYS.BUDGETS, []);
    localBudgets.push(newBudget);
    saveToLocal(LS_KEYS.BUDGETS, localBudgets);

    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const budgetPayload = {
        userId: uid,
        category: budget.category,
        name: budget.name,
        limit: budget.limit,
        spent: budget.spent || 0,
        period: budget.period,
        color: budget.color || '',
        icon: budget.icon || '',
        isActive: newBudget.isActive,
        resetDay: budget.resetDay || 1,
        createdAt: newBudget.createdAt,
        updatedAt: newBudget.updatedAt,
      };

      try {
        const docRef = await getUserRef(uid).collection('budgets').add(budgetPayload);
        // Update local with Firebase ID
        const updatedBudgets = localBudgets.map(b => b.id === localId ? { ...b, id: docRef.id } : b);
        saveToLocal(LS_KEYS.BUDGETS, updatedBudgets);
        return { ...newBudget, id: docRef.id };
      } catch(e) {
        console.warn("Add budget to Firebase failed (saved locally)", e);
      }
    }

    return newBudget;
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    // 1. Update in localStorage first
    const localBudgets = getFromLocal<Budget[]>(LS_KEYS.BUDGETS, []);
    const updatedLocalBudgets = localBudgets.map(b => {
      if (b.id === id) {
        return { ...b, ...updates, updatedAt: Date.now() };
      }
      return b;
    });
    saveToLocal(LS_KEYS.BUDGETS, updatedLocalBudgets);

    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const updatePayload: any = {
        ...updates,
        updatedAt: Date.now(),
      };

      try {
        await getUserRef(uid).collection('budgets').doc(id).update(updatePayload);
      } catch(e) {
        console.warn("Update budget in Firebase failed (updated locally)", e);
      }
    }
  },

  async deleteBudget(id: string): Promise<void> {
    // 1. Delete from localStorage first
    const localBudgets = getFromLocal<Budget[]>(LS_KEYS.BUDGETS, []);
    const filteredBudgets = localBudgets.filter(b => b.id !== id);
    saveToLocal(LS_KEYS.BUDGETS, filteredBudgets);

    // 2. Try to delete from Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('budgets').doc(id).delete();
      } catch(e) {
        console.warn("Delete budget from Firebase failed (deleted locally)", e);
      }
    }
  },

  async saveBudgets(budgets: Budget[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.BUDGETS, budgets);

    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      budgets.forEach(b => {
        const ref = getUserRef(uid).collection('budgets').doc(b.id);
        batch.set(ref, { ...b, userId: uid, updatedAt: Date.now() });
      });
      try {
        await batch.commit();
      } catch(e) {
        console.warn("Save budgets to Firebase failed (saved locally)", e);
      }
    }
  },

  // --- CUSTOM CATEGORIES ---

  async getCategories(): Promise<CustomCategory[]> {
    // 1. Get from localStorage first
    const localCategories = getFromLocal<CustomCategory[]>(LS_KEYS.CATEGORIES, []);
    
    // 2. If online and authenticated, sync from Firebase
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const snapshot = await getUserRef(uid).collection('categories').orderBy('order').get();
        if (snapshot.empty) {
          const defaults = this.getDefaultCategories();
          saveToLocal(LS_KEYS.CATEGORIES, defaults);
          return defaults;
        }
        const firebaseCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomCategory));
        saveToLocal(LS_KEYS.CATEGORIES, firebaseCategories);
        return firebaseCategories;
      } catch(e) { 
        console.warn("Failed to fetch categories from Firebase (using local)", e);
      }
    }
    
    // Return local or defaults
    return localCategories.length > 0 ? localCategories : this.getDefaultCategories();
  },

  async saveCategories(categories: CustomCategory[]): Promise<void> {
    // 1. Always save to localStorage first
    saveToLocal(LS_KEYS.CATEGORIES, categories);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      const batch = db!.batch();
      categories.forEach((cat, index) => {
        const ref = getUserRef(uid).collection('categories').doc(cat.id);
        batch.set(ref, { ...cat, order: index });
      });
      try {
        await batch.commit();
      } catch(e) { 
        console.warn("Save categories to Firebase failed (saved locally)", e); 
      }
    }
  },

  async addCategory(category: Omit<CustomCategory, 'id'>): Promise<CustomCategory> {
    const localId = `local_cat_${Date.now()}`;
    const newCategory: CustomCategory = { id: localId, ...category };
    
    // 1. Save to localStorage first
    const localCategories = getFromLocal<CustomCategory[]>(LS_KEYS.CATEGORIES, []);
    localCategories.push(newCategory);
    saveToLocal(LS_KEYS.CATEGORIES, localCategories);
    
    // 2. Try to sync to Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        const docRef = await getUserRef(uid).collection('categories').add(category);
        // Update local with Firebase ID
        const updatedCategories = localCategories.map(c => c.id === localId ? { ...c, id: docRef.id } : c);
        saveToLocal(LS_KEYS.CATEGORIES, updatedCategories);
        return { id: docRef.id, ...category };
      } catch(e) {
        console.warn("Add category to Firebase failed (saved locally)", e);
      }
    }
    
    return newCategory;
  },

  async deleteCategory(id: string): Promise<void> {
    // 1. Delete from localStorage first
    const localCategories = getFromLocal<CustomCategory[]>(LS_KEYS.CATEGORIES, []);
    const filteredCategories = localCategories.filter(c => c.id !== id);
    saveToLocal(LS_KEYS.CATEGORIES, filteredCategories);
    
    // 2. Try to delete from Firebase if available
    if (canUseFirebase()) {
      const uid = getUserId();
      try {
        await getUserRef(uid).collection('categories').doc(id).delete();
      } catch(e) { 
        console.warn("Delete category from Firebase failed (deleted locally)", e); 
      }
    }
  },

  getDefaultCategories(): CustomCategory[] {
    return [
      // Expense Categories
      { id: 'express', key: 'Express', name: { es: 'Express', en: 'Express' }, icon: 'Zap', color: 'amber', type: 'expense', isDefault: true, order: 0 },
      { id: 'food', key: 'Food', name: { es: 'Alimentación', en: 'Food' }, icon: 'Utensils', color: 'orange', type: 'expense', isDefault: true, order: 1 },
      { id: 'transport', key: 'Transportation', name: { es: 'Transporte', en: 'Transportation' }, icon: 'Car', color: 'blue', type: 'expense', isDefault: true, order: 2 },
      { id: 'leisure', key: 'Leisure', name: { es: 'Ocio', en: 'Leisure' }, icon: 'Gamepad2', color: 'purple', type: 'expense', isDefault: true, order: 3 },
      { id: 'utilities', key: 'Utilities', name: { es: 'Servicios', en: 'Utilities' }, icon: 'Zap', color: 'amber', type: 'expense', isDefault: true, order: 4 },
      { id: 'subscriptions', key: 'Subscriptions', name: { es: 'Suscripciones', en: 'Subscriptions' }, icon: 'Tv', color: 'indigo', type: 'expense', isDefault: true, order: 5 },
      { id: 'health', key: 'Health', name: { es: 'Salud', en: 'Health' }, icon: 'Heart', color: 'rose', type: 'expense', isDefault: true, order: 6 },
      { id: 'housing', key: 'Housing', name: { es: 'Vivienda', en: 'Housing' }, icon: 'Home', color: 'teal', type: 'expense', isDefault: true, order: 7 },
      { id: 'shopping', key: 'Shopping', name: { es: 'Compras', en: 'Shopping' }, icon: 'ShoppingBag', color: 'pink', type: 'expense', isDefault: true, order: 8 },
      { id: 'education', key: 'Education', name: { es: 'Educación', en: 'Education' }, icon: 'GraduationCap', color: 'cyan', type: 'expense', isDefault: true, order: 9 },
      { id: 'other_expense', key: 'Other', name: { es: 'Otros', en: 'Other' }, icon: 'MoreHorizontal', color: 'slate', type: 'expense', isDefault: true, order: 10 },
      // Income Categories
      { id: 'salary', key: 'Salary', name: { es: 'Salario', en: 'Salary' }, icon: 'Briefcase', color: 'emerald', type: 'income', isDefault: true, order: 11 },
      { id: 'freelance', key: 'Freelance', name: { es: 'Freelance', en: 'Freelance' }, icon: 'Laptop', color: 'violet', type: 'income', isDefault: true, order: 12 },
      { id: 'investments', key: 'Investments', name: { es: 'Inversiones', en: 'Investments' }, icon: 'TrendingUp', color: 'lime', type: 'income', isDefault: true, order: 13 },
      { id: 'gifts', key: 'Gifts', name: { es: 'Regalos', en: 'Gifts' }, icon: 'Gift', color: 'fuchsia', type: 'income', isDefault: true, order: 14 },
      { id: 'other_income', key: 'OtherIncome', name: { es: 'Otros Ingresos', en: 'Other Income' }, icon: 'Coins', color: 'sky', type: 'income', isDefault: true, order: 15 },
    ];
  },

  // --- LOCAL STORAGE UTILITIES ---

  /**
   * Clear all local data (call on logout)
   */
  clearLocalData(): void {
    Object.values(LS_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key} from localStorage`, e);
      }
    });
  },

  /**
   * Check if app is online
   */
  isOnline(): boolean {
    return isOnline();
  },

  /**
   * Check if Firebase is available
   */
  isFirebaseAvailable(): boolean {
    return canUseFirebase();
  },

  /**
   * Force sync all local data to Firebase (if online)
   */
  async syncToCloud(): Promise<{ success: boolean; synced: string[]; failed: string[] }> {
    const synced: string[] = [];
    const failed: string[] = [];
    
    if (!canUseFirebase()) {
      return { success: false, synced, failed: ['Not authenticated or offline'] };
    }

    try {
      // Sync settings
      const settings = getFromLocal<AppSettings | null>(LS_KEYS.SETTINGS, null);
      if (settings) {
        await this.saveSettings(settings);
        synced.push('settings');
      }

      // Sync transactions
      const transactions = getFromLocal<Transaction[]>(LS_KEYS.TRANSACTIONS, []);
      if (transactions.length > 0) {
        const uid = getUserId();
        const batch = db!.batch();
        transactions.forEach(tx => {
          if (!tx.id.startsWith('local_')) {
            const ref = getUserRef(uid).collection('transactions').doc(tx.id);
            batch.set(ref, tx);
          }
        });
        await batch.commit();
        synced.push('transactions');
      }

      // Sync accounts
      const accounts = getFromLocal<Account[]>(LS_KEYS.ACCOUNTS, []);
      if (accounts.length > 0) {
        await this.saveAccounts(accounts);
        synced.push('accounts');
      }

      // Sync goals
      const goals = getFromLocal<Goal[]>(LS_KEYS.GOALS, []);
      if (goals.length > 0) {
        await this.saveGoals(goals);
        synced.push('goals');
      }

      // Sync quick actions
      const quickActions = getFromLocal<QuickAction[]>(LS_KEYS.QUICK_ACTIONS, []);
      if (quickActions.length > 0) {
        await this.saveQuickActions(quickActions);
        synced.push('quick_actions');
      }

      // Sync promos
      const promos = getFromLocal<Promo[]>(LS_KEYS.PROMOS, []);
      if (promos.length > 0) {
        await this.savePromos(promos);
        synced.push('promos');
      }

      // Sync budgets
      const budgets = getFromLocal<Budget[]>(LS_KEYS.BUDGETS, []);
      if (budgets.length > 0) {
        await this.saveBudgets(budgets);
        synced.push('budgets');
      }

      // Sync categories
      const categories = getFromLocal<CustomCategory[]>(LS_KEYS.CATEGORIES, []);
      if (categories.length > 0) {
        await this.saveCategories(categories);
        synced.push('categories');
      }

      // Update last sync timestamp
      saveToLocal(LS_KEYS.LAST_SYNC, Date.now());

      return { success: true, synced, failed };
    } catch (e) {
      console.error('Sync to cloud failed', e);
      failed.push('sync_error');
      return { success: false, synced, failed };
    }
  },

  /**
   * Get last sync timestamp
   */
  getLastSyncTime(): number | null {
    return getFromLocal<number | null>(LS_KEYS.LAST_SYNC, null);
  },

  // --- AUDIT LOGGING ---
  
  async _logAudit(uid: string, event: AuditLog['event']) {
    try {
      // Don't log if offline or blocked to prevent noise
      if (!navigator.onLine) return;
      
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => ({ json: () => ({ ip: 'unknown' }) }));
      const { ip } = await ipResponse.json();

      const log: Omit<AuditLog, 'id'> = {
        userId: uid,
        event,
        timestamp: Date.now(),
        ipAddress: ip,
        userAgent: navigator.userAgent,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        platform: navigator.platform,
        appVersion: '1.0.0'
      };
      
      await getUserRef(uid).collection('audit_logs').add(log);
    } catch (e) {
      console.warn("Audit log failed (Permissions?)", e);
    }
  },

  // --- NOTIFICATIONS (Firestore) ---
  
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<any[]> {
    try {
      if (!canUseFirebase()) {
        return getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      }
      
      const uid = getUserId();
      const snapshot = await getUserRef(uid)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      // Cache locally
      saveToLocal(`${LS_PREFIX}notifications`, notifications);
      
      return notifications;
    } catch (e) {
      console.error('Error getting notifications:', e);
      return getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
    }
  },

  /**
   * Save a new notification
   */
  async saveNotification(notification: any): Promise<string | null> {
    try {
      // Always save locally first
      const localNotifs = getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      localNotifs.unshift(notification);
      if (localNotifs.length > 100) localNotifs.splice(100);
      saveToLocal(`${LS_PREFIX}notifications`, localNotifs);
      
      if (!canUseFirebase()) {
        return notification.id;
      }
      
      const uid = getUserId();
      const docRef = await getUserRef(uid)
        .collection('notifications')
        .doc(notification.id)
        .set({
          ...notification,
          createdAt: firebase.firestore.Timestamp.fromDate(new Date(notification.createdAt))
        });
      
      return notification.id;
    } catch (e) {
      console.error('Error saving notification:', e);
      return notification.id; // Return ID anyway since saved locally
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Update local
      const localNotifs = getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      const idx = localNotifs.findIndex(n => n.id === notificationId);
      if (idx !== -1) {
        localNotifs[idx].read = true;
        saveToLocal(`${LS_PREFIX}notifications`, localNotifs);
      }
      
      if (!canUseFirebase()) return;
      
      const uid = getUserId();
      await getUserRef(uid)
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      // Update local
      const localNotifs = getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      localNotifs.forEach(n => { n.read = true; });
      saveToLocal(`${LS_PREFIX}notifications`, localNotifs);
      
      if (!canUseFirebase()) return;
      
      const uid = getUserId();
      const batch = db!.batch();
      const snapshot = await getUserRef(uid)
        .collection('notifications')
        .where('read', '==', false)
        .get();
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Remove from local
      let localNotifs = getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      localNotifs = localNotifs.filter(n => n.id !== notificationId);
      saveToLocal(`${LS_PREFIX}notifications`, localNotifs);
      
      if (!canUseFirebase()) return;
      
      const uid = getUserId();
      await getUserRef(uid)
        .collection('notifications')
        .doc(notificationId)
        .delete();
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  },

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      // Clear local
      saveToLocal(`${LS_PREFIX}notifications`, []);
      
      if (!canUseFirebase()) return;
      
      const uid = getUserId();
      const batch = db!.batch();
      const snapshot = await getUserRef(uid)
        .collection('notifications')
        .get();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (e) {
      console.error('Error deleting all notifications:', e);
    }
  },

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Clean local
      let localNotifs = getFromLocal<any[]>(`${LS_PREFIX}notifications`, []);
      const originalLength = localNotifs.length;
      localNotifs = localNotifs.filter(n => new Date(n.createdAt) > thirtyDaysAgo);
      const localDeleted = originalLength - localNotifs.length;
      saveToLocal(`${LS_PREFIX}notifications`, localNotifs);
      
      if (!canUseFirebase()) return localDeleted;
      
      const uid = getUserId();
      const snapshot = await getUserRef(uid)
        .collection('notifications')
        .where('createdAt', '<', firebase.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      
      if (snapshot.empty) return localDeleted;
      
      const batch = db!.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return snapshot.size + localDeleted;
    } catch (e) {
      console.error('Error cleaning up old notifications:', e);
      return 0;
    }
  }
};
