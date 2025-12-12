
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Goal, DashboardStats, AIInsight } from '../types';
import { geminiRateLimiter } from './apiRateLimiter';

// Store for user's API key
let userApiKey: string = '';

// Safely retrieve API key
const getApiKey = (): string => {
  // Priority 1: User's personal API key
  if (userApiKey && userApiKey.trim() !== '') {
    return userApiKey;
  }
  
  // Priority 2: Development environment key
  if (typeof process !== 'undefined' && process.env.IS_PRODUCTION !== 'true') {
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
      return process.env.API_KEY;
    }
  }
  
  return '';
};

// Function to set user's API key
export const setUserGeminiApiKey = (apiKey: string) => {
  userApiKey = apiKey;
};

// Function to get current API key (for testing)
export const hasValidApiKey = (): boolean => {
  return getApiKey().length > 0;
};

// Helper to generate cache keys
const generateCacheKey = (prefix: string, data: any): string => {
  const hash = JSON.stringify(data).slice(0, 100); // Simple hash
  return `${prefix}_${hash}`;
};

export const geminiService = {
  /**
   * Test if the current API key works
   */
  async testApiKey(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const testKey = apiKey || getApiKey();
    
    if (!testKey || testKey.trim() === '') {
      return { 
        success: false, 
        message: 'No se proporcionó una API key' 
      };
    }

    try {
      // Test sin rate limiter (es una petición de prueba)
      const testAi = new GoogleGenAI({ apiKey: testKey });
      const response = await testAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Responde solo con "OK" si puedes leer esto.',
      });
      
      const text = response.text;
      if (text && text.length > 0) {
        return { 
          success: true, 
          message: '✅ API Key válida y funcional' 
        };
      }
      
      return { 
        success: false, 
        message: 'La API key no generó una respuesta válida' 
      };
    } catch (error: any) {
      console.error("API Key test error:", error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      return { 
        success: false, 
        message: isRateLimit 
          ? '⚠️ API Key válida pero has excedido el límite de peticiones. Intenta en unos minutos.'
          : `❌ Error: ${error.message || 'API Key inválida'}` 
      };
    }
  },

  /**
   * Get rate limiter stats
   */
  getRateLimiterStats() {
    return geminiRateLimiter.getStats();
  },

  /**
   * Clear API cache
   */
  clearCache() {
    geminiRateLimiter.clearCache();
  },

  /**
   * Parses natural language input into a structured transaction object.
   */
  async parseTransaction(input: string): Promise<Partial<Transaction> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });
    const cacheKey = generateCacheKey('parse', { input, date: new Date().toISOString().split('T')[0] });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract transaction details from this text: "${input}". 
            Today's date is ${new Date().toISOString().split('T')[0]}.
            If year is missing, assume current year.
            Categorize into one of: ${Object.values(Category).join(', ')}.
            If unsure, use 'Other'.
            If the user mentions 'monthly', 'weekly', or 'yearly', set isRecurring to true and set frequency appropriately.
            Return JSON.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['income', 'expense'] },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  isRecurring: { type: Type.BOOLEAN },
                  frequency: { type: Type.STRING, enum: ['monthly', 'weekly', 'yearly'] }
                },
                required: ['type', 'amount', 'category', 'date']
              }
            }
          });
          
          const text = response.text;
          if (!text) return null;
          return JSON.parse(text);
        },
        { 
          cacheDurationMs: 60 * 1000, // 1 minuto para parsing (es específico del input)
          priority: 'high' // Alta prioridad para UX
        }
      );
    } catch (error) {
      console.error("Gemini Parse Error:", error);
      return null;
    }
  },

  /**
   * Generates structured financial insights (The AI Coach).
   */
  async getFinancialInsights(
    transactions: Transaction[], 
    stats: DashboardStats,
    goals: Goal[]
  ): Promise<AIInsight[]> {
    const apiKey = getApiKey();
    if (!apiKey || transactions.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey });

    // 1. Prepare Context (Summarized to save tokens)
    const recentTx = transactions.slice(0, 30); // Last 30 transactions
    
    // Calculate category spending
    const spendingByCategory: Record<string, number> = {};
    recentTx.filter(t => t.type === 'expense').forEach(t => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
    });

    const contextData = {
      currentBalance: stats.balance,
      totalIncome: stats.totalIncome,
      totalExpense: stats.totalExpense,
      topSpendingCategories: Object.entries(spendingByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: $${amt}`),
      activeGoals: goals.map(g => `${g.name} (${Math.round(g.currentAmount/g.targetAmount*100)}%)`),
    };

    // Cache key basado en datos resumidos (no en todas las transacciones)
    const cacheKey = generateCacheKey('insights', {
      balance: Math.round(stats.balance / 100) * 100, // Redondear para mejor cache hit
      income: Math.round(stats.totalIncome / 100) * 100,
      expense: Math.round(stats.totalExpense / 100) * 100,
      txCount: transactions.length,
      goalsCount: goals.length
    });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as "QUANTA Coach", a smart, sophisticated financial assistant.
            Analyze this financial data and provide 3 to 4 specific insights.
            
            Data: ${JSON.stringify(contextData)}
            
            Rules:
            1. 'alert': Use if expenses > income or if a category is unusually high.
            2. 'tip': Suggest specific ways to save based on the top categories.
            3. 'kudos': Praise progress on goals or income.
            4. 'prediction': Guess end-of-month status based on current balance.
            
            Output JSON format only. Language: Spanish (Neutral, Professional but friendly).`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['alert', 'tip', 'kudos', 'prediction'] },
                    title: { type: Type.STRING },
                    message: { type: Type.STRING },
                    action: { type: Type.STRING },
                    score: { type: Type.NUMBER, description: "Financial health score 0-100 based on analysis" }
                  },
                  required: ['type', 'title', 'message']
                }
              }
            }
          });

          const text = response.text;
          if (!text) return [];
          return JSON.parse(text) as AIInsight[];
        },
        {
          cacheDurationMs: 10 * 60 * 1000, // 10 minutos - insights no cambian rápido
          priority: 'normal'
        }
      );

    } catch (error: any) {
      console.error("Gemini Insight Error:", error);
      
      // Mensaje más descriptivo según el error
      const isRateLimit = error.message?.includes('429') || error.message?.includes('enfriamiento');
      
      return [{
        type: 'tip',
        title: isRateLimit ? 'Límite de API Alcanzado' : 'Servicio IA Temporalmente No Disponible',
        message: isRateLimit 
          ? 'Has alcanzado el límite de consultas. Los insights se actualizarán automáticamente en unos minutos.'
          : 'Por favor intenta analizar tus finanzas más tarde.',
        action: 'Reintentar'
      }];
    }
  }
};
