/**
 * Currency and number formatting utilities for QUANTA
 * 
 * IMPORTANT: All currency formatting should use these functions
 * to ensure consistent display throughout the app.
 * 
 * Standard format: RD$ 1,234.56 (symbol + space + number with comma thousands and dot decimals)
 */

/**
 * Format a number as currency with consistent formatting across the app
 * Uses American/International format: 1,234.56
 * 
 * @param amount - The number to format
 * @param symbol - Currency symbol (e.g., 'RD$', '$')
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted string like "RD$ 1,234.56"
 */
export const formatCurrency = (
  amount: number,
  symbol: string = '$',
  showDecimals: boolean = true
): string => {
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `${symbol} ${formattedNumber}`;
};

/**
 * Format a number as currency (compact version without symbol)
 * Uses American/International format: 1,234.56
 * 
 * @param amount - The number to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted string like "1,234" or "1,234.56"
 */
export const formatNumber = (
  amount: number,
  showDecimals: boolean = false
): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
};

/**
 * Format currency with code suffix instead of symbol prefix
 * Example: "1,234.56 DOP"
 * 
 * @param amount - The number to format
 * @param code - Currency code (e.g., 'DOP', 'USD')
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted string like "1,234.56 DOP"
 */
export const formatCurrencyWithCode = (
  amount: number,
  code: string = 'USD',
  showDecimals: boolean = true
): string => {
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `${formattedNumber} ${code}`;
};

/**
 * Format large numbers in compact form
 * Example: 1.5K, 2.3M
 * 
 * @param amount - The number to format
 * @returns Formatted string like "1.5K" or "2.3M"
 */
export const formatCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
};

/**
 * Format a date for display
 * 
 * @param dateStr - ISO date string
 * @param locale - Locale string (default: 'es-ES')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  dateStr: string,
  locale: string = 'es-ES',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, options);
};

/**
 * Format a date relative to today
 * 
 * @param dateStr - ISO date string
 * @param language - Language code ('es' or 'en')
 * @returns "Hoy", "Ayer", or formatted date
 */
export const formatRelativeDate = (
  dateStr: string,
  language: string = 'es'
): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return language === 'es' ? 'Hoy' : 'Today';
  }
  if (isYesterday) {
    return language === 'es' ? 'Ayer' : 'Yesterday';
  }
  
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};
