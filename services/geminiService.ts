import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Goal, DashboardStats, AIInsight, FinancialHealthMetrics } from '../types';
import { geminiRateLimiter } from './apiRateLimiter';
import { classifyByKeywords } from '../utils/categoryKeywords';
import { calculateFinancialHealthMetrics } from '../utils/financialMathCore';

// Store for user's API key
let userApiKey: string = '';

// Safely retrieve API key
const getApiKey = (): string => {
  if (userApiKey && userApiKey.trim() !== '') return userApiKey;
  if (typeof process !== 'undefined' && process.env.IS_PRODUCTION !== 'true') {
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined') return process.env.API_KEY;
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
const generateCacheKey = (prefix: string, data: Record<string, unknown>): string => {
  const hash = JSON.stringify(data).slice(0, 100);
  return `${prefix}_${hash}`;
};

export const geminiService = {
  /**
   * Test if the current API key works
   */
  async testApiKey(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const testKey = apiKey || getApiKey();
    if (!testKey || testKey.trim() === '') return { success: false, message: 'No se proporcionó una API key' };

    try {
      const testAi = new GoogleGenAI({ apiKey: testKey });
      const response = await testAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Responde solo con "OK" si puedes leer esto.',
      });
      
      const text = response.text;
      return (text && text.length > 0) 
        ? { success: true, message: '✅ API Key válida y funcional' }
        : { success: false, message: 'La API key no generó una respuesta válida' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI call failed:', message);
      const isRateLimit = message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
      return { 
        success: false, 
        message: isRateLimit 
          ? '⚠️ API Key válida pero has excedido el límite de peticiones.' 
          : `❌ Error: ${message || 'API Key inválida'}` 
      };
    }
  },

  async hasApiKey(): Promise<boolean> {
    return hasValidApiKey();
  },

  /**
   * Parses natural language input into a structured transaction object.
   * Hybrid Logic: Checks keywords locally first, falls back to AI.
   */
  async parseTransaction(input: string): Promise<Partial<Transaction> | null> {
    // 1. LAYER 2: Try Keyword-based classification (Local/Fast/Free)
    const localCategory = classifyByKeywords(input);
    
    // Extract amount from input if possible (simple regex for "number")
    const amountMatch = input.match(/(\d+([.,]\d+)?)/);
    const estimatedAmount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : undefined;

    // If we have both, and the input is simple, we could theoretically return early
    // but Gemini handles complex dates and descriptions better.
    // However, if the input is ONLY a keyword + amount, we save the API call.
    const words = input.split(' ');
    if (localCategory && estimatedAmount && words.length <= 3) {
      return {
        category: localCategory,
        amount: estimatedAmount,
        description: input,
        date: new Date().toISOString().split('T')[0],
        type: localCategory === Category.Salary || localCategory === Category.Freelance ? 'income' : 'expense'
      };
    }

    // 2. LAYER 3: Fallback to Gemini AI
    const apiKey = getApiKey();
    if (!apiKey) return localCategory ? { category: localCategory, amount: estimatedAmount } : null;
    
    const ai = new GoogleGenAI({ apiKey });
    const cacheKey = generateCacheKey('parse', { input, date: new Date().toISOString().split('T')[0] });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extract transaction details from: "${input}". 
            Today: ${new Date().toISOString().split('T')[0]}.
            Known Categories: ${Object.values(Category).join(', ')}.
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
          
          return JSON.parse(response.text || 'null');
        },
        { cacheDurationMs: 60 * 1000, priority: 'high' }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error("Gemini Parse Error:", message);
      return localCategory ? { category: localCategory, amount: estimatedAmount } : null;
    }
  },

  /**
   * Generates structured financial insights (The AI Coach).
   * Hybrid Logic: Uses MathCore for hard numbers, AI for qualitative advice.
   */
  async getFinancialInsights(
    transactions: Transaction[], 
    stats: DashboardStats,
    goals: Goal[],
    selectedPlanId?: string
  ): Promise<AIInsight[]> {
    const apiKey = getApiKey();
    if (!apiKey || transactions.length === 0) return [];

    // 1. LAYER 1: Hard Mathematics (Precise/Free)
    const metrics: FinancialHealthMetrics = calculateFinancialHealthMetrics(
      transactions,
      stats.balance,
      stats.totalIncome,
      stats.totalExpense
    );

    // 2. Prepare Context for AI
    const contextData: Record<string, unknown> = {
      ...metrics,
      currentBalance: stats.balance,
      activeGoals: goals.map(g => `${g.name}: ${Math.round((g.currentAmount/g.targetAmount)*100)}% complete`),
      topCategories: transactions
        .filter(t => t.type === 'expense')
        .slice(0, 20)
        .reduce((acc: Record<string, number>, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {})
    };

    const ai = new GoogleGenAI({ apiKey });
    const cacheKey = generateCacheKey('insights_v3', {
      balance: Math.round(stats.balance / 100),
      metricsHash: Math.round(metrics.savingsRate),
      planId: selectedPlanId
    });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as "QUANTA CFO", a sophisticated financial strategist.
            Current Financial Model: ${selectedPlanId || 'essentialist'}
            
            Analyze these PRECISE mathematical metrics and provide 3-4 strategic insights.
            
            Metrics: ${JSON.stringify(contextData)}
            
            Strategy Guidelines:
            - If runwayMonths < 3: Priority is Emergency Fund (alert).
            - If savingsRate < 20%: Suggest specific expense cuts based on categories (tip).
            - If debtToIncomeRatio > 35%: Focus on debt reduction (alert).
            - If metrics are good: Suggest investing or accelerating goals (kudos/tip).
            
            Tailor your advice to the "${selectedPlanId || 'essentialist'}" plan philosophy.
            Format: JSON only. Language: Spanish (Neutral, Professional).`,
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
                    score: { type: Type.NUMBER }
                  },
                  required: ['type', 'title', 'message']
                }
              }
            }
          });

          return JSON.parse(response.text || '[]');
        },
        { cacheDurationMs: 30 * 60 * 1000, priority: 'normal' }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Gemini API call failed:', message);
      return [];
    }
  },

  /**
   * Fetches banking commissions for a specific bank in the Dominican Republic (2025).
   */
  async fetchBankCommissions(bankName: string): Promise<{
    transferCommissionPercentage: number;
    cardCommissionPercentage: number;
    achFeeFixed: number;
    lbtrFeeFixed: number;
    disclaimer: string;
  } | null> {
    const apiKey = getApiKey();
    if (!apiKey || !bankName) return null;

    const cacheKey = `ai_bank_fees_${bankName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // 1. Check Development/Session Cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Retrieve current (2025) banking fees for "${bankName}" in the Dominican Republic.
            Context: The user is setting up this bank in their financial app.
            
            Find:
            1. Transfer Commission Percentage (MUST include the 0.15% DGII tax plus any bank-specific fee).
            2. Card Payment Commission Percentage (Merchant/User usage fee).
            3. ACH Transfer Fixed Fee (RD$ amount).
            4. LBTR Transfer Fixed Fee (RD$ amount).
            
            Return JSON only.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  transferCommissionPercentage: { type: Type.NUMBER },
                  cardCommissionPercentage: { type: Type.NUMBER },
                  achFeeFixed: { type: Type.NUMBER },
                  lbtrFeeFixed: { type: Type.NUMBER },
                  disclaimer: { type: Type.STRING }
                },
                required: ['transferCommissionPercentage', 'cardCommissionPercentage', 'achFeeFixed', 'lbtrFeeFixed']
              }
            }
          });

          const result = JSON.parse(response.text || 'null');
          if (result) {
            result.disclaimer = "Fees are estimated based on 2025 public bank tariffs.";
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          }
          return result;
        },
        { cacheDurationMs: 24 * 60 * 60 * 1000, priority: 'high' }
      );
    } catch (error) {
      console.error("Gemini Bank Fees Error:", error);
      return null;
    }
  }
};