import React, { useState, useEffect } from "react";
import {
  Archive,
  Megaphone,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Image as ImageIcon,
  Eye,
  AlertCircle,
  X,
  CheckCircle2,
  ShieldAlert,
  Car,
} from "lucide-react";
import { complaintsAPI, notificationsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getEvidenceImageUrl } from "../utils/imageUrl";

const ArchivesPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
  const { isAdmin, isLgu } = useAuth();

  // Active Tab: 'announcements' | 'complaints'
  const [activeTab, setActiveTab] = useState("announcements");

  // Data states
  const [archivedAnnouncements, setArchivedAnnouncements] = useState([]);
  const [deletedComplaints, setDeletedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // 'restore' | 'delete_permanent'
    category: "", // 'announcement' | 'complaint'
    item: null,
    loading: false,
  });

  // Inspection modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch archives
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const [announcementsRes, complaintsRes] = await Promise.allSettled([
        notificationsAPI.getFeed({ status: "archived", limit: 100 }),
        complaintsAPI.getAllComplaints({ status: "deleted", limit: 100 }),
      ]);

      if (announcementsRes.status === "fulfilled") {
        setArchivedAnnouncements(announcementsRes.value.data?.data || []);
      }
      if (complaintsRes.status === "fulfilled") {
        setDeletedComplaints(complaintsRes.value.data?.data || []);
      }
    } catch (err) {
      console.error("Error loading archives:", err);
      showError("Error", "Failed to retrieve archived records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // Handle Restore
  const handleOpenRestore = (item, category) => {
    setConfirmModal({
      isOpen: true,
      type: "restore",
      category,
      item,
      loading: false,
    });
  };

  // Handle Permanent Delete
  const handleOpenPermanentDelete = (item, category) => {
    setConfirmModal({
      isOpen: true,
      type: "delete_permanent",
      category,
      item,
      loading: false,
    });
  };

  // Confirm Action Execution
  const handleConfirmAction = async () => {
    const { type, category, item } = confirmModal;
    if (!item) return;

    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      if (category === "announcement") {
        if (type === "restore") {
          await notificationsAPI.restoreAnnouncement(item._id);
          showSuccess(
            "Announcement Restored",
            `"${item.title}" has been restored and republished to active city broadcasts.`,
          );
        } else {
          await notificationsAPI.deletePermanently(item._id);
          showInfo(
            "Permanently Deleted",
            `Announcement "${item.title}" was permanently purged from the database.`,
          );
        }
      } else {
        // Complaint
        if (type === "restore") {
          await complaintsAPI.restoreComplaint(item._id);
          showSuccess(
            "Complaint Restored",
            `Report "${item.subject}" restored and returned to active complaint registry.`,
          );
        } else {
          await complaintsAPI.deletePermanently(item._id);
          showInfo(
            "Permanently Deleted",
            `Complaint report "${item.subject}" was permanently deleted.`,
          );
        }
      }

      setConfirmModal({
        isOpen: false,
        type: "",
        category: "",
        item: null,
        loading: false,
      });

      if (selectedItem?._id === item._id) {
        setSelectedItem(null);
      }

      await fetchArchives();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        `Failed to ${type === "restore" ? "restore" : "permanently delete"} record.`;
      showError("Action Failed", errMsg);
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Filtered lists
  const filteredAnnouncements = archivedAnnouncements.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.message?.toLowerCase().includes(q) ||
      a.locationArea?.toLowerCase().includes(q)
    );
  });

  const filteredComplaints = deletedComplaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.vehiclePlateNumber?.toLowerCase().includes(q) ||
      c.deletionReason?.toLowerCase().includes(q) ||
      c.deletionNotes?.toLowerCase().includes(q) ||
      c.lguCaseNumber?.toLowerCase().includes(q)
    );
  });

  // Severity badge helper
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
            }}
          >
            <AlertCircle size={11} />
            CRITICAL
          </span>
        );
      case "warning":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#FEF3C7",
              color: "#D97706",
            }}
          >
            <AlertTriangle size={11} />
            WARNING
          </span>
        );
      default:
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#E0F2FE",
              color: "#0284C7",
            }}
          >
            INFO
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(100, 116, 139, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.textPrimary,
              }}
            >
              <Archive size={22} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: colors.textPrimary,
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Archives Hub
              </h1>
              <p style={{ margin: 0, fontSize: "13px", color: colors.textMuted }}>
                Manage archived City Announcements and soft-deleted Citizen Complaints with permanent purge or restore controls.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchArchives}
          className="btn btn-secondary"
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            padding: "8px 14px",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Archive Tabs */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "22px",
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("announcements");
            setSearchQuery("");
          }}
          className="btn"
          style={{
            backgroundColor:
              activeTab === "announcements" ? colors.primary : colors.surface,
            color: activeTab === "announcements" ? "#FFFFFF" : colors.textPrimary,
            border: `1px solid ${
              activeTab === "announcements" ? colors.primary : colors.border
            }`,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "700",
            padding: "9px 18px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <Megaphone size={16} />
          <span>Recent City Announcements</span>
          <span
            style={{
              backgroundColor:
                activeTab === "announcements"
                  ? "rgba(255,255,255,0.25)"
                  : colors.surfaceElevated,
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {archivedAnnouncements.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("complaints");
            setSearchQuery("");
          }}
          className="btn"
          style={{
            backgroundColor:
              activeTab === "complaints" ? "#DC2626" : colors.surface,
            color: activeTab === "complaints" ? "#FFFFFF" : colors.textPrimary,
            border: `1px solid ${
              activeTab === "complaints" ? "#DC2626" : colors.border
            }`,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "700",
            padding: "9px 18px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <Trash2 size={16} />
          <span>Deleted Complaints</span>
          <span
            style={{
              backgroundColor:
                activeTab === "complaints"
                  ? "rgba(255,255,255,0.25)"
                  : colors.surfaceElevated,
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            {deletedComplaints.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            maxWidth: "460px",
            display: "flex",
            alignItems: "center",
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          <Search size={16} color={colors.textMuted} />
          <input
            type="text"
            placeholder={
              activeTab === "announcements"
                ? "Search archived announcements by title, location..."
                : "Search deleted complaints by plate, reason, subject..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: colors.textPrimary,
              width: "100%",
              marginLeft: "8px",
            }}
          />
          {searchQuery && (
            <X
              size={14}
              color={colors.textMuted}
              style={{ cursor: "pointer" }}
              onClick={() => setSearchQuery("")}
            />
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RECENT CITY ANNOUNCEMENTS ARCHIVE */}
      {/* ======================================================== */}
      {activeTab === "announcements" && (
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            borderRadius: "14px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.background,
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>Announcement Title</th>
                  <th style={{ padding: "14px 16px" }}>Severity</th>
                  <th style={{ padding: "14px 16px" }}>Evidence</th>
                  <th style={{ padding: "14px 20px" }}>Message</th>
                  <th style={{ padding: "14px 20px" }}>Original Date</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}
                    >
                      Loading archived announcements...
                    </td>
                  </tr>
                ) : filteredAnnouncements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}
                    >
                      {searchQuery
                        ? "No archived announcements matched your search."
                        : "No city announcements are currently archived."}
                    </td>
                  </tr>
                ) : (
                  filteredAnnouncements.map((item) => {
                    const photo =
                      getEvidenceImageUrl(item.metadata?.evidencePhoto) ||
                      getEvidenceImageUrl(item.metadata?.photoUrl) ||
                      getEvidenceImageUrl(item.metadata?.evidenceUrl);

                    return (
                      <tr
                        key={item._id}
                        style={{
                          borderBottom: `1px solid ${colors.border}`,
                          transition: "background 150ms ease",
                        }}
                      >
                        {/* Title & Badge */}
                        <td style={{ padding: "14px 20px" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: colors.textPrimary,
                              fontSize: "13px",
                              lineHeight: "1.4",
                            }}
                          >
                            {item.title}
                          </div>
                          {item.locationArea && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: colors.textMuted,
                                display: "inline-block",
                                marginTop: "3px",
                              }}
                            >
                              📍 {item.locationArea}
                            </span>
                          )}
                        </td>

                        {/* Severity */}
                        <td style={{ padding: "14px 16px" }}>
                          {getSeverityBadge(item.severity)}
                        </td>

                        {/* Evidence Photo */}
                        <td style={{ padding: "14px 16px" }}>
                          {photo ? (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(photo)}
                              className="btn btn-sm btn-secondary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 8px",
                              }}
                              title="Zoom evidence"
                            >
                              <ImageIcon size={13} color={colors.primary} />
                              <span style={{ fontSize: "11px", fontWeight: "600" }}>View Photo</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: colors.textMuted }}>None</span>
                          )}
                        </td>

                        {/* Message Preview */}
                        <td
                          style={{
                            padding: "14px 20px",
                            color: colors.textSecondary,
                            maxWidth: "320px",
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: "1.4",
                            }}
                          >
                            {item.message}
                          </div>
                        </td>

                        {/* Original Date */}
                        <td
                          style={{
                            padding: "14px 20px",
                            color: colors.textMuted,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Calendar size={13} />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Actions (Restore & Delete Permanently) */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() => handleOpenRestore(item, "announcement")}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: "600",
                                fontSize: "11px",
                                padding: "5px 10px",
                              }}
                              title="Restore announcement to active feed"
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => handleOpenPermanentDelete(item, "announcement")}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: "600",
                                fontSize: "11px",
                                padding: "5px 10px",
                              }}
                              title="Delete permanently from database"
                            >
                              <Trash2 size={12} />
                              <span>Delete Permanently</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DELETED COMPLAINTS ARCHIVE */}
      {/* ======================================================== */}
      {activeTab === "complaints" && (
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            borderRadius: "14px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.background,
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.textMuted,
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>Case / Subject</th>
                  <th style={{ padding: "14px 16px" }}>Category</th>
                  <th style={{ padding: "14px 16px" }}>Vehicle Plate</th>
                  <th style={{ padding: "14px 20px" }}>Deletion Reason & Notes</th>
                  <th style={{ padding: "14px 16px" }}>Evidence</th>
                  <th style={{ padding: "14px 20px" }}>Deleted Date</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}
                    >
                      Loading deleted complaints...
                    </td>
                  </tr>
                ) : filteredComplaints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}
                    >
                      {searchQuery
                        ? "No deleted complaints matched your search."
                        : "No complaints in the deleted archive."}
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c) => {
                    const hasPhotos = c.attachments && c.attachments.length > 0;
                    const firstPhoto = hasPhotos ? getEvidenceImageUrl(c.attachments[0]) : null;

                    return (
                      <tr
                        key={c._id}
                        style={{
                          borderBottom: `1px solid ${colors.border}`,
                          transition: "background 150ms ease",
                        }}
                      >
                        {/* Case & Subject */}
                        <td style={{ padding: "14px 20px" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              color: colors.textPrimary,
                              fontSize: "13px",
                              lineHeight: "1.4",
                            }}
                          >
                            {c.subject}
                          </div>
                          {c.lguCaseNumber && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: colors.info,
                                fontFamily: "monospace",
                                fontWeight: "600",
                              }}
                            >
                              #{c.lguCaseNumber}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: colors.textSecondary,
                              textTransform: "capitalize",
                            }}
                          >
                            {c.category?.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Plate */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 6px",
                              borderRadius: "6px",
                              backgroundColor: colors.surfaceElevated,
                              color: colors.textPrimary,
                              border: `1px solid ${colors.border}`,
                              fontFamily: "monospace",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {c.vehiclePlateNumber || "N/A"}
                          </span>
                        </td>

                        {/* Deletion Reason & Notes */}
                        <td
                          style={{
                            padding: "14px 20px",
                            maxWidth: "280px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#DC2626",
                            }}
                          >
                            {c.deletionReason || "Removed by Admin / LGU"}
                          </div>
                          {c.deletionNotes && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: colors.textMuted,
                                marginTop: "3px",
                                fontStyle: "italic",
                              }}
                            >
                              "{c.deletionNotes}"
                            </div>
                          )}
                        </td>

                        {/* Evidence Photos */}
                        <td style={{ padding: "14px 16px" }}>
                          {hasPhotos ? (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(firstPhoto)}
                              className="btn btn-sm btn-secondary"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "4px 8px",
                              }}
                              title="Zoom evidence"
                            >
                              <ImageIcon size={13} color={colors.primary} />
                              <span style={{ fontSize: "11px", fontWeight: "600" }}>
                                {c.attachments.length} Photo{c.attachments.length !== 1 ? "s" : ""}
                              </span>
                            </button>
                          ) : (
                            <span style={{ fontSize: "12px", color: colors.textMuted }}>None</span>
                          )}
                        </td>

                        {/* Deleted Date */}
                        <td
                          style={{
                            padding: "14px 20px",
                            color: colors.textMuted,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Calendar size={13} />
                            {new Date(c.deletedAt || c.updatedAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Actions (Restore & Delete Permanently) */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              onClick={() => handleOpenRestore(c, "complaint")}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: "600",
                                fontSize: "11px",
                                padding: "5px 10px",
                              }}
                              title="Restore complaint to active action desk"
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => handleOpenPermanentDelete(c, "complaint")}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: "600",
                                fontSize: "11px",
                                padding: "5px 10px",
                              }}
                              title="Delete complaint permanently from database"
                            >
                              <Trash2 size={12} />
                              <span>Delete Permanently</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION MODAL (RESTORE / DELETE PERMANENTLY) */}
      {/* ======================================================== */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: confirmModal.type === "restore" ? "#059669" : "#DC2626",
                }}
              >
                {confirmModal.type === "restore" ? (
                  <RotateCcw size={20} />
                ) : (
                  <Trash2 size={20} />
                )}
                <h3 style={{ margin: 0, fontSize: "18px", color: colors.textPrimary }}>
                  {confirmModal.type === "restore"
                    ? `Restore Archived ${confirmModal.category === "announcement" ? "Announcement" : "Complaint"}`
                    : `Permanently Delete ${confirmModal.category === "announcement" ? "Announcement" : "Complaint"}`}
                </h3>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    type: "",
                    category: "",
                    item: null,
                    loading: false,
                  })
                }
                disabled={confirmModal.loading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "16px 0" }}>
              <div
                style={{
                  backgroundColor:
                    confirmModal.type === "restore"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${
                    confirmModal.type === "restore"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(239, 68, 68, 0.3)"
                  }`,
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "14px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                {confirmModal.type === "restore" ? (
                  <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                ) : (
                  <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                )}
                <div style={{ fontSize: "13px", lineHeight: "1.4", color: colors.textPrimary }}>
                  {confirmModal.type === "restore" ? (
                    <>
                      Restoring{" "}
                      <strong>
                        "{confirmModal.item?.title || confirmModal.item?.subject}"
                      </strong>
                      . This will return the record to the active workspace.
                    </>
                  ) : (
                    <>
                      <strong>Warning: Irreversible Action!</strong> You are about to permanently delete{" "}
                      <strong>
                        "{confirmModal.item?.title || confirmModal.item?.subject}"
                      </strong>{" "}
                      from the MongoDB database. This record cannot be recovered.
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={confirmModal.loading}
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    type: "",
                    category: "",
                    item: null,
                    loading: false,
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn"
                disabled={confirmModal.loading}
                onClick={handleConfirmAction}
                style={{
                  backgroundColor:
                    confirmModal.type === "restore" ? "#059669" : "#DC2626",
                  color: "#FFFFFF",
                  fontWeight: "600",
                }}
              >
                {confirmModal.loading
                  ? "Processing..."
                  : confirmModal.type === "restore"
                  ? "Confirm Restore"
                  : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{ zIndex: 1000 }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Archived Evidence"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                borderRadius: "12px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            />
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(0,0,0,0.65)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#FFFFFF",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivesPage;
