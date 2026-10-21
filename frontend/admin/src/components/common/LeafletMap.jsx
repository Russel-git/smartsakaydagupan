import React, { useEffect, useRef, useState } from "react";
import { Layers, Bus, Compass, Navigation, Maximize2, RotateCcw } from "lucide-react";
import api from "../../api/client";
import { useTheme } from "../../contexts/theme/ThemeContext";

const LeafletMap = ({
  selectedRoute = null,
  onSelectRoute = null,
  routes: propRoutes = null,
  height = "440px",
  autoFocus = true,
}) => {
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
    if (propRoutes && propRoutes.length > 0) {
      setRoutes(propRoutes);
    }
  }, [propRoutes]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesRes, terminalsRes] = await Promise.all([
          !propRoutes || propRoutes.length === 0
            ? api.get("/routes").catch(() => ({ data: { success: false } }))
            : Promise.resolve({ data: { success: true, data: propRoutes } }),
          api.get("/terminals").catch(() => api.get("/routes/bus-terminals")),
        ]);

        if (routesRes.data?.success && (!propRoutes || propRoutes.length === 0)) {
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
  }, [propRoutes]);

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
  }, [routes, busTerminals, activeLayer, selectedRoute, colors, propRoutes]);

  // ============================================================
  // RENDER MAP LAYERS
  // ============================================================

  const renderLayers = () => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) {
      return;
    }

    const L = window.L;
    layerGroupRef.current.clearLayers();

    const activeRoutesList =
      propRoutes && propRoutes.length > 0 ? propRoutes : routes;

    // Resolve specific route if requested
    const activeSelectedRoute = selectedRoute
      ? activeRoutesList.find(
          (r) =>
            (r._id && selectedRoute._id && r._id.toString() === selectedRoute._id.toString()) ||
            (r.code && selectedRoute.code && r.code?.toUpperCase() === selectedRoute.code?.toUpperCase())
        ) || selectedRoute
      : null;

    // ==========================================================
    // 1. JEEPNEY ROUTES
    // ==========================================================

    if (activeLayer === "all" || activeLayer === "jeepneys") {
      const routeColorMap = {
        CSI_LUCAO: "#2563EB",
        DOWNTOWN: "#8B5CF6",
        CALASIAO: "#059669",
        BONUAN_TONDALIGAN: "#EA580C",
        BOLOSAN_HIGHWAY: "#D97706",
        SALISAY_BOLOSAN_OLD_ROAD: "#DB2777",
        BONUAN_BINLOC: "#0D9488",
        SAN_FABIAN_MANGALDAN_DAGUPAN: "#0284C7",
        LINGAYEN_BINMALEY_DAGUPAN: "#4F46E5",
      };

      // When a specific route is selected, isolate it so it is crystal clear
      const routesToRender = activeSelectedRoute
        ? [activeSelectedRoute]
        : activeRoutesList;

      let boundsToFit = null;
      let selectedPolylineToPopup = null;

      routesToRender.forEach((route) => {
        const isSelected = Boolean(
          activeSelectedRoute &&
            ((activeSelectedRoute._id && route._id && activeSelectedRoute._id.toString() === route._id.toString()) ||
              (activeSelectedRoute.code && route.code && activeSelectedRoute.code === route.code))
        );

        const baseColor =
          routeColorMap[route.code] ||
          (route.category === "city" ? colors.info || "#2563EB" : colors.warning || "#EA580C");

        const routeColor = isSelected ? "#2563EB" : baseColor;
        const weight = isSelected ? 6 : 4;

        // ------------------------------------------------------
        // ROUTE POINTS
        // ------------------------------------------------------

        let points = [];
        if (route.path && route.path.length > 0) {
          points = route.path
            .map((point) => [
              typeof point.lat === "number" ? point.lat : parseFloat(point.lat),
              typeof point.lng === "number" ? point.lng : parseFloat(point.lng),
            ])
            .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
        } else if (route.startPoint?.lat && route.endPoint?.lat) {
          points = [
            [parseFloat(route.startPoint.lat), parseFloat(route.startPoint.lng)],
            ...(route.waypoints || []).map((waypoint) => [
              parseFloat(waypoint.lat),
              parseFloat(waypoint.lng),
            ]),
            [parseFloat(route.endPoint.lat), parseFloat(route.endPoint.lng)],
          ].filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
        }

        if (points.length === 0) return;

        // ------------------------------------------------------
        // ROUTE GLOW CASING (FOR ISOLATED ROUTE)
        // ------------------------------------------------------
        if (isSelected) {
          const glowPolyline = L.polyline(points, {
            color: "#60A5FA",
            weight: 12,
            opacity: 0.45,
            lineCap: "round",
            lineJoin: "round",
          });
          glowPolyline.addTo(layerGroupRef.current);
        }

        // ------------------------------------------------------
        // ROUTE POLYLINE
        // ------------------------------------------------------
        const polyline = L.polyline(points, {
          color: routeColor,
          weight,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          dashArray: route.path && route.path.length > 0 ? null : "4, 4",
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 210px; color: ${colors.textPrimary};">
            <div style="font-weight: 800; color: #2563EB; font-size: 14px; margin-bottom: 4px;">
              🚐 ${route.name}
            </div>
            <div style="font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 4px;">
              <strong>Corridor:</strong> ${route.corridor || route.description || "Authorized Track"}
            </div>
            <div style="font-size: 11px; color: ${colors.textMuted};">
              Code: <strong>${route.code}</strong> • Distance: ~${route.distanceKm || 0} km • Category: ${route.category || "city"}
            </div>
          </div>
        `);

        polyline.addTo(layerGroupRef.current);

        if (isSelected) {
          boundsToFit = polyline.getBounds();
          selectedPolylineToPopup = polyline;
        }

        // ------------------------------------------------------
        // START TERMINAL PIN (A)
        // ------------------------------------------------------
        const depotPoint = points[0];
        const startIcon = L.divIcon({
          className: "route-start-pin",
          html: `
            <div style="
              background: #10B981;
              color: #FFFFFF;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 800;
            ">
              A
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const startMarker = L.marker(depotPoint, { icon: startIcon });
        startMarker.bindPopup(`
          <div style="font-family: sans-serif; color: ${colors.textPrimary};">
            <span style="background: #10B981; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
              START / DEPOT
            </span>
            <div style="font-weight: 800; font-size: 13px; margin-top: 4px;">
              ${route.startPoint?.name || route.name + " Depot"}
            </div>
            <div style="font-size: 11px; color: ${colors.textSecondary};">
              ${route.corridor || "Route Origin"}
            </div>
          </div>
        `);
        startMarker.addTo(layerGroupRef.current);

        // ------------------------------------------------------
        // END DESTINATION PIN (B)
        // ------------------------------------------------------
        if (points.length > 1) {
          const endPoint = points[points.length - 1];
          const isLoop =
            Math.abs(depotPoint[0] - endPoint[0]) < 0.0008 &&
            Math.abs(depotPoint[1] - endPoint[1]) < 0.0008;

          if (!isLoop) {
            const endIcon = L.divIcon({
              className: "route-end-pin",
              html: `
                <div style="
                  background: #EF4444;
                  color: #FFFFFF;
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  border: 3px solid #FFFFFF;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.35);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 13px;
                  font-weight: 800;
                ">
                  B
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            const endMarker = L.marker(endPoint, { icon: endIcon });
            endMarker.bindPopup(`
              <div style="font-family: sans-serif; color: ${colors.textPrimary};">
                <span style="background: #EF4444; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                  DESTINATION END
                </span>
                <div style="font-weight: 800; font-size: 13px; margin-top: 4px;">
                  ${route.endPoint?.name || "End Terminal"}
                </div>
              </div>
            `);
            endMarker.addTo(layerGroupRef.current);
          }
        }


      });

      // ------------------------------------------------------
      // AUTO-FIT BOUNDS TO ISOLATED ROUTE
      // ------------------------------------------------------
      if (boundsToFit && boundsToFit.isValid() && autoFocus && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(boundsToFit, {
          padding: [50, 50],
          maxZoom: 16,
        });

        if (selectedPolylineToPopup) {
          setTimeout(() => {
            try {
              selectedPolylineToPopup.openPopup();
            } catch (err) {
              // Ignore popup timing errors
            }
          }, 300);
        }
      }
    }

    // ==========================================================
    // 2. TRANSPORT TERMINALS
    // ==========================================================

    if ((activeLayer === "all" || activeLayer === "buses") && (!activeSelectedRoute || activeLayer === "buses")) {
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

        const terminalIcon = L.divIcon({
          className: "terminal-pin",
          html: `
            <div
              style="
                background: ${badgeColor};
                color: ${colors.white};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid ${colors.white};
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
              "
            >
              ${typeEmoji}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([terminal.lat, terminal.lng], {
          icon: terminalIcon,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 220px; color: ${colors.textPrimary};">
            <div style="background: ${badgeColor}; color: ${colors.white}; padding: 3px 6px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block; margin-bottom: 6px;">
              ${badgeLabel}
            </div>
            <div style="font-weight: 800; font-size: 14px; color: ${colors.textPrimary}; margin-bottom: 4px;">
              ${terminal.name}
            </div>
            <div style="font-size: 12px; color: ${colors.textSecondary}; margin-bottom: 6px;">
              📍 ${terminal.address}
            </div>
            <div style="font-size: 11px; color: ${colors.success}; font-weight: 600;">
              ${terminal.contactNumber ? `📞 ${terminal.contactNumber} • ` : ""}
              ${terminal.operatingHours || "24/7"}
            </div>
          </div>
        `);

        marker.addTo(layerGroupRef.current);
      });
    }
  };

  const handleRefitBounds = () => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    renderLayers();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        marginBottom: "24px",
        backgroundColor: colors.surface,
      }}
    >
      {/* ======================================================
          SELECTED ROUTE NOTICE & CONTROLS
      ====================================================== */}
      {selectedRoute && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            zIndex: 1000,
            backgroundColor: colors.surface,
            border: `1.5px solid ${colors.primary}`,
            borderRadius: "8px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: colors.primary,
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Navigation size={14} />
            <span>Active Route: {selectedRoute.name} ({selectedRoute.code})</span>
          </span>

          <button
            onClick={handleRefitBounds}
            title="Re-center route on map"
            style={{
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Maximize2 size={11} />
            <span>Fit Route</span>
          </button>

          {onSelectRoute && (
            <button
              onClick={() => onSelectRoute(null)}
              title="Show all Dagupan routes"
              style={{
                backgroundColor: colors.primary,
                color: colors.white,
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <RotateCcw size={11} />
              <span>Show All</span>
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
          padding: "5px",
          display: "flex",
          gap: "6px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={() => setActiveLayer("all")}
          style={{
            backgroundColor:
              activeLayer === "all" ? colors.primary : "transparent",
            color: activeLayer === "all" ? colors.white : colors.textSecondary,
            border: "none",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Layers size={13} />
          <span>All Layers</span>
        </button>

        <button
          onClick={() => setActiveLayer("jeepneys")}
          style={{
            backgroundColor:
              activeLayer === "jeepneys" ? colors.primary : "transparent",
            color:
              activeLayer === "jeepneys" ? colors.white : colors.textSecondary,
            border: "none",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>🚐 Routes</span>
        </button>

        <button
          onClick={() => setActiveLayer("buses")}
          style={{
            backgroundColor:
              activeLayer === "buses" ? colors.error : "transparent",
            color:
              activeLayer === "buses" ? colors.white : colors.textSecondary,
            border: "none",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Bus size={13} />
          <span>Terminals</span>
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
