import React, { useState } from 'react';
import { ArrowLeft, Plane, ShoppingBag, Gift, Star, Coffee, Music, Trash2 } from 'lucide-react';
import { Promo } from '../types';
import { Button } from './Button';

interface PromoViewProps {
  promo?: Promo | null;
  onSave: (promo: Promo) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const ICONS = [
  { name: 'Plane', icon: Plane },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Gift', icon: Gift },
  { name: 'Star', icon: Star },
  { name: 'Coffee', icon: Coffee },
  { name: 'Music', icon: Music },
];

const COLORS = ['blue', 'purple', 'rose', 'amber', 'emerald', 'indigo'];

export const PromoView: React.FC<PromoViewProps> = ({ promo, onSave, onDelete, onBack }) => {
  const [title, setTitle] = useState(promo?.title || '');
  const [subtitle, setSubtitle] = useState(promo?.subtitle || '');
  const [icon, setIcon] = useState(promo?.icon || 'Star');
  const [color, setColor] = useState(promo?.color || 'blue');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: promo?.id || Math.random().toString(36).substr(2, 9),
      title,
      subtitle,
      icon,
      color,
    });
    onBack();
  };

  const handleDelete = () => {
    if (promo) {
      onDelete(promo.id);
      onBack();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {promo ? 'Editar Idea' : 'Nueva Idea'}
        </h2>
      </div>

      {/* Main content scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
              Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Black Friday"
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">
              Subtítulo
            </label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ej: Ahorra para ofertas"
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">
              Icono
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    icon === item.name
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">
              Color
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Footer fixed con acciones siempre visibles */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
        {promo && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteDialog(true)}
            className="px-4"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} className="flex-1 shadow-lg shadow-indigo-200 dark:shadow-none">
          Guardar Idea
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              ¿Eliminar esta idea?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setShowDeleteDialog(false);
                  handleDelete();
                }}
                fullWidth
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
