import { useCallback } from 'react';
import { Budget, User } from '../types';

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

interface UseBudgetHandlersParams {
  budgets: Budget[];
  user: User;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  toast: ToastContextType;
  closeBudgetModal: () => void;
}

/**
 * Hook para manejar operaciones de presupuestos (crear, editar, eliminar).
 * Extrae la lógica de handlers de presupuestos de App.tsx.
 *
 * @param params - Parámetros del hook (budgets, user, update/delete functions, toast, close modal)
 * @returns Handlers para guardar y eliminar presupuestos
 */
export function useBudgetHandlers({
  budgets,
  user,
  updateBudget,
  deleteBudget,
  toast,
  closeBudgetModal,
}: UseBudgetHandlersParams) {

  /**
   * Guarda un presupuesto (crea nuevo o actualiza existente)
   */
  const handleSaveBudget = useCallback(async (budgetData: Partial<Budget>) => {
    try {
      if (budgetData.id) {
        // Actualizar presupuesto existente
        const fullBudget: Budget = {
          ...budgets.find(b => b.id === budgetData.id)!,
          ...budgetData,
        } as Budget;
        await updateBudget(fullBudget);
        toast.success('Presupuesto actualizado', 'Los cambios se guardaron correctamente');
      } else {
        // Crear nuevo presupuesto
        const newBudget: Budget = {
          id: `budget_${Date.now()}`,
          ...budgetData,
          userId: user?.uid,
          spent: 0,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Budget;
        await updateBudget(newBudget);
        toast.success('Presupuesto creado', `Presupuesto "${budgetData.name}" creado exitosamente`);
      }
      closeBudgetModal();
    } catch (error: any) {
      toast.error('Error al guardar presupuesto', error.message);
    }
  }, [budgets, user, updateBudget, toast, closeBudgetModal]);

  /**
   * Elimina un presupuesto
   */
  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
      toast.success('Presupuesto eliminado', 'El presupuesto se eliminó correctamente');
    } catch (error: any) {
      toast.error('Error al eliminar', error.message);
    }
  }, [deleteBudget, toast]);

  return {
    handleSaveBudget,
    handleDeleteBudget,
  };
}
