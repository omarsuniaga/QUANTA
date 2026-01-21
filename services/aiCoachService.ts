/// <reference types="vite/client" />
import {
  Transaction,
  Goal,
  DashboardStats,
  FinancialAnalysis,
  SavingsPlan,
  FinancialStrategy,
  SavingsChallenge,
  ChallengeTemplate,
  FinancialHealthMetrics
} from '../types';
import { parseLocalDate } from '../utils/dateHelpers';
import { geminiRateLimiter } from './apiRateLimiter';
import {
  calculateFinancialHealthMetrics,
  calculateDistributionCompatibility
} from '../utils/financialMathCore';
import { resolveBestModel } from './geminiService';
import { aiGateway } from './aiGateway';
import { auth } from '../firebaseConfig';

// Get API key
const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey) return userKey;
  }
  if (typeof process !== 'undefined' && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

// Get current user ID (CRITICAL for user isolation)
const getUserId = (): string | null => {
  return auth?.currentUser?.uid || null;
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours
const MIN_TRANSACTIONS_FOR_ANALYSIS = 3; // Minimum transactions required for AI analysis

interface AICacheEntry<T> {
  data: T;
  timestamp: number;
  stateHash: string;
}

/**
 * Generates a deterministic state-based hash for effective caching
 * CRITICAL: Now includes userId for user isolation
 */
const generateFinancialStateHash = (
  userId: string,
  transactions: Transaction[],
  stats: DashboardStats,
  planId?: string
): string => {
  const date = new Date();
  const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  // Contar transacciones del mes actual
  const currentMonthTxCount = transactions.filter(t => {
    const txDate = parseLocalDate(t.date);
    return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
  }).length;

  // Última fecha de transacción
  const lastTxDate = transactions.length > 0
    ? transactions[0].date
    : period;

  const metrics = [
    userId,                    // CRITICAL: userId first for isolation
    period,
    currentMonthTxCount,
    Math.round(stats.balance / 100) * 100, // Redondeo para evitar cache miss por centavos
    Math.round(stats.totalIncome / 100) * 100,
    Math.round(stats.totalExpense / 100) * 100,
    lastTxDate,
    planId || 'essentialist'
  ];

  return metrics.join('|');
};

/**
 * Cache de llamadas en vuelo para deduplicación
 * Evita llamadas duplicadas concurrentes desde Widget + Screen
 */
const inflightCalls = new Map<string, Promise<any>>();

/**
 * Single Exit Point / AI Gateway con deduplicación
 * CRITICAL: Now includes userId in all cache keys for user isolation
 */
async function _executeAiCall<T>(
  options: {
    userId: string;
    key: string;
    stateHash: string;
    apiCall: () => Promise<T | null>;
    priority?: 'high' | 'normal' | 'low';
    ttl?: number;
    forceRefresh?: boolean;
  }
): Promise<T | null> {
  const { userId, key, stateHash, apiCall, priority = 'normal', ttl = CACHE_TTL, forceRefresh } = options;
  // CRITICAL: Include userId in storage key for user isolation
  const storageKey = `quanta_ai_cache_${userId}_${key}`;
  const cacheKey = `${userId}_${key}_${stateHash}`;

  // 1. Check persistent cache
  if (!forceRefresh) {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const entry = JSON.parse(cached) as AICacheEntry<T>;
        const isExpired = Date.now() - entry.timestamp > ttl;
        const isSameState = entry.stateHash === stateHash;

        if (!isExpired && isSameState) {
          console.log(`[AICoach] Persistent cache hit for ${key} (user: ${userId.substring(0, 8)}...)`);
          return entry.data;
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
  }

  // 2. Check if there's an in-flight call for the same cache key
  if (inflightCalls.has(cacheKey)) {
    console.log(`[AICoach] Reusing in-flight call for ${cacheKey}`);
    return inflightCalls.get(cacheKey) as Promise<T | null>;
  }

  // 3. Create new promise and add to in-flight cache
  const promise = (async () => {
    try {
      // Execute via Rate Limiter
      const result = await geminiRateLimiter.execute<T | null>(
        key,
        apiCall,
        { priority, forceRefresh, cacheDurationMs: ttl }
      );

      // Update persistent cache if successful
      if (result) {
        const newEntry: AICacheEntry<T> = {
          data: result,
          timestamp: Date.now(),
          stateHash
        };
        localStorage.setItem(storageKey, JSON.stringify(newEntry));
      }

      return result;
    } finally {
      // Always remove from in-flight cache when done
      inflightCalls.delete(cacheKey);
    }
  })();

  inflightCalls.set(cacheKey, promise);
  return promise;
}

const isDev = () => import.meta.env.DEV;

// Helper: Calculate stats for a set of transactions
interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
}

function calculateMonthStats(transactions: Transaction[]): MonthlyStats {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  
  const categorySpending: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });
  
  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: expense > 0 ? (amt / expense) * 100 : 0
    }));
  
  return { income, expense, balance, topCategories };
}

// Helper: Map category ID to name
function getCategoryDisplayName(categoryId: string, customCategories?: any[]): string {
  // Check custom categories first
  if (customCategories) {
    const customCat = customCategories.find(c => c.id === categoryId || c.key === categoryId);
    if (customCat) {
      return customCat.name?.es || customCat.name?.en || customCat.key || categoryId;
    }
  }
  
  // Fallback to ID if not found
  return categoryId;
}

// Helper: Get month name in Spanish
function getMonthName(monthIndex: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[monthIndex];
}

// Helper: Detect seasonal context
function getSeasonalContext(date: Date): string | null {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Navidad y fin de año
  if (month === 11 && day >= 15) return 'Temporada navideña y fin de año';
  if (month === 0 && day <= 15) return 'Inicio de año (post-navidad)';
  
  // Verano (vacaciones escolares)
  if (month === 6 || month === 7) return 'Temporada de verano';
  
  // Inicio de clases
  if (month === 8) return 'Inicio del año escolar';
  
  return null;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'no_spend_weekend',
    type: 'no_spend',
    title: 'Fin de Semana Sin Gastos',
    description: 'No gastes nada durante un fin de semana completo. Usa lo que ya tienes en casa.',
    icon: 'ban',
    color: 'rose',
    difficulty: 'medium',
    duration: 2,
    reward: '🏆 Medalla de Autocontrol'
  },
  {
    id: 'save_100',
    type: 'save_amount',
    title: 'Reto $100',
    description: 'Ahorra $100 extra este mes además de tus ahorros regulares.',
    icon: 'piggy-bank',
    color: 'emerald',
    difficulty: 'easy',
    duration: 30,
    targetAmount: 100,
    reward: '💰 Primer Paso'
  },
  {
    id: 'streak_7',
    type: 'streak',
    title: 'Racha de 7 Días',
    description: 'Registra todas tus transacciones por 7 días seguidos.',
    icon: 'flame',
    color: 'amber',
    difficulty: 'easy',
    duration: 7,
    reward: '🔥 Constancia Inicial'
  }
];

export const aiCoachService = {
  async analyzeFinances(
    transactions: Transaction[],
    stats: DashboardStats,
    goals: Goal[],
    selectedPlanId?: string,
    forceRefresh: boolean = false,
    customCategories?: any[]
  ): Promise<FinancialAnalysis | null> {
    // CRITICAL: Get userId for isolation
    const userId = getUserId();
    if (!userId) {
      console.warn('[AICoach] No authenticated user - cannot generate analysis');
      return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('[AICoach] No API key configured');
      return null;
    }

    // GUARD RAIL: Validate minimum transaction count
    if (transactions.length < MIN_TRANSACTIONS_FOR_ANALYSIS) {
      console.log(`[AICoach] Insufficient transactions (${transactions.length}/${MIN_TRANSACTIONS_FOR_ANALYSIS}) - skipping AI analysis`);
      return null;
    }

    const metrics: FinancialHealthMetrics = calculateFinancialHealthMetrics(
      transactions,
      stats.balance,
      stats.totalIncome,
      stats.totalExpense
    );
    
    // Preparar datos históricos para comparación mensual
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filtrar transacciones de últimos 60 días para tener mes actual + anterior
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const last60DaysTx = transactions.filter(t => parseLocalDate(t.date) >= sixtyDaysAgo);
    
    // Separar mes actual vs mes anterior
    const currentMonthTx = last60DaysTx.filter(t => {
      const date = parseLocalDate(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthTx = last60DaysTx.filter(t => {
      const date = parseLocalDate(t.date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    });
    
    // Calcular estadísticas de ambos meses
    const currentStats = calculateMonthStats(currentMonthTx);
    const previousStats = calculateMonthStats(previousMonthTx);
    
    // Calcular variaciones
    const incomeChange = previousStats.income > 0 
      ? ((currentStats.income - previousStats.income) / previousStats.income) * 100
      : 0;
    const expenseChange = previousStats.expense > 0
      ? ((currentStats.expense - previousStats.expense) / previousStats.expense) * 100
      : 0;
    
    // Calcular cambios por categoría (solo cambios significativos >10%)
    const categoryChanges: Array<{ category: string; change: number; currentAmount: number; previousAmount: number }> = [];
    const allCategories = new Set([...currentStats.topCategories.map(c => c.category), ...previousStats.topCategories.map(c => c.category)]);
    
    allCategories.forEach(category => {
      const current = currentStats.topCategories.find(c => c.category === category)?.amount || 0;
      const previous = previousStats.topCategories.find(c => c.category === category)?.amount || 0;
      
      if (previous > 0) {
        const change = ((current - previous) / previous) * 100;
        if (Math.abs(change) >= 10) {
          categoryChanges.push({ category, change, currentAmount: current, previousAmount: previous });
        }
      }
    });
    
    categoryChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    // Contexto estacional
    const seasonalContext = getSeasonalContext(today);

    const stateHash = generateFinancialStateHash(userId, transactions, stats, selectedPlanId);

    const mockAnalysis: FinancialAnalysis = {
      healthScore: 85,
      healthStatus: 'good',
      summary: '🛡️ MODO DEV: Análisis Simulado. Tu salud financiera es estable.',
      strengths: ['Buen índice de ahorro', 'Sin deudas críticas'],
      weaknesses: ['Gastos en entretenimiento altos'],
      monthlyTrend: 'stable',
      savingsRate: metrics.savingsRate,
      riskLevel: 'low',
      topExpenseCategories: currentStats.topCategories,
      recommendations: [],
      constructiveCriticism: [
        {
          id: 'mock_1',
          type: 'habit_alert',
          title: 'Hábito de Café',
          message: 'Detecto compras diarias en cafeterías. Pequeños gastos que suman.',
          detectedPattern: '5 compras de "Starbucks" ($500)',
          impact: 'low'
        }
      ]
    };

    if (isDev() && !forceRefresh) return mockAnalysis;

    return _executeAiCall<FinancialAnalysis>({
      userId,
      key: 'analysis_v5_contextual',
      stateHash,
      forceRefresh,
      apiCall: async () => {
        const genAI = aiGateway.getClient(apiKey);
        const modelId = await resolveBestModel();
        
        const model = genAI.getGenerativeModel({
          model: modelId,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "object" as any,
              properties: {
                healthScore: { type: "number" as any },
                healthStatus: { type: "string" as any, enum: ['excellent', 'good', 'warning', 'critical'] },
                summary: { type: "string" as any },
                strengths: { type: "array" as any, items: { type: "string" as any } },
                weaknesses: { type: "array" as any, items: { type: "string" as any } },
                monthlyTrend: { type: "string" as any, enum: ['improving', 'stable', 'declining'] },
                savingsRate: { type: "number" as any },
                riskLevel: { type: "string" as any, enum: ['low', 'medium', 'high'] },
                constructiveCriticism: {
                  type: "array" as any,
                  items: {
                    type: "object" as any,
                    properties: {
                      id: { type: "string" as any },
                      type: { type: "string" as any, enum: ['warning', 'insight', 'habit_alert'] },
                      title: { type: "string" as any },
                      message: { type: "string" as any },
                      detectedPattern: { type: "string" as any },
                      impact: { type: "string" as any, enum: ['high', 'medium', 'low'] }
                    },
                    required: ['id', 'type', 'title', 'message', 'impact']
                  }
                },
                recommendations: {
                  type: "array" as any,
                  items: {
                    type: "object" as any,
                    properties: {
                      id: { type: "string" as any },
                      type: { type: "string" as any, enum: ['savings', 'budget', 'investment', 'expense_reduction', 'goal'] },
                      priority: { type: "string" as any, enum: ['high', 'medium', 'low'] },
                      title: { type: "string" as any },
                      description: { type: "string" as any },
                      potentialSavings: { type: "number" as any },
                      actionLabel: { type: "string" as any }
                    },
                    required: ['id', 'type', 'priority', 'title', 'description']
                  }
                }
              },
              required: ['healthScore', 'healthStatus', 'summary', 'strengths', 'weaknesses', 'monthlyTrend', 'savingsRate', 'riskLevel', 'constructiveCriticism', 'recommendations']
            }
          }
        });

        // Construir prompt contextual y detallado
        const currentMonthName = getMonthName(currentMonth);
        const previousMonthName = getMonthName(previousMonth);
        
        const seasonalLine = seasonalContext ? `CONTEXTO ESTACIONAL: ${seasonalContext}\n` : '';
        
        let categoryChangesText = '';
        if (categoryChanges.length > 0) {
          categoryChangesText = '\n🔍 CAMBIOS SIGNIFICATIVOS POR CATEGORÍA (>10%):\n';
          categoryChanges.slice(0, 3).forEach(cc => {
            const changeSign = cc.change >= 0 ? '+' : '';
            const categoryName = getCategoryDisplayName(cc.category, customCategories);
            categoryChangesText += `- ${categoryName}: ${changeSign}${cc.change.toFixed(1)}% (RD$ ${cc.previousAmount.toLocaleString('es-DO')} → RD$ ${cc.currentAmount.toLocaleString('es-DO')})\n`;
          });
        }
        
        const prompt = `QUANTA CFO - Análisis Financiero Personal Contextual

FECHA: ${today.toLocaleDateString('es-DO')} (${currentMonthName} ${currentYear})
BALANCE ACTUAL: RD$ ${stats.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
${seasonalLine}
📊 COMPARATIVA MES A MES:

Mes Actual (${currentMonthName}):
- Ingresos: RD$ ${currentStats.income.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Egresos: RD$ ${currentStats.expense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Balance: RD$ ${currentStats.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Top 3 Categorías de Gasto: ${currentStats.topCategories.slice(0, 3).map(c => `${getCategoryDisplayName(c.category, customCategories)} (RD$ ${c.amount.toLocaleString('es-DO')})`).join(', ')}

Mes Anterior (${previousMonthName}):
- Ingresos: RD$ ${previousStats.income.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Egresos: RD$ ${previousStats.expense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Balance: RD$ ${previousStats.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Top 3 Categorías de Gasto: ${previousStats.topCategories.slice(0, 3).map(c => `${getCategoryDisplayName(c.category, customCategories)} (RD$ ${c.amount.toLocaleString('es-DO')})`).join(', ')}

📈 VARIACIONES:
- Ingresos: ${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%
- Egresos: ${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%
- Ahorro Neto del Mes: RD$ ${(currentStats.income - currentStats.expense).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
${categoryChangesText}
📋 INSTRUCCIONES DE ANÁLISIS:
1. Analiza las variaciones detectadas entre ${previousMonthName} y ${currentMonthName}
2. ${seasonalContext ? `Considera que estamos en "${seasonalContext}" y contextualiza` : 'Contextualiza'} cualquier incremento inusual en categorías como "Variados" o "Entretenimiento"
3. Si detectas reducción en gastos recurrentes (ej: combustible, transporte) acompañado de reducción en ingresos, menciona la posible relación causal
4. Si hay aumento de ingresos Y reducción de gastos, ¡FELICITA al usuario! y calcula EXACTAMENTE cuánto logró ahorrar este mes
5. Sé específico con montos EXACTOS en RD$ (pesos dominicanos), no uses aproximaciones
6. Usa un tono cercano, empático y profesional - como un amigo financiero experto
7. En "summary": escribe UN SOLO párrafo conversacional (máx 3 oraciones) que resuma lo más relevante
8. En "constructiveCriticism": incluye insights específicos basados en patrones detectados
9. En "recommendations": prioriza acciones concretas con impacto medible

FORMATO: Retorna SOLO JSON, sin texto adicional.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) return null;
        const analysis = JSON.parse(text) as FinancialAnalysis;
        analysis.topExpenseCategories = currentStats.topCategories;
        return analysis;
      }
    });
  },

  async generateSavingsPlan(
    goal: Goal,
    transactions: Transaction[],
    stats: DashboardStats,
    selectedPlanId: string = 'essentialist',
    forceRefresh: boolean = false
  ): Promise<SavingsPlan | null> {
    // CRITICAL: Get userId for isolation
    const userId = getUserId();
    if (!userId) {
      console.warn('[AICoach] No authenticated user - cannot generate savings plan');
      return null;
    }

    const apiKey = getApiKey();
    if (!apiKey) return null;

    const metrics: FinancialHealthMetrics = calculateFinancialHealthMetrics(transactions, stats.balance, stats.totalIncome, stats.totalExpense);
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthlySavingsCapacity = metrics.discretionaryIncome;

    let daysRemaining = 365;
    if (goal.deadline) {
      daysRemaining = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    const stateHash = generateFinancialStateHash(userId, transactions, stats, selectedPlanId);

    const mockPlan: SavingsPlan = {
      id: `dev_plan_${goal.id}`,
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      strategy: 'moderate',
      monthlyTarget: remaining / 12,
      weeklyTarget: remaining / 52,
      dailyTarget: remaining / 365,
      projectedCompletion: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      isOnTrack: true,
      suggestions: ['DEV: Ahorro simulado'],
      milestones: [] 
    };

    if (isDev() && !forceRefresh) return mockPlan;

    return _executeAiCall<SavingsPlan>({
      userId,
      key: `savingsplan_${goal.id}_v3`,
      stateHash,
      forceRefresh,
      apiCall: async () => {
        const genAI = aiGateway.getClient(apiKey);
        const modelId = await resolveBestModel();

        const model = genAI.getGenerativeModel({
          model: modelId,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "object" as any,
              properties: {
                strategy: { type: "string" as any, enum: ['aggressive', 'moderate', 'relaxed'] },
                monthlyTarget: { type: "number" as any },
                weeklyTarget: { type: "number" as any },
                dailyTarget: { type: "number" as any },
                projectedCompletion: { type: "string" as any },
                isOnTrack: { type: "boolean" as any },
                suggestions: { type: "array" as any, items: { type: "string" as any } }
              },
              required: ['strategy', 'monthlyTarget', 'weeklyTarget', 'dailyTarget', 'projectedCompletion', 'isOnTrack', 'suggestions']
            }
          }
        });

        const prompt = `[SYSTEM: SAVINGS PLANNER. DOP. JSON ONLY.]
Goal:"${goal.name}", Need:RD$${remaining}, Cap:RD$${monthlySavingsCapacity}/mo, Days:${daysRemaining}, Plan:${selectedPlanId}.
Action: Generate viable savings plan JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) return null;
        const plan = JSON.parse(text) as SavingsPlan;
        plan.id = `ai_plan_${goal.id}`;
        plan.goalId = goal.id;
        plan.goalName = goal.name;
        plan.targetAmount = goal.targetAmount;
        plan.currentAmount = goal.currentAmount;
        plan.deadline = goal.deadline;
        plan.milestones = [];
        return plan;
      }
    });
  },

  async analyzeStrategy(
    transactions: Transaction[],
    stats: DashboardStats
  ): Promise<FinancialStrategy[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTx = transactions.filter(t => parseLocalDate(t.date) >= thirtyDaysAgo);
    
    const totalIncome = recentTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = recentTx.filter(t => t.type === 'expense');
    
    const needsCategories = ['Housing', 'Utilities', 'Food', 'Transportation', 'Health'];
    const wantsCategories = ['Entertainment', 'Leisure', 'Services'];
    
    let needsAmount = 0;
    let wantsAmount = 0;
    let otherAmount = 0;
    
    expenses.forEach(t => {
      if (needsCategories.includes(t.category)) {
        needsAmount += t.amount;
      } else if (wantsCategories.includes(t.category)) {
        wantsAmount += t.amount;
      } else {
        otherAmount += t.amount;
      }
    });

    const savingsAmount = totalIncome - (needsAmount + wantsAmount + otherAmount);
    const total = totalIncome > 0 ? totalIncome : 1;
    const needsPct = (needsAmount / total) * 100;
    const wantsPct = (wantsAmount / total) * 100;
    const savingsPct = (savingsAmount / total) * 100;

    return [{
      id: '50_30_20',
      name: 'Regla 50/30/20',
      description: '50% necesidades, 30% deseos, 20% ahorro.',
      rule: '50/30/20',
      isActive: true,
      compatibility: calculateDistributionCompatibility([needsPct, wantsPct, savingsPct], [50, 30, 20]),
      allocations: [
        { category: 'needs', label: 'Necesidades', targetPercentage: 50, currentPercentage: Math.round(needsPct), currentAmount: needsAmount, status: needsPct <= 55 ? 'on_track' : 'over' },
        { category: 'wants', label: 'Deseos', targetPercentage: 30, currentPercentage: Math.round(wantsPct), currentAmount: wantsAmount, status: wantsPct <= 35 ? 'on_track' : 'over' },
        { category: 'savings', label: 'Ahorro', targetPercentage: 20, currentPercentage: Math.round(savingsPct), currentAmount: Math.max(0, savingsAmount), status: savingsPct >= 15 ? 'on_track' : 'under' }
      ]
    }];
  },

  async generateChallenges(
    transactions: Transaction[],
    stats: DashboardStats,
    goals: Goal[]
  ): Promise<SavingsChallenge[]> {
    const today = new Date();
    return CHALLENGE_TEMPLATES.slice(0, 3).map(template => ({
      id: `${template.id}_${Date.now()}`,
      type: template.type,
      title: template.title,
      description: template.description,
      icon: template.icon,
      color: template.color,
      difficulty: template.difficulty,
      duration: template.duration,
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      targetAmount: template.targetAmount,
      targetCategory: template.targetCategory,
      currentProgress: 0,
      targetProgress: 100,
      status: 'not_started',
      reward: template.reward
    }));
  },

  async getQuickTips(
    transactions: Transaction[],
    stats: DashboardStats,
    language: string = 'es',
    forceRefresh: boolean = false
  ): Promise<string[]> {
    // CRITICAL: Get userId for isolation
    const userId = getUserId();
    if (!userId) {
      console.warn('[AICoach] No authenticated user - cannot generate quick tips');
      return [];
    }

    const apiKey = getApiKey();
    if (!apiKey) return [];

    // GUARD RAIL: Validate minimum transaction count
    if (transactions.length < MIN_TRANSACTIONS_FOR_ANALYSIS) {
      console.log(`[AICoach] Insufficient transactions for tips (${transactions.length}/${MIN_TRANSACTIONS_FOR_ANALYSIS})`);
      return [];
    }

    const recentExpenses = transactions.filter(t => t.type === 'expense').slice(0, 20);
    const stateHash = generateFinancialStateHash(userId, transactions, stats);

    const mockTips = ['🛡️ DEV: Tip 1', '🛡️ DEV: Tip 2', '🛡️ DEV: Tip 3'];
    if (isDev() && !forceRefresh) return mockTips;

    return _executeAiCall<string[]>({
      userId,
      key: 'quicktips_v3',
      stateHash,
      forceRefresh,
      priority: 'low',
      apiCall: async () => {
        const genAI = aiGateway.getClient(apiKey);
        const modelId = await resolveBestModel();
        
        const contextTips = recentExpenses.map(t => `${t.description}:${t.amount}`).join('|');
        
        const model = genAI.getGenerativeModel({
          model: modelId,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "array" as any,
              items: { type: "string" as any }
            }
          }
        });

        const languageInstruction = language === 'es' 
          ? 'ESPAÑOL (español dominicano, moneda RD$ - pesos dominicanos)' 
          : 'ENGLISH (USD currency)';

        const prompt = `QUANTA Coach - Tips Rápidos Personalizados

IMPORTANTE: Responde EXCLUSIVAMENTE en ${languageInstruction}.
CRÍTICO: Todos los tips deben estar en ${language === 'es' ? 'ESPAÑOL' : 'INGLÉS'}.

BALANCE ACTUAL: RD$ ${stats.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}

CONTEXTO: Gastos recientes = ${contextTips.substring(0, 200)}

TAREA:
- Genera 3 tips prácticos y accionables en ${language === 'es' ? 'español' : 'inglés'}
- Enfócate en optimización de gastos y ahorro
- Sé específico con montos en RD$
- Tono: Motivador pero realista

FORMATO: Array JSON de 3 strings en ${language === 'es' ? 'español' : 'inglés'}.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) return [];
        return JSON.parse(text);
      }
    });
  }
};