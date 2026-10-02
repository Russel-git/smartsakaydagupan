import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  MessageSquare,
  MapPin,
  Car,
  X,
  Check,
  Send,
  Building2,
  ShieldCheck,
  FileText,
  Trash2,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import api from "../api/client";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
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
  const { showSuccess, showError, showInfo } = useToast();
  const { admin, isSuperAdmin, isOperator, isLgu } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals state
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

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/complaints");
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

  // Operator Action: Verify & Send to LGU
  const handleVerifyToLgu = async (complaint) => {
    try {
      const { data } = await api.put(
        `/complaints/${complaint._id}/verify-lgu`,
        {
          adminNotes:
            "Verified by transit operators and escalated to Dagupan City POSO/LGU for enforcement.",
        },
      );
      showSuccess(
        "Endorsed to LGU",
        `Complaint "${complaint.subject}" has been verified. Case No: ${data.data?.lguCaseNumber || "Assigned"}.`,
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

  // Operator Action: Open Delete Reason Modal
  const handleOpenDelete = (complaint) => {
    setTargetForDelete(complaint);
    setDeleteModalOpen(true);
  };

  // Operator Action: Confirm Delete with Reason
  const handleConfirmDelete = async (
    complaint,
    deletionReason,
    deletionNotes,
  ) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/complaints/${complaint._id}`, {
        data: { deletionReason, deletionNotes },
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

  // LGU Action: Open Action / Terminate Modal
  const handleOpenLguModal = (complaint, mode) => {
    setLguModalConfig({
      isOpen: true,
      mode,
      complaint,
      loading: false,
    });
  };

  // LGU Action: Submit Action / Terminate
  const handleConfirmLguAction = async (complaint, mode, notes) => {
    setLguModalConfig((prev) => ({ ...prev, loading: true }));
    try {
      if (mode === "action") {
        const { data } = await api.put(
          `/complaints/${complaint._id}/lgu-action`,
          {
            lguActionNotes: notes,
          },
        );
        showSuccess(
          "LGU Action Recorded",
          `Enforcement action saved for case ${data.data.lguCaseNumber}.`,
        );
      } else {
        const { data } = await api.put(
          `/complaints/${complaint._id}/lgu-terminate`,
          {
            lguTerminationNotes: notes,
          },
        );
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
      setLguModalConfig((prev) => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning">● Pending Triage</span>;
      case "under_review":
        return <span className="badge badge-info">● Under Review</span>;
      case "endorsed_to_lgu":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(6, 182, 212, 0.15)",
              color: "#22d3ee",
              border: "1px solid rgba(6, 182, 212, 0.3)",
            }}
          >
            🏛️ Endorsed to LGU
          </span>
        );
      case "action_taken":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            🚨 Action Taken
          </span>
        );
      case "terminated":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              color: "#c084fc",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            ✓ Terminated / Resolved
          </span>
        );
      case "deleted":
        return <span className="badge badge-danger">🗑️ Discarded</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

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

  return (
    <div>
      {/* Top Page Header */}
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
              color: "#000000",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
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
                backgroundColor: isLgu
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(6, 182, 212, 0.15)",
                color: isLgu ? "#34d399" : "#22d3ee",
                border: `1px solid ${isLgu ? "rgba(16, 185, 129, 0.3)" : "rgba(6, 182, 212, 0.3)"}`,
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
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {isLgu
              ? "Receive verified complaints endorsed by transit operators, record official actions taken, and terminate resolved cases."
              : "Audit citizen grievances, inspect evidence photos, verify reports for LGU escalation, or delete improper reports with documented reasons."}
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
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
          style={{ maxWidth: "180px" }}
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
          style={{ maxWidth: "180px" }}
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

      {/* Complaints Table */}
      <div className="card">
        {filteredComplaints.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--text-muted)",
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
                      <td>
                        <div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#38bdf8",
                              fontWeight: "500",
                            }}
                          >
                            <span>{c.subject}</span>
                          </div>
                          {c.lguCaseNumber && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#38bdf8",
                                fontWeight: "500",
                              }}
                            >
                              {c.lguCaseNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "var(--text-main)",
                          }}
                        >
                          {c.userId?.firstName
                            ? `${c.userId.firstName} ${c.userId.lastName || ""}`
                            : "Commuter"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            textTransform: "capitalize",
                          }}
                        >
                          {c.category?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "var(--bg-surface-elevated)",
                            color: "#fbbf24",
                            border: "1px solid rgba(251, 191, 36, 0.3)",
                            fontFamily: "monospace",
                            fontSize: "12px",
                          }}
                        >
                          {c.vehiclePlateNumber || "N/A"}
                        </span>
                      </td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td>
                        {hasPhotos ? (
                          <button
                            onClick={() => setLightboxImage(c.attachments[0])}
                            className="btn btn-sm btn-secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                            }}
                            title="Inspect Evidence Photo"
                          >
                            <ImageIcon size={13} color="#38bdf8" />
                            <span style={{ fontSize: "11px" }}>
                              {c.attachments.length} Photo
                            </span>
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-dim)",
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>
                      <td
                        style={{ fontSize: "12px", color: "var(--text-dim)" }}
                      >
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="btn btn-sm btn-secondary"
                            title="Inspect Details"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Operator Actions */}
                          {(isOperator || isSuperAdmin) &&
                            c.status !== "deleted" && (
                              <>
                                {c.status !== "endorsed_to_lgu" &&
                                  c.status !== "action_taken" &&
                                  c.status !== "terminated" && (
                                    <button
                                      onClick={() => handleVerifyToLgu(c)}
                                      className="btn btn-sm btn-primary"
                                      style={{
                                        backgroundColor: "#0284c7",
                                        color: "white",
                                        fontSize: "11px",
                                        padding: "4px 8px",
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
                                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239, 68, 68, 0.25)",
                                    padding: "4px 8px",
                                  }}
                                  title="Delete Report (Requires Dropdown Reason)"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}

                          {/* LGU Actions */}
                          {(isLgu || isSuperAdmin) &&
                            c.status !== "deleted" && (
                              <>
                                {c.status !== "terminated" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleOpenLguModal(c, "action")
                                      }
                                      className="btn btn-sm"
                                      style={{
                                        backgroundColor:
                                          "rgba(16, 185, 129, 0.15)",
                                        color: "#34d399",
                                        border:
                                          "1px solid rgba(16, 185, 129, 0.3)",
                                        fontSize: "11px",
                                        padding: "4px 8px",
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
                                        backgroundColor:
                                          "rgba(139, 92, 246, 0.15)",
                                        color: "#c084fc",
                                        border:
                                          "1px solid rgba(139, 92, 246, 0.3)",
                                        fontSize: "11px",
                                        padding: "4px 8px",
                                      }}
                                      title="Terminate and Close Grievance"
                                    >
                                      Terminate
                                    </button>
                                  </>
                                )}
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

      {/* Details View Modal */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ maxWidth: "580px", maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={20} color="var(--primary)" />
                <h2 style={{ fontSize: "18px", margin: 0, color: "black" }}>
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
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", color: "black", margin: 0 }}>
                    {selectedComplaint.subject}
                  </h3>
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    Reported by {selectedComplaint.userId?.firstName}{" "}
                    {selectedComplaint.userId?.lastName} (
                    {selectedComplaint.userId?.email})
                  </span>
                </div>
                {getStatusBadge(selectedComplaint.status)}
              </div>

              {selectedComplaint.lguCaseNumber && (
                <div
                  style={{
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    padding: "10px 14px",
                    borderRadius: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#7dd3fc",
                      fontWeight: "bold",
                    }}
                  >
                    Official Dagupan LGU Case Tracking #:{" "}
                    {selectedComplaint.lguCaseNumber}
                  </span>
                </div>
              )}

              <div>
                <label className="form-label">Full Grievance Statement</label>
                <div
                  style={{
                    background: "var(--bg-surface-elevated)",
                    padding: "12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "var(--text-main)",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedComplaint.description}
                </div>
              </div>

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
                      color: "#fbbf24",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedComplaint.vehiclePlateNumber || "Not specified"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Associated Route</label>
                  <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                    {selectedComplaint.routeId?.name ||
                      "General Dagupan Transit"}
                  </div>
                </div>
              </div>

              {/* Attached Evidence Photos */}
              {selectedComplaint.attachments &&
                selectedComplaint.attachments.length > 0 && (
                  <div>
                    <label className="form-label">
                      Citizen Evidence Photos
                    </label>
                    <div
                      style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
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
                            border: "2px solid var(--border)",
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

              {/* LGU Official Actions Log */}
              {selectedComplaint.lguActionNotes && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    padding: "12px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#34d399",
                      marginBottom: "4px",
                    }}
                  >
                    🚨 LGU Enforcement Action Taken
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                    {selectedComplaint.lguActionNotes}
                  </div>
                </div>
              )}

              {/* LGU Termination Log */}
              {selectedComplaint.lguTerminationNotes && (
                <div
                  style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                    padding: "12px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#c084fc",
                      marginBottom: "4px",
                    }}
                  >
                    ✓ Case Officially Terminated & Resolved
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                    {selectedComplaint.lguTerminationNotes}
                  </div>
                </div>
              )}

              {/* Deletion Reason (If Discarded) */}
              {selectedComplaint.deletionReason && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    padding: "12px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#f87171",
                      marginBottom: "4px",
                    }}
                  >
                    🗑️ Report Discarded by Operator
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-main)" }}>
                    Reason: <strong>{selectedComplaint.deletionReason}</strong>
                  </div>
                  {selectedComplaint.deletionNotes && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      Notes: {selectedComplaint.deletionNotes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="modal-footer"
              style={{ justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                {(isOperator || isSuperAdmin) &&
                  selectedComplaint.status !== "deleted" &&
                  selectedComplaint.status !== "endorsed_to_lgu" &&
                  selectedComplaint.status !== "terminated" && (
                    <button
                      onClick={() => {
                        handleVerifyToLgu(selectedComplaint);
                      }}
                      className="btn btn-primary"
                      style={{ backgroundColor: "#0284c7" }}
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
                      style={{ backgroundColor: "#10b981", color: "white" }}
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

      {/* Delete Report Reason Modal */}
      <DeleteReasonModal
        isOpen={deleteModalOpen}
        complaint={targetForDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* LGU Action & Terminate Modal */}
      <LguActionModal
        isOpen={lguModalConfig.isOpen}
        mode={lguModalConfig.mode}
        complaint={lguModalConfig.complaint}
        onClose={() => setLguModalConfig({ ...lguModalConfig, isOpen: false })}
        onConfirm={handleConfirmLguAction}
        loading={lguModalConfig.loading}
      />

      {/* Lightbox Image Preview */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{ background: "rgba(0, 0, 0, 0.85)", zIndex: 1000 }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "85vw",
              maxHeight: "85vh",
            }}
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
                color: "white",
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
