/**
 * Smart Goals Suggestions Component
 *
 * Displays AI-powered goal suggestions to users based on their
 * spending patterns and financial behavior.
 *
 * @component
 */

import { useEffect } from 'react';
import { TrendingDown, TrendingUp, Target, Sparkles, X, Check } from 'lucide-react';
import { useSmartGoals } from '../hooks/useSmartGoals';
import type { SmartGoalSuggestion } from '../types';

export function SmartGoalsSuggestions() {
  const {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    acceptSuggestion,
    dismissSuggestion
  } = useSmartGoals();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="text-lg font-semibold">Analizando tus finanzas...</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Sugerencias Inteligentes</h3>
          <p className="text-sm text-gray-600">
            Basadas en tu comportamiento financiero
          </p>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => acceptSuggestion(suggestion)}
            onDismiss={() => dismissSuggestion(suggestion.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual suggestion card
 */
interface SuggestionCardProps {
  suggestion: SmartGoalSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const getIcon = () => {
    switch (suggestion.type) {
      case 'reduce_spending':
        return <TrendingDown className="w-5 h-5" />;
      case 'increase_savings':
        return <TrendingUp className="w-5 h-5" />;
      case 'pay_debt':
        return <Target className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (suggestion.priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className={`border rounded-lg p-4 relative ${getColor()}`}>
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded transition-colors"
        aria-label="Descartar sugerencia"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{suggestion.category}</h4>
          <p className="text-xs opacity-90">{suggestion.reasoning}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <span className="opacity-75">Ahorro potencial:</span>
          <p className="font-semibold">${suggestion.potentialSavings.toFixed(0)}/mes</p>
        </div>
        <div>
          <span className="opacity-75">Confianza:</span>
          <p className="font-semibold">{suggestion.confidence}%</p>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={onAccept}
        className="w-full py-2 bg-white hover:bg-opacity-80 rounded-lg
                   font-medium text-sm transition-colors flex items-center
                   justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Crear Meta
      </button>
    </div>
  );
}
