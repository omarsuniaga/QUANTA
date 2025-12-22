import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Calendar, DollarSign, Tag, AlignLeft, ArrowUpRight, ArrowDownRight, Zap, Bell, Check, Search, Camera, Smile, Meh, Frown, Music, Briefcase, CreditCard, Users, Plus, RefreshCw, Settings, Pencil, Calculator as CalcIcon, Clock } from 'lucide-react';
import { Category, TransactionType, Frequency, PaymentMethod, Mood, Account, CustomCategory } from '../types';
import { Button } from './Button';
import { storageService } from '../services/storageService';
import { useI18n } from '../contexts/I18nContext';
import { DynamicIcon, getColorClasses, IconPicker } from './IconPicker';
import { Calculator } from './Calculator';

type ModalMode = 'income' | 'expense' | 'service';

interface ActionModalProps {
  mode: ModalMode;
  onClose: () => void;
  onSave: (data: any) => void;
  initialValues?: {
    category?: string;
    amount?: number;
    description?: string;
    paymentMethod?: string;
    date?: string;
    time?: string;
  };
  currencySymbol?: string;
}

const ActionModalComponent: React.FC<ActionModalProps> = ({ mode, onClose, onSave, initialValues, currencySymbol = '$' }) => {
  // Common Fields
  const [amount, setAmount] = useState(initialValues?.amount?.toString() || '');
  const [concept, setConcept] = useState(initialValues?.description || ''); // Description/Name
  const [category, setCategory] = useState<string>(initialValues?.category || '');
  
  // Extract date and time from initialValues if editing, otherwise use current
  const extractDateTime = () => {
    if (initialValues?.date) {
      const dateTimeParts = initialValues.date.split('T');
      const datePart = dateTimeParts[0]; // yyyy-MM-dd
      const timePart = dateTimeParts[1] ? dateTimeParts[1].substring(0, 5) : new Date().toTimeString().slice(0, 5); // HH:MM
      return { date: datePart, time: timePart };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    };
  };
  
  const dateTime = extractDateTime();
  const [date, setDate] = useState(dateTime.date);
  const [time, setTime] = useState(dateTime.time);
  const [paymentMethodId, setPaymentMethodId] = useState<string>(initialValues?.paymentMethod || '');

  // Recurring Logic (Shared state, logic differs by mode)
  const [isRecurring, setIsRecurring] = useState(false); // Default to false
  const [frequency, setFrequency] = useState<Frequency>('monthly');

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);

  // Expense Specific
  const [notes, setNotes] = useState(''); // "Why?"
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);

  // Income Specific
  const [gigType, setGigType] = useState<string>('');

  // Income Type
  const [incomeType, setIncomeType] = useState<'salary' | 'extra'>('salary');
  // Income already in account balance (to avoid double counting)
  const [isAlreadyInBalance, setIsAlreadyInBalance] = useState(false);

  // Service Specific
  const [chargeDay, setChargeDay] = useState(1);
  const [reminderDays, setReminderDays] = useState(3);

  // Data
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  
  // New Category Form
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState({ es: '', en: '' });
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('slate');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // i18n
  const { language } = useI18n();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const concepts = await storageService.getCommonConcepts(mode);
      const accs = await storageService.getAccounts();
      const cats = await storageService.getCategories();
      setSuggestions(concepts);
      setAccounts(accs);
      setCustomCategories(cats);

      if (!paymentMethodId && accs.length > 0) {
        setPaymentMethodId(accs[0].id);
      }
    };
    loadData();

    // Set default category
    if (!category) {
      if (mode === 'expense') setCategory('food');
      if (mode === 'service') setCategory('subscriptions');
      if (mode === 'income') setCategory('salary');
    }
  }, [mode, category, paymentMethodId]);

  const handleConceptChange = useCallback((val: string) => {
    setConcept(val);
    if (val.length > 1) setShowSuggestions(true);
    else setShowSuggestions(false);
  }, []);

  const selectSuggestion = useCallback((val: string) => {
    setConcept(val);
    setShowSuggestions(false);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // IMPORTANTE: Guardar fecha como YYYY-MM-DD (sin timezone) para evitar desfase de ±1 día
    // La fecha representa "el día del evento" en el calendario del usuario, no un instante UTC
    const eventDate = date; // Ya viene como "YYYY-MM-DD" del input type="date"

    // Determinar el tipo de método de pago basado en el ID seleccionado
    let paymentType: 'cash' | 'bank' | 'card' | 'other' | undefined = undefined;
    if (paymentMethodId) {
      if (paymentMethodId === 'cash') {
        paymentType = 'cash';
      } else {
        // Buscar la cuenta en accounts para obtener su tipo
        const selectedAccount = accounts.find(acc => acc.id === paymentMethodId);
        if (selectedAccount) {
          paymentType = selectedAccount.type === 'wallet' ? 'other' : selectedAccount.type;
        }
      }
    }

    const baseData = {
      amount: parseFloat(amount),
      description: concept,
      category,
      paymentMethodId: paymentMethodId || null,
      paymentMethodType: paymentType,
      // Mantener paymentMethod para backward compatibility
      paymentMethod: paymentMethodId,
    };

    if (mode === 'service') {
      onSave({
        ...baseData,
        name: concept,
        chargeDay,
        frequency,
        reminderDays
      });
    } else {
      // Income or Expense
      onSave({
        ...baseData,
        type: mode as TransactionType,
        date: eventDate, // Guardar solo YYYY-MM-DD (fecha calendario, no timestamp)
        time: time, // Guardar hora por separado si se necesita para ordenamiento
        notes,
        mood,
        gigType: mode === 'income' ? gigType : undefined,
        incomeType: mode === 'income' ? incomeType : undefined,
        isIncludedInAccountBalance: mode === 'income' ? isAlreadyInBalance : undefined,
        isRecurring: isRecurring,
        frequency: isRecurring ? frequency : null
      });
    }
    onClose();
  }, [mode, amount, concept, category, paymentMethodId, accounts, date, time, notes, mood, gigType, incomeType, isAlreadyInBalance, isRecurring, frequency, chargeDay, reminderDays, onSave, onClose]);

  // UI Config
  const config = {
    income: {
      color: 'emerald',
      icon: ArrowUpRight,
      title: 'Registrar Ingreso',
      label: 'Concepto',
      placeholder: 'Ej: Boda, Concierto...',
      submit: 'Guardar Ingreso'
    },
    expense: {
      color: 'rose',
      icon: ArrowDownRight,
      title: 'Registrar Gasto',
      label: 'Descripción',
      placeholder: 'Ej: Supermercado, Uber...',
      submit: 'Guardar Gasto'
    },
    service: {
      color: 'indigo',
      icon: Zap,
      title: 'Nuevo Servicio',
      label: 'Nombre del Servicio',
      placeholder: 'Ej: Netflix, Renta...',
      submit: 'Guardar Servicio'
    }
  }[mode];

  const colorClasses: Record<string, string> = {
    'emerald': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
    'rose': 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800',
    'indigo': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800',
    'slate': 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-0 sm:p-4">
      {/* Backdrop separado */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />
      
      {/* Modal centrado en viewport */}
      <div className="relative z-[110] bg-white dark:bg-slate-900 w-full max-w-md lg:max-w-lg max-h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-2">
          <div className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border ${colorClasses[config.color] || colorClasses['slate']}`}>
            <config.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">{config.title}</span>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 pb-24">

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-4">

            {/* Amount Field */}
            <div className="text-center py-1 sm:py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-300 dark:text-slate-600 text-2xl sm:text-3xl font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  autoFocus
                  step="0.01"
                  className="w-40 sm:w-48 text-center text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white placeholder-slate-200 dark:placeholder-slate-700 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCalculator(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors group"
                  title="Abrir calculadora"
                >
                  <CalcIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </button>
              </div>
            </div>

            {/* EXPENSE: Mood Selector and Recurring Checkbox */}
            {mode === 'expense' && (
              <div className="space-y-3">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">¿Cómo te sientes?</span>
                  <div className="flex gap-4">
                    {[
                      { val: 'happy', icon: Smile, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
                      { val: 'neutral', icon: Meh, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
                      { val: 'tired', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
                      { val: 'stressed', icon: Frown, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' }
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setMood(m.val as Mood)}
                        className={`p-2 rounded-full transition-all ${mood === m.val ? `ring-2 ring-offset-2 ring-${m.color.split('-')[1]}-400 scale-110 shadow-sm` : 'opacity-60 hover:opacity-100'}`}
                      >
                        <div className={`p-1.5 rounded-full ${m.color}`}>
                          <m.icon className="w-5 h-5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Recurring Checkbox */}
                <div className="flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="recurring-check-expense"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <label htmlFor="recurring-check-expense" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer select-none">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    Es recurrente
                  </label>
                  {isRecurring && (
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as Frequency)}
                      className="ml-2 px-2 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="weekly">Semanal</option>
                      <option value="yearly">Anual</option>
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Concept / Name with Autocomplete */}
            <div className="relative z-20">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">{config.label}</label>
              <div className="relative">
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => handleConceptChange(e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  required
                />
                <div className="absolute right-3 top-3.5 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30">
                  {suggestions.filter(s => s.toLowerCase().includes(concept.toLowerCase())).slice(0, 4).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EXPENSE CATEGORY CHIPS */}
            {mode === 'expense' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Nueva
                  </button>
                </div>

                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 fade-in">
                    <div className="flex gap-3">
                      {/* Icon/Color Picker Button */}
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(true)}
                        className={`p-3 rounded-xl ${getColorClasses(newCatColor).bg} ${getColorClasses(newCatColor).text} hover:opacity-80 transition-opacity`}
                      >
                        <DynamicIcon name={newCatIcon} className="w-5 h-5" />
                      </button>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={newCatName.es}
                          onChange={(e) => setNewCatName({ ...newCatName, es: e.target.value })}
                          placeholder="Nombre (Español)"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={newCatName.en}
                          onChange={(e) => setNewCatName({ ...newCatName, en: e.target.value })}
                          placeholder="Name (English)"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (newCatName.es && newCatName.en) {
                            const newCat = await storageService.addCategory({
                              key: newCatName.en.replace(/\s+/g, ''),
                              name: newCatName,
                              icon: newCatIcon,
                              color: newCatColor,
                              type: 'expense',
                              order: customCategories.length
                            });
                            setCustomCategories([...customCategories, newCat]);
                            setCategory(newCat.id);
                            setShowNewCategoryForm(false);
                            setNewCatName({ es: '', en: '' });
                            setNewCatIcon('Tag');
                            setNewCatColor('slate');
                          }
                        }}
                        className="flex-1 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Category Chips */}
                <div className="flex flex-wrap gap-2">
                  {customCategories
                    .filter(cat => cat.type === 'expense' || cat.type === 'both')
                    .map(cat => {
                      const colorClasses = getColorClasses(cat.color);
                      const isSelected = category === cat.id;
                      const catName = language.startsWith('es') ? cat.name.es : cat.name.en;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                              ? `${colorClasses.bg} ${colorClasses.text} border-transparent shadow-md ring-2 ${colorClasses.ring}`
                              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                        >
                          <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                          {catName}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {mode !== 'service' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Fecha</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Hora</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-9 pr-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Método de Pago</label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 z-10" />
                      <select
                        value={paymentMethodId}
                        onChange={(e) => setPaymentMethodId(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium outline-none appearance-none cursor-pointer"
                        style={{ colorScheme: 'light dark' }}
                      >
                        <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">Sin especificar</option>
                        <option value="cash" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">💵 Efectivo</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                            {acc.type === 'bank' ? '🏦' : acc.type === 'card' ? '💳' : acc.type === 'wallet' ? '👛' : '💰'} {acc.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recurring Options for Income/Expense */}
                {mode === 'income' && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="recurring-check-income"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                      />
                      <label htmlFor="recurring-check-income" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer select-none">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        Es recurrente
                      </label>
                    </div>

                    {isRecurring && (
                      <div className="pl-8 pt-1 animate-in slide-in-from-top-2 fade-in">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Frecuencia</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as Frequency)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-white outline-none"
                        >
                          <option value="monthly">Mensual</option>
                          <option value="weekly">Semanal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Income Type Selector */}
                {mode === 'income' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Tipo de Ingreso</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIncomeType('salary')}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            incomeType === 'salary'
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Briefcase className="w-4 h-4" />
                          Salario
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncomeType('extra')}
                          className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            incomeType === 'extra'
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          Extra
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {incomeType === 'salary' ? 'Ingreso regular: sueldo mensual o quincenal' : 'Ingreso adicional: freelance, bonos, ventas, etc.'}
                      </p>
                    </div>

                    {/* Income Category Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Categoría</label>
                      <div className="flex flex-wrap gap-2">
                        {customCategories
                          .filter(cat => cat.type === 'income' || cat.type === 'both')
                          .map(cat => {
                            const colorClasses = getColorClasses(cat.color);
                            const isSelected = category === cat.id;
                            const catName = language.startsWith('es') ? cat.name.es : cat.name.en;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                                    ? `${colorClasses.bg} ${colorClasses.text} border-transparent shadow-md ring-2 ${colorClasses.ring}`
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                                  }`}
                              >
                                <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                                {catName}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Already in Account Balance Toggle */}
                    {accounts.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="already-in-balance"
                            checked={isAlreadyInBalance}
                            onChange={(e) => setIsAlreadyInBalance(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded-md text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-700"
                          />
                          <div className="flex-1">
                            <label htmlFor="already-in-balance" className="text-sm font-bold text-amber-800 dark:text-amber-300 cursor-pointer select-none block">
                              Este monto ya está en mis cuentas
                            </label>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
                              {isAlreadyInBalance 
                                ? '✓ El ingreso NO se sumará al balance disponible (ya está reflejado en tus cuentas)' 
                                : '⚠️ Marca esta opción si el dinero ya forma parte del saldo de alguna de tus cuentas registradas'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* SERVICE SPECIFIC FIELDS */}
            {mode === 'service' && (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Día de Cobro</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={chargeDay}
                      onChange={(e) => setChargeDay(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center font-bold text-indigo-900 dark:text-indigo-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Frecuencia</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as Frequency)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-semibold text-indigo-900 dark:text-indigo-300 outline-none"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="weekly">Semanal</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm font-medium">Recordatorio</span>
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-indigo-200 dark:border-indigo-800 px-1">
                    <button type="button" onClick={() => setReminderDays(Math.max(0, reminderDays - 1))} className="px-2 py-1 text-indigo-600 dark:text-indigo-400 font-bold">-</button>
                    <span className="w-6 text-center text-sm font-bold text-indigo-900 dark:text-indigo-300">{reminderDays}d</span>
                    <button type="button" onClick={() => setReminderDays(reminderDays + 1)} className="px-2 py-1 text-indigo-600 dark:text-indigo-400 font-bold">+</button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Pagar con</label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-medium text-indigo-900 dark:text-indigo-300 outline-none"
                  >
                    <option value="cash">💵 Efectivo</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === 'bank' ? '🏦' : acc.type === 'card' ? '💳' : acc.type === 'wallet' ? '👛' : '💰'} {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Button type="submit" fullWidth className={`mt-4 shadow-xl shadow-${config.color}-200 dark:shadow-none bg-${config.color}-600 hover:bg-${config.color}-700 border-none`}>
              {config.submit}
            </Button>
          </form>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={newCatIcon}
          selectedColor={newCatColor}
          onIconChange={setNewCatIcon}
          onColorChange={setNewCatColor}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator
          initialValue={parseFloat(amount) || 0}
          onConfirm={(value) => {
            setAmount(value.toString());
            setShowCalculator(false);
          }}
          onClose={() => setShowCalculator(false)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: ActionModalProps, nextProps: ActionModalProps) => {
  return (
    prevProps.mode === nextProps.mode &&
    prevProps.currencySymbol === nextProps.currencySymbol &&
    prevProps.initialValues === nextProps.initialValues &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onSave === nextProps.onSave
  );
};

export const ActionModal = memo(ActionModalComponent, arePropsEqual);