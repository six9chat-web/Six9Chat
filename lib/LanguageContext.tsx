"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  Language,
  TranslationKey,
  TRANSLATIONS,
} from "./languages";

interface LanguageContextType {
  language: Language;
  languageCode: string;
  setLanguage: (langOrCode: Language | string) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  availableLanguages: Language[];
}

const STORAGE_KEY = "six9chat_language";

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const found =
            LANGUAGES.find((l) => l.code === stored) ||
            LANGUAGES.find(
              (l) => l.code.toLowerCase() === stored.toLowerCase()
            ) ||
            LANGUAGES.find((l) => l.code.startsWith(stored.split("-")[0]));
          if (found) return found;
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_LANGUAGE;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or browser language on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found =
          LANGUAGES.find((l) => l.code === stored) ||
          LANGUAGES.find(
            (l) => l.code.toLowerCase() === stored.toLowerCase()
          ) ||
          LANGUAGES.find((l) => l.code.startsWith(stored.split("-")[0]));
        if (found) {
          setCurrentLanguage(found);
        }
      } else if (typeof navigator !== "undefined" && navigator.language) {
        const browserCode = navigator.language;
        const matched =
          LANGUAGES.find((l) => l.code === browserCode) ||
          LANGUAGES.find((l) => l.code === browserCode.split("-")[0]);
        if (matched) {
          setCurrentLanguage(matched);
        }
      }
    } catch {
      // localStorage may not be accessible in private browsing
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Update HTML document lang and dir attributes whenever language changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      const dir = currentLanguage.direction || "ltr";
      document.documentElement.lang = currentLanguage.code;
      document.documentElement.dir = dir;
    }
  }, [currentLanguage]);

  const setLanguage = useCallback((langOrCode: Language | string) => {
    let targetLang: Language | undefined;

    if (typeof langOrCode === "string") {
      targetLang =
        LANGUAGES.find((l) => l.code === langOrCode) ||
        LANGUAGES.find((l) => l.code.toLowerCase() === langOrCode.toLowerCase()) ||
        LANGUAGES.find((l) => l.code.startsWith(langOrCode.split("-")[0]));
    } else {
      targetLang = langOrCode;
    }

    if (targetLang) {
      setCurrentLanguage(targetLang);
      try {
        localStorage.setItem(STORAGE_KEY, targetLang.code);
      } catch {
        // ignore
      }

      if (typeof document !== "undefined") {
        document.documentElement.lang = targetLang.code;
        document.documentElement.dir = targetLang.direction || "ltr";
      }
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, fallback?: string): string => {
      const langCode = currentLanguage.code;
      const lowerCode = langCode.toLowerCase();
      const primaryPrefix = langCode.split("-")[0].toLowerCase();

      // 1. Try exact language code match
      if (TRANSLATIONS[langCode]?.[key]) {
        return TRANSLATIONS[langCode][key];
      }

      // 2. Try lowercased code
      if (TRANSLATIONS[lowerCode]?.[key]) {
        return TRANSLATIONS[lowerCode][key];
      }

      // 3. Try base prefix (e.g., zh-CN -> zh, es-ES -> es)
      if (TRANSLATIONS[primaryPrefix]?.[key]) {
        return TRANSLATIONS[primaryPrefix][key];
      }

      // 4. Fallback to English
      if (TRANSLATIONS["en"]?.[key]) {
        return TRANSLATIONS["en"][key];
      }

      // 5. Fallback to provided fallback or key
      return fallback || key;
    },
    [currentLanguage]
  );

  const dir: "ltr" | "rtl" = currentLanguage.direction || "ltr";
  const isRTL = dir === "rtl";

  return (
    <LanguageContext.Provider
      value={{
        language: currentLanguage,
        languageCode: currentLanguage.code,
        setLanguage,
        t,
        dir,
        isRTL,
        availableLanguages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Provide safe fallback if accessed outside provider
    return {
      language: DEFAULT_LANGUAGE,
      languageCode: DEFAULT_LANGUAGE.code,
      setLanguage: () => {},
      t: (key: string, fallback?: string) =>
        TRANSLATIONS["en"]?.[key] || fallback || key,
      dir: "ltr",
      isRTL: false,
      availableLanguages: LANGUAGES,
    };
  }
  return context;
}

// Convenient alias
export const useTranslation = useLanguage;
