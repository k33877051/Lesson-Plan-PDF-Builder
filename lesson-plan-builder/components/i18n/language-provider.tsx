"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createTranslator, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "lpb-language";
const LANGUAGE_EVENT = "lpb-language-change";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof createTranslator>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function applyLanguage(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

/** บันทึกภาษาลง localStorage และ apply ทันที (ใช้ได้แม้อยู่นอก hook) */
export function setAppLanguage(locale: Locale) {
  applyLanguage(locale);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: locale }));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "th" || stored === "en") {
      setLocaleState(stored);
      document.documentElement.lang = stored;
      return;
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && (json.data?.language === "th" || json.data?.language === "en")) {
          setLocaleState(json.data.language);
          applyLanguage(json.data.language);
        }
      })
      .catch(() => {
        // ใช้ค่า default ภาษาไทย
      });
  }, []);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<Locale>).detail;
      if (next === "th" || next === "en") {
        setLocaleState(next);
      }
    };

    window.addEventListener(LANGUAGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_EVENT, handleLanguageChange);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyLanguage(next);
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return context;
}
