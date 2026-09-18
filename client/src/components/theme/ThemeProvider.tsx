"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "flowengine-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const nextMode: ThemeMode =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setMode(nextMode);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      setIsDark(dark);
    };

    applyTheme();
    if (mode !== "system") {
      window.localStorage.setItem(storageKey, mode);
    }

    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      toggleTheme: () => setMode((current) => (current === "dark" ? "light" : "dark"))
    }),
    [isDark, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
