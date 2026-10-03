import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { themeAPI } from "../../api/services";
import { getThemeColors } from "../../../../mobile/src/utils/themePalettes";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("theme1");
  const [themeMode, setThemeMode] = useState("system");
  const [systemScheme, setSystemScheme] = useState("light");
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeCooldown, setThemeCooldown] = useState(0);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // ---------------------------------------------------------
  // Detect system light / dark mode
  // ---------------------------------------------------------

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemScheme = () => {
      setSystemScheme(mediaQuery.matches ? "dark" : "light");
    };

    updateSystemScheme();

    mediaQuery.addEventListener("change", updateSystemScheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemScheme);
    };
  }, []);

  // ---------------------------------------------------------
  // Load light / dark / system mode
  // ---------------------------------------------------------

  useEffect(() => {
    const loadThemeMode = () => {
      try {
        const stored = localStorage.getItem("smartsakay-theme-mode");

        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemeMode(stored);
        }
      } catch (error) {
        console.warn("Failed to load theme mode:", error);
      }
    };

    loadThemeMode();
  }, []);

  // ---------------------------------------------------------
  // Load account theme
  // ---------------------------------------------------------

  useEffect(() => {
    const loadAccountTheme = async () => {
      try {
        const response = await themeAPI.getTheme();

        const storedTheme = response?.data?.theme;

        if (
          storedTheme === "theme1" ||
          storedTheme === "theme2" ||
          storedTheme === "theme3" ||
          storedTheme === "theme4"
        ) {
          setTheme(storedTheme);
        } else {
          setTheme("theme1");
        }
      } catch (error) {
        setTheme("theme1");
      } finally {
        setIsLoaded(true);
      }
    };

    loadAccountTheme();
  }, []);

  // ---------------------------------------------------------
  // Determine active mode
  // ---------------------------------------------------------

  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  // ---------------------------------------------------------
  // Get selected theme colors
  // ---------------------------------------------------------

  const themeColors = getThemeColors(theme);

  const colors = {
    // Brand colors
    primary: isDark ? themeColors.dark.primary : themeColors.primary,

    primaryLight: isDark
      ? themeColors.dark.primaryLight
      : themeColors.primaryLight,

    primaryDark: isDark
      ? themeColors.dark.primaryDark
      : themeColors.primaryDark,

    secondary: isDark ? themeColors.dark.secondary : themeColors.secondary,

    secondaryLight: isDark
      ? themeColors.dark.secondaryLight
      : themeColors.secondaryLight,

    secondaryDark: isDark
      ? themeColors.dark.secondaryDark
      : themeColors.secondaryDark,

    accent: isDark ? themeColors.dark.accent : themeColors.accent,

    accentLight: isDark
      ? themeColors.dark.accentLight
      : themeColors.accentLight,

    accentDark: isDark ? themeColors.dark.accentDark : themeColors.accentDark,

    // Semantic colors
    error: isDark ? themeColors.dark.error : themeColors.error,

    errorLight: isDark ? themeColors.dark.errorLight : themeColors.errorLight,

    warning: isDark ? themeColors.dark.warning : themeColors.warning,

    warningLight: isDark
      ? themeColors.dark.warningLight
      : themeColors.warningLight,

    success: isDark ? themeColors.dark.success : themeColors.success,

    successLight: isDark
      ? themeColors.dark.successLight
      : themeColors.successLight,

    info: isDark ? themeColors.dark.info : themeColors.info,

    infoLight: isDark ? themeColors.dark.infoLight : themeColors.infoLight,

    white: themeColors.white,

    // Theme-dependent colors
    background: isDark ? themeColors.dark.background : themeColors.background,

    surface: isDark ? themeColors.dark.surface : themeColors.surface,

    surfaceElevated: isDark
      ? themeColors.dark.surfaceElevated
      : themeColors.surfaceElevated,

    border: isDark ? themeColors.dark.border : themeColors.border,

    textPrimary: isDark
      ? themeColors.dark.textPrimary
      : themeColors.textPrimary,

    textSecondary: isDark
      ? themeColors.dark.textSecondary
      : themeColors.textSecondary,

    textMuted: isDark ? themeColors.dark.textMuted : themeColors.textMuted,

    disabled: isDark ? themeColors.dark.disabled : themeColors.disabled,

    // Convenient aliases
    card: isDark ? themeColors.dark.surface : themeColors.surface,

    // Web-specific alias
    danger: isDark ? themeColors.dark.error : themeColors.error,

    dangerLight: isDark ? themeColors.dark.errorLight : themeColors.errorLight,
  };

  // ---------------------------------------------------------
  // Change light / dark / system mode
  // ---------------------------------------------------------

  const toggleTheme = useCallback((mode) => {
    if (!["light", "dark", "system"].includes(mode)) {
      return;
    }

    try {
      setThemeMode(mode);

      localStorage.setItem("smartsakay-theme-mode", mode);
    } catch (error) {
      console.warn("Failed to save theme mode:", error);
    }
  }, []);

  // ---------------------------------------------------------
  // Change account theme
  // ---------------------------------------------------------

  const changeTheme = useCallback(
    async (newTheme) => {
      if (!["theme1", "theme2", "theme3", "theme4"].includes(newTheme)) {
        return;
      }

      if (isThemeChanging) {
        return;
      }

      if (newTheme === theme) {
        return;
      }

      try {
        setIsThemeChanging(true);
        setThemeCooldown(5);

        setTheme(newTheme);

        await themeAPI.updateTheme(newTheme);

        let remaining = 5;

        const interval = setInterval(() => {
          remaining -= 1;

          setThemeCooldown(remaining);

          if (remaining <= 0) {
            clearInterval(interval);
            setIsThemeChanging(false);
          }
        }, 1000);
      } catch (error) {
        console.warn("Failed to update account theme:", error);

        setThemeCooldown(0);
        setIsThemeChanging(false);
      }
    },
    [isThemeChanging, theme],
  );

  // ---------------------------------------------------------
  // Reset theme
  // ---------------------------------------------------------

  const resetTheme = useCallback(() => {
    setTheme("theme1");
    setThemeMode("system");

    try {
      localStorage.setItem("smartsakay-theme-mode", "system");
    } catch (error) {
      console.warn("Failed to reset theme:", error);
    }
  }, []);

  // ---------------------------------------------------------
  // Wait for theme initialization
  // ---------------------------------------------------------

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        theme,
        themeMode,
        toggleTheme,
        changeTheme,
        resetTheme,
        isThemeChanging,
        themeCooldown,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
