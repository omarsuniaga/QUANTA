import { FinancialPlan, Category } from '../types';

/**
 * QUANTA Financial Plans Configuration
 * 
 * These constants define the behavior, allocation rules, and AI personalities
 * for each of the 4 core financial archetypes.
 */

export const FINANCIAL_PLANS: Record<string, FinancialPlan> = {
  essentialist: {
    id: 'essentialist',
    name: 'El Esencialista (50/30/20)',
    description: 'Equilibrio automático. Ideal para mantener estabilidad sin complicaciones.',
    primaryKPI: 'savings_rate',
    aiPersonality: 'friendly_coach',
    allocationRules: [
      {
        categoryGroup: 'needs',
        targetPercentage: 50,
        isStrict: false,
        description: 'Vivienda, Servicios, Comida, Salud.'
      },
      {
        categoryGroup: 'wants',
        targetPercentage: 30,
        isStrict: false,
        description: 'Entretenimiento, Ocio, Suscripciones.'
      },
      {
        categoryGroup: 'savings',
        targetPercentage: 20,
        isStrict: true,
        description: 'Fondo de emergencia e inversiones.'
      }
    ]
  },
  auditor: {
    id: 'auditor',
    name: 'El Auditor (Base Cero)',
    description: 'Control total. Cada moneda tiene un propósito asignado antes de gastarse.',
    primaryKPI: 'zero_based_gap',
    aiPersonality: 'strict_accountant',
    allocationRules: [
      {
        categoryGroup: 'needs',
        isStrict: true,
        description: 'Presupuestos fijos por categoría.'
      },
      {
        categoryGroup: 'savings',
        isStrict: true,
        description: 'Asignación inmediata de cualquier sobrante.'
      }
    ]
  },
  investor: {
    id: 'investor',
    name: 'El Inversionista (FIRE)',
    description: 'Crecimiento acelerado. Maximiza el capital para alcanzar libertad financiera.',
    primaryKPI: 'net_worth_growth',
    aiPersonality: 'wealth_manager',
    allocationRules: [
      {
        categoryGroup: 'investments',
        targetPercentage: 40,
        isStrict: true,
        description: 'Prioridad absoluta al ahorro para inversión.'
      },
      {
        categoryGroup: 'wants',
        targetPercentage: 10,
        isStrict: true,
        description: 'Minimalismo en gastos discrecionales.'
      }
    ]
  },
  defensive: {
    id: 'defensive',
    name: 'Estratega Defensivo',
    description: 'Modo supervivencia. Enfoque agresivo en eliminar deudas y proteger el flujo.',
    primaryKPI: 'debt_reduction_velocity',
    aiPersonality: 'strategist',
    allocationRules: [
      {
        categoryGroup: 'debt',
        isStrict: true,
        description: 'Pagos extra para reducir capital lo antes posible.'
      },
      {
        categoryGroup: 'needs',
        isStrict: true,
        description: 'Solo gastos esenciales de supervivencia.'
      }
    ]
  }
};

/**
 * Helper to get category mapping for 50/30/20 rules
 */
export const CATEGORY_TO_GROUP: Record<string, 'needs' | 'wants' | 'savings' | 'investments' | 'debt'> = {
  [Category.Housing]: 'needs',
  [Category.Utilities]: 'needs',
  [Category.Food]: 'needs',
  [Category.Health]: 'needs',
  [Category.Transportation]: 'needs',
  
  [Category.Entertainment]: 'wants',
  [Category.Leisure]: 'wants',
  [Category.Services]: 'wants',
  
  [Category.Salary]: 'savings', // Income itself isn't a group, but for allocation logic
  [Category.Investments]: 'investments',
  
  // Custom mapping for debt-like categories
  'Debt': 'debt',
  'Loan': 'debt',
  'Credit Card': 'debt'
};
