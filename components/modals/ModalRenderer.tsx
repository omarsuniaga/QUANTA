import React from 'react';
import { ActionModal } from '../ActionModal';
import { FilterModal } from '../FilterModal';
import { NotificationPermissionPrompt } from '../NotificationPermissionPrompt';
import { ModalState } from '../../hooks/useModalManager';

interface ModalRendererProps {
  // Modal states
  actionModal: ModalState;
  filterModal: { show: boolean };
  notificationPrompt: { show: boolean };

  // Handlers
  onSaveFromModal: (data: any, modalMode: 'income' | 'expense' | 'service', transactionToEdit: any) => Promise<void>;
  onApplyFilters: (filters: any) => void;
  onCloseModals: {
    action: () => void;
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
  filterModal,
  notificationPrompt,
  onSaveFromModal,
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
