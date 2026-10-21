import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, X, AlertCircle, Camera, Upload } from "lucide-react";
import { complaintsAPI } from "../../api/services";
import { useTheme } from "../../contexts/theme/ThemeContext";

const LguActionModal = ({
  isOpen,
  mode = "action",
  complaint,
  onClose,
  onConfirm,
  loading,
}) => {
  const { colors } = useTheme();
  const [notes, setNotes] = useState("");
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (complaint) {
      if (mode === "action") {
        setNotes(complaint.lguActionNotes || "");
        setEvidencePhotoUrl(complaint.lguEvidencePhoto || "");
      } else {
        setNotes(complaint.lguTerminationNotes || "");
        setEvidencePhotoUrl("");
      }
    }
  }, [complaint, mode, isOpen]);

  if (!isOpen || !complaint) return null;

  const isAction = mode === "action";

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", file);
      const res = await complaintsAPI.uploadEvidence(formData);
      const url = res.data?.data?.url || res.data?.url;
      setEvidencePhotoUrl(url);
    } catch (err) {
      console.error("Failed to upload evidence photo:", err);
      alert(err.response?.data?.message || "Failed to upload evidence photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(complaint, mode, notes, evidencePhotoUrl);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAction ? (
              <ShieldCheck size={20} color="#10b981" />
            ) : (
              <CheckCircle2 size={20} color="#10b981" />
            )}
            <h2 style={{ fontSize: "18px", margin: 0, color: "black" }}>
              {isAction
                ? "Record Official LGU Action"
                : "Resolve Case & Record Official Outcome"}
            </h2>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div
              style={{
                backgroundColor: isAction
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(56, 189, 248, 0.1)",
                border: `1px solid ${isAction ? "rgba(16, 185, 129, 0.25)" : "rgba(56, 189, 248, 0.25)"}`,
                borderRadius: "var(--radius-md)",
                padding: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "black",
                  marginBottom: "2px",
                }}
              >
                Case No:{" "}
                {complaint.lguCaseNumber ||
                  `LGU-DAG-${complaint._id.toString().slice(-6).toUpperCase()}`}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Citizen Report: "{complaint.subject}" (
                {complaint.vehiclePlateNumber || "Plate Unspecified"})
              </div>
            </div>

            <div>
              <label className="form-label">
                {isAction
                  ? "Official Enforcement Findings & Action Taken *"
                  : "Official Resolution Summary & Final Settlement *"}
              </label>
              <textarea
                className="form-input"
                rows={4}
                required
                placeholder={
                  isAction
                    ? "e.g. Driver summoned to POSO Dagupan; Traffic Citation Ticket #4821 issued for overcharging; cooperative informed."
                    : "e.g. Citation penalty settled by driver; operator issued formal reprimand; fare refunded to commuter and case officially resolved."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                This official finding will be permanently recorded and
                transmitted in real-time to the commuter's device.
              </span>
            </div>

            {/* Evidence Photo Upload */}
            <div
              style={{
                backgroundColor: "var(--surface-elevated, #f8fafc)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "12px",
              }}
            >
              <label
                className="form-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                <Camera size={15} color="#059669" />
                <span>Action Evidence Photo (Citation Ticket, Inspection Photo, etc.)</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    backgroundColor: colors.surfaceElevated,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    cursor: uploadingPhoto ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  <Upload size={14} />
                  <span>{uploadingPhoto ? "Uploading..." : "Attach Evidence Photo"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    disabled={uploadingPhoto}
                    onChange={handlePhotoUpload}
                  />
                </label>

                {evidencePhotoUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={evidencePhotoUrl}
                      alt="Action Evidence"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#059669", fontWeight: "600" }}>Attached ✓</span>
                    <button
                      type="button"
                      onClick={() => setEvidencePhotoUrl("")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
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
                backgroundColor: isAction ? "#10b981" : "#10b981",
                color: "white",
                border: "none",
                fontWeight: "600",
              }}
            >
              {loading
                ? "Saving Record..."
                : isAction
                  ? "Save Action Record"
                  : "Resolve Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LguActionModal;
