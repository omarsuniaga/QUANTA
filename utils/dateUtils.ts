/**
 * Utilidades para manejo correcto de fechas calendario (sin zona horaria)
 * 
 * PROBLEMA: Mezclar fechas calendario (YYYY-MM-DD) con timestamps UTC causa desfase de ±1 día
 * SOLUCIÓN: Separar "fecha del evento" (string) de "timestamp de auditoría" (Timestamp)
 * 
 * @module dateUtils
 */

/**
 * Convierte un Date object a string YYYY-MM-DD en timezone local
 * 
 * USO: Al guardar fecha desde un form/calendar picker
 * 
 * @param date - Date object en timezone local del usuario
 * @returns String "YYYY-MM-DD" representando la fecha local
 * 
 * @example
 * const userSelectedDate = new Date(2026, 0, 2); // 2 de enero 2026
 * toYMDLocal(userSelectedDate) // "2026-01-02"
 */
export function toYMDLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string YYYY-MM-DD como Date en timezone local (no UTC)
 * 
 * USO: Al leer fecha desde storage para mostrar/filtrar
 * 
 * IMPORTANTE: NO usar `new Date("YYYY-MM-DD")` porque se interpreta como UTC
 * 
 * @param ymd - String en formato "YYYY-MM-DD"
 * @returns Date object representando medianoche local de esa fecha
 * 
 * @example
 * parseLocalYMD("2026-01-02") // Date object para 2026-01-02 00:00:00 local
 */
export function parseLocalYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d); // Constructor usa timezone local
}

/**
 * Extrae solo la porción YYYY-MM-DD de un string de fecha-hora
 * 
 * USO: Para normalizar fechas que pueden venir como "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SS"
 * 
 * @param dateStr - String con fecha (con o sin hora)
 * @returns String "YYYY-MM-DD"
 * 
 * @example
 * extractYMD("2026-01-02T15:30:00") // "2026-01-02"
 * extractYMD("2026-01-02") // "2026-01-02"
 */
export function extractYMD(dateStr: string): string {
  return dateStr.split('T')[0];
}

/**
 * Formatea una fecha para mostrar al usuario (locale-aware)
 * 
 * @param ymd - String "YYYY-MM-DD"
 * @param locale - Locale para formateo (default: 'es-ES')
 * @param options - Opciones de formateo Intl.DateTimeFormat
 * @returns String formateado según locale
 * 
 * @example
 * formatLocalDate("2026-01-02", "es-ES") // "2 ene 2026"
 * formatLocalDate("2026-01-02", "en-US", { dateStyle: 'short' }) // "1/2/26"
 */
export function formatLocalDate(
  ymd: string,
  locale: string = 'es-ES',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
  const date = parseLocalYMD(ymd);
  return date.toLocaleDateString(locale, options);
}

/**
 * Obtiene la fecha actual del usuario como string YYYY-MM-DD
 * 
 * @returns String "YYYY-MM-DD" de hoy en timezone local
 * 
 * @example
 * getTodayYMD() // "2026-01-02" (si hoy es 2 de enero 2026 local)
 */
export function getTodayYMD(): string {
  return toYMDLocal(new Date());
}

/**
 * Compara dos fechas YYYY-MM-DD (útil para ordenamiento)
 * 
 * @param a - Primera fecha
 * @param b - Segunda fecha
 * @returns número negativo si a < b, positivo si a > b, 0 si iguales
 * 
 * @example
 * ["2026-01-03", "2026-01-01", "2026-01-02"].sort(compareYMD)
 * // ["2026-01-01", "2026-01-02", "2026-01-03"]
 */
export function compareYMD(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Verifica si una fecha está en un rango
 * 
 * @param date - Fecha a verificar (YYYY-MM-DD)
 * @param from - Fecha inicio (YYYY-MM-DD) o null
 * @param to - Fecha fin (YYYY-MM-DD) o null
 * @returns true si la fecha está en el rango
 */
export function isDateInRange(date: string, from: string | null, to: string | null): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

/**
 * Extrae año y mes de una fecha YYYY-MM-DD
 * 
 * @param ymd - String "YYYY-MM-DD"
 * @returns Object con year (número) y month (0-11 para compatibilidad con Date)
 */
export function getYearMonth(ymd: string): { year: number; month: number } {
  const [year, month] = ymd.split('-').map(Number);
  return { year, month: month - 1 };
}

/**
 * Verifica si una fecha pertenece a un mes/año específico
 * 
 * @param ymd - Fecha a verificar
 * @param year - Año objetivo
 * @param month - Mes objetivo (0-11)
 * @returns true si la fecha pertenece a ese mes/año
 */
export function isDateInMonth(ymd: string, year: number, month: number): boolean {
  const { year: dateYear, month: dateMonth } = getYearMonth(ymd);
  return dateYear === year && dateMonth === month;
}
