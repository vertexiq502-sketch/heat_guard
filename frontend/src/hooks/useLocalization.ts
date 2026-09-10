import { useState, useEffect } from 'react';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

const translations: Record<string, Record<string, string>> = { en, te, hi };

let currentLanguage: string = 'en';
try {
  const saved = localStorage.getItem('heatguard_lang');
  if (saved && ['en', 'te', 'hi'].includes(saved)) {
    currentLanguage = saved;
  }
} catch {
  // Ignore storage access errors
}

const listeners = new Set<(lang: string) => void>();

export const setAppLanguage = (lang: string) => {
  if (['en', 'te', 'hi'].includes(lang)) {
    currentLanguage = lang;
    try {
      localStorage.setItem('heatguard_lang', lang);
    } catch {
      // Ignore storage access errors
    }
    listeners.forEach((fn) => fn(lang));
  }
};

export const useLocalization = () => {
  const [language, setLang] = useState<string>(currentLanguage);

  useEffect(() => {
    const handler = (newLang: string) => setLang(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const t = (key: string) => translations[language]?.[key] || translations['en']?.[key] || key;

  return { language, setLanguage: setAppLanguage, t };
};