import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldAlert,
  Building2,
  UserCheck,
  UserX,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import api from "../../api/client";
import { useTheme } from "../../contexts/theme/ThemeContext";

const AdminDashboardView = () => {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState({
    activeAccounts: 0,
    suspendedAccounts: 0,
    lguAccounts: 0,
    posoAccounts: 0,
    commuterAccounts: 0,
    adminAccounts: 0,
  });
  const [recentStaff, setRecentStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [metricsRes, usersRes] = await Promise.all([
          api.get("/admin/metrics"),
          api.get("/users?role=lgu&limit=5"),
        ]);
        if (metricsRes.data?.data) {
          setMetrics(metricsRes.data.data);
        }
        if (usersRes.data?.data?.items) {
          setRecentStaff(usersRes.data.data.items);
        } else if (Array.isArray(usersRes.data?.data)) {
          setRecentStaff(usersRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ height: "40px", width: "260px", backgroundColor: colors.surfaceElevated, borderRadius: "8px", marginBottom: "24px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "140px", backgroundColor: colors.surfaceElevated, borderRadius: "14px" }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Accounts",
      value: metrics.activeAccounts,
      subtitle: "Verified & operating safely",
      icon: UserCheck,
      color: "#10B981",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    },
    {
      title: "Suspended Accounts",
      value: metrics.suspendedAccounts,
      subtitle: "Deactivated or locked access",
      icon: UserX,
      color: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FECACA",
    },
    {
      title: "LGU Accounts",
      value: metrics.lguAccounts,
      subtitle: "City Hall transport authorities",
      icon: Building2,
      color: "#4F46E5",
      bgColor: "#EEF2FF",
      borderColor: "#C7D2FE",
    },
  ];

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            System & Accounts Governance
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: colors.textMuted,
              margin: "4px 0 0 0",
            }}
          >
            Root administrative control for SmartSakay Dagupan City. Manage LGU authorities and account statuses.
          </p>
        </div>

        <Link
          to="/users"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            backgroundColor: colors.primary,
            color: "#FFFFFF",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "13px",
            boxShadow: `0 4px 12px ${colors.primaryDark}40`,
          }}
        >
          <PlusCircle size={16} />
          Provision LGU Account
        </Link>
      </div>

      {/* 3 Core Metric Cards as Requested */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: colors.surface,
                borderRadius: "16px",
                padding: "24px",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: colors.textPrimary, marginTop: "6px" }}>
                    {card.value}
                  </div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: card.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                    border: `1px solid ${card.borderColor}`,
                  }}
                >
                  <Icon size={24} />
                </div>
              </div>

              <div style={{ fontSize: "12px", color: colors.textMuted, display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} style={{ color: card.color }} />
                <span>{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Distribution & Quick Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Role Distribution Panel */}
        <div
          style={{
            backgroundColor: colors.surface,
            borderRadius: "16px",
            padding: "24px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <ShieldCheck size={20} style={{ color: colors.primary }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: colors.textPrimary }}>
              Identity & Role Hierarchy
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: colors.background, borderRadius: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: colors.textPrimary }}>LGU Authority Accounts</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#4F46E5" }}>{metrics.lguAccounts}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: colors.background, borderRadius: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: colors.textPrimary }}>POSO Field Enforcers</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#D97706" }}>{metrics.posoAccounts}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: colors.background, borderRadius: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: colors.textPrimary }}>Registered Commuters</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#059669" }}>{metrics.commuterAccounts}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", backgroundColor: colors.background, borderRadius: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: colors.textPrimary }}>System Administrators</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: colors.primary }}>{metrics.adminAccounts}</span>
            </div>
          </div>
        </div>

        {/* Governance Guidelines Box */}
        <div
          style={{
            backgroundColor: colors.surface,
            borderRadius: "16px",
            padding: "24px",
            border: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <Building2 size={20} style={{ color: "#4F46E5" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: colors.textPrimary }}>
                Account Provisioning Rules
              </h3>
            </div>
            <p style={{ fontSize: "13px", color: colors.textSecondary, lineHeight: "1.6", margin: "0 0 16px 0" }}>
              As <strong>System Administrator</strong>, your provisioning scope is exclusively restricted to <strong>LGU Authority Accounts</strong>. LGU Officers subsequently manage and provision on-road <strong>POSO Officers</strong>.
            </p>
          </div>

          <Link
            to="/users"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: colors.surfaceElevated,
              color: colors.primary,
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <span>Open LGU Account Management</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Recent LGU Accounts Table */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: colors.textPrimary }}>
              Recent LGU Transport Accounts
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: colors.textMuted }}>
              City Hall officers with administrative authority over transit and POSO enforcers.
            </p>
          </div>
          <Link
            to="/users"
            style={{
              fontSize: "13px",
              color: colors.primary,
              textDecoration: "none",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, color: colors.textSecondary, textAlign: "left" }}>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Officer Name</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Email Address</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Department</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentStaff.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: "32px", textAlign: "center", color: colors.textMuted }}>
                    No LGU accounts found. Click "Provision LGU Account" above to register your first transport officer.
                  </td>
                </tr>
              ) : (
                recentStaff.map((user) => (
                  <tr key={user._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 24px", fontWeight: "600", color: colors.textPrimary }}>
                      {user.firstName} {user.lastName} {user.suffix || ""}
                    </td>
                    <td style={{ padding: "14px 24px", color: colors.textSecondary }}>{user.email}</td>
                    <td style={{ padding: "14px 24px", color: colors.textSecondary }}>
                      {user.department || "City Transport & Public Safety Office (CTPSO)"}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: user.isActive ? "#ECFDF5" : "#FEF2F2",
                          color: user.isActive ? "#059669" : "#DC2626",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: user.isActive ? "#059669" : "#DC2626",
                          }}
                        />
                        {user.isActive ? "ACTIVE" : "SUSPENDED"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
