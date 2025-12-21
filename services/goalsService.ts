import { db, auth } from '../firebaseConfig';
import firebase from 'firebase/compat/app';
import { Goal } from '../types';
import {
  PlanId,
  PlanAllocation,
  AllocationCategory,
  getAllocationCategoryName,
  getAllocationCategoryIcon,
  getAllocationCategoryColor
} from '../utils/surplusPlan';

export interface CreateGoalFromPlanParams {
  periodKey: string;
  planId: PlanId;
  allocations: PlanAllocation;
  language: 'es' | 'en';
}

export interface GoalCreationResult {
  success: boolean;
  goalsCreated?: string[]; // IDs of created goals
  error?: string;
}

/**
 * FIREBASE SDK: firebase/compat/app (v12.6.0)
 * ------------------------------------------
 * Este proyecto usa Firebase Compat SDK (NO modular).
 * Imports correctos:
 * - import firebase from 'firebase/compat/app'
 * - firebase.firestore.FieldValue.serverTimestamp()
 * - db.collection(), db.batch()
 * 
 * NO usar:
 * - import { serverTimestamp } from 'firebase/firestore' (modular)
 * - import { collection, query } from 'firebase/firestore' (modular)
 */

/**
 * BACKWARDS COMPATIBILITY - Status Field
 * ---------------------------------------
 * Estrategia: Opción B - Fallback en lectura
 * 
 * Problema: Goals antiguos pueden no tener campo 'status'
 * Solución: Tratarlos como 'active' en queries
 * 
 * Implementación:
 * - hasGoalsForPeriod: Busca status='active' OR status undefined
 * - deleteGoalsForPeriod: Actualiza solo docs con status='active' o sin status
 * 
 * Ventajas:
 * - No requiere migración masiva
 * - Goals antiguos funcionan inmediatamente
 * - Nuevos goals siempre tienen status
 * 
 * Nota: Goals nuevos SIEMPRE tienen status='active' al crearse.
 */

/**
 * REGLA DE DUPLICADOS (Decisión de Producto):
 * ------------------------------------------
 * Opción A implementada: "Solo un set de metas surplus_plan por período"
 * 
 * Esto significa:
 * - Un usuario solo puede tener UN conjunto de 3 metas creadas desde planes de superávit por período (mes).
 * - Si el usuario aplica un plan diferente en el mismo mes, las metas anteriores se REEMPLAZAN.
 * - Esto evita acumulación confusa de múltiples sets de metas del mismo origen.
 * - Las metas manuales (source !== 'surplus_plan') NO se ven afectadas.
 * 
 * Alternativa NO implementada (Opción B):
 * "Un set por planId por período" permitiría 3 sets simultáneos (conservative + balanced + aggressive).
 * Esto fue descartado por complejidad UX y potencial confusión del usuario.
 */

/**
 * Crea 3 metas en Firestore desde un plan de distribución de superávit.
 * Usa batch write atómico para garantizar consistencia.
 * 
 * @param params - Parámetros para crear las metas
 * @returns Resultado de la operación con IDs de metas creadas o error
 */
export const createGoalsFromPlan = async (
  params: CreateGoalFromPlanParams
): Promise<GoalCreationResult> => {
  const { periodKey, planId, allocations, language } = params;

  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: language === 'es' 
          ? 'Usuario no autenticado' 
          : 'User not authenticated'
      };
    }

    // Validar que hay montos para crear
    const total = allocations.savings + allocations.goals + allocations.personal;
    if (total <= 0) {
      return {
        success: false,
        error: language === 'es'
          ? 'No hay superávit disponible para crear metas'
          : 'No surplus available to create goals'
      };
    }

    const goalsCollection = db.collection('goals');
    const batch = db.batch();
    const createdIds: string[] = [];

    // Crear las 3 metas (savings, goals, personal) usando batch write
    const categories: AllocationCategory[] = ['savings', 'goals', 'personal'];
    
    for (const category of categories) {
      const amount = allocations[category];
      
      // Solo crear meta si el monto es > 0
      if (amount > 0) {
        const docRef = goalsCollection.doc(); // Generate ID
        const goalData: Partial<Goal> = {
          name: getAllocationCategoryName(category, planId, language),
          targetAmount: amount,
          currentAmount: 0,
          icon: getAllocationCategoryIcon(category),
          color: getAllocationCategoryColor(category),
          contributionAmount: 0,
          contributionFrequency: 'monthly',
          calculationMode: 'time',
          autoDeduct: false
        };

        batch.set(docRef, {
          ...goalData,
          userId: user.uid,
          periodKey,
          planId,
          category,
          source: 'surplus_plan',
          status: 'active',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        createdIds.push(docRef.id);
      }
    }

    // Commit batch atómicamente
    await batch.commit();

    return {
      success: true,
      goalsCreated: createdIds
    };

  } catch (error) {
    console.error('Error creating goals from plan:', error);
    return {
      success: false,
      error: language === 'es'
        ? 'Error al crear las metas. Intenta nuevamente.'
        : 'Error creating goals. Please try again.'
    };
  }
};

/**
 * Genera la clave del período actual (formato: YYYY-MM)
 */
export const getCurrentPeriodKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Verifica si ya existen metas activas creadas desde un plan en el período actual.
 * Implementa regla de duplicados: "Solo un set de metas surplus_plan por período".
 * 
 * Scoping:
 * - userId: Solo metas del usuario actual
 * - periodKey: Solo del período especificado (ej: "2025-12")
 * - source: Solo metas creadas desde planes ('surplus_plan')
 * - status: Activas O sin status (backwards compatibility)
 * 
 * Backwards Compatibility:
 * - Goals antiguos sin campo 'status' se consideran activos
 * - Query busca: status='active' OR status=undefined
 * 
 * @param periodKey - Período en formato "YYYY-MM"
 * @returns true si existen metas activas de surplus_plan en el período
 */
export const hasGoalsForPeriod = async (periodKey: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Query sin filtro de status para capturar goals antiguos
    const snapshot = await db
      .collection('goals')
      .where('userId', '==', user.uid)
      .where('periodKey', '==', periodKey)
      .where('source', '==', 'surplus_plan')
      .get();

    // Filtrar en cliente: status='active' OR status=undefined (backwards compatibility)
    const activeGoals = snapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'active' || status === undefined;
    });

    return activeGoals.length > 0;
  } catch (error) {
    console.error('Error checking existing goals:', error);
    return false;
  }
};

/**
 * Elimina (marca como deleted) todas las metas surplus_plan activas del período.
 * Usa soft-delete para mantener auditoría.
 * Implementa regla de duplicados: "Solo un set de metas surplus_plan por período".
 * 
 * Scoping estricto:
 * - userId: Solo metas del usuario actual (previene eliminación cross-user)
 * - periodKey: Solo del período especificado
 * - source: Solo metas surplus_plan (NO afecta metas manuales)
 * - status: Activas O sin status (backwards compatibility)
 * 
 * Backwards Compatibility:
 * - Goals antiguos sin campo 'status' también se marcan como deleted
 * - Esto evita que goals antiguos se acumulen
 * 
 * @param periodKey - Período en formato "YYYY-MM"
 * @returns true si operación exitosa, false en caso de error
 */
export const deleteGoalsForPeriod = async (periodKey: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    // Query sin filtro de status para capturar goals antiguos
    const snapshot = await db
      .collection('goals')
      .where('userId', '==', user.uid)
      .where('periodKey', '==', periodKey)
      .where('source', '==', 'surplus_plan')
      .get();

    // Filtrar en cliente: status='active' OR status=undefined (backwards compatibility)
    const goalsToDelete = snapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'active' || status === undefined;
    });

    // Si no hay metas para eliminar, retornar éxito
    if (goalsToDelete.length === 0) {
      return true;
    }

    const batch = db.batch();
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    goalsToDelete.forEach(doc => {
      // Soft-delete: marcar como deleted en lugar de eliminar físicamente
      batch.update(doc.ref, {
        status: 'deleted',
        deletedAt: timestamp
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error deleting goals for period:', error);
    return false;
  }
};
