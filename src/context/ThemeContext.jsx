import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, THEMES } from '../constants';

export const ThemeContext = createContext(null);

/**
 * ThemeProvider — global light/dark theme.
 *
 * - SSR / initial render defaults strictly to THEMES.DARK to match prerendered markup.
 * - Client-only useEffect synchronizes the actual stored/system theme after hydration.
 * - Index.html applies the stored theme before first paint (FOUC prevention).
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.DARK);

  // Sync state with actual client preference only on the client after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === THEMES.DARK || stored === THEMES.LIGHT) {
        if (stored !== THEMES.DARK) {
          setTheme(stored);
        }
      } else {
        const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
        if (prefersLight) {
          setTheme(THEMES.LIGHT);
        }
      }
    } catch {
      // Gracefully handle storage access restrictions
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
      }
    } catch {
      // Gracefully handle storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      toggle: toggleTheme,
      isDark: theme === THEMES.DARK,
    }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the theme. Throws if used outside ThemeProvider (fail fast in dev). */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
