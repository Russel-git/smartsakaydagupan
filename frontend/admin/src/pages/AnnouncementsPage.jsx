import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  MapPin,
  Clock,
  Radio,
  PlusCircle,
  Eye,
  Archive,
} from "lucide-react";
import { notificationsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { getEvidenceImageUrl } from "../utils/imageUrl";
import { formatLguJurisdiction } from "../utils/lguHelpers";

const AnnouncementsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isAdmin, isLgu, isPoso, admin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await notificationsAPI.getRecent({ limit: 100 });
      setAnnouncements(data?.data || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenArchiveModal = (announcement) => {
    setArchiveTarget(announcement);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      await notificationsAPI.archiveAnnouncement(archiveTarget._id);
      showSuccess(
        "Announcement Archived",
        `"${archiveTarget.title}" has been moved to Archives.`,
      );
      if (selectedAnnouncement?._id === archiveTarget._id) {
        setSelectedAnnouncement(null);
      }
      setArchiveTarget(null);
      await fetchAnnouncements();
    } catch (err) {
      showError(
        "Archive Failed",
        err.response?.data?.message || "Failed to archive announcement.",
      );
    } finally {
      setArchiveLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
            }}
          >
            <AlertCircle size={12} />
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
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#FEF3C7",
              color: "#D97706",
            }}
          >
            <AlertTriangle size={12} />
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
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              backgroundColor: "#E0F2FE",
              color: "#0284C7",
            }}
          >
            <Info size={12} />
            INFO
          </span>
        );
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationArea?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || item.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: `${colors.primary}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.primary,
              }}
            >
              <Megaphone size={22} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "800",
                  color: colors.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                Recent City Announcements
              </h1>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "13px",
                  color: colors.textMuted,
                }}
              >
                Official {admin?.municipality ? formatLguJurisdiction(admin.municipality) : "Dagupan City"} public transit advisories, rerouting notices, and emergency broadcasts.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchAnnouncements}
            className="btn btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {(isAdmin || isLgu) && (
            <Link
              to="/notifications"
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <PlusCircle size={15} />
              <span>Broadcast Advisory</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: "1 1 280px",
            maxWidth: "450px",
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          <Search size={16} color={colors.textMuted} />
          <input
            type="text"
            placeholder="Search by title, location, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: colors.textPrimary,
              width: "100%",
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

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color={colors.textMuted} />
            <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: "600" }}>Severity:</span>
          </div>

          {["all", "critical", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                textTransform: "capitalize",
                backgroundColor:
                  severityFilter === sev ? colors.primary : colors.surfaceElevated,
                color: severityFilter === sev ? "#FFFFFF" : colors.textSecondary,
                transition: "all 150ms ease",
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div
        className="card"
        style={{
          backgroundColor: colors.surface,
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
                <th style={{ padding: "14px 20px" }}>Title</th>
                <th style={{ padding: "14px 16px" }}>Severity</th>
                <th style={{ padding: "14px 16px" }}>Evidence</th>
                <th style={{ padding: "14px 20px" }}>Message Preview</th>
                <th style={{ padding: "14px 20px" }}>Date</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: colors.textMuted }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px auto", display: "block" }} />
                    Loading official announcements...
                  </td>
                </tr>
              ) : filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: colors.textMuted }}>
                    <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 10px auto", display: "block" }} />
                    No city announcements found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((item, idx) => {
                  const rawPhoto =
                    item.metadata?.photoUrl ||
                    item.metadata?.evidencePhoto ||
                    item.photoUrl ||
                    item.metadata?.evidenceUrl;
                  const photo = rawPhoto ? getEvidenceImageUrl(rawPhoto) : null;

                  return (
                    <tr
                      key={item._id || idx}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        transition: "background-color 150ms ease",
                      }}
                      className="table-row-hover"
                    >
                      {/* Title */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: "700", color: colors.textPrimary }}>
                          {item.title}
                        </div>
                        {item.locationArea && (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              color: colors.textMuted,
                              marginTop: "2px",
                            }}
                          >
                            <MapPin size={11} color="#D97706" />
                            {item.locationArea}
                          </div>
                        )}
                      </td>

                      {/* Severity */}
                      <td style={{ padding: "14px 16px" }}>
                        {getSeverityBadge(item.severity)}
                      </td>

                      {/* Evidence Photo */}
                      <td style={{ padding: "14px 16px" }}>
                        {photo ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <div
                              onClick={() => setLightboxImage(photo)}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: `1px solid ${colors.border}`,
                                cursor: "pointer",
                                flexShrink: 0,
                                backgroundColor: colors.background,
                              }}
                              title="Click to zoom evidence"
                            >
                              <img
                                src={photo}
                                alt="Evidence"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setLightboxImage(photo)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: colors.primary,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: colors.textMuted }}>None</span>
                        )}
                      </td>

                      {/* Message Preview */}
                      <td
                        style={{
                          padding: "14px 20px",
                          color: colors.textSecondary,
                          maxWidth: "340px",
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.message}
                        </div>
                      </td>

                      {/* Date */}
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
                        <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedAnnouncement(item)}
                            className="btn btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {(isAdmin || isLgu) && (
                            <button
                              type="button"
                              onClick={() => handleOpenArchiveModal(item)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "rgba(100, 116, 139, 0.12)",
                                color: colors.textSecondary,
                                border: `1px solid ${colors.border}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                              title="Move announcement to archives"
                            >
                              <Archive size={13} />
                              <span>Archive</span>
                            </button>
                          )}
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

      {/* DETAIL MODAL */}
      {selectedAnnouncement && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedAnnouncement(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              maxWidth: "560px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  {getSeverityBadge(selectedAnnouncement.severity)}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: colors.background,
                      color: colors.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedAnnouncement.category?.replace(/_/g, " ") || "Broadcast"}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: "800",
                    color: colors.textPrimary,
                    lineHeight: "1.3",
                  }}
                >
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: colors.textMuted,
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Evidence Photo (if attached) */}
              {(selectedAnnouncement.metadata?.photoUrl ||
                selectedAnnouncement.metadata?.evidencePhoto ||
                selectedAnnouncement.photoUrl) && (
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#10B981",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ImageIcon size={14} />
                    OFFICIAL VERIFIED EVIDENCE PHOTO
                  </div>
                  <div
                    onClick={() =>
                      setLightboxImage(
                        getEvidenceImageUrl(
                          selectedAnnouncement.metadata?.photoUrl ||
                            selectedAnnouncement.metadata?.evidencePhoto ||
                            selectedAnnouncement.photoUrl
                        )
                      )
                    }
                    style={{
                      width: "100%",
                      height: "220px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: `1px solid ${colors.border}`,
                      cursor: "pointer",
                      position: "relative",
                      backgroundColor: colors.background,
                    }}
                  >
                    <img
                      src={getEvidenceImageUrl(
                        selectedAnnouncement.metadata?.photoUrl ||
                          selectedAnnouncement.metadata?.evidencePhoto ||
                          selectedAnnouncement.photoUrl
                      )}
                      alt="Verified Evidence"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        backgroundColor: "rgba(0,0,0,0.65)",
                        color: "#FFFFFF",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Eye size={12} /> Click to Expand
                    </div>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: colors.textMuted, marginBottom: "6px" }}>
                  ADVISORY MESSAGE
                </div>
                <div
                  style={{
                    backgroundColor: colors.background,
                    padding: "14px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: colors.textPrimary,
                    lineHeight: "1.6",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {selectedAnnouncement.message}
                </div>
              </div>

              {/* Metadata details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: colors.background,
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ color: colors.textMuted, marginBottom: "2px" }}>Dispatched By</div>
                  <div style={{ fontWeight: "700", color: colors.textPrimary, textTransform: "uppercase" }}>
                    {selectedAnnouncement.createdByRole || "City Authority"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    backgroundColor: colors.background,
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ color: colors.textMuted, marginBottom: "2px" }}>Time Dispatched</div>
                  <div style={{ fontWeight: "700", color: colors.textPrimary }}>
                    {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {(isAdmin || isLgu) && (
                  <button
                    type="button"
                    onClick={() => handleOpenArchiveModal(selectedAnnouncement)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: "rgba(100, 116, 139, 0.12)",
                      color: colors.textSecondary,
                      border: `1px solid ${colors.border}`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 12px",
                      fontWeight: "600",
                    }}
                  >
                    <Archive size={14} />
                    <span>Move to Archives</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL LIGHTBOX FOR EVIDENCE PHOTO */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
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
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <X size={28} />
            </button>
            <img
              src={lightboxImage}
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
      {/* ARCHIVE CONFIRMATION MODAL */}
      {archiveTarget && (
        <div
          className="modal-backdrop"
          onClick={() => !archiveLoading && setArchiveTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: "14px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textPrimary }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(100, 116, 139, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.primary,
                  }}
                >
                  <Archive size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Archive Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={archiveLoading}
                style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  backgroundColor: "rgba(100, 116, 139, 0.08)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: "700", color: colors.textPrimary, marginBottom: "4px" }}>
                  "{archiveTarget.title}"
                </div>
                {archiveTarget.locationArea && (
                  <div style={{ fontSize: "12px", color: colors.textMuted }}>
                    📍 {archiveTarget.locationArea}
                  </div>
                )}
              </div>

              <p style={{ margin: 0, fontSize: "13px", color: colors.textSecondary, lineHeight: "1.5" }}>
                Are you sure you want to move this announcement to the <strong>Archives Hub</strong>? It will be safely removed from active commuter feeds and stored in Archives, where you can restore or permanently delete it.
              </p>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={archiveLoading}
                onClick={() => setArchiveTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={archiveLoading}
                onClick={handleConfirmArchive}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Archive size={14} />
                <span>{archiveLoading ? "Archiving..." : "Confirm Archive"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
