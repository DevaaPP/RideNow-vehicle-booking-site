"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "@/lib/i18n/dictionaries/en.json";
import as from "@/lib/i18n/dictionaries/as.json";
import hi from "@/lib/i18n/dictionaries/hi.json";
import bn from "@/lib/i18n/dictionaries/bn.json";

export type Language = "en" | "as" | "hi" | "bn";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
];

const DICTIONARIES: Record<Language, any> = {
  en,
  as,
  hi,
  bn,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jatri_lang") as Language;
      if (stored && ["en", "as", "hi", "bn"].includes(stored)) {
        setLanguageState(stored);
      } else {
        // Detect browser language
        const navLang = navigator.language?.toLowerCase() || "";
        if (navLang.startsWith("as")) setLanguageState("as");
        else if (navLang.startsWith("hi")) setLanguageState("hi");
        else if (navLang.startsWith("bn")) setLanguageState("bn");
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("jatri_lang", lang);
      document.cookie = `jatri_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    
    // 1. Try current language dictionary
    let current: any = DICTIONARIES[language];
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === "string") return current;

    // 2. Fallback to English dictionary
    let enFallback: any = DICTIONARIES.en;
    for (const k of keys) {
      if (enFallback && typeof enFallback === "object" && k in enFallback) {
        enFallback = enFallback[k];
      } else {
        enFallback = undefined;
        break;
      }
    }
    if (typeof enFallback === "string") return enFallback;

    // 3. Fallback to provided string or key
    return fallback !== undefined ? fallback : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
