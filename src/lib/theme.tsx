/**
 * Theme system — light/dark mode via Context + the `.dark` class on <html>.
 *
 * Architecture:
 * - <ThemeProvider> holds theme state in React. Mounts once at the root.
 * - useTheme() reads from the Context — all consumers share the same state.
 * - On theme state change, an effect syncs the `.dark` class to <html>.
 *   The effect runs AFTER React commits, so it always wins any reconciliation
 *   race with React's vdom for the html element.
 * - On mount, the provider reads the current state from the DOM, which the
 *   inline init script in layout.tsx already populated from localStorage.
 *   This means there's no flash on initial page load.
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ff_theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // On mount, read whatever the inline init script set on <html>
  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setThemeState(initial);
  }, []);

  // Sync the class to <html> + persist to localStorage on every change.
  // This effect runs after React commits, so it always wins any race
  // with React reconciliation that might remove the class.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable (private mode) — ignore
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
