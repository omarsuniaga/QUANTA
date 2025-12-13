import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeScreen } from './IncomeScreen';
import { Transaction } from '../types';

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 50000,
    category: 'Salary',
    description: 'Monthly Salary',
    type: 'income',
    date: new Date().toISOString(),
    isRecurring: true,
    frequency: 'monthly',
  },
  {
    id: '2',
    amount: 15000,
    category: 'Freelance',
    description: 'Web Project',
    type: 'income',
    date: new Date().toISOString(),
    isRecurring: false,
  },
  {
    id: '3',
    amount: 5000,
    category: 'Bonus',
    description: 'Performance Bonus',
    type: 'income',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isRecurring: false,
  },
];

describe('IncomeScreen', () => {
  const defaultProps = {
    transactions: mockTransactions,
    currencySymbol: '$',
    currencyCode: 'MXN',
    onAddFixedIncome: vi.fn(),
    onAddExtraIncome: vi.fn(),
    onEditTransaction: vi.fn(),
    onDeleteTransaction: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders the screen header correctly', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Mis Ingresos')).toBeInTheDocument();
      expect(screen.getByText('Gestiona tu dinero que entra')).toBeInTheDocument();
    });

    it('renders monthly stats card', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Este Mes')).toBeInTheDocument();
      expect(screen.getByText('Promedio Mensual (6 meses)')).toBeInTheDocument();
    });

    it('displays currency code', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('MXN')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Ingreso Fijo')).toBeInTheDocument();
      expect(screen.getByText('Ingreso Extra')).toBeInTheDocument();
    });
  });

  describe('Fixed Incomes Section', () => {
    it('displays fixed incomes correctly', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Ingresos Fijos (Recurrentes)')).toBeInTheDocument();
      expect(screen.getByText('Monthly Salary')).toBeInTheDocument();
    });

    it('shows frequency label for fixed incomes', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Mensual')).toBeInTheDocument();
    });

    it('displays count badge for fixed incomes', () => {
      render(<IncomeScreen {...defaultProps} />);

      const fixedIncomesSection = screen.getByText('Ingresos Fijos (Recurrentes)').closest('div');
      expect(within(fixedIncomesSection!).getByText('1')).toBeInTheDocument();
    });

    it('shows empty state when no fixed incomes', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: mockTransactions.filter(t => !t.isRecurring),
      };

      render(<IncomeScreen {...emptyProps} />);

      expect(screen.getByText('No tienes ingresos fijos registrados')).toBeInTheDocument();
      expect(screen.getByText('Los ingresos fijos se registran automáticamente cada mes')).toBeInTheDocument();
    });
  });

  describe('Extra Incomes Section', () => {
    it('displays extra incomes correctly', () => {
      render(<IncomeScreen {...defaultProps} />);

      expect(screen.getByText('Ingresos Variables (Extras)')).toBeInTheDocument();
      expect(screen.getByText('Web Project')).toBeInTheDocument();
      expect(screen.getByText('Performance Bonus')).toBeInTheDocument();
    });

    it('displays count badge for extra incomes', () => {
      render(<IncomeScreen {...defaultProps} />);

      const extraIncomesSection = screen.getByText('Ingresos Variables (Extras)').closest('div');
      expect(within(extraIncomesSection!).getByText('2')).toBeInTheDocument();
    });

    it('limits display to 10 extra incomes', () => {
      const manyIncomes: Transaction[] = Array.from({ length: 15 }, (_, i) => ({
        id: `extra-${i}`,
        amount: 1000,
        category: 'Freelance',
        description: `Extra ${i}`,
        type: 'income',
        date: new Date().toISOString(),
        isRecurring: false,
      }));

      const props = {
        ...defaultProps,
        transactions: manyIncomes,
      };

      render(<IncomeScreen {...props} />);

      expect(screen.getByText('Ver todos (15)')).toBeInTheDocument();
    });

    it('shows empty state when no extra incomes', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: mockTransactions.filter(t => t.isRecurring),
      };

      render(<IncomeScreen {...emptyProps} />);

      expect(screen.getByText('No tienes ingresos extras registrados')).toBeInTheDocument();
      expect(screen.getByText('Freelance, bonos, ventas, etc.')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onAddFixedIncome when clicking Ingreso Fijo button', async () => {
      const user = userEvent.setup();
      render(<IncomeScreen {...defaultProps} />);

      const button = screen.getByText('Ingreso Fijo').closest('button')!;
      await user.click(button);

      expect(defaultProps.onAddFixedIncome).toHaveBeenCalledTimes(1);
    });

    it('calls onAddExtraIncome when clicking Ingreso Extra button', async () => {
      const user = userEvent.setup();
      render(<IncomeScreen {...defaultProps} />);

      const button = screen.getByText('Ingreso Extra').closest('button')!;
      await user.click(button);

      expect(defaultProps.onAddExtraIncome).toHaveBeenCalledTimes(1);
    });

    it('calls onEditTransaction when clicking Editar button', async () => {
      const user = userEvent.setup();
      render(<IncomeScreen {...defaultProps} />);

      const editButton = screen.getByText('Editar').closest('button')!;
      await user.click(editButton);

      expect(defaultProps.onEditTransaction).toHaveBeenCalledTimes(1);
      expect(defaultProps.onEditTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' })
      );
    });
  });

  describe('Calculations', () => {
    it('calculates current month income correctly', () => {
      render(<IncomeScreen {...defaultProps} />);

      // Should include only incomes from current month (first two transactions)
      const expectedTotal = mockTransactions
        .filter(t => {
          const date = new Date(t.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() &&
                 date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Format currency and check if it appears
      const formattedAmount = `$${expectedTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      expect(screen.getByText(formattedAmount)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders with correct responsive classes', () => {
      const { container } = render(<IncomeScreen {...defaultProps} />);

      // Check for responsive padding classes
      const headers = container.querySelectorAll('[class*="sm:p-"]');
      expect(headers.length).toBeGreaterThan(0);

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

      render(<IncomeScreen {...props} />);

      const euroSymbols = screen.getAllByText((content, element) =>
        element?.textContent?.includes('€') ?? false
      );

      expect(euroSymbols.length).toBeGreaterThan(0);
    });
  });
});
