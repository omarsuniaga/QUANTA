import { 
  ExpenseFixedTemplate, 
  ExpenseMonthlyDocument, 
  ExpenseMonthlyItem, 
  ExpenseStatus,
  Transaction 
} from '../types';
import { auth, db } from '../firebaseConfig';
import { storageService } from './storageService';

const LS_PREFIX = 'quanta_';
const LS_KEYS = {
  EXPENSE_TEMPLATES: `${LS_PREFIX}expense_templates`,
  EXPENSE_MONTHLY: `${LS_PREFIX}expense_monthly_`,
};

// Safe localStorage helpers
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

const saveToLocal = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage`, e);
  }
};

const getUserId = () => {
  const user = auth?.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

const getUserRef = (uid: string) => db!.collection('users').doc(uid);

export const expenseService = {
  
  // ==========================================
  // MONTHLY ORCHESTRATION
  // ==========================================

  /**
   * Initializes the expense document for a specific month (YYYY-MM).
   * Loads active templates and creates pending items.
   * @param period - YYYY-MM format
   * @param templatesFromCache - Optional: pre-loaded templates from localStorage to avoid Firestore latency
   */
  async initializeMonth(period: string, templatesFromCache?: ExpenseFixedTemplate[]): Promise<ExpenseMonthlyDocument> {
    const uid = getUserId();
    const docId = period;
    
    // 1. Try Local
    const localDoc = getFromLocal<ExpenseMonthlyDocument | null>(`${LS_KEYS.EXPENSE_MONTHLY}${period}`, null);
    
    // 2. Try Cloud
    if (db && navigator.onLine) {
      try {
        const docRef = getUserRef(uid).collection('expense_monthly').doc(docId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data() as ExpenseMonthlyDocument;
          saveToLocal(`${LS_KEYS.EXPENSE_MONTHLY}${period}`, data);
          return data;
        }
      } catch (e) {
        console.warn("Error fetching monthly expense doc", e);
      }
    } else if (localDoc) {
      return localDoc;
    }

    // 3. Create New - Use provided templates or fetch
    const templates = templatesFromCache || await this.getFixedTemplates();
    const activeTemplates = templates.filter(t => t.active);
    
    console.log('[expenseService] Creating new monthly doc', {
      period,
      templatesSource: templatesFromCache ? 'PROVIDED_CACHE' : 'FETCHED',
      totalTemplates: templates.length,
      activeTemplates: activeTemplates.length,
      templateIds: activeTemplates.map(t => t.id)
    });
    
    const newDoc: ExpenseMonthlyDocument = {
      period,
      fixedItems: activeTemplates.map(t => ({
        id: db?.collection('_').doc().id || Math.random().toString(36).substr(2, 9),
        templateId: t.id,
        nameSnapshot: t.name,
        amount: t.defaultAmount,
        category: t.category,
        status: 'pending'
      })),
      initializedAt: Date.now()
    };
    
    await this.saveMonthlyDoc(newDoc);
    return newDoc;
  },

  async getMonthlyExpenses(period: string): Promise<ExpenseMonthlyDocument> {
    return this.initializeMonth(period);
  },

  // ==========================================
  // ITEM ACTIONS (PAY / SKIP / UNDO)
  // ==========================================

  /**
   * Marks a fixed item as PAID and creates a REAL transaction.
   * This ensures compatibility with Budgets.
   */
  async payFixedItem(period: string, itemId: string, actualAmount?: number): Promise<void> {
    const doc = await this.getMonthlyExpenses(period);
    const item = doc.fixedItems.find(i => i.id === itemId);
    if (!item) throw new Error("Item not found");

    const template = (await this.getFixedTemplates()).find(t => t.id === item.templateId);
    
    // 1. Create Real Transaction
    const amountToPay = actualAmount ?? item.amount;
    const now = new Date();
    
    // Construct date string safely for current month if period matches
    // But usually we just use 'now' if paying today. 
    // If paying for a past month, we might want to use the last day of that month?
    // For now, payment date = NOW.
    
    const newTx: Omit<Transaction, 'id' | 'createdAt'> = {
      amount: amountToPay,
      type: 'expense',
      category: item.category,
      description: item.nameSnapshot,
      date: now.toISOString(),
      isRecurring: true, 
      source: 'recurring',
      recurringTemplateId: item.templateId,
      recurringMonthlyItemId: item.id,
      period: period,
      status: 'active',
      paymentMethod: 'cash' // Default, user can change later if we add UI for it
    };

    const txId = await storageService.addTransaction(newTx as Transaction); // storageService handles ID generation internally

    // 2. Update Monthly Item
    item.status = 'paid';
    item.amount = amountToPay; // Update snapshot to actual paid amount
    item.paymentDate = Date.now();
    item.transactionId = txId;

    await this.saveMonthlyDoc(doc);
  },

  /**
   * Undoes the payment: Voids the transaction and resets item to pending.
   */
  async undoPayFixedItem(period: string, itemId: string): Promise<void> {
    const doc = await this.getMonthlyExpenses(period);
    const item = doc.fixedItems.find(i => i.id === itemId);
    if (!item || !item.transactionId) return;

    // 1. Delete/Void Real Transaction
    await storageService.deleteTransaction(item.transactionId);

    // 2. Reset Item
    item.status = 'pending';
    item.paymentDate = undefined;
    item.transactionId = undefined;

    await this.saveMonthlyDoc(doc);
  },

  /**
   * Skips the payment for this month. No transaction created.
   */
  async skipFixedItem(period: string, itemId: string): Promise<void> {
    const doc = await this.getMonthlyExpenses(period);
    const item = doc.fixedItems.find(i => i.id === itemId);
    if (!item) return;

    item.status = 'skipped';
    await this.saveMonthlyDoc(doc);
  },

  // ==========================================
  // TEMPLATES CRUD
  // ==========================================

  async getFixedTemplates(): Promise<ExpenseFixedTemplate[]> {
    const uid = getUserId();
    const local = getFromLocal<ExpenseFixedTemplate[]>(LS_KEYS.EXPENSE_TEMPLATES, []);
    
    if (db && navigator.onLine) {
      try {
        const snap = await getUserRef(uid).collection('expense_fixed_templates').get();
        if (!snap.empty) {
          const remote = snap.docs.map(d => d.data() as ExpenseFixedTemplate);
          saveToLocal(LS_KEYS.EXPENSE_TEMPLATES, remote);
          return remote;
        }
      } catch (e) { console.warn(e); }
    }
    return local;
  },

  async saveFixedTemplate(template: ExpenseFixedTemplate): Promise<void> {
    const uid = getUserId();
    const templates = await this.getFixedTemplates();
    
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) templates[index] = template;
    else templates.push(template);
    
    saveToLocal(LS_KEYS.EXPENSE_TEMPLATES, templates);
    
    if (db && navigator.onLine) {
      await getUserRef(uid).collection('expense_fixed_templates').doc(template.id).set(template);
    }
  },

  async deleteFixedTemplate(templateId: string): Promise<void> {
    const uid = getUserId();
    
    // Force read from localStorage
    const templatesRaw = localStorage.getItem(LS_KEYS.EXPENSE_TEMPLATES);
    const templates: ExpenseFixedTemplate[] = templatesRaw ? JSON.parse(templatesRaw) : [];
    
    console.log('[deleteFixedTemplate] Before deletion:', {
      count: templates.length,
      templateIds: templates.map(t => t.id),
      deletingId: templateId
    });
    
    const filtered = templates.filter(t => t.id !== templateId);
    
    console.log('[deleteFixedTemplate] After deletion:', {
      count: filtered.length,
      templateIds: filtered.map(t => t.id)
    });
    
    saveToLocal(LS_KEYS.EXPENSE_TEMPLATES, filtered);
    
    if (db && navigator.onLine) {
      try {
        await getUserRef(uid).collection('expense_fixed_templates').doc(templateId).delete();
      } catch (error) {
        console.warn('[deleteFixedTemplate] Firestore delete failed (template might not exist in cloud):', error);
        // Don't throw - localStorage delete succeeded
      }
    }
  },

  async updateFixedTemplate(templateId: string, updates: Partial<ExpenseFixedTemplate>): Promise<void> {
    const uid = getUserId();
    
    // Force read from localStorage to avoid race conditions
    const templatesRaw = localStorage.getItem(LS_KEYS.EXPENSE_TEMPLATES);
    const templates: ExpenseFixedTemplate[] = templatesRaw ? JSON.parse(templatesRaw) : [];
    
    console.log('[updateFixedTemplate] Templates from localStorage:', {
      count: templates.length,
      templateIds: templates.map(t => t.id),
      searchingFor: templateId
    });
    
    const index = templates.findIndex(t => t.id === templateId);
    if (index < 0) {
      console.error('[updateFixedTemplate] Template not found!', { templateId, availableIds: templates.map(t => t.id) });
      throw new Error('Template not found');
    }
    
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    console.log('[updateFixedTemplate] Updated template:', templates[index]);
    
    saveToLocal(LS_KEYS.EXPENSE_TEMPLATES, templates);
    
    if (db && navigator.onLine) {
      try {
        await getUserRef(uid).collection('expense_fixed_templates').doc(templateId).update({
          ...updates,
          updatedAt: Date.now()
        });
      } catch (error) {
        console.warn('[updateFixedTemplate] Firestore update failed (template might not exist yet in cloud):', error);
        // Don't throw - localStorage update succeeded
      }
    }
  },

  // ==========================================
  // HELPERS
  // ==========================================

  async saveMonthlyDoc(doc: ExpenseMonthlyDocument): Promise<void> {
    const uid = getUserId();
    saveToLocal(`${LS_KEYS.EXPENSE_MONTHLY}${doc.period}`, doc);
    
    if (db && navigator.onLine) {
      try {
        await getUserRef(uid).collection('expense_monthly').doc(doc.period).set(doc);
      } catch (e) {
        console.error("Error saving monthly expense doc", e);
      }
    }
  },

  async migrateLegacyData(): Promise<void> {
    // Similar to income migration but adapting for expenses
    const transactions = await storageService.getTransactions();
    const expenseTxs = transactions.filter(t => t.type === 'expense' && t.isRecurring);
    
    const uniqueTemplateNames = new Set(expenseTxs.map(t => t.description.toLowerCase().trim()));

    for (const name of uniqueTemplateNames) {
      const sample = expenseTxs.find(t => t.description.toLowerCase().trim() === name);
      if (!sample) continue;

      const templates = await this.getFixedTemplates();
      if (!templates.some(t => t.name.toLowerCase().trim() === name)) {
        const newTemplate: ExpenseFixedTemplate = {
          id: db?.collection('_').doc().id || Math.random().toString(36).substr(2, 9),
          name: sample.description,
          defaultAmount: sample.amount,
          category: sample.category, 
          active: true,
          frequency: 'monthly',
          dayOfMonth: new Date(sample.date).getDate(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await this.saveFixedTemplate(newTemplate);
      }
    }
  }
};
