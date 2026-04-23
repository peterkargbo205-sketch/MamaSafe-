import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en';
import krio from '../locales/krio';

const LANG_KEY = '@mamasafe_language';
const LOCALES = { en, krio };

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => { if (v) setLang(v); }).catch(() => {});
  }, []);

  const toggleLanguage = async () => {
    const next = lang === 'en' ? 'krio' : 'en';
    setLang(next);
    await AsyncStorage.setItem(LANG_KEY, next).catch(() => {});
  };

  const t = (key) => LOCALES[lang]?.[key] ?? LOCALES.en?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
