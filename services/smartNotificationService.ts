/**
 * Smart Notification Service
 * Sistema de notificaciones inteligentes para QUANTA
 * 
 * Tipos de notificaciones:
 * 1. Pagos de servicios próximos
 * 2. Alertas de falta de fondos
 * 3. Cuotas de metas programadas
 * 4. Logros y celebraciones
 * 5. Consejos financieros
 * 6. Alertas de presupuesto
 * 7. Resumen semanal
 */

import { Transaction, Goal, Subscription, DashboardStats, Budget } from '../types';
import { pushNotificationService } from './pushNotificationService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';

// ========================
// TIPOS DE NOTIFICACIONES
// ========================

export type NotificationType = 
  | 'service_payment'      // Pago de servicio próximo
  | 'insufficient_funds'   // Fondos insuficientes
  | 'goal_contribution'    // Cuota de meta programada
  | 'goal_milestone'       // Hito de meta alcanzado
  | 'goal_completed'       // Meta completada
  | 'budget_warning'       // Alerta de presupuesto (80%)
  | 'budget_exceeded'      // Presupuesto excedido
  | 'weekly_summary'       // Resumen semanal
  | 'savings_tip'          // Consejo de ahorro
  | 'achievement'          // Logro desbloqueado
  | 'streak_reminder'      // Recordatorio de racha
  | 'unusual_expense';     // Gasto inusual detectado

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  createdAt: Date;
  read: boolean;
  dismissed: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  // Tipos de notificaciones
  servicePayments: boolean;
  insufficientFunds: boolean;
  goalContributions: boolean;
  goalMilestones: boolean;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  savingsTips: boolean;
  achievements: boolean;
  unusualExpenses: boolean;
  // Configuración de tiempo
  reminderDaysBefore: number; // Días antes para recordar pagos (1-7)
  quietHoursStart: number;    // Hora inicio modo silencioso (0-23)
  quietHoursEnd: number;      // Hora fin modo silencioso (0-23)
  // Frecuencia
  maxDailyNotifications: number;
}

// Preferencias por defecto
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  servicePayments: true,
  insufficientFunds: true,
  goalContributions: true,
  goalMilestones: true,
  budgetAlerts: true,
  weeklySummary: true,
  savingsTips: true,
  achievements: true,
  unusualExpenses: true,
  reminderDaysBefore: 3,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  maxDailyNotifications: 10
};

// ========================
// ICONOS Y EMOJIS
// ========================

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  service_payment: '💳',
  insufficient_funds: '⚠️',
  goal_contribution: '🎯',
  goal_milestone: '🏆',
  goal_completed: '🎉',
  budget_warning: '📊',
  budget_exceeded: '🚨',
  weekly_summary: '📈',
  savings_tip: '💡',
  achievement: '🌟',
  streak_reminder: '🔥',
  unusual_expense: '👀'
};

// ========================
// SERVICIO PRINCIPAL
// ========================

class SmartNotificationService {
  private preferences: NotificationPreferences;
  private notifications: AppNotification[] = [];
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();
  private dailyNotificationCount: number = 0;
  private lastResetDate: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.preferences = this.loadPreferences();
    this.notifications = this.loadNotificationsFromLocal();
    this.resetDailyCountIfNeeded();
  }

  // Initialize with async loading from Firestore
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load from Firestore
      const firestoreNotifs = await storageService.getNotifications();
      if (firestoreNotifs.length > 0) {
        this.notifications = firestoreNotifs.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
      }
      
      // Cleanup old notifications (older than 30 days)
      await storageService.cleanupOldNotifications();
      
      this.isInitialized = true;
    } catch (e) {
      console.error('Error initializing notifications:', e);
    }
  }

  // ========================
  // PREFERENCIAS
  // ========================

  loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading notification preferences:', e);
    }
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  savePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // ========================
  // ALMACENAMIENTO DE NOTIFICACIONES
  // ========================

  private loadNotificationsFromLocal(): AppNotification[] {
    try {
      const stored = localStorage.getItem('app_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined
        }));
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    return [];
  }

  private async saveNotifications(): Promise<void> {
    // Save to localStorage for immediate access
    localStorage.setItem('app_notifications', JSON.stringify(this.notifications));
  }

  private async saveNotificationToStorage(notification: AppNotification): Promise<void> {
    // Save to localStorage immediately
    localStorage.setItem('app_notifications', JSON.stringify(this.notifications));
    
    // Also save to Firestore
    try {
      await storageService.saveNotification({
        ...notification,
        createdAt: notification.createdAt.toISOString()
      });
    } catch (e) {
      console.warn('Could not save notification to Firestore:', e);
    }
  }

  getNotifications(includeRead = false): AppNotification[] {
    return this.notifications
      .filter(n => !n.dismissed && (includeRead || !n.read))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read && !n.dismissed).length;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      
      // Also update in Firestore
      try {
        await storageService.markNotificationAsRead(notificationId);
      } catch (e) {
        console.warn('Could not mark notification as read in Firestore:', e);
      }
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => { n.read = true; });
    await this.saveNotifications();
    
    // Also update in Firestore
    try {
      await storageService.markAllNotificationsAsRead();
    } catch (e) {
      console.warn('Could not mark all notifications as read in Firestore:', e);
    }
  }

  async dismissNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      await this.saveNotifications();
      
      // Delete from Firestore
      try {
        await storageService.deleteNotification(notificationId);
      } catch (e) {
        console.warn('Could not delete notification from Firestore:', e);
      }
    }
  }

  async clearAllNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
    
    // Delete all from Firestore
    try {
      await storageService.deleteAllNotifications();
    } catch (e) {
      console.warn('Could not delete all notifications from Firestore:', e);
    }
  }

  // ========================
  // CONTROL DE LÍMITES
  // ========================

  private resetDailyCountIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyNotificationCount = 0;
      this.lastResetDate = today;
    }
  }

  private canSendNotification(): boolean {
    this.resetDailyCountIfNeeded();
    
    if (!this.preferences.enabled) return false;
    if (this.dailyNotificationCount >= this.preferences.maxDailyNotifications) return false;
    if (this.isQuietHours()) return false;
    
    return true;
  }

  private isQuietHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const { quietHoursStart, quietHoursEnd } = this.preferences;
    
    // Manejar el caso donde el rango cruza la medianoche
    if (quietHoursStart > quietHoursEnd) {
      return hour >= quietHoursStart || hour < quietHoursEnd;
    }
    return hour >= quietHoursStart && hour < quietHoursEnd;
  }

  // ========================
  // CREAR Y ENVIAR NOTIFICACIONES
  // ========================

  private createNotification(
    type: NotificationType,
    title: string,
    body: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    data?: Record<string, any>
  ): AppNotification {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: `${NOTIFICATION_ICONS[type]} ${title}`,
      body,
      icon: NOTIFICATION_ICONS[type],
      priority,
      data,
      createdAt: new Date(),
      read: false,
      dismissed: false
    };
  }

  private async sendNotification(notification: AppNotification): Promise<boolean> {
    if (!this.canSendNotification()) {
      console.log('Notification blocked: limit reached or quiet hours');
      return false;
    }

    // Guardar en el historial local y Firestore
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    await this.saveNotificationToStorage(notification);
    this.dailyNotificationCount++;

    // Enviar notificación push si tenemos permisos
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: notification.type,
          data: notification.data,
          requireInteraction: notification.priority === 'high',
          actions: [
            { action: 'open', title: 'Ver' },
            { action: 'dismiss', title: 'Cerrar' }
          ]
        } as NotificationOptions);
        return true;
      } catch (error) {
        // Fallback a Notification API básica
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png'
        });
        return true;
      }
    }

    return false;
  }

  // ========================
  // 1. PAGOS DE SERVICIOS
  // ========================

  async checkServicePayments(
    transactions: Transaction[],
    subscriptions: Subscription[],
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.servicePayments) return [];

    const notifications: AppNotification[] = [];
    const today = new Date();
    const daysAhead = this.preferences.reminderDaysBefore;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysAhead);

    // Revisar transacciones recurrentes
    const upcomingPayments = notificationService.getUpcomingTransactions(transactions, daysAhead);
    
    for (const { transaction, nextDate } of upcomingPayments) {
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const notificationId = `service_${transaction.id}_${nextDate.toISOString().split('T')[0]}`;
      
      // No enviar si ya existe una notificación para este pago
      if (this.notifications.some(n => n.id.startsWith(notificationId))) continue;

      const title = language === 'es' 
        ? `Pago próximo: ${transaction.description || transaction.category}`
        : `Upcoming payment: ${transaction.description || transaction.category}`;
      
      const body = language === 'es'
        ? `${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`} - ${transaction.amount.toLocaleString()} a pagar`
        : `${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} - ${transaction.amount.toLocaleString()} due`;

      const notification = this.createNotification(
        'service_payment',
        title,
        body,
        daysUntil <= 1 ? 'high' : 'medium',
        { transactionId: transaction.id, amount: transaction.amount, dueDate: nextDate.toISOString() }
      );
      notification.id = notificationId;

      notifications.push(notification);
      await this.sendNotification(notification);
    }

    // Revisar suscripciones
    const subscriptionPayments = notificationService.getSubscriptionPaymentsUntil(subscriptions, endDate);
    
    for (const { subscription, date, amount } of subscriptionPayments) {
      const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0 || daysUntil > daysAhead) continue;

      const notificationId = `sub_${subscription.id}_${date.toISOString().split('T')[0]}`;
      if (this.notifications.some(n => n.id.startsWith(notificationId))) continue;

      const title = language === 'es'
        ? `Cobro de suscripción: ${subscription.name}`
        : `Subscription charge: ${subscription.name}`;
      
      const body = language === 'es'
        ? `${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`} se cobra ${amount.toLocaleString()}`
        : `${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} - ${amount.toLocaleString()} will be charged`;

      const notification = this.createNotification(
        'service_payment',
        title,
        body,
        daysUntil <= 1 ? 'high' : 'medium',
        { subscriptionId: subscription.id, amount, dueDate: date.toISOString() }
      );
      notification.id = notificationId;

      notifications.push(notification);
      await this.sendNotification(notification);
    }

    return notifications;
  }

  // ========================
  // 2. FALTA DE FONDOS
  // ========================

  async checkInsufficientFunds(
    balance: number,
    upcomingExpenses: number,
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification | null> {
    if (!this.preferences.insufficientFunds) return null;

    const projectedBalance = balance - upcomingExpenses;
    
    if (projectedBalance < 0) {
      const deficit = Math.abs(projectedBalance);
      const notificationId = `funds_${new Date().toISOString().split('T')[0]}`;
      
      if (this.notifications.some(n => n.id === notificationId && !n.dismissed)) return null;

      const title = language === 'es'
        ? 'Alerta: Fondos insuficientes'
        : 'Alert: Insufficient funds';
      
      const body = language === 'es'
        ? `Te faltan ${deficit.toLocaleString()} ${currency} para cubrir tus pagos próximos. Revisa tu presupuesto.`
        : `You need ${deficit.toLocaleString()} ${currency} more to cover upcoming payments. Review your budget.`;

      const notification = this.createNotification(
        'insufficient_funds',
        title,
        body,
        'high',
        { deficit, balance, upcomingExpenses }
      );
      notification.id = notificationId;

      await this.sendNotification(notification);
      return notification;
    }

    return null;
  }

  // ========================
  // 3. CUOTAS DE METAS
  // ========================

  async checkGoalContributions(
    goals: Goal[],
    balance: number,
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.goalContributions) return [];

    const notifications: AppNotification[] = [];
    const today = new Date();

    for (const goal of goals) {
      if (!goal.contributionAmount || !goal.contributionFrequency) continue;
      if (goal.currentAmount >= goal.targetAmount) continue;

      // Calcular próxima fecha de contribución
      let nextContribDate: Date;
      
      if (goal.nextContributionDate) {
        nextContribDate = new Date(goal.nextContributionDate);
      } else if (goal.lastContributionDate) {
        nextContribDate = new Date(goal.lastContributionDate);
        switch (goal.contributionFrequency) {
          case 'weekly': nextContribDate.setDate(nextContribDate.getDate() + 7); break;
          case 'biweekly': nextContribDate.setDate(nextContribDate.getDate() + 14); break;
          case 'monthly': nextContribDate.setMonth(nextContribDate.getMonth() + 1); break;
        }
      } else {
        // Si no hay historial, la próxima contribución es hoy
        nextContribDate = new Date();
      }

      const daysUntil = Math.ceil((nextContribDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Notificar si es en los próximos 3 días
      if (daysUntil >= 0 && daysUntil <= 3) {
        const notificationId = `goal_contrib_${goal.id}_${nextContribDate.toISOString().split('T')[0]}`;
        if (this.notifications.some(n => n.id === notificationId)) continue;

        const canAfford = balance >= goal.contributionAmount;
        
        const title = language === 'es'
          ? `Aporte programado: ${goal.name}`
          : `Scheduled contribution: ${goal.name}`;
        
        let body: string;
        if (daysUntil === 0) {
          body = language === 'es'
            ? `Hoy toca aportar ${goal.contributionAmount.toLocaleString()} ${currency} a tu meta.${!canAfford ? ' ⚠️ Fondos insuficientes' : ''}`
            : `Today is time to contribute ${goal.contributionAmount.toLocaleString()} ${currency} to your goal.${!canAfford ? ' ⚠️ Insufficient funds' : ''}`;
        } else {
          body = language === 'es'
            ? `En ${daysUntil} día${daysUntil > 1 ? 's' : ''} debes aportar ${goal.contributionAmount.toLocaleString()} ${currency}.${!canAfford ? ' ⚠️ Prepara los fondos' : ''}`
            : `In ${daysUntil} day${daysUntil > 1 ? 's' : ''} you should contribute ${goal.contributionAmount.toLocaleString()} ${currency}.${!canAfford ? ' ⚠️ Prepare the funds' : ''}`;
        }

        const notification = this.createNotification(
          'goal_contribution',
          title,
          body,
          daysUntil === 0 ? 'high' : 'medium',
          { goalId: goal.id, amount: goal.contributionAmount, dueDate: nextContribDate.toISOString(), canAfford }
        );
        notification.id = notificationId;

        notifications.push(notification);
        await this.sendNotification(notification);
      }
    }

    return notifications;
  }

  // ========================
  // 4. HITOS Y METAS COMPLETADAS
  // ========================

  async checkGoalMilestones(
    goals: Goal[],
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.goalMilestones) return [];

    const notifications: AppNotification[] = [];
    const milestones = [25, 50, 75, 100];

    for (const goal of goals) {
      const progress = Math.floor((goal.currentAmount / goal.targetAmount) * 100);
      
      for (const milestone of milestones) {
        if (progress >= milestone) {
          const notificationId = `milestone_${goal.id}_${milestone}`;
          if (this.notifications.some(n => n.id === notificationId)) continue;

          let title: string, body: string;
          
          if (milestone === 100) {
            title = language === 'es' ? `¡Meta completada!` : `Goal completed!`;
            body = language === 'es'
              ? `¡Felicidades! Has alcanzado tu meta "${goal.name}". ¡Excelente trabajo!`
              : `Congratulations! You've reached your goal "${goal.name}". Excellent work!`;
          } else {
            title = language === 'es' ? `¡${milestone}% de tu meta!` : `${milestone}% of your goal!`;
            body = language === 'es'
              ? `Has alcanzado el ${milestone}% de "${goal.name}". ¡Sigue así!`
              : `You've reached ${milestone}% of "${goal.name}". Keep it up!`;
          }

          const notification = this.createNotification(
            milestone === 100 ? 'goal_completed' : 'goal_milestone',
            title,
            body,
            milestone === 100 ? 'high' : 'low',
            { goalId: goal.id, milestone, progress }
          );
          notification.id = notificationId;

          notifications.push(notification);
          await this.sendNotification(notification);
        }
      }
    }

    return notifications;
  }

  // ========================
  // 5. ALERTAS DE PRESUPUESTO
  // ========================

  async checkBudgetAlerts(
    budgets: Budget[],
    transactions: Transaction[],
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.budgetAlerts) return [];

    const notifications: AppNotification[] = [];
    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const budget of budgets) {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;
      const notificationIdBase = `budget_${budget.category}_${currentMonth}`;

      // 80% warning
      if (percentage >= 80 && percentage < 100) {
        const notificationId = `${notificationIdBase}_warning`;
        if (!this.notifications.some(n => n.id === notificationId)) {
          const title = language === 'es'
            ? `Alerta de presupuesto: ${budget.category}`
            : `Budget alert: ${budget.category}`;
          const body = language === 'es'
            ? `Has usado el ${Math.round(percentage)}% de tu presupuesto. Te quedan ${(budget.limit - spent).toLocaleString()} ${currency}.`
            : `You've used ${Math.round(percentage)}% of your budget. ${(budget.limit - spent).toLocaleString()} ${currency} remaining.`;

          const notification = this.createNotification('budget_warning', title, body, 'medium', {
            category: budget.category, spent, limit: budget.limit, percentage
          });
          notification.id = notificationId;
          notifications.push(notification);
          await this.sendNotification(notification);
        }
      }

      // 100%+ exceeded
      if (percentage >= 100) {
        const notificationId = `${notificationIdBase}_exceeded`;
        if (!this.notifications.some(n => n.id === notificationId)) {
          const excess = spent - budget.limit;
          const title = language === 'es'
            ? `¡Presupuesto excedido!`
            : `Budget exceeded!`;
          const body = language === 'es'
            ? `Has superado tu presupuesto de ${budget.category} por ${excess.toLocaleString()} ${currency}.`
            : `You've exceeded your ${budget.category} budget by ${excess.toLocaleString()} ${currency}.`;

          const notification = this.createNotification('budget_exceeded', title, body, 'high', {
            category: budget.category, spent, limit: budget.limit, excess
          });
          notification.id = notificationId;
          notifications.push(notification);
          await this.sendNotification(notification);
        }
      }
    }

    return notifications;
  }

  // ========================
  // 6. GASTOS INUSUALES
  // ========================

  async checkUnusualExpenses(
    transactions: Transaction[],
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification | null> {
    if (!this.preferences.unusualExpenses) return null;

    // Calcular promedio de gastos diarios del último mes
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= oneMonthAgo
    );

    if (recentExpenses.length < 10) return null; // No hay suficientes datos

    const avgExpense = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / recentExpenses.length;
    
    // Revisar el gasto más reciente
    const latestExpense = recentExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (!latestExpense || latestExpense.amount < avgExpense * 3) return null;

    const notificationId = `unusual_${latestExpense.id}`;
    if (this.notifications.some(n => n.id === notificationId)) return null;

    const title = language === 'es'
      ? 'Gasto inusual detectado'
      : 'Unusual expense detected';
    
    const body = language === 'es'
      ? `El gasto "${latestExpense.description || latestExpense.category}" de ${latestExpense.amount.toLocaleString()} ${currency} es ${Math.round(latestExpense.amount / avgExpense)}x mayor que tu promedio.`
      : `The expense "${latestExpense.description || latestExpense.category}" of ${latestExpense.amount.toLocaleString()} ${currency} is ${Math.round(latestExpense.amount / avgExpense)}x higher than your average.`;

    const notification = this.createNotification('unusual_expense', title, body, 'medium', {
      transactionId: latestExpense.id, amount: latestExpense.amount, average: avgExpense
    });
    notification.id = notificationId;

    await this.sendNotification(notification);
    return notification;
  }

  // ========================
  // 7. RESUMEN SEMANAL
  // ========================

  async sendWeeklySummary(
    stats: DashboardStats,
    goals: Goal[],
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification | null> {
    if (!this.preferences.weeklySummary) return null;

    const today = new Date();
    if (today.getDay() !== 0) return null; // Solo domingos

    const notificationId = `weekly_${today.toISOString().split('T')[0]}`;
    if (this.notifications.some(n => n.id === notificationId)) return null;

    const savingsRate = stats.totalIncome > 0 
      ? Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100)
      : 0;

    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;

    const title = language === 'es'
      ? 'Tu resumen semanal'
      : 'Your weekly summary';
    
    const body = language === 'es'
      ? `Esta semana: Ingresos ${stats.totalIncome.toLocaleString()} ${currency}, Gastos ${stats.totalExpense.toLocaleString()} ${currency}. Tasa de ahorro: ${savingsRate}%. ${activeGoals} metas activas.`
      : `This week: Income ${stats.totalIncome.toLocaleString()} ${currency}, Expenses ${stats.totalExpense.toLocaleString()} ${currency}. Savings rate: ${savingsRate}%. ${activeGoals} active goals.`;

    const notification = this.createNotification('weekly_summary', title, body, 'low', {
      income: stats.totalIncome, expense: stats.totalExpense, savingsRate, activeGoals
    });
    notification.id = notificationId;

    await this.sendNotification(notification);
    return notification;
  }

  // ========================
  // VERIFICACIÓN COMPLETA
  // ========================

  async runAllChecks(
    transactions: Transaction[],
    subscriptions: Subscription[],
    goals: Goal[],
    budgets: Budget[],
    stats: DashboardStats,
    currency: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.enabled) return [];

    const allNotifications: AppNotification[] = [];

    try {
      // 1. Pagos de servicios
      const serviceNotifs = await this.checkServicePayments(transactions, subscriptions, language);
      allNotifications.push(...serviceNotifs);

      // 2. Fondos insuficientes
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      const upcomingPayments = notificationService.getAllRecurringPaymentsUntil(transactions, endOfMonth);
      const upcomingTotal = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);
      const fundsNotif = await this.checkInsufficientFunds(stats.balance, upcomingTotal, currency, language);
      if (fundsNotif) allNotifications.push(fundsNotif);

      // 3. Cuotas de metas
      const goalContribNotifs = await this.checkGoalContributions(goals, stats.balance, currency, language);
      allNotifications.push(...goalContribNotifs);

      // 4. Hitos de metas
      const milestoneNotifs = await this.checkGoalMilestones(goals, language);
      allNotifications.push(...milestoneNotifs);

      // 5. Alertas de presupuesto
      const budgetNotifs = await this.checkBudgetAlerts(budgets, transactions, currency, language);
      allNotifications.push(...budgetNotifs);

      // 6. Gastos inusuales
      const unusualNotif = await this.checkUnusualExpenses(transactions, currency, language);
      if (unusualNotif) allNotifications.push(unusualNotif);

      // 7. Resumen semanal
      const weeklyNotif = await this.sendWeeklySummary(stats, goals, currency, language);
      if (weeklyNotif) allNotifications.push(weeklyNotif);

    } catch (error) {
      console.error('Error running notification checks:', error);
    }

    return allNotifications;
  }

  // ========================
  // PROGRAMACIÓN DE NOTIFICACIONES
  // ========================

  scheduleNotification(notification: AppNotification, date: Date): void {
    const delay = date.getTime() - Date.now();
    if (delay <= 0) return;

    // Cancelar si ya existe una programada con el mismo ID
    if (this.scheduledNotifications.has(notification.id)) {
      clearTimeout(this.scheduledNotifications.get(notification.id)!);
    }

    const timeout = setTimeout(() => {
      this.sendNotification(notification);
      this.scheduledNotifications.delete(notification.id);
    }, delay);

    this.scheduledNotifications.set(notification.id, timeout);
  }

  cancelScheduledNotification(notificationId: string): void {
    if (this.scheduledNotifications.has(notificationId)) {
      clearTimeout(this.scheduledNotifications.get(notificationId)!);
      this.scheduledNotifications.delete(notificationId);
    }
  }

  cancelAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach(timeout => clearTimeout(timeout));
    this.scheduledNotifications.clear();
  }
}

export const smartNotificationService = new SmartNotificationService();
