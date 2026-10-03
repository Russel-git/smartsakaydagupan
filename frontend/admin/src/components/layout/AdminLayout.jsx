import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  MapPin,
  AlertTriangle,
  Bell,
  Users,
  LogOut,
  Bus,
  ShieldCheck,
  Navigation,
  ChevronRight,
  UserCircle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../contexts/theme/ThemeContext";

const AdminLayout = () => {
  const { admin, logout, isSuperAdmin, isOperator, isLgu } = useAuth();
  const { showInfo } = useToast();
  const { colors } = useTheme();
  const navigate = useNavigate();

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();

    showInfo(
      "Signed Out",
      "You have been safely signed out of the Administrator Console.",
    );

    navigate("/login");
  };

  // ============================================================
  // NAVIGATION ITEMS
  // ============================================================

  const getNavSections = () => {
    if (isLgu) {
      return [
        {
          title: "Authority Overview",
          items: [
            {
              to: "/",
              label: "Overview Dashboard",
              icon: LayoutDashboard,
              exact: true,
            },
          ],
        },
        {
          title: "Enforcement & Action",
          items: [
            {
              to: "/complaints",
              label: "LGU Action Desk",
              icon: AlertTriangle,
            },
          ],
        },
        {
          title: "Account",
          items: [
            {
              to: "/profile",
              label: "My Profile",
              icon: UserCircle,
            },
          ],
        },
      ];
    }

    if (isOperator) {
      return [
        {
          title: "Transit Operations",
          items: [
            {
              to: "/",
              label: "Operations Dashboard",
              icon: LayoutDashboard,
              exact: true,
            },
            {
              to: "/fares",
              label: "Fare Matrix Management",
              icon: Calculator,
            },
            {
              to: "/routes",
              label: "Jeepney & Tricycle Routes",
              icon: MapPin,
            },
            {
              to: "/terminals",
              label: "Terminal Hubs",
              icon: Navigation,
            },
          ],
        },
        {
          title: "Citizen Grievances",
          items: [
            {
              to: "/complaints",
              label: "Complaints Triage",
              icon: AlertTriangle,
            },
            {
              to: "/notifications",
              label: "City Broadcaster",
              icon: Bell,
            },
          ],
        },
        {
          title: "Account",
          items: [
            {
              to: "/profile",
              label: "My Profile",
              icon: UserCircle,
            },
          ],
        },
      ];
    }

    // ============================================================
    // DEFAULT: SUPERADMIN
    // ============================================================

    return [
      {
        title: "System & Transit Core",
        items: [
          {
            to: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
            exact: true,
          },
          {
            to: "/fares",
            label: "Fare Management",
            icon: Calculator,
          },
          {
            to: "/routes",
            label: "Route Directory",
            icon: MapPin,
          },
          {
            to: "/terminals",
            label: "Terminal Hubs",
            icon: Navigation,
          },
        ],
      },
      {
        title: "Complaints & Advisories",
        items: [
          {
            to: "/complaints",
            label: "Complaints Hub",
            icon: AlertTriangle,
          },
          {
            to: "/notifications",
            label: "Broadcaster",
            icon: Bell,
          },
        ],
      },
      {
        title: "Developer Control",
        items: [
          {
            to: "/users",
            label: "Account Management",
            icon: Users,
          },
          {
            to: "/audit-logs",
            label: "Security Audit Logs",
            icon: ShieldCheck,
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            to: "/profile",
            label: "My Profile",
            icon: UserCircle,
          },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  // ============================================================
  // ROLE THEME
  // ============================================================

  const getRoleBadge = () => {
    if (isSuperAdmin) {
      return {
        text: "Superadmin (Developer)",
        color: colors.primary,
        backgroundColor: colors.surfaceElevated,
      };
    }

    if (isLgu) {
      return {
        text: "LGU Authority (POSO)",
        color: colors.success,
        backgroundColor: colors.successLight,
      };
    }

    return {
      text: "Transit Operator (Admin)",
      color: colors.info,
      backgroundColor: colors.infoLight,
    };
  };

  const roleInfo = getRoleBadge();

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
      }}
    >
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className="sidebar"
        style={{
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        {/* SIDEBAR HEADER */}

        <div
          className="sidebar-header"
          style={{
            borderBottomColor: colors.border,
          }}
        >
          <div
            className="brand-icon"
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              boxShadow: `0px 4px 14px ${colors.primaryDark}`,
            }}
          >
            <Bus size={22} />
          </div>

          <div>
            <div
              className="brand-title"
              style={{
                color: colors.textPrimary,
              }}
            >
              SmartSakay
            </div>

            <div
              className="brand-subtitle"
              style={{
                color: colors.textMuted,
              }}
            >
              Dagupan City
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          className="sidebar-nav"
          style={{
            color: colors.textPrimary,
          }}
        >
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div
                className="sidebar-section-label"
                style={{
                  color: colors.textMuted,
                }}
              >
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? colors.primary : colors.textSecondary,

                      backgroundColor: isActive
                        ? colors.surfaceElevated
                        : "transparent",

                      borderColor: isActive ? colors.primary : "transparent",
                    })}
                  >
                    <Icon size={18} />

                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SIDEBAR FOOTER */}

        <div
          className="sidebar-footer"
          style={{
            borderTopColor: colors.border,
          }}
        >
          {/* USER PROFILE */}

          <div
            className="user-info"
            onClick={() => navigate("/profile")}
            title="Open Profile"
            style={{
              cursor: "pointer",
            }}
          >
            {/* USER AVATAR */}

            <div
              className="user-avatar"
              style={{
                backgroundColor: roleInfo.backgroundColor,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.color}`,
              }}
            >
              {admin?.firstName ? admin.firstName[0].toUpperCase() : "U"}
            </div>

            {/* USER DETAILS */}

            <div className="user-meta">
              <div
                className="name"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {admin?.firstName || "System"} {admin?.lastName || ""}
              </div>

              <div
                className="role"
                style={{
                  color: roleInfo.color,
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                {roleInfo.text}
              </div>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="btn btn-ghost btn-icon"
            style={{
              color: colors.textMuted,
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT AREA
      ====================================================== */}

      <div
        className="main-wrapper"
        style={{
          backgroundColor: colors.background,
        }}
      >
        {/* TOPBAR */}

        <header
          className="topbar"
          style={{
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
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
                fontSize: "13px",
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
              {isLgu
                ? "LGU Transit Action Console"
                : isOperator
                  ? "Transit Operations Console"
                  : "Master Developer Console"}
            </span>
          </div>

          {/* STATUS */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* ROLE BADGE */}

            <span
              className="badge"
              style={{
                backgroundColor: roleInfo.backgroundColor,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.color}`,
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "8px",
                }}
              >
                ●
              </span>

              {roleInfo.text}
            </span>

            {/* SYSTEM ONLINE */}

            <span
              className="badge"
              style={{
                backgroundColor: colors.successLight,
                color: colors.success,
                border: `1px solid ${colors.success}`,
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "7px",
                }}
              >
                ●
              </span>
              System Online
            </span>
          </div>
        </header>

        {/* CONTENT */}

        <main
          className="content-body"
          style={{
            backgroundColor: colors.white,
            color: colors.textPrimary,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
