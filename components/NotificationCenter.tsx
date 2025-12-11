import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  CreditCard,
  AlertTriangle,
  Target,
  Trophy,
  PartyPopper,
  PieChart,
  TrendingUp,
  Lightbulb,
  Award,
  Flame,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { 
  smartNotificationService, 
  AppNotification,
  NotificationType
} from '../services/smartNotificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

// Iconos por tipo
const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  service_payment: CreditCard,
  insufficient_funds: AlertTriangle,
  goal_contribution: Target,
  goal_milestone: Trophy,
  goal_completed: PartyPopper,
  budget_warning: PieChart,
  budget_exceeded: AlertTriangle,
  weekly_summary: TrendingUp,
  savings_tip: Lightbulb,
  achievement: Award,
  streak_reminder: Flame,
  unusual_expense: Eye
};

// Colores por tipo
const TYPE_COLORS: Record<NotificationType, string> = {
  service_payment: 'blue',
  insufficient_funds: 'rose',
  goal_contribution: 'emerald',
  goal_milestone: 'amber',
  goal_completed: 'emerald',
  budget_warning: 'amber',
  budget_exceeded: 'rose',
  weekly_summary: 'indigo',
  savings_tip: 'yellow',
  achievement: 'pink',
  streak_reminder: 'orange',
  unusual_expense: 'violet'
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  onOpenSettings 
}) => {
  const { language } = useI18n();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const l = useMemo(() => ({
    title: language === 'es' ? 'Notificaciones' : 'Notifications',
    noNotifications: language === 'es' ? 'No tienes notificaciones' : 'You have no notifications',
    noUnread: language === 'es' ? 'No tienes notificaciones sin leer' : 'No unread notifications',
    markAllRead: language === 'es' ? 'Marcar todo como leído' : 'Mark all as read',
    clearAll: language === 'es' ? 'Limpiar todo' : 'Clear all',
    settings: language === 'es' ? 'Configurar' : 'Settings',
    all: language === 'es' ? 'Todas' : 'All',
    unread: language === 'es' ? 'Sin leer' : 'Unread',
    today: language === 'es' ? 'Hoy' : 'Today',
    yesterday: language === 'es' ? 'Ayer' : 'Yesterday',
    thisWeek: language === 'es' ? 'Esta semana' : 'This week',
    older: language === 'es' ? 'Anteriores' : 'Older'
  }), [language]);

  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, filter]);

  const refreshNotifications = () => {
    const notifs = smartNotificationService.getNotifications(filter === 'all');
    setNotifications(notifs);
  };

  const handleMarkAsRead = (id: string) => {
    smartNotificationService.markAsRead(id);
    refreshNotifications();
  };

  const handleDismiss = (id: string) => {
    smartNotificationService.dismissNotification(id);
    refreshNotifications();
  };

  const handleMarkAllAsRead = () => {
    smartNotificationService.markAllAsRead();
    refreshNotifications();
  };

  const handleClearAll = () => {
    smartNotificationService.clearAllNotifications();
    refreshNotifications();
  };

  // Agrupar notificaciones por fecha
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: AppNotification[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const filtered = filter === 'unread' 
      ? notifications.filter(n => !n.read)
      : notifications;

    for (const notif of filtered) {
      const notifDate = new Date(notif.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else if (notifDate >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    }

    return groups;
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = filter === 'unread' 
    ? notifications.filter(n => !n.read).length 
    : notifications.length;

  if (!isOpen) return null;

  const NotificationItem = ({ notification }: { notification: AppNotification }) => {
    const Icon = TYPE_ICONS[notification.type] || Bell;
    const color = TYPE_COLORS[notification.type] || 'slate';
    const timeAgo = getTimeAgo(notification.createdAt, language);

    return (
      <div 
        className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
          notification.read 
            ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700' 
            : 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
        }`}
        onClick={() => handleMarkAsRead(notification.id)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-tight ${
              notification.read 
                ? 'text-slate-700 dark:text-slate-300' 
                : 'text-slate-900 dark:text-white'
            }`}>
              {notification.title}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(notification.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notification.body}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo}</span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const NotificationGroup = ({ title, items }: { title: string; items: AppNotification[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
          {title}
        </h4>
        <div className="space-y-2">
          {items.map(notif => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl mt-16 sm:mt-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{l.title}</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onClose(); onOpenSettings(); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={l.settings}
              >
                <Settings className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {l.all}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'unread' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {l.unread} {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {totalCount === 0 ? (
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filter === 'unread' ? l.noUnread : l.noNotifications}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <NotificationGroup title={l.today} items={groupedNotifications.today} />
              <NotificationGroup title={l.yesterday} items={groupedNotifications.yesterday} />
              <NotificationGroup title={l.thisWeek} items={groupedNotifications.thisWeek} />
              <NotificationGroup title={l.older} items={groupedNotifications.older} />
            </div>
          )}
        </div>

        {/* Footer */}
        {totalCount > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {l.markAllRead}
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {l.clearAll}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper para tiempo relativo
function getTimeAgo(date: Date, language: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (language === 'es') {
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } else {
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}

// Componente del botón de notificaciones para el header
interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(smartNotificationService.getUnreadCount());
    };
    
    updateCount();
    const interval = setInterval(updateCount, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};
