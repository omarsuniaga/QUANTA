/**
 * Date Helper Utilities
 * Funciones para manejar fechas correctamente evitando problemas de timezone
 */

/**
 * Convierte una fecha en formato "YYYY-MM-DD" a un objeto Date local
 * sin conversiones de timezone.
 * 
 * IMPORTANTE: new Date("2024-12-22") interpreta la fecha como UTC medianoche,
 * lo que en timezone UTC-4 se muestra como 2024-12-21 20:00.
 * Esta función crea un Date object que representa el día correcto en la timezone local.
 * 
 * @param dateString Fecha en formato "YYYY-MM-DD"
 * @returns Date object en timezone local representando ese día
 * 
 * @example
 * // En timezone UTC-4:
 * new Date("2024-12-22") // → 2024-12-21T20:00:00-04:00 (día 21!)
 * parseLocalDate("2024-12-22") // → 2024-12-22T00:00:00-04:00 (día 22 correcto)
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }

  // Separar año, mes, día
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    console.warn(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
    return new Date(dateString); // Fallback
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-indexed
  const day = parseInt(parts[2], 10);

  // Crear Date en timezone local
  return new Date(year, month, day);
}

/**
 * Formatea una fecha en formato "YYYY-MM-DD" para mostrar en el idioma local
 * 
 * @param dateString Fecha en formato "YYYY-MM-DD"
 * @param locale Locale para formateo (ej: 'es-ES', 'en-US')
 * @param options Opciones de formateo de Intl.DateTimeFormat
 * @returns String formateado
 */
export function formatLocalDate(
  dateString: string,
  locale: string = 'es-ES',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString(locale, options);
}

/**
 * Obtiene la fecha actual en formato "YYYY-MM-DD" (timezone local)
 * 
 * @returns Fecha actual como string "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un Date object a string "YYYY-MM-DD" (timezone local)
 * 
 * @param date Date object
 * @returns String en formato "YYYY-MM-DD"
 */
export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compara dos fechas en formato "YYYY-MM-DD"
 * 
 * @param date1 Primera fecha
 * @param date2 Segunda fecha  
 * @returns Número negativo si date1 < date2, positivo si date1 > date2, 0 si iguales
 */
export function compareDates(date1: string, date2: string): number {
  return parseLocalDate(date1).getTime() - parseLocalDate(date2).getTime();
}
