// English translations
import { TranslationKeys } from './es';

export const en: TranslationKeys = {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    optional: 'Optional',
    required: 'Required',
    offline: 'Offline',
    serviceSaved: 'Service saved',
    remindersActive: 'Reminders active',
    saveError: 'Error saving',
  },

  // Auth
  auth: {
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    settings: 'Settings',
  },

  // Dashboard
  dashboard: {
    hello: 'Hello',
    availableToday: 'Available Today',
    oracle: 'Financial Oracle',
    balanceProjection: 'Balance Projection',
    pending: 'Pending',
    endOfMonth: 'End of month',
    recurringBillsInfo: 'Based on your pending recurring bills until end of month.',
    upcomingPayments: 'Upcoming Payments',
    income: 'Income',
    expenses: 'Expenses',
    expenseDistribution: 'Expense Distribution',
    tapToFilter: 'Tap to filter',
    emotionalDashboard: 'Emotional Dashboard',
    stress: 'Stress',
    tiredness: 'Tiredness',
    moodTip: 'Tip: You spend {percent}% more when stressed.',
    trend6Months: 'Trend (6 Months)',
    tapBarsToFilter: 'Tap bars to filter',
    ghostMoneyDetector: 'Ghost Money Detector',
    noQuickActions: 'Go to Settings to configure your buttons.',
  },

  // Transactions
  transactions: {
    newIncome: 'New Income',
    newExpense: 'New Expense',
    newService: 'New Service',
    registerIncome: 'Register Income',
    registerExpense: 'Register Expense',
    saveIncome: 'Save Income',
    saveExpense: 'Save Expense',
    saveService: 'Save Service',
    concept: 'Concept',
    description: 'Description',
    serviceName: 'Service Name',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    paymentMethod: 'Payment Method',
    isRecurring: 'Is recurring',
    frequency: 'Frequency',
    notes: 'Notes',
    sharedWith: 'Shared With',
    scanReceipt: 'Scan Receipt',
    scanning: 'Scanning...',
    howDoYouFeel: 'How do you feel?',
    chargeDay: 'Charge Day',
    reminder: 'Reminder',
    payWith: 'Pay with',
    noTransactions: 'No transactions',
    noResults: 'No results',
    noTransactionsDesc: 'Start adding your income and expenses to see them here.',
    noResultsDesc: 'No transactions match your current filter.',
    clearFilter: 'Clear Filter',
    activeFilter: 'Active Filter',
    searchPlaceholder: 'Search by description, category or amount...',
    advancedFilters: 'Advanced Filters',
  },

  // Categories
  categories: {
    Salary: 'Salary',
    Freelance: 'Freelance',
    Investments: 'Investments',
    Housing: 'Housing',
    Food: 'Food',
    Utilities: 'Utilities',
    Transportation: 'Transportation',
    Health: 'Health',
    Entertainment: 'Entertainment',
    Services: 'Subscriptions',
    Other: 'Other',
    Eventual: 'Occasional',
    Unexpected: 'Unexpected',
    Leisure: 'Leisure',
  },

  // Frequency
  frequency: {
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  },

  // Moods
  moods: {
    happy: 'Happy',
    neutral: 'Neutral',
    tired: 'Tired',
    stressed: 'Stressed',
  },

  // Settings
  settings: {
    title: 'Settings',
    account: 'Account',
    preferences: 'Preferences',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    currency: 'Currency',
    notifications: 'Notifications',
    quickActions: 'Quick Actions',
    goals: 'Goals',
    data: 'Data',
    exportData: 'Export Data',
    importData: 'Import Data',
    about: 'About',
    version: 'Version',
  },

  // Filter Modal
  filterModal: {
    title: 'Advanced Filters',
    transactionType: 'Transaction Type',
    all: 'All',
    income: 'Income',
    expenses: 'Expenses',
    category: 'Category',
    allCategories: 'All categories',
    dateRange: 'Date Range',
    from: 'From',
    to: 'To',
    paymentMethod: 'Payment Method',
    allMethods: 'All methods',
    clear: 'Clear',
    apply: 'Apply Filters',
  },

  // Goals
  goals: {
    title: 'Goals',
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    currentAmount: 'Current Amount',
    deadline: 'Deadline',
    progress: 'Progress',
    completed: 'Completed',
  },

  // AI Coach
  aiCoach: {
    title: 'AI Financial Coach',
    tip: 'Tip',
    alert: 'Alert',
    kudos: 'Kudos',
    prediction: 'Prediction',
  },
};
