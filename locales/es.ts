// Spanish translations (default)
export const es = {
  // Common
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    optional: 'Opcional',
    required: 'Requerido',
    offline: 'Sin Conexión',
    serviceSaved: 'Servicio guardado',
    remindersActive: 'Recordatorios activos',
    saveError: 'Error al guardar',
  },

  // Auth
  auth: {
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    welcomeBack: 'Bienvenido de nuevo',
    createAccount: 'Crear cuenta',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transacciones',
    settings: 'Ajustes',
  },

  // Dashboard
  dashboard: {
    hello: 'Hola',
    availableToday: 'Disponible Hoy',
    oracle: 'Oráculo Financiero',
    balanceProjection: 'Proyección de Saldo',
    pending: 'Pendiente',
    endOfMonth: 'Fin de mes',
    recurringBillsInfo: 'Basado en tus facturas recurrentes pendientes hasta fin de mes.',
    upcomingPayments: 'Pagos Próximos',
    income: 'Ingresos',
    expenses: 'Gastos',
    expenseDistribution: 'Distribución de Gastos',
    tapToFilter: 'Toca para filtrar',
    emotionalDashboard: 'Dashboard Emocional',
    stress: 'Estrés',
    tiredness: 'Cansancio',
    moodTip: 'Consejo: Gastas un {percent}% más cuando estás estresado.',
    trend6Months: 'Tendencia (6 Meses)',
    tapBarsToFilter: 'Toca barras para filtrar',
    ghostMoneyDetector: 'Detector de Dinero Fantasma',
    noQuickActions: 'Ve a Ajustes para configurar tus botones.',
  },

  // Transactions
  transactions: {
    newIncome: 'Nuevo Ingreso',
    newExpense: 'Nuevo Gasto',
    newService: 'Nuevo Servicio',
    registerIncome: 'Registrar Ingreso',
    registerExpense: 'Registrar Gasto',
    saveIncome: 'Guardar Ingreso',
    saveExpense: 'Guardar Gasto',
    saveService: 'Guardar Servicio',
    concept: 'Concepto',
    description: 'Descripción',
    serviceName: 'Nombre del Servicio',
    amount: 'Monto',
    date: 'Fecha',
    category: 'Categoría',
    paymentMethod: 'Método de Pago',
    isRecurring: 'Es recurrente',
    frequency: 'Frecuencia',
    notes: 'Notas',
    sharedWith: 'Compartido Con',
    scanReceipt: 'Escanear Recibo',
    scanning: 'Escaneando...',
    howDoYouFeel: '¿Cómo te sientes?',
    chargeDay: 'Día de Cobro',
    reminder: 'Recordatorio',
    payWith: 'Pagar con',
    noTransactions: 'Sin transacciones',
    noResults: 'Sin resultados',
    noTransactionsDesc: 'Comienza agregando tus ingresos y gastos para verlos aquí.',
    noResultsDesc: 'No hay transacciones que coincidan con tu filtro actual.',
    clearFilter: 'Limpiar Filtro',
    activeFilter: 'Filtro Activo',
    searchPlaceholder: 'Buscar por descripción, categoría o monto...',
    advancedFilters: 'Filtros Avanzados',
  },

  // Categories
  categories: {
    Salary: 'Salario',
    Freelance: 'Trabajo Independiente',
    Investments: 'Inversiones',
    Housing: 'Vivienda',
    Food: 'Alimentación',
    Utilities: 'Servicios',
    Transportation: 'Transporte',
    Health: 'Salud',
    Entertainment: 'Entretenimiento',
    Services: 'Suscripciones',
    Other: 'Otros',
    Eventual: 'Eventuales',
    Unexpected: 'Imprevistos',
    Leisure: 'Ocio',
  },

  // Frequency
  frequency: {
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
  },

  // Moods
  moods: {
    happy: 'Feliz',
    neutral: 'Neutral',
    tired: 'Cansado',
    stressed: 'Estresado',
  },

  // Settings
  settings: {
    title: 'Ajustes',
    account: 'Cuenta',
    preferences: 'Preferencias',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    currency: 'Moneda',
    notifications: 'Notificaciones',
    quickActions: 'Acciones Rápidas',
    goals: 'Metas',
    data: 'Datos',
    exportData: 'Exportar Datos',
    importData: 'Importar Datos',
    about: 'Acerca de',
    version: 'Versión',
  },

  // Filter Modal
  filterModal: {
    title: 'Filtros Avanzados',
    transactionType: 'Tipo de Transacción',
    all: 'Todos',
    income: 'Ingresos',
    expenses: 'Gastos',
    category: 'Categoría',
    allCategories: 'Todas las categorías',
    dateRange: 'Rango de Fechas',
    from: 'Desde',
    to: 'Hasta',
    paymentMethod: 'Método de Pago',
    allMethods: 'Todos los métodos',
    clear: 'Limpiar',
    apply: 'Aplicar Filtros',
  },

  // Goals
  goals: {
    title: 'Metas',
    addGoal: 'Agregar Meta',
    editGoal: 'Editar Meta',
    goalName: 'Nombre de la Meta',
    targetAmount: 'Monto Objetivo',
    currentAmount: 'Monto Actual',
    deadline: 'Fecha Límite',
    progress: 'Progreso',
    completed: 'Completada',
  },

  // AI Coach
  aiCoach: {
    title: 'Coach Financiero IA',
    tip: 'Consejo',
    alert: 'Alerta',
    kudos: 'Felicitaciones',
    prediction: 'Predicción',
  },
};

export type TranslationKeys = typeof es;
