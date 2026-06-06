import React, { createContext, useContext, useState, useEffect } from 'react';
export type Theme = 'light' | 'dark' | 'system';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | null>(null);
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
    };
    applyTheme();
    if (theme === 'system') {
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
