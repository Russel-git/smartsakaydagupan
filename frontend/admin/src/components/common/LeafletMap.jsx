import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Layers, Bus, Compass, Navigation } from "lucide-react";

import { useTheme } from "../../contexts/theme/ThemeContext";

const LeafletMap = ({ selectedRoute = null, onSelectRoute = null }) => {
  const { colors } = useTheme();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState("all");
  const [routes, setRoutes] = useState([]);
  const [busTerminals, setBusTerminals] = useState([]);

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesRes, terminalsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/routes"),

          axios
            .get("http://localhost:5000/api/terminals")
            .catch(() =>
              axios.get("http://localhost:5000/api/routes/bus-terminals"),
            ),
        ]);

        if (routesRes.data?.success) {
          setRoutes(routesRes.data.data || []);
        }

        if (terminalsRes.data?.success) {
          setBusTerminals(terminalsRes.data.data || []);
        }
      } catch (error) {
        console.error("Failed to load map data:", error);
      }
    };

    loadData();
  }, []);

  // ============================================================
  // INITIALIZE MAP
  // ============================================================

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [16.0433, 120.3342],
        zoom: 13,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors | SmartSakay Dagupan",
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = window.L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    renderLayers();
  }, [routes, busTerminals, activeLayer, selectedRoute, colors]);

  // ============================================================
  // RENDER MAP LAYERS
  // ============================================================

  const renderLayers = () => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) {
      return;
    }

    const L = window.L;

    layerGroupRef.current.clearLayers();

    // ==========================================================
    // 1. JEEPNEY ROUTES
    // ==========================================================

    if (activeLayer === "all" || activeLayer === "jeepneys") {
      /*
       * Route colors remain separate from the application theme.
       * They represent different transportation corridors.
       */
      const routeColorMap = {
        CSI_LUCAO: "#2563EB",
        DOWNTOWN: "#8B5CF6",
        CALASIAO: "#059669",
        BONUAN_TONDALIGAN: "#EA580C",
      };

      const routesToRender = selectedRoute
        ? routes.filter((route) => route._id === selectedRoute._id)
        : routes;

      routesToRender.forEach((route) => {
        const isSelected = selectedRoute && selectedRoute._id === route._id;

        const baseColor =
          routeColorMap[route.code] ||
          (route.category === "city" ? colors.info : colors.warning);

        const routeColor = isSelected ? colors.warning : baseColor;

        const weight = isSelected
          ? 6
          : route.path && route.path.length > 0
            ? 4
            : 3;

        // ------------------------------------------------------
        // ROUTE POINTS
        // ------------------------------------------------------

        let points = [];

        if (route.path && route.path.length > 0) {
          points = route.path.map((point) => [point.lat, point.lng]);
        } else if (route.startPoint?.lat && route.endPoint?.lat) {
          points = [
            [route.startPoint.lat, route.startPoint.lng],

            ...(route.waypoints || []).map((waypoint) => [
              waypoint.lat,
              waypoint.lng,
            ]),

            [route.endPoint.lat, route.endPoint.lng],
          ];
        }

        if (points.length === 0) return;

        // ------------------------------------------------------
        // ROUTE LINE
        // ------------------------------------------------------

        const polyline = L.polyline(points, {
          color: routeColor,
          weight,
          opacity: 1,
          dashArray: route.path && route.path.length > 0 ? null : "4, 4",
        });

        // ------------------------------------------------------
        // ROUTE POPUP
        // ------------------------------------------------------

        polyline.bindPopup(`
          <div
            style="
              font-family: sans-serif;
              min-width: 190px;
              color: ${colors.textPrimary};
            "
          >
            <div
              style="
                font-weight: 800;
                color: ${colors.textPrimary};
                font-size: 14px;
                margin-bottom: 4px;
              "
            >
              🚐 ${route.name}
            </div>

            <div
              style="
                font-size: 12px;
                color: ${colors.textSecondary};
                margin-bottom: 4px;
              "
            >
              <strong>Corridor:</strong>
              ${route.corridor || route.description || "Continuous Loop"}
            </div>

            <div
              style="
                font-size: 11px;
                color: ${colors.textMuted};
              "
            >
              Distance: ~${route.distanceKm} km •
              ${route.isLoop !== false ? "Loop Corridor" : "Transit Corridor"}
            </div>
          </div>
        `);

        polyline.addTo(layerGroupRef.current);

        // ------------------------------------------------------
        // SELECTED ROUTE ZOOM
        // ------------------------------------------------------

        if (isSelected && points.length > 0) {
          mapInstanceRef.current.fitBounds(polyline.getBounds(), {
            padding: [35, 35],
          });
        }

        // ------------------------------------------------------
        // START MARKER
        // ------------------------------------------------------

        const depotPoint = points[0];

        const startMarker = L.circleMarker(depotPoint, {
          radius: isSelected ? 7 : 5,
          fillColor: routeColor,

          // White marker outline is intentional
          // for map visibility.
          color: colors.white,

          weight: 2,
          fillOpacity: 1,
        });

        startMarker.bindPopup(`
          <div
            style="
              font-family: sans-serif;
              color: ${colors.textPrimary};
            "
          >
            <strong>
              ${route.name} (Station)
            </strong>

            <br />

            <span
              style="
                color: ${colors.textSecondary};
              "
            >
              ${route.corridor || "Terminal Station"}
            </span>
          </div>
        `);

        startMarker.addTo(layerGroupRef.current);
      });
    }

    // ==========================================================
    // 2. TRANSPORT TERMINALS
    // ==========================================================

    if (activeLayer === "all" || activeLayer === "buses") {
      busTerminals.forEach((terminal) => {
        if (!terminal.lat || !terminal.lng) {
          return;
        }

        let typeEmoji = "🚌";
        let badgeColor = colors.info;
        let badgeLabel = "BUS TERMINAL";

        if (terminal.type === "jeepney") {
          typeEmoji = "🚐";
          badgeColor = colors.success;
          badgeLabel = "JEEPNEY HUB";
        } else if (terminal.type === "tricycle") {
          typeEmoji = "🛺";
          badgeColor = colors.warning;
          badgeLabel = "TRICYCLE TODA";
        } else if (terminal.type === "multimodal") {
          typeEmoji = "🏢";
          badgeColor = colors.primary;
          badgeLabel = "MULTIMODAL HUB";
        }

        // ------------------------------------------------------
        // TERMINAL ICON
        // ------------------------------------------------------

        const terminalIcon = L.divIcon({
          className: "terminal-pin",

          html: `
            <div
              style="
                background: ${badgeColor};
                color: ${colors.white};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid ${colors.white};
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
              "
            >
              ${typeEmoji}
            </div>
          `,

          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([terminal.lat, terminal.lng], {
          icon: terminalIcon,
        });

        // ------------------------------------------------------
        // TERMINAL POPUP
        // ------------------------------------------------------

        marker.bindPopup(`
          <div
            style="
              font-family: sans-serif;
              min-width: 220px;
              color: ${colors.textPrimary};
            "
          >

            <div
              style="
                background: ${badgeColor};
                color: ${colors.white};
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 700;
                font-size: 11px;
                display: inline-block;
                margin-bottom: 6px;
              "
            >
              ${badgeLabel}
            </div>

            <div
              style="
                font-weight: 800;
                font-size: 15px;
                color: ${colors.textPrimary};
                margin-bottom: 4px;
              "
            >
              ${terminal.name}
            </div>

            <div
              style="
                font-size: 12px;
                color: ${colors.textSecondary};
                margin-bottom: 6px;
              "
            >
              📍 ${terminal.address}
            </div>

            ${
              terminal.destinations && terminal.destinations.length > 0
                ? `
                  <div
                    style="
                      font-size: 11px;
                      color: ${colors.textSecondary};
                      margin-bottom: 6px;
                    "
                  >
                    <strong>Destinations:</strong>
                    ${terminal.destinations.slice(0, 4).join(", ")}
                  </div>
                `
                : ""
            }

            <div
              style="
                font-size: 11px;
                color: ${colors.success};
                font-weight: 600;
              "
            >
              ${terminal.contactNumber ? `📞 ${terminal.contactNumber} • ` : ""}

              ${terminal.operatingHours || "24/7"}
            </div>

          </div>
        `);

        marker.addTo(layerGroupRef.current);
      });
    }

    // ==========================================================
    // SELECTED ROUTE PAN
    // ==========================================================

    if (
      selectedRoute &&
      selectedRoute.startPoint?.lat &&
      mapInstanceRef.current
    ) {
      mapInstanceRef.current.panTo(
        [selectedRoute.startPoint.lat, selectedRoute.startPoint.lng],
        {
          animate: true,
        },
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "420px",
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        marginBottom: "24px",
        backgroundColor: colors.surface,
      }}
    >
      {/* ======================================================
          SELECTED ROUTE NOTICE
      ====================================================== */}

      {selectedRoute && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 1000,

            backgroundColor: colors.surface,

            border: `1px solid ${colors.warning}`,

            borderRadius: "8px",

            padding: "7px 12px",

            display: "flex",
            alignItems: "center",
            gap: "10px",

            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: colors.warning,
              fontWeight: "700",
            }}
          >
            Isolated Route: {selectedRoute.name}
          </span>

          {onSelectRoute && (
            <button
              onClick={() => onSelectRoute(null)}
              style={{
                backgroundColor: colors.primary,

                color: colors.white,

                border: "none",

                borderRadius: "4px",

                padding: "3px 8px",

                fontSize: "11px",

                fontWeight: "600",

                cursor: "pointer",
              }}
            >
              Show All Routes
            </button>
          )}
        </div>
      )}

      {/* ======================================================
          MAP CONTROLS
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,

          backgroundColor: colors.surface,

          border: `1px solid ${colors.border}`,

          borderRadius: "8px",

          padding: "6px",

          display: "flex",
          gap: "6px",

          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {/* ALL */}

        <button
          onClick={() => setActiveLayer("all")}
          style={{
            backgroundColor:
              activeLayer === "all" ? colors.primary : "transparent",

            color: activeLayer === "all" ? colors.white : colors.textSecondary,

            border: "none",

            padding: "6px 12px",

            borderRadius: "6px",

            fontSize: "12px",

            fontWeight: "600",

            cursor: "pointer",

            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Layers size={14} />

          <span>All Layers</span>
        </button>

        {/* JEEPNEYS */}

        <button
          onClick={() => setActiveLayer("jeepneys")}
          style={{
            backgroundColor:
              activeLayer === "jeepneys" ? colors.primary : "transparent",

            color:
              activeLayer === "jeepneys" ? colors.white : colors.textSecondary,

            border: "none",

            padding: "6px 12px",

            borderRadius: "6px",

            fontSize: "12px",

            fontWeight: "600",

            cursor: "pointer",

            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🚐 Jeepney Routes</span>
        </button>

        {/* BUS TERMINALS */}

        <button
          onClick={() => setActiveLayer("buses")}
          style={{
            backgroundColor:
              activeLayer === "buses" ? colors.error : "transparent",

            color:
              activeLayer === "buses" ? colors.white : colors.textSecondary,

            border: "none",

            padding: "6px 12px",

            borderRadius: "6px",

            fontSize: "12px",

            fontWeight: "600",

            cursor: "pointer",

            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Bus size={14} />

          <span>Bus Terminals Only</span>
        </button>
      </div>

      {/* ======================================================
          MAP CANVAS
      ====================================================== */}

      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: colors.surface,
        }}
      />
    </div>
  );
};

export default LeafletMap;
