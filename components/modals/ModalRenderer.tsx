import React from 'react';
import { ActionModal } from '../ActionModal';
import { GoalModal } from '../GoalModal';
import { PromoModal } from '../PromoModal';
import { BudgetModal } from '../BudgetModal';
import { FilterModal } from '../FilterModal';
import { NotificationPermissionPrompt } from '../NotificationPermissionPrompt';
import { Goal, Promo, Budget } from '../../types';
import { ModalState } from '../../hooks/useModalManager';

interface ModalRendererProps {
  // Modal states
  actionModal: ModalState;
  goalModal: ModalState;
  promoModal: ModalState;
  budgetModal: ModalState;
  filterModal: { show: boolean };
  notificationPrompt: { show: boolean };

  // Handlers
  onSaveFromModal: (data: any, modalMode: 'income' | 'expense' | 'service', transactionToEdit: any) => Promise<void>;
  onSaveGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onSavePromo: (promo: Promo) => Promise<void>;
  onDeletePromo: (id: string) => Promise<void>;
  onSaveBudget: (budgetData: Partial<Budget>) => Promise<void>;
  onApplyFilters: (filters: any) => void;
  onCloseModals: {
    action: () => void;
    goal: () => void;
    promo: () => void;
    budget: () => void;
    filter: () => void;
    notificationPrompt: () => void;
  };

  // Data
  filters: any;
  currencySymbol: string;
  currencyCode: string;
  availableBalance: number;
}

/**
 * Componente que renderiza todos los modales de la aplicación.
 * Renderiza condicionalmente basándose en el estado de cada modal.
 *
 * @param props - estados de modales, handlers, data
 */
export const ModalRenderer: React.FC<ModalRendererProps> = ({
  actionModal,
  goalModal,
  promoModal,
  budgetModal,
  filterModal,
  notificationPrompt,
  onSaveFromModal,
  onSaveGoal,
  onDeleteGoal,
  onSavePromo,
  onDeletePromo,
  onSaveBudget,
  onApplyFilters,
  onCloseModals,
  filters,
  currencySymbol,
  currencyCode,
  availableBalance,
}) => {
  return (
    <>
      {/* Action Modal (Income/Expense/Service) */}
      {actionModal.show && (
        <ActionModal
          mode={actionModal.mode!}
          onClose={onCloseModals.action}
          onSave={(data) => onSaveFromModal(data, actionModal.mode!, actionModal.editingItem)}
          initialValues={actionModal.initialValues}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Goal Modal */}
      {goalModal.show && (
        <GoalModal
          goal={goalModal.editingItem as Goal | null}
          onClose={onCloseModals.goal}
          onSave={onSaveGoal}
          onDelete={onDeleteGoal}
          currencySymbol={currencySymbol}
          currencyCode={currencyCode}
          availableBalance={availableBalance}
        />
      )}

      {/* Promo Modal */}
      {promoModal.show && (
        <PromoModal
          promo={promoModal.editingItem as Promo | null}
          onClose={onCloseModals.promo}
          onSave={onSavePromo}
          onDelete={onDeletePromo}
        />
      )}

      {/* Budget Modal */}
      {budgetModal.show && (
        <BudgetModal
          isOpen={budgetModal.show}
          budget={budgetModal.editingItem as Budget | null}
          categories={['Food', 'Transport', 'Utilities', 'Subscriptions', 'Shopping', 'Health', 'Housing', 'Education', 'Entertainment', 'Other']}
          currencySymbol={currencySymbol}
          onClose={onCloseModals.budget}
          onSave={onSaveBudget}
        />
      )}

      {/* Filter Modal */}
      {filterModal.show && (
        <FilterModal
          filters={filters}
          onApply={(newFilters) => {
            onApplyFilters(newFilters);
            onCloseModals.filter();
          }}
          onClose={onCloseModals.filter}
        />
      )}

      {/* Notification Permission Prompt */}
      {notificationPrompt.show && (
        <NotificationPermissionPrompt
          onClose={onCloseModals.notificationPrompt}
        />
      )}
    </>
  );
};
