import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

const translations: Record<string, Record<string, string>> = { en, te, hi };

let currentLanguage: string = 'en';
const listeners = new Set<(lang: string) => void>();

// Load persisted language on boot
AsyncStorage.getItem('heatguard_lang')
  .then((saved) => {
    if (saved && ['en', 'te', 'hi'].includes(saved)) {
      currentLanguage = saved;
      listeners.forEach((fn) => fn(saved));
    }
  })
  .catch(() => {});

export const setAppLanguage = (lang: string) => {
  if (['en', 'te', 'hi'].includes(lang)) {
    currentLanguage = lang;
    AsyncStorage.setItem('heatguard_lang', lang).catch(() => {});
    listeners.forEach((fn) => fn(lang));
  }
};

export const getAppLanguage = (): string => currentLanguage;

export const useLocalization = () => {
  const [language, setLang] = useState<string>(currentLanguage);

  useEffect(() => {
    const handler = (newLang: string) => setLang(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const t = (key: string): string =>
    translations[language]?.[key] || translations['en']?.[key] || key;

  return { language, setLanguage: setAppLanguage, t };
};
