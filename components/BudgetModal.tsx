import React, { useState, useEffect } from 'react';
import { X, Calendar, Palette, DollarSign, ShoppingCart, Fuel, Lightbulb, Home, Car, Utensils, CreditCard, Smartphone, Gamepad2, Shirt, GraduationCap, Heart, Plane, Gift, Music, Coffee, Briefcase, Stethoscope, Dumbbell, Calculator as CalcIcon } from 'lucide-react';
import { Budget, CustomCategory } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { storageService } from '../services/storageService';
import { Calculator } from './Calculator';

interface BudgetModalProps {
  isOpen: boolean;
  budget?: Budget | null;
  categories: string[];
  currencySymbol: string;
  onClose: () => void;
  onSave: (budget: Partial<Budget>) => void;
}

const BUDGET_COLORS = [
  { nameEs: 'Púrpura', nameEn: 'Purple', class: 'bg-purple-500', textClass: 'text-white', value: 'purple' },
  { nameEs: 'Azul', nameEn: 'Blue', class: 'bg-blue-500', textClass: 'text-white', value: 'blue' },
  { nameEs: 'Verde', nameEn: 'Green', class: 'bg-emerald-500', textClass: 'text-white', value: 'emerald' },
  { nameEs: 'Amarillo', nameEn: 'Yellow', class: 'bg-amber-500', textClass: 'text-white', value: 'amber' },
  { nameEs: 'Rosa', nameEn: 'Pink', class: 'bg-rose-500', textClass: 'text-white', value: 'rose' },
  { nameEs: 'Índigo', nameEn: 'Indigo', class: 'bg-indigo-500', textClass: 'text-white', value: 'indigo' },
];

// Lucide icons for budgets
const BUDGET_ICONS = [
  { name: 'DollarSign', icon: DollarSign },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Fuel', icon: Fuel },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Home', icon: Home },
  { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Shirt', icon: Shirt },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Heart', icon: Heart },
  { name: 'Plane', icon: Plane },
  { name: 'Gift', icon: Gift },
  { name: 'Music', icon: Music },
  { name: 'Coffee', icon: Coffee },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Stethoscope', icon: Stethoscope },
  { name: 'Dumbbell', icon: Dumbbell },
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  budget,
  categories,
  currencySymbol,
  onClose,
  onSave,
}) => {
  const { t, language } = useI18n();
  const { settings } = useSettings();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' as 'monthly' | 'yearly',
    color: BUDGET_COLORS[0].value,
    icon: BUDGET_ICONS[0].name,
    resetDay: '1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load custom categories
  useEffect(() => {
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  // Get expense categories from settings or custom categories
  const expenseCategories = React.useMemo(() => {
    const settingsCats = settings?.categories?.filter(c => c.type === 'expense') || [];
    const customCats = customCategories.filter(c => c.type === 'expense' || c.type === 'both');
    
    // Combine and dedupe
    const allCats: { id: string; name: string }[] = [];
    
    settingsCats.forEach(cat => {
      const name = typeof cat.name === 'object' 
        ? (cat.name[language as keyof typeof cat.name] || cat.name.es || cat.name.en) 
        : cat.name;
      allCats.push({ id: cat.id, name });
    });
    
    customCats.forEach(cat => {
      if (!allCats.find(c => c.id === cat.id)) {
        const name = cat.name[language as 'es' | 'en'] || cat.name.es || cat.name.en;
        allCats.push({ id: cat.id, name });
      }
    });
    
    return allCats;
  }, [settings?.categories, customCategories, language]);

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
        color: budget.color || BUDGET_COLORS[0].value,
        icon: budget.icon || BUDGET_ICONS[0].name,
        resetDay: (budget.resetDay || 1).toString(),
      });
    } else {
      setFormData({
        name: '',
        category: expenseCategories[0]?.id || categories[0] || '',
        limit: '',
        period: 'monthly',
        color: BUDGET_COLORS[0].value,
        icon: BUDGET_ICONS[0].name,
        resetDay: '1',
      });
    }
    setErrors({});
  }, [budget, categories, expenseCategories, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = language === 'es' ? 'La categoría es requerida' : 'Category is required';
    }

    const limitNum = parseFloat(formData.limit);
    if (!formData.limit || isNaN(limitNum) || limitNum <= 0) {
      newErrors.limit = language === 'es' ? 'Ingresa un monto válido mayor a 0' : 'Enter a valid amount greater than 0';
    }

    const resetDay = parseInt(formData.resetDay);
    if (isNaN(resetDay) || resetDay < 1 || resetDay > 31) {
      newErrors.resetDay = language === 'es' ? 'Ingresa un día válido (1-31)' : 'Enter a valid day (1-31)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get category name for the budget name
    const categoryName = expenseCategories.find(c => c.id === formData.category)?.name || formData.category;

    const budgetData: Partial<Budget> = {
      name: formData.name.trim() || categoryName,
      category: formData.category,
      limit: parseFloat(formData.limit),
      period: formData.period,
      color: formData.color,
      icon: formData.icon,
      resetDay: parseInt(formData.resetDay),
      isActive: true,
      updatedAt: Date.now(),
    };

    if (budget) {
      budgetData.id = budget.id;
    } else {
      budgetData.createdAt = Date.now();
    }

    onSave(budgetData);
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const cat = expenseCategories.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const getSelectedIcon = () => {
    const iconData = BUDGET_ICONS.find(i => i.name === formData.icon);
    return iconData?.icon || DollarSign;
  };

  if (!isOpen) return null;

  const SelectedIcon = getSelectedIcon();

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold">
            {budget 
              ? (language === 'es' ? 'Editar Presupuesto' : 'Edit Budget')
              : (language === 'es' ? 'Nuevo Presupuesto' : 'New Budget')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {language === 'es' ? 'Categoría' : 'Category'}
            </label>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleChange('category', cat.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    formData.category === cat.id
                      ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-rose-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Limit with Calculator */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {language === 'es' ? 'Límite de Presupuesto' : 'Budget Limit'}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limit}
                  onChange={e => handleChange('limit', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg font-semibold ${
                    errors.limit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCalculator(true)}
                className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors group"
                title={language === 'es' ? 'Abrir calculadora' : 'Open calculator'}
              >
                <CalcIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </button>
            </div>
            {errors.limit && (
              <p className="text-rose-500 text-xs mt-1">{errors.limit}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {language === 'es' ? 'Período' : 'Period'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange('period', 'monthly')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  formData.period === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {language === 'es' ? 'Mensual' : 'Monthly'}
              </button>
              <button
                type="button"
                onClick={() => handleChange('period', 'yearly')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  formData.period === 'yearly'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {language === 'es' ? 'Anual' : 'Yearly'}
              </button>
            </div>
          </div>

          {/* Reset Day */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {language === 'es' ? 'Día de Reinicio' : 'Reset Day'}
              <span className="text-slate-400 dark:text-slate-500 font-normal ml-2">(1-31)</span>
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.resetDay}
              onChange={e => handleChange('resetDay', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                errors.resetDay ? 'border-rose-500' : 'border-slate-200 dark:border-slate-600'
              }`}
            />
            {errors.resetDay && (
              <p className="text-rose-500 text-xs mt-1">{errors.resetDay}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {language === 'es' 
                ? `El presupuesto se reiniciará cada ${formData.period === 'monthly' ? 'mes' : 'año'} en el día ${formData.resetDay}`
                : `Budget will reset every ${formData.period === 'monthly' ? 'month' : 'year'} on day ${formData.resetDay}`}
            </p>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              {language === 'es' ? 'Ícono' : 'Icon'}
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {BUDGET_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleChange('icon', name)}
                  className={`aspect-square p-2 rounded-xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                    formData.icon === name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              <Palette className="w-3.5 h-3.5 inline mr-1" />
              {language === 'es' ? 'Color' : 'Color'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGET_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleChange('color', color.value)}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${color.class} ${color.textClass} ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-indigo-500 shadow-lg scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {language === 'es' ? color.nameEs : color.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              {language === 'es' ? 'Vista Previa' : 'Preview'}
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${formData.color}-100 dark:bg-${formData.color}-900/30 text-${formData.color}-600 dark:text-${formData.color}-400`}>
                  <SelectedIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">
                    {getCategoryName(formData.category) || (language === 'es' ? 'Categoría' : 'Category')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formData.period === 'monthly' ? (language === 'es' ? 'Mensual' : 'Monthly') : (language === 'es' ? 'Anual' : 'Yearly')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-slate-800 dark:text-white">
                    {currencySymbol}{formData.limit || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            {budget 
              ? (language === 'es' ? 'Guardar' : 'Save')
              : (language === 'es' ? 'Crear' : 'Create')}
          </button>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <Calculator
          initialValue={parseFloat(formData.limit) || 0}
          onConfirm={(value) => {
            handleChange('limit', value.toString());
            setShowCalculator(false);
          }}
          onClose={() => setShowCalculator(false)}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
};
