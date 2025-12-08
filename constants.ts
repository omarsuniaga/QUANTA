import { Category } from './types';
import { 
  Home, 
  ShoppingCart, 
  Zap, 
  Car, 
  Heart, 
  Film, 
  Briefcase, 
  DollarSign, 
  Layers, 
  MoreHorizontal,
  Plane,
  Shield,
  Gift,
  AlertCircle
} from 'lucide-react';

export const CATEGORY_COLORS: Record<string, string> = {
  [Category.Salary]: '#10b981', // Emerald 500
  [Category.Freelance]: '#34d399', // Emerald 400
  [Category.Investments]: '#059669', // Emerald 600
  [Category.Housing]: '#f43f5e', // Rose 500
  [Category.Food]: '#f59e0b', // Amber 500
  [Category.Utilities]: '#3b82f6', // Blue 500
  [Category.Transportation]: '#6366f1', // Indigo 500
  [Category.Health]: '#ec4899', // Pink 500
  [Category.Entertainment]: '#8b5cf6', // Violet 500
  [Category.Services]: '#0ea5e9', // Sky 500
  [Category.Other]: '#94a3b8', // Slate 400
  [Category.Eventual]: '#f97316', // Orange 500
  [Category.Unexpected]: '#ef4444', // Red 500
  [Category.Leisure]: '#d946ef', // Fuchsia 500
};

export const CATEGORY_ICONS: Record<string, any> = {
  [Category.Salary]: DollarSign,
  [Category.Freelance]: Briefcase,
  [Category.Investments]: Layers,
  [Category.Housing]: Home,
  [Category.Food]: ShoppingCart,
  [Category.Utilities]: Zap,
  [Category.Transportation]: Car,
  [Category.Health]: Heart,
  [Category.Entertainment]: Film,
  [Category.Services]: Layers,
  [Category.Other]: MoreHorizontal,
  [Category.Eventual]: AlertCircle,
  [Category.Unexpected]: AlertCircle,
  [Category.Leisure]: Gift,
};

export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Transferencia',
  'PayPal',
  'Otro'
];

// Category arrays for filters
export const EXPENSE_CATEGORIES = Object.values(Category).filter(cat => 
  ![Category.Salary, Category.Freelance].includes(cat as Category)
);

export const INCOME_CATEGORIES = [
  Category.Salary,
  Category.Freelance
];

export const GOAL_ICONS: Record<string, any> = {
  plane: Plane,
  shield: Shield,
  gift: Gift,
};