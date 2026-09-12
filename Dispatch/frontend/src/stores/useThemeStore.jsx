// import { create } from "zustand";

// export const THEMES = ["dark", "light"];

// const getInitialTheme = () => {
//     const saved = localStorage.getItem("chat-theme");
//     if (saved) return saved;
//     return "light";
// };


// export const useThemeStore = create((set, get) => ({
//     theme: getInitialTheme(),
//     setTheme: (theme) => {
//         localStorage.setItem("chat-theme", theme);
//         document.documentElement.setAttribute("data-theme", theme);
//         set({ theme });
//     },
//     toggleTheme: () => {
//         const currentTheme = get().theme;
//         const nextTheme = currentTheme === "dark" ? "light" : "dark";
//         localStorage.setItem("chat-theme", nextTheme);
//         document.documentElement.setAttribute("data-theme", nextTheme);
//         set({ theme: nextTheme });
//     },
// }));

import { create } from "zustand";

export const THEMES = ["dark", "light"];

const getInitialTheme = () => {
    const saved = localStorage.getItem("chat-theme");

    return THEMES.includes(saved) ? saved : "light";
};

export const useThemeStore = create((set, get) => {
    const initialTheme = getInitialTheme();

    // Apply theme immediately when the store is initialized
    document.documentElement.setAttribute("data-theme", initialTheme);

    return {
        theme: initialTheme,

        setTheme: (theme) => {
            if (!THEMES.includes(theme)) return;

            localStorage.setItem("chat-theme", theme);

            document.documentElement.setAttribute("data-theme", theme);

            set({ theme });
        },

        toggleTheme: () => {
            const currentTheme = get().theme;

            const nextTheme =
                currentTheme === "dark" ? "light" : "dark";

            localStorage.setItem("chat-theme", nextTheme);

            document.documentElement.setAttribute("data-theme", nextTheme);

            set({ theme: nextTheme });
        },
    };
});