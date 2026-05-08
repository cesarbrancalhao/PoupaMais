'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, LanguageContextType } from './language/types';
import { useAuth } from '@/contexts/AuthContext';
import { usersService } from '@/services/users.service';
import { Language as AuthLanguage } from '@/types/auth';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languageToAuthLanguage: Record<Language, AuthLanguage> = {
  pt: 'portuguese',
  en: 'english',
  es: 'spanish',
};

const authLanguageToLanguage: Record<AuthLanguage, Language> = {
  portuguese: 'pt',
  english: 'en',
  spanish: 'es',
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    if (user?.language) {
      return authLanguageToLanguage[user.language] || 'pt';
    }
    return 'pt';
  });

  useEffect(() => {
    if (user?.language) {
      setLanguageState(authLanguageToLanguage[user.language] || 'pt');
    }
  }, [user?.language]);

  const setLanguage = async (newLanguage: Language) => {
    if (!user) return;

    try {
      const authLanguageValue = languageToAuthLanguage[newLanguage];

      const updatedUser = await usersService.updateSettings(
        authLanguageValue,
        user.currency || 'real'
      );

      setLanguageState(newLanguage);

      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const t = <T,>(translations: Record<Language, T>): T => {
    return translations[language] || translations['pt'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('Error using language context');
  }
  return context;
}
