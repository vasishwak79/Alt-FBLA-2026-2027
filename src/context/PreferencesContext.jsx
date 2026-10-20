import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'commons:preferences';

export const DEFAULT_PREFERENCES = {
  theme: 'system', // 'light' | 'dark' | 'system'
  textSize: 'default', // 'default' | 'large' | 'larger'
  contrast: 'normal', // 'normal' | 'high'
  motion: 'system', // 'system' | 'reduce'
  font: 'default', // 'default' | 'legible'
  underlineLinks: false,
};

function loadPreferences() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { ...DEFAULT_PREFERENCES, ...saved };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

const PreferencesContext = createContext(null);

/**
 * Display and accessibility preferences. Each choice is written to a
 * data-attribute on <html> (for example data-contrast="high"), and the
 * stylesheets react to those attributes. Choices are remembered in
 * localStorage on this device.
 */
export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Follow the operating system's light/dark setting when theme is "system".
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme;

    root.dataset.theme = resolvedTheme;
    root.dataset.textSize = preferences.textSize;
    root.dataset.contrast = preferences.contrast;
    root.dataset.motion = preferences.motion;
    root.dataset.font = preferences.font;
    root.dataset.links = preferences.underlineLinks ? 'underline' : 'default';

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Private browsing can block storage; the settings still apply for this visit.
    }
  }, [preferences, systemDark]);

  const updatePreferences = useCallback((changes) => {
    setPreferences((previous) => ({ ...previous, ...changes }));
  }, []);

  const resetPreferences = useCallback(() => setPreferences(DEFAULT_PREFERENCES), []);

  const value = useMemo(
    () => ({ preferences, updatePreferences, resetPreferences }),
    [preferences, updatePreferences, resetPreferences],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
