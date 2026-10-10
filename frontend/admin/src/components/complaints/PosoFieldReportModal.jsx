import React, { useState } from "react";
import { Car, X, ShieldAlert, CheckCircle2 } from "lucide-react";

const PosoFieldReportModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [form, setForm] = useState({
    vehiclePlateNumber: "",
    category: "reckless_driving",
    subject: "",
    description: "",
    location: "",
    posoEndorsementNotes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      location: form.location ? { address: form.location } : undefined,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "560px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Car size={20} color="#DC2626" />
            <h3 className="modal-title" style={{ margin: 0 }}>
              File Direct On-Road Violation Report
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
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#991B1B",
              }}
            >
              This report will be filed under your official POSO badge and escalated directly to the Dagupan City Transport Authority.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="form-label">Vehicle Plate Number *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. ABC-1234 or Dagupan-102"
                  value={form.vehiclePlateNumber}
                  onChange={(e) => setForm({ ...form, vehiclePlateNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Violation Category *</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="reckless_driving">Reckless Driving</option>
                  <option value="overcharging">Fare Overcharging</option>
                  <option value="route_deviation">Route Deviation / Short-cutting</option>
                  <option value="vehicle_condition">Smoke-Belching / Defective Vehicle</option>
                  <option value="harassment">Passenger Harassment</option>
                  <option value="other">Other Traffic Obstruction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Violation Title / Subject *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Illegal parking and obstruction along AB Fernandez East"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Specific Location / Street *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Corner Perez Blvd and MH Del Pilar St."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Incident Description & Circumstances *</label>
              <textarea
                className="form-input"
                rows={3}
                required
                placeholder="Detail what occurred on the road, vehicle direction, passenger impact, etc."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Enforcer Road Action / Remarks</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Driver issued temporary traffic citation on site. Forwarding to LGU."
                value={form.posoEndorsementNotes}
                onChange={(e) => setForm({ ...form, posoEndorsementNotes: e.target.value })}
              />
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
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? "Submitting..." : "Submit Violation Report"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PosoFieldReportModal;
