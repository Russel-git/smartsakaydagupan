import React, { useEffect, useRef } from "react";
import { Undo2, RotateCcw, MapPin, Maximize2 } from "lucide-react";
import { useTheme } from "../../contexts/theme/ThemeContext";

// Haversine distance calculator in km
const haversineKm = (lat1, lon1, lat2, lon2) => {
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
      points[i + 1].lng
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [16.0433, 120.3342],
        zoom: 14,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap | SmartSakay Dagupan',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = window.L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      map.on("click", (e) => {
        const nextPoints = [
          ...pointsRef.current,
          { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) },
        ];
        const dist = calculateTotalDistance(nextPoints);
        onPointsChange(nextPoints, dist);
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, []);

  // Re-render markers and polyline when points change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;
    const L = window.L;
    const layer = layerGroupRef.current;
    layer.clearLayers();

    if (points.length === 0) return;

    // Draw connecting polyline
    const latLngs = points.map((p) => [p.lat, p.lng]);
    const polyline = L.polyline(latLngs, {
      color: "#2563EB",
      weight: 5,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(layer);

    // Draw waypoint pins
    points.forEach((pt, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === points.length - 1 && points.length > 1;

      let pinHtml = "";
      if (isStart) {
        pinHtml = `<div style="background:#16A34A; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.35);">🟢</div>`;
      } else if (isEnd) {
        pinHtml = `<div style="background:#DC2626; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.35);">🔴</div>`;
      } else {
        pinHtml = `<div style="background:#2563EB; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx}</div>`;
      }

      const icon = L.divIcon({
        className: "p2p-waypoint-icon",
        html: pinHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([pt.lat, pt.lng], { icon })
        .bindPopup(`<b>${isStart ? "Start Point" : isEnd ? "Terminal End" : `Waypoint ${idx}`}</b><br/>Lat: ${pt.lat}<br/>Lng: ${pt.lng}`)
        .addTo(layer);
    });
  }, [points]);

  const handleUndo = () => {
    if (points.length === 0) return;
    const nextPoints = points.slice(0, -1);
    const dist = calculateTotalDistance(nextPoints);
    onPointsChange(nextPoints, dist);
  };

  const handleClear = () => {
    onPointsChange([], 0);
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || points.length === 0 || !window.L) return;
    const bounds = window.L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
  };

  const totalDist = calculateTotalDistance(points);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: colors.textPrimary }}>
            📍 Waypoints: <span style={{ color: "#2563EB" }}>{points.length}</span>
          </span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: colors.textPrimary }}>
            📏 Distance: <span style={{ color: "#059669" }}>{totalDist} km</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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

      {/* Interactive Map Box */}
      <div
        style={{
          position: "relative",
          height: "280px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Click Instruction Badge */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            zIndex: 1000,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🖱️ Click map to add path waypoints (OnTheGoMap mode)</span>
        </div>
      </div>
    </div>
  );
};

export default PointToPointRouteMap;
