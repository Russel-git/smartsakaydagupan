import React, { useState, useEffect } from "react";
import { MapPin, Plus, Eye, Check, AlertCircle, X, Trash2 } from "lucide-react";
import api from "../api/client";
import { routesAPI } from "../api/services";
import LeafletMap from "../components/common/LeafletMap";
import PointToPointRouteMap from "../components/routes/PointToPointRouteMap";
import ConfirmModal from "../components/common/ConfirmModal";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/theme/ThemeContext";

const RoutesPage = () => {
  const { showSuccess, showError } = useToast();
  const { colors } = useTheme();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [drawnPoints, setDrawnPoints] = useState([]);

  // New route form state
  const [newRoute, setNewRoute] = useState({
    name: "",
    code: "",
    category: "city",
    distanceKm: "",
    startName: "",
    startLat: 16.0433,
    startLng: 120.3342,
    endName: "",
    endLat: 16.03,
    endLng: 120.33,
    terminalName: "",
    terminalAddress: "",
  });

  const fetchRoutes = async () => {
    try {
      const res = await api.get("/routes");
      setRoutes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching routes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleToggleStatus = async (route) => {
    try {
      await api.put(`/routes/${route._id}`, {
        isActive: !route.isActive,
      });

      const statusLabel = !route.isActive ? "Active" : "Inactive";

      showSuccess(
        "Route Status Updated",
        `Route "${route.name}" is now ${statusLabel}.`,
      );

      setMessage({
        type: "success",
        text: `Route "${route.name}" status updated.`,
      });

      fetchRoutes();
    } catch (err) {
      showError("Status Update Failed", "Failed to update route status.");

      setMessage({
        type: "error",
        text: "Failed to update route status.",
      });
    }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await routesAPI.deleteRoute(id);
      showSuccess(
        "Route Removed",
        "Route has been successfully removed from directory."
      );
      setRouteToDelete(null);
      if (selectedRoute?._id === id) {
        setSelectedRoute(null);
      }
      fetchRoutes();
    } catch (err) {
      showError(
        "Remove Failed",
        err.response?.data?.message || "Failed to remove route."
      );
    }
  };

  const handleOpenAddModal = () => {
    setDrawnPoints([]);
    setNewRoute({
      name: "",
      code: "",
      category: "city",
      distanceKm: "",
      startName: "",
      startLat: 16.0433,
      startLng: 120.3342,
      endName: "",
      endLat: 16.03,
      endLng: 120.33,
      terminalName: "",
      terminalAddress: "",
    });
    setIsAddModalOpen(true);
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();

    try {
      const startPt = {
        name:
          newRoute.startName ||
          (drawnPoints.length > 0 ? "Route Start" : "Dagupan Terminal"),
        lat:
          drawnPoints.length > 0
            ? drawnPoints[0].lat
            : Number(newRoute.startLat),
        lng:
          drawnPoints.length > 0
            ? drawnPoints[0].lng
            : Number(newRoute.startLng),
      };

      const endPt = {
        name:
          newRoute.endName ||
          (drawnPoints.length > 1 ? "Route End" : "Destination"),
        lat:
          drawnPoints.length > 1
            ? drawnPoints[drawnPoints.length - 1].lat
            : Number(newRoute.endLat),
        lng:
          drawnPoints.length > 1
            ? drawnPoints[drawnPoints.length - 1].lng
            : Number(newRoute.endLng),
      };

      const waypoints = drawnPoints.map((pt, idx) => ({
        name:
          idx === 0
            ? newRoute.startName || "Start Terminal"
            : idx === drawnPoints.length - 1
            ? newRoute.endName || "Destination End"
            : `Waypoint ${idx + 1}`,
        lat: pt.lat,
        lng: pt.lng,
        order: idx,
      }));

      await api.post("/routes", {
        name: newRoute.name,
        code: newRoute.code.toUpperCase(),
        category: newRoute.category,
        distanceKm: Number(newRoute.distanceKm) || 1,

        startPoint: startPt,
        endPoint: endPt,

        terminalLocation: {
          name:
            newRoute.terminalName ||
            newRoute.startName ||
            "Dagupan Terminal",
          address: newRoute.terminalAddress || "Dagupan City",
          lat: startPt.lat,
          lng: startPt.lng,
        },

        path: drawnPoints.map((pt) => ({ lat: pt.lat, lng: pt.lng })),
        waypoints,
      });

      showSuccess(
        "Route Registered",
        `New corridor "${newRoute.name}" (${newRoute.code.toUpperCase()}) published with ${drawnPoints.length} track points.`,
      );

      setMessage({
        type: "success",
        text: "New route added successfully!",
      });

      setIsAddModalOpen(false);
      setDrawnPoints([]);
      fetchRoutes();
    } catch (err) {
      const errText = err.response?.data?.message || "Failed to create route.";

      showError("Route Creation Failed", errText);

      setMessage({
        type: "error",
        text: errText,
      });
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || r.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

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
            Jeepney Route Directory
          </h1>

          <p
            style={{
              color: colors.textMuted,
              fontSize: "14px",
            }}
          >
            Authorized transit corridors, terminal depots, and waypoint networks
            in Dagupan City.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn"
          style={{
            backgroundColor: colors.primary,
            color: colors.white,
            shadow: `0 4px 12px ${colors.primary}50`,
          }}
        >
          <Plus size={16} />
          <span>Register New Route</span>
        </button>
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
            padding: "12px",
            marginBottom: "20px",

            display: "flex",
            alignItems: "center",
            gap: "10px",

            color: message.type === "success" ? colors.success : colors.error,

            fontSize: "13px",
          }}
        >
          {message.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      {/* =====================================================
          Interactive Map
      ====================================================== */}
      <LeafletMap
        selectedRoute={selectedRoute}
        onSelectRoute={setSelectedRoute}
      />

      {/* =====================================================
          Filter and Search
      ====================================================== */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Search by route name or code (e.g. DAG-BON)..."
          className="form-input"
          style={{ maxWidth: "380px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ maxWidth: "200px" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="city">City Loops</option>
          <option value="intercity">Intercity Lines</option>
        </select>
      </div>

      {/* =====================================================
          Routes Table
      ====================================================== */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Route Name</th>
                <th>Category</th>
                <th>Distance</th>
                <th>Transit Corridor / Loop</th>
                <th>GPX Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRoutes.map((r) => (
                <tr key={r._id}>
                  {/* Route Code */}
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        background: colors.surfaceElevated,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        color: colors.primary,
                        fontWeight: "700",
                      }}
                    >
                      {r.code}
                    </span>
                  </td>

                  {/* Route Name */}
                  <td
                    style={{
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    {r.name}
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      className="badge badge-info"
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {r.category}
                    </span>
                  </td>

                  {/* Distance */}
                  <td>{r.distanceKm} km</td>

                  {/* Corridor */}
                  <td
                    style={{
                      fontSize: "13px",
                      color: colors.textMuted,
                      maxWidth: "280px",
                    }}
                  >
                    {r.corridor || r.description || "Continuous Transit Loop"}
                  </td>

                  {/* GPX Status */}
                  <td>
                    {r.path && r.path.length > 0 ? (
                      <span
                        className="badge badge-success"
                        style={{ fontSize: "11px" }}
                      >
                        ✓ {r.path.length} GPX Points
                      </span>
                    ) : (
                      <span
                        className="badge badge-warning"
                        style={{ fontSize: "11px" }}
                      >
                        Pending Track
                      </span>
                    )}
                  </td>

                  {/* Active Status */}
                  <td>
                    <button
                      onClick={() => handleToggleStatus(r)}
                      style={{
                        background: "transparent",
                      }}
                    >
                      <span
                        className={`badge ${
                          r.isActive ? "badge-success" : "badge-danger"
                        }`}
                      >
                        ● {r.isActive ? "Active" : "Disabled"}
                      </span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        onClick={() => setSelectedRoute(r)}
                        className="btn btn-secondary btn-sm"
                        title="View Route Details"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => setRouteToDelete(r)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: "#FEE2E2",
                          color: "#DC2626",
                          border: "1px solid #FECACA",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                        title="Remove outdated route"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          View Route Details Modal
      ====================================================== */}
      {selectedRoute && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "620px" }}>
            <div className="modal-header">
              <div>
                <h3
                  style={{
                    color: colors.textPrimary,
                    fontSize: "18px",
                  }}
                >
                  {selectedRoute.name}
                </h3>

                <span
                  style={{
                    fontSize: "12px",
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  Code: {selectedRoute.code} &bull;{" "}
                  {selectedRoute.category.toUpperCase()}
                </span>
              </div>

              <button
                onClick={() => setSelectedRoute(null)}
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Route Information */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                {/* Terminal */}
                <div
                  style={{
                    background: colors.surfaceElevated,
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: colors.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    Terminal Location
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginTop: "4px",
                    }}
                  >
                    {selectedRoute.terminalLocation?.name ||
                      selectedRoute.startPoint?.name}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                      marginTop: "2px",
                    }}
                  >
                    {selectedRoute.terminalLocation?.address || "Dagupan City"}
                  </div>
                </div>

                {/* Operating Hours */}
                <div
                  style={{
                    background: colors.surfaceElevated,
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: colors.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    Operating Hours
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginTop: "4px",
                    }}
                  >
                    {selectedRoute.operatingHours?.start || "05:00"} -{" "}
                    {selectedRoute.operatingHours?.end || "21:00"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.accent,
                      marginTop: "2px",
                    }}
                  >
                    Total Length: {selectedRoute.distanceKm} KM
                  </div>
                </div>
              </div>

              {/* Corridor */}
              <h4
                style={{
                  fontSize: "14px",
                  color: colors.textPrimary,
                  marginBottom: "10px",
                }}
              >
                Transit Corridor & GPX Track
              </h4>

              <div
                style={{
                  background: colors.surfaceElevated,
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "12px",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Loop Route Corridor
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: colors.textPrimary,
                    fontWeight: "500",
                    lineHeight: "20px",
                  }}
                >
                  {selectedRoute.corridor ||
                    selectedRoute.description ||
                    "Continuous municipal transit corridor"}
                </div>
              </div>

              {/* GPX Mapping Status */}
              {selectedRoute.path && selectedRoute.path.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: colors.successLight,
                    border: `1px solid ${colors.success}`,
                    color: colors.success,
                    fontSize: "13px",
                  }}
                >
                  <Check size={16} />

                  <span>
                    <strong>
                      {selectedRoute.path.length} GPS Track Points Mapped
                    </strong>{" "}
                    via OpenStreetMap Road Network
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "13px",
                    color: colors.textMuted,
                  }}
                >
                  Awaiting GPX track mapping.
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setRouteToDelete(selectedRoute)}
                className="btn btn-sm"
                style={{
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontWeight: "600",
                }}
              >
                <Trash2 size={14} />
                <span>Remove Route</span>
              </button>

              <button
                onClick={() => setSelectedRoute(null)}
                className="btn btn-secondary"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Add Route Modal
      ====================================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "920px",
              width: "95vw",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="modal-header">
              <div>
                <h3
                  style={{
                    color: colors.textPrimary,
                    fontSize: "18px",
                    margin: 0,
                  }}
                >
                  Register New PUV Route
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                    margin: "2px 0 0 0",
                  }}
                >
                  Define corridor details and trace road waypoints point-to-point.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateRoute}
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flex: 1,
              }}
            >
              <div
                className="modal-body"
                style={{
                  overflowY: "auto",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Point to Point Route Drawer (OnTheGoMap) */}
                <div
                  style={{
                    background: colors.surfaceElevated || "#f8fafc",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      <MapPin size={16} color={colors.primary} />
                      <span>Point-to-Point Route Creator (OnTheGoMap Mode)</span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                        margin: "4px 0 0 0",
                      }}
                    >
                      Click sequentially on the Dagupan map to plot stops and corridor turnings. The route track and total kilometer distance will auto-populate below.
                    </p>
                  </div>

                  <PointToPointRouteMap
                    points={drawnPoints}
                    onPointsChange={(pts, dist) => {
                      setDrawnPoints(pts);
                      if (pts.length > 0) {
                        setNewRoute((prev) => ({
                          ...prev,
                          distanceKm: dist > 0 ? dist : prev.distanceKm,
                          startLat: pts[0].lat,
                          startLng: pts[0].lng,
                          endLat: pts[pts.length - 1].lat,
                          endLng: pts[pts.length - 1].lng,
                        }));
                      }
                    }}
                  />
                </div>
                {/* Route Name */}
                <div className="form-group">
                  <label className="form-label">Route Name</label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown - Calasiao via McArthur"
                    className="form-input"
                    value={newRoute.name}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Code + Category */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Route Code</label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. DAG-CAL"
                      className="form-input"
                      value={newRoute.code}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          code: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>

                    <select
                      className="form-select"
                      value={newRoute.category}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="city">City Loop</option>

                      <option value="intercity">Intercity</option>
                    </select>
                  </div>
                </div>

                {/* Distance */}
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>

                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 8.5"
                    className="form-input"
                    value={newRoute.distanceKm}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        distanceKm: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Origin + Destination */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Origin / Terminal</label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Perez Blvd Terminal"
                      className="form-input"
                      value={newRoute.startName}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          startName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination</label>

                    <input
                      type="text"
                      required
                      placeholder="e.g. Calasiao Town Plaza"
                      className="form-input"
                      value={newRoute.endName}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          endName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setDrawnPoints([]);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.white,
                    shadow: `0 4px 12px ${colors.primary}50`,
                  }}
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Route Confirmation Modal */}
      <ConfirmModal
        isOpen={!!routeToDelete}
        onClose={() => setRouteToDelete(null)}
        onConfirm={() => handleDeleteRoute(routeToDelete._id)}
        title="Remove Route from Directory"
        message={`Are you sure you want to remove "${routeToDelete?.name}" (${routeToDelete?.code})? This will deactivate the route and remove it from active commuter navigation.`}
        confirmText="Remove Route"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default RoutesPage;
