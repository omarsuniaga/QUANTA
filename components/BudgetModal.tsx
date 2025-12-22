import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Plus, RefreshCw, PiggyBank, Calculator as CalcIcon } from 'lucide-react';
import { Budget, CustomCategory } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { storageService } from '../services/storageService';
import { Calculator } from './Calculator';
import { IconPicker, DynamicIcon, getColorClasses } from './IconPicker';

interface BudgetModalProps {
  isOpen: boolean;
  budget?: Budget | null;
  categories: string[];
  currencySymbol: string;
  onClose: () => void;
  onSave: (budget: Partial<Budget>) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  budget,
  categories,
  currencySymbol,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'budget' | 'category'>('budget');
  
  // New Category Form
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState({ es: '', en: '' });
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('purple');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' as 'monthly' | 'yearly',
    color: 'purple',
    icon: 'PiggyBank',
    resetDay: '1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load custom categories
  useEffect(() => {
    storageService.getCategories().then(setCustomCategories).catch(console.error);
  }, []);

  // Get expense categories from custom categories
  const expenseCategories = React.useMemo(() => {
    return customCategories.filter(c => c.type === 'expense' || c.type === 'both');
  }, [customCategories]);

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name || '',
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
        color: budget.color || 'purple',
        icon: budget.icon || 'PiggyBank',
        resetDay: (budget.resetDay || 1).toString(),
      });
    } else {
      setFormData({
        name: '',
        category: expenseCategories[0]?.id || categories[0] || '',
        limit: '',
        period: 'monthly',
        color: 'purple',
        icon: 'PiggyBank',
        resetDay: '1',
      });
    }
    setErrors({});
    setShowNewCategoryForm(false);
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get category name for the budget name if not provided
    const categoryData = expenseCategories.find(c => c.id === formData.category);
    const categoryName = categoryData 
      ? (categoryData.name[language as 'es' | 'en'] || categoryData.name.es)
      : formData.category;

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
  }, [formData, budget, expenseCategories, language, onSave, onClose, validateForm]);

  const handleChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleAddCategory = useCallback(async () => {
    if (newCatName.es && newCatName.en) {
      const newCat = await storageService.addCategory({
        key: newCatName.en.toLowerCase().replace(/\s+/g, '_'),
        name: newCatName,
        icon: newCatIcon,
        color: newCatColor,
        type: 'expense',
        order: customCategories.length
      });
      setCustomCategories([...customCategories, newCat]);
      handleChange('category', newCat.id);
      setShowNewCategoryForm(false);
      setNewCatName({ es: '', en: '' });
      setNewCatIcon('Tag');
      setNewCatColor('purple');
    }
  }, [newCatName, newCatIcon, newCatColor, customCategories, handleChange]);

  if (!isOpen) return null;

  const colorClasses = getColorClasses(formData.color);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-all duration-300 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md lg:max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up flex flex-col relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-2">
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800">
            <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">
              {budget 
                ? (language === 'es' ? 'Editar Presupuesto' : 'Edit Budget')
                : (language === 'es' ? 'Nuevo Presupuesto' : 'New Budget')}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 pb-24">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-4">

            {/* Amount Field */}
            <div className="text-center py-1 sm:py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-300 dark:text-slate-600 text-2xl sm:text-3xl font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => handleChange('limit', e.target.value)}
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
                  title={language === 'es' ? 'Abrir calculadora' : 'Open calculator'}
                >
                  <CalcIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </button>
              </div>
              {errors.limit && <p className="text-rose-500 text-xs mt-2">{errors.limit}</p>}
            </div>

            {/* Budget Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                {language === 'es' ? 'Nombre del Presupuesto' : 'Budget Name'}
                <span className="text-slate-400 font-normal ml-1">({language === 'es' ? 'opcional' : 'optional'})</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={language === 'es' ? 'Ej: Gastos del hogar' : 'E.g.: Home expenses'}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
              />
            </div>

            {/* Category Selection with Create Option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                  {language === 'es' ? 'Categoría' : 'Category'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {language === 'es' ? 'Nueva' : 'New'}
                </button>
              </div>

              {/* New Category Form */}
              {showNewCategoryForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 fade-in">
                  <div className="flex gap-3">
                    {/* Icon/Color Picker Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIconPickerTarget('category');
                        setShowIconPicker(true);
                      }}
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={newCatName.en}
                        onChange={(e) => setNewCatName({ ...newCatName, en: e.target.value })}
                        placeholder="Name (English)"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="flex-1 py-2 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      {language === 'es' ? 'Guardar' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(false)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      {language === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              {/* Category Chips */}
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map(cat => {
                  const catColorClasses = getColorClasses(cat.color);
                  const isSelected = formData.category === cat.id;
                  const catName = language === 'es' ? cat.name.es : cat.name.en;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleChange('category', cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                          ? `${catColorClasses.bg} ${catColorClasses.text} border-transparent shadow-md ring-2 ${catColorClasses.ring}`
                          : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                    >
                      <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                      {catName}
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
            </div>

            {/* Period Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                {language === 'es' ? 'Período' : 'Period'}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('period', 'monthly')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    formData.period === 'monthly'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {language === 'es' ? 'Mensual' : 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('period', 'yearly')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    formData.period === 'yearly'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {language === 'es' ? 'Anual' : 'Yearly'}
                </button>
              </div>
            </div>

            {/* Reset Day and Icon/Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                  {language === 'es' ? 'Día de Reinicio' : 'Reset Day'}
                </label>
                <div className="relative">
                  <RefreshCw className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.resetDay}
                    onChange={(e) => handleChange('resetDay', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border text-slate-800 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.resetDay ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.resetDay && <p className="text-rose-500 text-xs mt-1">{errors.resetDay}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                  {language === 'es' ? 'Icono y Color' : 'Icon & Color'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIconPickerTarget('budget');
                    setShowIconPicker(true);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 ${colorClasses.bg} ${colorClasses.text} hover:opacity-80 transition-opacity`}
                >
                  <DynamicIcon name={formData.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{language === 'es' ? 'Cambiar' : 'Change'}</span>
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {language === 'es' ? 'Vista Previa' : 'Preview'}
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses.bg} ${colorClasses.text}`}>
                    <DynamicIcon name={formData.icon} className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate">
                      {formData.name || (expenseCategories.find(c => c.id === formData.category)?.name[language as 'es' | 'en']) || (language === 'es' ? 'Categoría' : 'Category')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formData.period === 'monthly' ? (language === 'es' ? 'Mensual' : 'Monthly') : (language === 'es' ? 'Anual' : 'Yearly')}
                      {' • '}
                      {language === 'es' ? `Reinicia el día ${formData.resetDay}` : `Resets on day ${formData.resetDay}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-slate-800 dark:text-white">
                      {currencySymbol} {formData.limit || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              {budget 
                ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes')
                : (language === 'es' ? 'Crear Presupuesto' : 'Create Budget')}
            </button>
          </form>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={iconPickerTarget === 'category' ? newCatIcon : formData.icon}
          selectedColor={iconPickerTarget === 'category' ? newCatColor : formData.color}
          onIconChange={(icon) => {
            if (iconPickerTarget === 'category') {
              setNewCatIcon(icon);
            } else {
              handleChange('icon', icon);
            }
          }}
          onColorChange={(color) => {
            if (iconPickerTarget === 'category') {
              setNewCatColor(color);
            } else {
              handleChange('color', color);
            }
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

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
