import React, { useState, useEffect } from 'react';
import { X, Mic, Wand2, Calendar, DollarSign, AlignLeft, Tag } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { Button } from './Button';
import { geminiService } from '../services/geminiService';

interface TransactionFormProps {
  initialData?: Transaction;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onSave, onClose }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<string>(initialData?.category || Category.Food);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState<boolean>(initialData?.isRecurring || false);
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>((initialData?.frequency as 'monthly' | 'yearly' | 'weekly') || 'mensual');
  
  // AI Smart Add State
  const [smartInput, setSmartInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showSmartAdd, setShowSmartAdd] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
    });
    onClose();
  };

  const handleSmartAdd = async () => {
    if (!smartInput.trim()) return;
    setIsProcessingAI(true);
    const result = await geminiService.parseTransaction(smartInput);
    setIsProcessingAI(false);
    
    if (result) {
      if (result.type) setType(result.type as TransactionType);
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.description) setDescription(result.description);
      if (result.date) setDate(result.date);
      if (result.isRecurring !== undefined) setIsRecurring(result.isRecurring);
      if (result.frequency) setFrequency(result.frequency as 'monthly' | 'weekly' | 'yearly');
      setShowSmartAdd(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {initialData ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Introduce los detalles financieros</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Smart Add Toggle */}
          {!initialData && process.env.API_KEY && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-1 rounded-2xl border border-indigo-100">
              <button 
                onClick={() => setShowSmartAdd(!showSmartAdd)}
                className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-white/50 transition-colors group"
              >
                 <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600 group-hover:text-indigo-700 group-hover:scale-110 transition-all">
                     <Wand2 className="w-4 h-4" /> 
                   </div>
                   <div className="text-left">
                     <p className="text-sm font-bold text-slate-800">Smart Add con IA</p>
                     <p className="text-xs text-slate-500">Escribe en lenguaje natural</p>
                   </div>
                 </div>
                 <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg">
                   {showSmartAdd ? 'Ocultar' : 'Probar'}
                 </span>
              </button>
              
              {showSmartAdd && (
                <div className="p-3 pt-1 animate-in fade-in slide-in-from-top-2">
                  <textarea
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    placeholder="Ej: Pagué 500 de luz ayer..."
                    className="w-full p-4 rounded-xl border-none bg-white shadow-inner text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 mb-3 resize-none"
                    rows={3}
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleSmartAdd} 
                    isLoading={isProcessingAI}
                    className="w-full text-sm py-2.5 shadow-indigo-200"
                  >
                    Auto-completar
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Gasto
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Monto</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-lg font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-9 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-xl font-bold placeholder-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Categoría</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-slate-400" />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full pl-9 pr-8 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white appearance-none outline-none transition-all"
                  >
                    {Object.values(Category).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Fecha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full pl-9 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Descripción</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlignLeft className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full pl-9 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="Ej: Renta mensual"
                />
              </div>
            </div>

            {/* Recurring Checkbox */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 transition-all hover:border-indigo-200">
              <div className="flex items-center">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded-md cursor-pointer"
                />
                <label htmlFor="isRecurring" className="ml-3 block text-sm text-slate-700 font-semibold cursor-pointer">
                  Pago Recurrente
                </label>
              </div>
              
              {isRecurring && (
                <div className="mt-4 pl-8 animate-in fade-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="block w-full py-2.5 px-3 bg-white text-sm rounded-lg border border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1 shadow-indigo-300 shadow-lg">
                Guardar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};