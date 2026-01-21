import { storageService } from '../services/storageService';
import { geminiRateLimiter } from '../services/apiRateLimiter';

/**
 * Patrones de claves de localStorage que deben ser limpiadas o aisladas
 */
const CACHE_PATTERNS = [
  'quanta_ai_',
  'gemini_',
  'smart_goals_',
  'notifications_',
  'financial_analysis_',
  'ai_cache_',
  'gemini_api_cache'
];

/**
 * CacheManager Facade
 * Proporciona una interfaz única para el aislamiento de datos entre sesiones
 */
export const cacheManager = {
  /**
   * Limpia el caché de un usuario específico o todo el caché relacionado si no se pasa ID
   * @param userId Opcional. Si se pasa, solo limpia entradas que contengan este ID
   */
  clearUserCache(userId?: string): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const isTargetMatch = CACHE_PATTERNS.some(pattern => key.includes(pattern));
        
        if (isTargetMatch) {
            if (userId) {
                // Validación estricta sugerida por @CodeReviewer
                if (key.includes(userId)) {
                    keysToRemove.push(key);
                }
            } else {
                keysToRemove.push(key);
            }
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Limpiar también estados internos de servicios singleton
    geminiRateLimiter.clearCache();
    storageService.clearLocalData();
    
    console.log(`[CacheManager] Limpieza completada. Entradas eliminadas: ${keysToRemove.length}`);
  },

  /**
   * Detecta si el usuario actual es distinto al de la última sesión
   * Si hay cambio, limpia el caché del usuario anterior
   */
  handleUserSessionTransition(currentUserId: string): void {
    const lastSessionUser = localStorage.getItem('quanta_last_session_user');
    
    if (lastSessionUser && lastSessionUser !== currentUserId) {
      console.warn(`[CacheManager] Cambio de usuario detectado (${lastSessionUser} -> ${currentUserId}). Limpiando rastro anterior.`);
      this.clearUserCache(lastSessionUser);
      // Opcional: limpiar todo si se quiere seguridad máxima
      // this.clearUserCache(); 
    }
    
    localStorage.setItem('quanta_last_session_user', currentUserId);
  },

  /**
   * Orquestación completa de Logout
   */
  async handleFullLogout(): Promise<void> {
    console.log('[CacheManager] Iniciando limpieza total por Logout');
    this.clearUserCache();
    localStorage.removeItem('quanta_last_session_user');
  }
};
