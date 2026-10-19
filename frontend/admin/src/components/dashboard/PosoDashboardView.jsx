import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  FileCheck2,
  PlusCircle,
  Clock,
  ArrowRight,
  MapPin,
  CheckCircle2,
  XCircle,
  Car,
  FileX,
  TrendingDown,
} from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/theme/ThemeContext";
import AnalyticsChart from "./AnalyticsChart";

const PosoDashboardView = () => {
  const { admin } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [endorsedCount, setEndorsedCount] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [posoTotals, setPosoTotals] = useState({
    rejected: 0,
    endorsed: 0,
    total: 0,
  });
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [monthsRange, setMonthsRange] = useState(6);
  const [loading, setLoading] = useState(true);

  const fetchPosoAnalytics = async (range) => {
    try {
      const res = await api.get(`/complaints/analytics/monthly?months=${range}`);
      if (res.data?.data) {
        if (res.data.data.totals) {
          setPosoTotals({
            rejected: res.data.data.totals.rejected || 0,
            endorsed: res.data.data.totals.endorsed || 0,
            total: res.data.data.totals.total || 0,
          });
        }
        if (res.data.data.monthlyTrends) {
          setMonthlyTrends(res.data.data.monthlyTrends);
        }
      }
    } catch (err) {
      console.error("Failed to load POSO monthly analytics:", err);
    }
  };

  useEffect(() => {
    const fetchPosoData = async () => {
      try {
        const [complaintsRes, alertsRes] = await Promise.all([
          api.get("/complaints?limit=10"),
          api.get("/notifications/feed?limit=5").catch(() => ({ data: { data: [] } })),
          fetchPosoAnalytics(monthsRange),
        ]);

        const items = complaintsRes.data?.data?.items || complaintsRes.data?.data || [];
        const pending = items.filter((c) => c.status === "pending" || c.status === "under_review");
        const endorsed = items.filter((c) => c.status === "endorsed_to_lgu" || c.status === "action_taken" || c.status === "terminated" || c.status === "resolved");

        setPendingComplaints(pending);
        setEndorsedCount(endorsed.length);

        const alerts = alertsRes.data?.data || [];
        setPendingAlerts(alerts);
      } catch (err) {
        console.error("Failed to load POSO dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosoData();
  }, []);

  const handleRangeChange = (newRange) => {
    setMonthsRange(newRange);
    fetchPosoAnalytics(newRange);
  };

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ height: "40px", width: "260px", backgroundColor: colors.surfaceElevated, borderRadius: "8px", marginBottom: "24px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "140px", backgroundColor: colors.surfaceElevated, borderRadius: "14px" }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Reports",
      value: posoTotals.total,
      subtitle: "All filed commuter violation reports",
      icon: ShieldAlert,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      borderColor: "#BFDBFE",
      link: "/complaints",
    },
    {
      title: "Endorsed to LGU",
      value: posoTotals.endorsed || endorsedCount,
      subtitle: "Verified grievances forwarded to City Hall",
      icon: FileCheck2,
      color: "#10B981",
      bgColor: "#ECFDF5",
      borderColor: "#A7F3D0",
      link: "/complaints?status=endorsed_to_lgu",
    },
    {
      title: "Rejected Reports",
      value: posoTotals.rejected,
      subtitle: "Dismissed or invalid on-ground reports",
      icon: FileX,
      color: "#EF4444",
      bgColor: "#FEF2F2",
      borderColor: "#FECACA",
      link: "/complaints?status=rejected",
    },
    {
      title: "Pending Road Verification",
      value: pendingComplaints.length,
      subtitle: "Commuter reports requiring field inspection",
      icon: AlertTriangle,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      borderColor: "#FDE68A",
      link: "/complaints?status=pending",
    },
  ];

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* Officer Header Card */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: "16px",
          padding: "24px",
          border: `1px solid ${colors.border}`,
          marginBottom: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                backgroundColor: "#FEF3C7",
                color: "#D97706",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "6px",
                letterSpacing: "0.05em",
              }}
            >
              ON-DUTY FIELD ENFORCER
            </span>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>
              Badge: <strong>{admin?.badgeNumber || "POSO-DAG-01"}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: colors.textPrimary, margin: 0 }}>
            POSO Field Enforcement Hub
          </h1>
          <p style={{ fontSize: "13px", color: colors.textSecondary, margin: "4px 0 0 0" }}>
            Assigned Sector: <strong>{admin?.assignedZone || "Poblacion / Lucao Sector"}</strong> — Dagupan City Public Order & Safety Office
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/complaints", { state: { openFieldReport: true } })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            }}
          >
            <Car size={16} />
            File Direct Road Violation
          </button>

          <Link
            to="/notifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              backgroundColor: colors.surfaceElevated,
              color: colors.primary,
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "13px",
              border: `1px solid ${colors.border}`,
            }}
          >
            <Radio size={16} />
            Draft Road Advisory
          </Link>
        </div>
      </div>

      {/* 4 Field Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              to={card.link}
              key={idx}
              style={{
                textDecoration: "none",
                backgroundColor: colors.surface,
                borderRadius: "16px",
                padding: "22px",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 180ms ease, box-shadow 180ms ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "32px", fontWeight: "800", color: colors.textPrimary, marginTop: "4px" }}>
                    {card.value.toLocaleString()}
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

              <div style={{ fontSize: "11px", color: colors.textMuted, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{card.subtitle}</span>
                <ArrowRight size={13} style={{ color: card.color }} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* POSO Enforcement Monthly Analytics Bar Graph */}
      <div style={{ marginBottom: "28px" }}>
        <AnalyticsChart
          title="Field Enforcement & Grievance Triage Analytics (Per Month)"
          subtitle="Monthly breakdown of commuter reports rejected, verified cases endorsed to LGU, and total filed reports"
          data={monthlyTrends}
          series={[
            { key: "rejected", label: "Rejected Reports", color: "#EF4444" },
            { key: "endorsed", label: "Endorsed to LGU", color: "#10B981" },
            { key: "total", label: "Total Reports", color: "#3B82F6" },
          ]}
          timeRange={monthsRange}
          onTimeRangeChange={handleRangeChange}
          emptyMessage="No enforcement reports recorded for this time period."
        />
      </div>

      {/* Priority Complaints for Field Verification */}
      <div
        style={{
          backgroundColor: colors.surface,
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          marginBottom: "32px",
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
              Commuter Reports Awaiting Field Verification
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: colors.textMuted }}>
              Inspect plate numbers and violation details on-site, then endorse verified cases to LGU.
            </p>
          </div>
          <Link
            to="/complaints?tab=pending"
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
            <span>View All Pending</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: colors.background, color: colors.textSecondary, textAlign: "left" }}>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Grievance Subject</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Vehicle / Route</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Reported Date</th>
                <th style={{ padding: "12px 24px", fontWeight: "600" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingComplaints.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "32px", textAlign: "center", color: colors.textMuted }}>
                    No pending complaints require inspection right now. Roads are currently clear!
                  </td>
                </tr>
              ) : (
                pendingComplaints.slice(0, 5).map((complaint) => (
                  <tr key={complaint._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "14px 24px", fontWeight: "600", color: colors.textPrimary }}>
                      {complaint.subject}
                    </td>
                    <td style={{ padding: "14px 24px", color: colors.textSecondary }}>
                      {complaint.vehiclePlateNumber ? (
                        <span style={{ fontWeight: "700", color: colors.textPrimary }}>
                          Plate: {complaint.vehiclePlateNumber}
                        </span>
                      ) : (
                        complaint.routeId?.name || "Unspecified Route"
                      )}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: "#FEF3C7",
                          color: "#B45309",
                          textTransform: "uppercase",
                        }}
                      >
                        {complaint.category?.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: colors.textMuted }}>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <Link
                        to="/complaints"
                        state={{ selectedComplaintId: complaint._id, autoEndorse: true }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 12px",
                          backgroundColor: colors.primary,
                          color: "#FFFFFF",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Verify & Endorse
                      </Link>
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

export default PosoDashboardView;
