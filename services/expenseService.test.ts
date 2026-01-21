import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expenseService } from '../expenseService';

describe('expenseService - Recurring Expenses', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initializeMonth', () => {
    it('should create monthly doc with deterministic item IDs', async () => {
      // Arrange
      const templates = [
        {
          id: 'template-1',
          name: 'Netflix',
          defaultAmount: 15,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'template-2',
          name: 'Spotify',
          defaultAmount: 10,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Save templates to localStorage
      localStorage.setItem('quanta_expense_templates', JSON.stringify(templates));

      // Mock auth
      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      // Act
      const monthlyDoc = await expenseService.initializeMonth('2026-01');

      // Assert
      expect(monthlyDoc.period).toBe('2026-01');
      expect(monthlyDoc.fixedItems).toHaveLength(2);

      // CRITICAL: IDs should be deterministic (templateId_period)
      expect(monthlyDoc.fixedItems[0].id).toBe('template-1_2026-01');
      expect(monthlyDoc.fixedItems[1].id).toBe('template-2_2026-01');

      // Template IDs should match
      expect(monthlyDoc.fixedItems[0].templateId).toBe('template-1');
      expect(monthlyDoc.fixedItems[1].templateId).toBe('template-2');

      // All items should be pending
      expect(monthlyDoc.fixedItems[0].status).toBe('pending');
      expect(monthlyDoc.fixedItems[1].status).toBe('pending');
    });

    it('should skip cache when templates are provided', async () => {
      // Arrange
      const oldTemplates = [
        {
          id: 'old-template',
          name: 'Old Expense',
          defaultAmount: 5,
          category: 'other',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const newTemplates = [
        {
          id: 'new-template',
          name: 'New Expense',
          defaultAmount: 20,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Pre-populate cache with old monthly doc
      localStorage.setItem(
        'quanta_expense_monthly_2026-01',
        JSON.stringify({
          period: '2026-01',
          fixedItems: [
            {
              id: 'old-template_2026-01',
              templateId: 'old-template',
              nameSnapshot: 'Old Expense',
              amount: 5,
              category: 'other',
              status: 'pending',
            },
          ],
          initializedAt: Date.now(),
        })
      );

      // Save NEW templates to localStorage
      localStorage.setItem('quanta_expense_templates', JSON.stringify(newTemplates));

      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      // Act - Pass templates to FORCE regeneration
      const monthlyDoc = await expenseService.initializeMonth('2026-01', newTemplates);

      // Assert - Should use NEW templates, not cached doc
      expect(monthlyDoc.fixedItems).toHaveLength(1);
      expect(monthlyDoc.fixedItems[0].templateId).toBe('new-template');
      expect(monthlyDoc.fixedItems[0].nameSnapshot).toBe('New Expense');
      expect(monthlyDoc.fixedItems[0].amount).toBe(20);
    });

    it('should only include active templates', async () => {
      const templates = [
        {
          id: 'active-1',
          name: 'Active Expense',
          defaultAmount: 15,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'inactive-1',
          name: 'Inactive Expense',
          defaultAmount: 10,
          category: 'other',
          active: false, // Inactive
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      localStorage.setItem('quanta_expense_templates', JSON.stringify(templates));

      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      // Act
      const monthlyDoc = await expenseService.initializeMonth('2026-01');

      // Assert - Should only have active template
      expect(monthlyDoc.fixedItems).toHaveLength(1);
      expect(monthlyDoc.fixedItems[0].templateId).toBe('active-1');
    });
  });

  describe('saveFixedTemplate', () => {
    it('should save template to localStorage', async () => {
      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      const newTemplate = {
        id: 'new-template-123',
        name: 'Netflix',
        defaultAmount: 15,
        category: 'subscriptions',
        active: true,
        frequency: 'monthly' as const,
        dayOfMonth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      await expenseService.saveFixedTemplate(newTemplate);

      // Assert
      const saved = localStorage.getItem('quanta_expense_templates');
      expect(saved).toBeTruthy();
      
      const templates = JSON.parse(saved!);
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('new-template-123');
      expect(templates[0].name).toBe('Netflix');
    });

    it('should update existing template', async () => {
      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      const existingTemplate = {
        id: 'template-123',
        name: 'Netflix',
        defaultAmount: 15,
        category: 'subscriptions',
        active: true,
        frequency: 'monthly' as const,
        dayOfMonth: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save initial template
      localStorage.setItem('quanta_expense_templates', JSON.stringify([existingTemplate]));

      const updatedTemplate = {
        ...existingTemplate,
        defaultAmount: 20, // Changed amount
        updatedAt: Date.now(),
      };

      // Act
      await expenseService.saveFixedTemplate(updatedTemplate);

      // Assert
      const saved = localStorage.getItem('quanta_expense_templates');
      const templates = JSON.parse(saved!);
      
      expect(templates).toHaveLength(1); // Still only 1 template
      expect(templates[0].defaultAmount).toBe(20); // Updated amount
    });
  });

  describe('deleteFixedTemplate', () => {
    it('should remove template from localStorage', async () => {
      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      const templates = [
        {
          id: 'template-1',
          name: 'Netflix',
          defaultAmount: 15,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'template-2',
          name: 'Spotify',
          defaultAmount: 10,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      localStorage.setItem('quanta_expense_templates', JSON.stringify(templates));

      // Act
      await expenseService.deleteFixedTemplate('template-1');

      // Assert
      const saved = localStorage.getItem('quanta_expense_templates');
      const remaining = JSON.parse(saved!);
      
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('template-2');
    });

    it('should clear monthly docs cache after deletion', async () => {
      const mockAuth = {
        currentUser: { uid: 'test-user-123' },
      };
      vi.stubGlobal('auth', mockAuth);

      const templates = [
        {
          id: 'template-1',
          name: 'Netflix',
          defaultAmount: 15,
          category: 'subscriptions',
          active: true,
          frequency: 'monthly' as const,
          dayOfMonth: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      localStorage.setItem('quanta_expense_templates', JSON.stringify(templates));
      
      // Pre-populate monthly doc cache
      localStorage.setItem('quanta_expense_monthly_2026-01', JSON.stringify({ period: '2026-01' }));
      localStorage.setItem('quanta_expense_monthly_2026-02', JSON.stringify({ period: '2026-02' }));

      // Act
      await expenseService.deleteFixedTemplate('template-1');

      // Assert - Monthly caches should be cleared
      expect(localStorage.getItem('quanta_expense_monthly_2026-01')).toBeNull();
      expect(localStorage.getItem('quanta_expense_monthly_2026-02')).toBeNull();
    });
  });
});
