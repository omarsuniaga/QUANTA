import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Calendar, Palette } from 'lucide-react';
import { Budget } from '../types';

interface BudgetModalProps {
  isOpen: boolean;
  budget?: Budget | null;
  categories: string[];
  currencySymbol: string;
  onClose: () => void;
  onSave: (budget: Partial<Budget>) => void;
}

const BUDGET_COLORS = [
  { name: 'Púrpura', class: 'bg-purple-100 text-purple-700', value: 'bg-purple-100' },
  { name: 'Azul', class: 'bg-blue-100 text-blue-700', value: 'bg-blue-100' },
  { name: 'Verde', class: 'bg-emerald-100 text-emerald-700', value: 'bg-emerald-100' },
  { name: 'Amarillo', class: 'bg-amber-100 text-amber-700', value: 'bg-amber-100' },
  { name: 'Rosa', class: 'bg-rose-100 text-rose-700', value: 'bg-rose-100' },
  { name: 'Índigo', class: 'bg-indigo-100 text-indigo-700', value: 'bg-indigo-100' },
];

const BUDGET_ICONS = ['💰', '🛒', '⛽', '💡', '🏠', '🚗', '🍔', '💳', '📱', '🎮', '👕', '🎓'];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  budget,
  categories,
  currencySymbol,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' as 'monthly' | 'yearly',
    color: BUDGET_COLORS[0].value,
    icon: BUDGET_ICONS[0],
    resetDay: '1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
        color: budget.color || BUDGET_COLORS[0].value,
        icon: budget.icon || BUDGET_ICONS[0],
        resetDay: (budget.resetDay || 1).toString(),
      });
    } else {
      setFormData({
        name: '',
        category: categories[0] || '',
        limit: '',
        period: 'monthly',
        color: BUDGET_COLORS[0].value,
        icon: BUDGET_ICONS[0],
        resetDay: '1',
      });
    }
    setErrors({});
  }, [budget, categories, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    const limitNum = parseFloat(formData.limit);
    if (!formData.limit || isNaN(limitNum) || limitNum <= 0) {
      newErrors.limit = 'Ingresa un monto válido mayor a 0';
    }

    const resetDay = parseInt(formData.resetDay);
    if (isNaN(resetDay) || resetDay < 1 || resetDay > 31) {
      newErrors.resetDay = 'Ingresa un día válido (1-31)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const budgetData: Partial<Budget> = {
      name: formData.name.trim(),
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

  const handleChange = (
    field: string,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">
            {budget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nombre del Presupuesto
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Ej: Supermercado del mes"
                className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  errors.name ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-rose-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                errors.category ? 'border-rose-500' : 'border-slate-300'
              }`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-rose-600 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Límite de Presupuesto
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.limit}
                onChange={e => handleChange('limit', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-16 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                  errors.limit ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.limit && (
              <p className="text-rose-600 text-sm mt-1">{errors.limit}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Período
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('period', 'monthly')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  formData.period === 'monthly'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Mensual
              </button>
              <button
                type="button"
                onClick={() => handleChange('period', 'yearly')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  formData.period === 'yearly'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Anual
              </button>
            </div>
          </div>

          {/* Reset Day */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Día de Reinicio
              <span className="text-xs font-normal text-slate-500 ml-2">
                (1-31)
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.resetDay}
              onChange={e => handleChange('resetDay', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                errors.resetDay ? 'border-rose-500' : 'border-slate-300'
              }`}
            />
            {errors.resetDay && (
              <p className="text-rose-600 text-sm mt-1">{errors.resetDay}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              El presupuesto se reiniciará cada {formData.period === 'monthly' ? 'mes' : 'año'} en el día {formData.resetDay}
            </p>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Ícono
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {BUDGET_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                  className={`aspect-square p-2 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.icon === icon
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUDGET_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleChange('color', color.value)}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    color.class
                  } ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-purple-600 shadow-lg scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Vista Previa
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${formData.color}`}
                >
                  {formData.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {formData.name || 'Nombre del presupuesto'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {formData.category || 'Categoría'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-600">Límite:</span>
                <span className="font-bold text-slate-800">
                  {currencySymbol}
                  {formData.limit || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              {budget ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
