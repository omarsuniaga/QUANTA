import React, { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { pushNotificationService } from '../services/pushNotificationService';
import { useI18n } from '../contexts';

interface NotificationPermissionPromptProps {
    onClose: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'intro' | 'success'>('intro');
    const { t } = useI18n();

    const handleEnable = async () => {
        setLoading(true);

        const initialized = await pushNotificationService.initialize();
        if (!initialized) {
            alert('Tu navegador no soporta notificaciones push');
            setLoading(false);
            return;
        }

        const granted = await pushNotificationService.requestPermission();

        if (granted) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('notificationPromptShown', 'true');
            }
            setStep('success');
            setTimeout(() => onClose(), 2000);
        } else {
            alert('Necesitas otorgar permisos de notificación para activar esta función');
        }

        setLoading(false);
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md p-8 shadow-2xl animate-in zoom-in">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            ¡Listo!
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Las notificaciones están activadas. Recibirás recordatorios a tiempo.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                        <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Nunca olvides un pago
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Activa las notificaciones para recibir recordatorios a tiempo sobre tus servicios y pagos recurrentes.
                </p>

                <ul className="space-y-3 mb-6">
                    {[
                        { icon: '📅', text: 'Recordatorios 3 días antes del cobro' },
                        { icon: '⏰', text: 'Alertas el día del pago' },
                        { icon: '💰', text: 'Notificaciones de presupuesto' }
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <span className="text-2xl">{item.icon}</span>
                            <span>{item.text}</span>
                        </li>
                    ))}
                </ul>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        💡 <strong>Tip:</strong> Abre QUANTA regularmente para mantener tus recordatorios actualizados.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Ahora no
                    </button>
                    <button
                        onClick={handleEnable}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Activando...
                            </span>
                        ) : (
                            'Activar Notificaciones'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
