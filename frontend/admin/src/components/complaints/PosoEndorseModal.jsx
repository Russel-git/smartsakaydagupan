import React, { useState } from "react";
import { ShieldAlert, X, Send } from "lucide-react";

const PosoEndorseModal = ({
  isOpen,
  complaint,
  onClose,
  onConfirm,
  loading,
}) => {
  const [notes, setNotes] = useState("");

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(complaint, notes);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "500px" }}>
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

            <div>
              <label className="form-label">
                POSO Officer Road Inspection Remarks *
              </label>
              <textarea
                className="form-input"
                rows={4}
                required
                placeholder="Document your on-site verification findings (e.g. Plate verified along Perez Blvd, driver notified, verified overcharging incident)."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
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
