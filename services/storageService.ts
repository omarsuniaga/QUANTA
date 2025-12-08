import { 
  Transaction, User, Goal, Subscription, AppSettings, QuickAction, Account, Promo, AuditLog, MonetaryAmount 
} from '../types';
import { auth, db } from '../firebaseConfig';
import firebase from 'firebase/compat/app';

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
      await getUserRef(uid).update({ lastLoginAt: Date.now() });
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
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('transactions').get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Flatten "amount" object back to number for UI
        const amountVal = typeof data.amount === 'object' ? data.amount.value : data.amount;
        
        return { 
          id: doc.id,
          ...data,
          amount: amountVal,
          monetaryDetails: typeof data.amount === 'object' ? data.amount : undefined,
          paymentMethod: data.paymentMethodId, // Map back for UI
          description: data.description || '' 
        } as Transaction;
      });
    } catch(e) { 
        console.warn("Failed to fetch transactions", e);
        return []; 
    }
  },

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const uid = getUserId();
    const settings = await this.getSettings(); 
    
    // Construct Monetary Structure (The "amount" object in Firestore)
    const monetaryAmount: MonetaryAmount = {
      value: transaction.amount,
      currency: settings.currency?.localCode || 'USD',
      exchangeRate: settings.currency?.rateToBase || 1,
      valueInBase: transaction.amount * (settings.currency?.rateToBase || 1),
      baseCurrency: settings.currency?.baseCode || 'USD'
    };

    // Construct Payload matching Schema
    // Ensure recurring fields are explicitly handled
    const newTxPayload = {
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      notes: transaction.notes || '',
      
      amount: monetaryAmount, // Stored as Object

      paymentMethodId: transaction.paymentMethod, // Stored as ID
      isRecurring: !!transaction.isRecurring, // Ensure boolean
      frequency: transaction.isRecurring ? (transaction.frequency || 'monthly') : null, // Default to monthly if missing but recurring
      gigType: transaction.gigType || null,
      mood: transaction.mood || null,
      receiptUrl: transaction.receiptUrl || null,
      sharedWith: transaction.sharedWith || [],
      
      createdAt: Date.now()
    };

    const docRef = await getUserRef(uid).collection('transactions').add(newTxPayload);
    
    // Update Account Balance
    if (transaction.paymentMethod) {
      this._updateAccountBalance(uid, transaction.paymentMethod, transaction.amount, transaction.type === 'income');
    }

    // Return internal structure
    return { 
      id: docRef.id, 
      ...transaction, 
      monetaryDetails: monetaryAmount,
      isRecurring: newTxPayload.isRecurring,
      frequency: newTxPayload.frequency,
      createdAt: newTxPayload.createdAt 
    };
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const uid = getUserId();
    const settings = await this.getSettings();
    
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
    
    // Update amount if provided (convert to MonetaryAmount structure)
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
      console.warn("Update transaction failed", e);
      throw e;
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const uid = getUserId();
    try {
      await getUserRef(uid).collection('transactions').doc(id).delete();
    } catch (e) { console.warn("Delete transaction failed", e); }
  },

  // --- ACCOUNTS ---

  async getAccounts(): Promise<Account[]> {
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('accounts').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    } catch (e) { return []; }
  },

  async saveAccounts(accounts: Account[]): Promise<void> {
    const uid = getUserId();
    const batch = db!.batch();
    accounts.forEach(acc => {
      const ref = getUserRef(uid).collection('accounts').doc(acc.id);
      batch.set(ref, { ...acc, updatedAt: Date.now() });
    });
    try {
      await batch.commit();
    } catch(e) { console.warn("Save accounts failed", e); }
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
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('goals').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    } catch(e) { return []; }
  },

  async saveGoals(goals: Goal[]): Promise<void> {
    const uid = getUserId();
    const batch = db!.batch();
    goals.forEach(g => {
      const ref = getUserRef(uid).collection('goals').doc(g.id);
      batch.set(ref, g);
    });
    try {
      await batch.commit();
    } catch(e) { console.warn("Save goals failed", e); }
  },

  async deleteGoal(id: string): Promise<void> {
    const uid = getUserId();
    try {
      await getUserRef(uid).collection('goals').doc(id).delete();
    } catch(e) { console.warn("Delete goal failed", e); }
  },

  // --- SETTINGS ---

  async getSettings(): Promise<AppSettings> {
    const uid = getUserId();
    try {
      const doc = await getUserRef(uid).collection('settings').doc('config').get();
      if (doc.exists) {
        const data = doc.data() as Partial<AppSettings>;
        // Deep merge with defaults to prevent null property access errors
        return {
          theme: data.theme || DEFAULT_SETTINGS.theme,
          language: data.language || DEFAULT_SETTINGS.language,
          currency: { ...DEFAULT_SETTINGS.currency, ...data.currency },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...data.notifications },
          aiConfig: { ...DEFAULT_SETTINGS.aiConfig, ...data.aiConfig },
        };
      }
    } catch(e) {
      console.warn("Failed to load settings (using defaults)", e);
    }
    
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const uid = getUserId();
    try {
      await getUserRef(uid).collection('settings').doc('config').set(settings);
      this._logAudit(uid, 'settings_update');
    } catch(e) { console.warn("Save settings failed", e); }
  },

  // --- QUICK ACTIONS ---

  async getQuickActions(): Promise<QuickAction[]> {
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('quick_actions').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickAction));
    } catch(e) { return []; }
  },

  async saveQuickActions(actions: QuickAction[]): Promise<void> {
    const uid = getUserId();
    const batch = db!.batch();
    actions.forEach(qa => {
      const ref = getUserRef(uid).collection('quick_actions').doc(qa.id);
      batch.set(ref, qa);
    });
    try {
      await batch.commit();
    } catch(e) { console.warn("Save actions failed", e); }
  },

  // --- SUBSCRIPTIONS ---

  async getSubscriptions(): Promise<Subscription[]> {
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('subscriptions').get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          paymentMethod: data.autoPaymentAccount // Map back for UI
        } as Subscription;
      });
    } catch(e) { return []; }
  },

  async addSubscription(sub: Omit<Subscription, 'id'>): Promise<Subscription> {
    const uid = getUserId();
    const newSubPayload = {
      name: sub.name,
      amount: sub.amount, // Schema allows number here
      chargeDay: sub.chargeDay,
      frequency: sub.frequency,
      autoPaymentAccount: sub.paymentMethod, // Map to schema field
      reminderDays: sub.reminderDays,
      category: sub.category,
      lastPaidDate: sub.lastPaidDate || null,
      isActive: true
    };
    
    const docRef = await getUserRef(uid).collection('subscriptions').add(newSubPayload);
    return { id: docRef.id, ...sub };
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
    const uid = getUserId();
    try {
      await getUserRef(uid).collection('subscriptions').doc(id).update({
        lastPaidDate: new Date().toISOString()
      });
    } catch(e) { console.warn("Mark paid failed", e); }
  },

  // --- PROMOS ---
  
  async getPromos(): Promise<Promo[]> {
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('promos').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promo));
    } catch(e) { return []; }
  },

  async savePromos(promos: Promo[]): Promise<void> {
    const uid = getUserId();
    const batch = db!.batch();
    promos.forEach(p => {
      const ref = getUserRef(uid).collection('promos').doc(p.id);
      batch.set(ref, p);
    });
    try {
      await batch.commit();
    } catch(e) { console.warn("Save promos failed", e); }
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

  async getBudgets(): Promise<any[]> {
    const uid = getUserId();
    try {
      const snapshot = await getUserRef(uid).collection('budgets').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch(e) { return []; }
  },

  async saveBudgets(budgets: any[]): Promise<void> {
    const uid = getUserId();
    const batch = db!.batch();
    budgets.forEach(b => {
      const ref = getUserRef(uid).collection('budgets').doc(b.category);
      batch.set(ref, b);
    });
    try {
      await batch.commit();
    } catch(e) { console.warn("Save budgets failed", e); }
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
  }
};