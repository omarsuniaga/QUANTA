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
      } else if (modalMode === 'expense' && data.isRecurring && !transactionToEdit) {
        // === RECURRING EXPENSE CREATION ===
        // Create ExpenseFixedTemplate so it appears in "Recurring Expenses" section
        
        try {
          const { expenseService } = await import('../services/expenseService');
          
          // Generate ID (fallback for older browsers)
          const templateId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newTemplate: any = {
            id: templateId,
            name: data.description || 'Gasto Recurrente',
            defaultAmount: data.amount || 0,
            category: data.category || 'Other',
            active: true,
            frequency: data.frequency || 'monthly',
            dayOfMonth: data.date ? new Date(data.date).getDate() : 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          // Save template - updates localStorage immediately
          await expenseService.saveFixedTemplate(newTemplate);
          
          console.log('[DEBUG] Template saved to localStorage');
          
          // Determine period from date
          const txDate = data.date ? new Date(data.date) : new Date();
          const period = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          
          // CRITICAL FIX: Read templates DIRECTLY from localStorage
          const LS_PREFIX = 'quanta_';
          const templatesKey = `${LS_PREFIX}expense_templates`;
          const templatesRaw = localStorage.getItem(templatesKey);
          const allTemplates = templatesRaw ? JSON.parse(templatesRaw) : [];
          
          console.log('[DEBUG] Templates from localStorage:', {
            count: allTemplates.length,
            templateIds: allTemplates.map((t: any) => t.id),
            ourTemplateExists: allTemplates.some((t: any) => t.id === templateId)
          });
          
          // Verify our template exists
          if (!allTemplates.some((t: any) => t.id === templateId)) {
            throw new Error('Template not found in localStorage - saveFixedTemplate failed');
          }
          
          // Clear monthly doc cache
          localStorage.removeItem(`${LS_PREFIX}expense_monthly_${period}`);
          
          // PASS templates directly to avoid Firestore latency
          const monthlyDoc = await expenseService.initializeMonth(period, allTemplates);
          
          console.log('[DEBUG] Monthly doc created:', {
            period,
            itemCount: monthlyDoc.fixedItems.length,
            itemTemplateIds: monthlyDoc.fixedItems.map(i => i.templateId),
            ourItemExists: monthlyDoc.fixedItems.some(i => i.templateId === templateId)
          });

          // AUTO-PAY LOGIC
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          txDate.setHours(0, 0, 0, 0);
          const shouldAutoPay = txDate <= today;
          
          if (shouldAutoPay) {
            const item = monthlyDoc.fixedItems.find(i => i.templateId === newTemplate.id);
            if (item) {
              console.log('[DEBUG] Auto-paying item:', item.id);
              
              // Pay the item
              await expenseService.payFixedItem(period, item.id, data.amount);
              
              // Update payment method
              if (data.paymentMethodId && data.paymentMethodId !== 'cash') {
                const transactions = await storageService.getTransactions();
                const newTx = transactions.find(t => 
                  t.recurringMonthlyItemId === item.id && 
                  t.recurringTemplateId === newTemplate.id
                );
                if (newTx) {
                  await storageService.updateTransaction(newTx.id, {
                    paymentMethodId: data.paymentMethodId,
                    paymentMethodType: data.paymentMethodType,
                    bankTransferType: data.bankTransferType
                  });
                }
              }
              
              // Dispatch event to refresh ExpensesScreen
              window.dispatchEvent(new CustomEvent('expenseRecurringCreated', { detail: { period } }));
              
              toast.success('¡Gasto recurrente creado!', `${data.description} registrado y pagado`);
            } else {
              console.error('[CRITICAL] Item not found in monthly doc', { 
                searchedTemplateId: templateId,
                availableTemplateIds: monthlyDoc.fixedItems.map(i => i.templateId),
                fullMonthlyDoc: monthlyDoc
              });
              toast.error('Error crítico: el item no se agregó al mes', 'Revisa la consola (F12)');
            }
          } else {
            // Dispatch event even for future items
            window.dispatchEvent(new CustomEvent('expenseRecurringCreated', { detail: { period } }));
            toast.success('Gasto recurrente programado', `Aparecerá como pendiente en ${period}`);
          }

        } catch (e: any) {
          console.error("[ERROR] Creating recurring expense:", e);
          toast.error("Error al crear gasto recurrente", e.message || 'Revisa la consola (F12)');
        }

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
