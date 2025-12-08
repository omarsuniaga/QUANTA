import { Transaction } from '../types';

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

  sendBrowserNotification: (count: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FlowFinance: Recordatorio de Pago', {
        body: `Tienes ${count} pagos próximos a vencer en los siguientes 3 días.`,
      });
    }
  }
};

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
    switch (frequency) {
      case 'semanal':
        next.setDate(next.getDate() + 7);
        break;
      case 'mensual':
        const currentDay = next.getDate();
        next.setMonth(next.getMonth() + 1);
        // Handle month overflow (e.g. Jan 31 -> Feb 28/29)
        if (next.getDate() !== currentDay) {
          next.setDate(0); // Set to last day of previous month
        }
        break;
      case 'anual':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        // Default to monthly if unknown, to break loop eventually
        next.setMonth(next.getMonth() + 1);
        break;
    }
  }
  return next;
}