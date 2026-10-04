import React, { useCallback } from "react";
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
  UserCircle,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useTheme } from "../../../contexts/theme/ThemeContext";
import { useSidebar } from "../../../contexts/SidebarContext";

const Sidebar = () => {
  const { admin, logout, isSuperAdmin, isOperator, isLgu } = useAuth();

  const { showInfo } = useToast();
  const { colors } = useTheme();

  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    isMobile,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();

  const navigate = useNavigate();

  // ============================================================
  // SIDEBAR VISIBILITY
  // ============================================================

  const sidebarExpanded = isExpanded || isHovered || isMobileOpen;

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
  // NAVIGATION
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
  // ROLE BADGE
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
  // NAVIGATION CLICK
  // ============================================================

  const handleNavigation = () => {
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside
      onMouseEnter={() => {
        if (!isExpanded && !isMobile) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false);
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",

        width: isMobile ? "290px" : sidebarExpanded ? "290px" : "90px",

        transform:
          isMobile && !isMobileOpen ? "translateX(-100%)" : "translateX(0)",

        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`,

        zIndex: 1000,

        display: "flex",
        flexDirection: "column",

        transition: "width 300ms ease, transform 300ms ease",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          minHeight: "80px",

          display: "flex",
          alignItems: "center",

          justifyContent: sidebarExpanded ? "flex-start" : "center",

          gap: "12px",

          padding: sidebarExpanded ? "0 20px" : "0 10px",

          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* BRAND ICON */}

        <div
          style={{
            width: 40,
            height: 40,

            flexShrink: 0,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            borderRadius: "10px",

            backgroundColor: colors.primary,
            color: colors.white,

            boxShadow: `0 4px 14px ${colors.primaryDark}`,
          }}
        >
          <Bus size={22} />
        </div>

        {/* BRAND TEXT */}

        {sidebarExpanded && (
          <div>
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              SmartSakay
            </div>

            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
              }}
            >
              Dagupan City
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav
        style={{
          flex: 1,
          overflowY: "auto",

          padding: "20px 12px",
        }}
      >
        {navSections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            style={{
              marginBottom: "24px",
            }}
          >
            {/* SECTION TITLE */}

            <div
              style={{
                color: colors.textMuted,

                fontSize: "10px",
                fontWeight: "700",

                textTransform: "uppercase",

                letterSpacing: "0.08em",

                padding: sidebarExpanded ? "0 10px 8px" : "0 0 8px",

                textAlign: sidebarExpanded ? "left" : "center",
              }}
            >
              {sidebarExpanded ? section.title : <MoreHorizontal size={18} />}
            </div>

            {/* ITEMS */}

            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={handleNavigation}
                  title={!sidebarExpanded ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",

                    justifyContent: sidebarExpanded ? "flex-start" : "center",

                    gap: "12px",

                    width: "100%",

                    minHeight: "44px",

                    padding: sidebarExpanded ? "0 12px" : "0",

                    marginBottom: "4px",

                    borderRadius: "8px",

                    textDecoration: "none",

                    color: isActive ? colors.primary : colors.textSecondary,

                    backgroundColor: isActive
                      ? colors.surfaceElevated
                      : "transparent",

                    borderLeft: isActive
                      ? `3px solid ${colors.primary}`
                      : "3px solid transparent",

                    transition: "all 180ms ease",
                  })}
                >
                  <Icon size={18} strokeWidth={2} />

                  {sidebarExpanded && (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,

          padding: sidebarExpanded ? "14px" : "12px 8px",
        }}
      >
        <div
          onClick={() => {
            navigate("/profile");

            if (isMobile) {
              closeMobileSidebar();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",

            justifyContent: sidebarExpanded ? "flex-start" : "center",

            gap: "10px",

            cursor: "pointer",
          }}
        >
          {/* AVATAR */}

          <div
            style={{
              width: 36,
              height: 36,

              flexShrink: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: "50%",

              backgroundColor: roleInfo.backgroundColor,

              color: roleInfo.color,

              border: `1px solid ${roleInfo.color}`,

              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            {admin?.firstName ? admin.firstName[0].toUpperCase() : "U"}
          </div>

          {/* USER */}

          {sidebarExpanded && (
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  color: colors.textPrimary,

                  fontSize: "12px",
                  fontWeight: "600",

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {admin?.firstName || "System"} {admin?.lastName || ""}
              </div>

              <div
                style={{
                  color: roleInfo.color,

                  fontSize: "10px",
                  fontWeight: "600",

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {roleInfo.text}
              </div>
            </div>
          )}

          {/* LOGOUT */}

          {sidebarExpanded && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleLogout();
              }}
              title="Sign Out"
              style={{
                border: "none",
                background: "transparent",

                color: colors.textMuted,

                cursor: "pointer",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                padding: "6px",
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
