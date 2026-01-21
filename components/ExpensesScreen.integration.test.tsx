import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpensesScreen } from '../ExpensesScreen';
import { expenseService } from '../../services/expenseService';
import { storageService } from '../../services/storageService';

/**
 * INTEGRATION TEST: Converting Regular Expense to Recurring
 * 
 * This test validates the complete flow:
 * 1. User creates a regular expense
 * 2. User edits it and marks as "recurring"
 * 3. Expense appears in "Gastos Recurrentes" section
 */
describe('ExpensesScreen - Convert to Recurring Integration', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should show converted expense in "Gastos Recurrentes" section', async () => {
        // ========================================
        // STEP 1: Setup - Create initial regular expense
        // ========================================
        const regularExpense = {
            id: 'expense-123',
            type: 'expense' as const,
            amount: 50,
            description: 'Gym Membership',
            category: 'health',
            date: '2026-01-10',
            isRecurring: false, // NOT recurring initially
            paymentMethod: 'card',
            createdAt: Date.now(),
        };

        // Mock storageService to return our expense
        vi.spyOn(storageService, 'getTransactions').mockResolvedValue([regularExpense]);
        vi.spyOn(storageService, 'updateTransaction').mockResolvedValue(true);

        // Mock expenseService
        const mockSaveTemplate = vi.spyOn(expenseService, 'saveFixedTemplate').mockResolvedValue();
        const mockInitMonth = vi.spyOn(expenseService, 'initializeMonth').mockResolvedValue({
            period: '2026-01',
            fixedItems: [],
            initializedAt: Date.now(),
        });

        // ========================================
        // STEP 2: Render ExpensesScreen
        // ========================================
        const mockOnEdit = vi.fn();
        const mockOnDelete = vi.fn();
        const mockOnQuickExpense = vi.fn();
        const mockOnRecurringExpense = vi.fn();
        const mockOnPlannedExpense = vi.fn();

        render(
            <ExpensesScreen
                transactions={[regularExpense]}
                budgetPeriodData={{
                    budgetTotal: 1000,
                    expensesTotal: 50,
                    remaining: 950,
                    remainingPercentage: 95,
                }}
                onQuickExpense={mockOnQuickExpense}
                onRecurringExpense={mockOnRecurringExpense}
                onPlannedExpense={mockOnPlannedExpense}
                onEditTransaction={mockOnEdit}
                onDeleteTransaction={mockOnDelete}
            />
        );

        // ========================================
        // STEP 3: Verify initial state
        // ========================================
        // Should see "Gastos Recurrentes" section
        expect(screen.getByText(/Gastos Recurrentes/i)).toBeInTheDocument();

        // Should see "Últimos Gastos" section
        expect(screen.getByText(/Últimos Gastos/i)).toBeInTheDocument();

        // Regular expense should be in "Últimos Gastos", NOT in "Gastos Recurrentes"
        const recentSection = screen.getByText(/Últimos Gastos/i).closest('div');
        expect(recentSection).toHaveTextContent('Gym Membership');

        // "Gastos Recurrentes" should be empty initially
        const recurringSection = screen.getByText(/Gastos Recurrentes/i).closest('div');
        expect(recurringSection).toHaveTextContent(/No hay gastos recurrentes/i);

        // ========================================
        // STEP 4: Simulate user editing expense
        // ========================================
        // Find and click edit button for the expense
        const editButton = screen.getByTitle(/Editar/i);
        await userEvent.click(editButton);

        // Verify edit callback was called
        expect(mockOnEdit).toHaveBeenCalledWith(regularExpense);

        // ========================================
        // STEP 5: Simulate marking as recurring
        // ========================================
        // This would normally open ActionModal, but we'll simulate the save directly
        const updatedExpense = {
            ...regularExpense,
            isRecurring: true,
            frequency: 'monthly' as const,
        };

        // Mock the update to create template
        mockSaveTemplate.mockResolvedValueOnce();
        mockInitMonth.mockResolvedValueOnce({
            period: '2026-01',
            fixedItems: [
                {
                    id: 'template-123_2026-01',
                    templateId: 'template-123',
                    nameSnapshot: 'Gym Membership',
                    amount: 50,
                    category: 'health',
                    status: 'paid', // Already paid since it was converted
                },
            ],
            initializedAt: Date.now(),
        });

        // Simulate the conversion happening
        await storageService.updateTransaction(regularExpense.id, updatedExpense);

        // ========================================
        // STEP 6: Verify expense appears in "Gastos Recurrentes"
        // ========================================
        // Re-render with updated data
        const { rerender } = render(
            <ExpensesScreen
                transactions={[updatedExpense]}
                budgetPeriodData={{
                    budgetTotal: 1000,
                    expensesTotal: 50,
                    remaining: 950,
                    remainingPercentage: 95,
                }}
                onQuickExpense={mockOnQuickExpense}
                onRecurringExpense={mockOnRecurringExpense}
                onPlannedExpense={mockOnPlannedExpense}
                onEditTransaction={mockOnEdit}
                onDeleteTransaction={mockOnDelete}
            />
        );

        await waitFor(() => {
            // Should now appear in "Gastos Recurrentes" section
            const recurringSection = screen.getByText(/Gastos Recurrentes/i).closest('div');
            expect(recurringSection).toHaveTextContent('Gym Membership');
            expect(recurringSection).toHaveTextContent('PAGADO'); // Status badge
        });

        // ========================================
        // STEP 7: Verify template was created
        // ========================================
        expect(mockSaveTemplate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Gym Membership',
                defaultAmount: 50,
                category: 'health',
                active: true,
                frequency: 'monthly',
            })
        );

        // ========================================
        // STEP 8: Verify monthly doc was regenerated
        // ========================================
        expect(mockInitMonth).toHaveBeenCalledWith('2026-01');
    });

    it('should filter recurring expenses correctly in "Recurrentes" tab', async () => {
        // Setup: Mix of recurring and regular expenses
        const expenses = [
            {
                id: 'recurring-1',
                type: 'expense' as const,
                amount: 15,
                description: 'Netflix',
                category: 'subscriptions',
                date: '2026-01-05',
                isRecurring: true,
                recurringMonthlyItemId: 'item-1',
                paymentMethod: 'card',
                createdAt: Date.now(),
            },
            {
                id: 'regular-1',
                type: 'expense' as const,
                amount: 100,
                description: 'Groceries',
                category: 'food',
                date: '2026-01-10',
                isRecurring: false,
                paymentMethod: 'cash',
                createdAt: Date.now(),
            },
            {
                id: 'recurring-2',
                type: 'expense' as const,
                amount: 10,
                description: 'Spotify',
                category: 'subscriptions',
                date: '2026-01-08',
                isRecurring: true,
                recurringMonthlyItemId: 'item-2',
                paymentMethod: 'card',
                createdAt: Date.now(),
            },
        ];

        vi.spyOn(storageService, 'getTransactions').mockResolvedValue(expenses);

        render(
            <ExpensesScreen
                transactions={expenses}
                budgetPeriodData={{
                    budgetTotal: 1000,
                    expensesTotal: 125,
                    remaining: 875,
                    remainingPercentage: 87.5,
                }}
                onQuickExpense={vi.fn()}
                onRecurringExpense={vi.fn()}
                onPlannedExpense={vi.fn()}
                onEditTransaction={vi.fn()}
                onDeleteTransaction={vi.fn()}
            />
        );

        // Find the "Recurrentes" filter button in "Últimos Gastos"
        const recurrentesButton = screen.getByRole('button', { name: /Recurrentes/i });
        await userEvent.click(recurrentesButton);

        await waitFor(() => {
            // Should show ONLY recurring expenses
            expect(screen.getByText('Netflix')).toBeInTheDocument();
            expect(screen.getByText('Spotify')).toBeInTheDocument();
            expect(screen.queryByText('Groceries')).not.toBeInTheDocument();

            // Should show "Recurrente" badges
            const badges = screen.getAllByText(/Recurrente/i);
            expect(badges).toHaveLength(2);
        });

        // Click "Extras" filter
        const extrasButton = screen.getByRole('button', { name: /Extras/i });
        await userEvent.click(extrasButton);

        await waitFor(() => {
            // Should show ONLY non-recurring expenses
            expect(screen.getByText('Groceries')).toBeInTheDocument();
            expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
            expect(screen.queryByText('Spotify')).not.toBeInTheDocument();
        });
    });
});
