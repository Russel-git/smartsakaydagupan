import React, { useState, useEffect } from "react";
import {
  Calculator,
  Edit3,
  History,
  Check,
  AlertCircle,
  X,
} from "lucide-react";

import { faresAPI } from "../api/services";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const FaresPage = () => {
  const { showSuccess, showError } = useToast();
  const { colors } = useTheme();

  const [fares, setFares] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFare, setEditingFare] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Live calculator test state
  const [calcDistance, setCalcDistance] = useState(7.5);
  const [calcVehicle, setCalcVehicle] = useState("traditional");

  // ==========================================================
  // Fetch fares
  // ==========================================================

  const fetchFares = async () => {
    try {
      const [faresRes, historyRes] = await Promise.all([
        faresAPI.getActiveFares(),
        faresAPI.getFareHistory().catch(() => ({
          data: { data: [] },
        })),
      ]);

      setFares(faresRes.data?.data || []);
      setHistory(historyRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching fares:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
  }, []);

  // ==========================================================
  // Edit fare
  // ==========================================================

  const handleEditClick = (fare) => {
    setEditingFare({
      _id: fare._id,
      vehicleType: fare.vehicleType,
      baseFare: fare.baseFare,
      baseDistanceKm: fare.baseDistanceKm,
      perKmRate: fare.perKmRate,
      reason: "",
    });
  };

  // ==========================================================
  // Save fare
  // ==========================================================

  const handleSaveFare = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await faresAPI.updateFare(editingFare._id, {
        baseFare: Number(editingFare.baseFare),
        baseDistanceKm: Number(editingFare.baseDistanceKm),
        perKmRate: Number(editingFare.perKmRate),
        reason: editingFare.reason || "LTFRB Fare Matrix Revision",
      });

      showSuccess(
        "Fare Matrix Updated",
        `Tariff rates for ${editingFare.vehicleType} PUVs published and synchronized.`,
      );

      setMessage({
        type: "success",
        text: "Fare updated successfully! Route matrices recalculated.",
      });

      setEditingFare(null);

      await fetchFares();
    } catch (err) {
      const errText = err.response?.data?.message || "Failed to update fare";

      showError("Fare Update Failed", errText);

      setMessage({
        type: "error",
        text: errText,
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // Preview fare computation
  // ==========================================================

  const activeFare = fares.find((f) => f.vehicleType === calcVehicle) || {
    baseFare: 13,
    baseDistanceKm: 4,
    perKmRate: 1.8,
  };

  const rawSubtotal =
    calcDistance <= activeFare.baseDistanceKm
      ? activeFare.baseFare
      : activeFare.baseFare +
        (calcDistance - activeFare.baseDistanceKm) * activeFare.perKmRate;

  const regularPreview = Math.ceil(rawSubtotal);
  const discountPreview = Math.ceil(rawSubtotal * 0.8);

  return (
    <div>
      {/* =====================================================
          Page Header
      ====================================================== */}

      <div
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              color: colors.textPrimary,
              marginBottom: "4px",
            }}
          >
            LTFRB Fare Management
          </h1>

          <p
            style={{
              color: colors.textMuted,
              fontSize: "14px",
            }}
          >
            Maintain official tariff rates for Dagupan City and Pangasinan PUV
            routes.
          </p>
        </div>
      </div>

      {/* =====================================================
          Success / Error Message
      ====================================================== */}

      {message && (
        <div
          style={{
            background:
              message.type === "success"
                ? colors.successLight
                : colors.errorLight,

            border: `1px solid ${
              message.type === "success" ? colors.success : colors.error
            }`,

            borderRadius: "var(--radius-md)",
            padding: "14px",
            marginBottom: "24px",

            display: "flex",
            alignItems: "center",
            gap: "10px",

            color: message.type === "success" ? colors.success : colors.error,

            fontSize: "14px",
          }}
        >
          {message.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* =====================================================
          Active Fares Table
      ====================================================== */}

      <div
        className="card"
        style={{
          marginBottom: "28px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            color: colors.textPrimary,
            marginBottom: "16px",
          }}
        >
          Active LTFRB Tariff Rates
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Base Fare</th>
                <th>Base Distance</th>
                <th>Per Succeeding KM</th>
                <th>Status</th>
                <th>Effective Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {fares.map((f) => (
                <tr key={f._id}>
                  <td
                    style={{
                      fontWeight: "600",
                      textTransform: "capitalize",
                      color: colors.textPrimary,
                    }}
                  >
                    {f.vehicleType === "tricycle"
                      ? "Dagupan Tricycle"
                      : `${f.vehicleType} Jeepney`}
                  </td>

                  <td
                    style={{
                      fontWeight: "700",
                      color: colors.primary,
                    }}
                  >
                    ₱{f.baseFare.toFixed(2)}
                  </td>

                  <td>{f.baseDistanceKm} km</td>

                  <td
                    style={{
                      color: colors.success,
                      fontWeight: "600",
                    }}
                  >
                    +₱{f.perKmRate.toFixed(2)}/km
                  </td>

                  <td>
                    <span
                      className="badge"
                      style={{
                        background: colors.successLight,
                        color: colors.success,
                      }}
                    >
                      ● Active
                    </span>
                  </td>

                  <td
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                    }}
                  >
                    {new Date(
                      f.effectiveDate || Date.now(),
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      onClick={() => handleEditClick(f)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit3 size={14} />
                      <span>Adjust Rate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          Calculator + History
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* ===================================================
            Live Fare Calculator
        ==================================================== */}

        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <Calculator size={20} color={colors.primary} />

            <h3
              style={{
                fontSize: "17px",
                color: colors.textPrimary,
              }}
            >
              Live Tariff Simulator
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div>
              <label className="form-label">PUV Class</label>

              <select
                className="form-select"
                value={calcVehicle}
                onChange={(e) => setCalcVehicle(e.target.value)}
              >
                <option value="traditional">Traditional Jeepney</option>

                <option value="modern">Modern Jeepney</option>

                <option value="tricycle">Dagupan Tricycle</option>
              </select>
            </div>

            <div>
              <label className="form-label">Travel Distance (km)</label>

              <input
                type="number"
                step="0.1"
                min="0.5"
                className="form-input"
                value={calcDistance}
                onChange={(e) => setCalcDistance(Number(e.target.value))}
              />
            </div>
          </div>

          <div
            style={{
              background: colors.surfaceElevated,
              borderRadius: "var(--radius-md)",
              padding: "20px",
              border: `1px solid ${colors.border}`,

              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Regular Fare
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: colors.primary,
                  marginTop: "4px",
                }}
              >
                ₱{regularPreview}.00
              </div>
            </div>

            <div
              style={{
                height: "50px",
                width: "1px",
                background: colors.border,
              }}
            />

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.success,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                20% Discounted (Student/Senior/PWD)
              </div>

              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: colors.success,
                  marginTop: "4px",
                }}
              >
                ₱{discountPreview}.00
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            Fare History
        ==================================================== */}

        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <History size={20} color={colors.info} />

            <h3
              style={{
                fontSize: "17px",
                color: colors.textPrimary,
              }}
            >
              Revision History Log
            </h3>
          </div>

          {history.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: colors.textMuted,
                fontSize: "13px",
              }}
            >
              No historical fare amendments logged yet.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxHeight: "240px",
                overflowY: "auto",
              }}
            >
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: colors.surfaceElevated,
                    border: `1px solid ${colors.border}`,
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: colors.textPrimary,
                      fontWeight: "600",
                    }}
                  >
                    <span>{h.vehicleType} Jeepney</span>

                    <span
                      style={{
                        color: colors.primary,
                      }}
                    >
                      ₱{h.baseFare} base / ₱{h.perKmRate}/km
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                      marginTop: "4px",
                    }}
                  >
                    {h.reason || "Tariff adjustment"}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: colors.textMuted,
                      marginTop: "2px",
                    }}
                  >
                    {new Date(h.changedAt || h.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          Edit Fare Modal
      ====================================================== */}

      {editingFare && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3
                style={{
                  color: colors.textPrimary,
                  fontSize: "18px",
                }}
              >
                Update {editingFare.vehicleType} Jeepney Rates
              </h3>

              <button
                onClick={() => setEditingFare(null)}
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFare}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Base Fare (₱)</label>

                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editingFare.baseFare}
                    onChange={(e) =>
                      setEditingFare({
                        ...editingFare,
                        baseFare: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Base Distance (KM)</label>

                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    value={editingFare.baseDistanceKm}
                    onChange={(e) =>
                      setEditingFare({
                        ...editingFare,
                        baseDistanceKm: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Per Succeeding KM Rate (₱)
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    required
                    className="form-input"
                    value={editingFare.perKmRate}
                    onChange={(e) =>
                      setEditingFare({
                        ...editingFare,
                        perKmRate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Reason / Memorandum Circular
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. LTFRB Resolution 2026-03"
                    className="form-input"
                    value={editingFare.reason}
                    onChange={(e) =>
                      setEditingFare({
                        ...editingFare,
                        reason: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingFare(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Updating..." : "Save & Recalculate Matrices"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaresPage;
