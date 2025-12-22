/**
 * Dev Metrics - Sistema de medición para desarrollo
 * 
 * Objetivo: Recolectar evidencia de duplicación de data loads
 * para decidir si implementar useAppDataLoader (Fase 2)
 * 
 * IMPORTANTE: Solo activo en development mode
 */

interface DataLoadMetric {
  source: string;
  timestamp: number;
  screen: string;
}

class DevMetrics {
  private dataLoads: DataLoadMetric[] = [];
  private isDev = import.meta.env.DEV;

  /**
   * Registra un data load
   */
  trackDataLoad(source: string, screen: string = 'unknown') {
    if (!this.isDev) return;

    this.dataLoads.push({
      source,
      timestamp: Date.now(),
      screen
    });

    // Log en consola (solo dev)
    console.log(`[DevMetrics] 📊 Data load: ${source} (screen: ${screen})`);
  }

  /**
   * Obtiene el total de data loads en la sesión actual
   */
  getTotalDataLoads(): number {
    return this.dataLoads.length;
  }

  /**
   * Obtiene data loads agrupados por fuente
   */
  getDataLoadsBySource(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.dataLoads.forEach(load => {
      counts[load.source] = (counts[load.source] || 0) + 1;
    });

    return counts;
  }

  /**
   * Obtiene data loads agrupados por pantalla
   */
  getDataLoadsByScreen(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    this.dataLoads.forEach(load => {
      counts[load.screen] = (counts[load.screen] || 0) + 1;
    });

    return counts;
  }

  /**
   * Detecta duplicación de data loads
   * Retorna true si hay evidencia de carga redundante
   */
  hasDuplicateLoads(): boolean {
    const bySource = this.getDataLoadsBySource();
    
    // Si alguna fuente se cargó más de 2 veces por sesión, hay duplicación
    return Object.values(bySource).some(count => count > 2);
  }

  /**
   * Genera reporte de métricas
   */
  getReport(): {
    totalLoads: number;
    bySource: Record<string, number>;
    byScreen: Record<string, number>;
    hasDuplication: boolean;
    recommendation: string;
  } {
    const bySource = this.getDataLoadsBySource();
    const byScreen = this.getDataLoadsByScreen();
    const hasDuplication = this.hasDuplicateLoads();

    let recommendation = '';
    if (hasDuplication) {
      recommendation = '⚠️ Duplicación detectada. Considerar implementar useAppDataLoader (Fase 2).';
    } else if (this.getTotalDataLoads() > 10) {
      recommendation = '💡 Muchos data loads. Revisar si son necesarios.';
    } else {
      recommendation = '✅ Carga de datos eficiente. No se requiere refactorización.';
    }

    return {
      totalLoads: this.getTotalDataLoads(),
      bySource,
      byScreen,
      hasDuplication,
      recommendation
    };
  }

  /**
   * Imprime reporte en consola
   */
  printReport() {
    if (!this.isDev) return;

    const report = this.getReport();

    console.group('📊 [DevMetrics] Data Load Report');
    console.log(`Total data loads: ${report.totalLoads}`);
    console.log('By source:', report.bySource);
    console.log('By screen:', report.byScreen);
    console.log(`Duplication: ${report.hasDuplication ? '⚠️ YES' : '✅ NO'}`);
    console.log(`Recommendation: ${report.recommendation}`);
    console.groupEnd();
  }

  /**
   * Resetea métricas (útil para testing)
   */
  reset() {
    this.dataLoads = [];
  }
}

// Singleton instance
export const devMetrics = new DevMetrics();

/**
 * Hook para tracking automático en componentes
 */
export function useDevMetrics(screen: string) {
  // Solo en dev
  if (!import.meta.env.DEV) return;

  // Tracking automático cuando el componente monta
  // React se importa donde se use este hook
  // React.useEffect(() => {
  //   devMetrics.trackDataLoad('component-mount', screen);
  // }, [screen]);
}

// Exponer en window para debugging en consola
if (import.meta.env.DEV) {
  (window as any).devMetrics = devMetrics;
}
