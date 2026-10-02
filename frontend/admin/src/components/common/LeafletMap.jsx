import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Layers, Bus, Compass, Navigation } from 'lucide-react';

const LeafletMap = ({ selectedRoute = null, onSelectRoute = null }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'jeepneys', 'buses'
  const [routes, setRoutes] = useState([]);
  const [busTerminals, setBusTerminals] = useState([]);

  useEffect(() => {
    // Fetch routes and transport terminals
    const loadData = async () => {
      try {
        const [routesRes, terminalsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/routes'),
          axios.get('http://localhost:5000/api/terminals').catch(() => axios.get('http://localhost:5000/api/routes/bus-terminals')),
        ]);
        if (routesRes.data?.success) setRoutes(routesRes.data.data || []);
        if (terminalsRes.data?.success) setBusTerminals(terminalsRes.data.data || []);
      } catch (e) {
        console.error('Failed to load map data:', e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current, {
        center: [16.0433, 120.3342], // Dagupan City coordinates
        zoom: 13,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | SmartSakay Dagupan',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = window.L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    renderLayers();
  }, [routes, busTerminals, activeLayer, selectedRoute]);

  const renderLayers = () => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !window.L) return;
    const L = window.L;
    layerGroupRef.current.clearLayers();

    // 1. Render Jeepney Routes (Lines & Stations)
    if (activeLayer === 'all' || activeLayer === 'jeepneys') {
      const routeColorMap = {
        'CSI_LUCAO': '#2563EB', // Sapphire Blue
        'DOWNTOWN': '#8B5CF6',  // Vivid Purple
        'CALASIAO': '#059669',  // Emerald Green
        'BONUAN_TONDALIGAN': '#EA580C', // Sunset Orange / Coastal Coral
      };

      // When a route is selected, isolate and display only that route, hiding all other routes!
      const routesToRender = selectedRoute
        ? routes.filter((r) => r._id === selectedRoute._id)
        : routes;

      routesToRender.forEach((route) => {
        const isSelected = selectedRoute && selectedRoute._id === route._id;
        const baseColor = routeColorMap[route.code] || (route.category === 'city' ? '#2563EB' : '#D97706');
        const color = isSelected ? '#F59E0B' : baseColor;
        const weight = isSelected ? 6 : (route.path && route.path.length > 0 ? 4 : 3);

        let points = [];
        if (route.path && route.path.length > 0) {
          points = route.path.map((p) => [p.lat, p.lng]);
        } else if (route.startPoint?.lat && route.endPoint?.lat) {
          points = [
            [route.startPoint.lat, route.startPoint.lng],
            ...(route.waypoints || []).map((w) => [w.lat, w.lng]),
            [route.endPoint.lat, route.endPoint.lng],
          ];
        }

        if (points.length === 0) return;

        const polyline = L.polyline(points, {
          color,
          weight,
          opacity: 1.0,
          dashArray: (route.path && route.path.length > 0) ? null : '4, 4',
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 190px;">
            <div style="font-weight: 800; color: #1e293b; font-size: 14px; margin-bottom: 4px;">🚐 ${route.name}</div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
              <strong>Corridor:</strong> ${route.corridor || route.description || 'Continuous Loop'}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Distance: ~${route.distanceKm} km • ${route.isLoop !== false ? 'Loop Corridor' : 'Transit Corridor'}
            </div>
          </div>
        `);

        polyline.addTo(layerGroupRef.current);

        if (isSelected && points.length > 0) {
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [35, 35] });
        }

        // Marker for origin / station
        const depotPt = points[0];
        const startMarker = L.circleMarker(depotPt, {
          radius: isSelected ? 7 : 5,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        });
        startMarker.bindPopup(`<strong>${route.name} (Station)</strong><br/>${route.corridor || 'Terminal Station'}`);
        startMarker.addTo(layerGroupRef.current);
      });
    }


    // 2. Render Transport Terminals & Hubs
    if (activeLayer === 'all' || activeLayer === 'buses') {
      busTerminals.forEach((terminal) => {
        if (!terminal.lat || !terminal.lng) return;

        let typeEmoji = '🚌';
        let badgeColor = '#3B82F6';
        let badgeLabel = 'BUS TERMINAL';
        if (terminal.type === 'jeepney') {
          typeEmoji = '🚐';
          badgeColor = '#10B981';
          badgeLabel = 'JEEPNEY HUB';
        } else if (terminal.type === 'tricycle') {
          typeEmoji = '🛺';
          badgeColor = '#F59E0B';
          badgeLabel = 'TRICYCLE TODA';
        } else if (terminal.type === 'multimodal') {
          typeEmoji = '🏢';
          badgeColor = '#8B5CF6';
          badgeLabel = 'MULTIMODAL HUB';
        }

        const termIcon = L.divIcon({
          className: 'terminal-pin',
          html: `
            <div style="
              background: ${badgeColor};
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
            ">
              ${typeEmoji}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([terminal.lat, terminal.lng], { icon: termIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 220px;">
            <div style="background: ${badgeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block; margin-bottom: 6px;">
              ${badgeLabel}
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #0f172a; margin-bottom: 4px;">${terminal.name}</div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">📍 ${terminal.address}</div>
            ${terminal.destinations && terminal.destinations.length > 0 ? `<div style="font-size: 11px; color: #334155; margin-bottom: 6px;"><strong>Destinations:</strong> ${terminal.destinations.slice(0, 4).join(', ')}</div>` : ''}
            <div style="font-size: 11px; color: #16a34a; font-weight: 600;">
              ${terminal.contactNumber ? `📞 ${terminal.contactNumber} • ` : ''}${terminal.operatingHours || '24/7'}
            </div>
          </div>
        `);
        marker.addTo(layerGroupRef.current);
      });
    }

    if (selectedRoute && selectedRoute.startPoint?.lat && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([selectedRoute.startPoint.lat, selectedRoute.startPoint.lng], { animate: true });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      {/* Selected Route Isolation Notice */}
      {selectedRoute && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '8px',
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700' }}>
            Isolated Route: {selectedRoute.name}
          </span>
          {onSelectRoute && (
            <button
              onClick={() => onSelectRoute(null)}
              style={{
                background: '#2563EB',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Show All Routes
            </button>
          )}
        </div>
      )}

      {/* Interactive Map Overlay Controls */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '6px',
        display: 'flex',
        gap: '6px',
      }}>
        <button
          onClick={() => setActiveLayer('all')}
          style={{
            background: activeLayer === 'all' ? 'var(--primary)' : 'transparent',
            color: activeLayer === 'all' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Layers size={14} />
          <span>All Layers</span>
        </button>

        <button
          onClick={() => setActiveLayer('jeepneys')}
          style={{
            background: activeLayer === 'jeepneys' ? '#2563EB' : 'transparent',
            color: activeLayer === 'jeepneys' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🚐 Jeepney Routes</span>
        </button>

        <button
          onClick={() => setActiveLayer('buses')}
          style={{
            background: activeLayer === 'buses' ? '#DC2626' : 'transparent',
            color: activeLayer === 'buses' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Bus size={14} />
          <span>Bus Terminals Only</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#0f172a' }} />
    </div>
  );
};

export default LeafletMap;
