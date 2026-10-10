import React, { useEffect, useState } from "react";
import {
  Send,
  Check,
  AlertCircle,
  Radio,
  Info,
  Tag,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Bell,
  CheckCheck,
} from "lucide-react";

import { notificationsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const NotificationsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isAdmin, isLgu, isPoso, user } = useAuth();

  // Broadcast / Compose Form State
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [category, setCategory] = useState("broadcast_by_admin");
  const [severity, setSeverity] = useState("warning");
  const [locationArea, setLocationArea] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [sendMode, setSendMode] = useState("all");

  const [sending, setSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Data states
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [pendingRoadAlerts, setPendingRoadAlerts] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [posoMyAlerts, setPosoMyAlerts] = useState([]);

  // Modal / Rejection State
  const [rejectModalConfig, setRejectModalConfig] = useState({
    isOpen: false,
    alert: null,
    reason: "",
    loading: false,
  });

  // ============================================================
  // FETCH PENDING ROAD ALERTS (FOR LGU & ADMIN)
  // ============================================================
  const fetchPendingAlerts = async () => {
    if (!isLgu && !isAdmin) return;
    try {
      setPendingLoading(true);
      const { data } = await notificationsAPI.getPending();
      setPendingRoadAlerts(data?.data || []);
    } catch (err) {
      console.error("Failed to load pending road alerts:", err);
    } finally {
      setPendingLoading(false);
    }
  };

  // ============================================================
  // FETCH RECENT / MY ALERTS FEED
  // ============================================================
  const fetchRecent = async () => {
    try {
      if (isPoso) {
        const { data } = await notificationsAPI.getFeed({ limit: 20 });
        setPosoMyAlerts(data?.data || []);
      } else {
        const { data } = await notificationsAPI.getRecent({ limit: 15 });
        setRecentNotifications(data?.data || []);
      }
    } catch (err) {
      console.error("Failed to load notifications history:", err);
    }
  };

  useEffect(() => {
    fetchRecent();
    if (isLgu || isAdmin) {
      fetchPendingAlerts();
    }
  }, [isLgu, isAdmin, isPoso]);

  // ============================================================
  // POSO SUBMIT DRAFT ROAD ALERT
  // ============================================================
  const handlePosoSubmitAlert = async (e) => {
    e.preventDefault();
    setSending(true);
    setAlertMessage(null);

    try {
      const { data } = await notificationsAPI.requestAlert({
        title,
        message: messageText,
        severity,
        locationArea,
      });

      showSuccess(
        "Advisory Submitted to LGU",
        "Your road alert has been sent to Dagupan City LGU for review and broadcast."
      );

      setAlertMessage({
        type: "success",
        text: "Road alert submitted successfully to LGU for verification!",
      });

      setTitle("");
      setMessageText("");
      setLocationArea("");
      fetchRecent();
    } catch (err) {
      const errText =
        err.response?.data?.message || "Failed to submit road alert.";
      showError("Submission Failed", errText);
      setAlertMessage({ type: "error", text: errText });
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // LGU / ADMIN DIRECT BROADCAST
  // ============================================================
  const handleDirectBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    setAlertMessage(null);

    const type =
      category === "weather_updates"
        ? "weather_alert"
        : category === "complaint_updates"
        ? "complaint_update"
        : "broadcast";

    try {
      if (sendMode === "all") {
        await notificationsAPI.broadcast({
          title,
          message: messageText,
          type,
          category,
          severity,
          locationArea,
        });

        showSuccess(
          "Broadcast Dispatched",
          "Notification published and delivered to all active commuters."
        );

        setAlertMessage({
          type: "success",
          text: "Broadcast successfully dispatched to all commuters!",
        });
      } else {
        await notificationsAPI.sendToUser({
          userId: targetUserId,
          title,
          message: messageText,
          type,
          category,
        });

        showSuccess(
          "Notification Delivered",
          "Direct message sent to target commuter."
        );

        setAlertMessage({
          type: "success",
          text: "Direct notification sent successfully!",
        });
      }

      setTitle("");
      setMessageText("");
      setTargetUserId("");
      setLocationArea("");
      fetchRecent();
    } catch (err) {
      const errText =
        err.response?.data?.message || "Failed to dispatch broadcast.";
      showError("Dispatch Failed", errText);
      setAlertMessage({ type: "error", text: errText });
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // LGU ROAD ALERT APPROVAL & REJECTION
  // ============================================================
  const handleApproveAlert = async (alertItem) => {
    try {
      await notificationsAPI.approveAlert(alertItem._id);
      showSuccess(
        "Alert Approved & Broadcasted",
        `Road alert "${alertItem.title}" has been broadcast to all commuters.`
      );
      fetchPendingAlerts();
      fetchRecent();
    } catch (err) {
      showError(
        "Approval Failed",
        err.response?.data?.message || "Could not approve alert."
      );
    }
  };

  const handleOpenReject = (alertItem) => {
    setRejectModalConfig({
      isOpen: true,
      alert: alertItem,
      reason: "",
      loading: false,
    });
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalConfig.alert) return;

    setRejectModalConfig((prev) => ({ ...prev, loading: true }));
    try {
      await notificationsAPI.rejectAlert(
        rejectModalConfig.alert._id,
        rejectModalConfig.reason
      );

      showSuccess(
        "Alert Rejected",
        `Road alert "${rejectModalConfig.alert.title}" was rejected.`
      );

      setRejectModalConfig({
        isOpen: false,
        alert: null,
        reason: "",
        loading: false,
      });

      fetchPendingAlerts();
    } catch (err) {
      showError(
        "Rejection Failed",
        err.response?.data?.message || "Could not reject alert."
      );
      setRejectModalConfig((prev) => ({ ...prev, loading: false }));
    }
  };

  // ============================================================
  // TEMPLATES
  // ============================================================
  const posoTemplates = [
    {
      title: "Street Flooding / High Tide Road Impasse",
      location: "Herrero-Perez & AB Fernandez East",
      severity: "warning",
      message:
        "High tide and localized floodwaters reached 6-10 inches along Herrero-Perez. Light vehicles and tricycles advised to avoid corridor or use Mayombo bypass.",
    },
    {
      title: "Severe Traffic Congestion / Vehicle Breakdown",
      location: "Perez Blvd Corner Rizal Street",
      severity: "critical",
      message:
        "Stalled cargo delivery vehicle causing severe choke point along Perez Blvd westbound. POSO enforcers on site directing single-lane alternate flow.",
    },
    {
      title: "Temporary Transit Loop Rerouting Advisory",
      location: "Downtown Dagupan - Galvan Street",
      severity: "advisory",
      message:
        "Special civil event in Galvan St. PUJs bound for Bonuan temporarily rerouted via Burgos St and Perez Blvd until 6:00 PM today.",
    },
  ];

  const lguTemplates = [
    {
      label: "Broadcast by Admin: General Advisory",
      title: "SmartSakay Official Transit Advisory",
      message:
        "Notice to all commuters: Expect normal PUJ and loop operations today across downtown Dagupan and intercity corridors.",
      category: "broadcast_by_admin",
      severity: "info",
    },
    {
      label: "Weather Updates: Heavy Rain / Flood Warning",
      title: "Severe Weather / Heavy Rain Travel Advisory",
      message:
        "Heavy localized rainfall and high tide expected across low-lying Dagupan corridors today. Commuters are advised to exercise caution and expect minor delays.",
      category: "weather_updates",
      severity: "warning",
    },
    {
      label: "Complaint Updates: POSO Investigation Resolution",
      title: "Dagupan POSO Grievance Resolution Notice",
      message:
        "Action taken on reported transit grievance: Driver has been cited and referred to Dagupan POSO for administrative compliance.",
      category: "complaint_updates",
      severity: "info",
    },
    {
      label: "Broadcast by Admin: LTFRB Fare Adjustment",
      title: "Official LTFRB Fare Adjustment Notice",
      message:
        "Please be advised that updated jeepney fare tariffs are now in effect for all Dagupan City and Pangasinan routes.",
      category: "broadcast_by_admin",
      severity: "info",
    },
  ];

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return (
          <span
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              borderRadius: "999px",
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              color: "#DC2626",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              fontWeight: "700",
            }}
          >
            CRITICAL
          </span>
        );
      case "warning":
        return (
          <span
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              borderRadius: "999px",
              backgroundColor: "rgba(217, 119, 6, 0.15)",
              color: "#D97706",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              fontWeight: "700",
            }}
          >
            WARNING
          </span>
        );
      default:
        return (
          <span
            style={{
              fontSize: "11px",
              padding: "3px 8px",
              borderRadius: "999px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#2563EB",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              fontWeight: "700",
            }}
          >
            ADVISORY
          </span>
        );
    }
  };

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            color: colors.textPrimary,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span>
            {isPoso
              ? "POSO Road Broadcaster Desk"
              : isLgu
              ? "City Broadcast & Road Alert Approval Desk"
              : "Municipal Broadcaster & Advisories"}
          </span>

          <span
            className="badge"
            style={{
              backgroundColor: isPoso
                ? "rgba(217, 119, 6, 0.15)"
                : isLgu
                ? "rgba(16, 185, 129, 0.15)"
                : colors.surfaceElevated,
              color: isPoso
                ? "#D97706"
                : isLgu
                ? "#059669"
                : colors.primary,
              border: `1px solid ${colors.border}`,
              fontSize: "11px",
            }}
          >
            {isPoso
              ? "On-Road Traffic Alert Submissions"
              : isLgu
              ? "City Transport Authority"
              : "System Oversight"}
          </span>
        </h1>

        <p
          style={{
            color: colors.textMuted,
            fontSize: "14px",
            margin: 0,
          }}
        >
          {isPoso
            ? "Since POSO officers are continuously patrolling the roads, draft real-time traffic, flood, and reroute alerts. The Dagupan City LGU will verify and push them directly to commuter notifications."
            : isLgu
            ? "Review and approve on-road traffic alerts submitted by POSO officers before broadcasting to all commuters, or dispatch official city transit announcements directly."
            : "Monitor and dispatch categorized transit advisories and commuter announcements across Dagupan City."}
        </p>
      </div>

      {/* ALERT MESSAGE */}
      {alertMessage && (
        <div
          style={{
            background:
              alertMessage.type === "success"
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${
              alertMessage.type === "success" ? "#059669" : "#DC2626"
            }`,
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: alertMessage.type === "success" ? "#059669" : "#DC2626",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          {alertMessage.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* ======================================================
          LGU & ADMIN: PENDING ROAD ALERTS APPROVAL DESK
      ====================================================== */}
      {(isLgu || isAdmin) && (
        <div className="card" style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldAlert size={20} color="#D97706" />
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    margin: 0,
                    color: colors.textPrimary,
                  }}
                >
                  Pending POSO Road Alerts (Approval Desk)
                </h3>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>
                  On-road incident alerts submitted by field officers awaiting LGU verification
                </span>
              </div>
            </div>

            <span
              style={{
                backgroundColor:
                  pendingRoadAlerts.length > 0
                    ? "rgba(217, 119, 6, 0.15)"
                    : colors.surfaceElevated,
                color:
                  pendingRoadAlerts.length > 0
                    ? "#D97706"
                    : colors.textSecondary,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
                border: `1px solid ${colors.border}`,
              }}
            >
              {pendingRoadAlerts.length} Awaiting Review
            </span>
          </div>

          {pendingLoading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: colors.textMuted }}>
              Checking for pending POSO alerts...
            </div>
          ) : pendingRoadAlerts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                backgroundColor: colors.surfaceElevated,
                borderRadius: "8px",
                border: `1px dashed ${colors.border}`,
                color: colors.textMuted,
                fontSize: "13px",
              }}
            >
              <CheckCheck
                size={28}
                color="#059669"
                style={{ margin: "0 auto 8px auto", display: "block" }}
              />
              All road alerts have been reviewed. No pending POSO advisories awaiting verification.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingRoadAlerts.map((alert) => (
                <div
                  key={alert._id}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {getSeverityBadge(alert.severity)}
                      <h4
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: colors.textPrimary,
                          margin: 0,
                        }}
                      >
                        {alert.title}
                      </h4>
                    </div>

                    <p
                      style={{
                        fontSize: "13px",
                        color: colors.textSecondary,
                        margin: "0 0 10px 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {alert.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        fontSize: "12px",
                        color: colors.textMuted,
                      }}
                    >
                      {alert.locationArea && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#D97706",
                            fontWeight: "600",
                          }}
                        >
                          <MapPin size={13} />
                          {alert.locationArea}
                        </span>
                      )}

                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Car size={13} />
                        Officer:{" "}
                        <strong>
                          {alert.authorUser?.firstName || "POSO"} (Badge #
                          {alert.authorUser?.badgeNumber || "Enforcer"})
                        </strong>
                      </span>

                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={13} />
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => handleApproveAlert(alert)}
                      className="btn"
                      style={{
                        backgroundColor: "#059669",
                        color: "#FFFFFF",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Broadcast</span>
                    </button>

                    <button
                      onClick={() => handleOpenReject(alert)}
                      className="btn btn-secondary"
                      style={{
                        color: "#DC2626",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                      }}
                    >
                      <XCircle size={15} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          MAIN INTERACTION SECTION (POSO DRAFT OR LGU/ADMIN BROADCAST)
      ====================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "24px",
        }}
      >
        {/* COMPOSER CARD */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {isPoso ? (
              <ShieldAlert size={20} color="#D97706" />
            ) : (
              <Radio size={20} color={colors.primary} />
            )}

            <h3
              style={{
                fontSize: "17px",
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              {isPoso
                ? "Draft On-Road Broadcast Alert"
                : "Compose City Broadcast"}
            </h3>
          </div>

          <form onSubmit={isPoso ? handlePosoSubmitAlert : handleDirectBroadcast}>
            {/* LGU / ADMIN ONLY: SEND MODE */}
            {!isPoso && (
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: colors.textSecondary,
                  }}
                >
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === "all"}
                    onChange={() => setSendMode("all")}
                  />
                  <span>Broadcast to All Commuters</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: colors.textSecondary,
                  }}
                >
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === "user"}
                    onChange={() => setSendMode("user")}
                  />
                  <span>Target Specific Commuter ID</span>
                </label>
              </div>
            )}

            {!isPoso && sendMode === "user" && (
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Recipient User ID</label>
                <input
                  type="text"
                  required
                  placeholder="Paste MongoDB User ID e.g. 660f..."
                  className="form-input"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
              </div>
            )}

            {/* SEVERITY & LOCATION FIELDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div className="form-group">
                <label className="form-label">Alert Severity</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ fontWeight: "600" }}
                >
                  <option value="advisory">🔵 Advisory (Normal / Info)</option>
                  <option value="warning">🟠 Warning (Traffic / Minor Flooding)</option>
                  <option value="critical">🔴 Critical (Impassable / Emergency)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Road Corridor / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Perez Blvd / Herrero-Perez"
                  className="form-input"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                />
              </div>
            </div>

            {/* CATEGORY (FOR LGU/ADMIN) OR POSO TITLE */}
            {!isPoso ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "14px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Notification Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ fontWeight: "600" }}
                  >
                    <option value="broadcast_by_admin">📢 Broadcast by Admin</option>
                    <option value="weather_updates">🌦️ Weather Updates</option>
                    <option value="complaint_updates">📋 Complaint Updates</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notification Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weather / Traffic Advisory"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Alert Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Tide Road Impasse along Herrero-Perez"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            )}

            {/* MESSAGE BODY */}
            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label className="form-label">Advisory Details & Instructions *</label>
              <textarea
                rows={5}
                required
                placeholder={
                  isPoso
                    ? "Specify the incident, current vehicle flow, estimated clearance time, or recommended rerouting instructions..."
                    : "Type official announcement to be displayed on commuter mobile apps..."
                }
                className="form-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={sending}
              className="btn"
              style={{
                width: "100%",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: isPoso ? "#D97706" : colors.primary,
                color: "#FFFFFF",
                border: "none",
                fontWeight: "600",
                opacity: sending ? 0.7 : 1,
              }}
            >
              <Send size={16} />
              <span>
                {sending
                  ? "Transmitting..."
                  : isPoso
                  ? "Submit Alert to LGU for Verification"
                  : "Publish Broadcast to Commuters"}
              </span>
            </button>
          </form>
        </div>

        {/* TEMPLATES & INFO CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* TEMPLATES */}
          <div className="card">
            <h3
              style={{
                fontSize: "15px",
                color: colors.textPrimary,
                marginBottom: "12px",
                fontWeight: "700",
              }}
            >
              {isPoso ? "POSO Road Incident Quick Templates" : "Pre-approved City Templates"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {isPoso
                ? posoTemplates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTitle(t.title);
                        setLocationArea(t.location);
                        setSeverity(t.severity);
                        setMessageText(t.message);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: colors.surfaceElevated,
                        border: `1px solid ${colors.border}`,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#D97706",
                          marginBottom: "2px",
                        }}
                      >
                        {t.title}
                      </div>
                      <div style={{ fontSize: "11px", color: colors.textMuted }}>
                        Location: {t.location}
                      </div>
                    </button>
                  ))
                : lguTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setTitle(template.title);
                        setMessageText(template.message);
                        setCategory(template.category);
                        setSeverity(template.severity);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: colors.surfaceElevated,
                        border: `1px solid ${colors.border}`,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: colors.primary,
                        }}
                      >
                        {template.label}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: colors.textMuted,
                          marginTop: "2px",
                        }}
                      >
                        {template.title}
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          {/* WORKFLOW GUIDELINES CARD */}
          <div
            className="card"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: isPoso ? "#D97706" : colors.info,
                marginBottom: "8px",
              }}
            >
              <Info size={18} />
              <span style={{ fontWeight: "700", fontSize: "14px" }}>
                {isPoso
                  ? "POSO Road Broadcaster Rules"
                  : "LGU Multi-Role Broadcast Flow"}
              </span>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {isPoso
                ? "As an on-road POSO officer, all drafted alerts are reviewed by Dagupan LGU to ensure official accuracy before reaching commuters. Once approved, all commuter devices receive the push alert immediately."
                : "Commuters receive published notices on their mobile notification feed. Alerts verified by LGU reflect verified on-road status from POSO patrols."}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          POSO: MY SUBMITTED ROAD ALERTS HISTORY
      ====================================================== */}
      {isPoso && (
        <div className="card" style={{ marginTop: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              color: colors.textPrimary,
              marginBottom: "14px",
              fontWeight: "700",
            }}
          >
            My Submitted Road Alerts & Status
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px" }}>Severity</th>
                  <th style={{ padding: "10px 8px" }}>Alert Title</th>
                  <th style={{ padding: "10px 8px" }}>Location</th>
                  <th style={{ padding: "10px 8px" }}>Message</th>
                  <th style={{ padding: "10px 8px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {posoMyAlerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: colors.textMuted,
                      }}
                    >
                      No submitted road alerts found.
                    </td>
                  </tr>
                ) : (
                  posoMyAlerts.map((a, idx) => (
                    <tr
                      key={a._id || idx}
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                    >
                      <td style={{ padding: "10px 8px" }}>
                        {a.status === "published" ? (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#059669",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              padding: "3px 8px",
                              borderRadius: "999px",
                            }}
                          >
                            ✓ Approved & Broadcasted
                          </span>
                        ) : a.status === "rejected" ? (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#DC2626",
                              backgroundColor: "rgba(239, 68, 68, 0.15)",
                              padding: "3px 8px",
                              borderRadius: "999px",
                            }}
                          >
                            ✗ Rejected
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#D97706",
                              backgroundColor: "rgba(217, 119, 6, 0.15)",
                              padding: "3px 8px",
                              borderRadius: "999px",
                            }}
                          >
                            ⏳ Pending LGU Review
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {getSeverityBadge(a.severity)}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          fontWeight: "600",
                          color: colors.textPrimary,
                        }}
                      >
                        {a.title}
                      </td>
                      <td style={{ padding: "10px 8px", color: colors.textSecondary }}>
                        {a.locationArea || "General Dagupan"}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          color: colors.textMuted,
                          maxWidth: "280px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {a.message}
                      </td>
                      <td style={{ padding: "10px 8px", color: colors.textMuted }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          LGU & ADMIN: RECENT DISPATCHES TABLE
      ====================================================== */}
      {!isPoso && recentNotifications.length > 0 && (
        <div className="card" style={{ marginTop: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              color: colors.textPrimary,
              marginBottom: "14px",
              fontWeight: "700",
            }}
          >
            Recent City Announcements
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px 8px" }}>Title</th>
                  <th style={{ padding: "10px 8px" }}>Message Preview</th>
                  <th style={{ padding: "10px 8px" }}>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentNotifications.map((notification, index) => (
                  <tr
                    key={notification._id || index}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <td
                      style={{
                        padding: "10px 8px",
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {notification.title}
                    </td>

                    <td
                      style={{
                        padding: "10px 8px",
                        color: colors.textMuted,
                        maxWidth: "350px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {notification.message}
                    </td>

                    <td
                      style={{
                        padding: "10px 8px",
                        color: colors.textMuted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          REJECT ALERT MODAL
      ====================================================== */}
      {rejectModalConfig.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#DC2626",
                }}
              >
                Reject Road Advisory
              </h3>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div
                className="modal-body"
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                <p style={{ fontSize: "13px", color: colors.textSecondary, margin: 0 }}>
                  Specify why this road alert will not be published to commuters:
                </p>
                <textarea
                  className="form-input"
                  rows={3}
                  required
                  placeholder="e.g. Incident already cleared, duplicate advisory, or unverified corridor..."
                  value={rejectModalConfig.reason}
                  onChange={(e) =>
                    setRejectModalConfig({
                      ...rejectModalConfig,
                      reason: e.target.value,
                    })
                  }
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setRejectModalConfig({
                      isOpen: false,
                      alert: null,
                      reason: "",
                      loading: false,
                    })
                  }
                  disabled={rejectModalConfig.loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={rejectModalConfig.loading}
                  style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}
                >
                  {rejectModalConfig.loading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
