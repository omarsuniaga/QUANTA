/**
 * Sync Retry Service - Simple helper para reintentos
 * 
 * Versión simple sin cola completa (Fase 1)
 * Backoff exponencial mínimo
 */

interface SyncRetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  useBackoff?: boolean;
}

const DEFAULT_OPTIONS: Required<SyncRetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  useBackoff: true
};

/**
 * Ejecuta una operación con reintentos automáticos
 * 
 * @example
 * const result = await syncWithRetry(
 *   () => storageService.saveTransaction(tx),
 *   { maxRetries: 3 }
 * );
 */
export async function syncWithRetry<T>(
  operation: () => Promise<T>,
  options: SyncRetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      // Intentar operación
      const result = await operation();
      
      // Éxito - log si hubo reintentos
      if (attempt > 0) {
        console.log(`[SyncRetry] ✅ Operación exitosa después de ${attempt} reintentos`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Si es el último intento, lanzar error
      if (attempt === opts.maxRetries - 1) {
        console.error(`[SyncRetry] ❌ Operación falló después de ${opts.maxRetries} intentos`, error);
        throw error;
      }

      // Calcular delay con backoff exponencial (opcional)
      const delay = opts.useBackoff 
        ? opts.initialDelay * Math.pow(2, attempt) 
        : opts.initialDelay;

      console.warn(
        `[SyncRetry] ⚠️ Intento ${attempt + 1}/${opts.maxRetries} falló. Reintentando en ${delay}ms...`,
        error.message
      );

      // Esperar antes de reintentar
      await sleep(delay);
    }
  }

  // Este punto nunca debería alcanzarse
  throw lastError || new Error('Unknown error in syncWithRetry');
}

/**
 * Helper para esperar
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Variante para operaciones batch (múltiples items)
 * Reintenta solo los items que fallaron
 * 
 * @example
 * const results = await syncBatchWithRetry(
 *   transactions,
 *   (tx) => storageService.saveTransaction(tx)
 * );
 */
export async function syncBatchWithRetry<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: SyncRetryOptions = {}
): Promise<Array<{ item: T; result?: R; error?: Error }>> {
  const results: Array<{ item: T; result?: R; error?: Error }> = [];

  for (const item of items) {
    try {
      const result = await syncWithRetry(() => operation(item), options);
      results.push({ item, result });
    } catch (error: any) {
      results.push({ item, error });
    }
  }

  return results;
}

/**
 * Helper para verificar si un error es retryable
 * (network errors, timeouts, 5xx, etc.)
 */
export function isRetryableError(error: unknown): boolean {
  // Type guard para verificar si es un error-like object
  const isErrorLike = (err: unknown): err is { message?: string; status?: number; code?: string } => {
    return typeof err === 'object' && err !== null;
  };

  if (!isErrorLike(error)) {
    return false;
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }

  // HTTP 5xx errors
  if (typeof error.status === 'number' && error.status >= 500 && error.status < 600) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }

  // Firebase specific retryable errors
  if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    return true;
  }

  return false;
}

/**
 * Wrapper para operaciones Firebase con retry inteligente
 */
export async function firebaseSyncWithRetry<T>(
  operation: () => Promise<T>,
  options: SyncRetryOptions = {}
): Promise<T> {
  try {
    return await syncWithRetry(operation, {
      maxRetries: 3,
      initialDelay: 1000,
      useBackoff: true,
      ...options
    });
  } catch (error: unknown) {
    // Si el error no es retryable, lanzarlo inmediatamente
    if (!isRetryableError(error)) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SyncRetry] Error no retryable:', errorMessage);
      throw error;
    }
    throw error;
  }
}
