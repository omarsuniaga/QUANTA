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

import { Transaction, Goal, Subscription, DashboardStats, Budget, FinancialPlan, PlanId } from '../types';
import { pushNotificationService } from './pushNotificationService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import { parseLocalDate } from '../utils/dateHelpers';
import { CATEGORY_TO_GROUP } from '../constants/financialPlans';
import { calculateBurnRate } from '../utils/financialMathCore';
import { es } from '../locales/es';
import { en } from '../locales/en';

// ========================
// TIPOS DE NOTIFICACIONES
// ========================

export type NotificationType = 
  | 'service_payment'      // Pago de servicio próximo
  | 'scheduled_payment'    // Pago programado próximo a vencer
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

export type NotificationAction = 'pay' | 'postpone' | 'cancel' | 'view';

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
  // New fields for actionable notifications
  actionTaken?: NotificationAction;
  actionTakenAt?: Date;
  requiresAction?: boolean; // If true, user must pay/postpone/cancel
  transactionId?: string; // Related recurring transaction ID
  dueDate?: string; // ISO date of when payment is due
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
  scheduled_payment: '📅',
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

// Days before payment to send reminders
const SCHEDULED_PAYMENT_REMINDER_DAYS = [3, 2, 1, 0]; // 3 days, 2 days, 1 day, same day

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

      const t = language === 'es' ? es : en;
      const title = t.notifications.servicePayment.title.replace('{description}', transaction.description || transaction.category);
      
      let bodyTemplate = t.notifications.servicePayment.body.future;
      if (daysUntil === 0) bodyTemplate = t.notifications.servicePayment.body.today;
      else if (daysUntil === 1) bodyTemplate = t.notifications.servicePayment.body.tomorrow;

      const body = bodyTemplate
        .replace('{days}', daysUntil.toString())
        .replace('{amount}', transaction.amount.toLocaleString());

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

      const t = language === 'es' ? es : en;
      const title = t.notifications.subscriptionCharge.title.replace('{name}', subscription.name);
      
      let bodyTemplate = t.notifications.subscriptionCharge.body.future;
      if (daysUntil === 0) bodyTemplate = t.notifications.subscriptionCharge.body.today;
      else if (daysUntil === 1) bodyTemplate = t.notifications.subscriptionCharge.body.tomorrow;

      const body = bodyTemplate
        .replace('{days}', daysUntil.toString())
        .replace('{amount}', amount.toLocaleString());

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

      const t = language === 'es' ? es : en;
      const title = t.notifications.insufficientFunds.title;
      const body = t.notifications.insufficientFunds.body
        .replace('{deficit}', `${deficit.toLocaleString()} ${currency}`);

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
        nextContribDate = parseLocalDate(goal.nextContributionDate);
      } else if (goal.lastContributionDate) {
        nextContribDate = parseLocalDate(goal.lastContributionDate);
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
        
        const t = language === 'es' ? es : en;
        const title = t.notifications.goalContribution.title.replace('{name}', goal.name);
        
        const warning = !canAfford ? t.notifications.goalContribution.body.warning : '';
        const bodyTemplate = daysUntil === 0 
          ? t.notifications.goalContribution.body.today
          : t.notifications.goalContribution.body.future;

        const body = bodyTemplate
          .replace('{amount}', `${goal.contributionAmount.toLocaleString()} ${currency}`)
          .replace('{days}', daysUntil.toString())
          .replace('{warning}', warning);

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

          const t = language === 'es' ? es : en;
          let title: string, body: string;
          
          if (milestone === 100) {
            title = t.notifications.goalCompleted.title.replace('{name}', goal.name); // Added replace for consistence if title has name
            body = t.notifications.goalCompleted.body.replace('{name}', goal.name);
          } else {
            title = t.notifications.goalMilestone.title.replace('{percent}', milestone.toString());
            body = t.notifications.goalMilestone.body
              .replace('{percent}', milestone.toString())
              .replace('{name}', goal.name);
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
          const t = language === 'es' ? es : en;
          const title = t.notifications.budgetWarning.title.replace('{category}', budget.category);
          const body = t.notifications.budgetWarning.body
            .replace('{percent}', Math.round(percentage).toString())
            .replace('{remaining}', `${(budget.limit - spent).toLocaleString()} ${currency}`);

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
          const t = language === 'es' ? es : en;
          const title = t.notifications.budgetExceeded.title;
          const body = t.notifications.budgetExceeded.body
            .replace('{category}', budget.category)
            .replace('{excess}', `${excess.toLocaleString()} ${currency}`);

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
      parseLocalDate(t.date) >= oneMonthAgo
    );

    if (recentExpenses.length < 10) return null; // No hay suficientes datos

    const avgExpense = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / recentExpenses.length;
    
    // Revisar el gasto más reciente
    const latestExpense = recentExpenses
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())[0];
    
    if (!latestExpense || latestExpense.amount < avgExpense * 3) return null;

    const notificationId = `unusual_${latestExpense.id}`;
    if (this.notifications.some(n => n.id === notificationId)) return null;

    const t = language === 'es' ? es : en;
    const title = t.notifications.unusualExpense.title;
    
    const body = t.notifications.unusualExpense.body
      .replace('{description}', latestExpense.description || latestExpense.category)
      .replace('{amount}', `${latestExpense.amount.toLocaleString()} ${currency}`)
      .replace('{multiplier}', Math.round(latestExpense.amount / avgExpense).toString());

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

    const t = language === 'es' ? es : en;
    const title = t.notifications.weeklySummary.title;
    
    const body = t.notifications.weeklySummary.body
      .replace('{savingsRate}', savingsRate.toString())
      .replace('{activeGoals}', activeGoals.toString());

    const notification = this.createNotification('weekly_summary', title, body, 'low', {
      income: stats.totalIncome, expense: stats.totalExpense, savingsRate, activeGoals
    });
    notification.id = notificationId;

    await this.sendNotification(notification);
    return notification;
  }

  // ========================
  // 9. ALERTAS DE MODELO FINANCIERO
  // ========================

  async checkModelBasedAlerts(
    transactions: Transaction[],
    stats: DashboardStats,
    planId: PlanId = 'essentialist',
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.budgetAlerts) return [];

    const notifications: AppNotification[] = [];
    const notificationIdBase = `model_${planId}_${new Date().toISOString().split('T')[0]}`;

    // Calculate current allocations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTx = transactions.filter(t => parseLocalDate(t.date) >= thirtyDaysAgo);
    
    const allocations = {
      needs: 0,
      wants: 0,
      savings: 0,
      debt: 0,
      investments: 0
    };

    // Calculate income for percentages
    const totalIncome = recentTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 1; // Avoid div by 0

    recentTx.filter(t => t.type === 'expense').forEach(t => {
      const group = CATEGORY_TO_GROUP[t.category] || 'wants';
      allocations[group] += t.amount;
    });

    // 1. ESSENTIALIST LOGIC (50/30/20)
    if (planId === 'essentialist') {
      const needsPct = (allocations.needs / totalIncome) * 100;
      if (needsPct > 55) { // 5% tolerance
        const id = `${notificationIdBase}_needs`;
        if (!this.notifications.some(n => n.id === id)) {
          const t = language === 'es' ? es : en;
          const title = t.notifications.modelAlerts.essentialist.title;
          const body = t.notifications.modelAlerts.essentialist.body.replace('{percent}', needsPct.toFixed(0));

          notifications.push(this.createNotification(
            'budget_warning',
            title,
            body,
            'medium'
          ));
        }
      }
    }

    // 2. AUDITOR LOGIC (Zero-Based)
    if (planId === 'auditor') {
      const assigned = allocations.needs + allocations.wants + allocations.savings + allocations.debt + allocations.investments;
      const unassigned = totalIncome - assigned;
      
      if (unassigned > totalIncome * 0.05) { // If >5% is unassigned
        const id = `${notificationIdBase}_unassigned`;
        if (!this.notifications.some(n => n.id === id)) {
          const t = language === 'es' ? es : en;
          const title = t.notifications.modelAlerts.auditor.title;
          const body = t.notifications.modelAlerts.auditor.body;

          notifications.push(this.createNotification(
            'budget_warning',
            title,
            body,
            'medium'
          ));
        }
      }
    }

    // 3. DEFENSIVE LOGIC (Debt Focus)
    if (planId === 'defensive') {
      const hasDebt = allocations.debt > 0; // Simple check, ideally check debt accounts
      const wantsPct = (allocations.wants / totalIncome) * 100;
      
      if (hasDebt && wantsPct > 10) {
        const id = `${notificationIdBase}_defensive`;
        if (!this.notifications.some(n => n.id === id)) {
          const t = language === 'es' ? es : en;
          const title = t.notifications.modelAlerts.defensive.title;
          const body = t.notifications.modelAlerts.defensive.body.replace('{percent}', wantsPct.toFixed(0));

          notifications.push(this.createNotification(
            'budget_exceeded',
            title,
            body,
            'high'
          ));
        }
      }
    }

    // 4. VELOCITY CHECK (Burn Rate Alert) - Applies to all
    const burnRate = calculateBurnRate(recentTx, 30);
    // If burn rate projects running out of money before month end
    // (Simple logic: Balance / BurnRate < DaysRemainingInMonth)
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate();
    
    if (stats.balance > 0 && burnRate > 0) {
      const daysOfRunway = stats.balance / burnRate;
      if (daysOfRunway < daysLeft) {
        const id = `${notificationIdBase}_velocity`;
        if (!this.notifications.some(n => n.id === id)) {
          const t = language === 'es' ? es : en;
          const title = t.notifications.modelAlerts.velocity.title;
          const body = t.notifications.modelAlerts.velocity.body
            .replace('{rate}', Math.round(burnRate).toString())
            .replace('{date}', Math.round(today.getDate() + daysOfRunway).toString());

          notifications.push(this.createNotification(
            'budget_warning',
            title,
            body,
            'high'
          ));
        }
      }
    }

    for (const n of notifications) {
      n.id = n.id || `${notificationIdBase}_${Math.random()}`; // Ensure ID
      await this.sendNotification(n);
    }

    return notifications;
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
    language: 'es' | 'en' = 'es',
    currencySymbol: string = '$',
    planId: PlanId = 'essentialist'
  ): Promise<AppNotification[]> {
    if (!this.preferences.enabled) return [];
    
    // Validate stats object
    if (!stats || typeof stats.balance === 'undefined') {
      console.warn('smartNotificationService: Invalid stats object received');
      return [];
    }

    const allNotifications: AppNotification[] = [];

    try {
      // 1. Pagos de servicios
      const serviceNotifs = await this.checkServicePayments(transactions, subscriptions, language);
      allNotifications.push(...serviceNotifs);

      // 1.5 Pagos programados con acciones (3, 2, 1, 0 días antes)
      const scheduledNotifs = await this.checkScheduledPayments(transactions, currency, currencySymbol, language);
      allNotifications.push(...scheduledNotifs);

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

      // 5. Alertas de presupuesto (Legacy + Model Based)
      const budgetNotifs = await this.checkBudgetAlerts(budgets, transactions, currency, language);
      allNotifications.push(...budgetNotifs);
      
      const modelNotifs = await this.checkModelBasedAlerts(transactions, stats, planId, language);
      allNotifications.push(...modelNotifs);

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

  // ========================
  // 8. PAGOS PROGRAMADOS (CON ACCIONES)
  // ========================

  /**
   * Check for scheduled/recurring payments and send reminders at 3, 2, 1 days before and on due date
   * These notifications require user action: Pay, Postpone, or Cancel
   */
  async checkScheduledPayments(
    transactions: Transaction[],
    currency: string,
    currencySymbol: string,
    language: 'es' | 'en' = 'es'
  ): Promise<AppNotification[]> {
    if (!this.preferences.servicePayments) return [];

    const notifications: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all recurring expenses
    const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.isRecurring);

    for (const expense of recurringExpenses) {
      // Calculate next due date based on the original date
      const chargeDay = parseLocalDate(expense.date).getDate();
      const nextDueDate = new Date(today.getFullYear(), today.getMonth(), chargeDay);
      nextDueDate.setHours(0, 0, 0, 0);

      // If charge day has passed this month, look at next month
      if (nextDueDate < today) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const dueDateStr = nextDueDate.toISOString().split('T')[0];

      // Check if we should send a notification today (3, 2, 1, 0 days before)
      if (!SCHEDULED_PAYMENT_REMINDER_DAYS.includes(daysUntilDue)) continue;

      // Unique ID for this specific reminder (includes days until due to avoid duplicates)
      const notificationId = `sched_${expense.id}_${dueDateStr}_d${daysUntilDue}`;

      // Check if we already sent this reminder
      const existingNotification = this.notifications.find(n => n.id === notificationId);
      if (existingNotification) continue;

      // Build message based on days until due
      let timeText: string;
      let priority: 'high' | 'medium' | 'low';
      
      if (daysUntilDue === 0) {
        timeText = language === 'es' ? '¡Hoy vence!' : 'Due today!';
        priority = 'high';
      } else if (daysUntilDue === 1) {
        timeText = language === 'es' ? 'Vence mañana' : 'Due tomorrow';
        priority = 'high';
      } else if (daysUntilDue === 2) {
        timeText = language === 'es' ? 'Vence en 2 días' : 'Due in 2 days';
        priority = 'medium';
      } else {
        timeText = language === 'es' ? 'Vence en 3 días' : 'Due in 3 days';
        priority = 'medium';
      }

      const title = language === 'es'
        ? `${expense.description || expense.category}`
        : `${expense.description || expense.category}`;

      const body = language === 'es'
        ? `${timeText} - ${currencySymbol}${expense.amount.toLocaleString()}`
        : `${timeText} - ${currencySymbol}${expense.amount.toLocaleString()}`;

      const notification: AppNotification = {
        id: notificationId,
        type: 'scheduled_payment',
        title: `📅 ${title}`,
        body,
        icon: NOTIFICATION_ICONS.scheduled_payment,
        priority,
        data: {
          transactionId: expense.id,
          amount: expense.amount,
          dueDate: dueDateStr,
          daysUntilDue,
          description: expense.description,
          category: expense.category
        },
        createdAt: new Date(),
        read: false,
        dismissed: false,
        requiresAction: true,
        transactionId: expense.id,
        dueDate: dueDateStr
      };

      notifications.push(notification);
      await this.sendScheduledPaymentNotification(notification, language);
    }

    return notifications;
  }

  /**
   * Send a scheduled payment notification with action buttons
   */
  private async sendScheduledPaymentNotification(
    notification: AppNotification,
    language: 'es' | 'en'
  ): Promise<boolean> {
    if (!this.canSendNotification()) {
      console.log('Notification blocked: limit reached or quiet hours');
      return false;
    }

    // Save to history
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    await this.saveNotificationToStorage(notification);
    this.dailyNotificationCount++;

    // Send push notification with actions
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: `scheduled_${notification.transactionId}`,
          data: {
            ...notification.data,
            notificationId: notification.id,
            type: 'scheduled_payment'
          },
          requireInteraction: true, // Keep notification visible until user acts
          actions: [
            { action: 'pay', title: language === 'es' ? '✓ Pagar' : '✓ Pay' },
            { action: 'postpone', title: language === 'es' ? '⏱ Posponer' : '⏱ Postpone' },
            { action: 'cancel', title: language === 'es' ? '✗ Cancelar' : '✗ Cancel' }
          ]
        } as NotificationOptions);
        return true;
      } catch (error) {
        console.error('Error sending scheduled payment notification:', error);
        // Fallback to basic notification
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png'
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Handle user action on a scheduled payment notification
   */
  async handleScheduledPaymentAction(
    notificationId: string,
    action: NotificationAction,
    onPaymentConfirmed?: (transactionId: string, amount: number, dueDate: string) => Promise<void>
  ): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) {
      console.warn('Notification not found:', notificationId);
      return false;
    }

    // Update notification with action taken
    notification.actionTaken = action;
    notification.actionTakenAt = new Date();
    notification.dismissed = true;
    notification.read = true;
    await this.saveNotifications();

    // Handle the action
    switch (action) {
      case 'pay':
        // Call the callback to create the expense transaction
        if (onPaymentConfirmed && notification.transactionId && notification.data) {
          await onPaymentConfirmed(
            notification.transactionId,
            notification.data.amount,
            notification.dueDate || notification.data.dueDate
          );
        }
        console.log('Payment confirmed for:', notification.transactionId);
        break;

      case 'postpone':
        // Mark as postponed - the notification will appear again on the due date
        console.log('Payment postponed for:', notification.transactionId);
        // We don't create another notification now; it will appear on due date
        break;

      case 'cancel':
        // User chose to skip this payment cycle
        console.log('Payment cancelled for this cycle:', notification.transactionId);
        break;
    }

    return true;
  }

  /**
   * Get pending scheduled payments that require action
   */
  getPendingScheduledPayments(): AppNotification[] {
    return this.notifications.filter(n => 
      n.type === 'scheduled_payment' && 
      n.requiresAction && 
      !n.actionTaken && 
      !n.dismissed
    ).sort((a, b) => {
      // Sort by due date (earliest first)
      const dateA = a.dueDate ? parseLocalDate(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? parseLocalDate(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });
  }

  /**
   * Check if a specific transaction has a pending notification
   */
  hasPendingNotification(transactionId: string): AppNotification | undefined {
    return this.notifications.find(n => 
      n.transactionId === transactionId && 
      n.type === 'scheduled_payment' && 
      !n.actionTaken && 
      !n.dismissed
    );
  }
}

export const smartNotificationService = new SmartNotificationService();
