import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  X,
  CreditCard,
  AlertTriangle,
  Target,
  Trophy,
  PieChart,
  Calendar,
  Lightbulb,
  Award,
  Eye,
  Moon,
  Clock,
  Check,
  Info
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import {
  smartNotificationService,
  NotificationPreferences as NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../services/smartNotificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { ModalWrapper } from './ModalWrapper';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const [preferences, setPreferences] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Labels bilingües
  const l = {
    title: language === 'es' ? 'Preferencias de Notificaciones' : 'Notification Preferences',
    subtitle: language === 'es' ? 'Configura qué alertas deseas recibir' : 'Configure which alerts you want to receive',
    masterToggle: language === 'es' ? 'Notificaciones activas' : 'Notifications enabled',
    permissionDenied: language === 'es' ? 'Permisos denegados. Habilítalos en la configuración del navegador.' : 'Permissions denied. Enable them in browser settings.',
    requestPermission: language === 'es' ? 'Solicitar permisos' : 'Request permissions',

    // Categorías
    categoryPayments: language === 'es' ? 'Pagos y Servicios' : 'Payments & Services',
    categoryGoals: language === 'es' ? 'Metas de Ahorro' : 'Savings Goals',
    categoryBudget: language === 'es' ? 'Presupuesto' : 'Budget',
    categoryOther: language === 'es' ? 'Otros' : 'Other',
    categoryTiming: language === 'es' ? 'Horario y Frecuencia' : 'Timing & Frequency',

    // Tipos de notificaciones
    servicePayments: language === 'es' ? 'Recordatorios de pagos' : 'Payment reminders',
    servicePaymentsDesc: language === 'es' ? 'Avisos antes del vencimiento de servicios y suscripciones' : 'Alerts before service and subscription due dates',

    insufficientFunds: language === 'es' ? 'Alertas de fondos' : 'Funds alerts',
    insufficientFundsDesc: language === 'es' ? 'Aviso cuando no hay fondos suficientes para pagos próximos' : 'Alert when insufficient funds for upcoming payments',

    goalContributions: language === 'es' ? 'Aportes a metas' : 'Goal contributions',
    goalContributionsDesc: language === 'es' ? 'Recordatorio de cuotas programadas para tus metas' : 'Reminder for scheduled goal contributions',

    goalMilestones: language === 'es' ? 'Hitos y logros' : 'Milestones & achievements',
    goalMilestonesDesc: language === 'es' ? 'Celebración al alcanzar 25%, 50%, 75% y 100% de tus metas' : 'Celebration when reaching 25%, 50%, 75%, and 100% of goals',

    budgetAlerts: language === 'es' ? 'Alertas de presupuesto' : 'Budget alerts',
    budgetAlertsDesc: language === 'es' ? 'Aviso cuando uses 80% o superes tu presupuesto' : 'Alert when using 80% or exceeding your budget',

    unusualExpenses: language === 'es' ? 'Gastos inusuales' : 'Unusual expenses',
    unusualExpensesDesc: language === 'es' ? 'Detectar gastos significativamente mayores al promedio' : 'Detect expenses significantly higher than average',

    weeklySummary: language === 'es' ? 'Resumen semanal' : 'Weekly summary',
    weeklySummaryDesc: language === 'es' ? 'Resumen de ingresos, gastos y progreso (domingos)' : 'Income, expenses and progress summary (Sundays)',

    savingsTips: language === 'es' ? 'Consejos de ahorro' : 'Savings tips',
    savingsTipsDesc: language === 'es' ? 'Tips personalizados para mejorar tus finanzas' : 'Personalized tips to improve your finances',

    achievements: language === 'es' ? 'Logros desbloqueados' : 'Unlocked achievements',
    achievementsDesc: language === 'es' ? 'Celebración de rachas y logros financieros' : 'Celebration of streaks and financial achievements',

    // Configuración de tiempo
    reminderDays: language === 'es' ? 'Días de anticipación' : 'Days in advance',
    reminderDaysDesc: language === 'es' ? 'Cuántos días antes recordar pagos' : 'How many days before to remind payments',

    quietHours: language === 'es' ? 'Horario silencioso' : 'Quiet hours',
    quietHoursDesc: language === 'es' ? 'No enviar notificaciones durante estas horas' : 'Do not send notifications during these hours',

    maxDaily: language === 'es' ? 'Máximo diario' : 'Daily maximum',
    maxDailyDesc: language === 'es' ? 'Límite de notificaciones por día' : 'Notification limit per day',

    from: language === 'es' ? 'Desde' : 'From',
    to: language === 'es' ? 'Hasta' : 'To',
    days: language === 'es' ? 'días' : 'days',
    notifications: language === 'es' ? 'notificaciones' : 'notifications',

    save: language === 'es' ? 'Guardar' : 'Save',
    saved: language === 'es' ? '¡Guardado!' : 'Saved!',
    reset: language === 'es' ? 'Restablecer' : 'Reset',
    testNotification: language === 'es' ? 'Probar notificación' : 'Test notification'
  };

  useEffect(() => {
    if (isOpen) {
      setPreferences(smartNotificationService.getPreferences());
      setPermissionStatus(pushNotificationService.getPermissionStatus());
    }
  }, [isOpen]);

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleNumberChange = (key: keyof NotificationPrefs, value: number) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    smartNotificationService.savePreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES });
    setSaved(false);
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    await pushNotificationService.initialize();
    const granted = await pushNotificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    setLoading(false);
  };

  const handleTestNotification = async () => {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('🔔 Prueba de QUANTA', {
        body: language === 'es'
          ? '¡Las notificaciones están funcionando correctamente!'
          : 'Notifications are working correctly!',
        icon: '/icon-192.png',
        badge: '/badge-72.png'
      } as NotificationOptions);
    }
  };

  if (!isOpen) return null;

  const NotificationOption = ({
    icon: Icon,
    label,
    description,
    checked,
    onToggle,
    color = 'indigo'
  }: {
    icon: React.ElementType;
    label: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
    color?: string;
  }) => (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          <button
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''
              }`} />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} alignment="center">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{l.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{l.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Permission Warning */}
          {permissionStatus === 'denied' && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">{l.permissionDenied}</p>
            </div>
          )}

          {permissionStatus === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {loading ? '...' : l.requestPermission}
            </button>
          )}

          {/* Master Toggle */}
          <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2">
              {preferences.enabled ? (
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{l.masterToggle}</span>
            </div>
            <button
              onClick={() => handleToggle('enabled')}
              className={`relative w-12 h-7 rounded-full transition-colors ${preferences.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${preferences.enabled ? 'translate-x-5' : ''
                }`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Pagos y Servicios */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" />
              {l.categoryPayments}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 divide-y divide-slate-100 dark:divide-slate-700">
              <NotificationOption
                icon={Calendar}
                label={l.servicePayments}
                description={l.servicePaymentsDesc}
                checked={preferences.servicePayments}
                onToggle={() => handleToggle('servicePayments')}
                color="blue"
              />
              <NotificationOption
                icon={AlertTriangle}
                label={l.insufficientFunds}
                description={l.insufficientFundsDesc}
                checked={preferences.insufficientFunds}
                onToggle={() => handleToggle('insufficientFunds')}
                color="rose"
              />
            </div>
          </section>

          {/* Metas de Ahorro */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target className="w-3.5 h-3.5" />
              {l.categoryGoals}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 divide-y divide-slate-100 dark:divide-slate-700">
              <NotificationOption
                icon={Target}
                label={l.goalContributions}
                description={l.goalContributionsDesc}
                checked={preferences.goalContributions}
                onToggle={() => handleToggle('goalContributions')}
                color="emerald"
              />
              <NotificationOption
                icon={Trophy}
                label={l.goalMilestones}
                description={l.goalMilestonesDesc}
                checked={preferences.goalMilestones}
                onToggle={() => handleToggle('goalMilestones')}
                color="amber"
              />
            </div>
          </section>

          {/* Presupuesto */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5" />
              {l.categoryBudget}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 divide-y divide-slate-100 dark:divide-slate-700">
              <NotificationOption
                icon={PieChart}
                label={l.budgetAlerts}
                description={l.budgetAlertsDesc}
                checked={preferences.budgetAlerts}
                onToggle={() => handleToggle('budgetAlerts')}
                color="violet"
              />
              <NotificationOption
                icon={Eye}
                label={l.unusualExpenses}
                description={l.unusualExpensesDesc}
                checked={preferences.unusualExpenses}
                onToggle={() => handleToggle('unusualExpenses')}
                color="orange"
              />
            </div>
          </section>

          {/* Otros */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              {l.categoryOther}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl px-4 divide-y divide-slate-100 dark:divide-slate-700">
              <NotificationOption
                icon={Calendar}
                label={l.weeklySummary}
                description={l.weeklySummaryDesc}
                checked={preferences.weeklySummary}
                onToggle={() => handleToggle('weeklySummary')}
                color="sky"
              />
              <NotificationOption
                icon={Lightbulb}
                label={l.savingsTips}
                description={l.savingsTipsDesc}
                checked={preferences.savingsTips}
                onToggle={() => handleToggle('savingsTips')}
                color="yellow"
              />
              <NotificationOption
                icon={Award}
                label={l.achievements}
                description={l.achievementsDesc}
                checked={preferences.achievements}
                onToggle={() => handleToggle('achievements')}
                color="pink"
              />
            </div>
          </section>

          {/* Timing */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {l.categoryTiming}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl p-4 space-y-4">
              {/* Días de anticipación */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{l.reminderDays}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{l.reminderDaysDesc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={preferences.reminderDaysBefore}
                      onChange={e => handleNumberChange('reminderDaysBefore', Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-14 px-2 py-1 text-center text-sm font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500">{l.days}</span>
                  </div>
                </div>
              </div>

              {/* Horario silencioso */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{l.quietHours}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{l.quietHoursDesc}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{l.from}</span>
                    <select
                      value={preferences.quietHoursStart}
                      onChange={e => handleNumberChange('quietHoursStart', parseInt(e.target.value))}
                      className="px-2 py-1 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{l.to}</span>
                    <select
                      value={preferences.quietHoursEnd}
                      onChange={e => handleNumberChange('quietHoursEnd', parseInt(e.target.value))}
                      className="px-2 py-1 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Máximo diario */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{l.maxDaily}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{l.maxDailyDesc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={preferences.maxDailyNotifications}
                      onChange={e => handleNumberChange('maxDailyNotifications', Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                      className="w-14 px-2 py-1 text-center text-sm font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500">{l.notifications}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 shrink-0 bg-white dark:bg-slate-800">
          {permissionStatus === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {l.testNotification}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {l.reset}
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${saved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                {l.saved}
              </>
            ) : l.save}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
