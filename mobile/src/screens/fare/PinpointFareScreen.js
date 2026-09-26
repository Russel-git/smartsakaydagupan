import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card } from '../../components/common/SharedComponents';
import { faresAPI, routesAPI } from '../../api/services';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default fallback location: Dagupan City Plaza
const DAGUPAN_CENTER = {
  lat: 16.0433,
  lng: 120.3342,
  name: 'Dagupan City Plaza',
};

// Popular Dagupan Destinations for 1-tap pinpoint
const POPULAR_DESTINATIONS = [
  { name: 'CSI Mall Lucao', lat: 16.0333, lng: 120.3167, icon: 'shopping' },
  { name: 'Nepo Mall Downtown', lat: 16.0425, lng: 120.3378, icon: 'store' },
  { name: 'Dagupan City Plaza', lat: 16.0433, lng: 120.3342, icon: 'bank' },
  { name: 'Bonuan Blue Beach', lat: 16.0825, lng: 120.3542, icon: 'umbrella-beach' },
  { name: 'Lyceum University (Tapuac)', lat: 16.0342, lng: 120.3289, icon: 'school' },
  { name: 'Region 1 Medical Center (R1MC)', lat: 16.0489, lng: 120.3417, icon: 'hospital-building' },
  { name: 'Dagupan Bus Terminal', lat: 16.0400, lng: 120.3450, icon: 'bus-stop' },
  { name: 'Pantal Fish Port', lat: 16.0510, lng: 120.3310, icon: 'ferry' },
  { name: 'Caranglaan Commercial', lat: 16.0380, lng: 120.3580, icon: 'storefront' },
];

// Haversine straight-line distance fallback in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
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

// Check if a coordinate is near any point on a route path
const isPointNearRoute = (ptLat, ptLng, routePath, thresholdKm = 0.45) => {
  if (!routePath || !Array.isArray(routePath) || routePath.length === 0) return false;
  for (let i = 0; i < routePath.length; i++) {
    const p = routePath[i];
    const rLat = Array.isArray(p) ? p[0] : p.lat;
    const rLng = Array.isArray(p) ? p[1] : p.lng;
    if (rLat && rLng) {
      const d = calculateDistanceKm(ptLat, ptLng, rLat, rLng);
      if (d <= thresholdKm) return true;
    }
  }
  return false;
};

const PinpointFareScreen = ({ navigation, onStartRide }) => {
  const { colors, isDark } = useTheme();
  const { showSuccess, showWarning, showError } = useFeedback();
  const webViewRef = useRef(null);

  // Origin & Destination State
  const [origin, setOrigin] = useState({
    lat: DAGUPAN_CENTER.lat,
    lng: DAGUPAN_CENTER.lng,
    name: 'Current Location',
    isGPS: false,
  });

  const [destination, setDestination] = useState({
    lat: 16.0333,
    lng: 120.3167,
    name: 'CSI Mall Lucao',
  });

  // Location Permission State
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'granted' | 'denied'
  const [gpsLoading, setGpsLoading] = useState(false);

  // Road Routing State (OSRM road-aligned data)
  const [roadDistanceKm, setRoadDistanceKm] = useState(2.4);
  const [roadDurationMins, setRoadDurationMins] = useState(8);
  const [roadSummary, setRoadSummary] = useState('Finding fastest road route...');
  const [isRouting, setIsRouting] = useState(false);

  // Active Fares & Routes from Backend
  const [routes, setRoutes] = useState([]);
  const [activeFares, setActiveFares] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState('tricycle'); // 'tricycle' | 'traditional' | 'modern'
  const [isDiscounted, setIsDiscounted] = useState(false); // 20% Student/Senior/PWD discount

  // Request GPS Permission & Initial Location
  const requestLocation = async () => {
    setGpsLoading(true);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              name: 'My Current Location (GPS)',
              isGPS: true,
            };
            setOrigin(coords);
            setPermissionStatus('granted');
            setGpsLoading(false);
          },
          (err) => {
            console.warn('Web GPS fallback:', err.message);
            setPermissionStatus('denied');
            setGpsLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setPermissionStatus('granted');
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            name: 'My Current Location (GPS)',
            isGPS: true,
          };
          setOrigin(coords);
        } else {
          setPermissionStatus('denied');
        }
        setGpsLoading(false);
      }
    } catch (err) {
      console.warn('GPS error:', err.message);
      setPermissionStatus('denied');
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch Routes & Active Fares from Database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, faresRes] = await Promise.allSettled([
          routesAPI.getAllRoutes(),
          faresAPI.getActiveFares(),
        ]);

        if (routesRes.status === 'fulfilled') {
          setRoutes(routesRes.value.data?.data || []);
        }

        if (faresRes.status === 'fulfilled') {
          const list = faresRes.value.data?.data || [];
          const map = {};
          list.forEach((f) => {
            map[f.vehicleType] = f;
          });
          setActiveFares(map);
        }
      } catch (err) {
        console.warn('Failed to load routes/fares:', err.message);
      }
    };
    fetchData();
  }, []);

  // Use road distance if available, otherwise Haversine fallback
  const effectiveDistanceKm = useMemo(() => {
    if (roadDistanceKm && roadDistanceKm > 0) return roadDistanceKm;
    const direct = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    return Math.round(direct * 1.25 * 10) / 10;
  }, [roadDistanceKm, origin, destination]);

  // Route Corridor Intelligence: Check if origin & destination are along any Dagupan jeepney route
  const routeIntelligence = useMemo(() => {
    if (!routes || routes.length === 0) return { isOnRoute: false, matchingRoute: null };

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const originNear = isPointNearRoute(origin.lat, origin.lng, r.path, 0.45);
      const destNear = isPointNearRoute(destination.lat, destination.lng, r.path, 0.45);
      if (originNear && destNear) {
        return { isOnRoute: true, matchingRoute: r };
      }
    }
    return { isOnRoute: false, matchingRoute: null };
  }, [routes, origin, destination]);

  // If corridor status changes, auto-select the best vehicle
  useEffect(() => {
    if (routeIntelligence.isOnRoute) {
      if (selectedVehicle === 'tricycle') {
        setSelectedVehicle('traditional');
      }
    } else {
      setSelectedVehicle('tricycle');
    }
  }, [routeIntelligence.isOnRoute]);

  // Calculate Fares dynamically based on exact road distance for all 3 vehicle types
  const computedFares = useMemo(() => {
    const dist = effectiveDistanceKm;

    // 1. Tricycle (Dagupan TFRB Ordinance)
    // Base ₱15 for 1st km, ₱3/km thereafter
    const triConf = activeFares.tricycle || { baseFare: 15, baseDistanceKm: 1, perKmRate: 3 };
    const triBase = triConf.baseFare;
    const triBaseDist = triConf.baseDistanceKm;
    const triPerKm = triConf.perKmRate;
    const triExtra = dist > triBaseDist ? Math.ceil(dist - triBaseDist) * triPerKm : 0;
    const triReg = triBase + triExtra;
    const triDisc = Math.round(triReg * 0.8);

    // 2. Traditional Jeepney (LTFRB)
    // Base ₱14 for 1st 4 km, ₱2/km thereafter
    const tradConf = activeFares.traditional || { baseFare: 14, baseDistanceKm: 4, perKmRate: 2 };
    const tradBase = tradConf.baseFare;
    const tradBaseDist = tradConf.baseDistanceKm;
    const tradPerKm = tradConf.perKmRate;
    const tradExtra = dist > tradBaseDist ? Math.ceil(dist - tradBaseDist) * tradPerKm : 0;
    const tradReg = tradBase + tradExtra;
    const tradDisc = Math.round(tradReg * 0.8);

    // 3. Modern Jeepney (LTFRB)
    // Base ₱17 for 1st 4 km, ₱2.40/km thereafter
    const modConf = activeFares.modern || { baseFare: 17, baseDistanceKm: 4, perKmRate: 2.4 };
    const modBase = modConf.baseFare;
    const modBaseDist = modConf.baseDistanceKm;
    const modPerKm = modConf.perKmRate;
    const modExtra = dist > modBaseDist ? Math.ceil(dist - modBaseDist) * modPerKm : 0;
    const modReg = Math.ceil(modBase + modExtra);
    const modDisc = Math.round(modReg * 0.8);

    return {
      tricycle: {
        regular: triReg,
        discounted: triDisc,
        baseFare: triBase,
        baseDist: triBaseDist,
        perKm: triPerKm,
        extraKm: dist > triBaseDist ? Math.round((dist - triBaseDist) * 10) / 10 : 0,
      },
      traditional: {
        regular: tradReg,
        discounted: tradDisc,
        baseFare: tradBase,
        baseDist: tradBaseDist,
        perKm: tradPerKm,
        extraKm: dist > tradBaseDist ? Math.round((dist - tradBaseDist) * 10) / 10 : 0,
      },
      modern: {
        regular: modReg,
        discounted: modDisc,
        baseFare: modBase,
        baseDist: modBaseDist,
        perKm: modPerKm,
        extraKm: dist > modBaseDist ? Math.round((dist - modBaseDist) * 10) / 10 : 0,
      },
    };
  }, [effectiveDistanceKm, activeFares]);

  // Handle message from Leaflet Web / WebView
  const handleMapEvent = (data) => {
    if (!data) return;
    if (data.type === 'ROUTE_CALCULATED') {
      setIsRouting(false);
      setDestination((prev) => ({
        ...prev,
        lat: data.lat,
        lng: data.lng,
        name: data.summary ? `Near ${data.summary.split('➔')[0].trim()}` : prev.name,
      }));
      if (data.distanceKm) setRoadDistanceKm(data.distanceKm);
      if (data.durationMins) setRoadDurationMins(data.durationMins);
      if (data.summary) setRoadSummary(data.summary);
    } else if (data.type === 'PINPOINT_DESTINATION') {
      setIsRouting(false);
      setDestination((prev) => ({
        ...prev,
        lat: data.lat,
        lng: data.lng,
      }));
      // Haversine fallback distance
      const d = calculateDistanceKm(origin.lat, origin.lng, data.lat, data.lng);
      setRoadDistanceKm(Math.round(d * 1.25 * 10) / 10);
      setRoadDurationMins(Math.max(2, Math.round((d / 18) * 60)));
    } else if (data.type === 'ROUTING_STARTED') {
      setIsRouting(true);
    }
  };

  // Listen to web postMessage
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWindowMsg = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          handleMapEvent(data);
        } catch (_) {}
      };
      window.addEventListener('message', handleWindowMsg);
      return () => window.removeEventListener('message', handleWindowMsg);
    }
  }, [origin]);

  // Send destination to Leaflet map from landmark chips
  const selectLandmark = (item) => {
    setDestination({
      lat: item.lat,
      lng: item.lng,
      name: item.name,
    });
    setIsRouting(true);
    // Post to webview to re-calculate and re-center
    const script = `if (window.setDestinationFromApp) { window.setDestinationFromApp(${item.lat}, ${item.lng}); }`;
    if (webViewRef.current && Platform.OS !== 'web') {
      webViewRef.current.injectJavaScript(script);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const iframe = document.getElementById('pinpoint-fare-map');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ type: 'SET_DESTINATION', lat: item.lat, lng: item.lng }), '*');
      }
    }
  };

  // Generate Leaflet Interactive Map HTML with Real Road Routing (OSRM)
  const generateLeafletHtml = () => {
    const oLat = origin.lat;
    const oLng = origin.lng;
    const dLat = destination.lat;
    const dLng = destination.lng;

    // Serialize routes for visual corridor reference
    const routesData = routes.map((r) => ({
      name: r.name,
      color: r.category === 'city' ? '#3B82F6' : '#10B981',
      path: r.path || [],
    }));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { margin:0; padding:0; width:100%; height:100%; overflow:hidden; }
          
          /* Pulsating Origin GPS Radar */
          .origin-beacon {
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .origin-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.4);
            animation: radar 2s infinite ease-out;
          }
          .origin-core {
            position: relative;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #10B981;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          }
          @keyframes radar {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }

          /* Destination Pin */
          .dest-pin {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #EF4444;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.45);
            cursor: grab;
            transition: transform 0.15s ease;
          }
          .dest-pin:active {
            cursor: grabbing;
            transform: scale(1.15);
          }
          
          /* Banner hint */
          .map-tap-hint {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.90);
            color: #ffffff;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
          }
          .route-status-pill {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(15, 23, 42, 0.90);
            color: #38BDF8;
            padding: 5px 12px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 700;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-tap-hint" id="status-hint">📍 Tap or drag red pin to find best road route</div>
        <div class="route-status-pill" id="route-meta">🛣️ Aligning to Dagupan roads...</div>

        <script>
          function postToApp(data) {
            var str = JSON.stringify(data);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            } else if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(str, '*');
            }
          }

          var oLat = ${oLat};
          var oLng = ${oLng};
          var dLat = ${dLat};
          var dLng = ${dLng};
          var routes = ${JSON.stringify(routesData)};

          var map = L.map('map', { zoomControl: false }).setView([(oLat + dLat)/2, (oLng + dLng)/2], 14);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          // Draw Dagupan Jeepney corridor routes as soft guide lines
          routes.forEach(function(r) {
            if (r.path && r.path.length > 0) {
              L.polyline(r.path, {
                color: r.color,
                weight: 3,
                opacity: 0.25,
                dashArray: '3, 6'
              }).addTo(map);
            }
          });

          // Origin Marker (green pulsating)
          var originIcon = L.divIcon({
            className: 'origin-marker',
            html: '<div class="origin-beacon"><div class="origin-pulse"></div><div class="origin-core"></div></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          var originMarker = L.marker([oLat, oLng], { icon: originIcon }).addTo(map)
            .bindPopup('<b>Starting Location</b><br/>Your GPS position');

          // Destination Marker (red draggable pin)
          var destIcon = L.divIcon({
            className: 'dest-marker',
            html: '<div class="dest-pin">📍</div>',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          });
          var destMarker = L.marker([dLat, dLng], { icon: destIcon, draggable: true }).addTo(map)
            .bindPopup('<b>Destination</b><br/>Drag or tap map to re-route');

          // Road route polyline layers (NO straight dashes)
          var currentGlowLayer = null;
          var currentRouteLayer = null;

          // Road routing engine via OSRM
          async function updateRoadRoute(destLatitude, destLongitude) {
            dLat = destLatitude;
            dLng = destLongitude;
            destMarker.setLatLng([dLat, dLng]);

            var hintEl = document.getElementById('status-hint');
            var metaEl = document.getElementById('route-meta');
            if (hintEl) hintEl.innerHTML = '⚡ Finding fastest road route...';
            if (metaEl) metaEl.innerHTML = 'Calculating road alignment...';

            postToApp({ type: 'ROUTING_STARTED', lat: dLat, lng: dLng });

            try {
              var url = 'https://router.project-osrm.org/route/v1/driving/' + oLng + ',' + oLat + ';' + dLng + ',' + dLat + '?overview=full&geometries=geojson&steps=true';
              var res = await fetch(url);
              var data = await res.json();

              if (data && data.routes && data.routes.length > 0) {
                var best = data.routes[0];
                var latLngs = best.geometry.coordinates.map(function(c) {
                  return [c[1], c[0]]; // OSRM is [lng, lat], Leaflet is [lat, lng]
                });

                // Clear any previous route layers
                if (currentGlowLayer) map.removeLayer(currentGlowLayer);
                if (currentRouteLayer) map.removeLayer(currentRouteLayer);

                // 1. Draw glowing road casing (gives a professional navigation neon glow)
                currentGlowLayer = L.polyline(latLngs, {
                  color: '#0284C7',
                  weight: 9,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);

                // 2. Draw solid road alignment (traces exact streets of Dagupan)
                currentRouteLayer = L.polyline(latLngs, {
                  color: '#0284C7',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);

                // Fit bounds smoothly to encompass the full road route
                map.fitBounds(L.latLngBounds(latLngs), { padding: [45, 45], maxZoom: 16 });

                var distKm = Math.round((best.distance / 1000) * 10) / 10;
                var durMins = Math.max(1, Math.round(best.duration / 60));
                var streetNames = [];
                if (best.legs && best.legs[0] && best.legs[0].steps) {
                  best.legs[0].steps.forEach(function(s) {
                    if (s.name && s.name.trim() !== '' && streetNames.indexOf(s.name) === -1) {
                      streetNames.push(s.name);
                    }
                  });
                }
                var summary = streetNames.slice(0, 3).join(' ➔ ');

                if (hintEl) hintEl.innerHTML = '📍 Best Route: ' + distKm + ' km • ~' + durMins + ' mins';
                if (metaEl) metaEl.innerHTML = summary ? ('🛣️ ' + summary) : ('🛣️ Fastest road aligned');

                postToApp({
                  type: 'ROUTE_CALCULATED',
                  lat: dLat,
                  lng: dLng,
                  distanceKm: distKm,
                  durationMins: durMins,
                  summary: summary || 'Fastest street route',
                  coordinates: latLngs
                });
                return;
              }
            } catch (err) {
              console.warn('Road routing error:', err);
            }

            // Fallback if offline
            if (hintEl) hintEl.innerHTML = '📍 Destination Pinpoint Updated';
            if (metaEl) metaEl.innerHTML = 'Direct distance calculated';
            postToApp({ type: 'PINPOINT_DESTINATION', lat: dLat, lng: dLng });
          }

          // Initial road route calculation
          updateRoadRoute(dLat, dLng);

          // On dragging destination marker
          destMarker.on('dragend', function() {
            var pos = destMarker.getLatLng();
            updateRoadRoute(pos.lat, pos.lng);
          });

          // On map click anywhere in Dagupan
          map.on('click', function(e) {
            updateRoadRoute(e.latlng.lat, e.latlng.lng);
          });

          // Exposed to React Native parent window / iframe
          window.setDestinationFromApp = function(lat, lng) {
            updateRoadRoute(lat, lng);
          };

          window.addEventListener('message', function(e) {
            try {
              var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (d && d.type === 'SET_DESTINATION') {
                updateRoadRoute(d.lat, d.lng);
              }
            } catch (_) {}
          });
        </script>
      </body>
      </html>
    `;
  };

  const currentFareData = computedFares[selectedVehicle];
  const finalFare = isDiscounted ? currentFareData.discounted : currentFareData.regular;

  // Handle Start Live Ride Meter
  const handleStartRideMeter = () => {
    if (onStartRide) {
      onStartRide({
        route: routeIntelligence.matchingRoute,
        vehicleType: selectedVehicle,
        destination: destination.name,
      });
    } else {
      navigation.navigate('Ride', {
        initialTab: 'tracker',
        selectedRoute: routeIntelligence.matchingRoute,
        vehicleType: selectedVehicle,
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: SPACING.xxl }}
    >
      {/* Location Permission Notification / Status Bar */}
      {permissionStatus === 'denied' && (
        <View style={[styles.permissionBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <MaterialCommunityIcons name="map-marker-alert" size={20} color="#D97706" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.permissionTitle, { color: '#92400E' }]}>Location Access Denied</Text>
            <Text style={[styles.permissionDesc, { color: '#B45309' }]}>
              Using Dagupan City Plaza as starting point. Tap to enable GPS for live distance.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.enableBtn, { backgroundColor: '#D97706' }]}
            onPress={requestLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.enableBtnText}>Enable GPS</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Popular Destination Quick Chips */}
      <View style={[styles.quickChipsSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.chipHeaderRow}>
          <MaterialCommunityIcons name="star-outline" size={16} color={colors.primary} />
          <Text style={[styles.chipHeaderTitle, { color: colors.textSecondary }]}>
            Popular Dagupan Destinations (1-Tap Pinpoint):
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {POPULAR_DESTINATIONS.map((dest, idx) => (
            <TouchableOpacity
              key={`dest-${idx}`}
              style={[
                styles.landmarkChip,
                { backgroundColor: colors.background, borderColor: colors.border },
                destination.name === dest.name && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + '15',
                },
              ]}
              onPress={() => selectLandmark(dest)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={dest.icon}
                size={14}
                color={destination.name === dest.name ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.landmarkChipText,
                  { color: destination.name === dest.name ? colors.primary : colors.textPrimary },
                ]}
              >
                {dest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Interactive Leaflet Map with Real Road Alignment */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            id="pinpoint-fare-map"
            key={`map-${origin.lat}-${origin.lng}`}
            title="Dagupan Road Route Map"
            srcDoc={generateLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            key={`native-map-${origin.lat}-${origin.lng}`}
            originWhitelist={['*']}
            source={{ html: generateLeafletHtml() }}
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            onMessage={(e) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                handleMapEvent(data);
              } catch (_) {}
            }}
          />
        )}
      </View>

      {/* Route Corridor Intelligence Banner */}
      <View style={styles.contentPadding}>
        {routeIntelligence.isOnRoute ? (
          <View style={[styles.corridorBanner, { backgroundColor: '#F0FDF4', borderColor: '#10B981' }]}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#10B981" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.corridorTitle, { color: '#065F46' }]}>
                Along {routeIntelligence.matchingRoute.name} Corridor
              </Text>
              <Text style={[styles.corridorDesc, { color: '#047857' }]}>
                This trip is covered by official Dagupan jeepney routes. Jeepney ride recommended!
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.corridorBanner, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
            <MaterialCommunityIcons name="information" size={24} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.corridorTitle, { color: '#92400E' }]}>
                Off Fixed Jeepney Routes
              </Text>
              <Text style={[styles.corridorDesc, { color: '#B45309' }]}>
                No direct jeepney traverses this exact road path. Direct point-to-point Tricycle recommended with City Ordinance fair fare.
              </Text>
            </View>
          </View>
        )}

        {/* Real-time Trip Metrics Card (Exact Road Distance & Time) */}
        <Card style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metricsHeader}>
            <View>
              <Text style={[styles.metricsHeading, { color: colors.textPrimary }]}>
                Fastest Road Route & Metrics
              </Text>
              <Text style={[styles.metricsSubtitle, { color: colors.textMuted }]}>
                Aligned to actual Dagupan road network
              </Text>
            </View>
            {isRouting ? (
              <View style={styles.routingBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.routingBadgeText, { color: colors.primary }]}>Routing...</Text>
              </View>
            ) : (
              <View style={[styles.routingBadge, { backgroundColor: '#10B98115', borderColor: '#10B98150', borderWidth: 1 }]}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                <Text style={[styles.routingBadgeText, { color: '#059669' }]}>Road Aligned</Text>
              </View>
            )}
          </View>

          {/* Road Path Summary */}
          {Boolean(roadSummary) && (
            <View style={[styles.roadSummaryRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="routes" size={16} color={colors.primary} />
              <Text style={[styles.roadSummaryText, { color: colors.textSecondary }]} numberOfLines={1}>
                {roadSummary}
              </Text>
            </View>
          )}

          {/* Metric Stats Row */}
          <View style={styles.metricStatsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Road Distance</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {effectiveDistanceKm} km
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Driving Time</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                ~{roadDurationMins} mins
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Starting GPS</Text>
              <Text style={[styles.metricValueSmall, { color: origin.isGPS ? '#10B981' : colors.textSecondary }]}>
                {origin.isGPS ? '🟢 Active GPS' : '📍 Dagupan Plaza'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Vehicle Mode Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Select Public Transport Matrix:
        </Text>
        <View style={styles.vehicleRow}>
          {/* Tricycle */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedVehicle === 'tricycle' && {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '12',
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelectedVehicle('tricycle')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="moped"
              size={24}
              color={selectedVehicle === 'tricycle' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.vehicleName,
                { color: selectedVehicle === 'tricycle' ? colors.primary : colors.textPrimary },
              ]}
            >
              Tricycle
            </Text>
            <Text style={[styles.vehicleFarePrice, { color: colors.textPrimary }]}>
              {formatPeso(isDiscounted ? computedFares.tricycle.discounted : computedFares.tricycle.regular)}
            </Text>
            <Text style={[styles.vehicleNote, { color: colors.textMuted }]}>
              TFRB City Tariff
            </Text>
          </TouchableOpacity>

          {/* Traditional Jeepney */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedVehicle === 'traditional' && {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '12',
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelectedVehicle('traditional')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="van-passenger"
              size={24}
              color={selectedVehicle === 'traditional' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.vehicleName,
                { color: selectedVehicle === 'traditional' ? colors.primary : colors.textPrimary },
              ]}
            >
              Jeepney
            </Text>
            <Text style={[styles.vehicleFarePrice, { color: colors.textPrimary }]}>
              {formatPeso(isDiscounted ? computedFares.traditional.discounted : computedFares.traditional.regular)}
            </Text>
            <Text style={[styles.vehicleNote, { color: colors.textMuted }]}>
              Traditional
            </Text>
          </TouchableOpacity>

          {/* Modern Jeepney */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedVehicle === 'modern' && {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '12',
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelectedVehicle('modern')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bus-side"
              size={24}
              color={selectedVehicle === 'modern' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.vehicleName,
                { color: selectedVehicle === 'modern' ? colors.primary : colors.textPrimary },
              ]}
            >
              Modern PUV
            </Text>
            <Text style={[styles.vehicleFarePrice, { color: colors.textPrimary }]}>
              {formatPeso(isDiscounted ? computedFares.modern.discounted : computedFares.modern.regular)}
            </Text>
            <Text style={[styles.vehicleNote, { color: colors.textMuted }]}>
              Airconditioned
            </Text>
          </TouchableOpacity>
        </View>

        {/* Discount Toggle Switch (20% Student/Senior/PWD) */}
        <TouchableOpacity
          style={[styles.discountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setIsDiscounted(!isDiscounted)}
          activeOpacity={0.8}
        >
          <View style={styles.discountLeft}>
            <MaterialCommunityIcons
              name="ticket-percent"
              size={24}
              color={isDiscounted ? '#10B981' : colors.textMuted}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.discountTitle, { color: colors.textPrimary }]}>
                20% Commuter Discount
              </Text>
              <Text style={[styles.discountSubtitle, { color: colors.textMuted }]}>
                Students, Senior Citizens (RA 9994) & PWDs (RA 10754)
              </Text>
            </View>
          </View>
          <View style={[styles.discountToggle, isDiscounted && { backgroundColor: '#10B981' }]}>
            <View style={[styles.discountKnob, isDiscounted && { alignSelf: 'flex-end' }]} />
          </View>
        </TouchableOpacity>

        {/* Detailed Fair Fare Breakdown Card */}
        <Card style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.breakdownHeader}>
            <View>
              <Text style={[styles.breakdownTitle, { color: colors.textPrimary }]}>
                Official Fair Fare Computation
              </Text>
              <Text style={[styles.breakdownSubtitle, { color: colors.textMuted }]}>
                {selectedVehicle === 'tricycle'
                  ? 'Dagupan City TFRB Tricycle Ordinance'
                  : selectedVehicle === 'traditional'
                  ? 'LTFRB Region 1 Traditional PUJ Tariff'
                  : 'LTFRB Modernized Public Utility Vehicle Tariff'}
              </Text>
            </View>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatPeso(finalFare)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Breakdown Items */}
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Base Fare (First {currentFareData.baseDist} km):
            </Text>
            <Text style={[styles.breakdownVal, { color: colors.textPrimary }]}>
              {formatPeso(currentFareData.baseFare)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Extra Distance ({currentFareData.extraKm} km @ {formatPeso(currentFareData.perKm)}/km):
            </Text>
            <Text style={[styles.breakdownVal, { color: colors.textPrimary }]}>
              {formatPeso(currentFareData.regular - currentFareData.baseFare)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Subtotal Regular Fare:
            </Text>
            <Text style={[styles.breakdownVal, { color: colors.textPrimary }]}>
              {formatPeso(currentFareData.regular)}
            </Text>
          </View>

          {isDiscounted && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: '#059669', fontWeight: '700' }]}>
                Less 20% Mandatory Discount:
              </Text>
              <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '700' }]}>
                -{formatPeso(currentFareData.regular - currentFareData.discounted)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Anti-Overcharging Legal Grievance Link */}
          <View style={styles.overchargePrompt}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.overchargeNotice, { color: colors.textMuted }]}>
                Did the driver demand more than {formatPeso(finalFare)}?
              </Text>
            </View>
            <TouchableOpacity
              style={styles.overchargeReportBtn}
              onPress={() => {
                navigation.navigate('SubmitComplaint', {
                  category: 'overcharging',
                  subject: `Overcharging violation on trip to ${destination.name}`,
                  description: `Driver overcharged fare for trip from ${origin.name} to ${destination.name} (${effectiveDistanceKm} km road distance). Official tariff is ${formatPeso(finalFare)} but driver demanded more.`,
                });
              }}
            >
              <MaterialCommunityIcons name="alert-octagon" size={16} color="#DC2626" />
              <Text style={styles.overchargeReportText}>Report Overcharging</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Action Button: Start Live Ride Meter */}
        <TouchableOpacity
          style={[styles.startRideBtn, { backgroundColor: colors.primary }]}
          onPress={handleStartRideMeter}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="steering" size={22} color="#FFFFFF" />
          <Text style={styles.startRideBtnText}>Start Live Ride Meter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  permissionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  permissionDesc: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  enableBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickChipsSection: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  chipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 6,
    gap: 4,
  },
  chipHeaderTitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  chipsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  landmarkChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.38,
    backgroundColor: '#0f172a',
  },
  contentPadding: {
    padding: SPACING.md,
  },
  corridorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  corridorTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  corridorDesc: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  metricsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metricsHeading: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  metricsSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  routingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  routingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roadSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  roadSummaryText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  metricStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '900',
  },
  metricValueSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  vehicleCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...SHADOWS.xs,
  },
  vehicleName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  vehicleFarePrice: {
    fontSize: FONTS.sizes.md,
    fontWeight: '900',
    marginTop: 4,
  },
  vehicleNote: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  discountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  discountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  discountTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  discountSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  discountToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#94A3B8',
    padding: 2,
    justifyContent: 'center',
  },
  discountKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  breakdownCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  breakdownSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 12,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  overchargePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  overchargeNotice: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  overchargeReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  overchargeReportText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  startRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  startRideBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
});

export default PinpointFareScreen;
