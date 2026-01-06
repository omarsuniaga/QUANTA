import React, { useState } from 'react';
import { Key, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface GeminiApiKeySettingsProps {
  currentApiKey?: string;
  onSave: (apiKey: string) => void;
}

export const GeminiApiKeySettings: React.FC<GeminiApiKeySettingsProps> = ({
  currentApiKey = '',
  onSave
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleTest = async () => {
    if (!apiKey || apiKey.trim() === '') {
      setTestResult({
        success: false,
        message: 'Por favor ingresa una API key primero'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await geminiService.testApiKey(apiKey);
      setTestResult(result);

      // Si es exitoso, guardar automáticamente
      if (result.success) {
        setTimeout(() => {
          onSave(apiKey);
        }, 1000);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(apiKey);
    setTestResult({
      success: true,
      message: '✅ API Key guardada correctamente'
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleClear = () => {
    setApiKey('');
    setTestResult(null);
    onSave('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
          <Key className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 dark:text-white">Gemini API Key</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Habilita funciones de IA con tu propia API key
          </p>
        </div>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Obtén tu API key en{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
          >
            Google AI Studio
          </a>
        </p>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2 ${testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
            }`}
        >
          {testResult.success ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <X className="w-5 h-5 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={testing || !apiKey}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-semibold transition-colors disabled:cursor-not-allowed"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Probar API Key
            </>
          )}
        </button>

        {currentApiKey && currentApiKey !== apiKey && (
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            Guardar
          </button>
        )}

        {apiKey && (
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Info Box */}
      {/* 
        SECURITY NOTE (Threat Model):
        The API key is stored in localStorage. 
        - QUANTA is a client-side only application; keys are never sent to a QUANTA server.
        - Risk is limited to local access: anyone with access to the browser dev tools on this machine could retrieve it.
        - This is acceptable as transaction data shares the same local-only security profile.
      */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>💡 Nota:</strong> Tu API key se guarda localmente en tu navegador y solo se usa para las funcionalidades de IA de QUANTA. Nunca se comparte con servidores externos.
        </p>
      </div>
    </div>
  );
};
