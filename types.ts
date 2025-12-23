
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
  event: 'login' | 'logout' | 'settings_update' | 'data_export' | 'settings_change' | 'transaction_add' | 'transaction_update' | 'transaction_delete' | 'account_update' | 'goal_update';
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
  institution?: string; // Bank name, card issuer, wallet provider
  color?: string; // Custom color for the account
  icon?: string; // Custom icon
  isExcludedFromTotal?: boolean;
  updatedAt?: number;
  lastReconciled?: string; // Last time balance was verified
  
  // Banking Commissions Configuration
  transferCommissionPercentage?: number; // % for bank transfers
  cardCommissionPercentage?: number;     // % for card payments
  achFeeFixed?: number;                  // Fixed fee for ACH
  lbtrFeeFixed?: number;                 // Fixed fee for LBTR
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
  date: string; // ISO Date/DateTime string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
  
  // Context
  isRecurring: boolean;
  frequency?: Frequency;

  // Payment Method - Dual format for compatibility
  paymentMethodType?: 'cash' | 'bank' | 'card' | 'other'; // Type of payment method
  paymentMethodId?: string; // Maps to "paymentMethodId" in Firestore (Account ID or 'cash')
  // Legacy/UI helper - for backward compatibility with old transactions
  paymentMethod?: string; 

  notes?: string;
  mood?: Mood; 
  gigType?: string; 
  receiptUrl?: string; 
  
  // Income specific
  incomeType?: 'salary' | 'extra'; // Salary = regular monthly/biweekly, Extra = additional income
  isIncludedInAccountBalance?: boolean; // If true, this income is already reflected in account balances (don't add to available)
  
  // Commissions
  commissionAmount?: number; // Total amount deducted due to bank/card commissions
  bankTransferType?: 'internal' | 'ach' | 'lbtr'; // For bank accounts

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
  // New savings plan fields
  contributionAmount?: number;      // Amount to contribute each period
  contributionFrequency?: 'weekly' | 'biweekly' | 'monthly'; // How often to contribute
  calculationMode?: 'time' | 'amount'; // Calculate time to reach goal OR amount needed per period
  targetDate?: string;              // Target date to reach goal (for 'amount' mode)
  autoDeduct?: boolean;             // Automatically deduct from available balance
  // Contribution tracking
  lastContributionDate?: string;    // Last time a contribution was made
  nextContributionDate?: string;    // Next scheduled contribution date
  contributionHistory?: {           // History of contributions
    date: string;
    amount: number;
  }[];
}

export interface Promo {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string; 
}

export interface Budget {
  id: string;
  userId?: string;
  category: string;
  name: string; // "Supermercado", "Combustible", etc.
  limit: number; // Presupuesto límite
  spent?: number; // Gastado hasta ahora (calculado)
  period: 'monthly' | 'yearly';
  color?: string; // Color para visualización
  icon?: string; // Icono de la categoría
  isActive?: boolean; // Si está activo o no
  createdAt?: number;
  updatedAt?: number;
  resetDay?: number; // Día del mes para resetear (1-31)
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'saving' | 'overspending' | 'warning';
  amount: number; // Diferencia (positivo = ahorro, negativo = sobregasto)
  percentage: number; // Porcentaje usado del presupuesto
  message: string;
  timestamp: number;
  isRead?: boolean;
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
  selectedPlanId?: PlanId; // Current active financial model
}

export interface NotificationConfig {
  enabled: boolean;
  pushToken?: string;
  emailAlerts?: boolean;
  billReminders?: boolean;
  reminderLeadDays?: number;
}

export interface CurrencyConfig {
  localCode: string;      // ISO 4217 code (USD, EUR, DOP, etc.)
  localSymbol: string;    // Currency symbol ($, €, RD$, etc.)
  rateToBase: number;     // Exchange rate to base currency (USD)
  baseCode?: string;      // Base currency code (usually USD)
  lastUpdated?: number;   // Timestamp of last rate update
  flag?: string;          // Emoji flag for the currency country
  name?: string;          // Full currency name
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

// --- FINANCIAL STRATEGY & PLANS ---

export type PlanId = 'essentialist' | 'auditor' | 'investor' | 'defensive';

export type PlanKPI = 'savings_rate' | 'zero_based_gap' | 'net_worth_growth' | 'debt_reduction_velocity' | 'runway';

export interface AllocationRule {
  categoryGroup: 'needs' | 'wants' | 'savings' | 'debt' | 'investments';
  targetPercentage?: number; // e.g., 50 for needs
  isStrict: boolean; // If true, UI shows warnings when exceeded
  description?: string;
}

export interface FinancialPlan {
  id: PlanId;
  name: string;
  description: string;
  allocationRules: AllocationRule[];
  primaryKPI: PlanKPI;
  aiPersonality: 'friendly_coach' | 'strict_accountant' | 'wealth_manager' | 'strategist';
}

export interface FinancialHealthMetrics {
  burnRate: number;        // Average monthly spend
  runwayMonths: number;    // How long you survive with 0 income
  debtToIncomeRatio: number; // Percentage of income going to debt
  savingsRate: number;     // Percentage of income saved
  discretionaryIncome: number; // Truly free money
  potentialInvestment?: number; // Money available for investing (Investor plan)
  debtFreeDate?: string;   // Estimated date (Defensive plan)
}

// --- DASHBOARD ---

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  // Patrimonio real = suma de todas las cuentas
  realBalance: number;
  // Disponible = patrimonio - ahorros comprometidos
  availableBalance: number;
  // Total comprometido en metas
  committedSavings: number;
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
