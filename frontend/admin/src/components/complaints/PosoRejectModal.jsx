import React, { useState } from "react";
import { XCircle, X, AlertTriangle } from "lucide-react";

const REJECTION_REASONS = [
  { value: "Insufficient Evidence", label: "Insufficient / Inconclusive Photo Evidence" },
  { value: "Invalid Vehicle Plate", label: "Invalid or Unregistered Vehicle / Plate Number" },
  { value: "Outside Dagupan Jurisdiction", label: "Incident occurred outside Dagupan City route jurisdiction" },
  { value: "Not a Violation", label: "Reported incident does not constitute an LTFRB/LGU traffic violation" },
  { value: "Duplicate Report", label: "Duplicate grievance report already being processed" },
  { value: "Other", label: "Other inspection findings (specify in remarks)" },
];

const PosoRejectModal = ({
  isOpen,
  complaint,
  onClose,
  onConfirm,
  loading,
}) => {
  const [reason, setReason] = useState(REJECTION_REASONS[0].value);
  const [remarks, setRemarks] = useState("");

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(complaint, reason, remarks);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <XCircle size={20} color="#EF4444" />
            <h3 className="modal-title" style={{ margin: 0 }}>
              Reject Commuter Complaint
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#DC2626", marginBottom: "4px" }}>
                Target: {complaint.subject}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Vehicle Plate: <strong>{complaint.vehiclePlateNumber || "Unspecified"}</strong> | Category: <strong>{complaint.category}</strong>
              </div>
            </div>

            <div>
              <label className="form-label">
                Official Rejection Reason *
              </label>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%" }}
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Officer Remarks & Verification Findings *
              </label>
              <textarea
                className="form-input"
                rows={4}
                required
                placeholder="Explain the specific reason why this complaint cannot be endorsed (e.g., Video did not show overcharging; Plate number verified not in PUJ franchise database)."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                The reporting commuter will be notified of this rejection decision and reason.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <XCircle size={16} />
              <span>{loading ? "Rejecting..." : "Reject Complaint"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosoRejectModal;
