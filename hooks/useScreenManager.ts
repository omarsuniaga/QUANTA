import { useState, useCallback } from 'react';
import { CustomCategory } from '../types';

/**
 * Gestiona el estado de todas las pantallas completas (full-screen screens)
 * que se superponen sobre el contenido principal de la aplicación.
 *
 * @returns Objeto con estados y funciones para abrir/cerrar cada pantalla
 */
export function useScreenManager() {
  // AI Coach screens
  const [showAICoach, setShowAICoach] = useState(false);
  const [showSavingsPlanner, setShowSavingsPlanner] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showQuickExpenses, setShowQuickExpenses] = useState(false);

  // Notification screens
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showGoalsManagement, setShowGoalsManagement] = useState(false);

  // Category profile screen
  const [showCategoryProfile, setShowCategoryProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // AI Coach handlers
  const openAICoach = useCallback(() => setShowAICoach(true), []);
  const closeAICoach = useCallback(() => setShowAICoach(false), []);

  const openSavingsPlanner = useCallback(() => setShowSavingsPlanner(true), []);
  const closeSavingsPlanner = useCallback(() => setShowSavingsPlanner(false), []);

  const openChallenges = useCallback(() => setShowChallenges(true), []);
  const closeChallenges = useCallback(() => setShowChallenges(false), []);

  const openStrategies = useCallback(() => setShowStrategies(true), []);
  const closeStrategies = useCallback(() => setShowStrategies(false), []);

  const openQuickExpenses = useCallback(() => setShowQuickExpenses(true), []);
  const closeQuickExpenses = useCallback(() => setShowQuickExpenses(false), []);

  // Notification handlers
  const openNotificationCenter = useCallback(() => setShowNotificationCenter(true), []);
  const closeNotificationCenter = useCallback(() => setShowNotificationCenter(false), []);

  const openNotificationPrefs = useCallback(() => setShowNotificationPrefs(true), []);
  const closeNotificationPrefs = useCallback(() => setShowNotificationPrefs(false), []);

  const openGoalsManagement = useCallback(() => setShowGoalsManagement(true), []);
  const closeGoalsManagement = useCallback(() => setShowGoalsManagement(false), []);

  // Category profile handlers
  const openCategoryProfile = useCallback((category: string) => {
    setSelectedCategory(category);
    setShowCategoryProfile(true);
  }, []);

  const closeCategoryProfile = useCallback(() => {
    setShowCategoryProfile(false);
    setSelectedCategory(null);
  }, []);

  // Utility function to close all screens
  const closeAllScreens = useCallback(() => {
    setShowAICoach(false);
    setShowSavingsPlanner(false);
    setShowChallenges(false);
    setShowStrategies(false);
    setShowQuickExpenses(false);
    setShowNotificationCenter(false);
    setShowNotificationPrefs(false);
    setShowGoalsManagement(false);
    setShowCategoryProfile(false);
    setSelectedCategory(null);
  }, []);

  return {
    // AI Coach screens
    aiCoachScreen: { show: showAICoach },
    openAICoach,
    closeAICoach,

    savingsPlannerScreen: { show: showSavingsPlanner },
    openSavingsPlanner,
    closeSavingsPlanner,

    challengesScreen: { show: showChallenges },
    openChallenges,
    closeChallenges,

    strategiesScreen: { show: showStrategies },
    openStrategies,
    closeStrategies,

    quickExpensesScreen: { show: showQuickExpenses },
    openQuickExpenses,
    closeQuickExpenses,

    // Notification screens
    notificationCenterScreen: { show: showNotificationCenter },
    openNotificationCenter,
    closeNotificationCenter,

    notificationPrefsScreen: { show: showNotificationPrefs },
    openNotificationPrefs,
    closeNotificationPrefs,

    goalsManagementScreen: { show: showGoalsManagement },
    openGoalsManagement,
    closeGoalsManagement,

    // Category profile screen
    categoryProfileScreen: {
      show: showCategoryProfile,
      category: selectedCategory,
    },
    customCategories,
    setCustomCategories,
    openCategoryProfile,
    closeCategoryProfile,

    // Utility
    closeAllScreens,
  };
}
