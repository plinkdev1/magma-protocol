import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { darkTokens, lightTokens, ThemeTokens } from './tokens';

// Types

export type ColorSchemePreference = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme:         ThemeTokens;
  colorScheme:   ColorSchemePreference;
  isDark:        boolean;
  setColorScheme: (scheme: ColorSchemePreference) => Promise<void>;
}

// Context

const ThemeContext = createContext<ThemeContextValue>({
  theme:         darkTokens,
  colorScheme:   'dark',
  isDark:        true,
  setColorScheme: async () => {},
});

const STORAGE_KEY = 'magma_theme_pref';

// Provider

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [pref, setPref]       = useState<ColorSchemePreference>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          setPref(stored);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorSchemePreference) => {
    setPref(scheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, scheme);
    } catch {}
  }, []);

  const isDark = useMemo(() => {
    if (pref === 'system') return systemScheme !== 'light';
    return pref === 'dark';
  }, [pref, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme:         isDark ? darkTokens : lightTokens,
      colorScheme:   pref,
      isDark,
      setColorScheme,
    }),
    [isDark, pref, setColorScheme],
  );

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
