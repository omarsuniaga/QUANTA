import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Hook para centralizar la lógica de moneda.
 * 
 * GARANTÍA ARQUITECTÓNICA:
 * 1. Los datos persistidos (Base de Datos/Storage) están SIEMPRE en moneda base (DOP).
 * 2. Este hook es el ÚNICO puente para convertir de Base -> Display y Display -> Base.
 * 3. No realiza cálculos de totales ni lógica de negocio; solo conversión y formateo.
 */
export const useCurrency = () => {
  const { settings } = useSettings();
  
  // Configuración de visualización
  const targetCurrencyCode = settings?.currency?.localCode || 'DOP';
  const targetCurrencySymbol = settings?.currency?.localSymbol || 'RD$';
  const displayMode = settings?.currency?.displayMode || 'local';
  
  // Tasa de cambio: Priorizamos la de settings, fallback a 60 (DOP/USD)
  const rateUSDToLocal = Number(settings?.currency?.rateUSDToLocal) || 60;

  /**
   * Convierte un monto de MONEDA BASE (DOP) a la MONEDA DE VISUALIZACIÓN actual.
   */
  const fromBase = useCallback((amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 0;
    if (displayMode === 'usd') {
      return amount / rateUSDToLocal;
    }
    return amount;
  }, [displayMode, rateUSDToLocal]);

  /**
   * Convierte un monto de la MONEDA DE VISUALIZACIÓN actual a la MONEDA BASE (DOP).
   * Vital para normalizar inputs antes de persistir.
   */
  const toBase = useCallback((amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 0;
    if (displayMode === 'usd') {
      return amount * rateUSDToLocal;
    }
    return amount;
  }, [displayMode, rateUSDToLocal]);

  /**
   * Formatea un monto de MONEDA BASE para su visualización.
   */
  const formatAmount = useCallback((amountBase: number, forceShowSymbol: boolean = true) => {
    if (amountBase === undefined || amountBase === null) return '';

    const convertedValue = fromBase(amountBase);
    const symbol = displayMode === 'usd' ? '$' : targetCurrencySymbol;

    const formattedNumber = convertedValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return forceShowSymbol ? `${symbol} ${formattedNumber}` : formattedNumber;
  }, [displayMode, fromBase, targetCurrencySymbol]);

  return {
    formatAmount,
    fromBase,
    toBase,
    convertAmount: fromBase, // Mantener por compatibilidad temporal
    currencySymbol: displayMode === 'usd' ? '$' : targetCurrencySymbol,
    currencyCode: displayMode === 'usd' ? 'USD' : targetCurrencyCode
  };
};
