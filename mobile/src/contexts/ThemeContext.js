import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { saveTheme, getTheme } from '../utils/storage';
import { COLORS } from '../utils/constants';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await getTheme();
      if (stored) setThemeMode(stored);
    };
    loadTheme();
  }, []);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark
    ? {
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        error: COLORS.error,
        warning: COLORS.warning,
        success: COLORS.success,
        info: COLORS.info,
        background: COLORS.dark.background,
        surface: COLORS.dark.surface,
        surfaceElevated: COLORS.dark.surfaceElevated,
        border: COLORS.dark.border,
        textPrimary: COLORS.dark.textPrimary,
        textSecondary: COLORS.dark.textSecondary,
        textMuted: COLORS.dark.textMuted,
        white: COLORS.white,
        card: COLORS.dark.surface,
        statusBar: 'light-content',
      }
    : {
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        secondary: COLORS.secondary,
        accent: COLORS.accent,
        error: COLORS.error,
        warning: COLORS.warning,
        success: COLORS.success,
        info: COLORS.info,
        background: COLORS.background,
        surface: COLORS.surface,
        surfaceElevated: '#F1F5F9',
        border: COLORS.border,
        textPrimary: COLORS.textPrimary,
        textSecondary: COLORS.textSecondary,
        textMuted: COLORS.textMuted,
        white: COLORS.white,
        card: COLORS.white,
        statusBar: 'dark-content',
      };

  const toggleTheme = useCallback(async (mode) => {
    setThemeMode(mode);
    await saveTheme(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
