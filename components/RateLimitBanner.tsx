import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface RateLimitBannerProps {
  remainingSeconds: number;
  onDismiss?: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ remainingSeconds, onDismiss }) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down">
      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1">
              API Rate Limit
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-400 mb-2">
              Gemini API está temporalmente limitado. Usando datos en caché.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-500">
              <Clock className="w-4 h-4" />
              <span>
                Disponible en: {minutes > 0 && `${minutes}m `}{seconds}s
              </span>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
