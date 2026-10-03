import React, { useState, useEffect } from "react";
import {
  Eye,
  X,
  Send,
  FileText,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { complaintsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme/ThemeContext";

import DeleteReasonModal from "../components/complaints/DeleteReasonModal";
import LguActionModal from "../components/complaints/LguActionModal";

const getImageUrl = (photoUrl) => {
  if (!photoUrl) return "";

  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const backendUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${backendUrl}${photoUrl}`;
};

const ComplaintsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isSuperAdmin, isOperator, isLgu } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ============================================================
  // MODALS
  // ============================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetForDelete, setTargetForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lguModalConfig, setLguModalConfig] = useState({
    isOpen: false,
    mode: "action",
    complaint: null,
    loading: false,
  });

  const [lightboxImage, setLightboxImage] = useState(null);

  // ============================================================
  // FETCH COMPLAINTS
  // ============================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const { data } = await complaintsAPI.getAllComplaints();

      setComplaints(data.data || []);
    } catch (err) {
      console.error("Error fetching complaints:", err);

      showError("Error", "Failed to retrieve complaint records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ============================================================
  // OPERATOR → LGU
  // ============================================================

  const handleVerifyToLgu = async (complaint) => {
    try {
      const { data } = await complaintsAPI.verifyToLgu(complaint._id, {
        adminNotes:
          "Verified by transit operators and escalated to Dagupan City POSO/LGU for enforcement.",
      });

      showSuccess(
        "Endorsed to LGU",
        `Complaint "${complaint.subject}" has been verified. Case No: ${
          data.data?.lguCaseNumber || "Assigned"
        }.`,
      );

      fetchComplaints();

      if (selectedComplaint?._id === complaint._id) {
        setSelectedComplaint(data.data);
      }
    } catch (err) {
      showError(
        "Verification Failed",
        err.response?.data?.message || "Could not endorse complaint to LGU.",
      );
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleOpenDelete = (complaint) => {
    setTargetForDelete(complaint);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (
    complaint,
    deletionReason,
    deletionNotes,
  ) => {
    setDeleteLoading(true);

    try {
      await complaintsAPI.deleteComplaint(complaint._id, {
        deletionReason,
        deletionNotes,
      });

      showSuccess(
        "Complaint Removed",
        `Report "${complaint.subject}" soft-deleted. Reason: "${deletionReason}".`,
      );

      setDeleteModalOpen(false);
      setTargetForDelete(null);

      if (selectedComplaint?._id === complaint._id) {
        setSelectedComplaint(null);
      }

      fetchComplaints();
    } catch (err) {
      showError(
        "Deletion Failed",
        err.response?.data?.message || "Could not delete report.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================
  // LGU ACTION MODAL
  // ============================================================

  const handleOpenLguModal = (complaint, mode) => {
    setLguModalConfig({
      isOpen: true,
      mode,
      complaint,
      loading: false,
    });
  };

  // ============================================================
  // LGU ACTION / TERMINATION
  // ============================================================

  const handleConfirmLguAction = async (complaint, mode, notes) => {
    setLguModalConfig((prev) => ({
      ...prev,
      loading: true,
    }));

    try {
      if (mode === "action") {
        const { data } = await complaintsAPI.lguAction(complaint._id, {
          lguActionNotes: notes,
        });

        showSuccess(
          "LGU Action Recorded",
          `Enforcement action saved for case ${data.data.lguCaseNumber}.`,
        );
      } else {
        const { data } = await complaintsAPI.lguTerminate(complaint._id, {
          lguTerminationNotes: notes,
        });

        showSuccess(
          "Case Terminated",
          `Grievance case ${data.data.lguCaseNumber} officially closed.`,
        );
      }

      setLguModalConfig({
        isOpen: false,
        mode: "action",
        complaint: null,
        loading: false,
      });

      fetchComplaints();

      if (selectedComplaint?._id === complaint._id) {
        setSelectedComplaint(null);
      }
    } catch (err) {
      showError(
        "LGU Action Failed",
        err.response?.data?.message || "Failed to submit LGU update.",
      );

      setLguModalConfig((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getStatusBadge = (status) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "5px 9px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: "600",
      lineHeight: "1.1",
      whiteSpace: "nowrap",
    };

    const statusDot = (color) => (
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
    );

    switch (status) {
      // 🟠 PENDING
      case "pending":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.warningLight,
              color: colors.warning,
              border: `1px solid ${colors.warning}`,
            }}
          >
            {statusDot(colors.warning)}
            Pending Triage
          </span>
        );

      // 🔵 UNDER REVIEW
      case "under_review":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.infoLight,
              color: colors.info,
              border: `1px solid ${colors.info}`,
            }}
          >
            {statusDot(colors.info)}
            Under Review
          </span>
        );

      // 🔵 ENDORSED TO LGU
      case "endorsed_to_lgu":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.infoLight,
              color: colors.info,
              border: `1px solid ${colors.info}`,
            }}
          >
            {statusDot(colors.info)}
            Endorsed to LGU
          </span>
        );

      // 🟢 ACTION TAKEN
      case "action_taken":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.successLight,
              color: colors.success,
              border: `1px solid ${colors.success}`,
            }}
          >
            {statusDot(colors.success)}
            Action Taken
          </span>
        );

      // 🟠 TERMINATED / RESOLVED
      case "terminated":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.danger,
              color: colors.dangerLight,
              border: `1px solid ${colors.danger}`,
            }}
          >
            {statusDot(colors.white)}
            Terminated / Resolved
          </span>
        );

      // 🔴 DISCARDED
      case "deleted":
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.errorLight,
              color: colors.error,
              border: `1px solid ${colors.error}`,
            }}
          >
            {statusDot(colors.error)}
            Discarded
          </span>
        );

      default:
        return (
          <span
            className="badge"
            style={{
              ...baseStyle,
              backgroundColor: colors.surfaceElevated,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
            }}
          >
            {status}
          </span>
        );
    }
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || c.category === categoryFilter;

    const subject = (c.subject || "").toLowerCase();
    const plate = (c.vehiclePlateNumber || "").toLowerCase();
    const caseNum = (c.lguCaseNumber || "").toLowerCase();

    const query = search.toLowerCase();

    const matchesSearch =
      subject.includes(query) ||
      plate.includes(query) ||
      caseNum.includes(query);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              color: colors.textPrimary,
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>
              {isLgu
                ? "LGU Action Desk - City of Dagupan"
                : "Commuter Complaints & Grievance Hub"}
            </span>

            <span
              className="badge"
              style={{
                backgroundColor: colors.surfaceElevated,
                color: isLgu ? colors.success : colors.info,
                border: `1px solid ${colors.border}`,
                fontSize: "11px",
              }}
            >
              {isLgu
                ? "Enforcement Authority"
                : isOperator
                  ? "Operator Triage Desk"
                  : "System Oversight"}
            </span>
          </h1>

          <p
            style={{
              color: colors.textMuted,
              fontSize: "14px",
            }}
          >
            {isLgu
              ? "Receive verified complaints endorsed by transit operators, record official actions taken, and terminate resolved cases."
              : "Audit citizen grievances, inspect evidence photos, verify reports for LGU escalation, or delete improper reports with documented reasons."}
          </p>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: "240px",
            maxWidth: "360px",
          }}
        >
          <input
            type="text"
            placeholder="Search by subject, plate, or case #..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{
            maxWidth: "180px",
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="endorsed_to_lgu">Endorsed to LGU</option>
          <option value="action_taken">Action Taken</option>
          <option value="terminated">Terminated</option>

          {isSuperAdmin && <option value="deleted">Discarded (Deleted)</option>}
        </select>

        <select
          className="form-select"
          style={{
            maxWidth: "180px",
          }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="overcharging">Overcharging</option>
          <option value="reckless_driving">Reckless Driving</option>
          <option value="harassment">Harassment</option>
          <option value="route_deviation">Route Deviation</option>
          <option value="vehicle_condition">Vehicle Condition</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="card">
        {filteredComplaints.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: colors.textMuted,
            }}
          >
            No complaint records found matching current criteria.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case / Subject</th>
                  <th>Commuter</th>
                  <th>Category</th>
                  <th>Vehicle Plate</th>
                  <th>Status</th>
                  <th>Evidence</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((c) => {
                  const hasPhotos = c.attachments && c.attachments.length > 0;

                  return (
                    <tr key={c._id}>
                      {/* CASE / SUBJECT */}
                      <td>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: colors.info,
                              fontWeight: "600",
                              lineHeight: "1.4",
                            }}
                          >
                            {c.subject}
                          </div>

                          {c.lguCaseNumber && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: colors.textMuted,
                              }}
                            >
                              {c.lguCaseNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* COMMUTER */}
                      <td>
                        <span
                          style={{
                            fontSize: "13px",
                            color: colors.textPrimary,
                          }}
                        >
                          {c.userId?.firstName
                            ? `${c.userId.firstName} ${c.userId.lastName || ""}`
                            : "Commuter"}
                        </span>
                      </td>

                      {/* CATEGORY */}
                      <td>
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

                      {/* PLATE */}
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            backgroundColor: colors.surfaceElevated,
                            color: colors.textSecondary,
                            border: `1px solid ${colors.border}`,
                            fontFamily: "monospace",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {c.vehiclePlateNumber || "N/A"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>{getStatusBadge(c.status)}</td>

                      {/* EVIDENCE */}
                      <td>
                        {hasPhotos ? (
                          <button
                            onClick={() => setLightboxImage(c.attachments[0])}
                            className="btn btn-sm btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "5px 8px",
                            }}
                            title="Inspect Evidence Photo"
                          >
                            <ImageIcon size={13} color={colors.info} />

                            <span
                              style={{
                                fontSize: "11px",
                              }}
                            >
                              {c.attachments.length} Photo
                              {c.attachments.length !== 1 ? "s" : ""}
                            </span>
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: colors.textMuted,
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>

                      {/* DATE */}
                      <td
                        style={{
                          fontSize: "12px",
                          color: colors.textMuted,
                        }}
                      >
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* VIEW */}
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="btn btn-sm btn-secondary"
                            title="Inspect Details"
                          >
                            <Eye size={13} />
                          </button>

                          {/* OPERATOR ACTIONS */}
                          {(isOperator || isSuperAdmin) &&
                            c.status !== "deleted" && (
                              <>
                                {c.status !== "endorsed_to_lgu" &&
                                  c.status !== "action_taken" &&
                                  c.status !== "terminated" && (
                                    <button
                                      onClick={() => handleVerifyToLgu(c)}
                                      className="btn btn-sm"
                                      style={{
                                        backgroundColor: colors.infoLight,
                                        color: colors.info,
                                        border: `1px solid ${colors.border}`,
                                        fontSize: "11px",
                                        padding: "5px 8px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                      title="Verify and Escalate to Dagupan LGU"
                                    >
                                      <Send size={12} />
                                      <span>To LGU</span>
                                    </button>
                                  )}

                                <button
                                  onClick={() => handleOpenDelete(c)}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: colors.surface,
                                    color: colors.danger,
                                    border: `1px solid ${colors.border}`,
                                    padding: "5px 7px",
                                  }}
                                  title="Delete Report"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}

                          {/* LGU ACTIONS */}
                          {(isLgu || isSuperAdmin) &&
                            c.status !== "deleted" &&
                            c.status !== "terminated" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleOpenLguModal(c, "action")
                                  }
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: colors.surface,
                                    color: colors.success,
                                    border: `1px solid ${colors.border}`,
                                    fontSize: "11px",
                                    padding: "5px 8px",
                                  }}
                                  title="Take Administrative / Field Action"
                                >
                                  Take Action
                                </button>

                                <button
                                  onClick={() =>
                                    handleOpenLguModal(c, "terminate")
                                  }
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: colors.surface,
                                    color: colors.textSecondary,
                                    border: `1px solid ${colors.border}`,
                                    fontSize: "11px",
                                    padding: "5px 8px",
                                  }}
                                  title="Terminate and Close Grievance"
                                >
                                  Terminate
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedComplaint && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "580px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileText size={20} color={colors.primary} />

                <h2
                  style={{
                    fontSize: "18px",
                    margin: 0,
                    color: colors.textPrimary,
                  }}
                >
                  Complaint Inspection
                </h2>
              </div>

              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setSelectedComplaint(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    {selectedComplaint.subject}
                  </h3>

                  <span
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                    }}
                  >
                    Reported by {selectedComplaint.userId?.firstName}{" "}
                    {selectedComplaint.userId?.lastName} (
                    {selectedComplaint.userId?.email})
                  </span>
                </div>

                {getStatusBadge(selectedComplaint.status)}
              </div>

              {/* LGU CASE NUMBER */}
              {selectedComplaint.lguCaseNumber && (
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    padding: "10px 14px",
                    borderRadius: "7px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: colors.info,
                      fontWeight: "600",
                    }}
                  >
                    Official Dagupan LGU Case Tracking #:{" "}
                    {selectedComplaint.lguCaseNumber}
                  </span>
                </div>
              )}

              {/* STATEMENT */}
              <div>
                <label className="form-label">Full Grievance Statement</label>

                <div
                  style={{
                    background: colors.surfaceElevated,
                    padding: "12px",
                    borderRadius: "7px",
                    fontSize: "13px",
                    color: colors.textPrimary,
                    lineHeight: "1.5",
                  }}
                >
                  {selectedComplaint.description}
                </div>
              </div>

              {/* VEHICLE / ROUTE */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label className="form-label">Vehicle Plate</label>

                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary,
                      fontWeight: "600",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedComplaint.vehiclePlateNumber || "Not specified"}
                  </div>
                </div>

                <div>
                  <label className="form-label">Associated Route</label>

                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textPrimary,
                    }}
                  >
                    {selectedComplaint.routeId?.name ||
                      "General Dagupan Transit"}
                  </div>
                </div>
              </div>

              {/* PHOTOS */}
              {selectedComplaint.attachments &&
                selectedComplaint.attachments.length > 0 && (
                  <div>
                    <label className="form-label">
                      Citizen Evidence Photos
                    </label>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {selectedComplaint.attachments.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxImage(photoUrl)}
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: `2px solid ${colors.border}`,
                            position: "relative",
                          }}
                        >
                          <img
                            src={getImageUrl(photoUrl)}
                            alt="Evidence"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* LGU ACTION */}
              {selectedComplaint.lguActionNotes && (
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    padding: "12px",
                    borderRadius: "7px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: colors.success,
                      marginBottom: "4px",
                    }}
                  >
                    LGU Enforcement Action Taken
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textPrimary,
                    }}
                  >
                    {selectedComplaint.lguActionNotes}
                  </div>
                </div>
              )}

              {/* TERMINATION */}
              {selectedComplaint.lguTerminationNotes && (
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    padding: "12px",
                    borderRadius: "7px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: colors.textSecondary,
                      marginBottom: "4px",
                    }}
                  >
                    Case Officially Terminated & Resolved
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textPrimary,
                    }}
                  >
                    {selectedComplaint.lguTerminationNotes}
                  </div>
                </div>
              )}

              {/* DELETION */}
              {selectedComplaint.deletionReason && (
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    padding: "12px",
                    borderRadius: "7px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: colors.danger,
                      marginBottom: "4px",
                    }}
                  >
                    Report Discarded by Operator
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: colors.textPrimary,
                    }}
                  >
                    Reason: <strong>{selectedComplaint.deletionReason}</strong>
                  </div>

                  {selectedComplaint.deletionNotes && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                        marginTop: "4px",
                      }}
                    >
                      Notes: {selectedComplaint.deletionNotes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div
              className="modal-footer"
              style={{
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                {(isOperator || isSuperAdmin) &&
                  selectedComplaint.status !== "deleted" &&
                  selectedComplaint.status !== "endorsed_to_lgu" &&
                  selectedComplaint.status !== "terminated" && (
                    <button
                      onClick={() => handleVerifyToLgu(selectedComplaint)}
                      className="btn"
                      style={{
                        backgroundColor: colors.infoLight,
                        color: colors.info,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      Verify & Send to LGU
                    </button>
                  )}

                {(isLgu || isSuperAdmin) &&
                  selectedComplaint.status !== "terminated" && (
                    <button
                      onClick={() =>
                        handleOpenLguModal(selectedComplaint, "action")
                      }
                      className="btn"
                      style={{
                        backgroundColor: colors.successLight,
                        color: colors.success,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      Take Action
                    </button>
                  )}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}

      <DeleteReasonModal
        isOpen={deleteModalOpen}
        complaint={targetForDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* ======================================================
          LGU ACTION MODAL
      ====================================================== */}

      <LguActionModal
        isOpen={lguModalConfig.isOpen}
        mode={lguModalConfig.mode}
        complaint={lguModalConfig.complaint}
        onClose={() =>
          setLguModalConfig({
            ...lguModalConfig,
            isOpen: false,
          })
        }
        onConfirm={handleConfirmLguAction}
        loading={lguModalConfig.loading}
      />

      {/* ======================================================
          IMAGE LIGHTBOX
      ====================================================== */}

      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "85vw",
              maxHeight: "85vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(lightboxImage)}
              alt="Evidence Full View"
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />

            <button
              onClick={() => setLightboxImage(null)}
              className="btn btn-ghost btn-icon"
              style={{
                position: "absolute",
                top: "-40px",
                right: 0,
                color: colors.white,
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
