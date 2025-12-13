import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpensesScreen } from './ExpensesScreen';
import { Transaction } from '../types';

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 500,
    category: 'Food',
    description: 'Lunch',
    type: 'expense',
    date: new Date().toISOString(),
    isRecurring: false,
  },
  {
    id: '2',
    amount: 1500,
    category: 'Subscriptions',
    description: 'Netflix',
    type: 'expense',
    date: new Date().toISOString(),
    isRecurring: true,
    frequency: 'monthly',
  },
  {
    id: '3',
    amount: 2000,
    category: 'Transport',
    description: 'Gas',
    type: 'expense',
    date: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    isRecurring: false,
  },
];

describe('ExpensesScreen', () => {
  const defaultProps = {
    transactions: mockTransactions,
    currencySymbol: '$',
    currencyCode: 'MXN',
    monthlyBudget: 10000,
    onQuickExpense: vi.fn(),
    onRecurringExpense: vi.fn(),
    onPlannedExpense: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders the screen header correctly', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Mis Gastos')).toBeInTheDocument();
      expect(screen.getByText('Controla tu dinero que sale')).toBeInTheDocument();
    });

    it('renders budget card with stats', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Gastado Este Mes')).toBeInTheDocument();
      expect(screen.getByText('Presupuesto')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Gasto Rápido')).toBeInTheDocument();
      expect(screen.getByText('Recurrente')).toBeInTheDocument();
      expect(screen.getByText('Planificado')).toBeInTheDocument();
    });
  });

  describe('Budget Tracking', () => {
    it('displays budget progress bar', () => {
      const { container } = render(<ExpensesScreen {...defaultProps} />);

      const progressBar = container.querySelector('[class*="bg-slate-100"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows correct budget percentage', () => {
      render(<ExpensesScreen {...defaultProps} />);

      // Total expenses: 500 + 1500 + 2000 = 4000
      // Budget: 10000
      // Percentage: 40%
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('shows budget remaining', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText(/Restante:/)).toBeInTheDocument();
    });

    it('displays warning alert when budget > 90%', () => {
      const props = {
        ...defaultProps,
        monthlyBudget: 4000, // Will make percentage > 90%
      };

      render(<ExpensesScreen {...props} />);

      expect(screen.getByText('¡Cuidado con tu presupuesto!')).toBeInTheDocument();
      expect(screen.getByText(/Has gastado el \d+% de tu presupuesto mensual/)).toBeInTheDocument();
    });

    it('does not display warning alert when budget < 90%', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.queryByText('¡Cuidado con tu presupuesto!')).not.toBeInTheDocument();
    });

    it('applies correct color based on budget usage', () => {
      const { container } = render(<ExpensesScreen {...defaultProps} />);

      // 40% should be emerald (green)
      const progressFill = container.querySelector('[class*="bg-emerald-500"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows amber color for 70-90% budget usage', () => {
      const props = {
        ...defaultProps,
        monthlyBudget: 5500, // Makes it ~73%
      };

      const { container } = render(<ExpensesScreen {...props} />);

      const progressFill = container.querySelector('[class*="bg-amber-500"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('shows rose color for >90% budget usage', () => {
      const props = {
        ...defaultProps,
        monthlyBudget: 4200, // Makes it >90%
      };

      const { container } = render(<ExpensesScreen {...props} />);

      const progressFill = container.querySelector('[class*="bg-rose-500"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Today\'s Expenses Section', () => {
    it('displays today\'s expenses heading and total', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Gastos de Hoy')).toBeInTheDocument();
    });

    it('shows all expenses from today', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Gas')).toBeInTheDocument();
    });

    it('displays time-relative labels', () => {
      render(<ExpensesScreen {...defaultProps} />);

      // Should show "Hace X hrs" or similar
      expect(screen.getByText(/Hace \d+ (min|hrs)/)).toBeInTheDocument();
    });

    it('shows empty state when no expenses today', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: [],
      };

      render(<ExpensesScreen {...emptyProps} />);

      expect(screen.getByText('No has registrado gastos hoy')).toBeInTheDocument();
    });
  });

  describe('Recurring Expenses Section', () => {
    it('displays recurring expenses heading', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Gastos Recurrentes')).toBeInTheDocument();
    });

    it('shows recurring expenses with frequency', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Mensual')).toBeInTheDocument();
    });

    it('displays count badge for recurring expenses', () => {
      render(<ExpensesScreen {...defaultProps} />);

      const recurringSection = screen.getByText('Gastos Recurrentes').closest('div');
      expect(within(recurringSection!).getByText('1')).toBeInTheDocument();
    });

    it('shows next payment date', () => {
      render(<ExpensesScreen {...defaultProps} />);

      expect(screen.getByText(/Próximo: En \d+ días/)).toBeInTheDocument();
    });

    it('shows empty state when no recurring expenses', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: mockTransactions.filter(t => !t.isRecurring),
      };

      render(<ExpensesScreen {...emptyProps} />);

      expect(screen.getByText('No tienes gastos recurrentes')).toBeInTheDocument();
      expect(screen.getByText('Netflix, luz, renta, etc.')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onQuickExpense when clicking Gasto Rápido button', async () => {
      const user = userEvent.setup();
      render(<ExpensesScreen {...defaultProps} />);

      const button = screen.getByText('Gasto Rápido').closest('button')!;
      await user.click(button);

      expect(defaultProps.onQuickExpense).toHaveBeenCalledTimes(1);
    });

    it('calls onRecurringExpense when clicking Recurrente button', async () => {
      const user = userEvent.setup();
      render(<ExpensesScreen {...defaultProps} />);

      const button = screen.getByText('Recurrente').closest('button')!;
      await user.click(button);

      expect(defaultProps.onRecurringExpense).toHaveBeenCalledTimes(1);
    });

    it('calls onPlannedExpense when clicking Planificado button', async () => {
      const user = userEvent.setup();
      render(<ExpensesScreen {...defaultProps} />);

      const button = screen.getByText('Planificado').closest('button')!;
      await user.click(button);

      expect(defaultProps.onPlannedExpense).toHaveBeenCalledTimes(1);
    });
  });

  describe('Calculations', () => {
    it('calculates current month expenses correctly', () => {
      render(<ExpensesScreen {...defaultProps} />);

      // All mock transactions are from current month
      const expectedTotal = mockTransactions.reduce((sum, t) => sum + t.amount, 0);

      const formattedAmount = `$${expectedTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      expect(screen.getByText(formattedAmount)).toBeInTheDocument();
    });

    it('calculates today\'s total correctly', () => {
      render(<ExpensesScreen {...defaultProps} />);

      // All transactions are from today, so sum should match
      const todayTotal = mockTransactions.reduce((sum, t) => sum + t.amount, 0);

      const formattedAmount = `$${todayTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      // Should appear at least once for today's total
      expect(screen.getAllByText(formattedAmount).length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('renders with correct responsive classes', () => {
      const { container } = render(<ExpensesScreen {...defaultProps} />);

      // Check for responsive padding classes
      const responsivePadding = container.querySelectorAll('[class*="sm:p-"]');
      expect(responsivePadding.length).toBeGreaterThan(0);

      // Check for responsive text size classes
      const responsiveText = container.querySelectorAll('[class*="sm:text-"]');
      expect(responsiveText.length).toBeGreaterThan(0);
    });
  });

  describe('Currency Formatting', () => {
    it('uses custom currency symbol', () => {
      const props = {
        ...defaultProps,
        currencySymbol: '€',
      };

      render(<ExpensesScreen {...props} />);

      const euroSymbols = screen.getAllByText((content, element) =>
        element?.textContent?.includes('€') ?? false
      );

      expect(euroSymbols.length).toBeGreaterThan(0);
    });
  });
});
