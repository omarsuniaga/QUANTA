/**
 * API Rate Limiter & Cache Service
 * Controla las peticiones a la API de Gemini para evitar errores 429
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
  priority: 'high' | 'normal' | 'low';
}

interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxRetries: number;
  baseCacheDurationMs: number;
  enableCache: boolean;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequestsPerMinute: 10, // Gemini free tier: ~15 RPM, dejamos margen
  maxRetries: 3,
  baseCacheDurationMs: 5 * 60 * 1000, // 5 minutos de cache por defecto
  enableCache: true
};

class APIRateLimiter {
  private config: RateLimiterConfig;
  private requestTimestamps: number[] = [];
  private cache: Map<string, CacheEntry<any>> = new Map();
  private queue: QueuedRequest<any>[] = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private consecutiveErrors = 0;
  private isInCooldown = false;
  private cooldownEndTime = 0;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCacheFromStorage();
  }

  /**
   * Ejecuta una petición con rate limiting, cache y reintentos
   */
  async execute<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    options: {
      cacheDurationMs?: number;
      priority?: 'high' | 'normal' | 'low';
      skipCache?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const {
      cacheDurationMs = this.config.baseCacheDurationMs,
      priority = 'normal',
      skipCache = false,
      forceRefresh = false
    } = options;

    // 1. Verificar cooldown por errores consecutivos
    if (this.isInCooldown && Date.now() < this.cooldownEndTime) {
      const remainingSeconds = Math.ceil((this.cooldownEndTime - Date.now()) / 1000);
      console.warn(`[RateLimiter] En período de enfriamiento. ${remainingSeconds}s restantes.`);
      
      // Intentar devolver del cache aunque esté expirado
      if (this.config.enableCache && !skipCache) {
        const cached = this.getFromCache<T>(cacheKey, true); // allowExpired = true
        if (cached !== null) {
          console.log(`[RateLimiter] Retornando cache expirado durante cooldown`);
          return cached;
        }
      }
      
      throw new Error(`API en enfriamiento. Intenta en ${remainingSeconds} segundos.`);
    }

    // 2. Verificar cache
    if (this.config.enableCache && !skipCache && !forceRefresh) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        console.log(`[RateLimiter] Cache hit: ${cacheKey.substring(0, 50)}...`);
        return cached;
      }
    }

    // 3. Encolar la petición
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: `${cacheKey}_${Date.now()}`,
        execute: async () => {
          const result = await requestFn();
          // Guardar en cache
          if (this.config.enableCache && !skipCache) {
            this.setCache(cacheKey, result, cacheDurationMs);
          }
          return result;
        },
        resolve,
        reject,
        retries: 0,
        priority
      };

      // Insertar según prioridad
      if (priority === 'high') {
        this.queue.unshift(request);
      } else if (priority === 'low') {
        this.queue.push(request);
      } else {
        const insertIndex = this.queue.findIndex(r => r.priority === 'low');
        if (insertIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(insertIndex, 0, request);
        }
      }

      this.processQueue();
    });
  }

  /**
   * Procesa la cola de peticiones respetando rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      // Verificar si podemos hacer una petición
      const waitTime = this.getWaitTime();
      if (waitTime > 0) {
        console.log(`[RateLimiter] Esperando ${waitTime}ms antes de la siguiente petición...`);
        await this.sleep(waitTime);
      }

      const request = this.queue.shift();
      if (!request) continue;

      try {
        // Registrar timestamp de la petición
        this.requestTimestamps.push(Date.now());
        this.lastRequestTime = Date.now();
        
        // Limpiar timestamps antiguos (más de 1 minuto)
        const oneMinuteAgo = Date.now() - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);

        const result = await request.execute();
        this.consecutiveErrors = 0;
        this.isInCooldown = false;
        request.resolve(result);
        
      } catch (error: any) {
        await this.handleError(request, error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Maneja errores con reintentos y backoff exponencial
   */
  private async handleError<T>(request: QueuedRequest<T>, error: any): Promise<void> {
    const isRateLimitError = 
      error.message?.includes('429') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.message?.includes('quota') ||
      error.status === 429;

    this.consecutiveErrors++;

    if (isRateLimitError) {
      console.warn(`[RateLimiter] Error 429 detectado. Errores consecutivos: ${this.consecutiveErrors}`);
      
      // Activar cooldown progresivo
      const cooldownMs = Math.min(
        30000 * Math.pow(2, this.consecutiveErrors - 1), // 30s, 60s, 120s, etc.
        5 * 60 * 1000 // Máximo 5 minutos
      );
      
      this.isInCooldown = true;
      this.cooldownEndTime = Date.now() + cooldownMs;
      
      console.warn(`[RateLimiter] Cooldown activado por ${cooldownMs / 1000}s`);
    }

    // Reintentar si no hemos excedido el máximo
    if (request.retries < this.config.maxRetries) {
      request.retries++;
      
      const backoffMs = Math.min(
        1000 * Math.pow(2, request.retries), // 2s, 4s, 8s
        30000 // Máximo 30s
      );
      
      console.log(`[RateLimiter] Reintento ${request.retries}/${this.config.maxRetries} en ${backoffMs}ms`);
      
      await this.sleep(backoffMs);
      
      // Re-encolar con prioridad alta para reintentos
      request.priority = 'high';
      this.queue.unshift(request);
      
    } else {
      console.error(`[RateLimiter] Máximo de reintentos alcanzado para: ${request.id}`);
      request.reject(error);
    }
  }

  /**
   * Calcula el tiempo de espera necesario antes de la siguiente petición
   */
  private getWaitTime(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Contar peticiones en el último minuto
    const recentRequests = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    
    if (recentRequests.length >= this.config.maxRequestsPerMinute) {
      // Calcular cuánto esperar hasta que expire la petición más antigua
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = (oldestRequest + 60000) - now + 100; // +100ms de margen
      return Math.max(0, waitTime);
    }

    // Espera mínima entre peticiones (100ms)
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 100) {
      return 100 - timeSinceLastRequest;
    }

    return 0;
  }

  /**
   * Obtiene un valor del cache
   */
  private getFromCache<T>(key: string, allowExpired = false): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (!allowExpired && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Guarda un valor en el cache
   */
  private setCache<T>(key: string, data: T, durationMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + durationMs
    });
    
    this.saveCacheToStorage();
  }

  /**
   * Limpia el cache completamente
   */
  clearCache(): void {
    this.cache.clear();
    this.saveCacheToStorage();
    console.log('[RateLimiter] Cache limpiado');
  }

  /**
   * Limpia entradas expiradas del cache
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveCacheToStorage();
      console.log(`[RateLimiter] ${cleaned} entradas expiradas limpiadas del cache`);
    }
  }

  /**
   * Obtiene estadísticas del rate limiter
   */
  getStats(): {
    requestsInLastMinute: number;
    maxRequestsPerMinute: number;
    cacheSize: number;
    queueLength: number;
    isInCooldown: boolean;
    cooldownRemaining: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    return {
      requestsInLastMinute: this.requestTimestamps.filter(t => t > oneMinuteAgo).length,
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
      cacheSize: this.cache.size,
      queueLength: this.queue.length,
      isInCooldown: this.isInCooldown && now < this.cooldownEndTime,
      cooldownRemaining: this.isInCooldown ? Math.max(0, this.cooldownEndTime - now) : 0
    };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[RateLimiter] Configuración actualizada:', this.config);
  }

  /**
   * Resetea el estado de cooldown (usar con cuidado)
   */
  resetCooldown(): void {
    this.isInCooldown = false;
    this.cooldownEndTime = 0;
    this.consecutiveErrors = 0;
    console.log('[RateLimiter] Cooldown reseteado');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private saveCacheToStorage(): void {
    try {
      const cacheData: Record<string, CacheEntry<any>> = {};
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = value;
      }
      localStorage.setItem('gemini_api_cache', JSON.stringify(cacheData));
    } catch (error) {
      // Ignorar errores de storage lleno
    }
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('gemini_api_cache');
      if (stored) {
        const cacheData = JSON.parse(stored) as Record<string, CacheEntry<any>>;
        const now = Date.now();
        
        for (const [key, entry] of Object.entries(cacheData)) {
          // Solo cargar entradas que no hayan expirado
          if (entry.expiresAt > now) {
            this.cache.set(key, entry);
          }
        }
        
        console.log(`[RateLimiter] ${this.cache.size} entradas cargadas del cache`);
      }
    } catch (error) {
      // Ignorar errores de parsing
    }
  }
}

// Instancia singleton
export const geminiRateLimiter = new APIRateLimiter({
  maxRequestsPerMinute: 10,
  maxRetries: 3,
  baseCacheDurationMs: 5 * 60 * 1000, // 5 minutos
  enableCache: true
});

// Exportar tipo para uso externo
export type { RateLimiterConfig };
