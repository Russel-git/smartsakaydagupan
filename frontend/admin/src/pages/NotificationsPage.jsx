import React, { useEffect, useState } from "react";
import { Send, Check, AlertCircle, Radio, Info, Tag } from "lucide-react";

import { notificationsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const NotificationsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();

  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [category, setCategory] = useState("broadcast_by_admin");
  const [targetUserId, setTargetUserId] = useState("");
  const [sendMode, setSendMode] = useState("all");

  const [sending, setSending] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // ============================================================
  // CATEGORY HELPERS
  // ============================================================

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "weather_updates":
        return "Weather Updates";

      case "complaint_updates":
        return "Complaint Updates";

      case "broadcast_by_admin":
      default:
        return "Broadcast by Admin";
    }
  };

  const getCategoryType = (cat) => {
    if (cat === "weather_updates") {
      return "weather_alert";
    }

    if (cat === "complaint_updates") {
      return "complaint_update";
    }

    return "broadcast";
  };

  // Theme-aware category colors
  const getCategoryColors = (cat) => {
    switch (cat) {
      case "weather_updates":
        return {
          background: colors.infoLight,
          border: colors.info,
          text: colors.info,
        };

      case "complaint_updates":
        return {
          background: colors.warningLight,
          border: colors.warning,
          text: colors.warning,
        };

      case "broadcast_by_admin":
      default:
        return {
          background: colors.surfaceElevated,
          border: colors.primary,
          text: colors.primary,
        };
    }
  };

  const getCategoryBadgeStyle = (item) => {
    const cat =
      item.category ||
      (item.type === "weather_alert"
        ? "weather_updates"
        : item.type === "complaint_update"
          ? "complaint_updates"
          : "broadcast_by_admin");

    const categoryColors = getCategoryColors(cat);

    return {
      background: categoryColors.background,
      border: categoryColors.border,
      color: categoryColors.text,
      label: getCategoryLabel(cat),
    };
  };

  // ============================================================
  // FETCH RECENT NOTIFICATIONS
  // ============================================================

  const fetchRecent = async () => {
    try {
      const { data } = await notificationsAPI.getRecent({
        limit: 15,
      });

      setRecentNotifications(data?.data || []);
    } catch (err) {
      // Recent history should not prevent the page from working.
      console.error("Failed to load recent notifications:", err);
      setRecentNotifications([]);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  const handleSend = async (e) => {
    e.preventDefault();

    setSending(true);
    setAlertMessage(null);

    const type = getCategoryType(category);

    try {
      if (sendMode === "all") {
        await notificationsAPI.broadcast({
          title,
          message: messageText,
          type,
          category,
        });

        const categoryLabel = getCategoryLabel(category);

        showSuccess(
          "Advisory Broadcasted",
          `Dispatched under "${categoryLabel}" to all active commuters.`,
        );

        setAlertMessage({
          type: "success",
          text: `Broadcast sent successfully under "${categoryLabel}" category!`,
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
          "Direct message sent to target commuter.",
        );

        setAlertMessage({
          type: "success",
          text: "Direct notification sent successfully!",
        });
      }

      setTitle("");
      setMessageText("");
      setTargetUserId("");

      fetchRecent();
    } catch (err) {
      const errText =
        err.response?.data?.message || "Failed to dispatch notification.";

      showError("Dispatch Failed", errText);

      setAlertMessage({
        type: "error",
        text: errText,
      });
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // TEMPLATE SELECTION
  // ============================================================

  const handleTemplateSelect = (template) => {
    setTitle(template.title);
    setMessageText(template.message);
    setCategory(template.category);
  };

  const templates = [
    {
      label: "Broadcast by Admin: General Advisory",
      title: "SmartSakay Official Transit Advisory",
      message:
        "Notice to all commuters: Expect normal PUJ and loop operations today across downtown Dagupan and intercity corridors.",
      category: "broadcast_by_admin",
    },
    {
      label: "Weather Updates: Heavy Rain / Flood Warning",
      title: "Severe Weather / Heavy Rain Travel Advisory",
      message:
        "Heavy localized rainfall and high tide expected across low-lying Dagupan corridors today. Commuters are advised to exercise caution and expect minor delays.",
      category: "weather_updates",
    },
    {
      label: "Complaint Updates: POSO Investigation Resolution",
      title: "Dagupan POSO Grievance Resolution Notice",
      message:
        "Action taken on reported transit grievance: Driver has been cited and referred to Dagupan POSO for administrative compliance.",
      category: "complaint_updates",
    },
    {
      label: "Broadcast by Admin: LTFRB Fare Adjustment",
      title: "Official LTFRB Fare Adjustment Notice",
      message:
        "Please be advised that updated jeepney fare tariffs are now in effect for all Dagupan City and Pangasinan routes.",
      category: "broadcast_by_admin",
    },
  ];

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "26px",
            color: colors.textPrimary,
            marginBottom: "4px",
          }}
        >
          In-App Broadcaster & Advisories
        </h1>

        <p
          style={{
            color: colors.textMuted,
            fontSize: "14px",
            margin: 0,
          }}
        >
          Dispatch categorized notifications (Weather Updates, Complaint
          Updates, Broadcast by Admin) to all Dagupan commuters.
        </p>
      </div>

      {/* ======================================================
          ALERT MESSAGE
      ====================================================== */}

      {alertMessage && (
        <div
          style={{
            background:
              alertMessage.type === "success"
                ? colors.successLight
                : colors.errorLight,
            border: `1px solid ${
              alertMessage.type === "success" ? colors.success : colors.error
            }`,
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color:
              alertMessage.type === "success" ? colors.success : colors.error,
            fontSize: "13px",
          }}
        >
          {alertMessage.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}

          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "24px",
        }}
      >
        {/* ====================================================
            BROADCAST COMPOSER
        ==================================================== */}

        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Radio size={20} color={colors.primary} />

            <h3
              style={{
                fontSize: "17px",
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              Compose Announcement
            </h3>
          </div>

          <form onSubmit={handleSend}>
            {/* SEND MODE */}

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

            {/* TARGET USER */}

            {sendMode === "user" && (
              <div className="form-group">
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

            {/* CATEGORY + TITLE */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div className="form-group">
                <label
                  className="form-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Tag size={14} color={colors.primary} />

                  <span>Notification Category</span>
                </label>

                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ fontWeight: "600" }}
                >
                  <option value="broadcast_by_admin">
                    📢 Broadcast by Admin
                  </option>

                  <option value="weather_updates">🌦️ Weather Updates</option>

                  <option value="complaint_updates">
                    📋 Complaint Updates
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notification Title</label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Severe Weather / Heavy Rain Travel Advisory"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            {/* MESSAGE */}

            <div className="form-group">
              <label className="form-label">Notification Body</label>

              <textarea
                rows={5}
                required
                placeholder="Type your official announcement here..."
                className="form-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            {/* SEND BUTTON */}

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
                backgroundColor: colors.primary,
                color: colors.white,
                border: `1px solid ${colors.primary}`,
                opacity: sending ? 0.7 : 1,
              }}
            >
              <Send size={16} />

              <span>
                {sending
                  ? "Transmitting Broadcast..."
                  : `Transmit as ${getCategoryLabel(category)}`}
              </span>
            </button>
          </form>
        </div>

        {/* ====================================================
            TEMPLATES + GUIDELINES
        ==================================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* TEMPLATES */}

          <div className="card">
            <h3
              style={{
                fontSize: "16px",
                color: colors.textPrimary,
                marginBottom: "14px",
              }}
            >
              Pre-approved Templates
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {templates.map((template, index) => {
                const categoryColors = getCategoryColors(template.category);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: colors.surfaceElevated,
                      border: `1px solid ${colors.border}`,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: categoryColors.text,
                      }}
                    >
                      {template.label}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                        marginTop: "3px",
                      }}
                    >
                      {template.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GUIDELINE */}

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
                color: colors.info,
                marginBottom: "8px",
              }}
            >
              <Info size={18} />

              <span
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Categorized Notifications
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
              Commuters can filter announcements into{" "}
              <strong style={{ color: colors.info }}>Weather Updates</strong>,{" "}
              <strong style={{ color: colors.warning }}>
                Complaint Updates
              </strong>
              , and{" "}
              <strong style={{ color: colors.primary }}>
                Broadcast by Admin
              </strong>{" "}
              on their mobile app.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          RECENT DISPATCHES
      ====================================================== */}

      {recentNotifications.length > 0 && (
        <div
          className="card"
          style={{
            marginTop: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              color: colors.textPrimary,
              marginBottom: "14px",
            }}
          >
            Recent Announcements
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
                  <th style={{ padding: "10px 8px" }}>Category</th>

                  <th style={{ padding: "10px 8px" }}>Title</th>

                  <th style={{ padding: "10px 8px" }}>Message Preview</th>

                  <th style={{ padding: "10px 8px" }}>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentNotifications.map((notification, index) => {
                  const badgeStyle = getCategoryBadgeStyle(notification);

                  return (
                    <tr
                      key={notification._id || index}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {/* CATEGORY */}

                      <td style={{ padding: "10px 8px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor: badgeStyle.background,
                            border: `1px solid ${badgeStyle.border}`,
                            color: badgeStyle.color,
                          }}
                        >
                          {badgeStyle.label}
                        </span>
                      </td>

                      {/* TITLE */}

                      <td
                        style={{
                          padding: "10px 8px",
                          fontWeight: "600",
                          color: colors.textPrimary,
                        }}
                      >
                        {notification.title}
                      </td>

                      {/* MESSAGE */}

                      <td
                        style={{
                          padding: "10px 8px",
                          color: colors.textMuted,
                          maxWidth: "300px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notification.message}
                      </td>

                      {/* DATE */}

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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
