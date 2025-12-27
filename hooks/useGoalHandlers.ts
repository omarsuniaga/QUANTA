import { useCallback } from 'react';
import { Goal, DashboardStats } from '../types';

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

interface TranslationObject {
  common: {
    delete?: string;
  };
}

interface UseGoalHandlersParams {
  goals: Goal[];
  stats: DashboardStats;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addTransaction: (tx: any) => Promise<void>;
  currencyCode: string;
  currencySymbol: string;
  toast: ToastContextType;
  t: TranslationObject;
  closeGoalModal: () => void;
}

/**
 * Hook para manejar operaciones de metas financieras.
 * Incluye lógica de guardar/eliminar metas y agregar/eliminar contribuciones.
 *
 * @param params - Parámetros del hook
 * @returns Handlers para gestionar metas y contribuciones
 */
export function useGoalHandlers({
  goals,
  stats,
  addGoal,
  updateGoal,
  deleteGoal,
  addTransaction,
  currencyCode,
  currencySymbol,
  toast,
  t,
  closeGoalModal,
}: UseGoalHandlersParams) {

  /**
   * Guarda una meta (crea nueva o actualiza existente)
   */
  const handleSaveGoal = useCallback(async (goal: Goal) => {
    const exists = goals.some(g => g.id === goal.id);
    if (exists) {
      await updateGoal(goal);
    } else {
      await addGoal(goal);
    }
    closeGoalModal();
  }, [goals, addGoal, updateGoal, closeGoalModal]);

  /**
   * Elimina una meta
   */
  const handleDeleteGoal = useCallback(async (id: string) => {
    await deleteGoal(id);
    closeGoalModal();
  }, [deleteGoal, closeGoalModal]);

  /**
   * Agrega una contribución a una meta
   * Valida fondos suficientes y crea una transacción de gasto tipo "savings"
   */
  const handleAddContribution = useCallback(async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // Validar fondos suficientes
    if (stats.balance < amount) {
      toast.error('Fondos insuficientes', `Necesitas ${amount.toLocaleString()} ${currencyCode} para hacer esta reservación`);
      return;
    }

    // Actualizar la meta con nueva contribución
    const updatedGoal: Goal = {
      ...goal,
      currentAmount: goal.currentAmount + amount,
      lastContributionDate: new Date().toISOString(),
      contributionHistory: [
        ...(goal.contributionHistory || []),
        { date: new Date().toISOString(), amount }
      ]
    };

    // Calcular próxima fecha de contribución
    const nextDate = new Date();
    switch (goal.contributionFrequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    updatedGoal.nextContributionDate = nextDate.toISOString();

    await updateGoal(updatedGoal);

    // Crear transacción para registrar este aporte
    await addTransaction({
      type: 'expense',
      category: 'savings' as any,
      amount: amount,
      description: `Aporte a meta: ${goal.name}`,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transferencia',
      isRecurring: false
    });

    toast.success('Aporte realizado', `Se han reservado ${amount.toLocaleString()} ${currencyCode} para "${goal.name}"`);
  }, [goals, stats.balance, addTransaction, updateGoal, toast, currencyCode]);

  /**
   * Elimina una contribución de una meta
   * Restaura el monto al balance disponible
   */
  const handleDeleteContribution = useCallback(async (goalId: string, contributionIndex: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.contributionHistory) return;

    const contribution = goal.contributionHistory[contributionIndex];
    if (!contribution) return;

    // Remover la contribución del historial
    const newHistory = goal.contributionHistory.filter((_, idx) => idx !== contributionIndex);

    // Actualizar la meta con monto reducido
    const updatedGoal: Goal = {
      ...goal,
      currentAmount: Math.max(0, goal.currentAmount - contribution.amount),
      contributionHistory: newHistory,
      lastContributionDate: newHistory.length > 0 ? newHistory[newHistory.length - 1].date : null
    };

    await updateGoal(updatedGoal);
    toast.success(
      t.common.delete || 'Eliminado',
      `Se ha eliminado el aporte de ${contribution.amount.toLocaleString()} ${currencyCode}`
    );
  }, [goals, updateGoal, toast, t, currencyCode]);

  return {
    handleSaveGoal,
    handleDeleteGoal,
    handleAddContribution,
    handleDeleteContribution,
  };
}
