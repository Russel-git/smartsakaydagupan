import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bus,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Users,
  Navigation,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const LoginPage = () => {
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("suspended=true")) {
      setError("Your account has been suspended by LGU Transport Authority. You have been automatically logged out.");
    }
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      showSuccess(
        "Successfully Logged In",
        `Welcome back, ${
          user?.firstName || "Administrator"
        }! SmartSakay command console active.`,
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to authenticate";

      setError(msg);
      showError("Authentication Failed", msg);
    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // BRANDING FEATURES
  // ============================================================

  const features = [
    {
      icon: MapPin,
      label: "Live Route Management",
      desc: "Monitor all jeepney routes in real-time",
    },
    {
      icon: Users,
      label: "Commuter Services",
      desc: "Manage registered commuter accounts",
    },
    {
      icon: Navigation,
      label: "Terminal Oversight",
      desc: "Control all terminal hubs citywide",
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="login-screen"
      style={{
        backgroundColor: colors.background,
      }}
    >
      {/* ======================================================
          LEFT BRANDING PANEL
      ====================================================== */}

      <div
        className="login-left-panel"
        style={{
          backgroundColor: colors.primary,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            color: colors.white,
          }}
        >
          {/* BRAND ICON */}

          <div
            style={{
              width: "72px",
              height: "72px",
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <Bus size={36} color={colors.white} />
          </div>

          {/* BRAND NAME */}

          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              marginBottom: "12px",
              color: colors.white,
            }}
          >
            SmartSakay
          </h2>

          <p
            style={{
              fontSize: "16px",
              opacity: 0.85,
              marginBottom: "40px",
              lineHeight: 1.6,
              color: colors.white,
            }}
          >
            Dagupan City Public Transport
            <br />
            Management System
          </p>

          {/* FEATURE HIGHLIGHTS */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              textAlign: "left",
            }}
          >
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  backgroundColor: "rgba(255,255,255,0.10)",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {/* FEATURE ICON */}

                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    backgroundColor: "rgba(255,255,255,0.20)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={colors.white} />
                </div>

                {/* FEATURE TEXT */}

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "13px",
                      marginBottom: "2px",
                      color: colors.white,
                    }}
                  >
                    {label}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      color: colors.white,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          RIGHT LOGIN PANEL
      ====================================================== */}

      <div className="login-right-panel">
        <div
          className="login-card"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        >
          {/* ==================================================
              BACK TO LANDING PAGE
          ================================================== */}

          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "13px",
              fontWeight: "600",
              color: colors.textSecondary,
              textDecoration: "none",
              marginBottom: "20px",
              padding: "7px 14px",
              borderRadius: "8px",
              backgroundColor: colors.surfaceElevated || "rgba(0, 0, 0, 0.04)",
              border: `1px solid ${colors.border}`,
              transition: "all 0.15s ease",
              width: "fit-content",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.primary;
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.textSecondary;
              e.currentTarget.style.borderColor = colors.border;
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to SmartSakay Website</span>
          </Link>

          {/* ==================================================
              LOGO
          ================================================== */}

          <div
            style={{
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                backgroundColor: colors.primary,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                boxShadow: `0 6px 18px ${colors.primary}40`,
              }}
            >
              <Bus size={24} color={colors.white} />
            </div>

            <h1
              style={{
                fontSize: "24px",
                color: colors.textPrimary,
                marginBottom: "6px",
              }}
            >
              Admin Sign In
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: colors.textMuted,
              }}
            >
              Access the Dagupan City transport console
            </p>
          </div>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && (
            <div
              className="alert"
              style={{
                backgroundColor: colors.errorLight,
                border: `1px solid ${colors.error}`,
                color: colors.error,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle
                size={16}
                color={colors.error}
                style={{
                  flexShrink: 0,
                }}
              />

              <span>{error}</span>
            </div>
          )}

          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Email Address
              </label>

              <div className="form-input-wrapper">
                <Mail
                  size={15}
                  className="form-input-icon"
                  style={{
                    color: colors.textMuted,
                  }}
                />

                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="admin@smartsakay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Password
              </label>

              <div className="form-input-wrapper">
                <Lock
                  size={15}
                  className="form-input-icon"
                  style={{
                    color: colors.textMuted,
                  }}
                />

                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                />
              </div>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg"
              style={{
                width: "100%",
                marginTop: "8px",
                backgroundColor: colors.primary,
                color: colors.white,
                border: `1px solid ${colors.primary}`,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>


          {/* ==================================================
              RETURN LINK & FOOTER
          ================================================== */}

          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "13px",
              color: colors.textMuted,
            }}
          >
            Not an administrator?{" "}
            <Link
              to="/"
              style={{
                color: colors.primary,
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Return to landing page
            </Link>
          </div>

          <p
            style={{
              marginTop: "16px",
              fontSize: "12px",
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            SmartSakay Admin Console · Dagupan City, Philippines
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
