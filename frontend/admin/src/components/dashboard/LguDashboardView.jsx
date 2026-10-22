import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Compass,
  AlertTriangle,
  Radio,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Bell,
} from "lucide-react";
import api from "../../api/client";
import { useTheme } from "../../contexts/theme/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import AnalyticsChart from "./AnalyticsChart";
import ReportTypePieChart from "./ReportTypePieChart";
import { formatLguJurisdiction } from "../../utils/lguHelpers";

const LguDashboardView = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [cityRoutes, setCityRoutes] = useState([]);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [endorsedComplaints, setEndorsedComplaints] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [complaintTotals, setComplaintTotals] = useState({
    resolved: 0,
    deleted: 0,
    actionTaken: 0,
    terminated: 0,
    pending: 0,
    endorsed: 0,
    total: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [topCategory, setTopCategory] = useState(null);
  const [totalCategorized, setTotalCategorized] = useState(0);
  const [trendRange, setTrendRange] = useState(6);
  const [loading, setLoading] = useState(true);

  const fetchComplaintAnalytics = async (range) => {
    try {
      const res = await api.get(`/complaints/analytics/monthly?months=${range}`);
      if (res.data?.data) {
        if (res.data.data.totals) setComplaintTotals(res.data.data.totals);
        if (res.data.data.monthlyTrends) setComplaintTrends(res.data.data.monthlyTrends);
        if (res.data.data.categoryBreakdown) setCategoryBreakdown(res.data.data.categoryBreakdown);
        if (res.data.data.topCategory) setTopCategory(res.data.data.topCategory);
        if (res.data.data.totalCategorized !== undefined) setTotalCategorized(res.data.data.totalCategorized);
      }
    } catch (err) {
      console.error("Failed to load complaint monthly analytics:", err);
    }
  };

  useEffect(() => {
    const fetchLguDashboardData = async () => {
      try {
        const [statsRes, routesRes, alertsRes, complaintsRes, actRes] = await Promise.all([
          api.get("/admin/stats").catch(() => ({ data: { data: {} } })),
          api.get("/routes").catch(() => ({ data: { data: [] } })),
          api.get("/notifications/pending").catch(() => ({ data: { data: [] } })),
          api.get("/complaints?limit=10").catch(() => ({ data: { data: { items: [] } } })),
          api.get("/admin/activity").catch(() => ({ data: { data: {} } })),
          fetchComplaintAnalytics(trendRange),
        ]);

        setStats(statsRes.data?.data || null);
        setCityRoutes(routesRes.data?.data || []);

        // Pending road alerts from POSO needing LGU approval
        const alerts = Array.isArray(alertsRes.data?.data) ? alertsRes.data.data : [];
        setPendingAlerts(alerts);

        // Complaints endorsed by POSO
        const complaintsData = complaintsRes.data?.data?.items || complaintsRes.data?.data || [];
        const endorsed = complaintsData.filter((c) => c.status === "endorsed_to_lgu");
        setEndorsedComplaints(endorsed);

        // Formatted recent activity
        const rawActivity = actRes.data?.data;
        let formattedActivity = [];
        if (Array.isArray(rawActivity)) {
          formattedActivity = rawActivity;
        } else if (rawActivity && typeof rawActivity === "object") {
          const users = Array.isArray(rawActivity.recentUsers) ? rawActivity.recentUsers : [];
          const complaints = Array.isArray(rawActivity.recentComplaints) ? rawActivity.recentComplaints : [];

          users.forEach((u) => {
            formattedActivity.push({
              action: "New Commuter Registered",
              details: `${u.firstName || "User"} ${u.lastName || ""} (${u.email || "N/A"})`,
              timestamp: u.createdAt || new Date(),
              type: "user",
            });
          });

          complaints.forEach((c) => {
            const reporter = c.userId
              ? `${c.userId.firstName || ""} ${c.userId.lastName || ""}`.trim()
              : "Anonymous";
            formattedActivity.push({
              action: `Grievance: ${c.category ? c.category.toUpperCase() : "General"}`,
              details: `${c.subject || "Report"} [${c.status || "pending"}] by ${reporter || "Commuter"}`,
              timestamp: c.createdAt || new Date(),
              type: "complaint",
            });
          });

          formattedActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        setRecentActivity(formattedActivity.slice(0, 6));
      } catch (err) {
        console.error("Failed to load LGU dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLguDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "0 0 40px 0" }}>
        <div
          style={{
            height: "40px",
            width: "320px",
            backgroundColor: colors.surfaceElevated,
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: "130px",
                backgroundColor: colors.surfaceElevated,
                borderRadius: "14px",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Jeepney Routes",
      value: stats?.routes?.active ?? stats?.routes?.total ?? 0,
      subtitle: `${stats?.routes?.total || 0} total registered routes`,
      icon: MapPin,
      to: "/routes",
      color: "#2563EB",
      bgColor: "#EFF6FF",
      borderColor: "#BFDBFE",
    },
    {
      title: "Pending Road Alerts",
      value: pendingAlerts.length,
      subtitle: pendingAlerts.length > 0 ? "Awaiting your approval" : "All alerts verified",
      icon: Radio,
      to: "/notifications",
      color: "#D97706",
      bgColor: "#FFFBEB",
      borderColor: "#FDE68A",
      highlight: pendingAlerts.length > 0,
    },
    {
      title: "Endorsed Grievances",
      value: endorsedComplaints.length,
      subtitle: endorsedComplaints.length > 0 ? "POSO verified on-road" : "No pending sanctions",
      icon: AlertTriangle,
      to: "/complaints",
      color: "#DC2626",
      bgColor: "#FEF2F2",
      borderColor: "#FECACA",
      highlight: endorsedComplaints.length > 0,
    },
    {
      title: "Terminal Hubs",
      value: stats?.terminals?.total ?? 0,
      subtitle: `${stats?.terminals?.total || 0} transit & terminal hubs`,
      icon: Compass,
      to: "/terminals",
      color: "#7C3AED",
      bgColor: "#F5F3FF",
      borderColor: "#DDD6FE",
    },
    {
      title: "LTFRB Fare Matrix",
      value: "₱14.00",
      subtitle: "Base PUV rate configured",
      icon: Calculator,
      to: "/fares",
      color: "#059669",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    },
    {
      title: "POSO Enforcers",
      value: stats?.users?.poso || 0,
      subtitle: "Active field officers",
      icon: ShieldCheck,
      to: "/users",
      color: "#0891B2",
      bgColor: "#ECFEFF",
      borderColor: "#A5F3FC",
    },
  ];

  const currentMunicipality = user?.municipality || "Dagupan";

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
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              {formatLguJurisdiction(currentMunicipality)} Transport Authority Operations
            </h1>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor: colors.primary + "1A",
                color: colors.primary,
                border: `1px solid ${colors.primary}40`,
              }}
            >
              LGU {currentMunicipality} Jurisdiction
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: colors.textMuted,
              margin: "6px 0 0 0",
            }}
          >
            Executive transit telemetry, POSO field endorsement oversight, and road advisories for {formatLguJurisdiction(currentMunicipality)}.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {pendingAlerts.length > 0 && (
            <Link
              to="/notifications"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                backgroundColor: "#FEF3C7",
                color: "#92400E",
                border: "1px solid #FCD34D",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              <Radio size={15} />
              <span>Review POSO Alerts ({pendingAlerts.length})</span>
            </Link>
          )}

          <Link
            to="/notifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 16px",
              backgroundColor: colors.primary,
              color: "#FFFFFF",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "13px",
              boxShadow: `0 4px 12px ${colors.primaryDark}40`,
            }}
          >
            <Bell size={15} />
            <span>Send City Advisory</span>
          </Link>
        </div>
      </div>

      {/* Urgent Action Alert Banners */}
      {pendingAlerts.length > 0 && (
        <div
          style={{
            backgroundColor: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97706",
              }}
            >
              <Radio size={20} />
            </div>
            <div>
              <div style={{ fontWeight: "700", color: "#92400E", fontSize: "14px" }}>
                {pendingAlerts.length} POSO Road Alert Draft{pendingAlerts.length > 1 ? "s" : ""} Awaiting Review
              </div>
              <div style={{ fontSize: "12px", color: "#B45309", marginTop: "2px" }}>
                Field officers have submitted road condition alerts that require LGU approval before broadcasting to commuters.
              </div>
            </div>
          </div>
          <Link
            to="/notifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              backgroundColor: "#D97706",
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "12px",
            }}
          >
            <span>Review & Broadcast</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {endorsedComplaints.length > 0 && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: "700", color: "#991B1B", fontSize: "14px" }}>
                {endorsedComplaints.length} Grievance{endorsedComplaints.length > 1 ? "s" : ""} Endorsed by POSO for City Action
              </div>
              <div style={{ fontSize: "12px", color: "#B91C1C", marginTop: "2px" }}>
                Field enforcers verified commuter reports on-site. Issue operator sanctions or dismissals at the action desk.
              </div>
            </div>
          </div>
          <Link
            to="/complaints"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "12px",
            }}
          >
            <span>Go to Action Desk</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 6 Core Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.to}
              style={{
                backgroundColor: colors.surface,
                borderRadius: "16px",
                padding: "20px 22px",
                border: card.highlight ? `2px solid ${card.color}` : `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textDecoration: "none",
                transition: "transform 150ms ease, box-shadow 150ms ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "32px", fontWeight: "800", color: colors.textPrimary, marginTop: "4px" }}>
                    {card.value}
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: card.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                    border: `1px solid ${card.borderColor}`,
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>

              <div style={{ fontSize: "12px", color: colors.textMuted, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{card.subtitle}</span>
                <ArrowRight size={13} style={{ color: card.color }} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* LTFRB Regulatory Notice Banner */}
      <div
        style={{
          backgroundColor: "#FFFBEB",
          borderRadius: "16px",
          border: "1px solid #FCD34D",
          padding: "18px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              backgroundColor: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>

          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "#92400E" }}>
              LTFRB Compliance & Fare Rules
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#B45309", lineHeight: "1.6" }}>
              All {currentMunicipality} PUV franchises must strictly implement the <strong>20% statutory discount</strong> for Students, Senior Citizens, and PWDs under RA 11314 and LTFRB Memorandum Circulars. Overcharging and refusal to convey passengers are subject to LGU Transport sanctions.
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Grievance & Enforcement Analytics */}
      <div style={{ marginBottom: "28px" }}>
        {/* KPI Mini-Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: "14px",
              padding: "18px",
              border: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Resolved Complaints
              </div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#10B981", marginTop: "2px" }}>
                {complaintTotals.resolved.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                Officially resolved & settled
              </div>
            </div>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: "14px",
              padding: "18px",
              border: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Action Taken
              </div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563EB", marginTop: "2px" }}>
                {complaintTotals.actionTaken.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                Operator sanctions imposed
              </div>
            </div>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
              <ShieldCheck size={22} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: colors.surface,
              borderRadius: "14px",
              padding: "18px",
              border: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Deleted Complaints
              </div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#EF4444", marginTop: "2px" }}>
                {complaintTotals.deleted.toLocaleString()}
              </div>
              <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                Removed with audit reason
              </div>
            </div>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        <AnalyticsChart
          title="Monthly Grievance & Enforcement Analytics (Per Month)"
          subtitle="Monthly breakdown of resolved complaints, official actions/sanctions taken, and screened/deleted complaints"
          data={complaintTrends}
          series={[
            { key: "resolved", label: "Resolved Complaints", color: "#10B981" },
            { key: "actionTaken", label: "Action Taken", color: "#2563EB" },
            { key: "deleted", label: "Deleted Complaints", color: "#EF4444" },
          ]}
          timeRange={trendRange}
          onTimeRangeChange={(r) => {
            setTrendRange(r);
            fetchComplaintAnalytics(r);
          }}
          emptyMessage="No complaint resolution or deletion data recorded for this timeframe."
        />

        {/* Commuter Grievance Category Distribution Pie Chart & Focus Intelligence */}
        <div style={{ marginTop: "24px" }}>
          <ReportTypePieChart
            categoryBreakdown={categoryBreakdown}
            topCategory={topCategory}
            totalReports={totalCategorized || complaintTotals.total}
          />
        </div>
      </div>

      {/* Main Operations Desks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* POSO Road Alerts Awaiting Review */}
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
              padding: "18px 22px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                <Radio size={16} color="#D97706" />
                Road Alerts from POSO (Awaiting Approval)
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: colors.textMuted }}>
                Review on-ground reports from officers before broadcasting city-wide.
              </p>
            </div>

            <Link
              to="/notifications"
              style={{
                fontSize: "12px",
                color: colors.primary,
                textDecoration: "none",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Broadcaster Desk</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {pendingAlerts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 8px auto", display: "block" }} />
              No pending road alerts requiring authorization. All clear!
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.background, color: colors.textSecondary, textAlign: "left" }}>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Alert Title</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Category</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Reported</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAlerts.slice(0, 5).map((alert) => (
                    <tr key={alert._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                      <td style={{ padding: "12px 20px", fontWeight: "600", color: colors.textPrimary }}>
                        {alert.title}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            textTransform: "uppercase",
                          }}
                        >
                          {alert.category || "advisory"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: colors.textMuted, fontSize: "12px" }}>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <Link
                          to="/notifications"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            backgroundColor: colors.primary,
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Review & Approve
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Endorsed Complaints from POSO */}
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
              padding: "18px 22px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: colors.textPrimary, display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={16} color="#DC2626" />
                Field-Verified Complaints (POSO Endorsed)
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: colors.textMuted }}>
                Inspect plate numbers and violation details on-site, then issue administrative actions.
              </p>
            </div>

            <Link
              to="/complaints"
              style={{
                fontSize: "12px",
                color: colors.primary,
                textDecoration: "none",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Action Desk</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {endorsedComplaints.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 8px auto", display: "block" }} />
              No complaints awaiting LGU sanction. City transport operations running smoothly!
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.background, color: colors.textSecondary, textAlign: "left" }}>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Grievance Subject</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Vehicle / Plate</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Category</th>
                    <th style={{ padding: "10px 20px", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {endorsedComplaints.slice(0, 5).map((complaint) => (
                    <tr key={complaint._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                      <td style={{ padding: "12px 20px", fontWeight: "600", color: colors.textPrimary }}>
                        {complaint.subject}
                      </td>
                      <td style={{ padding: "12px 20px", color: colors.textSecondary }}>
                        {complaint.vehiclePlateNumber && (
                          <div style={{ fontWeight: "700", color: colors.textPrimary, marginBottom: complaint.routeId ? "3px" : "0" }}>
                            Plate: {complaint.vehiclePlateNumber}
                          </div>
                        )}
                        {complaint.routeId ? (
                          <Link
                            to={`/routes?routeId=${complaint.routeId._id || complaint.routeId}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              color: "#FFFFFF",
                              backgroundColor: "#2563EB",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              border: "1px solid #1D4ED8",
                              textDecoration: "none",
                              boxShadow: "0 2px 4px rgba(37,99,235,0.25)",
                              cursor: "pointer",
                            }}
                            title="Click to auto-navigate map to this route"
                          >
                            <Compass size={12} />
                            <span>{complaint.routeId.name || complaint.routeId.code || "View Route"}</span>
                            <ArrowRight size={11} />
                          </Link>
                        ) : (
                          !complaint.vehiclePlateNumber && "Route N/A"
                        )}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: "#FEE2E2",
                            color: "#B91C1C",
                            textTransform: "uppercase",
                          }}
                        >
                          {complaint.category?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <Link
                          to="/complaints"
                          state={{ selectedComplaintId: complaint._id }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            backgroundColor: "#DC2626",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          Take Action
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LguDashboardView;
