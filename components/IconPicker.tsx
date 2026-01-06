import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Curated list of icons suitable for finance categories
const ICON_LIST = [
  // Money & Finance
  'DollarSign', 'Wallet', 'CreditCard', 'Banknote', 'PiggyBank', 'TrendingUp', 'TrendingDown', 'Receipt', 'Coins',
  // Food & Drink
  'Utensils', 'Coffee', 'Pizza', 'Apple', 'Sandwich', 'Wine', 'Beer', 'IceCream', 'Salad', 'Soup',
  // Transport
  'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Fuel', 'MapPin', 'Navigation',
  // Home & Living
  'Home', 'Building', 'Bed', 'Sofa', 'Lamp', 'Key', 'DoorOpen', 'Warehouse',
  // Shopping
  'ShoppingCart', 'ShoppingBag', 'Package', 'Gift', 'Tag', 'Shirt', 'Watch',
  // Health & Wellness
  'Heart', 'Pill', 'Stethoscope', 'Activity', 'Dumbbell', 'Brain', 'Smile', 'Thermometer',
  // Entertainment
  'Music', 'Film', 'Gamepad2', 'Tv', 'Monitor', 'Headphones', 'Camera', 'Ticket', 'PartyPopper',
  // Services & Tech
  'Wifi', 'Smartphone', 'Laptop', 'Zap', 'Lightbulb', 'Droplets', 'Flame', 'Wrench', 'Settings',
  // Education & Work
  'GraduationCap', 'Book', 'BookOpen', 'Briefcase', 'FileText', 'Pencil', 'Calculator',
  // Family & Social
  'Users', 'Baby', 'Dog', 'Cat', 'Cake',
  // Other
  'Star', 'Shield', 'Trophy', 'Target', 'Flag', 'Clock', 'Calendar', 'Bell', 'AlertCircle', 'HelpCircle'
];

// Color options
export const COLOR_OPTIONS = [
  { name: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-500' },
  { name: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500' },
  { name: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500' },
  { name: 'lime', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-600 dark:text-lime-400', ring: 'ring-lime-500' },
  { name: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500' },
  { name: 'teal', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500' },
  { name: 'cyan', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500' },
  { name: 'sky', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500' },
  { name: 'indigo', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-500' },
  { name: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500' },
  { name: 'fuchsia', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400', ring: 'ring-fuchsia-500' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-500' },
  { name: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-500' },
];

export const getColorClasses = (colorName: string) => {
  return COLOR_OPTIONS.find(c => c.name === colorName) || COLOR_OPTIONS[0];
};

interface IconPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'icons' | 'colors'>('icons');

  const filteredIcons = ICON_LIST.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className="w-5 h-5" />;
  };

  const colorClasses = getColorClasses(selectedColor);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Personalizar Categoría</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 flex justify-center">
          <div className={`p-4 rounded-2xl ${colorClasses.bg}`}>
            <div className={colorClasses.text}>
              {renderIcon(selectedIcon)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4">
          <button
            onClick={() => setActiveTab('icons')}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${activeTab === 'icons'
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
          >
            Iconos
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all ${activeTab === 'colors'
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
          >
            Colores
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {activeTab === 'icons' && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar icono..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Icons Grid */}
              <div className="grid grid-cols-7 gap-2">
                {filteredIcons.map(iconName => (
                  <button
                    key={iconName}
                    onClick={() => onIconChange(iconName)}
                    className={`p-2.5 rounded-xl transition-all ${selectedIcon === iconName
                        ? `${colorClasses.bg} ${colorClasses.text} ring-2 ${colorClasses.ring}`
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    title={iconName}
                  >
                    {renderIcon(iconName)}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'colors' && (
            <div className="grid grid-cols-4 gap-3">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.name}
                  onClick={() => onColorChange(color.name)}
                  className={`p-4 rounded-xl transition-all ${color.bg} ${selectedColor === color.name
                      ? `ring-2 ${color.ring} ring-offset-2 dark:ring-offset-slate-900`
                      : 'hover:scale-105'
                    }`}
                >
                  <div className={`w-6 h-6 mx-auto rounded-full ${color.text}`}>
                    {renderIcon(selectedIcon)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Done Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

// Utility component to render an icon by name
export const DynamicIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-5 h-5" }) => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <LucideIcons.HelpCircle className={className} />;
  return <IconComponent className={className} />;
};
