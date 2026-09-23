import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import { routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS } from '../../utils/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Haversine distance calculator in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
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
  return Math.round(R * c * 10) / 10;
};

const RouteMapScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const webViewRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [busTerminals, setBusTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jeepneys'); // 'jeepneys' | 'buses'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [commuterLocation, setCommuterLocation] = useState({
    lat: 16.0433,
    lng: 120.3342,
    accuracy: 25,
    isReal: false,
  });
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS...');
  const [recenterCount, setRecenterCount] = useState(0);

  // Real-time continuous location tracking
  useEffect(() => {
    let isMounted = true;
    let webWatchId = null;
    let nativeLocationSubscription = null;

    const startLocationTracking = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
          // 1. Initial Immediate Fix on Web
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              setCommuterLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy || 20),
                isReal: true,
              });
              setLocationStatus(`Live GPS Active (±${Math.round(pos.coords.accuracy || 20)}m)`);
            },
            (err) => {
              console.warn('Web initial GPS warning:', err.message);
              if (isMounted) {
                setLocationStatus('Dagupan City Center (GPS Simulated)');
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );

          // 2. Continuous Real-Time Watch on Web
          webWatchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (!isMounted) return;
              setCommuterLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy || 20),
                isReal: true,
              });
              setLocationStatus(`Live GPS Active (±${Math.round(pos.coords.accuracy || 20)}m)`);
            },
            (err) => {
              console.warn('Web continuous GPS watch warning:', err.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        } else {
          // Native iOS / Android Tracking
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            setLocationStatus('Acquiring Satellite Lock...');
            try {
              const initialLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              if (!isMounted) return;
              setCommuterLocation({
                lat: initialLoc.coords.latitude,
                lng: initialLoc.coords.longitude,
                accuracy: Math.round(initialLoc.coords.accuracy || 20),
                isReal: true,
              });
              setLocationStatus(`Live GPS Active (±${Math.round(initialLoc.coords.accuracy || 20)}m)`);
            } catch (posErr) {
              console.warn('Initial GPS position error, falling back:', posErr);
              const fallbackLoc = await Location.getLastKnownPositionAsync();
              if (fallbackLoc && isMounted) {
                setCommuterLocation({
                  lat: fallbackLoc.coords.latitude,
                  lng: fallbackLoc.coords.longitude,
                  accuracy: Math.round(fallbackLoc.coords.accuracy || 30),
                  isReal: true,
                });
                setLocationStatus('Live GPS (Last Known)');
              }
            }

            // Continuous subscription for mobile device movement
            nativeLocationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 3000,
                distanceInterval: 4,
              },
              (newLoc) => {
                if (!isMounted) return;
                setCommuterLocation({
                  lat: newLoc.coords.latitude,
                  lng: newLoc.coords.longitude,
                  accuracy: Math.round(newLoc.coords.accuracy || 15),
                  isReal: true,
                });
                setLocationStatus(`Live GPS Active (±${Math.round(newLoc.coords.accuracy || 15)}m)`);
              }
            );
          } else {
            setLocationStatus('GPS Permission Denied (Dagupan Center)');
          }
        }
      } catch (e) {
        console.warn('Location initialization error:', e);
        if (isMounted) setLocationStatus('Dagupan Center (Simulated)');
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (webWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
      if (nativeLocationSubscription) {
        nativeLocationSubscription.remove();
      }
    };
  }, []);

  // Fetch routes and bus terminals
  const loadData = async () => {
    try {
      const [routesRes, terminalsRes] = await Promise.all([
        routesAPI.getAllRoutes(),
        routesAPI.getBusTerminals(commuterLocation.isReal ? { lat: commuterLocation.lat, lng: commuterLocation.lng } : {}),
      ]);
      setRoutes(Array.isArray(routesRes.data?.data) ? routesRes.data.data : []);
      const rawTerminals = Array.isArray(terminalsRes.data?.data) ? terminalsRes.data.data : [];
      setBusTerminals(rawTerminals);
    } catch (e) {
      console.error('Data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Compute live distances for terminals based on current commuterLocation
  const terminalsWithLiveDistance = busTerminals.map((t) => {
    const dist = calculateDistanceKm(commuterLocation.lat, commuterLocation.lng, t.lat, t.lng);
    return {
      ...t,
      distanceKm: dist !== null ? dist : t.distanceKm,
    };
  }).sort((a, b) => {
    if (a.distanceKm === undefined || a.distanceKm === null) return 1;
    if (b.distanceKm === undefined || b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  const safeRoutes = Array.isArray(routes) ? routes : [];
  const filteredRoutes = selectedCategory === 'all'
    ? safeRoutes
    : safeRoutes.filter((r) => r.category === selectedCategory);

  // Trigger re-centering on commuter location
  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
  };

  // Generate HTML for the embedded Leaflet Map
  const generateLeafletHtml = () => {
    const lat = commuterLocation.lat || 16.0433;
    const lng = commuterLocation.lng || 120.3342;
    const accuracy = commuterLocation.accuracy || 25;
    const isRealGPS = commuterLocation.isReal;

    const routesJson = JSON.stringify(
      routes.map(r => ({
        id: r._id,
        name: r.name,
        code: r.code,
        category: r.category,
        distanceKm: r.distanceKm,
        corridor: r.corridor || r.description || '',
        isLoop: r.isLoop !== false,
        path: r.path || [],
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        waypoints: r.waypoints || [],
        terminalLocation: r.terminalLocation || null,
      }))
    );

    const terminalsJson = JSON.stringify(terminalsWithLiveDistance);
    const selectedRouteId = selectedItem?._id || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; overflow: hidden; }
          .leaflet-popup-content-wrapper {
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          }
          
          /* Commuter Live Location Pulsating Radar Beacon */
          .commuter-beacon-wrapper {
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .commuter-pulse-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.45);
            animation: radar-sweep 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
          }
          .commuter-pulse-ring-outer {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid rgba(59, 130, 246, 0.6);
            animation: radar-sweep-delayed 2s cubic-bezier(0.2, 0.8, 0.4, 1) infinite 0.6s;
          }
          .commuter-core-dot {
            position: relative;
            z-index: 2;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2563EB;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 14px rgba(37,99,235,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .commuter-core-inner {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ffffff;
          }
          @keyframes radar-sweep {
            0% { transform: scale(0.5); opacity: 0.9; }
            75% { transform: scale(1.8); opacity: 0.1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes radar-sweep-delayed {
            0% { transform: scale(0.5); opacity: 0.8; }
            75% { transform: scale(1.7); opacity: 0.1; }
            100% { transform: scale(2.0); opacity: 0; }
          }

          /* Floating Locate Me Button */
          .locate-me-btn {
            position: absolute;
            right: 12px;
            bottom: 24px;
            z-index: 1000;
            background: #0f172a;
            color: #ffffff;
            border: 2px solid #2563eb;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5);
            transition: all 0.2s ease;
          }
          .locate-me-btn:hover {
            transform: scale(1.08);
            background: #1e293b;
            border-color: #60a5fa;
          }
          .locate-me-btn:active {
            transform: scale(0.95);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <button id="locateMeBtn" class="locate-me-btn" title="Re-center on My Exact Location">🎯</button>
        <script>
          var userLat = ${lat};
          var userLng = ${lng};
          var userAccuracy = ${accuracy};
          var isRealFix = ${isRealGPS};

          var map = L.map('map', { zoomControl: true }).setView([userLat, userLng], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
          }).addTo(map);

          // 1. Accuracy Circle for Commuter GPS
          var commuterCircle = L.circle([userLat, userLng], {
            radius: Math.max(userAccuracy, 20),
            color: '#2563EB',
            fillColor: '#3B82F6',
            fillOpacity: 0.15,
            weight: 1.5
          }).addTo(map);

          // 2. High-Visibility Pulsating Commuter Beacon
          var commuterIcon = L.divIcon({
            className: 'commuter-live-beacon',
            html: '<div class="commuter-beacon-wrapper"><div class="commuter-pulse-ring"></div><div class="commuter-pulse-ring-outer"></div><div class="commuter-core-dot"><div class="commuter-core-inner"></div></div></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          var commuterMarker = L.marker([userLat, userLng], {
            icon: commuterIcon,
            zIndexOffset: 3000
          }).addTo(map);

          var commuterPopupHtml = 
            '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-width:180px;">' +
            '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
            '<span style="background:#2563EB; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">YOU ARE HERE</span>' +
            '<span style="color:#10B981; font-weight:700; font-size:11px;">● LIVE GPS</span>' +
            '</div>' +
            '<div style="font-size:13px; font-weight:800; color:#0f172a;">Commuter Exact Location</div>' +
            '<div style="font-family:monospace; font-size:11px; color:#64748b; margin-top:2px;">' +
            userLat.toFixed(5) + '°N, ' + userLng.toFixed(5) + '°E (±' + userAccuracy + 'm)' +
            '</div>' +
            '<div style="font-size:11px; color:#3b82f6; margin-top:4px;">Dagupan City, Pangasinan</div>' +
            '</div>';

          commuterMarker.bindPopup(commuterPopupHtml);

          // Locate Me Button Handler
          document.getElementById('locateMeBtn').onclick = function() {
            map.setView([userLat, userLng], 16, { animate: true });
            commuterMarker.openPopup();
          };

          // Continuous Web Geolocation Watch inside Leaflet
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.watchPosition(
              function(pos) {
                userLat = pos.coords.latitude;
                userLng = pos.coords.longitude;
                userAccuracy = Math.round(pos.coords.accuracy || 20);
                commuterMarker.setLatLng([userLat, userLng]);
                commuterCircle.setLatLng([userLat, userLng]);
                commuterCircle.setRadius(Math.max(userAccuracy, 20));
              },
              function(err) {},
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
            );
          }

          var activeTab = '${activeTab}';
          var routes = ${routesJson};
          var busTerminals = ${terminalsJson};
          var selectedId = '${selectedRouteId}';

          // 3. Render Static Jeepney Routes (Polylines)
          if (activeTab === 'jeepneys') {
            var selectedBounds = null;

            var routeColorMap = {
              'CSI_LUCAO': '#2563EB',
              'DOWNTOWN': '#8B5CF6',
              'CALASIAO': '#059669',
              'BONUAN_TONDALIGAN': '#EA580C',
              'BOLOSAN_HIGHWAY': '#D97706',
              'SALISAY_BOLOSAN_OLD_ROAD': '#DB2777',
            };

            var routesToRender = selectedId
              ? routes.filter(function(r) { return r.id === selectedId; })
              : routes;

            routesToRender.forEach(function(route) {
              var isSelected = (selectedId && route.id === selectedId);
              var baseColor = routeColorMap[route.code] || (route.category === 'city' ? '#2563EB' : '#10B981');
              var color = isSelected ? '#F59E0B' : baseColor;
              var weight = isSelected ? 6 : (route.path && route.path.length > 0 ? 4 : 3);
              var opacity = 1.0;

              var pts = [];
              if (route.path && route.path.length > 0) {
                pts = route.path.map(function(p) { return [p.lat, p.lng]; });
              } else if (route.startPoint && route.endPoint) {
                pts = [
                  [route.startPoint.lat, route.startPoint.lng],
                  ...(route.waypoints || []).map(function(w) { return [w.lat, w.lng]; }),
                  [route.endPoint.lat, route.endPoint.lng]
                ];
              }

              if (pts.length > 0) {
                var poly = L.polyline(pts, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  dashArray: (route.path && route.path.length > 0) ? null : '5, 5'
                }).bindPopup(
                  '<div style="min-width:180px;">' +
                  '<div style="font-weight:800; font-size:13px; color:' + color + ';">🚐 ' + route.name + '</div>' +
                  (route.corridor ? '<div style="font-size:11px; margin-top:3px; color:#334155; font-weight:600;">' + route.corridor + '</div>' : '') +
                  '<div style="font-size:11px; color:#64748b; margin-top:4px;">Distance: ~' + route.distanceKm + ' km • ' + (route.isLoop ? 'Loop Corridor' : 'Static Corridor') + '</div>' +
                  '</div>'
                ).addTo(map);

                if (isSelected) {
                  selectedBounds = poly.getBounds();
                }
              }
            });

            // Central Downtown Dagupan Hub Pin
            var downtownIcon = L.divIcon({
              className: 'downtown-pin',
              html: '<div style="background:#2563EB; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:bold; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.5);">📍</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            L.marker([16.0433, 120.3342], { icon: downtownIcon, zIndexOffset: 1500 })
              .bindPopup('<div style="min-width:200px; font-family:-apple-system, BlinkMacSystemFont, sans-serif;"><strong style="color:#2563EB; font-size:13px;">📍 Downtown Dagupan (Central Hub)</strong><br/><div style="font-size:11px; color:#334155; margin-top:3px; font-weight:600;">Main Boarding Area & Staging</div><div style="font-size:11px; color:#64748b; margin-top:2px;">All Dagupan City jeepney routes converge and can be boarded here in Downtown.</div></div>')
              .addTo(map);

            if (selectedBounds) {
              map.fitBounds(selectedBounds, { padding: [40, 40] });
            }
          }

          // 4. Render Dagupan Transit Terminals & Hubs
          if (activeTab === 'buses') {
            if (busTerminals.length === 0) {
              var emptyNotice = L.control({ position: 'topright' });
              emptyNotice.onAdd = function() {
                var div = L.DomUtil.create('div', 'empty-terminals-notice');
                div.style.background = 'rgba(15, 23, 42, 0.92)';
                div.style.border = '1px solid rgba(56, 189, 248, 0.3)';
                div.style.color = '#94a3b8';
                div.style.padding = '8px 12px';
                div.style.borderRadius = '8px';
                div.style.fontSize = '11px';
                div.style.maxWidth = '220px';
                div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
                div.innerHTML = '📍 <strong>No Terminals Set Yet</strong><br/>Terminals pinpointed by the admin will display here.';
                return div;
              };
              emptyNotice.addTo(map);
            }

            busTerminals.forEach(function(t) {
              var typeEmoji = '🚌';
              var badgeColor = '#3B82F6';
              var badgeLabel = 'BUS TERMINAL';
              if (t.type === 'jeepney') {
                typeEmoji = '🚐';
                badgeColor = '#10B981';
                badgeLabel = 'JEEPNEY STAGING HUB';
              } else if (t.type === 'tricycle') {
                typeEmoji = '🛺';
                badgeColor = '#F59E0B';
                badgeLabel = 'TRICYCLE TODA HUB';
              } else if (t.type === 'multimodal') {
                typeEmoji = '🏢';
                badgeColor = '#8B5CF6';
                badgeLabel = 'MULTIMODAL TRANSIT HUB';
              }

              var termIcon = L.divIcon({
                className: 'terminal-pin',
                html: '<div style="background:' + badgeColor + '; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.4);">' + typeEmoji + '</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });

              var distHtml = (t.distanceKm !== undefined && t.distanceKm !== null)
                ? '<div style="font-size:11px; color:' + badgeColor + '; font-weight:700; margin-top:3px;">📍 ' + t.distanceKm + ' km from your current location</div>'
                : '';
              var destHtml = (t.destinations && t.destinations.length > 0)
                ? '<div style="font-size:11px; color:#475569; margin-top:3px;"><strong>Routes:</strong> ' + t.destinations.slice(0, 4).join(', ') + '</div>'
                : '';
              var contactHtml = t.contactNumber
                ? '<div style="font-size:11px; margin-top:3px; color:#16a34a; font-weight:600;">📞 ' + t.contactNumber + '</div>'
                : '';

              L.marker([t.lat, t.lng], { icon: termIcon })
                .bindPopup(
                  '<div style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; min-width: 210px;">' +
                  '<div style="background:' + badgeColor + '; color:white; padding:2px 7px; border-radius:3px; font-size:9px; font-weight:800; display:inline-block; letter-spacing:0.5px;">' + badgeLabel + '</div>' +
                  '<h4 style="margin:5px 0 2px 0; font-size:14px; color:#0f172a;">' + t.name + '</h4>' +
                  (t.company ? '<div style="font-size:11px; color:#64748b; font-weight:600;">' + t.company + '</div>' : '') +
                  '<div style="font-size:11px; color:#334155; margin-top:3px;">📍 ' + t.address + '</div>' +
                  '<div style="font-size:11px; color:#64748b; margin-top:2px;">🕒 ' + (t.operatingHours || '24/7') + '</div>' +
                  distHtml +
                  contactHtml +
                  destHtml +
                  '</div>'
                )
                .addTo(map);
            });
          }
        </script>
      </body>
      </html>
    `;
  };

  if (loading) return <LoadingSpinner text="Connecting to Dagupan Transit Grid..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header: Real-time commuter GPS status with Re-center action */}
      <View style={[styles.gpsStatusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.gpsRow}>
          <View style={[styles.gpsDot, { backgroundColor: commuterLocation.isReal ? '#10B981' : '#F59E0B' }]} />
          <Text style={[styles.gpsStatusText, { color: colors.textPrimary }]}>
            {locationStatus}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.7}
          style={styles.recenterHeaderBtn}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#38BDF8" />
          <Text style={styles.recenterHeaderText}>
            {commuterLocation.lat.toFixed(4)}°N, {commuterLocation.lng.toFixed(4)}°E
          </Text>
        </TouchableOpacity>
      </View>

      {/* Primary Switcher: Jeepney Routes vs Transport Terminals */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'jeepneys' && { backgroundColor: colors.primary }]}
          onPress={() => { setActiveTab('jeepneys'); setSelectedItem(null); }}
        >
          <MaterialCommunityIcons 
            name="van-passenger" 
            size={18} 
            color={activeTab === 'jeepneys' ? '#ffffff' : colors.textSecondary} 
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'jeepneys' ? '#ffffff' : colors.textSecondary }]}>
            Jeepney Routes ({routes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'buses' && { backgroundColor: colors.primary }]}
          onPress={() => { setActiveTab('buses'); setSelectedItem(null); }}
        >
          <MaterialCommunityIcons 
            name="domain" 
            size={18} 
            color={activeTab === 'buses' ? '#ffffff' : colors.textSecondary} 
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'buses' ? '#ffffff' : colors.textSecondary }]}>
            Terminals & Hubs ({busTerminals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Embedded Interactive Leaflet Map (WebView on Android/iOS, iframe on Web) */}
      <View style={styles.mapContainer}>
        {selectedItem && (
          <View style={styles.selectedRouteOverlay}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <MaterialCommunityIcons name="target" size={16} color="#F59E0B" />
              <Text style={styles.selectedRouteOverlayText} numberOfLines={1}>
                Solo Route: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{selectedItem.name}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              style={styles.showAllBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="eye" size={13} color="#FFFFFF" />
              <Text style={styles.showAllBtnText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )}
        {Platform.OS === 'web' ? (
          <iframe
            key={`leaflet-map-${activeTab}-${recenterCount}`}
            title="Dagupan Transit Leaflet Map"
            srcDoc={generateLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            key={`leaflet-webview-${activeTab}-${recenterCount}`}
            originWhitelist={['*']}
            source={{ html: generateLeafletHtml() }}
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Category Filter for Jeepney Routes */}
      {activeTab === 'jeepneys' && (
        <View style={styles.filterRow}>
          {['all', 'city', 'intercity'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={{
                  color: selectedCategory === cat ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: '600',
                  fontSize: FONTS.sizes.xs,
                  textTransform: 'capitalize',
                }}
              >
                {cat === 'all' ? 'All Static Routes' : `${cat} Corridors`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content List: Static Jeepney Corridors OR Bus Terminals */}
      {activeTab === 'jeepneys' ? (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedItem?._id === item._id;
            const hasGpxPath = item.path && item.path.length > 0;

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedItem(isSelected ? null : item)}
              >
                <Card
                  style={[
                    styles.itemCard,
                    isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: item.category === 'city' ? '#DBEAFE' : '#FEF3C7' }]}>
                      <Text style={{ color: item.category === 'city' ? '#2563EB' : '#D97706', fontSize: FONTS.sizes.xs, fontWeight: '700' }}>
                        {item.category.toUpperCase()} JEEPNEY • {item.isLoop !== false ? 'LOOP' : 'CORRIDOR'}
                      </Text>
                    </View>
                    <Text style={[styles.distanceBadge, { color: colors.textMuted }]}>~{item.distanceKm} km</Text>
                  </View>

                  <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.name}</Text>

                  {/* Static Route Corridor */}
                  <View style={styles.corridorContainer}>
                    <MaterialCommunityIcons name="transit-connection-variant" size={16} color={colors.primary} />
                    <Text style={[styles.corridorText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.corridor || item.description || 'Static Dagupan transit corridor'}
                    </Text>
                  </View>

                  {/* Footer with badges and View Details */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.metaBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                        {item.operatingHours?.start || '04:00'} - {item.operatingHours?.end || '21:00'}
                      </Text>
                    </View>

                    {hasGpxPath && (
                      <View style={[styles.metaBadge, { backgroundColor: '#ECFDF5' }]}>
                        <MaterialCommunityIcons name="map-marker-path" size={13} color="#10B981" />
                        <Text style={[styles.metaBadgeText, { color: '#059669', fontWeight: '700' }]}>
                          GPX Track Active
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => navigation.navigate('RouteDetail', { route: item })}
                    >
                      <Text style={[styles.detailBtnText, { color: colors.primary }]}>Details</Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={terminalsWithLiveDistance}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isBus = item.type === 'bus' || !item.type;
            const isJeepney = item.type === 'jeepney';
            const isTricycle = item.type === 'tricycle';
            const isMultimodal = item.type === 'multimodal';

            let typeColor = '#3B82F6';
            let typeBadgeBg = '#DBEAFE';
            let typeLabel = 'PROVINCIAL BUS TERMINAL';
            if (isJeepney) {
              typeColor = '#10B981';
              typeBadgeBg = '#D1FAE5';
              typeLabel = 'JEEPNEY STAGING HUB';
            } else if (isTricycle) {
              typeColor = '#F59E0B';
              typeBadgeBg = '#FEF3C7';
              typeLabel = 'TRICYCLE TODA TERMINAL';
            } else if (isMultimodal) {
              typeColor = '#8B5CF6';
              typeBadgeBg = '#EDE9FE';
              typeLabel = 'MULTIMODAL TRANSIT HUB';
            }

            return (
              <Card style={[styles.itemCard, { borderLeftWidth: 4, borderLeftColor: typeColor }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: typeBadgeBg }]}>
                    <Text style={{ color: typeColor, fontSize: FONTS.sizes.xs, fontWeight: '700' }}>
                      {typeLabel}
                    </Text>
                  </View>
                  {item.distanceKm !== undefined && item.distanceKm !== null && (
                    <Text style={[styles.distanceBadge, { color: typeColor, fontWeight: '700' }]}>
                      {item.distanceKm} km from you
                    </Text>
                  )}
                </View>

                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.name}</Text>
                {item.company ? (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: -3, marginBottom: 4, fontWeight: '600' }}>
                    {item.company}
                  </Text>
                ) : null}
                <Text style={[styles.terminalAddress, { color: colors.textSecondary }]}>
                  📍 {item.address}
                </Text>

                <View style={styles.terminalMetaRow}>
                  <Text style={[styles.terminalMetaText, { color: colors.textMuted }]}>
                    🕒 {item.operatingHours || '24/7'}
                  </Text>
                  {item.contactNumber ? (
                    <Text style={[styles.terminalMetaText, { color: colors.primary, fontWeight: '600' }]}>
                      📞 {item.contactNumber}
                    </Text>
                  ) : null}
                </View>

                {item.destinations && item.destinations.length > 0 && (
                  <View style={styles.destinationsBox}>
                    <Text style={[styles.destinationsLabel, { color: colors.textMuted }]}>
                      {isBus ? 'Major Bus Destinations:' : 'Connecting Routes / Areas:'}
                    </Text>
                    <Text style={[styles.destinationsText, { color: colors.textPrimary }]}>
                      {item.destinations.join(' • ')}
                    </Text>
                  </View>
                )}

                {item.amenities && item.amenities.length > 0 && (
                  <View style={styles.amenitiesRow}>
                    {item.amenities.slice(0, 3).map((amenity, idx) => (
                      <View key={idx} style={[styles.amenityChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.amenityText, { color: colors.textSecondary }]}>✓ {amenity}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12, opacity: 0.6 }} />
              <Text style={{ fontSize: FONTS.sizes.md, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>
                No Terminals Added Yet
              </Text>
              <Text style={{ fontSize: FONTS.sizes.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18, maxWidth: 300 }}>
                Terminals pinpointed and set by the administrator will immediately display here and on the live Dagupan commuter map.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gpsStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsDot: { width: 9, height: 9, borderRadius: 5 },
  gpsStatusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  recenterHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  recenterHeaderText: { fontSize: FONTS.sizes.xs, fontFamily: 'monospace', color: '#38BDF8', fontWeight: '600' },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.32,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    elevation: 3,
    position: 'relative',
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  itemCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  distanceBadge: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  itemTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', marginBottom: 6 },
  corridorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 4,
  },
  corridorText: {
    fontSize: FONTS.sizes.xs + 1,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: { fontSize: 11 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  terminalAddress: { fontSize: FONTS.sizes.xs, marginBottom: 6 },
  terminalMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  terminalMetaText: { fontSize: FONTS.sizes.xs },
  destinationsBox: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  destinationsLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  destinationsText: { fontSize: FONTS.sizes.xs, fontWeight: '600', marginTop: 2 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  amenityChip: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  amenityText: { fontSize: 10 },
  selectedRouteOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 1000,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  selectedRouteOverlayText: {
    color: '#F59E0B',
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  showAllBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default RouteMapScreen;
