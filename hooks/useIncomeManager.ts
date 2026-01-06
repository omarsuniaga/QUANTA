import { useState, useEffect, useCallback } from 'react';
import { incomeService } from '../services/incomeService';
import { IncomeMonthlyDocument, IncomeFixedTemplate, FixedIncomeStatus, IncomeExtraItem } from '../types';

export const useIncomeManager = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [monthData, setMonthData] = useState<IncomeMonthlyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await incomeService.initializeMonth(selectedPeriod);
      setMonthData(doc);
    } catch (error) {
      console.error("Failed to load income data", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, refreshTrigger]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changePeriod = (delta: number) => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(newPeriod);
  };

  const toggleFixedStatus = async (item: { id: string, status: FixedIncomeStatus }) => {
    if (!monthData) return;
    const newStatus = item.status === 'received' ? 'pending' : 'received';
    
    // Optimistic Update
    const updatedFixedItems = monthData.fixedItems.map(i => 
      i.id === item.id ? { ...i, status: newStatus as FixedIncomeStatus, receivedAt: newStatus === 'received' ? Date.now() : null } : i
    );
    setMonthData({ ...monthData, fixedItems: updatedFixedItems });

    await incomeService.toggleFixedIncomeStatus(selectedPeriod, item.id, newStatus);
    setRefreshTrigger(prev => prev + 1); // Refresh to ensure sync
  };

  const updateFixedAmount = async (itemId: string, amount: number, saveAsDefault: boolean) => {
    await incomeService.updateFixedIncomeAmount(selectedPeriod, itemId, amount, { saveAsDefault });
    setRefreshTrigger(prev => prev + 1);
  };

  const addExtra = async (description: string, amount: number) => {
    await incomeService.addExtraIncome(selectedPeriod, { description, amount, date: Date.now() });
    setRefreshTrigger(prev => prev + 1);
  };
  
  const deleteExtra = async (id: string) => {
    await incomeService.deleteExtraIncome(selectedPeriod, id);
    setRefreshTrigger(prev => prev + 1);
  };

  const saveFixedTemplate = async (template: IncomeFixedTemplate) => {
    await incomeService.saveFixedTemplate(template);
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculations
  const totalFixedReceived = monthData?.fixedItems
    .filter(i => i.status === 'received')
    .reduce((sum, i) => sum + i.amount, 0) || 0;

  const totalExtras = monthData?.extras.reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const totalReceived = totalFixedReceived + totalExtras;
  
  const totalPending = monthData?.fixedItems
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0) || 0;

  return {
    selectedPeriod,
    monthData,
    loading,
    totals: {
      received: totalReceived,
      pending: totalPending,
      extras: totalExtras
    },
    actions: {
      changePeriod,
      toggleFixedStatus,
      updateFixedAmount,
      addExtra,
      deleteExtra,
      saveFixedTemplate,
      refresh: () => setRefreshTrigger(prev => prev + 1)
    }
  };
};
