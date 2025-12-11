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

// Available currencies with flags and exchange rates (approximate)
export interface CurrencyOption {
  code: string;        // ISO 4217 code
  symbol: string;      // Currency symbol
  name: string;        // Full name in English
  nameEs: string;      // Full name in Spanish
  flag: string;        // Emoji flag
  rateToUSD: number;   // Approximate rate to USD (1 unit of this currency = X USD)
}

export const AVAILABLE_CURRENCIES: CurrencyOption[] = [
  // North America
  { code: 'USD', symbol: '$', name: 'US Dollar', nameEs: 'Dólar Estadounidense', flag: '🇺🇸', rateToUSD: 1 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', nameEs: 'Dólar Canadiense', flag: '🇨🇦', rateToUSD: 0.74 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', nameEs: 'Peso Mexicano', flag: '🇲🇽', rateToUSD: 0.058 },
  
  // Caribbean & Central America
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', nameEs: 'Peso Dominicano', flag: '🇩🇴', rateToUSD: 0.017 },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', nameEs: 'Colón Costarricense', flag: '🇨🇷', rateToUSD: 0.0019 },
  { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', nameEs: 'Balboa Panameño', flag: '🇵🇦', rateToUSD: 1 },
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', nameEs: 'Quetzal Guatemalteco', flag: '🇬🇹', rateToUSD: 0.13 },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', nameEs: 'Lempira Hondureño', flag: '🇭🇳', rateToUSD: 0.040 },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', nameEs: 'Córdoba Nicaragüense', flag: '🇳🇮', rateToUSD: 0.027 },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', nameEs: 'Dólar Jamaiquino', flag: '🇯🇲', rateToUSD: 0.0064 },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad Dollar', nameEs: 'Dólar Trinitense', flag: '🇹🇹', rateToUSD: 0.15 },
  
  // South America
  { code: 'COP', symbol: '$', name: 'Colombian Peso', nameEs: 'Peso Colombiano', flag: '🇨🇴', rateToUSD: 0.00024 },
  { code: 'VES', symbol: 'Bs.', name: 'Venezuelan Bolívar', nameEs: 'Bolívar Venezolano', flag: '🇻🇪', rateToUSD: 0.027 },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', nameEs: 'Sol Peruano', flag: '🇵🇪', rateToUSD: 0.27 },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', nameEs: 'Peso Chileno', flag: '🇨🇱', rateToUSD: 0.0011 },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', nameEs: 'Peso Argentino', flag: '🇦🇷', rateToUSD: 0.0010 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', nameEs: 'Real Brasileño', flag: '🇧🇷', rateToUSD: 0.20 },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', nameEs: 'Peso Uruguayo', flag: '🇺🇾', rateToUSD: 0.025 },
  { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', nameEs: 'Boliviano', flag: '🇧🇴', rateToUSD: 0.14 },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', nameEs: 'Guaraní Paraguayo', flag: '🇵🇾', rateToUSD: 0.00013 },
  { code: 'GYD', symbol: '$', name: 'Guyanese Dollar', nameEs: 'Dólar Guyanés', flag: '🇬🇾', rateToUSD: 0.0048 },
  
  // Europe
  { code: 'EUR', symbol: '€', name: 'Euro', nameEs: 'Euro', flag: '🇪🇺', rateToUSD: 1.09 },
  { code: 'GBP', symbol: '£', name: 'British Pound', nameEs: 'Libra Esterlina', flag: '🇬🇧', rateToUSD: 1.27 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', nameEs: 'Franco Suizo', flag: '🇨🇭', rateToUSD: 1.13 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', nameEs: 'Corona Sueca', flag: '🇸🇪', rateToUSD: 0.095 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', nameEs: 'Corona Noruega', flag: '🇳🇴', rateToUSD: 0.092 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', nameEs: 'Corona Danesa', flag: '🇩🇰', rateToUSD: 0.15 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', nameEs: 'Zloty Polaco', flag: '🇵🇱', rateToUSD: 0.25 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', nameEs: 'Corona Checa', flag: '🇨🇿', rateToUSD: 0.044 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', nameEs: 'Florín Húngaro', flag: '🇭🇺', rateToUSD: 0.0027 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', nameEs: 'Leu Rumano', flag: '🇷🇴', rateToUSD: 0.22 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', nameEs: 'Rublo Ruso', flag: '🇷🇺', rateToUSD: 0.011 },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', nameEs: 'Grivna Ucraniana', flag: '🇺🇦', rateToUSD: 0.027 },
  
  // Asia
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', nameEs: 'Yen Japonés', flag: '🇯🇵', rateToUSD: 0.0067 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameEs: 'Yuan Chino', flag: '🇨🇳', rateToUSD: 0.14 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', nameEs: 'Won Surcoreano', flag: '🇰🇷', rateToUSD: 0.00076 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', nameEs: 'Rupia India', flag: '🇮🇳', rateToUSD: 0.012 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', nameEs: 'Baht Tailandés', flag: '🇹🇭', rateToUSD: 0.029 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', nameEs: 'Dong Vietnamita', flag: '🇻🇳', rateToUSD: 0.000041 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', nameEs: 'Peso Filipino', flag: '🇵🇭', rateToUSD: 0.018 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', nameEs: 'Rupia Indonesia', flag: '🇮🇩', rateToUSD: 0.000063 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', nameEs: 'Ringgit Malayo', flag: '🇲🇾', rateToUSD: 0.22 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', nameEs: 'Dólar de Singapur', flag: '🇸🇬', rateToUSD: 0.75 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', nameEs: 'Dólar de Hong Kong', flag: '🇭🇰', rateToUSD: 0.13 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', nameEs: 'Dólar Taiwanés', flag: '🇹🇼', rateToUSD: 0.032 },
  
  // Middle East
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', nameEs: 'Dirham de EAU', flag: '🇦🇪', rateToUSD: 0.27 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', nameEs: 'Riyal Saudí', flag: '🇸🇦', rateToUSD: 0.27 },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', nameEs: 'Shekel Israelí', flag: '🇮🇱', rateToUSD: 0.28 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', nameEs: 'Lira Turca', flag: '🇹🇷', rateToUSD: 0.035 },
  
  // Oceania
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', nameEs: 'Dólar Australiano', flag: '🇦🇺', rateToUSD: 0.66 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', nameEs: 'Dólar Neozelandés', flag: '🇳🇿', rateToUSD: 0.61 },
  
  // Africa
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', nameEs: 'Rand Sudafricano', flag: '🇿🇦', rateToUSD: 0.055 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', nameEs: 'Libra Egipcia', flag: '🇪🇬', rateToUSD: 0.032 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', nameEs: 'Naira Nigeriana', flag: '🇳🇬', rateToUSD: 0.00063 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', nameEs: 'Chelín Keniano', flag: '🇰🇪', rateToUSD: 0.0078 },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', nameEs: 'Dirham Marroquí', flag: '🇲🇦', rateToUSD: 0.10 },
];