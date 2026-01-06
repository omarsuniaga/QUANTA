import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Promo } from '../types';
import { Button } from './Button';
import { ModalWrapper } from './ModalWrapper';
import { IconPicker, DynamicIcon, getColorClasses } from './IconPicker';

interface PromoModalProps {
  promo?: Promo | null;
  onSave: (promo: Promo) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}



export const PromoModal: React.FC<PromoModalProps> = ({ promo, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(promo?.title || '');
  const titleRef = useRef<HTMLInputElement>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      titleRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

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
    <ModalWrapper isOpen={true} onClose={onClose} alignment="start">

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md lg:max-w-lg shadow-2xl border border-white/20 dark:border-slate-700 max-h-[85vh] mt-16 mb-8 flex flex-col overflow-hidden">

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
              ref={titleRef}
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
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2 block">Icono y Color</label>
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClasses(color).bg}`}>
                  <DynamicIcon name={icon} className={`w-5 h-5 ${getColorClasses(color).text}`} />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Personalizar</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={icon}
          selectedColor={color}
          onIconChange={setIcon}
          onColorChange={setColor}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </ModalWrapper>
  );
};