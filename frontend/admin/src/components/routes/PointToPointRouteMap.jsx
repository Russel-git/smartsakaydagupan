import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Undo2,
  RotateCcw,
  MapPin,
  Maximize2,
  Route,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useTheme } from "../../contexts/theme/ThemeContext";

// Haversine distance calculator in km (used as reliable fallback)
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateTotalDistance = (points) => {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineKm(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng,
    );
  }
  return Math.round(total * 100) / 100;
};

const PointToPointRouteMap = ({ points = [], onPointsChange }) => {
  const { colors } = useTheme();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const pointsRef = useRef(points);
  pointsRef.current = points;

  const [snapToRoad, setSnapToRoad] = useState(true);
  const snapToRoadRef = useRef(true);
  snapToRoadRef.current = snapToRoad;

  const [isRouting, setIsRouting] = useState(false);
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [roadDistance, setRoadDistance] = useState(0);
  const [roadDurationMins, setRoadDurationMins] = useState(0);
  const [routingNotice, setRoutingNotice] = useState(null);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const calculateRoute = useCallback(
    async (targetPoints, isSnapMode) => {
      if (!targetPoints || targetPoints.length < 2) {
        setRoadCoordinates(targetPoints || []);
        setRoadDistance(0);
        setRoadDurationMins(0);
        setIsRouting(false);
        setRoutingNotice(null);
        if (onPointsChange) {
          onPointsChange(targetPoints || [], 0, targetPoints || []);
        }
        return;
      }

      if (!isSnapMode) {
        const straightDist = calculateTotalDistance(targetPoints);
        const estMins = Math.max(1, Math.round((straightDist / 30) * 60));
        setRoadCoordinates(targetPoints);
        setRoadDistance(straightDist);
        setRoadDurationMins(estMins);
        setIsRouting(false);
        setRoutingNotice(null);
        if (onPointsChange) {
          onPointsChange(targetPoints, straightDist, targetPoints);
        }
        return;
      }

      setIsRouting(true);
      setRoutingNotice(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentReqId = ++requestIdRef.current;

      const coordsParam = targetPoints
        .map((p) => `${p.lng},${p.lat}`)
        .join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&continue_straight=true`;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 9000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Routing server status ${response.status}`);
        }

        const data = await response.json();

        if (currentReqId !== requestIdRef.current) return;

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const best = data.routes[0];
          const distKm = Math.round((best.distance / 1000) * 100) / 100;
          const durMins = Math.max(1, Math.round(best.duration / 60));
          const denseCoords = best.geometry.coordinates.map((c) => ({
            lat: Number(c[1].toFixed(6)),
            lng: Number(c[0].toFixed(6)),
          }));

          setRoadCoordinates(denseCoords);
          setRoadDistance(distKm);
          setRoadDurationMins(durMins);
          setRoutingNotice(null);
          setIsRouting(false);

          if (onPointsChange) {
            onPointsChange(targetPoints, distKm, denseCoords);
          }
        } else {
          throw new Error(data.message || "No navigable road path found");
        }
      } catch (err) {
        if (
          err.name === "AbortError" &&
          currentReqId !== requestIdRef.current
        ) {
          return;
        }
        if (currentReqId !== requestIdRef.current) return;

        console.warn("OSRM road routing unavailable, applying fallback:", err);
        const fallbackDist = calculateTotalDistance(targetPoints);
        const estMins = Math.max(1, Math.round((fallbackDist / 30) * 60));

        setRoadCoordinates(targetPoints);
        setRoadDistance(fallbackDist);
        setRoadDurationMins(estMins);
        setIsRouting(false);
        setRoutingNotice(
          "Road path could not reach off-road pin. Direct straight line applied.",
        );

        if (onPointsChange) {
          onPointsChange(targetPoints, fallbackDist, targetPoints);
        }
      }
    },
    [onPointsChange],
  );

  const calculateRouteRef = useRef(calculateRoute);
  calculateRouteRef.current = calculateRoute;

  useEffect(() => {
    if (points.length === 0 && roadCoordinates.length > 0) {
      setRoadCoordinates([]);
      setRoadDistance(0);
      setRoadDurationMins(0);
      setRoutingNotice(null);
    }
  }, [points.length, roadCoordinates.length]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [16.0433, 120.3342], // Dagupan City Center
        zoom: 14,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | SmartSakay Dagupan',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = window.L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      map.on("click", (e) => {
        const newPt = {
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        };
        const nextPoints = [...pointsRef.current, newPt];
        calculateRouteRef.current(nextPoints, snapToRoadRef.current);
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Re-render markers and road polyline when points or road geometry change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;
    const L = window.L;
    const layer = layerGroupRef.current;
    layer.clearLayers();

    if (points.length === 0) return;

    const activeLinePoints =
      roadCoordinates.length > 1 ? roadCoordinates : points;

    // Draw connecting road polyline
    if (activeLinePoints.length > 1) {
      const latLngs = activeLinePoints.map((p) => [p.lat, p.lng]);

      // Glow casing for high visibility
      L.polyline(latLngs, {
        color: snapToRoad ? "#60A5FA" : "#FBBF24",
        weight: 9,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);

      // Core route line
      L.polyline(latLngs, {
        color: snapToRoad ? "#2563EB" : "#D97706",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        dashArray: snapToRoad ? null : "6, 6",
      }).addTo(layer);
    }

    // Draw waypoint pins
    points.forEach((pt, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === points.length - 1 && points.length > 1;

      let pinHtml = "";
      if (isStart) {
        pinHtml = `<div style="background:#16A34A; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.35);" title="Start Point">🟢</div>`;
      } else if (isEnd) {
        pinHtml = `<div style="background:#DC2626; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.35);" title="Destination Terminal">🔴</div>`;
      } else {
        pinHtml = `<div style="background:#2563EB; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx}</div>`;
      }

      const icon = L.divIcon({
        className: "p2p-waypoint-icon",
        html: pinHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([pt.lat, pt.lng], { icon })
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 130px;">
            <div style="font-weight: 700; color: #1E293B; margin-bottom: 2px;">
              ${isStart ? "🟢 Start Terminal" : isEnd ? "🔴 Destination End" : `🔵 Stop Waypoint #${idx}`}
            </div>
            <div style="color: #64748B; font-size: 11px;">
              Lat: ${pt.lat}<br/>Lng: ${pt.lng}
            </div>
          </div>`,
        )
        .addTo(layer);
    });
  }, [points, roadCoordinates, snapToRoad]);

  const handleUndo = () => {
    if (points.length === 0) return;
    const nextPoints = points.slice(0, -1);
    calculateRoute(nextPoints, snapToRoad);
  };

  const handleClear = () => {
    calculateRoute([], snapToRoad);
  };

  const handleToggleSnap = () => {
    const nextSnap = !snapToRoad;
    setSnapToRoad(nextSnap);
    calculateRoute(points, nextSnap);
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !window.L) return;
    const activeLinePoints =
      roadCoordinates.length > 0 ? roadCoordinates : points;
    if (activeLinePoints.length === 0) return;

    const bounds = window.L.latLngBounds(
      activeLinePoints.map((p) => [p.lat, p.lng]),
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35] });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      {/* OnTheGoMap Controls Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 12px",
          backgroundColor: colors.surfaceElevated || "#F8FAFC",
          borderRadius: "8px",
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Route Stats & Road Routing Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: colors.textPrimary,
            }}
          >
            📍 Stops: <span style={{ color: "#2563EB" }}>{points.length}</span>
          </span>

          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: colors.textPrimary,
            }}
          >
            📏 Distance:{" "}
            <span style={{ color: "#059669" }}>{roadDistance} km</span>
          </span>

          {roadDurationMins > 0 && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: colors.textSecondary,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock size={12} />
              <span>~{roadDurationMins} min</span>
            </span>
          )}

          {/* Status Badge */}
          {isRouting ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#2563EB",
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              <span>Finding best road route...</span>
            </span>
          ) : snapToRoad && points.length > 1 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#16A34A",
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: "rgba(22, 163, 74, 0.08)",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
              title="Snaps strictly to streets, highways, and bridges over water"
            >
              <CheckCircle2 size={12} />
              <span>Road-Aligned (Avoids Water)</span>
            </span>
          ) : !snapToRoad && points.length > 1 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#D97706",
                fontSize: "11px",
                fontWeight: "600",
                backgroundColor: "rgba(217, 119, 6, 0.08)",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              <AlertTriangle size={12} />
              <span>Direct Line Mode</span>
            </span>
          ) : null}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Snap Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleSnap}
            className="btn btn-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: snapToRoad
                ? "rgba(37, 99, 235, 0.1)"
                : "transparent",
              borderColor: snapToRoad ? "#2563EB" : colors.border,
              color: snapToRoad ? "#2563EB" : colors.textPrimary,
              fontWeight: snapToRoad ? "600" : "500",
            }}
            title={
              snapToRoad
                ? "Road snapping active: follows streets & bridges. Click to switch to manual direct lines."
                : "Direct lines active. Click to enable automatic road snapping."
            }
          >
            <Route size={13} />
            <span>{snapToRoad ? "Snap to Roads" : "Direct Lines"}</span>
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={points.length === 0}
            className="btn btn-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: points.length === 0 ? "not-allowed" : "pointer",
              opacity: points.length === 0 ? 0.5 : 1,
            }}
            title="Undo last placed point"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={points.length === 0}
            className="btn btn-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#DC2626",
              cursor: points.length === 0 ? "not-allowed" : "pointer",
              opacity: points.length === 0 ? 0.5 : 1,
            }}
            title="Clear all points"
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>

          {points.length > 1 && (
            <button
              type="button"
              onClick={handleFitBounds}
              className="btn btn-secondary"
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Zoom to fit route points"
            >
              <Maximize2 size={13} />
              <span>Fit</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice / Warning Banner */}
      {routingNotice && (
        <div
          style={{
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "6px",
            backgroundColor: "#FEF3C7",
            border: "1px solid #FDE68A",
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <AlertTriangle size={14} />
          <span>{routingNotice}</span>
        </div>
      )}

      {/* Interactive Map Box */}
      <div
        style={{
          position: "relative",
          height: "320px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        />

        {/* Click Instruction Badge */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            zIndex: 1000,
            backgroundColor: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(4px)",
            color: "#FFFFFF",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>
            {isRouting
              ? "⏳ Calculating best street and bridge route..."
              : "🖱️ Click map to add stops • Follows streets & bridges automatically"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PointToPointRouteMap;
