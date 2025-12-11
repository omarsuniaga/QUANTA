import { Transaction, Subscription } from '../types';

export const notificationService = {
  requestPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },

  getUpcomingTransactions: (transactions: Transaction[], daysThreshold = 3): { transaction: Transaction, nextDate: Date }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);

    return transactions
      .filter(t => t.isRecurring && t.frequency && t.type === 'expense')
      .map(t => ({ transaction: t, nextDate: calculateNextDueDate(t.date, t.frequency!) }))
      .filter(({ nextDate }) => nextDate >= today && nextDate <= thresholdDate)
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  },

  /**
   * Get ALL recurring payments between today and a target date (usually end of month)
   * This properly handles weekly payments that occur multiple times in a month
   */
  getAllRecurringPaymentsUntil: (transactions: Transaction[], endDate: Date): { transaction: Transaction, date: Date, amount: number }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results: { transaction: Transaction, date: Date, amount: number }[] = [];
    
    const recurringExpenses = transactions.filter(t => t.isRecurring && t.frequency && t.type === 'expense');
    
    for (const t of recurringExpenses) {
      // Get all occurrences of this transaction until endDate
      const occurrences = getAllOccurrencesUntil(t.date, t.frequency!, today, endDate);
      
      for (const occurrenceDate of occurrences) {
        results.push({
          transaction: t,
          date: occurrenceDate,
          amount: t.amount
        });
      }
    }
    
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  /**
   * Get ALL subscription payments between today and a target date
   * Subscriptions are stored separately and need special handling
   */
  getSubscriptionPaymentsUntil: (subscriptions: Subscription[], endDate: Date): { subscription: Subscription, date: Date, amount: number }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results: { subscription: Subscription, date: Date, amount: number }[] = [];
    
    const activeSubscriptions = subscriptions.filter(s => s.isActive !== false);
    
    for (const sub of activeSubscriptions) {
      // Calculate all occurrences based on chargeDay and frequency
      const occurrences = getSubscriptionOccurrencesUntil(sub, today, endDate);
      
      for (const occurrenceDate of occurrences) {
        results.push({
          subscription: sub,
          date: occurrenceDate,
          amount: sub.amount
        });
      }
    }
    
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  sendBrowserNotification: (count: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FlowFinance: Recordatorio de Pago', {
        body: `Tienes ${count} pagos próximos a vencer en los siguientes 3 días.`,
      });
    }
  }
};

/**
 * Get all occurrences of a subscription payment between startRange and endRange
 */
function getSubscriptionOccurrencesUntil(sub: Subscription, startRange: Date, endRange: Date): Date[] {
  const occurrences: Date[] = [];
  const chargeDay = Math.min(sub.chargeDay, 28); // Normalize to avoid month overflow issues
  
  // Start from the current month
  let current = new Date(startRange.getFullYear(), startRange.getMonth(), chargeDay, 12, 0, 0);
  
  // If we already passed the charge day this month, check if it's still within range
  if (current < startRange) {
    // Move to next period
    current = advanceByFrequency(current, sub.frequency);
  }
  
  // Collect all occurrences until endRange
  let safety = 0;
  while (current <= endRange && safety < 100) {
    safety++;
    if (current >= startRange) {
      occurrences.push(new Date(current));
    }
    current = advanceByFrequency(current, sub.frequency);
  }
  
  return occurrences;
}

/**
 * Get all occurrences of a recurring payment between startRange and endRange
 */
function getAllOccurrencesUntil(startDateStr: string, frequency: string, startRange: Date, endRange: Date): Date[] {
  const [year, month, day] = startDateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day, 12, 0, 0);
  
  const occurrences: Date[] = [];
  let current = new Date(start);
  
  // First, advance to the first occurrence that is >= startRange
  let safety = 0;
  while (current < startRange && safety < 1000) {
    safety++;
    current = advanceByFrequency(current, frequency);
  }
  
  // Now collect all occurrences until endRange
  safety = 0;
  while (current <= endRange && safety < 100) {
    safety++;
    if (current >= startRange) {
      occurrences.push(new Date(current));
    }
    current = advanceByFrequency(current, frequency);
  }
  
  return occurrences;
}

function advanceByFrequency(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'semanal':
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'mensual':
    case 'monthly':
      const currentDay = next.getDate();
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== currentDay) {
        next.setDate(0);
      }
      break;
    case 'anual':
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

function calculateNextDueDate(startDateStr: string, frequency: string): Date {
  // Parse date parts manually to ensure local time is used and avoid UTC shifts
  const [year, month, day] = startDateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to be safe against DST shifts
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Comparison against start of today

  let next = new Date(start);

  // If the start date is already in the future (or today), that is the next due date
  // We compare times to ensure we don't skip today if it matches exactly
  const todayNoon = new Date(today);
  todayNoon.setHours(12, 0, 0, 0);
  
  if (next >= todayNoon) return next;

  // Otherwise, add frequency until we reach or pass today
  // Safety break counter to prevent infinite loops on bad data
  let safety = 0;
  while (next < todayNoon && safety < 1000) {
    safety++;
    next = advanceByFrequency(next, frequency);
  }
  return next;
}