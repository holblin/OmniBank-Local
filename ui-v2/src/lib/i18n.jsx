import React, { createContext, useContext, useEffect, useState } from 'react';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';

const LanguageContext = createContext(null);
const dictionaries = { fr, en };

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('omni_lang') === 'en' ? 'en' : 'fr');
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('omni_lang', language);
    localStorage.setItem('site_lang', language);
  }, [language]);
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const t = key => dictionaries[language][`v2_${key}`] || key;
  const money = (value, currency = 'EUR') => new Intl.NumberFormat(locale, {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value ?? 0);
  const date = (value, options = { day: 'numeric', month: 'short' }) => value
    ? new Intl.DateTimeFormat(locale, options).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : '—';
  return <LanguageContext.Provider value={{ language, setLanguage, locale, t, money, date }}><InternationalizationProvider locale={language}>{children}</InternationalizationProvider></LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
