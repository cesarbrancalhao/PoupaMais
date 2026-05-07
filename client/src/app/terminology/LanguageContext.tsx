'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, LanguageContextType } from './language/types';
import { useAuth } from '@/contexts/AuthContext';
import { usersService } from '@/services/users.service';
import { Idioma } from '@/types/auth';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languageToIdioma: Record<Language, Idioma> = {
  pt: 'portugues',
  en: 'ingles',
  es: 'espanhol',
};

const idiomaToLanguage: Record<Idioma, Language> = {
  portugues: 'pt',
  ingles: 'en',
  espanhol: 'es',
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    if (user?.idioma) {
      return idiomaToLanguage[user.idioma] || 'pt';
    }
    return 'pt';
  });

  useEffect(() => {
    if (user?.idioma) {
      setLanguageState(idiomaToLanguage[user.idioma] || 'pt');
    }
  }, [user?.idioma]);

  const setLanguage = async (newLanguage: Language) => {
    if (!user) return;

    try {
      const idiomaValue = languageToIdioma[newLanguage];

      // RN13 - A alteração do idioma mudará as frases e palavras na interface das telas.
      const updatedUser = await usersService.updateSettings(
        idiomaValue,
        user.moeda || 'real'
      );

      setLanguageState(newLanguage);

      setUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar o idioma:', error);
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
    throw new Error('Erro ao usar o contexto de idioma');
  }
  return context;
}
