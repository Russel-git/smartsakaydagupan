import React, { useState, useEffect } from "react";
import { XCircle, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/theme/ThemeContext";

const PosoRejectModal = ({
  isOpen,
  complaint,
  onClose,
  onConfirm,
  loading,
  municipality,
}) => {
  const { user, admin } = useAuth();
  const { colors } = useTheme();

  const currentMuni =
    complaint?.municipality ||
    municipality ||
    user?.municipality ||
    admin?.municipality ||
    "Dagupan";

  const rejectionReasons = [
    { value: "Insufficient Evidence", label: "Insufficient / Inconclusive Photo Evidence" },
    { value: "Invalid Vehicle Plate", label: "Invalid or Unregistered Vehicle / Plate Number" },
    {
      value: `Outside ${currentMuni} Jurisdiction`,
      label: `Incident occurred outside ${currentMuni} route jurisdiction`,
    },
    { value: "Not a Violation", label: "Reported incident does not constitute an LTFRB/LGU traffic violation" },
    { value: "Duplicate Report", label: "Duplicate grievance report already being processed" },
    { value: "Other", label: "Other inspection findings (specify in remarks)" },
  ];

  const standardRejectionRemarks = [
    "Insufficient or inconclusive photo / video evidence",
    "Vehicle plate number unreadable or unregistered",
    `Incident occurred outside ${currentMuni} route jurisdiction`,
    "Fare charged is within official LTFRB / LGU fare matrix",
    "Reported incident does not constitute a traffic violation",
    "Duplicate grievance report already being processed",
    "Vehicle and driver cleared upon on-site field verification",
    "Parties reached mutual amicable settlement on-site",
  ];

  const [reason, setReason] = useState(rejectionReasons[0].value);
  const [selectedRemarks, setSelectedRemarks] = useState([]);
  const [isOtherRemarks, setIsOtherRemarks] = useState(false);
  const [otherRemarks, setOtherRemarks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason(rejectionReasons[0].value);
      setSelectedRemarks([]);
      setIsOtherRemarks(false);
      setOtherRemarks("");
      setError("");
    }
  }, [isOpen, complaint, currentMuni]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRemarksList = [...selectedRemarks];
    if (isOtherRemarks && otherRemarks.trim()) {
      finalRemarksList.push(otherRemarks.trim());
    }

    if (finalRemarksList.length === 0) {
      setError("Please select at least one rejection remark or specify in Others.");
      return;
    }

    onConfirm(complaint, reason, finalRemarksList.join("; "));
  };

  const surfaceElevated = colors?.surfaceElevated || "#F8FAFC";
  const borderColor = colors?.border || "#E2E8F0";
  const textPrimary = colors?.textPrimary || "#1E293B";
  const textSecondary = colors?.textSecondary || "#64748B";
  const primaryColor = colors?.primary || "#0284C7";

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "580px" }}>
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
              <label className="form-label" style={{ marginBottom: "6px" }}>
                Official Rejection Reason *
              </label>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%" }}
              >
                {rejectionReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox remarks + Others just like pinpoint terminal in LGU dashboard */}
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label" style={{ marginBottom: "6px" }}>
                Officer Remarks & Verification Findings *
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                  gap: "8px",
                  backgroundColor: surfaceElevated,
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${borderColor}`,
                }}
              >
                {standardRejectionRemarks.map((remark) => {
                  const isChecked = selectedRemarks.includes(remark);
                  return (
                    <label
                      key={remark}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: textPrimary,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedRemarks((prev) =>
                            checked
                              ? [...prev, remark]
                              : prev.filter((r) => r !== remark)
                          );
                          if (error) setError("");
                        }}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                      <span>{remark}</span>
                    </label>
                  );
                })}

                {/* Others Checkbox */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: primaryColor,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isOtherRemarks}
                    onChange={(e) => {
                      setIsOtherRemarks(e.target.checked);
                      if (error) setError("");
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  <span>Others</span>
                </label>
              </div>

              {/* Conditional Text Input for Others */}
              {isOtherRemarks && (
                <div style={{ marginTop: "10px" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      color: textSecondary,
                      marginBottom: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    Other Rejection Remarks / Findings:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`e.g. Video did not show overcharging; Plate number verified not in ${currentMuni} PUJ database`}
                    value={otherRemarks}
                    onChange={(e) => {
                      setOtherRemarks(e.target.value);
                      if (error) setError("");
                    }}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "6px" }}>
                  {error}
                </div>
              )}

              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", display: "block" }}>
                The reporting commuter will be notified of this rejection decision by {currentMuni} POSO.
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
