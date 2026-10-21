import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Eye,
  X,
  Send,
  FileText,
  Trash2,
  Image as ImageIcon,
  ShieldAlert,
  Car,
  XCircle,
  CircleCheck,
} from "lucide-react";

import { complaintsAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme/ThemeContext";

import DeleteReasonModal from "../components/complaints/DeleteReasonModal";
import LguActionModal from "../components/complaints/LguActionModal";
import PosoEndorseModal from "../components/complaints/PosoEndorseModal";
import PosoFieldReportModal from "../components/complaints/PosoFieldReportModal";
import PosoRejectModal from "../components/complaints/PosoRejectModal";

const getImageUrl = (photoUrl) => {
  if (!photoUrl) return "";

  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" &&
    window.location &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? "https://smartsakay-backend.onrender.com/api"
      : "http://localhost:5000/api");

  const backendUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${backendUrl}${photoUrl}`;
};

const ComplaintsPage = () => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isAdmin, isLgu, isPoso } = useAuth();
  const location = useLocation();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Filters & Tabs
  const [posoTab, setPosoTab] = useState("pending"); // "pending" | "endorsed"
  const [lguTab, setLguTab] = useState("pending"); // "pending" | "resolved"
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetForDelete, setTargetForDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lguModalConfig, setLguModalConfig] = useState({
    isOpen: false,
    mode: "action",
    complaint: null,
    loading: false,
  });

  const [endorseModalOpen, setEndorseModalOpen] = useState(false);
  const [targetForEndorse, setTargetForEndorse] = useState(null);
  const [endorseLoading, setEndorseLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetForReject, setTargetForReject] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [fieldReportModalOpen, setFieldReportModalOpen] = useState(false);
  const [fieldReportLoading, setFieldReportLoading] = useState(false);

  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch Complaints
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

  // Handle location navigation state (e.g. from POSO dashboard quick actions)
  useEffect(() => {
    if (!loading && complaints.length > 0 && location.state) {
      if (location.state.openFieldReport) {
        setFieldReportModalOpen(true);
      }
      if (location.state.selectedComplaintId) {
        const target = complaints.find(
          (c) => c._id === location.state.selectedComplaintId,
        );
        if (target) {
          if (location.state.autoEndorse) {
            setTargetForEndorse(target);
            setEndorseModalOpen(true);
          } else {
            setSelectedComplaint(target);
          }
        }
      }
    }
  }, [loading, complaints, location.state]);

  // POSO → Endorse to LGU
  const handleOpenEndorse = (complaint) => {
    setTargetForEndorse(complaint);
    setEndorseModalOpen(true);
  };

  const handleConfirmEndorse = async (complaint, notes) => {
    setEndorseLoading(true);
    try {
      const { data } = await complaintsAPI.endorse(complaint._id, {
        endorsementNotes: notes.trim(),
      });

      showSuccess(
        "Endorsed to LGU",
        `Complaint "${complaint.subject}" verified and forwarded to Dagupan LGU. Case #: ${
          data.data?.lguCaseNumber || "Assigned"
        }.`,
      );

      setEndorseModalOpen(false);
      setTargetForEndorse(null);

      if (selectedComplaint?._id === complaint._id) {
        setSelectedComplaint(data.data);
      }

      fetchComplaints();
    } catch (err) {
      showError(
        "Endorsement Failed",
        err.response?.data?.message || "Could not endorse complaint to LGU.",
      );
    } finally {
      setEndorseLoading(false);
    }
  };

  // POSO → Reject Complaint
  const handleOpenReject = (complaint) => {
    setTargetForReject(complaint);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (complaint, reason, remarks) => {
    setRejectLoading(true);
    try {
      await complaintsAPI.rejectComplaint(complaint._id, {
        reason,
        remarks: (remarks || "").trim(),
      });

      showSuccess(
        "Complaint Rejected",
        `Report "${complaint.subject}" has been rejected (${reason}).`,
      );

      setRejectModalOpen(false);
      setTargetForReject(null);

      if (selectedComplaint?._id === complaint._id) {
        setSelectedComplaint(null);
      }

      fetchComplaints();
    } catch (err) {
      showError(
        "Rejection Failed",
        err.response?.data?.message || "Could not reject complaint.",
      );
    } finally {
      setRejectLoading(false);
    }
  };

  // POSO → File Direct Field Report
  const handleSubmitFieldReport = async (reportData) => {
    setFieldReportLoading(true);
    try {
      const { data } = await complaintsAPI.fileFieldReport(reportData);

      showSuccess(
        "Violation Report Filed",
        `Direct road report "${data.data?.subject}" filed and escalated to Dagupan LGU (Case: ${
          data.data?.lguCaseNumber || "Assigned"
        }).`,
      );

      setFieldReportModalOpen(false);
      fetchComplaints();
    } catch (err) {
      showError(
        "Submission Failed",
        err.response?.data?.message || "Could not submit violation report.",
      );
    } finally {
      setFieldReportLoading(false);
    }
  };

  // Delete (Admin / Oversight)
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

  // LGU Action / Termination
  const handleOpenLguModal = (complaint, mode) => {
    setLguModalConfig({
      isOpen: true,
      mode,
      complaint,
      loading: false,
    });
  };

  const handleConfirmLguAction = async (
    complaint,
    mode,
    notes,
    evidencePhoto,
  ) => {
    setLguModalConfig((prev) => ({ ...prev, loading: true }));
    try {
      if (mode === "action") {
        const { data } = await complaintsAPI.lguAction(complaint._id, {
          lguActionNotes: notes,
          lguEvidencePhoto: evidencePhoto || null,
        });

        showSuccess(
          "LGU Action Recorded",
          `Enforcement action saved for case ${data.data.lguCaseNumber}.`,
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

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 8px",
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
      case "pending":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "#D97706",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            {statusDot("#D97706")}
            Pending Road Verification
          </span>
        );

      case "under_review":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#2563EB",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            {statusDot("#2563EB")}
            Under Review
          </span>
        );

      case "endorsed_to_lgu":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(147, 51, 234, 0.15)",
              color: "#9333EA",
              border: "1px solid rgba(147, 51, 234, 0.3)",
            }}
          >
            {statusDot("#9333EA")}
            Endorsed to LGU
          </span>
        );

      case "action_taken":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            {statusDot("#059669")}
            Action Taken
          </span>
        );

      case "terminated":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(100, 116, 139, 0.15)",
              color: "#475569",
              border: "1px solid rgba(100, 116, 139, 0.3)",
            }}
          >
            {statusDot("#475569")}
            Terminated / Closed
          </span>
        );

      case "deleted":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#DC2626",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            {statusDot("#DC2626")}
            Discarded
          </span>
        );

      case "rejected":
        return (
          <span
            style={{
              ...baseStyle,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#DC2626",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            {statusDot("#DC2626")}
            Rejected by POSO
          </span>
        );

      default:
        return (
          <span
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

  // Filter complaints based on role and criteria
  const filteredComplaints = complaints.filter((c) => {
    // POSO Tabs filter
    if (isPoso) {
      if (posoTab === "pending") {
        if (c.status !== "pending" && c.status !== "under_review") {
          return false;
        }
      } else if (posoTab === "endorsed") {
        if (
          c.status !== "endorsed_to_lgu" &&
          c.status !== "action_taken" &&
          c.status !== "terminated"
        ) {
          return false;
        }
      }
    }

    // LGU Tabs filter
    if (isLgu) {
      if (lguTab === "pending") {
        if (c.status !== "endorsed_to_lgu") {
          return false;
        }
      } else if (lguTab === "resolved") {
        if (c.status !== "action_taken") {
          return false;
        }
      }
    }

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || c.category === categoryFilter;

    const subject = (c.subject || "").toLowerCase();
    const plate = (c.vehiclePlateNumber || "").toLowerCase();
    const caseNum = (c.lguCaseNumber || "").toLowerCase();
    const officerBadge = (c.posoBadgeNumber || "").toLowerCase();

    const query = search.toLowerCase();

    const matchesSearch =
      subject.includes(query) ||
      plate.includes(query) ||
      caseNum.includes(query) ||
      officerBadge.includes(query);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Count metrics for POSO tabs
  const pendingCount = complaints.filter(
    (c) => c.status === "pending" || c.status === "under_review",
  ).length;

  const endorsedCount = complaints.filter(
    (c) =>
      c.status === "endorsed_to_lgu" ||
      c.status === "action_taken" ||
      c.status === "terminated",
  ).length;

  // Count metrics for LGU tabs
  const lguPendingCount = complaints.filter(
    (c) => c.status === "endorsed_to_lgu",
  ).length;

  const resolvedCount = complaints.filter(
    (c) => c.status === "action_taken",
  ).length;

  return (
    <div>
      {/* PAGE HEADER */}
      <div
        style={{
          marginBottom: "24px",
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
                ? "POSO Complaints Hub"
                : isLgu
                  ? "LGU Action Desk - City of Dagupan"
                  : "Commuter Complaints & Grievance Hub"}
            </span>

            <span
              className="badge"
              style={{
                backgroundColor: isPoso
                  ? "rgba(217, 119, 6, 0.15)"
                  : isLgu
                    ? "rgba(16, 185, 129, 0.15)"
                    : colors.surfaceElevated,
                color: isPoso ? "#D97706" : isLgu ? "#059669" : colors.info,
                border: `1px solid ${colors.border}`,
                fontSize: "11px",
              }}
            >
              {isPoso
                ? "Field Enforcer Verification"
                : isLgu
                  ? "Enforcement Authority"
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
              ? "Verify commuter complaints on the road, inspect vehicle violations, endorse cases to Dagupan LGU, or directly file field citation reports."
              : isLgu
                ? "Receive verified complaints endorsed by POSO field enforcers, review road inspection remarks, record official sanctions, and terminate cases."
                : "Comprehensive audit records of commuter grievances, POSO on-road verifications, and LGU municipal enforcement actions."}
          </p>
        </div>

        {/* POSO DIRECT ACTION BUTTON */}
        {isPoso && (
          <button
            onClick={() => setFieldReportModalOpen(true)}
            className="btn"
            style={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            <Car size={18} />
            <span>File Direct Road Report</span>
          </button>
        )}
      </div>

      {/* POSO DEDICATED TABS */}
      {isPoso && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: "12px",
          }}
        >
          <button
            onClick={() => setPosoTab("pending")}
            className="btn"
            style={{
              backgroundColor:
                posoTab === "pending" ? "#D97706" : colors.surface,
              color: posoTab === "pending" ? "#FFFFFF" : colors.textPrimary,
              border: `1px solid ${
                posoTab === "pending" ? "#D97706" : colors.border
              }`,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              padding: "8px 16px",
            }}
          >
            <ShieldAlert size={16} />
            <span>Pending Road Verification</span>
            <span
              style={{
                backgroundColor:
                  posoTab === "pending"
                    ? "rgba(0,0,0,0.2)"
                    : colors.surfaceElevated,
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "11px",
              }}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setPosoTab("endorsed")}
            className="btn"
            style={{
              backgroundColor:
                posoTab === "endorsed" ? "#059669" : colors.surface,
              color: posoTab === "endorsed" ? "#FFFFFF" : colors.textPrimary,
              border: `1px solid ${
                posoTab === "endorsed" ? "#059669" : colors.border
              }`,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              padding: "8px 16px",
            }}
          >
            <CircleCheck size={16} />
            <span>Endorsed to LGU</span>
            <span
              style={{
                backgroundColor:
                  posoTab === "endorsed"
                    ? "rgba(0,0,0,0.2)"
                    : colors.surfaceElevated,
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "11px",
              }}
            >
              {endorsedCount}
            </span>
          </button>
        </div>
      )}

      {/* LGU DEDICATED TABS */}
      {isLgu && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* AWAITING LGU ACTION TAB */}
          <button
            type="button"
            onClick={() => {
              setLguTab("pending");
              setStatusFilter("all");
            }}
            className="btn"
            style={{
              backgroundColor:
                lguTab === "pending" ? "#D97706" : colors.surface,
              color: lguTab === "pending" ? "#FFFFFF" : colors.textPrimary,
              border: `1px solid ${
                lguTab === "pending" ? "#D97706" : colors.border
              }`,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              padding: "8px 16px",
            }}
          >
            <ShieldAlert size={16} />

            <span>Awaiting LGU Action</span>

            <span
              style={{
                backgroundColor:
                  lguTab === "pending"
                    ? "rgba(0,0,0,0.2)"
                    : colors.surfaceElevated,
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "11px",
              }}
            >
              {lguPendingCount}
            </span>
          </button>

          {/* CASE RESOLVED TAB */}
          <button
            type="button"
            onClick={() => {
              setLguTab("resolved");
              setStatusFilter("all");
            }}
            className="btn"
            style={{
              backgroundColor:
                lguTab === "resolved" ? "#059669" : colors.surface,
              color: lguTab === "resolved" ? "#FFFFFF" : colors.textPrimary,
              border: `1px solid ${
                lguTab === "resolved" ? "#059669" : colors.border
              }`,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600",
              padding: "8px 16px",
            }}
          >
            <CircleCheck size={16} />

            <span>Case Resolved</span>

            <span
              style={{
                backgroundColor:
                  lguTab === "resolved"
                    ? "rgba(0,0,0,0.2)"
                    : colors.surfaceElevated,
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "11px",
              }}
            >
              {resolvedCount}
            </span>
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* SEARCH */}
        <div
          style={{
            position: "relative",
            flex: "1 1 240px",
            minWidth: "240px",
            maxWidth: "360px",
          }}
        >
          <input
            type="text"
            placeholder="Search subject, plate, case #, badge #..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATUS FILTER */}
        {isLgu ? (
          <select
            className="form-select"
            style={{
              width: "200px",
              maxWidth: "100%",
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <>
              <option value="all">All Statuses</option>
              <option value="endorsed_to_lgu">Awaiting LGU Action</option>
              <option value="action_taken">Action Taken</option>
            </>
          </select>
        ) : null}

        {/* CATEGORY FILTER */}
        <select
          className="form-select"
          style={{
            width: "200px",
            maxWidth: "100%",
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

        {/* CLEAR FILTERS */}
        {(search || statusFilter !== "all" || categoryFilter !== "all") && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* COMPLAINTS TABLE */}
      <div
        className="card"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: colors.textMuted,
            }}
          >
            Loading complaint records...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: colors.textMuted,
            }}
          >
            {isPoso && posoTab === "pending"
              ? "No pending complaints requiring road verification."
              : isPoso && posoTab === "endorsed"
                ? "No complaints endorsed to LGU yet."
                : isLgu && lguTab === "pending"
                  ? "No complaints are awaiting LGU action."
                  : isLgu && lguTab === "resolved"
                    ? "No resolved cases found."
                    : "No complaint records found matching criteria."}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Case / Subject</th>
                  <th>Source / Reporter</th>
                  <th>Category</th>
                  <th>Vehicle Plate</th>
                  <th>Status</th>
                  <th>POSO Officer</th>
                  <th>Evidence</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((c) => {
                  const hasPhotos = c.attachments && c.attachments.length > 0;
                  const isPosoFieldReport = c.source === "poso_field_report";

                  return (
                    <tr key={c._id}>
                      {/* CASE / SUBJECT */}
                      <td>
                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: colors.textPrimary,
                              fontWeight: "600",
                              lineHeight: "1.4",
                            }}
                          >
                            {c.subject}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              alignItems: "center",
                              marginTop: "2px",
                              flexWrap: "wrap",
                            }}
                          >
                            {isPosoFieldReport && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  backgroundColor: "rgba(220, 38, 38, 0.15)",
                                  color: "#DC2626",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  fontWeight: "700",
                                }}
                              >
                                POSO DIRECT REPORT
                              </span>
                            )}

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
                          </div>
                        </div>
                      </td>

                      {/* SOURCE / REPORTER */}
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            color: colors.textSecondary,
                          }}
                        >
                          {isPosoFieldReport
                            ? `POSO (Badge #${c.posoBadgeNumber || "Enforcer"})`
                            : c.userId?.firstName
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
                            padding: "4px 7px",
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

                      {/* STATUS */}
                      <td>{getStatusBadge(c.status)}</td>

                      {/* POSO OFFICER / BADGE */}
                      <td>
                        {c.posoBadgeNumber ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#D97706",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <ShieldAlert size={12} />
                            Badge #{c.posoBadgeNumber}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: colors.textMuted,
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </td>

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
                              padding: "4px 8px",
                            }}
                            title="Inspect Evidence Photo"
                          >
                            <ImageIcon size={13} color={colors.info} />
                            <span style={{ fontSize: "11px" }}>
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
                      <td style={{ fontSize: "12px", color: colors.textMuted }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: "max-content",
                            flexWrap: "nowrap",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {/* VIEW DETAILS */}
                          <button
                            type="button"
                            onClick={() => setSelectedComplaint(c)}
                            className="btn btn-sm btn-secondary"
                            title="Inspect Details"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "32px",
                              minHeight: "32px",
                              padding: "6px",
                              flexShrink: 0,
                            }}
                          >
                            <Eye
                              size={16}
                              strokeWidth={2}
                              style={{
                                display: "block",
                                flexShrink: 0,
                              }}
                            />
                          </button>

                          {/* POSO VERIFY & ENDORSE OR REJECT */}
                          {isPoso &&
                            (c.status === "pending" ||
                              c.status === "under_review") && (
                              <>
                                <button
                                  onClick={() => handleOpenEndorse(c)}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: "#D97706",
                                    color: "#FFFFFF",
                                    fontSize: "11px",
                                    padding: "5px 9px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontWeight: "600",
                                  }}
                                  title="Verify on road and endorse to Dagupan LGU"
                                >
                                  <Send size={12} />
                                  <span>Verify & Endorse</span>
                                </button>

                                <button
                                  onClick={() => handleOpenReject(c)}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                                    color: "#EF4444",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    fontSize: "11px",
                                    padding: "5px 9px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    fontWeight: "600",
                                  }}
                                  title="Reject commuter complaint"
                                >
                                  <XCircle size={12} />
                                  <span>Reject Complain</span>
                                </button>
                              </>
                            )}

                          {/* LGU ACTIONS (Action Taken & Resolve) */}
                          {isLgu && (
                            <>
                              {c.status === "action_taken" ? (
                                <button
                                  disabled
                                  className="btn btn-sm bg-none border border-gray-300 dark:border-gray-500 color-black dark:color-white"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    cursor: "default",
                                    opacity: 1,
                                    fontSize: "11px",
                                    padding: "5px 9px",
                                  }}
                                >
                                  <CircleCheck size={14} />
                                  <span>Case Resolved</span>
                                </button>
                              ) : c.status === "deleted" ||
                                c.status === "terminated" ? null : (
                                <>
                                  <button
                                    onClick={() =>
                                      handleOpenLguModal(c, "action")
                                    }
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: "#059669",
                                      color: "#FFFFFF",
                                      fontSize: "11px",
                                      padding: "5px 9px",
                                    }}
                                  >
                                    <CircleCheck size={14} />
                                    Take Action
                                  </button>

                                  <button
                                    onClick={() => handleOpenDelete(c)}
                                    className="btn btn-sm"
                                    style={{
                                      cursor: "pointer",
                                      backgroundColor: "#EF44441F",
                                      color: "#DC2626",
                                      fontSize: "11px",
                                      padding: "5px 9px",
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Remove Complaint</span>
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

      {/* INSPECTION / DETAILS MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileText size={20} color={colors.primary} />
                <h2
                  style={{
                    fontSize: "18px",
                    margin: 0,
                    color: colors.textPrimary,
                  }}
                >
                  Complaint & Violation Record
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
              {/* SUBJECT & STATUS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: colors.textPrimary,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {selectedComplaint.subject}
                  </h3>
                  <span style={{ fontSize: "12px", color: colors.textMuted }}>
                    {selectedComplaint.source === "poso_field_report"
                      ? `Filed directly by POSO Field Enforcer (Badge #${
                          selectedComplaint.posoBadgeNumber || "Unassigned"
                        })`
                      : `Reported by ${
                          selectedComplaint.userId?.firstName || "Citizen"
                        } ${selectedComplaint.userId?.lastName || ""} (${
                          selectedComplaint.userId?.email || "Commuter"
                        })`}
                  </span>
                </div>
                {getStatusBadge(selectedComplaint.status)}
              </div>

              {/* LGU CASE TRACKING */}
              {selectedComplaint.lguCaseNumber && (
                <div
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#2563EB",
                      fontWeight: "700",
                    }}
                  >
                    Official Dagupan LGU Case Tracking #:{" "}
                    {selectedComplaint.lguCaseNumber}
                  </span>
                </div>
              )}

              {/* POSO ENDORSEMENT NOTICE */}
              {selectedComplaint.posoEndorsementNotes && (
                <div
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    padding: "12px 14px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#D97706",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ShieldAlert size={14} />
                    <span>
                      POSO Road Verification Notes (Officer Badge #
                      {selectedComplaint.posoBadgeNumber ||
                        selectedComplaint.posoOfficerId?.badgeNumber ||
                        "Active"}
                      )
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textPrimary }}>
                    {selectedComplaint.posoEndorsementNotes}
                  </div>
                  {selectedComplaint.posoEndorsedAt && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: colors.textMuted,
                        marginTop: "4px",
                      }}
                    >
                      Endorsed on:{" "}
                      {new Date(
                        selectedComplaint.posoEndorsedAt,
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* FULL DESCRIPTION */}
              <div>
                <label className="form-label">Full Incident Details</label>
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

              {/* VEHICLE & LOCATION */}
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
                      color: colors.textPrimary,
                      fontWeight: "700",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedComplaint.vehiclePlateNumber || "Not specified"}
                  </div>
                </div>

                <div>
                  <label className="form-label">Location / Zone</label>
                  <div style={{ fontSize: "13px", color: colors.textPrimary }}>
                    {selectedComplaint.location?.address ||
                      selectedComplaint.routeId?.name ||
                      "Dagupan City"}
                  </div>
                </div>
              </div>

              {/* PHOTOS */}
              {selectedComplaint.attachments &&
                selectedComplaint.attachments.length > 0 && (
                  <div>
                    <label className="form-label">Evidence Photos</label>
                    <div
                      style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                    >
                      {selectedComplaint.attachments.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxImage(photoUrl)}
                          style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: `2px solid ${colors.border}`,
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

              {/* LGU ENFORCEMENT ACTION */}
              {selectedComplaint.lguActionNotes && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#059669",
                      marginBottom: "4px",
                    }}
                  >
                    LGU Enforcement Action Taken
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textPrimary }}>
                    {selectedComplaint.lguActionNotes}
                  </div>
                  {selectedComplaint.sanctionIssued && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#059669",
                      }}
                    >
                      Sanction: {selectedComplaint.sanctionIssued}
                    </div>
                  )}

                  {selectedComplaint.lguEvidencePhoto && (
                    <div style={{ marginTop: "10px" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#059669",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ImageIcon size={13} />
                        Official LGU Action Evidence Photo
                      </div>
                      <div
                        onClick={() =>
                          setLightboxImage(
                            getImageUrl(selectedComplaint.lguEvidencePhoto),
                          )
                        }
                        style={{
                          width: "120px",
                          height: "90px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={getImageUrl(selectedComplaint.lguEvidencePhoto)}
                          alt="LGU Evidence"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LGU TERMINATION */}
              {selectedComplaint.lguTerminationNotes && (
                <div
                  style={{
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    padding: "12px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ fontSize: "13px", color: colors.textPrimary }}>
                    {selectedComplaint.lguTerminationNotes}
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div
              className="modal-footer"
              style={{ justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                {/* POSO IN-MODAL ENDORSE & REJECT BUTTONS */}
                {isPoso &&
                  (selectedComplaint.status === "pending" ||
                    selectedComplaint.status === "under_review") && (
                    <>
                      <button
                        onClick={() => {
                          const target = selectedComplaint;
                          setSelectedComplaint(null);
                          handleOpenEndorse(target);
                        }}
                        className="btn"
                        style={{
                          backgroundColor: "#D97706",
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Send size={14} />
                        <span>Verify & Endorse to LGU</span>
                      </button>

                      <button
                        onClick={() => {
                          const target = selectedComplaint;
                          setSelectedComplaint(null);
                          handleOpenReject(target);
                        }}
                        className="btn"
                        style={{
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <XCircle size={14} />
                        <span>Reject Complaint</span>
                      </button>
                    </>
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

      {/* POSO ENDORSE MODAL */}
      <PosoEndorseModal
        isOpen={endorseModalOpen}
        complaint={targetForEndorse}
        onClose={() => {
          setEndorseModalOpen(false);
          setTargetForEndorse(null);
        }}
        onConfirm={handleConfirmEndorse}
        loading={endorseLoading}
      />

      {/* POSO REJECT MODAL */}
      <PosoRejectModal
        isOpen={rejectModalOpen}
        complaint={targetForReject}
        onClose={() => {
          setRejectModalOpen(false);
          setTargetForReject(null);
        }}
        onConfirm={handleConfirmReject}
        loading={rejectLoading}
      />

      {/* POSO DIRECT FIELD REPORT MODAL */}
      <PosoFieldReportModal
        isOpen={fieldReportModalOpen}
        onClose={() => setFieldReportModalOpen(false)}
        onSubmit={handleSubmitFieldReport}
        loading={fieldReportLoading}
      />

      {/* DELETE REASON MODAL */}
      <DeleteReasonModal
        isOpen={deleteModalOpen}
        complaint={targetForDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* LGU ACTION MODAL */}
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

      {/* IMAGE LIGHTBOX */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{ background: "rgba(0, 0, 0, 0.85)", zIndex: 100000 }}
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
                color: "#FFFFFF",
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
