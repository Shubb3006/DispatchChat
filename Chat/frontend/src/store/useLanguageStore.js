import { create } from "zustand";
import { translations } from "../lib/translations";

export const useLanguageStore = create((set, get) => ({
  language: localStorage.getItem("chat-language") || "en",

  setLanguage: (lang) => {
    localStorage.setItem("chat-language", lang);
    set({ language: lang });
  },

  t: (key) => {
    const currentLang = get().language;
    return translations[currentLang]?.[key] || translations["en"]?.[key] || key;
  },
}));
