import { Transaction, Category, Goal, DashboardStats, AIInsight, FinancialHealthMetrics } from '../types';
import { geminiRateLimiter } from './apiRateLimiter';
import { classifyByKeywords } from '../utils/categoryKeywords';
import { calculateFinancialHealthMetrics } from '../utils/financialMathCore';
import { aiGateway } from './aiGateway';
import { auth } from '../firebaseConfig';

// Store for user's API key
let userApiKey: string = '';
// Cache for the best available model ID
let resolvedModelId: string | null = null;

// Safely retrieve API key
const getApiKey = (): string => {
  if (userApiKey && userApiKey.trim() !== '') return userApiKey;
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) return storedKey;
  }
  if (typeof process !== 'undefined' && process.env.IS_PRODUCTION !== 'true') {
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined') return process.env.API_KEY;
  }
  return '';
};

// Function to set user's API key
export const setUserGeminiApiKey = (apiKey: string) => {
  userApiKey = apiKey;
  resolvedModelId = null; // Reset model cache when key changes
};

// Function to get current API key (for testing)
export const hasValidApiKey = (): boolean => {
  return getApiKey().length > 0;
};

// Get current user ID (CRITICAL for user isolation)
const getUserId = (): string | null => {
  return auth?.currentUser?.uid || null;
};

// Helper to generate cache keys with userId isolation
const generateCacheKey = (userId: string, prefix: string, data: Record<string, unknown>): string => {
  const hash = JSON.stringify(data).slice(0, 100);
  return `${userId}_${prefix}_${hash}`;
};

/**
 * PRODUCTION HARDENING: Dynamic Model Discovery via REST API
 * The stable SDK might not expose listModels directly for all environments.
 */
export const resolveBestModel = async (forceInit: boolean = false): Promise<string> => {
  if (resolvedModelId && !forceInit) return resolvedModelId;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API Key missing');

  try {
    // Implement model discovery via direct REST call to v1beta as per requirements
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.models || [];

    // Filter for models that support content generation
    const availableModels = models.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'));
    
    if (availableModels.length === 0) {
      throw new Error('No compatible Gemini models found for this API key');
    }

    /**
     * DYNAMIC SELECTION STRATEGY (Updated to avoid experimental models):
     * 1. 1.5-flash-8b (Latest high-speed)
     * 2. 1.5-flash (Standard, most stable)
     * 3. 1.5-pro (Fallback)
     * 99. 2.0-flash (AVOID - experimental, low quotas)
     */
    const getPriority = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('gemini-1.5-flash-8b')) return 1;
      if (n.includes('gemini-1.5-flash') && !n.includes('8b')) return 2;
      if (n.includes('gemini-1.5-pro')) return 3;
      // EVITAR modelos 2.0 experimentales
      if (n.includes('gemini-2.0')) return 99;
      return 50;
    };

    const bestModel = availableModels.sort((a: any, b: any) => getPriority(a.name) - getPriority(b.name))[0];
    
    resolvedModelId = bestModel.name;
    console.log(`[Gemini] Resolved best model: ${resolvedModelId}`);
    return resolvedModelId;
  } catch (error) {
    console.error('[Gemini] Model resolution failed:', error);
    // Anti-fragility fallback
    return 'models/gemini-1.5-flash';
  }
};

export const geminiService = {
  /**
   * Test if the current API key works via REST models endpoint
   */
  async testApiKey(apiKey?: string): Promise<{ success: boolean; message: string }> {
    const testKey = apiKey || getApiKey();
    if (!testKey || testKey.trim() === '') return { success: false, message: 'No se proporcionó una API key' };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
      if (response.ok) {
        const data = await response.json();
        return (data.models && data.models.length > 0)
          ? { success: true, message: '✅ API Key válida y funcional' }
          : { success: false, message: 'La API key es válida pero no tiene modelos asociados' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || response.statusText;
        throw new Error(message);
      }
    } catch (error: any) {
      const message = error.message || 'Error desconocido';
      console.error('API key test failed:', message);
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
   */
  async parseTransaction(input: string): Promise<Partial<Transaction> | null> {
    const localCategory = classifyByKeywords(input);
    const amountMatch = input.match(/(\d+([.,]\d+)?)/);
    const estimatedAmount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : undefined;

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

    const apiKey = getApiKey();
    if (!apiKey) return localCategory ? { category: localCategory, amount: estimatedAmount } : null;
    
    const cacheKey = generateCacheKey('parse', { input, date: new Date().toISOString().split('T')[0] });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const modelId = await resolveBestModel();
          const genAI = aiGateway.getClient(apiKey);
          const model = genAI.getGenerativeModel({ model: modelId });

          const prompt = `Extract transaction details from: "${input}". 
            Today: ${new Date().toISOString().split('T')[0]}.
            Known Categories: ${Object.values(Category).join(', ')}.
            Return JSON only.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          return JSON.parse(text || 'null');
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
   */
  async getFinancialInsights(
    transactions: Transaction[], 
    stats: DashboardStats,
    goals: Goal[],
    selectedPlanId?: string
  ): Promise<AIInsight[]> {
    const apiKey = getApiKey();
    if (!apiKey || transactions.length === 0) return [];

    const metrics: FinancialHealthMetrics = calculateFinancialHealthMetrics(
      transactions,
      stats.balance,
      stats.totalIncome,
      stats.totalExpense
    );

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

    const cacheKey = generateCacheKey('insights_v3', {
      balance: Math.round(stats.balance / 100),
      metricsHash: Math.round(metrics.savingsRate),
      planId: selectedPlanId
    });

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const modelId = await resolveBestModel();
          const genAI = aiGateway.getClient(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: modelId,
            generationConfig: { responseMimeType: "application/json" }
          });

          const prompt = `Act as "QUANTA CFO". Analyze these metrics and provide 3-4 strategic insights in JSON.
            Model: ${selectedPlanId || 'essentialist'}
            Metrics: ${JSON.stringify(contextData)}
            Language: Spanish (Neutral).`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          return JSON.parse(text || '[]');
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
   * Fetches banking commissions for a specific bank in the Dominican Republic.
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
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }

    try {
      return await geminiRateLimiter.execute(
        cacheKey,
        async () => {
          const modelId = await resolveBestModel();
          const genAI = aiGateway.getClient(apiKey);
          const model = genAI.getGenerativeModel({ 
            model: modelId,
            generationConfig: { responseMimeType: "application/json" }
          });

          const prompt = `Retrieve current banking fees for "${bankName}" in the Dominican Republic (DOP).
            Include 0.15% DGII tax in transfer commission.
            Return JSON only.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          const data = JSON.parse(text || 'null');
          if (data) {
            data.disclaimer = "Fees are estimated based on 2025 public bank tariffs.";
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
          return data;
        },
        { cacheDurationMs: 24 * 60 * 60 * 1000, priority: 'high' }
      );
    } catch (error) {
      console.error("Gemini Bank Fees Error:", error);
      return null;
    }
  }
};