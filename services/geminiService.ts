
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Goal, DashboardStats, AIInsight } from '../types';

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
      return { 
        success: false, 
        message: `❌ Error: ${error.message || 'API Key inválida'}` 
      };
    }
  },

  /**
   * Parses natural language input into a structured transaction object.
   */
  async parseTransaction(input: string): Promise<Partial<Transaction> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });

    try {
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

    try {
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
        recentTransactionsSnippet: recentTx.map(t => `${t.date}: ${t.type} $${t.amount} (${t.category})`).join('; ')
      };

      // 2. Prompting
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
      const insights = JSON.parse(text) as AIInsight[];
      return insights;

    } catch (error) {
      console.error("Gemini Insight Error:", error);
      return [{
        type: 'tip',
        title: 'Servicio IA Temporalmente No Disponible',
        message: 'Por favor intenta analizar tus finanzas más tarde.',
        action: 'Reintentar'
      }];
    }
  }
};
