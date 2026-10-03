import React, { useState } from "react";
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Moon,
  Sun,
  Monitor,
  LogOut,
  UserCircle,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useToast } from "../contexts/ToastContext";

const Profile = () => {
  const { admin, logout } = useAuth();
  const {
    colors,
    theme,
    themeMode,
    changeTheme,
    toggleTheme,
    isThemeChanging,
    themeCooldown,
  } = useTheme();
  const { showSuccess, showInfo } = useToast();

  const [saving, setSaving] = useState(false);

  // ============================================================
  // ROLE
  // ============================================================

  const getRoleName = () => {
    if (admin?.role === "superadmin") {
      return "Superadmin";
    }

    if (admin?.role === "admin") {
      return "Administrator";
    }

    if (admin?.role === "operator") {
      return "Transit Operator";
    }

    if (admin?.role === "lgu") {
      return "LGU Authority";
    }

    return admin?.role || "Administrator";
  };

  // ============================================================
  // INITIALS
  // ============================================================

  const getInitials = () => {
    const first = admin?.firstName?.charAt(0) || "";
    const last = admin?.lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "U";
  };

  // ============================================================
  // THEME NAME
  // ============================================================

  const getThemeName = () => {
    switch (theme) {
      case "theme1":
        return "Theme 1";

      case "theme2":
        return "Theme 2";

      case "theme3":
        return "Theme 3";

      case "theme4":
        return "Theme 4";

      default:
        return "Theme 1";
    }
  };

  // ============================================================
  // CHANGE COLOR THEME
  // ============================================================

  const handleThemeChange = async (newTheme) => {
    try {
      setSaving(true);

      await changeTheme(newTheme);

      showSuccess("Theme Updated", "Your SmartSakay theme has been updated.");
    } catch (error) {
      console.error("Theme update failed:", error);

      showInfo(
        "Theme Changed Locally",
        "The theme was changed on this device.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE DISPLAY MODE
  // ============================================================

  const handleModeChange = async (mode) => {
    try {
      if (mode === "dark" && themeMode !== "dark") {
        await toggleTheme(mode);
      }

      if (mode === "light" && themeMode !== "light") {
        await toggleTheme(mode);
      }
    } catch (error) {
      console.error("Theme mode update failed:", error);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // ============================================================
  // THEME OPTIONS
  // ============================================================

  const themeOptions = [
    {
      id: "theme1",
      name: "Theme 1",
      color: "#F97316",
    },
    {
      id: "theme2",
      name: "Theme 2",
      color: "#ECA611",
    },
    {
      id: "theme3",
      name: "Theme 3",
      color: "#9A0002",
    },
    {
      id: "theme4",
      name: "Theme 4",
      color: "#3D86CB",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#FFFFFF",
        color: colors.textPrimary,
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "700",
            color: colors.textPrimary,
          }}
        >
          Profile
        </h1>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "14px",
            color: colors.textMuted,
          }}
        >
          Manage your SmartSakay administrator profile and preferences.
        </p>
      </div>

      {/* ========================================================
          PROFILE HEADER
      ======================================================== */}

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          {/* AVATAR */}

          <div
            style={{
              width: "76px",
              height: "76px",
              minWidth: "76px",
              borderRadius: "50%",
              backgroundColor: colors.primary,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "25px",
              fontWeight: "700",
            }}
          >
            {getInitials()}
          </div>

          {/* USER INFO */}

          <div
            style={{
              flex: 1,
              minWidth: "200px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "21px",
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              {admin?.firstName || "System"} {admin?.lastName || ""}
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "7px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: colors.textMuted,
                }}
              >
                {admin?.email || "No email available"}
              </span>

              <span
                style={{
                  color: colors.border,
                }}
              >
                •
              </span>

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                {getRoleName()}
              </span>
            </div>
          </div>

          {/* STATUS */}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 11px",
              borderRadius: "7px",
              backgroundColor: "#FFFFFF",
              color: colors.success,
              border: `1px solid ${colors.success}`,
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <CheckCircle2 size={14} />
            Active
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN GRID
      ======================================================== */}

      <div
        className="profile-main-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "20px",
        }}
      >
        {/* ======================================================
            ACCOUNT INFORMATION
        ====================================================== */}

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <UserCircle size={20} color={colors.primary} />

            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              Account Information
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            <InfoField
              label="First Name"
              value={admin?.firstName || "—"}
              icon={<User size={16} />}
              colors={colors}
            />

            <InfoField
              label="Last Name"
              value={admin?.lastName || "—"}
              icon={<User size={16} />}
              colors={colors}
            />

            <InfoField
              label="Email Address"
              value={admin?.email || "—"}
              icon={<Mail size={16} />}
              colors={colors}
            />

            <InfoField
              label="Account Role"
              value={getRoleName()}
              icon={<Shield size={16} />}
              colors={colors}
            />
          </div>
        </div>

        {/* ======================================================
            APPEARANCE
        ====================================================== */}

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Monitor size={20} color={colors.primary} />

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Appearance
              </h3>

              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: "12px",
                  color: colors.textMuted,
                }}
              >
                Customize your dashboard appearance.
              </p>
            </div>
          </div>

          {/* ====================================================
              COLOR THEME
          ==================================================== */}

          <div
            style={{
              marginBottom: "22px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              Color Theme
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "9px",
              }}
            >
              {themeOptions.map((item) => {
                const active = theme === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleThemeChange(item.id)}
                    disabled={saving || isThemeChanging}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "10px",
                      borderRadius: "8px",

                      border: `1px solid ${
                        active ? colors.primary : colors.border
                      }`,

                      backgroundColor:
                        saving || isThemeChanging ? "#F3F3F3" : "#FFFFFF",

                      color: colors.textPrimary,

                      cursor:
                        saving || isThemeChanging ? "not-allowed" : "pointer",

                      textAlign: "left",

                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        borderRadius: "50%",
                        backgroundColor: item.color,

                        border: active
                          ? `2px solid ${colors.textPrimary}`
                          : "2px solid transparent",
                      }}
                    />

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: active ? "700" : "500",
                      }}
                    >
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ====================================================
              DISPLAY MODE
          ==================================================== */}

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              Display Mode
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "9px",
              }}
            >
              <ModeButton
                active={themeMode === "light"}
                icon={<Sun size={16} />}
                label="Light"
                onClick={() => handleModeChange("light")}
                colors={colors}
              />

              <ModeButton
                active={themeMode === "dark"}
                icon={<Moon size={16} />}
                label="Dark"
                onClick={() => handleModeChange("dark")}
                colors={colors}
              />
            </div>

            {/* CURRENT THEME */}

            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "7px",

                backgroundColor: "#FFFFFF",

                border: `1px solid ${colors.border}`,

                color: colors.textMuted,

                fontSize: "11px",
                lineHeight: "1.5",
              }}
            >
              Current theme:{" "}
              <strong
                style={{
                  color: colors.textPrimary,
                }}
              >
                {getThemeName()}
              </strong>
              {" • "}
              <strong
                style={{
                  color: colors.textPrimary,
                }}
              >
                {themeMode === "dark" ? "Dark" : "Light"} mode
              </strong>
            </div>
            {isThemeChanging && themeCooldown > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "11px",
                  color: colors.textMuted,
                  textAlign: "center",
                }}
              >
                You can change the theme again in{" "}
                <strong style={{ color: colors.primary }}>
                  {themeCooldown}s
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          ACCOUNT SESSION
      ======================================================== */}

      <div
        style={{
          marginTop: "20px",

          backgroundColor: "#FFFFFF",

          border: `1px solid ${colors.border}`,

          borderRadius: "12px",

          padding: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <Shield size={19} color={colors.primary} />

              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Account Session
              </h3>
            </div>

            <p
              style={{
                margin: "6px 0 0 28px",
                fontSize: "12px",
                color: colors.textMuted,
              }}
            >
              Sign out of the current SmartSakay administrator session.
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",

              padding: "9px 15px",

              borderRadius: "7px",

              border: `1px solid ${colors.error}`,

              backgroundColor: "#FFFFFF",

              color: colors.error,

              fontSize: "13px",
              fontWeight: "600",

              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      {/* ========================================================
          RESPONSIVE
      ======================================================== */}

      <style>
        {`
          @media (max-width: 850px) {
            .profile-main-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

// ============================================================
// INFO FIELD
// ============================================================

const InfoField = ({ label, value, icon, colors }) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",

          marginBottom: "6px",

          color: colors.textMuted,

          fontSize: "11px",
          fontWeight: "600",

          textTransform: "uppercase",

          letterSpacing: "0.4px",
        }}
      >
        {icon}

        {label}
      </div>

      <div
        style={{
          padding: "10px 12px",

          borderRadius: "7px",

          backgroundColor: "#FFFFFF",

          border: `1px solid ${colors.border}`,

          color: colors.textPrimary,

          fontSize: "13px",

          fontWeight: "500",
        }}
      >
        {value}
      </div>
    </div>
  );
};

// ============================================================
// MODE BUTTON
// ============================================================

const ModeButton = ({ active, icon, label, onClick, colors }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",

        padding: "10px",

        borderRadius: "8px",

        border: `1px solid ${active ? colors.primary : colors.border}`,

        backgroundColor: "#FFFFFF",

        color: active ? colors.primary : colors.textSecondary,

        cursor: "pointer",

        fontSize: "12px",

        fontWeight: active ? "700" : "500",
      }}
    >
      {icon}

      {label}
    </button>
  );
};

export default Profile;
