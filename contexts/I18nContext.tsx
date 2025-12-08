import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { es, en, TranslationKeys } from '../locales';

type Language = 'es' | 'en';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = { es, en };

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('es');

    // Load language from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem('language') as Language;
        if (saved && (saved === 'es' || saved === 'en')) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    };

    const value: I18nContextType = {
        language,
        setLanguage,
        t: translations[language],
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};
