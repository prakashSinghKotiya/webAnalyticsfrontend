import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, THEMES } from '../constants';

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === 'undefined') return THEMES.DARK;
  const stored = window.localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === THEMES.DARK || stored === THEMES.LIGHT) return stored;
  // First visit: follow the OS preference.
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  return prefersLight ? THEMES.LIGHT : THEMES.DARK;
}

/**
 * ThemeProvider — global light/dark theme.
 *
 * - Persists the choice to localStorage.
 * - Falls back to the OS `prefers-color-scheme` on first visit.
 * - Index.html applies the stored theme before hydration, so there is no
 *   flash of the wrong theme (FOUC) — this provider only takes over after.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
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
