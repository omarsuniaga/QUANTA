import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Trash2, AlertTriangle, CheckCircle, Clock, Database, Zap } from 'lucide-react';
import { geminiRateLimiter } from '../services/apiRateLimiter';
import { geminiService } from '../services/geminiService';
import { useI18n } from '../contexts/I18nContext';

interface APIUsageMonitorProps {
  onClose?: () => void;
}

export const APIUsageMonitor: React.FC<APIUsageMonitorProps> = ({ onClose }) => {
  const { language } = useI18n();
  const [stats, setStats] = useState(geminiRateLimiter.getStats());
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Actualizar stats cada segundo
    const interval = setInterval(() => {
      setStats(geminiRateLimiter.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    geminiService.clearCache();
    setTimeout(() => {
      setIsClearing(false);
      setStats(geminiRateLimiter.getStats());
    }, 500);
  };

  const handleResetCooldown = () => {
    geminiRateLimiter.resetCooldown();
    setStats(geminiRateLimiter.getStats());
  };

  const usagePercent = (stats.requestsInLastMinute / stats.maxRequestsPerMinute) * 100;
  const cooldownSeconds = Math.ceil(stats.cooldownRemaining / 1000);

  const t = language === 'es' ? {
    title: 'Monitor de API',
    subtitle: 'Control de uso de Gemini AI',
    requestsPerMinute: 'Peticiones/min',
    cacheEntries: 'Cache',
    queueLength: 'En cola',
    status: 'Estado',
    statusOk: 'Operativo',
    statusCooldown: 'En enfriamiento',
    statusWarning: 'Alto uso',
    clearCache: 'Limpiar Cache',
    resetCooldown: 'Forzar Reset',
    cooldownRemaining: 'Enfriamiento restante',
    seconds: 'segundos',
    tip: 'El sistema controla automáticamente las peticiones para evitar exceder los límites de la API gratuita de Gemini.',
    cacheInfo: 'Las respuestas se almacenan en caché para reducir peticiones y mejorar la velocidad.'
  } : {
    title: 'API Monitor',
    subtitle: 'Gemini AI Usage Control',
    requestsPerMinute: 'Requests/min',
    cacheEntries: 'Cache',
    queueLength: 'Queue',
    status: 'Status',
    statusOk: 'Operational',
    statusCooldown: 'Cooling down',
    statusWarning: 'High usage',
    clearCache: 'Clear Cache',
    resetCooldown: 'Force Reset',
    cooldownRemaining: 'Cooldown remaining',
    seconds: 'seconds',
    tip: 'The system automatically controls requests to avoid exceeding Gemini free API limits.',
    cacheInfo: 'Responses are cached to reduce requests and improve speed.'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-soft border border-slate-100 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{t.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          stats.isInCooldown 
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : usagePercent > 70
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        }`}>
          {stats.isInCooldown ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.statusCooldown}
            </>
          ) : usagePercent > 70 ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              {t.statusWarning}
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              {t.statusOk}
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Requests per minute */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">{t.requestsPerMinute}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.requestsInLastMinute}</span>
            <span className="text-xs text-slate-400">/ {stats.maxRequestsPerMinute}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
        </div>

        {/* Cache entries */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">{t.cacheEntries}</span>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.cacheSize}</span>
        </div>

        {/* Queue length */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">{t.queueLength}</span>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white">{stats.queueLength}</span>
        </div>
      </div>

      {/* Cooldown Alert */}
      {stats.isInCooldown && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">{t.cooldownRemaining}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{cooldownSeconds}</span>
            <span className="text-sm text-red-500">{t.seconds}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleClearCache}
          disabled={isClearing || stats.cacheSize === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClearing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {t.clearCache}
        </button>
        
        {stats.isInCooldown && (
          <button
            onClick={handleResetCooldown}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.resetCooldown}
          </button>
        )}
      </div>

      {/* Info tip */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
          💡 {t.tip}
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 opacity-80">
          {t.cacheInfo}
        </p>
      </div>
    </div>
  );
};
