import React from "react";
import { Menu, X, ChevronRight, Sun, Moon } from "lucide-react";

import { useSidebar } from "../../../contexts/SidebarContext";
import { useTheme } from "../../../contexts/theme/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";

const Header = () => {
  const { isMobile, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

  const { colors, isDark, toggleTheme } = useTheme();

  const { isAdmin, isLgu, isPoso } = useAuth();

  // ============================================================
  // SIDEBAR TOGGLE
  // ============================================================

  const handleToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  // ============================================================
  // CONSOLE TITLE
  // ============================================================

  const getConsoleTitle = () => {
    if (isPoso) {
      return "POSO Road Enforcer Console";
    }

    if (isLgu) {
      return "LGU Transport Authority Console";
    }

    return "System Administration Console";
  };

  return (
    <header
      style={{
        height: "80px",

        position: "sticky",
        top: 0,

        zIndex: 900,

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        padding: "0 24px",

        backgroundColor: colors.surface,

        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* LEFT */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* MENU BUTTON */}

        <button
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
          style={{
            width: 38,
            height: 38,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "8px",

            border: `1px solid ${colors.border}`,

            backgroundColor: colors.background,

            color: colors.textSecondary,

            cursor: "pointer",
          }}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* BREADCRUMB */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: colors.textMuted,
            }}
          >
            Dagupan City
          </span>

          <ChevronRight size={14} color={colors.textMuted} />

          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            {getConsoleTitle()}
          </span>
        </div>
      </div>

      {/* RIGHT */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* QUICK THEME TOGGLE */}
        <button
          onClick={() => toggleTheme(isDark ? "light" : "dark")}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            cursor: "pointer",
          }}
        >
          {isDark ? (
            <Sun size={17} color="#FBBF24" />
          ) : (
            <Moon size={17} color={colors.textSecondary} />
          )}
        </button>

        {/* ROLE */}

        <RoleBadge />

        {/* SYSTEM STATUS */}

        <SystemStatus colors={colors} />
      </div>
    </header>
  );
};

// ============================================================
// ROLE BADGE
// ============================================================

const RoleBadge = () => {
  const { colors } = useTheme();

  const { isSuperAdmin, isOperator, isLgu } = useAuth();

  let text = "Administrator";
  let color = colors.info;
  let backgroundColor = colors.infoLight;

  if (isSuperAdmin) {
    text = "Superadmin (Developer)";
    color = colors.primary;
    backgroundColor = colors.surfaceElevated;
  } else if (isLgu) {
    text = "LGU Authority (POSO)";
    color = colors.success;
    backgroundColor = colors.successLight;
  } else if (isOperator) {
    text = "Transit Operator (Admin)";
    color = colors.info;
    backgroundColor = colors.infoLight;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",

        padding: "5px 10px",

        borderRadius: "6px",

        backgroundColor,
        color,

        border: `1px solid ${color}`,

        fontSize: "11px",
        fontWeight: "600",
      }}
    >
      <span style={{ fontSize: "7px" }}>●</span>

      {text}
    </span>
  );
};

// ============================================================
// SYSTEM STATUS
// ============================================================

const SystemStatus = ({ colors }) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",

        padding: "5px 10px",

        borderRadius: "6px",

        backgroundColor: colors.successLight,

        color: colors.success,

        border: `1px solid ${colors.success}`,

        fontSize: "11px",
        fontWeight: "600",
      }}
    >
      <span style={{ fontSize: "7px" }}>●</span>
      System Online
    </span>
  );
};

export default Header;
