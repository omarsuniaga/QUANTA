import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/expenseService';
import { ExpenseMonthlyDocument, ExpenseStatus, ExpenseMonthlyItem } from '../types';

export const useExpenseManager = (selectedPeriod: string) => {
  const [monthlyDoc, setMonthlyDoc] = useState<ExpenseMonthlyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await expenseService.initializeMonth(selectedPeriod);
      setMonthlyDoc(doc);
    } catch (error) {
      console.error("Failed to load monthly expenses", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for recurring expense creation events to auto-refresh
  useEffect(() => {
    const handleRecurringCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[useExpenseManager] Recurring expense created event received', customEvent.detail);
      // Refresh data to show the new item
      loadData();
    };

    window.addEventListener('expenseRecurringCreated', handleRecurringCreated);
    return () => window.removeEventListener('expenseRecurringCreated', handleRecurringCreated);
  }, [loadData]);

  const payItem = async (itemId: string, amount?: number) => {
    if (!monthlyDoc) return;
    // Optimistic update
    const previousDoc = { ...monthlyDoc };
    
    setMonthlyDoc(prev => {
      if (!prev) return null;
      return {
        ...prev,
        fixedItems: prev.fixedItems.map(item => 
          item.id === itemId 
            ? { ...item, status: 'paid' as ExpenseStatus, amount: amount ?? item.amount } 
            : item
        )
      };
    });

    try {
      await expenseService.payFixedItem(monthlyDoc.period, itemId, amount);
      await loadData(); // Reload to get transactionId and sync
    } catch (error) {
      console.error("Error paying item", error);
      setMonthlyDoc(previousDoc); // Rollback
    }
  };

  const undoPayItem = async (itemId: string) => {
    if (!monthlyDoc) return;
    const previousDoc = { ...monthlyDoc };

    setMonthlyDoc(prev => {
      if (!prev) return null;
      return {
        ...prev,
        fixedItems: prev.fixedItems.map(item => 
          item.id === itemId ? { ...item, status: 'pending' as ExpenseStatus, paymentDate: undefined } : item
        )
      };
    });

    try {
      await expenseService.undoPayFixedItem(monthlyDoc.period, itemId);
      await loadData();
    } catch (error) {
      console.error("Error undoing payment", error);
      setMonthlyDoc(previousDoc);
    }
  };

  const skipItem = async (itemId: string) => {
    if (!monthlyDoc) return;
    
    setMonthlyDoc(prev => {
      if (!prev) return null;
      return {
        ...prev,
        fixedItems: prev.fixedItems.map(item => 
          item.id === itemId ? { ...item, status: 'skipped' as ExpenseStatus } : item
        )
      };
    });

    try {
      await expenseService.skipFixedItem(monthlyDoc.period, itemId);
    } catch (error) {
      console.error("Error skipping item", error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      console.log('[deleteTemplate] Deleting template and related items:', templateId);
      
      // 1. Delete the template itself
      await expenseService.deleteFixedTemplate(templateId);
      
      // 2. Also remove any items from the CURRENT monthly document that reference this template
      if (monthlyDoc) {
        const updatedDoc = {
          ...monthlyDoc,
          fixedItems: monthlyDoc.fixedItems.filter(item => item.templateId !== templateId)
        };
        
        console.log('[deleteTemplate] Removing items from current month:', {
          before: monthlyDoc.fixedItems.length,
          after: updatedDoc.fixedItems.length,
          removedItems: monthlyDoc.fixedItems.filter(item => item.templateId === templateId).map(i => i.nameSnapshot)
        });
        
        // Update local state immediately for UI responsiveness
        setMonthlyDoc(updatedDoc);
        
        // Save the updated monthly doc
        await expenseService.saveMonthlyDoc(updatedDoc);
      }
      
      // 3. Refresh to ensure everything is in sync
      await loadData();
    } catch (error) {
      console.error("Error deleting template", error);
      throw error;
    }
  };

  const editTemplate = async (templateId: string, updates: Partial<any>) => {
    try {
      console.log('[editTemplate] Updating template:', { templateId, updates });
      
      // 1. Update the template
      await expenseService.updateFixedTemplate(templateId, updates);
      
      // 2. Also update any items from the CURRENT monthly document that reference this template
      if (monthlyDoc && updates.defaultAmount !== undefined) {
        const updatedDoc = {
          ...monthlyDoc,
          fixedItems: monthlyDoc.fixedItems.map(item => 
            item.templateId === templateId && item.status === 'pending'
              ? { ...item, amount: updates.defaultAmount }
              : item
          )
        };
        
        console.log('[editTemplate] Updating pending items in current month');
        
        // Update local state immediately
        setMonthlyDoc(updatedDoc);
        
        // Save the updated monthly doc
        await expenseService.saveMonthlyDoc(updatedDoc);
      }
      
     // 3. Refresh to show updated amounts/names
      await loadData();
    } catch (error) {
      console.error("Error updating template", error);
      throw error;
    }
  };

  // Calculate totals for UI
  const totals = {
    pending: monthlyDoc?.fixedItems
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0) || 0,
    
    paid: monthlyDoc?.fixedItems
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0) || 0,
    
    totalProjected: monthlyDoc?.fixedItems.reduce((sum, i) => sum + i.amount, 0) || 0
  };

  return {
    monthlyDoc,
    loading,
    actions: {
      payItem,
      undoPayItem,
      skipItem,
      deleteTemplate,
      editTemplate,
      refresh: loadData
    },
    totals
  };
};
