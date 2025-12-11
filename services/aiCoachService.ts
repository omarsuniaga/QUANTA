import { GoogleGenAI, Type } from "@google/genai";
import { 
  Transaction, 
  Goal, 
  DashboardStats, 
  FinancialAnalysis,
  AIRecommendation,
  SavingsPlan,
  SavingsMilestone,
  FinancialStrategy,
  StrategyAllocation,
  SavingsChallenge,
  ChallengeTemplate
} from '../types';
import { hasValidApiKey } from './geminiService';

// Get API key from geminiService
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

// ============================================
// CHALLENGE TEMPLATES
// ============================================
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
    id: 'no_spend_week',
    type: 'no_spend',
    title: 'Semana de Austeridad',
    description: 'Pasa una semana entera sin gastos innecesarios. Solo lo esencial.',
    icon: 'shield',
    color: 'purple',
    difficulty: 'hard',
    duration: 7,
    reward: '🥇 Maestro del Ahorro'
  },
  {
    id: 'reduce_food',
    type: 'reduce_category',
    title: 'Chef en Casa',
    description: 'Reduce tus gastos en restaurantes y delivery un 50% esta semana.',
    icon: 'utensils',
    color: 'orange',
    difficulty: 'medium',
    duration: 7,
    targetCategory: 'Food',
    reward: '👨‍🍳 Chef Doméstico'
  },
  {
    id: 'reduce_entertainment',
    type: 'reduce_category',
    title: 'Entretenimiento Gratis',
    description: 'Busca alternativas gratuitas de entretenimiento por 2 semanas.',
    icon: 'tv',
    color: 'pink',
    difficulty: 'medium',
    duration: 14,
    targetCategory: 'Entertainment',
    reward: '🎭 Creativo del Ocio'
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
    id: 'save_500',
    type: 'save_amount',
    title: 'Reto $500',
    description: 'Ahorra $500 extra este mes. Busca ingresos extras o reduce gastos.',
    icon: 'trending-up',
    color: 'green',
    difficulty: 'hard',
    duration: 30,
    targetAmount: 500,
    reward: '💎 Ahorrista Pro'
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
  },
  {
    id: 'streak_30',
    type: 'streak',
    title: 'Racha Mensual',
    description: 'Mantén el registro diario de gastos por 30 días.',
    icon: 'calendar-check',
    color: 'blue',
    difficulty: 'medium',
    duration: 30,
    reward: '📅 Disciplina Financiera'
  },
  {
    id: 'coffee_challenge',
    type: 'custom',
    title: 'Reto del Café',
    description: 'No compres café fuera por 2 semanas. Prepáralo en casa.',
    icon: 'coffee',
    color: 'amber',
    difficulty: 'easy',
    duration: 14,
    targetAmount: 50,
    reward: '☕ Barista Casero'
  },
  {
    id: 'transport_challenge',
    type: 'reduce_category',
    title: 'Movilidad Sostenible',
    description: 'Reduce gastos de transporte usando alternativas (caminar, bici, transporte público).',
    icon: 'bike',
    color: 'teal',
    difficulty: 'medium',
    duration: 14,
    targetCategory: 'Transportation',
    reward: '🚴 Eco-Viajero'
  }
];

// ============================================
// AI COACH SERVICE
// ============================================
export const aiCoachService = {
  /**
   * Comprehensive Financial Analysis
   */
  async analyzeFinances(
    transactions: Transaction[],
    stats: DashboardStats,
    goals: Goal[]
  ): Promise<FinancialAnalysis | null> {
    const apiKey = getApiKey();
    if (!apiKey || transactions.length === 0) return null;

    const ai = new GoogleGenAI({ apiKey });

    try {
      // Prepare comprehensive data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
      const expenses = recentTx.filter(t => t.type === 'expense');
      const incomes = recentTx.filter(t => t.type === 'income');
      
      // Calculate category breakdown
      const categorySpending: Record<string, number> = {};
      expenses.forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });
      
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amt]) => ({
          category: cat,
          amount: amt,
          percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0
        }));

      // Detect patterns
      const weekdaySpending: Record<string, number> = {};
      expenses.forEach(t => {
        const day = new Date(t.date).toLocaleDateString('es-ES', { weekday: 'long' });
        weekdaySpending[day] = (weekdaySpending[day] || 0) + t.amount;
      });

      const contextData = {
        balance: stats.balance,
        totalIncome30Days: totalIncome,
        totalExpenses30Days: totalExpenses,
        savingsRate: savingsRate.toFixed(1),
        topCategories,
        weekdaySpending,
        goalsProgress: goals.map(g => ({
          name: g.name,
          progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(0),
          remaining: g.targetAmount - g.currentAmount
        })),
        transactionCount: recentTx.length,
        avgDailyExpense: (totalExpenses / 30).toFixed(2),
        recurringExpenses: transactions.filter(t => t.isRecurring).length
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Eres QUANTA Coach, un experto analista financiero personal. Analiza estos datos financieros de los últimos 30 días y genera un análisis completo.

Datos del usuario:
${JSON.stringify(contextData, null, 2)}

GENERA UN ANÁLISIS COMPLETO en JSON con estos campos:
1. healthScore: puntuación de salud financiera 0-100
2. healthStatus: 'excellent' (>80), 'good' (60-80), 'warning' (40-60), 'critical' (<40)
3. summary: resumen ejecutivo de 2-3 oraciones
4. strengths: array de 2-3 fortalezas financieras del usuario
5. weaknesses: array de 2-3 áreas de mejora
6. monthlyTrend: 'improving', 'stable', o 'declining' basado en patrones
7. savingsRate: porcentaje de ahorro actual
8. riskLevel: 'low', 'medium', 'high' basado en gastos vs ingresos
9. recommendations: array de 3-4 recomendaciones específicas con:
   - id: identificador único
   - type: 'savings' | 'budget' | 'investment' | 'expense_reduction' | 'goal'
   - priority: 'high' | 'medium' | 'low'
   - title: título corto
   - description: descripción detallada y accionable
   - potentialSavings: ahorro potencial en número (si aplica)
   - actionLabel: texto del botón de acción
   - category: categoría relacionada (si aplica)

Responde SOLO en español. Sé específico y usa los datos proporcionados.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.NUMBER },
              healthStatus: { type: Type.STRING, enum: ['excellent', 'good', 'warning', 'critical'] },
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              monthlyTrend: { type: Type.STRING, enum: ['improving', 'stable', 'declining'] },
              savingsRate: { type: Type.NUMBER },
              riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['savings', 'budget', 'investment', 'expense_reduction', 'goal'] },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    potentialSavings: { type: Type.NUMBER },
                    actionLabel: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ['id', 'type', 'priority', 'title', 'description']
                }
              }
            },
            required: ['healthScore', 'healthStatus', 'summary', 'strengths', 'weaknesses', 'monthlyTrend', 'savingsRate', 'riskLevel', 'recommendations']
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      
      const analysis = JSON.parse(text) as FinancialAnalysis;
      analysis.topExpenseCategories = topCategories;
      
      return analysis;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return null;
    }
  },

  /**
   * Generate Smart Savings Plan for a Goal
   */
  async generateSavingsPlan(
    goal: Goal,
    transactions: Transaction[],
    stats: DashboardStats
  ): Promise<SavingsPlan | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    try {
      const remaining = goal.targetAmount - goal.currentAmount;
      const hasDeadline = !!goal.deadline;
      
      // Calculate average monthly savings capacity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
      const monthlyIncome = recentTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = recentTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const monthlySavingsCapacity = monthlyIncome - monthlyExpenses;

      // Calculate days until deadline or estimate
      let daysRemaining = 365; // Default 1 year
      if (goal.deadline) {
        daysRemaining = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Genera un plan de ahorro personalizado para esta meta:

Meta: ${goal.name}
Objetivo: $${goal.targetAmount}
Ahorrado: $${goal.currentAmount}
Restante: $${remaining}
Fecha límite: ${goal.deadline || 'No definida'}
Días restantes: ${daysRemaining}

Contexto financiero del usuario:
- Capacidad de ahorro mensual estimada: $${monthlySavingsCapacity.toFixed(2)}
- Balance actual: $${stats.balance}

Genera un plan con:
1. strategy: 'aggressive' (meta en menos tiempo), 'moderate' (equilibrado), 'relaxed' (más tiempo)
2. monthlyTarget: cantidad a ahorrar mensualmente
3. weeklyTarget: cantidad semanal
4. dailyTarget: cantidad diaria
5. projectedCompletion: fecha ISO estimada de completar
6. isOnTrack: true/false si el usuario puede lograrlo con su capacidad actual
7. suggestions: 3-4 sugerencias específicas para alcanzar la meta

Responde en JSON. Sé realista basándote en la capacidad del usuario.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING, enum: ['aggressive', 'moderate', 'relaxed'] },
              monthlyTarget: { type: Type.NUMBER },
              weeklyTarget: { type: Type.NUMBER },
              dailyTarget: { type: Type.NUMBER },
              projectedCompletion: { type: Type.STRING },
              isOnTrack: { type: Type.BOOLEAN },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['strategy', 'monthlyTarget', 'weeklyTarget', 'dailyTarget', 'projectedCompletion', 'isOnTrack', 'suggestions']
          }
        }
      });

      const text = response.text;
      if (!text) return null;

      const planData = JSON.parse(text);

      // Generate milestones
      const milestones: SavingsMilestone[] = [25, 50, 75, 100].map(pct => {
        const amount = (goal.targetAmount * pct) / 100;
        const daysToReach = planData.dailyTarget > 0 
          ? Math.ceil((amount - goal.currentAmount) / planData.dailyTarget)
          : daysRemaining;
        const projectedDate = new Date();
        projectedDate.setDate(projectedDate.getDate() + Math.max(0, daysToReach));
        
        return {
          percentage: pct,
          amount,
          projectedDate: projectedDate.toISOString().split('T')[0],
          isCompleted: goal.currentAmount >= amount
        };
      });

      return {
        id: `plan_${goal.id}`,
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        monthlyTarget: planData.monthlyTarget,
        weeklyTarget: planData.weeklyTarget,
        dailyTarget: planData.dailyTarget,
        strategy: planData.strategy,
        projectedCompletion: planData.projectedCompletion,
        isOnTrack: planData.isOnTrack,
        suggestions: planData.suggestions,
        milestones
      };
    } catch (error) {
      console.error('Savings Plan Error:', error);
      return null;
    }
  },

  /**
   * Get Financial Strategy Analysis
   */
  async analyzeStrategy(
    transactions: Transaction[],
    stats: DashboardStats
  ): Promise<FinancialStrategy[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    const totalIncome = recentTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = recentTx.filter(t => t.type === 'expense');
    
    // Categorize expenses
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

    // 50/30/20 Strategy
    const strategy503020: FinancialStrategy = {
      id: '50_30_20',
      name: 'Regla 50/30/20',
      description: '50% necesidades, 30% deseos, 20% ahorro. La regla de oro para finanzas equilibradas.',
      rule: '50/30/20',
      isActive: true,
      compatibility: calculateCompatibility(
        [needsPct, wantsPct, savingsPct],
        [50, 30, 20]
      ),
      allocations: [
        {
          category: 'needs',
          label: 'Necesidades',
          targetPercentage: 50,
          currentPercentage: Math.round(needsPct),
          currentAmount: needsAmount,
          status: needsPct <= 55 ? 'on_track' : 'over'
        },
        {
          category: 'wants',
          label: 'Deseos',
          targetPercentage: 30,
          currentPercentage: Math.round(wantsPct),
          currentAmount: wantsAmount,
          status: wantsPct <= 35 ? 'on_track' : 'over'
        },
        {
          category: 'savings',
          label: 'Ahorro',
          targetPercentage: 20,
          currentPercentage: Math.round(savingsPct),
          currentAmount: Math.max(0, savingsAmount),
          status: savingsPct >= 15 ? 'on_track' : 'under'
        }
      ]
    };

    // 70/20/10 Strategy (más conservador)
    const strategy702010: FinancialStrategy = {
      id: '70_20_10',
      name: 'Regla 70/20/10',
      description: '70% gastos de vida, 20% ahorro/inversión, 10% para donaciones o metas especiales.',
      rule: '70/20/10',
      isActive: false,
      compatibility: calculateCompatibility(
        [needsPct + wantsPct, savingsPct, 0],
        [70, 20, 10]
      ),
      allocations: [
        {
          category: 'needs',
          label: 'Gastos de Vida',
          targetPercentage: 70,
          currentPercentage: Math.round(needsPct + wantsPct),
          currentAmount: needsAmount + wantsAmount,
          status: (needsPct + wantsPct) <= 75 ? 'on_track' : 'over'
        },
        {
          category: 'savings',
          label: 'Ahorro/Inversión',
          targetPercentage: 20,
          currentPercentage: Math.round(savingsPct),
          currentAmount: Math.max(0, savingsAmount),
          status: savingsPct >= 15 ? 'on_track' : 'under'
        },
        {
          category: 'investments',
          label: 'Metas Especiales',
          targetPercentage: 10,
          currentPercentage: 0,
          currentAmount: 0,
          status: 'under'
        }
      ]
    };

    // 80/20 Strategy (simple)
    const strategy8020: FinancialStrategy = {
      id: '80_20',
      name: 'Regla 80/20',
      description: 'Simple y efectiva: 80% para gastos, 20% directo al ahorro.',
      rule: '80/20',
      isActive: false,
      compatibility: calculateCompatibility(
        [needsPct + wantsPct, savingsPct],
        [80, 20]
      ),
      allocations: [
        {
          category: 'needs',
          label: 'Gastos Totales',
          targetPercentage: 80,
          currentPercentage: Math.round(needsPct + wantsPct),
          currentAmount: needsAmount + wantsAmount,
          status: (needsPct + wantsPct) <= 85 ? 'on_track' : 'over'
        },
        {
          category: 'savings',
          label: 'Ahorro',
          targetPercentage: 20,
          currentPercentage: Math.round(savingsPct),
          currentAmount: Math.max(0, savingsAmount),
          status: savingsPct >= 15 ? 'on_track' : 'under'
        }
      ]
    };

    return [strategy503020, strategy702010, strategy8020];
  },

  /**
   * Generate Personalized Challenges
   */
  async generateChallenges(
    transactions: Transaction[],
    stats: DashboardStats,
    goals: Goal[]
  ): Promise<SavingsChallenge[]> {
    const apiKey = getApiKey();
    
    // Calculate spending patterns to suggest relevant challenges
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo);
    
    const categorySpending: Record<string, number> = {};
    recentExpenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)[0];

    // Select 3-4 relevant challenges
    const selectedTemplates: ChallengeTemplate[] = [];
    
    // Always include a streak challenge for engagement
    selectedTemplates.push(CHALLENGE_TEMPLATES.find(t => t.id === 'streak_7')!);
    
    // Add category-specific challenge if high spending detected
    if (topCategory) {
      const categoryChallenge = CHALLENGE_TEMPLATES.find(
        t => t.targetCategory === topCategory[0]
      );
      if (categoryChallenge) {
        selectedTemplates.push(categoryChallenge);
      }
    }

    // Add savings challenge based on goals
    if (goals.length > 0) {
      selectedTemplates.push(CHALLENGE_TEMPLATES.find(t => t.id === 'save_100')!);
    }

    // Add a no-spend challenge
    selectedTemplates.push(CHALLENGE_TEMPLATES.find(t => t.id === 'no_spend_weekend')!);

    // Fill remaining slots with random challenges
    while (selectedTemplates.length < 4) {
      const random = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
      if (!selectedTemplates.find(t => t.id === random.id)) {
        selectedTemplates.push(random);
      }
    }

    // Convert templates to active challenges
    const today = new Date();
    return selectedTemplates.slice(0, 4).map(template => {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + template.duration);
      
      return {
        id: `${template.id}_${Date.now()}`,
        type: template.type,
        title: template.title,
        description: template.description,
        icon: template.icon,
        color: template.color,
        difficulty: template.difficulty,
        duration: template.duration,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        targetAmount: template.targetAmount,
        targetCategory: template.targetCategory,
        currentProgress: 0,
        targetProgress: template.type === 'streak' ? template.duration : (template.targetAmount || 100),
        status: 'not_started' as const,
        reward: template.reward,
        streakDays: template.type === 'streak' ? 0 : undefined
      };
    });
  },

  /**
   * Get Quick AI Tips (lighter version for frequent use)
   */
  async getQuickTips(
    transactions: Transaction[],
    stats: DashboardStats
  ): Promise<string[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });

    try {
      const recentExpenses = transactions
        .filter(t => t.type === 'expense')
        .slice(0, 20);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Basándote en estos gastos recientes, genera 3 tips rápidos y accionables para mejorar las finanzas:

Balance: $${stats.balance}
Gastos recientes: ${recentExpenses.map(t => `${t.category}: $${t.amount}`).join(', ')}

Responde con un array JSON de 3 strings cortos (máximo 100 caracteres cada uno). Tips prácticos y motivadores.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error('Quick Tips Error:', error);
      return [
        '💡 Revisa tus suscripciones mensuales, podrías estar pagando por servicios que no usas.',
        '🎯 Establece un presupuesto semanal para gastos variables.',
        '📊 Registra todos tus gastos, incluso los pequeños.'
      ];
    }
  }
};

// Helper function to calculate strategy compatibility
function calculateCompatibility(current: number[], target: number[]): number {
  const diffs = current.map((c, i) => Math.abs(c - (target[i] || 0)));
  const maxDiff = 100;
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.max(0, Math.round(100 - (avgDiff / maxDiff) * 100));
}
