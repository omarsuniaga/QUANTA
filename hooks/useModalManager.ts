import { useState, useCallback } from 'react';
import { Goal, Promo, Budget, Transaction, TransactionModalData } from '../types';

export interface ModalState {
  show: boolean;
  mode?: 'income' | 'expense' | 'service';
  initialValues?: TransactionModalData;
  editingItem?: Transaction;
}

/**
 * Gestiona el estado de todos los modales de la aplicación.
 * Incluye modales simples (filter, notification prompt) y modales con datos (action, goal, promo, budget).
 *
 * @returns Objeto con estados y funciones para abrir/cerrar cada modal
 */
export function useModalManager() {
  // Action Modal (Income/Expense/Service)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'income' | 'expense' | 'service'>('income');
  const [modalInitialValues, setModalInitialValues] = useState<any>(undefined);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Promo Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  // Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Filter Modal
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Notification Prompt
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Action Modal handlers
  const openActionModal = useCallback((mode: 'income' | 'expense' | 'service', initialValues?: TransactionModalData, transactionToEdit?: Transaction) => {
    setModalMode(mode);
    setModalInitialValues(initialValues);
    setTransactionToEdit(transactionToEdit || null);
    setShowModal(true);
    setShowMenu(false);
  }, []);

  const closeActionModal = useCallback(() => {
    setShowModal(false);
    setTransactionToEdit(null);
    setModalInitialValues(undefined);
  }, []);

  // Goal Modal handlers
  const openGoalModal = useCallback((goal?: Goal) => {
    setEditingGoal(goal || null);
    setShowGoalModal(true);
  }, []);

  const closeGoalModal = useCallback(() => {
    setShowGoalModal(false);
    setEditingGoal(null);
  }, []);

  // Promo Modal handlers
  const openPromoModal = useCallback((promo?: Promo) => {
    setEditingPromo(promo || null);
    setShowPromoModal(true);
  }, []);

  const closePromoModal = useCallback(() => {
    setShowPromoModal(false);
    setEditingPromo(null);
  }, []);

  // Budget Modal handlers
  const openBudgetModal = useCallback((budget?: Budget) => {
    setEditingBudget(budget || null);
    setShowBudgetModal(true);
  }, []);

  const closeBudgetModal = useCallback(() => {
    setShowBudgetModal(false);
    setEditingBudget(null);
  }, []);

  // Filter Modal handlers
  const openFilterModal = useCallback(() => setShowFilterModal(true), []);
  const closeFilterModal = useCallback(() => setShowFilterModal(false), []);

  // Notification Prompt handlers
  const showNotificationPromptModal = useCallback(() => setShowNotificationPrompt(true), []);
  const hideNotificationPrompt = useCallback(() => setShowNotificationPrompt(false), []);

  // Menu handlers
  const openMenu = useCallback(() => setShowMenu(true), []);
  const closeMenu = useCallback(() => setShowMenu(false), []);

  // Utility function to close all modals
  const closeAllModals = useCallback(() => {
    setShowModal(false);
    setShowGoalModal(false);
    setShowPromoModal(false);
    setShowBudgetModal(false);
    setShowFilterModal(false);
    setShowNotificationPrompt(false);
    setShowMenu(false);
    setTransactionToEdit(null);
    setEditingGoal(null);
    setEditingPromo(null);
    setEditingBudget(null);
    setModalInitialValues(undefined);
  }, []);

  return {
    // Action Modal
    actionModal: {
      show: showModal,
      mode: modalMode,
      initialValues: modalInitialValues,
      editingItem: transactionToEdit,
    },
    openActionModal,
    closeActionModal,

    // Goal Modal
    goalModal: {
      show: showGoalModal,
      editingItem: editingGoal,
    },
    openGoalModal,
    closeGoalModal,

    // Promo Modal
    promoModal: {
      show: showPromoModal,
      editingItem: editingPromo,
    },
    openPromoModal,
    closePromoModal,

    // Budget Modal
    budgetModal: {
      show: showBudgetModal,
      editingItem: editingBudget,
    },
    openBudgetModal,
    closeBudgetModal,

    // Filter Modal
    filterModal: {
      show: showFilterModal,
    },
    openFilterModal,
    closeFilterModal,

    // Notification Prompt
    notificationPrompt: {
      show: showNotificationPrompt,
    },
    showNotificationPrompt: showNotificationPromptModal,
    hideNotificationPrompt,

    // Menu
    menu: {
      show: showMenu,
    },
    openMenu,
    closeMenu,

    // Utility
    closeAllModals,
  };
}
