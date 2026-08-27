import { create } from "zustand";

export const THEMES = ["dark", "light"];

const getInitialTheme = () => {
  const saved = localStorage.getItem("chat-theme");
  if (saved) return saved;
  return "light";
};


export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("chat-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    set({ theme: nextTheme });
  },
}));
