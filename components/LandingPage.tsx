import React, { useState } from 'react';
import { 
  Wallet, Sparkles, Shield, Zap, TrendingUp, Smartphone, 
  ArrowRight, Brain, LayoutGrid, Users, CreditCard,
  Menu, X
} from 'lucide-react';
import { Button } from './Button';
import { ErrorModal } from './ErrorModal';

interface LandingPageProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onRegister: (email: string, password?: string, name?: string) => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Error Handling State
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error de Autenticación');

  const getFriendlyErrorMessage = (error: any): string => {
    const msg = error.message || error.toString();
    if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('invalid-credential')) {
      return 'El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
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
      if (view === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
    } catch (error: any) {
      setErrorTitle(view === 'login' ? 'Error al Iniciar Sesión' : 'Error al Registrarse');
      setErrorMessage(getFriendlyErrorMessage(error));
      setErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const navLinkClass = "text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer";

  // --- SECTIONS ---

  const HeroSection = () => (
    <div className="relative pt-24 pb-12 lg:pt-32 lg:pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wide mb-6 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-3 h-3" />
          <span>Potenciado por Gemini AI</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6">
          Domina tu Dinero con <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Inteligencia Financiera</span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 delay-100">
          QUANTA no es solo un tracker. Es un sistema operativo financiero personal que predice tu flujo de caja, automatiza tus facturas y te ayuda a ahorrar para lo que más importa.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 delay-200">
          <Button onClick={() => setView('register')} className="h-12 px-8 text-base shadow-xl shadow-indigo-200 dark:shadow-none">
            Comenzar Gratis
          </Button>
          <Button variant="secondary" onClick={() => {
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }} className="h-12 px-8 text-base dark:bg-slate-800 dark:text-white dark:border-slate-700">
            Cómo funciona
          </Button>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl -z-10 opacity-40 dark:opacity-20 pointer-events-none">
         <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
         <div className="absolute top-20 right-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );

  const FeaturesSection = () => (
    <div id="features" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">¿Por qué QUANTA?</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Todo lo que necesitas para dejar de preocuparte por el dinero y comenzar a construir riqueza.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain, color: 'indigo',
              title: 'Coach Financiero IA',
              desc: 'Recibe consejos personalizados, análisis de gastos y tips de ahorro potenciados por Gemini AI.'
            },
            {
              icon: Zap, color: 'amber',
              title: 'Automatización Inteligente',
              desc: 'Las facturas recurrentes se rastrean automáticamente. Nunca pierdas una fecha de pago con recordatorios inteligentes.'
            },
            {
              icon: LayoutGrid, color: 'emerald',
              title: 'Dashboard Personalizable',
              desc: 'Crea tus propios botones de acción rápida para las transacciones que realizas con más frecuencia.'
            },
            {
              icon: Shield, color: 'rose',
              title: 'Privacidad Primero',
              desc: 'Tus datos te pertenecen. Expórtalos cuando quieras. Autenticación segura y arquitectura robusta.'
            },
            {
              icon: Users, color: 'blue',
              title: 'Billeteras Compartidas',
              desc: 'Rastrea gastos compartidos con socios o compañeros de piso fácilmente. Etiqueta usuarios en transacciones.'
            },
            {
              icon: CreditCard, color: 'violet',
              title: 'Soporte Multi-Cuenta',
              desc: 'Gestiona efectivo, cuentas bancarias y tarjetas de crédito en una vista unificada con soporte multi-moneda.'
            }
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${f.color}-100 dark:bg-${f.color}-900/30 text-${f.color}-600 dark:text-${f.color}-400 mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const HowToSection = () => (
    <div id="how-it-works" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Cómo Gestionar tus Finanzas</h2>
          <p className="text-slate-400">Ponte en marcha en menos de 2 minutos.</p>
        </div>

        <div className="space-y-12">
          {[
            {
              step: '01',
              title: 'Configura tus Cuentas',
              desc: 'Ve a Ajustes > Cuentas para definir tu Banco, Efectivo y Tarjetas de Crédito. Configura tu moneda local para reportes precisos.'
            },
            {
              step: '02',
              title: 'Personaliza Acciones Rápidas',
              desc: 'No pierdas tiempo. Configura botones como "Café", "Uber" o "Renta" en tu pantalla de inicio para registrar con un toque.'
            },
            {
              step: '03',
              title: 'Automatiza Facturas Recurrentes',
              desc: 'Agrega tus suscripciones (Netflix, Internet). Te recordaremos antes de la fecha de vencimiento y generaremos el gasto automáticamente.'
            },
            {
              step: '04',
              title: 'Establece Metas y Analiza',
              desc: 'Crea metas de ahorro (ej: "Viaje a Europa"). Usa el Coach IA para encontrar "dinero fantasma" y recortar gastos innecesarios.'
            }
          ].map((step, i) => (
            <div key={i} className="flex gap-6 md:gap-10 items-start">
              <div className="text-4xl font-black text-indigo-500 opacity-50 shrink-0 font-mono">
                {step.step}
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-slate-300 leading-relaxed max-w-xl">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
           <Button onClick={() => setView('register')} className="bg-white text-slate-900 hover:bg-slate-100 border-none shadow-none">
             Comenzar Ahora <ArrowRight className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---

  if (view === 'login' || view === 'register') {
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{view === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {view === 'login' ? 'Ingresa tus datos para acceder a tu billetera.' : 'Inicia tu viaje hacia la libertad financiera.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
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
            )}
            
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
              {view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {view === 'login' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {view === 'login' ? 'Regístrate' : 'Inicia Sesión'}
              </button>
            </p>
          </div>
        </div>
        
        {/* Back to Home Link */}
        <button onClick={() => setView('home')} className="mt-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            QUANTA
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a onClick={() => setView('home')} className={navLinkClass}>Inicio</a>
            <a href="#features" className={navLinkClass}>Características</a>
            <a href="#how-it-works" className={navLinkClass}>Cómo Funciona</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setView('login')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white">
              Iniciar Sesión
            </button>
            <Button onClick={() => setView('register')} className="h-9 px-5 text-sm rounded-xl">
              Registrarse
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-slate-700 dark:text-slate-200" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4 shadow-xl">
             <a href="#features" onClick={() => setShowMobileMenu(false)} className="text-lg font-semibold text-slate-700 dark:text-slate-200">Características</a>
             <a href="#how-it-works" onClick={() => setShowMobileMenu(false)} className="text-lg font-semibold text-slate-700 dark:text-slate-200">Cómo Funciona</a>
             <hr className="border-slate-100 dark:border-slate-800" />
             <button onClick={() => setView('login')} className="text-lg font-semibold text-slate-700 dark:text-slate-200 text-left">Iniciar Sesión</button>
             <Button onClick={() => setView('register')} fullWidth>Registrarse</Button>
          </div>
        )}
      </nav>

      <HeroSection />
      <FeaturesSection />
      <HowToSection />
      
      <footer className="bg-white dark:bg-slate-900 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
           <div className="flex items-center justify-center gap-2 font-bold text-xl text-slate-900 dark:text-white mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            QUANTA
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            &copy; {new Date().getFullYear()} QUANTA. Todos los derechos reservados.
          </p>
          <div className="flex justify-center gap-6 text-slate-400">
             <Smartphone className="w-5 h-5" />
             <TrendingUp className="w-5 h-5" />
             <Shield className="w-5 h-5" />
          </div>
        </div>
      </footer>
    </div>
  );
};