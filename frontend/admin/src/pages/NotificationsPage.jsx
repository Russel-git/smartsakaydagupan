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
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import { notificationsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getEvidenceImageUrl } from "../utils/imageUrl";

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
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  const [sending, setSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [targetMunicipality, setTargetMunicipality] = useState(user?.municipality || "Dagupan");

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
        municipality: user?.municipality || "Dagupan",
      });

      showSuccess(
        "Advisory Submitted to LGU",
        `Your road alert has been sent to LGU ${user?.municipality || "Dagupan"} for review and broadcast.`
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
  // EVIDENCE PHOTO UPLOAD FOR LGU BROADCAST
  // ============================================================
  const handleEvidencePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", file);
      const res = await notificationsAPI.uploadEvidence(formData);
      const photoUrl = res.data?.data?.url || res.data?.data?.photoUrl || res.data?.url || res.data?.photoUrl;
      setEvidencePhotoUrl(photoUrl);
      showSuccess("Evidence Attached", "Photo uploaded successfully for broadcast credibility.");
    } catch (err) {
      console.error("Failed to upload evidence photo:", err);
      showError("Upload Failed", err.response?.data?.message || "Could not upload evidence photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ============================================================
  // LGU / ADMIN DIRECT BROADCAST
  // ============================================================
  const handleDirectBroadcast = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setAlertMessage(null);

    const finalType = isLgu ? "broadcast" : (category === "weather_updates" ? "weather_alert" : category === "complaint_updates" ? "complaint_update" : "broadcast");
    const finalCategory = isLgu ? "broadcast_by_admin" : category;

    try {
      await notificationsAPI.broadcast({
        title,
        message: messageText,
        type: finalType,
        category: finalCategory,
        severity,
        locationArea,
        municipality: isLgu ? (user?.municipality || "Dagupan") : targetMunicipality,
        photoUrl: evidencePhotoUrl || null,
        evidencePhoto: evidencePhotoUrl || null,
        metadata: evidencePhotoUrl ? { photoUrl: evidencePhotoUrl, evidencePhoto: evidencePhotoUrl } : {},
      });

      showSuccess(
        "Broadcast Dispatched",
        `Official announcement published and delivered to ${isLgu ? `LGU ${user?.municipality || "Dagupan"}` : targetMunicipality} commuters.`
      );

      setAlertMessage({
        type: "success",
        text: "Broadcast successfully dispatched to all commuters!",
      });

      setTitle("");
      setMessageText("");
      setLocationArea("");
      setEvidencePhotoUrl("");
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
        { reason: rejectModalConfig.reason }
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

  const activeMuniName = user?.municipality || "Dagupan";
  const lguTemplates = [
    {
      label: "Broadcast by LGU: General Transit Advisory",
      title: "SmartSakay Official Transit Advisory",
      message:
        `Notice to all commuters: Expect normal PUJ and loop operations today across ${activeMuniName} and intercity corridors.`,
      category: "broadcast_by_admin",
      severity: "info",
    },
    {
      label: "Broadcast by LGU: Weather / Flood Road Advisory",
      title: "Severe Weather / Heavy Rain Travel Advisory",
      message:
        `Heavy localized rainfall and high tide expected across low-lying ${activeMuniName} corridors today. Commuters are advised to exercise caution and expect minor delays.`,
      category: "broadcast_by_admin",
      severity: "warning",
    },
    {
      label: "Broadcast by LGU: Temporary Road Rerouting",
      title: "Temporary Transit Loop Rerouting Advisory",
      message:
        `Special transit advisory for ${activeMuniName}: Temporary PUJ reroute in effect along central corridors. Commuters are advised to plan accordingly.`,
      category: "broadcast_by_admin",
      severity: "warning",
    },
    {
      label: "Broadcast by LGU: LTFRB Fare Adjustment",
      title: "Official LTFRB Fare Adjustment Notice",
      message:
        `Please be advised that updated jeepney fare tariffs are now in effect for all ${activeMuniName} transit routes.`,
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
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            marginBottom: "28px",
          }}
        >
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
            {/* JURISDICTION SELECTOR OR BADGE */}
            {isAdmin && (
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Target Municipal Jurisdiction</label>
                <select
                  className="form-select"
                  value={targetMunicipality}
                  onChange={(e) => setTargetMunicipality(e.target.value)}
                  style={{ fontWeight: "600" }}
                >
                  <option value="all">🌐 All Municipalities (System-Wide)</option>
                  <option value="Dagupan">Dagupan City</option>
                  <option value="Calasiao">Calasiao</option>
                  <option value="Binmaley">Binmaley</option>
                  <option value="Lingayen">Lingayen</option>
                  <option value="Mangaldan">Mangaldan</option>
                </select>
              </div>
            )}

            {isLgu && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: colors.primary + "15",
                  border: `1px solid ${colors.primary}33`,
                  marginBottom: "14px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                <span>📍 Jurisdiction:</span>
                <span>Restricted to LGU {user?.municipality || "Dagupan"} Commuters</span>
              </div>
            )}

            {isPoso && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(217, 119, 6, 0.15)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  marginBottom: "14px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#D97706",
                }}
              >
                <span>🛡️ Field Enforcer:</span>
                <span>Drafting for LGU {user?.municipality || "Dagupan"} Approval Desk</span>
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
                    <option value="broadcast_by_admin">📢 Broadcast by LGU</option>
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
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">Advisory Details & Instructions *</label>
              <textarea
                rows={4}
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

            {/* EVIDENCE PHOTO UPLOAD (LGU / POSO CREDIBILITY) */}
            <div
              className="form-group"
              style={{
                marginBottom: "20px",
                padding: "14px",
                backgroundColor: colors.surfaceElevated,
                borderRadius: "10px",
                border: `1px solid ${colors.border}`,
              }}
            >
              <label
                className="form-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: "8px",
                }}
              >
                <Camera size={15} color={colors.primary} />
                <span>Evidence Photo / Advisory Document (Optional — Increases Public Credibility)</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    cursor: uploadingPhoto ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <Upload size={14} />
                  <span>{uploadingPhoto ? "Uploading Photo..." : "Attach Evidence Photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    disabled={uploadingPhoto}
                    onChange={handleEvidencePhotoSelect}
                  />
                </label>

                {evidencePhotoUrl && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "4px 8px",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <img
                      src={getEvidenceImageUrl(evidencePhotoUrl)}
                      alt="Broadcast Evidence"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: `1px solid ${colors.border}`,
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>
                      Photo Attached ✓
                    </span>
                    <button
                      type="button"
                      onClick={() => setEvidencePhotoUrl("")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "2px 6px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <span style={{ fontSize: "11px", color: colors.textMuted, marginTop: "6px", display: "block" }}>
                Accepted: JPG, PNG, WebP up to 5MB. Verified image will be embedded directly in the commuter advisory card.
              </span>
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
          <div
            className="card"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
            }}
          >
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
        <div
          className="card"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            marginTop: "24px",
          }}
        >
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

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              ✕ Close
            </button>
            <img
              src={previewModalImage}
              alt="High resolution evidence"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
