import React, { useState } from 'react';
import { X, Plane, ShoppingBag, Gift, Star, Coffee, Music, Trash2 } from 'lucide-react';
import { Promo } from '../types';
import { Button } from './Button';

interface PromoModalProps {
  promo?: Promo | null;
  onSave: (promo: Promo) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
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

export const PromoModal: React.FC<PromoModalProps> = ({ promo, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(promo?.title || '');
  const [subtitle, setSubtitle] = useState(promo?.subtitle || '');
  const [icon, setIcon] = useState(promo?.icon || 'Star');
  const [color, setColor] = useState(promo?.color || 'blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: promo?.id || Math.random().toString(36).substr(2, 9),
      title,
      subtitle,
      icon,
      color,
    });
    onClose();
  };

  const handleDelete = () => {
    if (promo && window.confirm('¿Eliminar esta idea?')) {
      onDelete(promo.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />
      
      {/* Modal */}
      <div className="relative z-[110] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-md lg:max-w-lg shadow-2xl border border-white/20 dark:border-slate-700 max-h-[85vh] overflow-y-auto pb-24 animate-slide-up">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{promo ? 'Editar Idea' : 'Nueva Idea'}</h2>
          <button onClick={onClose} className="bg-slate-50 dark:bg-slate-800 p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-4">
          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Black Friday"
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-1.5 block">Subtítulo</label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ej: Ahorra para ofertas"
              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
             <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">Icono</label>
             <div className="flex flex-wrap gap-1.5 sm:gap-2">
               {ICONS.map((item) => (
                 <button
                   key={item.name}
                   type="button"
                   onClick={() => setIcon(item.name)}
                   className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${icon === item.name ? `bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md` : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                 >
                   <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                 </button>
               ))}
             </div>
          </div>

          <div>
             <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">Color</label>
             <div className="flex gap-1.5 sm:gap-2">
               {COLORS.map((c) => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setColor(c)}
                   className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                 >
                   <div className={`w-full h-full rounded-full bg-${c}-500`}></div>
                 </button>
               ))}
             </div>
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            {promo && (
              <Button type="button" variant="danger" onClick={handleDelete} className="px-3 sm:px-4">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
            <Button type="submit" fullWidth className="shadow-lg shadow-indigo-200 dark:shadow-none text-xs sm:text-sm py-2 sm:py-2.5">
              Guardar Idea
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};