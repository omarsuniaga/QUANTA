import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from './Button';
import { ErrorModal } from './ErrorModal';

interface LoginViewProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onBackToHome: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToRegister, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error al Iniciar Sesión');

  const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || error.toString();
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('invalid-credential')) {
      return 'El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos.';
    }
    if (msg.includes('auth/too-many-requests')) {
      return 'El acceso a esta cuenta ha sido inhabilitado temporalmente debido a muchos intentos fallidos. Por favor intenta más tarde.';
    }
    if (msg.includes('network-request-failed')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    return 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (error: any) {
      setErrorMessage(getFriendlyErrorMessage(error));
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <ErrorModal 
        isOpen={errorModalOpen} 
        title={errorTitle}
        message={errorMessage} 
        onClose={() => setErrorModalOpen(false)} 
      />

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100 dark:border-slate-700 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none transform -rotate-6">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bienvenido</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Ingresa tus datos para acceder a tu billetera.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-white" 
              placeholder="nombre@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-white" 
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading} className="mt-2 shadow-lg shadow-indigo-100 dark:shadow-none">
            Iniciar Sesión
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿No tienes cuenta?{' '}
            <button 
              onClick={onSwitchToRegister}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
      
      <button onClick={onBackToHome} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium flex items-center gap-2">
        Volver al Inicio
      </button>
    </div>
  );
};