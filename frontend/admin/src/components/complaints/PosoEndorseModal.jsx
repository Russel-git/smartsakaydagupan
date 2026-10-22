import React, { useState, useEffect } from "react";
import { ShieldAlert, X, Send } from "lucide-react";
import { useTheme } from "../../contexts/theme/ThemeContext";

const STANDARD_ENDORSEMENT_REMARKS = [
  "Vehicle plate number verified on-site",
  "Driver identity confirmed with PUV registry",
  "Violation confirmed via CCTV / video footage",
  "Fare overcharging confirmed against Dagupan matrix",
  "Unauthorized route deviation / short-cutting confirmed",
  "Reckless driving verified through officer / witness report",
  "Vehicle physical defect / smoke-belching inspected",
  "Driver verbally notified of reported infraction on-site",
  "Commuter grievance statement validated",
];

const PosoEndorseModal = ({
  isOpen,
  complaint,
  onClose,
  onConfirm,
  loading,
}) => {
  const { colors } = useTheme();
  const [selectedRemarks, setSelectedRemarks] = useState([]);
  const [isOtherRemarks, setIsOtherRemarks] = useState(false);
  const [otherRemarks, setOtherRemarks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedRemarks([]);
      setIsOtherRemarks(false);
      setOtherRemarks("");
      setError("");
    }
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRemarksList = [...selectedRemarks];
    if (isOtherRemarks && otherRemarks.trim()) {
      finalRemarksList.push(otherRemarks.trim());
    }

    if (finalRemarksList.length === 0) {
      setError("Please select at least one inspection remark or specify in Others.");
      return;
    }

    onConfirm(complaint, finalRemarksList.join("; "));
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
            <ShieldAlert size={20} color="#D97706" />
            <h3 className="modal-title" style={{ margin: 0 }}>
              Verify & Endorse to Dagupan LGU
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
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400E", marginBottom: "4px" }}>
                Target: {complaint.subject}
              </div>
              <div style={{ fontSize: "12px", color: "#78350F" }}>
                Vehicle Plate: <strong>{complaint.vehiclePlateNumber || "Unspecified"}</strong> | Category: <strong>{complaint.category}</strong>
              </div>
            </div>

            {/* Checkbox remarks + Others just like pinpoint terminal in LGU dashboard */}
            <div className="form-group" style={{ marginBottom: "0" }}>
              <label className="form-label" style={{ marginBottom: "6px" }}>
                POSO Officer Road Inspection Remarks *
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
                {STANDARD_ENDORSEMENT_REMARKS.map((remark) => {
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
                    Other Remarks / Inspection Findings:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plate verified along Perez Blvd, driver admitted infraction, second warning issued"
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
                This grievance will be formally forwarded to the Dagupan City Transport Authority Action Desk.
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
                backgroundColor: "#D97706",
                color: "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Send size={16} />
              <span>{loading ? "Endorsing..." : "Endorse to LGU"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosoEndorseModal;
