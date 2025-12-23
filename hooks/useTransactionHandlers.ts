import { useCallback } from 'react';
import { Transaction, TransactionInput, TransactionUpdate, TransactionFilters, TransactionModalData, Subscription } from '../types';
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
  addTransaction: (tx: TransactionInput) => Promise<Transaction | null>;
  updateTransaction: (id: string, tx: TransactionUpdate) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  setFilters: (filters: TransactionFilters) => void;
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
    data: TransactionModalData,
    modalMode: 'income' | 'expense' | 'service',
    transactionToEdit: Transaction | null
  ) => {
    try {
      if (modalMode === 'service') {
        // Manejar suscripción (servicio)
        const sub = await storageService.addSubscription(data as Omit<Subscription, 'id'>);

        // Crear transacción recurrente para que aparezca en el balance
        const today = new Date();
        // Calcular próxima fecha de cobro
        let chargeDate = new Date(today.getFullYear(), today.getMonth(), data.chargeDay || 1);
        // Si ya pasó este mes, usar el próximo
        if (chargeDate < today) {
          chargeDate = new Date(today.getFullYear(), today.getMonth() + 1, data.chargeDay || 1);
        }

        const transactionData: TransactionInput = {
          type: 'expense' as const,
          amount: data.amount!,
          category: data.category || 'Services',
          description: data.name || '',
          date: chargeDate.toISOString().split('T')[0],
          isRecurring: true,
          frequency: data.frequency || 'monthly',
          paymentMethod: data.paymentMethod || 'cash',
          paymentMethodId: data.paymentMethod || 'cash',
          paymentMethodType: 'cash',
          commissionAmount: 0,
          notes: data.notes || '',
        };

        await addTransaction(transactionData);
        toast.success(t.common.serviceSaved, `${data.name} - ${t.common.remindersActive}`);
      } else {
        // Manejar transacción normal (income/expense)
        if (transactionToEdit) {
          // Editar transacción existente
          await updateTransaction(transactionToEdit.id, data as TransactionUpdate);
        } else {
          // Crear nueva transacción
          await addTransaction(data as TransactionInput);
        }
      }
      closeActionModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t.common.saveError, message);
    }
  }, [addTransaction, updateTransaction, toast, t, closeActionModal]);

  /**
   * Prepara una transacción para edición
   * Abre el modal con los datos pre-cargados
   */
  const handleEditTransaction = useCallback((
    transaction: Transaction,
    openActionModal: (mode: 'income' | 'expense' | 'service', initialValues?: Partial<TransactionInput>, transactionToEdit?: Transaction) => void
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
