import { 
  IncomeFixedTemplate, 
  IncomeMonthlyDocument, 
  IncomeFixedItem, 
  IncomeExtraItem, 
  FixedIncomeStatus,
  Transaction 
} from '../types';
import { auth, db } from '../firebaseConfig';
import { storageService } from './storageService';

const LS_PREFIX = 'quanta_';
const LS_KEYS = {
  INCOME_TEMPLATES: `${LS_PREFIX}income_templates`,
  INCOME_MONTHLY: `${LS_PREFIX}income_monthly_`, // prefix for monthly docs
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

const getUserId = () => {
  const user = auth?.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

const getUserRef = (uid: string) => db!.collection('users').doc(uid);

export const incomeService = {
  
  /**
   * Initializes the income document for a specific month (YYYY-MM).
   * If it exists, returns it.
   * If not, creates it from active templates.
   */
  async initializeMonth(period: string): Promise<IncomeMonthlyDocument> {
    const uid = getUserId();
    const docId = period; // Document ID is the period string "YYYY-MM"
    
    // 1. Try to load from local first (fast path)
    const localDoc = getFromLocal<IncomeMonthlyDocument | null>(`${LS_KEYS.INCOME_MONTHLY}${period}`, null);
    
    // 2. Fetch from Firestore if possible
    if (db && navigator.onLine) {
      try {
        const docRef = getUserRef(uid).collection('income_monthly').doc(docId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data() as IncomeMonthlyDocument;
          saveToLocal(`${LS_KEYS.INCOME_MONTHLY}${period}`, data);
          return data;
        }
      } catch (e) {
        console.warn("Error fetching monthly income doc", e);
      }
    } else if (localDoc) {
      return localDoc;
    }

    // 3. If neither exists, Create New
    const templates = await this.getFixedTemplates();
    const activeTemplates = templates.filter(t => t.active);
    
    const newDoc: IncomeMonthlyDocument = {
      period,
      fixedItems: activeTemplates.map(t => ({
        id: db!.collection('_').doc().id, // Generate unique ID
        templateId: t.id,
        nameSnapshot: t.name,
        amount: t.defaultAmount,
        status: 'pending',
        receivedAt: null
      })),
      extras: [],
      initializedFromTemplatesAt: Date.now()
    };
    
    // Save to Firestore
    if (db && navigator.onLine) {
      try {
        await getUserRef(uid).collection('income_monthly').doc(docId).set(newDoc);
      } catch (e) {
        console.error("Failed to save new monthly income doc", e);
      }
    }
    
    // Save to Local
    saveToLocal(`${LS_KEYS.INCOME_MONTHLY}${period}`, newDoc);
    
    return newDoc;
  },

  /**
   * Retrieves specific monthly data.
   * Implicitly initializes if missing.
   */
  async getMonthlyIncome(period: string): Promise<IncomeMonthlyDocument> {
    return this.initializeMonth(period);
  },
  
  /**
   * Loads fixed income templates.
   */
  async getFixedTemplates(): Promise<IncomeFixedTemplate[]> {
    const uid = getUserId();
    
    // Local
    const local = getFromLocal<IncomeFixedTemplate[]>(LS_KEYS.INCOME_TEMPLATES, []);
    
    // Cloud
    if (db && navigator.onLine) {
      try {
        const snap = await getUserRef(uid).collection('income_fixed_templates').get();
        if (!snap.empty) {
          const remote = snap.docs.map(d => d.data() as IncomeFixedTemplate);
          saveToLocal(LS_KEYS.INCOME_TEMPLATES, remote);
          return remote;
        }
      } catch (e) {
        console.warn("Error fetching templates", e);
      }
    }
    
    return local;
  },

  /**
   * Creates or Updates a template.
   */
  async saveFixedTemplate(template: IncomeFixedTemplate): Promise<void> {
    const uid = getUserId();
    
    // Update Local
    const templates = await this.getFixedTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    saveToLocal(LS_KEYS.INCOME_TEMPLATES, templates);
    
    // Update Cloud
    if (db && navigator.onLine) {
      await getUserRef(uid).collection('income_fixed_templates').doc(template.id).set(template);
    }
  },

  /**
   * Toggles the status of a fixed item in a specific month.
   */
  async toggleFixedIncomeStatus(period: string, itemId: string, status: FixedIncomeStatus): Promise<void> {
    const doc = await this.getMonthlyIncome(period);
    const itemIndex = doc.fixedItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = doc.fixedItems[itemIndex];
    item.status = status;
    item.receivedAt = status === 'received' ? Date.now() : null;
    
    await this.saveMonthlyDoc(doc);
  },

  /**
   * Updates the amount of a fixed item for that month.
   * Optionally updates the template default.
   */
  async updateFixedIncomeAmount(period: string, itemId: string, amount: number, options?: { saveAsDefault?: boolean }): Promise<void> {
    const doc = await this.getMonthlyIncome(period);
    const item = doc.fixedItems.find(i => i.id === itemId);
    if (!item) return;
    
    item.amount = amount;
    
    await this.saveMonthlyDoc(doc);
    
    if (options?.saveAsDefault) {
      const templates = await this.getFixedTemplates();
      const template = templates.find(t => t.id === item.templateId);
      if (template) {
        template.defaultAmount = amount;
        template.updatedAt = Date.now();
        await this.saveFixedTemplate(template);
      }
    }
  },

  /**
   * Adds an extra income to a specific month.
   */
  async addExtraIncome(period: string, item: Omit<IncomeExtraItem, 'id' | 'createdAt'>): Promise<void> {
    const doc = await this.getMonthlyIncome(period);
    
    const newItem: IncomeExtraItem = {
      id: db!.collection('_').doc().id,
      ...item,
      createdAt: Date.now()
    };
    
    doc.extras.push(newItem);
    await this.saveMonthlyDoc(doc);
  },

  /**
   * Edits an extra income.
   */
  async editExtraIncome(period: string, itemId: string, patch: Partial<IncomeExtraItem>): Promise<void> {
    const doc = await this.getMonthlyIncome(period);
    const index = doc.extras.findIndex(e => e.id === itemId);
    if (index === -1) return;
    
    doc.extras[index] = { ...doc.extras[index], ...patch };
    await this.saveMonthlyDoc(doc);
  },

  /**
   * Deletes an extra income.
   */
  async deleteExtraIncome(period: string, itemId: string): Promise<void> {
    const doc = await this.getMonthlyIncome(period);
    doc.extras = doc.extras.filter(e => e.id !== itemId);
    await this.saveMonthlyDoc(doc);
  },

  /**
   * Helper to save the monthly document.
   */
  async saveMonthlyDoc(doc: IncomeMonthlyDocument): Promise<void> {
    const uid = getUserId();
    
    // Local
    saveToLocal(`${LS_KEYS.INCOME_MONTHLY}${doc.period}`, doc);
    
    // Cloud
    if (db && navigator.onLine) {
      try {
        await getUserRef(uid).collection('income_monthly').doc(doc.period).set(doc);
      } catch (e) {
        console.error("Error saving monthly doc", e);
      }
    }
  },

  /**
   * ONE-TIME MIGRATION
   * Migrates legacy transactions to the new system.
   */
  async migrateLegacyData(): Promise<void> {
    const transactions = await storageService.getTransactions();
    const incomeTxs = transactions.filter(t => t.type === 'income');
    
    if (incomeTxs.length === 0) return;

    // 1. Process Fixed Templates
    const recurringTxs = incomeTxs.filter(t => t.isRecurring);
    // Deduplicate by name to create unique templates
    const uniqueTemplateNames = new Set(recurringTxs.map(t => t.description.toLowerCase().trim()));
    
    for (const name of uniqueTemplateNames) {
      const sample = recurringTxs.find(t => t.description.toLowerCase().trim() === name);
      if (!sample) continue;
      
      // Check if template exists
      const templates = await this.getFixedTemplates();
      const exists = templates.some(t => t.name.toLowerCase().trim() === name);
      
      if (!exists) {
        const newTemplate: IncomeFixedTemplate = {
          id: db!.collection('_').doc().id,
          name: sample.description,
          defaultAmount: sample.amount,
          active: true,
          frequency: sample.frequency || 'monthly',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await this.saveFixedTemplate(newTemplate);
      }
    }
    
    // 2. Process Monthly Data (Extras)
    // Legacy system: Recurring incomes were just transactions. We need to decide if they become "Received" items in their respective months.
    // However, the rule says: 
    // "If legacy.isRecurring === true: Create or update IncomeFixedTemplate. Do NOT create extras."
    // "If legacy.isRecurring === false: Insert as IncomeExtraItem in that month."
    
    const oneTimeTxs = incomeTxs.filter(t => !t.isRecurring);
    
    for (const tx of oneTimeTxs) {
      const date = new Date(tx.date); // local date or iso string
      // Format YYYY-MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}-${month}`;
      
      const doc = await this.initializeMonth(period);
      
      // Check idempotency (avoid duplicate extras)
      // We can use the legacy ID to check, or description+amount+date.
      // Since legacy IDs are unique, we might want to store them or just check if an extra with same desc/amount/date exists.
      const alreadyExists = doc.extras.some(
        e => e.description === tx.description && 
             Math.abs(e.amount - tx.amount) < 0.01 && 
             Math.abs(e.date - new Date(tx.date).getTime()) < 60000 // 1 min tolerance
      );
      
      if (!alreadyExists) {
        doc.extras.push({
          id: tx.id, // Keep legacy ID if possible, or generate new
          description: tx.description,
          amount: tx.amount,
          date: new Date(tx.date).getTime(),
          createdAt: tx.createdAt
        });
        await this.saveMonthlyDoc(doc);
      }
    }
    
    console.log("Migration completed");
  }
};
