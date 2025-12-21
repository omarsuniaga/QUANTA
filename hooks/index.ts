/**
 * Barrel export para todos los custom hooks de la aplicación.
 * Simplifica los imports en App.tsx y otros componentes.
 */

export { useAppNavigation } from './useAppNavigation';
export type { TabType, SwipeHandlers } from './useAppNavigation';

export { useModalManager } from './useModalManager';
export type { ModalState } from './useModalManager';

export { useScreenManager } from './useScreenManager';

export { useNotificationSystem } from './useNotificationSystem';

export { useTransactionHandlers } from './useTransactionHandlers';

export { useGoalHandlers } from './useGoalHandlers';

export { useBudgetHandlers } from './useBudgetHandlers';
