export const getThemeColors = (theme = "theme1") => {
  switch (theme) {
    // ==========================================================
    // THEME 1 — ORANGE
    // ==========================================================

    case "theme1":
      return {
        primary: "#F97316",
        primaryLight: "#FFEDD5",
        primaryDark: "#C2550F",

        secondary: "#22C55E",
        secondaryLight: "#DCFCE7",
        secondaryDark: "#15803D",

        accent: "#3B82F6",
        accentLight: "#DBEAFE",
        accentDark: "#1D4ED8",

        error: "#EF4444",
        errorLight: "#FEE2E2",

        warning: "#F59E0B",
        warningLight: "#FEF3C7",

        success: "#22C55E",
        successLight: "#DCFCE7",

        info: "#3B82F6",
        infoLight: "#DBEAFE",

        white: "#FFFFFF",

        background: "#F5F6FA",
        surface: "#FFFFFF",
        surfaceElevated: "#FFFFFF",

        border: "#E5E7EB",

        textPrimary: "#111827",
        textSecondary: "#374151",
        textMuted: "#6B7280",

        disabled: "#D1D5DB",

        // Shared aliases
        card: "#FFFFFF",
        danger: "#EF4444",
        dangerLight: "#FEE2E2",

        dark: {
          primary: "#F97316",
          primaryLight: "#9A4D12",
          primaryDark: "#FF8A3D",

          secondary: "#22C55E",
          secondaryLight: "#14532D",
          secondaryDark: "#4ADE80",

          accent: "#3B82F6",
          accentLight: "#1E3A8A",
          accentDark: "#60A5FA",

          error: "#EF4444",
          errorLight: "#7F1D1D",

          warning: "#F59E0B",
          warningLight: "#78350F",

          success: "#22C55E",
          successLight: "#14532D",

          info: "#3B82F6",
          infoLight: "#1E3A8A",

          white: "#FFFFFF",

          background: "#0F172A",
          surface: "#1E293B",
          surfaceElevated: "#334155",

          border: "#334155",

          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8",
          textMuted: "#64748B",

          disabled: "#475569",

          // Shared aliases
          card: "#1E293B",
          danger: "#EF4444",
          dangerLight: "#7F1D1D",
        },
      };

    // ==========================================================
    // THEME 2 — SENIOR CITIZEN & ACCESSIBILITY (HIGH CONTRAST / ANTI-GLARE)
    // ==========================================================

    case "theme2":
      return {
        // Deep High-Contrast Royal Navy Blue (Clear, authoritative, anti-glare)
        primary: "#1D4ED8",
        primaryLight: "#DBEAFE",
        primaryDark: "#1E3A8A",

        // Warm High-Visibility Transit Amber (easily distinguished by aging eyes)
        secondary: "#D97706",
        secondaryLight: "#FEF3C7",
        secondaryDark: "#B45309",

        accent: "#2563EB",
        accentLight: "#EFF6FF",
        accentDark: "#1E40AF",

        error: "#DC2626",
        errorLight: "#FEE2E2",

        warning: "#D97706",
        warningLight: "#FEF3C7",

        success: "#15803D",
        successLight: "#DCFCE7",

        info: "#0284C7",
        infoLight: "#E0F2FE",

        white: "#FFFFFF",

        // Anti-Glare Soft Foundation (eliminates harsh bright glare for cataracts & photophobia)
        background: "#F1F5F9",
        surface: "#FFFFFF",
        surfaceElevated: "#FFFFFF",

        // High-Definition Structural Borders (keeps cards clearly separated for blurry vision)
        border: "#94A3B8",

        // Ultra-High Contrast Typography (>15:1 contrast ratio, WCAG AAA compliant)
        textPrimary: "#0F172A",
        textSecondary: "#334155",
        textMuted: "#475569",

        disabled: "#94A3B8",

        // Shared aliases
        card: "#FFFFFF",
        danger: "#DC2626",
        dangerLight: "#FEE2E2",

        dark: {
          // Deep Slate Anti-Halation Foundation (prevents text glow & halos)
          primary: "#38BDF8",
          primaryLight: "#0284C7",
          primaryDark: "#7DD3FC",

          secondary: "#FBBF24",
          secondaryLight: "#B45309",
          secondaryDark: "#FDE68A",

          accent: "#60A5FA",
          accentLight: "#1D4ED8",
          accentDark: "#93C5FD",

          error: "#F87171",
          errorLight: "#7F1D1D",

          warning: "#FBBF24",
          warningLight: "#78350F",

          success: "#4ADE80",
          successLight: "#14532D",

          info: "#38BDF8",
          infoLight: "#0C4A6E",

          white: "#FFFFFF",

          background: "#0B132B",
          surface: "#16233B",
          surfaceElevated: "#1E293B",

          border: "#475569",

          textPrimary: "#F8FAFC",
          textSecondary: "#E2E8F0",
          textMuted: "#CBD5E1",

          disabled: "#475569",

          // Shared aliases
          card: "#16233B",
          danger: "#F87171",
          dangerLight: "#7F1D1D",
        },
      };

    // ==========================================================
    // THEME 3 — CHERRY COLA / CREAM VANILLA
    // ==========================================================

    case "theme3":
      return {
        primary: "#9A0002",
        primaryLight: "#F7F2ED",
        primaryDark: "#6F0001",

        secondary: "#EFE6DD",
        secondaryLight: "#F7F2ED",
        secondaryDark: "#D9CCC0",

        accent: "#9A0002",
        accentLight: "#F7F2ED",
        accentDark: "#6F0001",

        error: "#D32F2F",
        errorLight: "#FDE8E8",

        warning: "#F59E0B",
        warningLight: "#FEF3C7",

        success: "#2E7D32",
        successLight: "#E8F5E9",

        info: "#1976D2",
        infoLight: "#E3F2FD",

        white: "#FFFFFF",

        background: "#EFE6DD",
        surface: "#FFFFFF",
        surfaceElevated: "#F7F2ED",

        border: "#D6CCC3",

        textPrimary: "#1F1F1F",
        textSecondary: "#6B7280",
        textMuted: "#9CA3AF",

        disabled: "#D1D5DB",

        // Shared aliases
        card: "#FFFFFF",
        danger: "#D32F2F",
        dangerLight: "#FDE8E8",

        dark: {
          primary: "#9A0002",
          primaryLight: "#F7F2ED",
          primaryDark: "#6F0001",

          secondary: "#EFE6DD",
          secondaryLight: "#D9CCC0",
          secondaryDark: "#F7F2ED",

          accent: "#9A0002",
          accentLight: "#F7F2ED",
          accentDark: "#C93335",

          error: "#D32F2F",
          errorLight: "#7F1D1D",

          warning: "#F59E0B",
          warningLight: "#78350F",

          success: "#2E7D32",
          successLight: "#14532D",

          info: "#1976D2",
          infoLight: "#1E3A8A",

          white: "#FFFFFF",

          background: "#1A1111",
          surface: "#241818",
          surfaceElevated: "#302020",

          border: "#4A3030",

          textPrimary: "#F8F1EC",
          textSecondary: "#CDBDB7",
          textMuted: "#95837D",

          disabled: "#5A4545",

          // Shared aliases
          card: "#241818",
          danger: "#D32F2F",
          dangerLight: "#7F1D1D",
        },
      };

    // ==========================================================
    // THEME 4 — BLUE
    // ==========================================================

    case "theme4":
      return {
        primary: "#3D86CB",
        primaryLight: "#CFE4FB",
        primaryDark: "#28409C",

        secondary: "#82D4E8",
        secondaryLight: "#E4F7FB",
        secondaryDark: "#2F9CB7",

        accent: "#28409C",
        accentLight: "#DDE5FA",
        accentDark: "#2A3045",

        error: "#EF4444",
        errorLight: "#FEE2E2",

        warning: "#F59E0B",
        warningLight: "#FEF3C7",

        success: "#22C55E",
        successLight: "#DCFCE7",

        info: "#3D86CB",
        infoLight: "#CFE4FB",

        white: "#FFFFFF",

        background: "#CFE4FB",
        surface: "#FFFFFF",
        surfaceElevated: "#EAF4FF",

        border: "#AFC9E7",

        textPrimary: "#17213B",
        textSecondary: "#334B70",
        textMuted: "#61799B",

        disabled: "#B7C8DD",

        // Shared aliases
        card: "#FFFFFF",
        danger: "#EF4444",
        dangerLight: "#FEE2E2",

        dark: {
          primary: "#3D86CB",
          primaryLight: "#214B76",
          primaryDark: "#70B1EC",

          secondary: "#82D4E8",
          secondaryLight: "#174B5A",
          secondaryDark: "#A7E6F3",

          accent: "#28409C",
          accentLight: "#1E2E6C",
          accentDark: "#6D82D8",

          error: "#EF4444",
          errorLight: "#7F1D1D",

          warning: "#F59E0B",
          warningLight: "#78350F",

          success: "#22C55E",
          successLight: "#14532D",

          info: "#3D86CB",
          infoLight: "#1E4164",

          white: "#FFFFFF",

          background: "#18233B",
          surface: "#222F49",
          surfaceElevated: "#2A3045",

          border: "#3A4C6C",

          textPrimary: "#F1F7FF",
          textSecondary: "#B5C8E2",
          textMuted: "#7F96B8",

          disabled: "#44536D",

          // Shared aliases
          card: "#222F49",
          danger: "#EF4444",
          dangerLight: "#7F1D1D",
        },
      };

    // ==========================================================
    // DEFAULT — ORANGE
    // ==========================================================

    default:
      return {
        primary: "#F97316",
        primaryLight: "#FFEDD5",
        primaryDark: "#C2550F",

        secondary: "#22C55E",
        secondaryLight: "#DCFCE7",
        secondaryDark: "#15803D",

        accent: "#3B82F6",
        accentLight: "#DBEAFE",
        accentDark: "#1D4ED8",

        error: "#EF4444",
        errorLight: "#FEE2E2",

        warning: "#F59E0B",
        warningLight: "#FEF3C7",

        success: "#22C55E",
        successLight: "#DCFCE7",

        info: "#3B82F6",
        infoLight: "#DBEAFE",

        white: "#FFFFFF",

        background: "#F5F6FA",
        surface: "#FFFFFF",
        surfaceElevated: "#FFFFFF",

        border: "#E5E7EB",

        textPrimary: "#111827",
        textSecondary: "#374151",
        textMuted: "#6B7280",

        disabled: "#D1D5DB",

        // Shared aliases
        card: "#FFFFFF",
        danger: "#EF4444",
        dangerLight: "#FEE2E2",

        dark: {
          primary: "#F97316",
          primaryLight: "#9A4D12",
          primaryDark: "#FF8A3D",

          secondary: "#22C55E",
          secondaryLight: "#14532D",
          secondaryDark: "#4ADE80",

          accent: "#3B82F6",
          accentLight: "#1E3A8A",
          accentDark: "#60A5FA",

          error: "#EF4444",
          errorLight: "#7F1D1D",

          warning: "#F59E0B",
          warningLight: "#78350F",

          success: "#22C55E",
          successLight: "#14532D",

          info: "#3B82F6",
          infoLight: "#1E3A8A",

          white: "#FFFFFF",

          background: "#0F172A",
          surface: "#1E293B",
          surfaceElevated: "#334155",

          border: "#334155",

          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8",
          textMuted: "#64748B",

          disabled: "#475569",

          // Shared aliases
          card: "#1E293B",
          danger: "#EF4444",
          dangerLight: "#7F1D1D",
        },
      };
  }
};
