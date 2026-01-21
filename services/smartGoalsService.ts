/**
 * Smart Goals Service
 *
 * Analyzes spending patterns and generates AI-powered goal suggestions
 * to help users improve their financial health.
 *
 * @module services/smartGoalsService
 */

import { aiCoachService } from './aiCoachService';
import type { Transaction, Goal, SmartGoalSuggestion, SpendingPattern } from '../types';

// Constants
const SPENDING_THRESHOLD_PERCENTAGE = 15; // Category spending > 15% of income is high
const TREND_CHANGE_THRESHOLD = 10; // % change to consider trend significant
const MAX_SUGGESTIONS = 3; // Maximum number of suggestions to return
const ANALYSIS_MONTHS = 3; // Number of months to analyze
const REDUCTION_TARGET = 0.15; // Target 15% reduction for fallback suggestions
const MIN_TRANSACTIONS_FOR_ANALYSIS = 5; // Minimum transactions needed

/**
 * Generates smart goal suggestions based on transaction history
 *
 * @param transactions - User's transaction history (last 3 months recommended)
 * @param currentGoals - User's existing goals
 * @param income - User's average monthly income
 * @param apiKey - Gemini API key
 * @returns Array of personalized goal suggestions
 *
 * @throws {Error} If parameters are invalid or insufficient data
 *
 * @example
 * ```typescript
 * const suggestions = await smartGoalsService.generateSuggestions(
 *   transactions,
 *   goals,
 *   5000,
 *   apiKey
 * );
 * ```
 */
export const smartGoalsService = {
  async generateSuggestions(
    transactions: Transaction[],
    currentGoals: Goal[],
    income: number,
    apiKey: string,
    customCategories?: any[]
  ): Promise<SmartGoalSuggestion[]> {
    // Validation
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Transactions must be an array');
    }

    if (transactions.length < MIN_TRANSACTIONS_FOR_ANALYSIS) {
      throw new Error(`Se requieren al menos ${MIN_TRANSACTIONS_FOR_ANALYSIS} transacciones para generar sugerencias`);
    }

    if (!income || income <= 0) {
      throw new Error('Ingreso debe ser mayor a 0');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key requerida');
    }

    // 1. Analyze spending patterns
    const patterns = this.analyzeSpendingPatterns(transactions, income);

    if (patterns.length === 0) {
      return []; // No patterns to analyze
    }

    // 2. Identify opportunities
    const opportunities = this.identifyOpportunities(patterns, currentGoals);

    if (opportunities.length === 0) {
      return []; // No opportunities found
    }

    // 3. Generate AI suggestions
    const suggestions = await this.generateAISuggestions(
      patterns,
      opportunities,
      income,
      apiKey,
      customCategories
    );

    return suggestions.slice(0, MAX_SUGGESTIONS);
  },

  /**
   * Analyzes spending patterns from transactions
   */
  analyzeSpendingPatterns(
    transactions: Transaction[],
    income: number
  ): SpendingPattern[] {
    // Filter only expenses
    const expenses = transactions.filter(tx => tx.type === 'expense');

    if (expenses.length === 0) {
      return [];
    }

    // Group by category
    const byCategory = expenses.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = [];
      }
      acc[tx.category].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // Calculate patterns
    const patterns = Object.entries(byCategory).map(([category, txs]) => {
      const total = txs.reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate number of months in data
      const months = this.calculateMonthsOfData(txs);
      const averageMonthly = total / months;
      const percentageOfIncome = income > 0 ? (averageMonthly / income) * 100 : 0;

      return {
        category,
        averageMonthly,
        trend: this.calculateTrend(txs),
        percentageOfIncome
      };
    });

    // Sort by highest spending first
    return patterns.sort((a, b) => b.averageMonthly - a.averageMonthly);
  },

  /**
   * Calculates number of months represented in transactions
   */
  calculateMonthsOfData(transactions: Transaction[]): number {
    if (transactions.length === 0) return 1;

    const dates = transactions.map(tx => new Date(tx.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const diffMs = maxDate - minDate;
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30); // Approximate month

    return Math.max(1, Math.ceil(diffMonths)) || ANALYSIS_MONTHS;
  },

  /**
   * Calculates trend for a category
   */
  calculateTrend(transactions: Transaction[]): 'increasing' | 'stable' | 'decreasing' {
    if (transactions.length < 2) return 'stable';

    // Sort by date
    const sorted = [...transactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Compare first half vs second half
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvg = firstHalf.reduce((sum, tx) => sum + tx.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, tx) => sum + tx.amount, 0) / secondHalf.length;

    if (firstAvg === 0) return 'stable';

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > TREND_CHANGE_THRESHOLD) return 'increasing';
    if (change < -TREND_CHANGE_THRESHOLD) return 'decreasing';
    return 'stable';
  },

  /**
   * Identifies opportunities for goal suggestions
   */
  identifyOpportunities(
    patterns: SpendingPattern[],
    currentGoals: Goal[]
  ): Array<{ type: string; category: string; reason: string }> {
    const opportunities: Array<{ type: string; category: string; reason: string }> = [];

    patterns.forEach(pattern => {
      // High spending category
      if (pattern.percentageOfIncome > SPENDING_THRESHOLD_PERCENTAGE) {
        opportunities.push({
          type: 'reduce_spending',
          category: pattern.category,
          reason: `${pattern.category} representa ${pattern.percentageOfIncome.toFixed(1)}% del ingreso`
        });
      }

      // Increasing trend
      if (pattern.trend === 'increasing') {
        opportunities.push({
          type: 'reduce_spending',
          category: pattern.category,
          reason: `Gastos en ${pattern.category} están aumentando`
        });
      }
    });

    // If no goals, suggest creating one
    if (currentGoals.length === 0) {
      opportunities.push({
        type: 'increase_savings',
        category: 'Ahorro de emergencia',
        reason: 'No tienes metas de ahorro activas'
      });
    }

    return opportunities.slice(0, 5); // Max 5 opportunities
  },

  /**
   * Generates AI-powered suggestions
   */
  async generateAISuggestions(
    patterns: SpendingPattern[],
    opportunities: Array<{ type: string; category: string; reason: string }>,
    income: number,
    apiKey: string,
    customCategories?: any[]
  ): Promise<SmartGoalSuggestion[]> {
    const prompt = `
Eres un asesor financiero experto. Analiza estos patrones de gasto y genera ${MAX_SUGGESTIONS} sugerencias ESPECÍFICAS de metas de ahorro.

## Datos del Usuario
- Ingreso mensual: $${income.toFixed(2)}
- Patrones de gasto (últimos ${ANALYSIS_MONTHS} meses):
${patterns.slice(0, 5).map(p => `  - ${aiCoachService.getCategoryDisplayName(p.category, customCategories)}: $${p.averageMonthly.toFixed(2)}/mes (${p.percentageOfIncome.toFixed(1)}% del ingreso, tendencia: ${p.trend})`).join('\n')}

## Oportunidades Detectadas
${opportunities.map(o => `- ${o.reason.replace(o.category, aiCoachService.getCategoryDisplayName(o.category, customCategories))}`).join('\n')}

## Tarea
Genera ${MAX_SUGGESTIONS} sugerencias de metas alcanzables con este formato JSON:

{
  "suggestions": [
    {
      "type": "reduce_spending" | "increase_savings" | "pay_debt",
      "category": "nombre de categoría o meta",
      "targetAmount": número (meta mensual/semanal en dólares),
      "currentAmount": número (gasto actual en dólares),
      "timeframe": "weekly" | "monthly",
      "potentialSavings": número (ahorro potencial mensual en dólares),
      "reasoning": "explicación corta y motivacional (max 100 chars)",
      "priority": "high" | "medium" | "low",
      "confidence": número 0-100
    }
  ]
}

Reglas importantes:
- Sé específico con montos (usa los datos reales proporcionados)
- Reasoning debe ser motivacional y positivo, nunca crítico
- Prioriza metas ALCANZABLES: reducción de 10-20%, nunca más de 30%
- No sugieras reducir categorías con muy poco gasto (< $50/mes)
- Confidence debe reflejar qué tan factible es la meta (alto gasto = alta confidence)
- Solo JSON válido, sin texto adicional antes o después
`;

    try {
      // Use existing aiCoachService infrastructure
      const stateHash = `smartgoals_${income}_${patterns.length}`;
      const response = await aiCoachService.generateRawAnalysis(
        'smartgoals_suggestions_v1',
        prompt,
        stateHash,
        apiKey,
        false
      );

      if (!response) {
        return this.generateFallbackSuggestions(patterns, income);
      }

      // Parse with error handling
      let parsed;
      try {
        parsed = JSON.parse(response);

        // Validate response structure
        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
          throw new Error('Invalid response structure: missing suggestions array');
        }

        if (parsed.suggestions.length === 0) {
          throw new Error('No suggestions in response');
        }

      } catch (parseError) {
        console.error('[smartGoalsService] Error parsing AI response:', parseError);
        console.error('[smartGoalsService] Raw response:', response);
        // Fall back to rule-based suggestions
        return this.generateFallbackSuggestions(patterns, income);
      }

      // Transform to SmartGoalSuggestion
      return parsed.suggestions.map((s: any) => ({
        id: crypto.randomUUID(),
        type: s.type || 'reduce_spending',
        category: aiCoachService.getCategoryDisplayName(s.category || 'Sin categoría', customCategories),
        currentAmount: Number(s.currentAmount) || 0,
        targetAmount: Number(s.targetAmount) || 0,
        timeframe: s.timeframe || 'monthly',
        potentialSavings: Number(s.potentialSavings) || 0,
        confidence: Math.min(100, Math.max(0, Number(s.confidence) || 50)),
        reasoning: String(s.reasoning || 'Recomendación personalizada').slice(0, 100),
        priority: s.priority || 'medium',
        createdAt: Date.now()
      })).slice(0, MAX_SUGGESTIONS);

    } catch (error) {
      console.error('[smartGoalsService] AI generation failed:', error);
      // Fallback to rule-based suggestions
      return this.generateFallbackSuggestions(patterns, income);
    }
  },

  /**
   * Fallback suggestions if AI fails
   * Generates a simple, rule-based suggestion
   */
  generateFallbackSuggestions(
    patterns: SpendingPattern[],
    income: number
  ): SmartGoalSuggestion[] {
    if (patterns.length === 0) return [];

    const highestCategory = patterns[0];
    const reduction = highestCategory.averageMonthly * REDUCTION_TARGET;

    return [{
      id: crypto.randomUUID(),
      type: 'reduce_spending',
      category: highestCategory.category,
      currentAmount: highestCategory.averageMonthly,
      targetAmount: highestCategory.averageMonthly - reduction,
      timeframe: 'monthly',
      potentialSavings: reduction,
      confidence: 75,
      reasoning: `Reducir gastos en ${highestCategory.category} puede ahorrarte $${reduction.toFixed(0)}/mes`,
      priority: 'high',
      createdAt: Date.now()
    }];
  }
};
