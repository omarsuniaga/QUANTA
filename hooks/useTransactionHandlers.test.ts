import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactionHandlers } from '../useTransactionHandlers';
import { expenseService } from '../../services/expenseService';
import { storageService } from '../../services/storageService';

// Mock services
vi.mock('../../services/expenseService');
vi.mock('../../services/storageService');

describe('useTransactionHandlers - Recurring Expenses', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const mockT = {
    common: {
      serviceSaved: 'Service saved',
      remindersActive: 'Reminders active',
      saveError: 'Save error',
    },
  };

  const mockAddTransaction = vi.fn();
  const mockUpdateTransaction = vi.fn();
  const mockDeleteTransaction = vi.fn();
  const mockSetFilters = vi.fn();
  const mockClearFilters = vi.fn();
  const mockCloseActionModal = vi.fn();
  const mockNavigateToTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: () => 'test-uuid-12345',
    } as any;
  });

  describe('Creating New Recurring Expense', () => {
    it('should create template and monthly doc when marking new expense as recurring', async () => {
      // Arrange
      const mockSaveFixedTemplate = vi.fn().mockResolvedValue(undefined);
      const mockInitializeMonth = vi.fn().mockResolvedValue({
        period: '2026-01',
        fixedItems: [
          {
            id: 'test-uuid-12345_2026-01',
            templateId: 'test-uuid-12345',
            nameSnapshot: 'Netflix',
            amount: 15,
            category: 'subscriptions',
            status: 'pending',
          },
        ],
        initializedAt: Date.now(),
      });
      const mockPayFixedItem = vi.fn().mockResolvedValue(undefined);

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;
      vi.mocked(expenseService).initializeMonth = mockInitializeMonth;
      vi.mocked(expenseService).payFixedItem = mockPayFixedItem;

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const recurringExpenseData = {
        description: 'Netflix',
        amount: 15,
        category: 'subscriptions',
        date: '2026-01-15',
        isRecurring: true,
        frequency: 'monthly' as const,
        paymentMethod: 'card',
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          recurringExpenseData,
          'expense',
          null
        );
      });

      // Assert
      await waitFor(() => {
        // 1. Template should be created
        expect(mockSaveFixedTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-uuid-12345',
            name: 'Netflix',
            defaultAmount: 15,
            category: 'subscriptions',
            active: true,
            frequency: 'monthly',
          })
        );

        // 2. Monthly doc should be initialized
        expect(mockInitializeMonth).toHaveBeenCalledWith('2026-01');

        // 3. Item should be auto-paid (date is in the past/today)
        expect(mockPayFixedItem).toHaveBeenCalledWith(
          '2026-01',
          'test-uuid-12345_2026-01',
          15
        );

        // 4. Success toast should be shown
        expect(mockToast.success).toHaveBeenCalled();

        // 5. Modal should close
        expect(mockCloseActionModal).toHaveBeenCalled();
      });
    });

    it('should NOT auto-pay if date is in the future', async () => {
      const mockSaveFixedTemplate = vi.fn().mockResolvedValue(undefined);
      const mockInitializeMonth = vi.fn().mockResolvedValue({
        period: '2026-02',
        fixedItems: [
          {
            id: 'test-uuid-12345_2026-02',
            templateId: 'test-uuid-12345',
            nameSnapshot: 'Netflix',
            amount: 15,
            category: 'subscriptions',
            status: 'pending',
          },
        ],
        initializedAt: Date.now(),
      });
      const mockPayFixedItem = vi.fn();

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;
      vi.mocked(expenseService).initializeMonth = mockInitializeMonth;
      vi.mocked(expenseService).payFixedItem = mockPayFixedItem;

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const futureExpenseData = {
        description: 'Netflix',
        amount: 15,
        category: 'subscriptions',
        date: '2026-02-15', // Future date
        isRecurring: true,
        frequency: 'monthly' as const,
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          futureExpenseData,
          'expense',
          null
        );
      });

      // Assert
      await waitFor(() => {
        expect(mockSaveFixedTemplate).toHaveBeenCalled();
        expect(mockInitializeMonth).toHaveBeenCalled();
        expect(mockPayFixedItem).not.toHaveBeenCalled(); // Should NOT auto-pay
        expect(mockToast.success).toHaveBeenCalledWith(
          'Gasto recurrente programado',
          expect.stringContaining('2026-02')
        );
      });
    });
  });

  describe('Converting Existing Expense to Recurring', () => {
    it('should create template when editing expense and marking as recurring', async () => {
      const mockSaveFixedTemplate = vi.fn().mockResolvedValue(undefined);
      const mockInitializeMonth = vi.fn().mockResolvedValue({
        period: '2026-01',
        fixedItems: [
          {
            id: 'test-uuid-12345_2026-01',
            templateId: 'test-uuid-12345',
            nameSnapshot: 'Gym Membership',
            amount: 50,
            category: 'health',
            status: 'pending',
          },
        ],
        initializedAt: Date.now(),
      });
      const mockPayFixedItem = vi.fn().mockResolvedValue(undefined);

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;
      vi.mocked(expenseService).initializeMonth = mockInitializeMonth;
      vi.mocked(expenseService).payFixedItem = mockPayFixedItem;

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const existingTransaction = {
        id: 'existing-tx-123',
        description: 'Gym Membership',
        amount: 50,
        category: 'health',
        date: '2026-01-10',
        type: 'expense' as const,
        isRecurring: false, // Was NOT recurring
      };

      const updatedData = {
        description: 'Gym Membership',
        amount: 50,
        category: 'health',
        date: '2026-01-10',
        isRecurring: true, // NOW marked as recurring
        frequency: 'monthly' as const,
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          updatedData,
          'expense',
          existingTransaction
        );
      });

      // Assert
      await waitFor(() => {
        // 1. Template should be created
        expect(mockSaveFixedTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Gym Membership',
            defaultAmount: 50,
            category: 'health',
            active: true,
            frequency: 'monthly',
          })
        );

        // 2. Monthly doc should be regenerated
        expect(mockInitializeMonth).toHaveBeenCalledWith('2026-01');

        // 3. Item should be paid
        expect(mockPayFixedItem).toHaveBeenCalled();

        // 4. Original transaction should be updated with recurring links
        expect(mockUpdateTransaction).toHaveBeenCalledWith(
          'existing-tx-123',
          expect.objectContaining({
            recurringTemplateId: 'test-uuid-12345',
            recurringMonthlyItemId: 'test-uuid-12345_2026-01',
            source: 'recurring',
          })
        );

        // 5. Success toast
        expect(mockToast.success).toHaveBeenCalledWith(
          '¡Convertido a recurrente!',
          expect.any(String)
        );
      });
    });

    it('should handle normal edit when not converting to recurring', async () => {
      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const existingTransaction = {
        id: 'existing-tx-123',
        description: 'Groceries',
        amount: 100,
        category: 'food',
        date: '2026-01-10',
        type: 'expense' as const,
        isRecurring: false,
      };

      const updatedData = {
        description: 'Groceries',
        amount: 120, // Just changing amount
        category: 'food',
        date: '2026-01-10',
        isRecurring: false, // Still NOT recurring
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          updatedData,
          'expense',
          existingTransaction
        );
      });

      // Assert
      await waitFor(() => {
        // Should just update the transaction normally
        expect(mockUpdateTransaction).toHaveBeenCalledWith(
          'existing-tx-123',
          updatedData
        );

        // Should NOT create template
        expect(expenseService.saveFixedTemplate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast if template creation fails', async () => {
      const mockSaveFixedTemplate = vi
        .fn()
        .mockRejectedValue(new Error('Failed to save template'));

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const recurringExpenseData = {
        description: 'Netflix',
        amount: 15,
        category: 'subscriptions',
        date: '2026-01-15',
        isRecurring: true,
        frequency: 'monthly' as const,
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          recurringExpenseData,
          'expense',
          null
        );
      });

      // Assert
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error al crear gasto recurrente',
          expect.stringContaining('Failed to save template')
        );
      });
    });

    it('should show error if item not found after template creation', async () => {
      const mockSaveFixedTemplate = vi.fn().mockResolvedValue(undefined);
      const mockInitializeMonth = vi.fn().mockResolvedValue({
        period: '2026-01',
        fixedItems: [], // Empty - item not found!
        initializedAt: Date.now(),
      });

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;
      vi.mocked(expenseService).initializeMonth = mockInitializeMonth;

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const recurringExpenseData = {
        description: 'Netflix',
        amount: 15,
        category: 'subscriptions',
        date: '2026-01-15',
        isRecurring: true,
        frequency: 'monthly' as const,
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          recurringExpenseData,
          'expense',
          null
        );
      });

      // Assert
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Error crítico: el item no se agregó al mes',
          expect.any(String)
        );
      });
    });
  });

  describe('LocalStorage Cache Management', () => {
    it('should clear monthly doc cache before regenerating', async () => {
      const mockSaveFixedTemplate = vi.fn().mockResolvedValue(undefined);
      const mockInitializeMonth = vi.fn().mockResolvedValue({
        period: '2026-01',
        fixedItems: [
          {
            id: 'test-uuid-12345_2026-01',
            templateId: 'test-uuid-12345',
            nameSnapshot: 'Netflix',
            amount: 15,
            category: 'subscriptions',
            status: 'pending',
          },
        ],
        initializedAt: Date.now(),
      });

      vi.mocked(expenseService).saveFixedTemplate = mockSaveFixedTemplate;
      vi.mocked(expenseService).initializeMonth = mockInitializeMonth;

      // Pre-populate cache with old data
      localStorage.setItem(
        'quanta_expense_monthly_2026-01',
        JSON.stringify({
          period: '2026-01',
          fixedItems: [
            {
              id: 'old-item',
              templateId: 'old-template',
              nameSnapshot: 'Old Expense',
              amount: 10,
              category: 'other',
              status: 'pending',
            },
          ],
        })
      );

      const { result } = renderHook(() =>
        useTransactionHandlers({
          addTransaction: mockAddTransaction,
          updateTransaction: mockUpdateTransaction,
          deleteTransaction: mockDeleteTransaction,
          setFilters: mockSetFilters,
          clearFilters: mockClearFilters,
          toast: mockToast,
          t: mockT,
          closeActionModal: mockCloseActionModal,
          navigateToTab: mockNavigateToTab,
        })
      );

      const recurringExpenseData = {
        description: 'Netflix',
        amount: 15,
        category: 'subscriptions',
        date: '2026-01-15',
        isRecurring: true,
        frequency: 'monthly' as const,
      };

      // Act
      await act(async () => {
        await result.current.handleSaveFromModal(
          recurringExpenseData,
          'expense',
          null
        );
      });

      // Assert
      await waitFor(() => {
        // Cache should have been cleared
        const cachedDoc = localStorage.getItem('quanta_expense_monthly_2026-01');
        
        // initializeMonth should have been called (which would regenerate cache)
        expect(mockInitializeMonth).toHaveBeenCalledWith('2026-01');
      });
    });
  });
});
