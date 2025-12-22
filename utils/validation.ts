// Validation utilities for QUANTA

/**
 * Validates transaction amount
 * @param amount - The amount to validate
 * @returns Error message if invalid, null if valid
 */
export const validateAmount = (amount: number | string): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'El monto debe ser un número válido';
  }
  
  if (numAmount <= 0) {
    return 'El monto debe ser mayor a cero';
  }
  
  if (numAmount > 999999999) {
    return 'El monto es demasiado grande';
  }
  
  return null;
};

/**
 * Validates transaction date
 * @param date - The date string in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export const validateDate = (date: string): string | null => {
  if (!date || date.trim() === '') {
    return 'La fecha es requerida';
  }

  // Strict format check: YYYY-MM-DD
  const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!ymdRegex.test(date)) {
    return 'Formato de fecha inválido (requerido: YYYY-MM-DD)';
  }
  
  const selectedDate = new Date(date);
  // Ensure we are parsing it as a local date for comparison, though standard Date(ymd) handles it as UTC usually
  // But wait, the previous code used new Date(date).
  // If date is "2024-01-01", new Date("2024-01-01") is UTC midnight.
  // The existing code: 
  // const selectedDate = new Date(date);
  // const today = new Date(); today.setHours(0,0,0,0);
  // This comparison might be flawed if not careful, but my task is just adding the Regex check.
  // I will preserve existing logic for now to limit scope drift, just adding the regex.
  
  if (isNaN(selectedDate.getTime())) {
    return 'Fecha inválida';
  }
  
  // Allow dates up to 7 days in the future (for scheduled transactions)
  const maxFutureDate = new Date();
  maxFutureDate.setDate(maxFutureDate.getDate() + 7);
  
  if (selectedDate > maxFutureDate) {
    return 'La fecha no puede ser más de 7 días en el futuro';
  }
  
  // Prevent dates more than 10 years in the past
  const minPastDate = new Date();
  minPastDate.setFullYear(minPastDate.getFullYear() - 10);
  
  if (selectedDate < minPastDate) {
    return 'La fecha está demasiado atrás en el tiempo';
  }
  
  return null;
};

/**
 * Validates transaction description
 * @param description - The description text
 * @returns Error message if invalid, null if valid
 */
export const validateDescription = (description: string): string | null => {
  if (!description || description.trim() === '') {
    return 'La descripción es requerida';
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length < 3) {
    return 'La descripción debe tener al menos 3 caracteres';
  }
  
  if (trimmed.length > 200) {
    return 'La descripción no puede exceder 200 caracteres';
  }
  
  return null;
};

/**
 * Validates a category selection
 * @param category - The category string
 * @returns Error message if invalid, null if valid
 */
export const validateCategory = (category: string): string | null => {
  if (!category || category.trim() === '') {
    return 'La categoría es requerida';
  }
  
  return null;
};

/**
 * Validates all transaction fields at once
 * @param data - Transaction data to validate
 * @returns Object with field errors, or empty object if all valid
 */
export const validateTransactionForm = (data: {
  amount?: number | string;
  date?: string;
  description?: string;
  category?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (data.amount !== undefined) {
    const amountError = validateAmount(data.amount);
    if (amountError) errors.amount = amountError;
  }
  
  if (data.date !== undefined) {
    const dateError = validateDate(data.date);
    if (dateError) errors.date = dateError;
  }
  
  if (data.description !== undefined) {
    const descError = validateDescription(data.description);
    if (descError) errors.description = descError;
  }
  
  if (data.category !== undefined) {
    const catError = validateCategory(data.category);
    if (catError) errors.category = catError;
  }
  
  return errors;
};
