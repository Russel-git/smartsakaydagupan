import React, { useState, useEffect } from "react";
import { ShieldAlert, X, Send, CheckSquare, Sparkles, MessageSquare, RotateCcw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const INSPECTION_CHECKLIST = [
  { id: "plate_verified", label: "Vehicle plate & physical identification verified on-site" },
  { id: "route_deviation", label: "Route deviation / unauthorized transit corridor confirmed" },
  { id: "overcharging", label: "Overcharging / fare dispute verified on-site" },
  { id: "driver_docs", label: "Driver license & CPC franchise documents inspected" },
  { id: "driver_warned", label: "Driver verbally notified & instructed to comply" },
  { id: "citation_issued", label: "Official POSO citation / summons ticket issued" },
  { id: "complainant_valid", label: "Complainant incident report & location verified" },
];

const PosoEndorseModal = ({
  isOpen,
  complaint,
  onClose,
  onConfirm,
  loading,
  municipality,
}) => {
  const { user, admin } = useAuth();
  const [selectedChecklist, setSelectedChecklist] = useState([]);
  const [notes, setNotes] = useState("");
  const [showCustomText, setShowCustomText] = useState(false);
  const [validationError, setValidationError] = useState("");

  const targetMuni =
    complaint?.municipality ||
    municipality ||
    user?.municipality ||
    admin?.municipality ||
    "Dagupan";

  useEffect(() => {
    if (isOpen) {
      setSelectedChecklist([]);
      setNotes("");
      setShowCustomText(false);
      setValidationError("");
    }
  }, [isOpen, complaint, targetMuni]);

  if (!isOpen || !complaint) return null;

  const handleToggleChecklist = (label) => {
    setValidationError("");
    setSelectedChecklist((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleSelectAll = () => {
    setValidationError("");
    if (selectedChecklist.length === INSPECTION_CHECKLIST.length) {
      setSelectedChecklist([]);
    } else {
      setSelectedChecklist(INSPECTION_CHECKLIST.map((item) => item.label));
    }
  };

  const handleAutoFillFromChecklist = () => {
    if (selectedChecklist.length === 0) {
      setNotes("On-site road inspection conducted; vehicle details verified.");
    } else {
      setNotes(`On-site road inspection findings: ${selectedChecklist.join("; ")}.`);
    }
    setShowCustomText(true);
    setValidationError("");
  };

  const handleQuickPreset = (presetText) => {
    setShowCustomText(true);
    setValidationError("");
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetText;
      if (trimmed.includes(presetText)) return trimmed;
      return `${trimmed}. ${presetText}`;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedChecklist.length === 0 && !notes.trim()) {
      setValidationError("Please select at least one verification finding or enter remarks.");
      return;
    }

    const sections = [];
    if (selectedChecklist.length > 0) {
      sections.push("POSO Road Inspection Findings:\n" + selectedChecklist.map((c) => `• ${c}`).join("\n"));
    }
    const cleanNotes = notes.trim();
    if (cleanNotes) {
      sections.push(selectedChecklist.length > 0 ? `Additional Officer Remarks:\n${cleanNotes}` : cleanNotes);
    }

    onConfirm(complaint, sections.join("\n\n"));
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: "560px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={20} color="#D97706" />
            <h3 className="modal-title" style={{ margin: 0 }}>
              Verify & Endorse to {targetMuni} LGU
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div
            className="modal-body"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
              paddingRight: "6px",
            }}
          >
            {/* Target Summary Card */}
            <div
              style={{
                backgroundColor: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400E", marginBottom: "4px" }}>
                Target: {complaint.subject}
              </div>
              <div style={{ fontSize: "12px", color: "#78350F" }}>
                Vehicle Plate: <strong>{complaint.vehiclePlateNumber || "Unspecified"}</strong> | Category: <strong>{complaint.category}</strong>
              </div>
            </div>

            {/* Checklist Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="form-label" style={{ margin: 0, fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckSquare size={16} color="#D97706" />
                  <span>Road Inspection Verification Checklist *</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    color: "#D97706",
                    cursor: "pointer",
                    fontWeight: "600",
                    padding: 0,
                  }}
                >
                  {selectedChecklist.length === INSPECTION_CHECKLIST.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  backgroundColor: "var(--surface-color, #F9FAFB)",
                  border: "1px solid var(--border-color, #E5E7EB)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                {INSPECTION_CHECKLIST.map((item) => {
                  const isChecked = selectedChecklist.includes(item.label);
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "13px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: isChecked ? "var(--text-primary, #111827)" : "var(--text-secondary, #4B5563)",
                        fontWeight: isChecked ? "600" : "400",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleChecklist(item.label)}
                        style={{
                          marginTop: "2px",
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          accentColor: "#D97706",
                        }}
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Remarks Section & Buttons */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="form-label" style={{ margin: 0, fontWeight: "600" }}>
                  POSO Officer Remarks (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomText((prev) => !prev)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(217, 119, 6, 0.1)",
                    border: "1px solid rgba(217, 119, 6, 0.3)",
                    color: "#D97706",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <MessageSquare size={12} />
                  <span>{showCustomText ? "Hide Remarks Text" : "+ Add Remarks Text (Optional)"}</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                <button
                  type="button"
                  onClick={handleAutoFillFromChecklist}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "var(--surface-color, #F3F4F6)",
                    border: "1px solid var(--border-color, #D1D5DB)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    color: "#D97706",
                  }}
                  title="Generate text remarks based on the items checked above"
                >
                  <Sparkles size={12} />
                  <span>Auto-fill from Checklist</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPreset("Plate verified on-site along transit corridor")}
                  style={{
                    background: "var(--surface-color, #F3F4F6)",
                    border: "1px solid var(--border-color, #D1D5DB)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "var(--text-secondary, #4B5563)",
                  }}
                >
                  + Plate verified on-site
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPreset("Driver notified & warned on road")}
                  style={{
                    background: "var(--surface-color, #F3F4F6)",
                    border: "1px solid var(--border-color, #D1D5DB)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "var(--text-secondary, #4B5563)",
                  }}
                >
                  + Driver warned
                </button>

                {notes && (
                  <button
                    type="button"
                    onClick={() => setNotes("")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                      background: "none",
                      border: "none",
                      padding: "4px 6px",
                      fontSize: "11px",
                      cursor: "pointer",
                      color: "#EF4444",
                    }}
                  >
                    <RotateCcw size={10} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Textarea: Visible either when toggled OR when notes exist */}
              {(showCustomText || notes) && (
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Document specific on-site details (e.g. Plate verified along Perez Blvd, driver notified, verified overcharging incident)."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setValidationError("");
                  }}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              )}

              {validationError && (
                <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "6px", fontWeight: "600" }}>
                  ⚠️ {validationError}
                </div>
              )}

              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                This grievance and findings will be formally forwarded to the {targetMuni} City Transport Authority Action Desk.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid var(--border-color, #E5E7EB)", paddingTop: "12px", marginTop: "8px" }}>
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
                fontWeight: "600",
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
