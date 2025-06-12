import { useCallback } from "react";
import { I18nManager } from "react-native";

// Translation object
const translations = {
  en: { /* English translations */ },
  ar: { /* Arabic translations */ },
  tr: { /* Turkish translations */ },
};

// Paste the full translations you provided here in place of the three placeholder objects above

type Language = keyof typeof translations;
type TranslationKeys = keyof typeof translations["en"];

// Simple language selector (replace with a global state or AsyncStorage for real use)
let currentLanguage: Language = "en";

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  I18nManager.forceRTL(lang === "ar");
};

export const getLanguage = () => currentLanguage;

export default function useTranslation() {
  const t = useCallback((key: TranslationKeys, options?: Record<string, string>) => {
    const translation = translations[currentLanguage][key] || key;

    if (options) {
      return Object.entries(options).reduce((str, [k, v]) => {
        return str.replace(`{{${k}}}`, v);
      }, translation);
    }

    return translation;
  }, []);

  return { t, setLanguage, getLanguage };
}
