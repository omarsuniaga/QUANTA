
export type TransactionType = 'income' | 'expense';

export enum Category {
  Salary = 'Salary',
  Freelance = 'Freelance',
  Investments = 'Investments',
  Housing = 'Housing',
  Food = 'Food',
  Utilities = 'Utilities',
  Transportation = 'Transportation',
  Health = 'Health',
  Entertainment = 'Entertainment',
  Services = 'Subscriptions', // Netflix, Spotify, etc.
  Other = 'Other',
  Eventual = 'Eventual',
  Unexpected = 'Unexpected',
  Leisure = 'Leisure'
}

export type Frequency = 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'account';
export type Mood = 'happy' | 'neutral' | 'tired' | 'stressed';
export type Theme = 'light' | 'dark' | 'system';

// --- AI SPECIFIC ---
export interface AIInsight {
  type: 'alert' | 'tip' | 'kudos' | 'prediction';
  title: string;
  message: string;
  action?: string; // Suggestion like "Create Goal" or "Check Subscription"
  score?: number; // 1-100 financial health score
}

// --- CORE VALUE TYPES (Firestore Schema) ---

// Corresponds to the "amount" object in Firestore
export interface MonetaryAmount {
  value: number;          // Amount in local currency (e.g., 1500)
  currency: string;       // Local currency code (e.g., 'DOP')
  exchangeRate: number;   // Rate used at the moment (e.g., 0.017)
  valueInBase: number;    // Equivalent in base currency (e.g., 25.50)
  baseCurrency: string;   // Base currency code (e.g., 'USD')
}

// --- AUDIT & SECURITY ---

export interface AuditLog {
  id?: string;
  userId: string;
  event: 'login' | 'logout' | 'settings_update' | 'data_export' | 'settings_change';
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  platform?: string; // iOS, Android, Web
  appVersion?: string;
}

// --- ENTITIES ---

export interface User {
  id: string; // Internal App ID (maps to uid)
  uid: string; // Firestore field
  email: string;
  name: string; // Internal App Name (maps to displayName)
  displayName: string; // Firestore field
  photoURL?: string;
  createdAt?: number;
  lastLoginAt?: number;
  status: 'active' | 'banned' | 'deleted';
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'card' | 'wallet';
  balance: number;
  currency: string;
  isExcludedFromTotal?: boolean;
  updatedAt?: number;
}

export interface Transaction {
  id: string;
  
  // UI Helper: The app uses 'amount' as a number for calculations.
  // In Firestore, this will be stored as the 'amount' Object (MonetaryAmount).
  amount: number; 
  
  // Optional field to hold the full object when read from DB
  monetaryDetails?: MonetaryAmount; 

  type: TransactionType;
  category: string;
  description: string; // Maps to "description" in Firestore (concept)
  date: string; // ISO Date string YYYY-MM-DD
  
  // Context
  isRecurring: boolean;
  frequency?: Frequency;
  
  paymentMethodId?: string; // Maps to "paymentMethodId" in Firestore
  // Legacy/UI helper
  paymentMethod?: string; 

  notes?: string;
  mood?: Mood; 
  gigType?: string; 
  receiptUrl?: string; 
  
  // Income specific
  incomeType?: 'salary' | 'extra'; // Salary = regular monthly/biweekly, Extra = additional income
  
  // Sharing
  sharedWith?: string[]; 
  
  createdAt: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string; 
  color?: string;
  linkedAccountId?: string;
}

export interface Promo {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string; 
}

export interface Budget {
  category: string;
  limit: number;
  spent?: number;
  period?: 'monthly' | 'yearly';
  createdAt?: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  chargeDay: number; // 1-31
  frequency: Frequency;
  
  autoPaymentAccount?: string; // Maps to "autoPaymentAccount" in Firestore
  paymentMethod?: string; // UI Helper
  
  reminderDays: number; 
  category: string;
  lastPaidDate?: string; 
  isActive?: boolean;
}

// --- CONFIGURATION ---

export interface AIConfig {
  enabled: boolean;
  level: 'soft' | 'medium' | 'aggressive';
  dataSharing?: boolean;
  userGeminiApiKey?: string; // User's personal Gemini API key
}

export interface NotificationConfig {
  enabled: boolean;
  pushToken?: string;
  emailAlerts?: boolean;
  billReminders?: boolean;
  reminderLeadDays?: number;
}

export interface CurrencyConfig {
  localCode: string; 
  localSymbol: string; 
  rateToBase: number; 
  baseCode?: string; 
  lastUpdated?: number;
}

export interface AppSettings {
  theme: Theme;
  language?: string;
  currency: CurrencyConfig;
  notifications: NotificationConfig;
  aiConfig: AIConfig;
}

export interface QuickAction {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'service';
  icon: string; 
  color: string; 
  showOnHome: boolean;
  order: number;
  defaults?: {
    category?: string;
    amount?: number;
    description?: string;
    paymentMethod?: string; 
  };
}

// --- AI COACH & FINANCIAL ANALYSIS ---

export interface FinancialAnalysis {
  healthScore: number; // 0-100
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  monthlyTrend: 'improving' | 'stable' | 'declining';
  savingsRate: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  topExpenseCategories: Array<{ category: string; amount: number; percentage: number }>;
  recommendations: AIRecommendation[];
}

export interface AIRecommendation {
  id: string;
  type: 'savings' | 'budget' | 'investment' | 'expense_reduction' | 'goal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings?: number;
  actionLabel?: string;
  category?: string;
}

export interface SavingsPlan {
  id: string;
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  monthlyTarget: number;
  weeklyTarget: number;
  dailyTarget: number;
  strategy: 'aggressive' | 'moderate' | 'relaxed';
  projectedCompletion: string; // ISO date
  isOnTrack: boolean;
  suggestions: string[];
  milestones: SavingsMilestone[];
}

export interface SavingsMilestone {
  percentage: number; // 25, 50, 75, 100
  amount: number;
  projectedDate: string;
  isCompleted: boolean;
}

export interface FinancialStrategy {
  id: string;
  name: string;
  description: string;
  rule: string; // e.g., "50/30/20"
  allocations: StrategyAllocation[];
  isActive: boolean;
  compatibility: number; // 0-100 how well user follows this
}

export interface StrategyAllocation {
  category: 'needs' | 'wants' | 'savings' | 'investments' | 'debt';
  label: string;
  targetPercentage: number;
  currentPercentage: number;
  currentAmount: number;
  status: 'on_track' | 'over' | 'under';
}

export interface SavingsChallenge {
  id: string;
  type: 'no_spend' | 'reduce_category' | 'save_amount' | 'streak' | 'custom';
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // days
  startDate: string;
  endDate: string;
  targetAmount?: number;
  targetCategory?: string;
  currentProgress: number;
  targetProgress: number;
  status: 'active' | 'completed' | 'failed' | 'not_started';
  reward: string;
  streakDays?: number;
}

export interface ChallengeTemplate {
  id: string;
  type: SavingsChallenge['type'];
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: SavingsChallenge['difficulty'];
  duration: number;
  targetAmount?: number;
  targetCategory?: string;
  reward: string;
}

// --- DASHBOARD ---

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// --- CUSTOM CATEGORIES ---

export interface CustomCategory {
  id: string;
  key: string; // Unique identifier (e.g., 'food', 'transport')
  name: {
    es: string;
    en: string;
  };
  icon: string; // Lucide icon name
  color: string; // Tailwind color (e.g., 'rose', 'emerald', 'blue')
  type: 'income' | 'expense' | 'both'; // Category type
  isDefault?: boolean; // System default categories
  order?: number;
}
