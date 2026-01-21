/**
 * Custom hook for smart goal suggestions
 *
 * Provides functionality to fetch AI-powered goal suggestions
 * and convert them into actual goals.
 *
 * @returns Smart goals state and actions
 *
 * @example
 * ```typescript
 * function Component() {
 *   const { suggestions, loading, fetchSuggestions, acceptSuggestion } = useSmartGoals();
 *
 *   useEffect(() => {
 *     fetchSuggestions();
 *   }, []);
 *
 *   return (
 *     <div>
 *       {suggestions.map(s => (
 *         <SuggestionCard
 *           key={s.id}
 *           suggestion={s}
 *           onAccept={() => acceptSuggestion(s)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { smartGoalsService } from '../services/smartGoalsService';
import { storageService } from '../services/storageService';
import { useTransactions } from '../contexts/TransactionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import type { SmartGoalSuggestion, Goal } from '../types';

export const useSmartGoals = () => {
  const { user } = useAuth();
  const { transactions, goals } = useTransactions();
  const { settings } = useSettings();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const geminiApiKey = settings?.aiConfig?.userGeminiApiKey;

  const [suggestions, setSuggestions] = useState<SmartGoalSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches smart goal suggestions
   */
  const fetchSuggestions = useCallback(async () => {
    if (!user || !geminiApiKey) {
      setError('Usuario o API key no disponible');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate average income (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentTransactions = transactions.filter(
        tx => new Date(tx.date) >= threeMonthsAgo
      );

      const totalIncome = recentTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const avgMonthlyIncome = totalIncome / 3;

      // Generate suggestions
      const newSuggestions = await smartGoalsService.generateSuggestions(
        recentTransactions,
        goals,
        avgMonthlyIncome,
        geminiApiKey
      );

      setSuggestions(newSuggestions);

      if (newSuggestions.length === 0) {
        toastInfo('No se encontraron sugerencias en este momento');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toastError(`Error al generar sugerencias: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [user, geminiApiKey, transactions, goals, toastInfo, toastError]);

  /**
   * Accepts a suggestion and creates a real goal
   */
  const acceptSuggestion = useCallback(async (suggestion: SmartGoalSuggestion) => {
    if (!user) {
      toastError('Usuario no autenticado');
      return;
    }

    try {
      // Convert suggestion to goal
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        name: `${suggestion.type === 'reduce_spending' ? 'Reducir' : 'Aumentar'} ${suggestion.category}`,
        targetAmount: suggestion.potentialSavings * 12, // Annual savings
        currentAmount: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        icon: suggestion.type === 'reduce_spending' ? 'target' : 'piggy-bank',
        color: suggestion.priority === 'high' ? 'red' : suggestion.priority === 'medium' ? 'yellow' : 'green'
      };

      // Add to existing goals and save
      const updatedGoals = [...goals, newGoal];
      await storageService.saveGoals(updatedGoals);

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      toastSuccess('¡Meta creada exitosamente!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toastError(`Error al crear meta: ${message}`);
    }
  }, [user, goals, toastSuccess, toastError]);

  /**
   * Dismisses a suggestion
   */
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toastInfo('Sugerencia descartada');
  }, [toastInfo]);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    acceptSuggestion,
    dismissSuggestion
  };
};
