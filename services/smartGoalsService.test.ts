import { describe, it, expect, beforeEach, vi } from 'vitest';
import { smartGoalsService } from './smartGoalsService';
import type { Transaction, Goal } from '../types';

describe('smartGoalsService', () => {
  let mockTransactions: Transaction[];
  let mockGoals: Goal[];

  beforeEach(() => {
    // Setup mock data
    mockTransactions = [
      {
        id: '1',
        type: 'expense',
        category: 'Restaurantes',
        amount: 500,
        date: '2026-01-15',
        description: 'Cena',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '2',
        type: 'expense',
        category: 'Restaurantes',
        amount: 600,
        date: '2026-01-20',
        description: 'Almuerzo',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '3',
        type: 'expense',
        category: 'Transporte',
        amount: 100,
        date: '2026-01-10',
        description: 'Uber',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '4',
        type: 'expense',
        category: 'Entretenimiento',
        amount: 200,
        date: '2026-01-05',
        description: 'Cine',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '5',
        type: 'expense',
        category: 'Transporte',
        amount: 150,
        date: '2026-01-25',
        description: 'Gasolina',
        isRecurring: false,
        createdAt: Date.now()
      },
      {
        id: '6',
        type: 'income',
        category: 'Salary',
        amount: 5000,
        date: '2026-01-01',
        description: 'Salario',
        isRecurring: false,
        createdAt: Date.now()
      }
    ] as Transaction[];

    mockGoals = [
      {
        id: '1',
        name: 'Vacaciones',
        targetAmount: 5000,
        currentAmount: 1000,
        icon: 'plane',
        color: 'blue',
        priority: 'medium'
      }
    ] as Goal[];
  });

  describe('analyzeSpendingPatterns', () => {
    it('should group transactions by category', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      expect(patterns.length).toBeGreaterThan(0);
      const categories = patterns.map(p => p.category);
      expect(categories).toContain('Restaurantes');
      expect(categories).toContain('Transporte');
    });

    it('should calculate average monthly spending correctly', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      const restaurantes = patterns.find(p => p.category === 'Restaurantes');
      expect(restaurantes).toBeDefined();
      expect(restaurantes!.averageMonthly).toBeGreaterThan(0);
    });

    it('should calculate percentage of income correctly', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      const restaurantes = patterns.find(p => p.category === 'Restaurantes');
      expect(restaurantes).toBeDefined();
      expect(restaurantes!.percentageOfIncome).toBeGreaterThan(0);
      expect(restaurantes!.percentageOfIncome).toBeLessThan(100);
    });

    it('should handle empty array', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns([], 5000);
      expect(patterns).toEqual([]);
    });

    it('should filter out income transactions', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      const salaryPattern = patterns.find(p => p.category === 'Salary');
      expect(salaryPattern).toBeUndefined();
    });

    it('should sort patterns by highest spending first', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      for (let i = 0; i < patterns.length - 1; i++) {
        expect(patterns[i].averageMonthly).toBeGreaterThanOrEqual(
          patterns[i + 1].averageMonthly
        );
      }
    });
  });

  describe('calculateTrend', () => {
    it('should detect increasing trend', () => {
      const increasing: Transaction[] = [
        { amount: 100, date: '2026-01-01' } as Transaction,
        { amount: 150, date: '2026-01-15' } as Transaction,
        { amount: 200, date: '2026-01-30' } as Transaction
      ];

      const trend = smartGoalsService.calculateTrend(increasing);
      expect(trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const decreasing: Transaction[] = [
        { amount: 200, date: '2026-01-01' } as Transaction,
        { amount: 150, date: '2026-01-15' } as Transaction,
        { amount: 100, date: '2026-01-30' } as Transaction
      ];

      const trend = smartGoalsService.calculateTrend(decreasing);
      expect(trend).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const stable: Transaction[] = [
        { amount: 100, date: '2026-01-01' } as Transaction,
        { amount: 105, date: '2026-01-15' } as Transaction,
        { amount: 98, date: '2026-01-30' } as Transaction
      ];

      const trend = smartGoalsService.calculateTrend(stable);
      expect(trend).toBe('stable');
    });

    it('should handle single transaction', () => {
      const single: Transaction[] = [
        { amount: 100, date: '2026-01-01' } as Transaction
      ];

      const trend = smartGoalsService.calculateTrend(single);
      expect(trend).toBe('stable');
    });

    it('should handle zero first average', () => {
      const zeroFirst: Transaction[] = [
        { amount: 0, date: '2026-01-01' } as Transaction,
        { amount: 100, date: '2026-01-15' } as Transaction
      ];

      const trend = smartGoalsService.calculateTrend(zeroFirst);
      expect(trend).toBe('stable'); // Avoids division by zero
    });
  });

  describe('identifyOpportunities', () => {
    it('should identify high spending categories', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        1000 // Low income to make percentages high
      );

      const opportunities = smartGoalsService.identifyOpportunities(
        patterns,
        mockGoals
      );

      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities.some(o => o.type === 'reduce_spending')).toBe(true);
    });

    it('should identify increasing trends', () => {
      const increasingTx: Transaction[] = [
        {
          id: '1',
          type: 'expense',
          category: 'Restaurantes',
          amount: 100,
          date: '2026-01-01',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '2',
          type: 'expense',
          category: 'Restaurantes',
          amount: 200,
          date: '2026-01-15',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '3',
          type: 'expense',
          category: 'Restaurantes',
          amount: 300,
          date: '2026-01-30',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction
      ];

      const patterns = smartGoalsService.analyzeSpendingPatterns(
        increasingTx,
        5000
      );

      const opportunities = smartGoalsService.identifyOpportunities(
        patterns,
        mockGoals
      );

      expect(opportunities.some(o =>
        o.reason.includes('aumentando')
      )).toBe(true);
    });

    it('should suggest savings when no goals exist', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      const opportunities = smartGoalsService.identifyOpportunities(
        patterns,
        [] // No goals
      );

      expect(opportunities.some(o =>
        o.type === 'increase_savings'
      )).toBe(true);
    });

    it('should limit opportunities to 5', () => {
      // Create many high spending categories
      const manyTx: Transaction[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        type: 'expense',
        category: `Category${i}`,
        amount: 1000,
        date: '2026-01-15',
        isRecurring: false,
        createdAt: Date.now()
      })) as Transaction[];

      const patterns = smartGoalsService.analyzeSpendingPatterns(
        manyTx,
        2000 // Low income to make all high percentage
      );

      const opportunities = smartGoalsService.identifyOpportunities(
        patterns,
        mockGoals
      );

      expect(opportunities.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generateFallbackSuggestions', () => {
    it('should generate suggestion for highest spending category', () => {
      const patterns = smartGoalsService.analyzeSpendingPatterns(
        mockTransactions,
        5000
      );

      const suggestions = smartGoalsService.generateFallbackSuggestions(
        patterns,
        5000
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toHaveProperty('id');
      expect(suggestions[0]).toHaveProperty('category');
      expect(suggestions[0].type).toBe('reduce_spending');
      expect(suggestions[0].potentialSavings).toBeGreaterThan(0);
    });

    it('should handle empty patterns', () => {
      const suggestions = smartGoalsService.generateFallbackSuggestions(
        [],
        5000
      );

      expect(suggestions).toEqual([]);
    });

    it('should calculate 15% reduction', () => {
      const patterns = [
        {
          category: 'Test',
          averageMonthly: 1000,
          trend: 'stable' as const,
          percentageOfIncome: 20
        }
      ];

      const suggestions = smartGoalsService.generateFallbackSuggestions(
        patterns,
        5000
      );

      expect(suggestions[0].potentialSavings).toBe(150); // 15% of 1000
    });
  });

  describe('calculateMonthsOfData', () => {
    it('should calculate months from date range', () => {
      const txs: Transaction[] = [
        { date: '2026-01-01', amount: 100 } as Transaction,
        { date: '2026-03-31', amount: 100 } as Transaction
      ];

      const months = smartGoalsService.calculateMonthsOfData(txs);
      expect(months).toBeGreaterThanOrEqual(2);
      expect(months).toBeLessThanOrEqual(4);
    });

    it('should return 1 for empty array', () => {
      const months = smartGoalsService.calculateMonthsOfData([]);
      expect(months).toBe(1);
    });

    it('should return at least 1 month', () => {
      const txs: Transaction[] = [
        { date: '2026-01-01', amount: 100 } as Transaction,
        { date: '2026-01-02', amount: 100 } as Transaction
      ];

      const months = smartGoalsService.calculateMonthsOfData(txs);
      expect(months).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateSuggestions - validation', () => {
    it('should throw error if transactions is not an array', async () => {
      await expect(
        smartGoalsService.generateSuggestions(
          null as any,
          mockGoals,
          5000,
          'fake-api-key'
        )
      ).rejects.toThrow('Transactions must be an array');
    });

    it('should throw error if insufficient transactions', async () => {
      await expect(
        smartGoalsService.generateSuggestions(
          [mockTransactions[0]], // Only 1 transaction
          mockGoals,
          5000,
          'fake-api-key'
        )
      ).rejects.toThrow('Se requieren al menos 5 transacciones');
    });

    it('should throw error if income is zero', async () => {
      await expect(
        smartGoalsService.generateSuggestions(
          mockTransactions,
          mockGoals,
          0,
          'fake-api-key'
        )
      ).rejects.toThrow('Ingreso debe ser mayor a 0');
    });

    it('should throw error if income is negative', async () => {
      await expect(
        smartGoalsService.generateSuggestions(
          mockTransactions,
          mockGoals,
          -1000,
          'fake-api-key'
        )
      ).rejects.toThrow('Ingreso debe ser mayor a 0');
    });

    it('should throw error if apiKey is missing', async () => {
      await expect(
        smartGoalsService.generateSuggestions(
          mockTransactions,
          mockGoals,
          5000,
          ''
        )
      ).rejects.toThrow('API key requerida');
    });

    it('should return empty array if no expense patterns found', async () => {
      const incomeOnly: Transaction[] = [
        {
          id: '1',
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-01-01',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '2',
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-01-15',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '3',
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-01-30',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '4',
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-02-01',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction,
        {
          id: '5',
          type: 'income',
          category: 'Salary',
          amount: 5000,
          date: '2026-02-15',
          isRecurring: false,
          createdAt: Date.now()
        } as Transaction
      ];

      const result = await smartGoalsService.generateSuggestions(
        incomeOnly,
        mockGoals,
        5000,
        'fake-api-key'
      );

      expect(result).toEqual([]);
    });
  });
});
