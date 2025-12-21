import { useCallback } from 'react';
import { Transaction } from '../types';
import { TabType } from './useAppNavigation';
import { storageService } from '../services/storageService';

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

interface TranslationObject {
  common: {
    serviceSaved: string;
    remindersActive: string;
    saveError: string;
  };
}

interface UseTransactionHandlersParams {
  addTransaction: (tx: any) => Promise<Transaction | null>;
  updateTransaction: (id: string, tx: any) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  toast: ToastContextType;
  t: TranslationObject;
  closeActionModal: () => void;
  navigateToTab: (tab: TabType) => void;
}

/**
 * Hook para manejar todas las operaciones relacionadas con transacciones.
 * Incluye guardar (income/expense/service), editar, eliminar y filtros.
 *
 * @param params - Parámetros del hook
 * @returns Handlers para gestionar transacciones
 */
export function useTransactionHandlers({
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setFilters,
  clearFilters,
  toast,
  t,
  closeActionModal,
  navigateToTab,
}: UseTransactionHandlersParams) {

  /**
   * Guarda una transacción desde el modal
   * Maneja 3 casos: income, expense, service (subscription)
   */
  const handleSaveFromModal = useCallback(async (
    data: any,
    modalMode: 'income' | 'expense' | 'service',
    transactionToEdit: Transaction | null
  ) => {
    try {
      if (modalMode === 'service') {
        // Manejar suscripción (servicio)
        const sub = await storageService.addSubscription(data);

        // Crear transacción recurrente para que aparezca en el balance
        const today = new Date();
        // Calcular próxima fecha de cobro
        let chargeDate = new Date(today.getFullYear(), today.getMonth(), data.chargeDay);
        // Si ya pasó este mes, usar el próximo
        if (chargeDate < today) {
          chargeDate = new Date(today.getFullYear(), today.getMonth() + 1, data.chargeDay);
        }

        const transactionData = {
          type: 'expense' as const,
          amount: data.amount,
          category: data.category || 'Services',
          description: data.name,
          date: chargeDate.toISOString().split('T')[0],
          isRecurring: true,
          frequency: data.frequency || 'monthly',
          paymentMethod: data.paymentMethod,
          subscriptionId: sub.id, // Link a la suscripción
        };

        await addTransaction(transactionData);
        toast.success(t.common.serviceSaved, `${data.name} - ${t.common.remindersActive}`);
      } else {
        // Manejar transacción normal (income/expense)
        if (transactionToEdit) {
          // Editar transacción existente
          await updateTransaction(transactionToEdit.id, data);
        } else {
          // Crear nueva transacción
          await addTransaction(data);
        }
      }
      closeActionModal();
    } catch (error: any) {
      toast.error(t.common.saveError, error.message);
    }
  }, [addTransaction, updateTransaction, toast, t, closeActionModal]);

  /**
   * Prepara una transacción para edición
   * Abre el modal con los datos pre-cargados
   */
  const handleEditTransaction = useCallback((
    transaction: Transaction,
    openActionModal: (mode: 'income' | 'expense' | 'service', initialValues?: any, transactionToEdit?: Transaction) => void
  ) => {
    openActionModal(
      transaction.type as 'income' | 'expense',
      transaction,
      transaction
    );
  }, []);

  /**
   * Elimina una transacción
   */
  const handleDeleteTransaction = useCallback(async (id: string) => {
    await deleteTransaction(id);
  }, [deleteTransaction]);

  /**
   * Aplica un filtro (categoría o fecha)
   * Para categorías, abre el perfil de categoría
   */
  const handleFilter = useCallback((
    type: 'category' | 'date',
    value: string,
    openCategoryProfile: (category: string) => void
  ) => {
    if (type === 'category') {
      // Abrir perfil de categoría en lugar de solo filtrar
      openCategoryProfile(value);
    } else if (type === 'date') {
      setFilters({ dateFrom: value, dateTo: value });
      navigateToTab('transactions');
    }
  }, [setFilters, navigateToTab]);

  /**
   * Limpia todos los filtros activos
   */
  const handleClearFilter = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return {
    handleSaveFromModal,
    handleEditTransaction,
    handleDeleteTransaction,
    handleFilter,
    handleClearFilter,
  };
}
