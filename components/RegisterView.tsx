import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from './Button';
import { ErrorModal } from './ErrorModal';

interface RegisterViewProps {
  onRegister: (email: string, password?: string, name?: string) => Promise<void>;
  onSwitchToLogin: () => void;
  onBackToHome: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onRegister, onSwitchToLogin, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error al Registrarse');

  const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || error.toString();
    if (msg.includes('auth/email-already-in-use')) {
      return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
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
      await onRegister(email, password, name);
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Crear Cuenta</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Inicia tu viaje hacia la libertad financiera.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800 dark:text-white" 
              placeholder="Juan Pérez"
            />
          </div>
          
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
            Crear Cuenta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Inicia Sesión
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