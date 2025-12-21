export type PlanId = 'conservative' | 'balanced' | 'aggressive';
export type AllocationCategory = 'savings' | 'goals' | 'personal';

export interface PlanAllocation {
  savings: number;
  goals: number;
  personal: number;
}

export interface PlanDefinition {
  id: PlanId;
  percentages: {
    savings: number;
    goals: number;
    personal: number;
  };
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  conservative: {
    id: 'conservative',
    percentages: { savings: 0.7, goals: 0.2, personal: 0.1 }
  },
  balanced: {
    id: 'balanced',
    percentages: { savings: 0.5, goals: 0.3, personal: 0.2 }
  },
  aggressive: {
    id: 'aggressive',
    percentages: { savings: 0.3, goals: 0.4, personal: 0.3 }
  }
};

/**
 * Calcula la distribución de un plan garantizando que la suma sea exacta.
 * Asigna el residuo de redondeo al último bucket (personal) para evitar drift.
 * 
 * @param available - Monto disponible para distribuir (debe ser >= 0)
 * @param planId - ID del plan a aplicar
 * @returns Objeto con las tres asignaciones sumando exactamente `available`
 */
export const calculatePlanAllocations = (
  available: number,
  planId: PlanId
): PlanAllocation => {
  if (available <= 0) {
    return { savings: 0, goals: 0, personal: 0 };
  }

  const plan = PLAN_DEFINITIONS[planId];
  
  // Redondear a 2 decimales los primeros dos buckets
  const savings = Math.round(available * plan.percentages.savings * 100) / 100;
  const goals = Math.round(available * plan.percentages.goals * 100) / 100;
  
  // El último bucket recibe el residuo para garantizar suma exacta
  const personal = Math.round((available - savings - goals) * 100) / 100;

  return { savings, goals, personal };
};

/**
 * Obtiene el nombre localizado de una categoría de asignación
 */
export const getAllocationCategoryName = (
  category: AllocationCategory,
  planId: PlanId,
  language: 'es' | 'en'
): string => {
  const names: Record<AllocationCategory, Record<PlanId, { es: string; en: string }>> = {
    savings: {
      conservative: { es: 'Ahorro de Emergencia', en: 'Emergency Savings' },
      balanced: { es: 'Fondo de Ahorro', en: 'Savings Fund' },
      aggressive: { es: 'Reserva Financiera', en: 'Financial Reserve' }
    },
    goals: {
      conservative: { es: 'Metas a Corto Plazo', en: 'Short-term Goals' },
      balanced: { es: 'Objetivos Financieros', en: 'Financial Objectives' },
      aggressive: { es: 'Metas Prioritarias', en: 'Priority Goals' }
    },
    personal: {
      conservative: { es: 'Desarrollo Personal', en: 'Personal Development' },
      balanced: { es: 'Inversión Personal', en: 'Personal Investment' },
      aggressive: { es: 'Inversión y Crecimiento', en: 'Investment & Growth' }
    }
  };

  return names[category][planId][language];
};

/**
 * Obtiene el icono sugerido para una categoría de asignación
 */
export const getAllocationCategoryIcon = (category: AllocationCategory): string => {
  const icons: Record<AllocationCategory, string> = {
    savings: '💰',
    goals: '🎯',
    personal: '📈'
  };

  return icons[category];
};

/**
 * Obtiene el color sugerido para una categoría de asignación
 */
export const getAllocationCategoryColor = (category: AllocationCategory): string => {
  const colors: Record<AllocationCategory, string> = {
    savings: '#10b981', // emerald-500
    goals: '#6366f1',   // indigo-500
    personal: '#f59e0b' // amber-500
  };

  return colors[category];
};
