import React, { createContext, useContext, useEffect, useState } from "react";
import fr from "../locales/fr.json";
import en from "../locales/en.json";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import astryxFrench from "@astryxdesign/core/locales/fr-FR.generated.js";

type Language = "fr" | "en";
interface LanguageValue {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  locale: string;
  privacy: boolean;
  togglePrivacy: () => void;
  t: (key: string | number) => string;
  money: (value: number | null | undefined, currency?: string) => string;
  date: (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
}
const LanguageContext = createContext<LanguageValue | null>(null);
const dictionaries: Record<Language, Record<string, string>> = { fr, en };
// Bundle component copy locally; Astryx ships English as its fallback.
const componentMessages = { fr: astryxFrench };

export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem("omni_lang") === "en" ? "en" : "fr",
  );
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("omni_lang", language);
    localStorage.setItem("site_lang", language);
  }, [language]);
  const [privacy, setPrivacy] = useState(
    () => localStorage.getItem("omni_v2_privacy") === "true",
  );
  function togglePrivacy() {
    localStorage.setItem("omni_v2_privacy", String(!privacy));
    setPrivacy(!privacy);
  }
  const locale = language === "fr" ? "fr-FR" : "en-GB";
  const t = (key: string | number) =>
    dictionaries[language][`v2_${key}`] || String(key);
  const money = (value: number | null | undefined, currency = "EUR") =>
    privacy
      ? "•••••"
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value ?? 0);
  const date = (
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
  ) =>
    value
      ? new Intl.DateTimeFormat(locale, options).format(
          new Date(`${value.slice(0, 10)}T12:00:00`),
        )
      : "—";
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        locale,
        t,
        money,
        date,
        privacy,
        togglePrivacy,
      }}
    >
      <InternationalizationProvider locale={language} messages={componentMessages}>
        {children}
      </InternationalizationProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("Contexte de langue indisponible");
  return value;
}
