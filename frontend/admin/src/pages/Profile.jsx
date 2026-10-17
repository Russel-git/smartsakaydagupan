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
  Camera,
  Upload,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { usersAPI } from "../api/services";
import ConfirmModal from "../components/common/ConfirmModal";

const Profile = () => {
  const { admin, logout, updateUser } = useAuth();
  const {
    colors,
    isDark,
    theme,
    themeMode,
    changeTheme,
    toggleTheme,
    isThemeChanging,
    themeCooldown,
  } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ============================================================
  // ROLE
  // ============================================================

  const getRoleName = () => {
    if (admin?.role === "admin") {
      return "System Administrator";
    }

    if (admin?.role === "lgu") {
      return "LGU Transport Authority";
    }

    if (admin?.role === "poso") {
      return "POSO Field Enforcer";
    }

    return admin?.role || "Staff User";
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
  // PROFILE PHOTO UPLOAD
  // ============================================================

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", file);

      const res = await usersAPI.uploadProfilePhoto(formData);
      const updatedUser = res.data?.data?.user;
      const photoUrl = res.data?.data?.profilePhoto || res.data?.data?.url;

      if (updatedUser) {
        updateUser(updatedUser);
      } else if (photoUrl) {
        updateUser({ ...admin, profilePhoto: photoUrl });
      }

      showSuccess(
        "Profile Photo Updated",
        "Your official account photo has been saved.",
      );
    } catch (err) {
      console.error("Profile photo upload failed:", err);
      showError(
        "Upload Failed",
        err.response?.data?.message || "Failed to update profile photo.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    window.location.href = "/";
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
        backgroundColor: colors.background,
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
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.25)"
            : "0 2px 8px rgba(0, 0, 0, 0.04)",
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
          {/* AVATAR WITH PHOTO UPLOAD */}

          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                minWidth: "80px",
                borderRadius: "50%",
                backgroundColor: colors.primary,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: "700",
                overflow: "hidden",
                border: `3px solid ${colors.surface}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              {admin?.profilePhoto ? (
                <img
                  src={admin.profilePhoto}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                getInitials()
              )}
            </div>

            <label
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                backgroundColor: colors.primary,
                color: "#FFFFFF",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: uploadingPhoto ? "not-allowed" : "pointer",
                boxShadow: isDark
                  ? "0 2px 6px rgba(0,0,0,0.6)"
                  : "0 2px 6px rgba(0,0,0,0.3)",
                border: `2px solid ${colors.surface}`,
                transition: "transform 0.15s ease",
              }}
              title="Upload new profile picture"
            >
              <Camera size={14} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                disabled={uploadingPhoto}
                onChange={handlePhotoUpload}
              />
            </label>
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
              backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#FFFFFF",
              color: isDark ? "#4ADE80" : colors.success,
              border: `1px solid ${isDark ? "rgba(34, 197, 94, 0.35)" : colors.success}`,
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
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "22px",
            boxShadow: isDark
              ? "0 4px 20px rgba(0, 0, 0, 0.25)"
              : "0 2px 8px rgba(0, 0, 0, 0.04)",
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
              isDark={isDark}
            />

            <InfoField
              label="Last Name"
              value={admin?.lastName || "—"}
              icon={<User size={16} />}
              colors={colors}
              isDark={isDark}
            />

            <InfoField
              label="Email Address"
              value={admin?.email || "—"}
              icon={<Mail size={16} />}
              colors={colors}
              isDark={isDark}
            />

            <InfoField
              label="Account Role"
              value={getRoleName()}
              icon={<Shield size={16} />}
              colors={colors}
              isDark={isDark}
            />
          </div>
        </div>

        {/* ======================================================
            APPEARANCE
        ====================================================== */}

        <div
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "22px",
            boxShadow: isDark
              ? "0 4px 20px rgba(0, 0, 0, 0.25)"
              : "0 2px 8px rgba(0, 0, 0, 0.04)",
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

                      border: `1.5px solid ${
                        active ? colors.primary : colors.border
                      }`,

                      backgroundColor:
                        saving || isThemeChanging
                          ? isDark
                            ? "rgba(15, 23, 42, 0.5)"
                            : "#F3F3F3"
                          : active
                          ? isDark
                            ? "rgba(249, 115, 22, 0.15)"
                            : "rgba(249, 115, 22, 0.06)"
                          : isDark
                          ? "rgba(15, 23, 42, 0.7)"
                          : "#FFFFFF",

                      color: colors.textPrimary,

                      cursor:
                        saving || isThemeChanging ? "not-allowed" : "pointer",

                      textAlign: "left",

                      opacity: saving ? 0.7 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        boxShadow: active
                          ? `0 0 0 2px ${isDark ? colors.surface : "#FFFFFF"}, 0 0 0 4px ${item.color}`
                          : "none",
                      }}
                    />

                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: active ? "700" : "500",
                        color: active && !isDark ? colors.primary : colors.textPrimary,
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
                isDark={isDark}
              />

              <ModeButton
                active={themeMode === "dark"}
                icon={<Moon size={16} />}
                label="Dark"
                onClick={() => handleModeChange("dark")}
                colors={colors}
                isDark={isDark}
              />
            </div>

            {/* CURRENT THEME */}

            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "7px",

                backgroundColor: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "#F9FAFB",

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

          backgroundColor: colors.surface,

          border: `1px solid ${colors.border}`,

          borderRadius: "12px",

          padding: "22px",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.25)"
            : "0 2px 8px rgba(0, 0, 0, 0.04)",
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
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",

              padding: "9px 15px",

              borderRadius: "7px",

              border: `1px solid ${colors.error}`,

              backgroundColor: isDark
                ? "rgba(239, 68, 68, 0.12)"
                : "#FFFFFF",

              color: isDark ? "#F87171" : colors.error,

              fontSize: "13px",
              fontWeight: "600",

              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out of SmartSakay"
        message="Are you sure you want to end your current console session? You will be returned to the login screen."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />

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

const InfoField = ({ label, value, icon, colors, isDark }) => {
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

          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "#F8FAFC",

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

const ModeButton = ({ active, icon, label, onClick, colors, isDark }) => {
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

        border: `1.5px solid ${active ? colors.primary : colors.border}`,

        backgroundColor: active
          ? isDark
            ? "rgba(249, 115, 22, 0.18)"
            : "rgba(249, 115, 22, 0.08)"
          : isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "#FFFFFF",

        color: active
          ? colors.primary
          : isDark
          ? colors.textPrimary
          : colors.textSecondary,

        cursor: "pointer",

        fontSize: "12px",

        fontWeight: active ? "700" : "500",
        transition: "all 0.15s ease",
      }}
    >
      {icon}

      {label}
    </button>
  );
};

export default Profile;
