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

// Haversine distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
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
const isPointNearRoute = (ptLat, ptLng, routePath, thresholdKm = 0.4) => {
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

const PinpointFareScreen = ({ navigation }) => {
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

  // Calculate Distance (km)
  const distanceKm = useMemo(() => {
    return calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  }, [origin, destination]);

  // Estimated Travel Time in minutes (~18 km/h city average in Dagupan)
  const estimatedTimeMins = useMemo(() => {
    if (!distanceKm || distanceKm <= 0) return 3;
    return Math.max(3, Math.round((distanceKm / 18) * 60));
  }, [distanceKm]);

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

  // Calculate Fares dynamically based on distance for all 3 vehicle types
  const computedFares = useMemo(() => {
    const dist = distanceKm;

    // 1. Tricycle (Dagupan TFRB Ordinance)
    // Default: Base ₱15 for 1st km, ₱3/km thereafter
    const triConf = activeFares.tricycle || { baseFare: 15, baseDistanceKm: 1, perKmRate: 3 };
    const triBase = triConf.baseFare;
    const triBaseDist = triConf.baseDistanceKm;
    const triPerKm = triConf.perKmRate;
    const triExtra = dist > triBaseDist ? Math.ceil(dist - triBaseDist) * triPerKm : 0;
    const triReg = triBase + triExtra;
    const triDisc = Math.round(triReg * 0.8);

    // 2. Traditional Jeepney (LTFRB)
    // Default: Base ₱14 for 1st 4 km, ₱2/km thereafter
    const tradConf = activeFares.traditional || { baseFare: 14, baseDistanceKm: 4, perKmRate: 2 };
    const tradBase = tradConf.baseFare;
    const tradBaseDist = tradConf.baseDistanceKm;
    const tradPerKm = tradConf.perKmRate;
    const tradExtra = dist > tradBaseDist ? Math.ceil(dist - tradBaseDist) * tradPerKm : 0;
    const tradReg = tradBase + tradExtra;
    const tradDisc = Math.round(tradReg * 0.8);

    // 3. Modern Jeepney (LTFRB)
    // Default: Base ₱17 for 1st 4 km, ₱2.40/km thereafter
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
        baseDistanceKm: triBaseDist,
        perKmRate: triPerKm,
        extraCost: triExtra,
      },
      traditional: {
        regular: tradReg,
        discounted: tradDisc,
        baseFare: tradBase,
        baseDistanceKm: tradBaseDist,
        perKmRate: tradPerKm,
        extraCost: tradExtra,
      },
      modern: {
        regular: modReg,
        discounted: modDisc,
        baseFare: modBase,
        baseDistanceKm: modBaseDist,
        perKmRate: modPerKm,
        extraCost: modExtra,
      },
    };
  }, [distanceKm, activeFares]);

  // Selected vehicle fare
  const currentFareData = computedFares[selectedVehicle] || computedFares.tricycle;
  const currentPrice = isDiscounted ? currentFareData.discounted : currentFareData.regular;

  // Handle map click event received from WebView
  const handlePinpointUpdate = (lat, lng, name = null) => {
    // Check if near any popular landmark
    let matchedName = name;
    if (!matchedName) {
      const near = POPULAR_DESTINATIONS.find(
        (p) => calculateDistanceKm(lat, lng, p.lat, p.lng) <= 0.3
      );
      matchedName = near ? near.name : `Pinpoint (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    }

    setDestination({
      lat,
      lng,
      name: matchedName,
    });
  };

  // Web postMessage listener
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWindowMsg = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.type === 'PINPOINT_DESTINATION') {
            handlePinpointUpdate(data.lat, data.lng);
          }
        } catch (_) {}
      };
      window.addEventListener('message', handleWindowMsg);
      return () => window.removeEventListener('message', handleWindowMsg);
    }
  }, []);

  // Send destination to Leaflet map
  const selectLandmark = (item) => {
    setDestination({
      lat: item.lat,
      lng: item.lng,
      name: item.name,
    });
    // Post to webview to re-center
    const script = `if (window.setDestinationFromApp) { window.setDestinationFromApp(${item.lat}, ${item.lng}); }`;
    if (webViewRef.current && Platform.OS !== 'web') {
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Generate Leaflet Interactive Map HTML
  const generateLeafletHtml = () => {
    const oLat = origin.lat;
    const oLng = origin.lng;
    const dLat = destination.lat;
    const dLng = destination.lng;

    // Serialize routes for visual reference
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
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #EF4444;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 3px solid #ffffff;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5);
            cursor: pointer;
            transition: transform 0.15s ease;
          }
          .dest-pin:hover {
            transform: scale(1.1);
          }
          
          /* Banner hint */
          .map-tap-hint {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.85);
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-tap-hint">📍 Tap anywhere to pinpoint destination</div>
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

          // Draw Jeepney corridor paths in faint transparent lines
          routes.forEach(function(r) {
            if (r.path && r.path.length > 0) {
              L.polyline(r.path, {
                color: r.color,
                weight: 3,
                opacity: 0.35,
                dashArray: '4, 6'
              }).addTo(map);
            }
          });

          // Origin Marker
          var originIcon = L.divIcon({
            className: 'origin-marker',
            html: '<div class="origin-beacon"><div class="origin-pulse"></div><div class="origin-core"></div></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          var originMarker = L.marker([oLat, oLng], { icon: originIcon }).addTo(map)
            .bindPopup('<b>Starting Location</b><br/>Your current position');

          // Destination Marker (Draggable)
          var destIcon = L.divIcon({
            className: 'dest-marker',
            html: '<div class="dest-pin">📍</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          var destMarker = L.marker([dLat, dLng], { icon: destIcon, draggable: true }).addTo(map)
            .bindPopup('<b>Pinpoint Destination</b><br/>Drag or tap map to move');

          // Connecting Polyline
          var routeLine = L.polyline([[oLat, oLng], [dLat, dLng]], {
            color: '#0284C7',
            weight: 4,
            opacity: 0.85,
            dashArray: '6, 8'
          }).addTo(map);

          function updateConnector() {
            var dPos = destMarker.getLatLng();
            routeLine.setLatLngs([[oLat, oLng], [dPos.lat, dPos.lng]]);
          }

          // On Dragging Destination Marker
          destMarker.on('drag', updateConnector);
          destMarker.on('dragend', function() {
            var pos = destMarker.getLatLng();
            updateConnector();
            postToApp({ type: 'PINPOINT_DESTINATION', lat: pos.lat, lng: pos.lng });
          });

          // On Map Tap / Click anywhere
          map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            destMarker.setLatLng([lat, lng]);
            updateConnector();
            postToApp({ type: 'PINPOINT_DESTINATION', lat: lat, lng: lng });
          });

          // Exposed to parent window
          window.setDestinationFromApp = function(lat, lng) {
            destMarker.setLatLng([lat, lng]);
            updateConnector();
            map.panTo([(oLat + lat)/2, (oLng + lng)/2]);
          };

          // Auto-fit bounds
          map.fitBounds(L.latLngBounds([[oLat, oLng], [dLat, dLng]]), { padding: [40, 40] });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Top Banner / Location Permission Prompt */}
      {permissionStatus === 'denied' && (
        <View style={styles.permissionWarningBanner}>
          <MaterialCommunityIcons name="map-marker-alert" size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionWarningTitle}>GPS Access Denied</Text>
            <Text style={styles.permissionWarningText}>
              Origin defaulted to Dagupan City Plaza. Tap below to enable live GPS.
            </Text>
          </View>
          <TouchableOpacity style={styles.enableGpsBtn} onPress={requestLocation} disabled={gpsLoading}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.enableGpsBtnText}>Enable GPS</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Pinpoint & Fair Fare</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tap destination anywhere in Dagupan • Auto-adjusting distance matrix
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.recenterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={requestLocation}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={origin.isGPS ? '#10B981' : colors.primary} />
          <Text style={[styles.recenterBtnText, { color: colors.textPrimary }]}>
            {origin.isGPS ? 'GPS Active' : 'Locate Me'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Destination Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {POPULAR_DESTINATIONS.map((dest, idx) => {
            const isSelected = destination.name === dest.name;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.landmarkChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => selectLandmark(dest)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={dest.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.landmarkChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {dest.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Leaflet Map Container */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`pinpoint-map-${origin.lat}-${origin.lng}-${destination.lat}-${destination.lng}`}
            title="Dagupan Pinpoint Destination Map"
            srcDoc={generateLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            key={`pinpoint-webview-${origin.lat}-${origin.lng}`}
            originWhitelist={['*']}
            source={{ html: generateLeafletHtml() }}
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            onMessage={(e) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                if (data.type === 'PINPOINT_DESTINATION') {
                  handlePinpointUpdate(data.lat, data.lng);
                }
              } catch (_) {}
            }}
          />
        )}
      </View>

      <View style={styles.bodyContent}>
        {/* Route / Distance Summary Header */}
        <Card style={styles.tripMetricCard}>
          <View style={styles.tripRow}>
            {/* Origin */}
            <View style={styles.tripPointCol}>
              <View style={[styles.dotPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripPointLabel}>STARTING FROM</Text>
                <Text style={[styles.tripPointName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {origin.name}
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons name="arrow-right-thin" size={24} color={colors.textMuted} style={{ alignSelf: 'center' }} />

            {/* Destination */}
            <View style={styles.tripPointCol}>
              <View style={[styles.dotPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <MaterialCommunityIcons name="pin" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripPointLabel}>PINPOINT DESTINATION</Text>
                <Text style={[styles.tripPointName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {destination.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tripStatsRow}>
            <View style={styles.statPill}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color="#0284C7" />
              <Text style={styles.statText}>
                Distance: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{distanceKm} km</Text>
              </Text>
            </View>
            <View style={styles.statPill}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#059669" />
              <Text style={styles.statText}>
                Travel Time: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>~{estimatedTimeMins} mins</Text>
              </Text>
            </View>
          </View>
        </Card>

        {/* Route Corridor Coverage Intelligence Badge */}
        {routeIntelligence.isOnRoute ? (
          <View style={[styles.corridorBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', borderColor: '#10B981' }]}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.corridorTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                On-Route Jeepney Corridor
              </Text>
              <Text style={[styles.corridorDesc, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                Served by: <Text style={{ fontWeight: '800' }}>{routeIntelligence.matchingRoute.name}</Text>. You can take a regular jeepney along this road.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.corridorBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', borderColor: '#F59E0B' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.corridorTitle, { color: isDark ? '#FCD34D' : '#B45309' }]}>
                Off Fixed Jeepney Route Corridor
              </Text>
              <Text style={[styles.corridorDesc, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                This destination is off regular jeepney lines. Dagupan Tricycle or direct ride is recommended. Pay only the legal Fair Fare calculated below!
              </Text>
            </View>
          </View>
        )}

        {/* Vehicle Selection & Live Fair Fare Matrix */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fair Fare Matrix Options</Text>
          <TouchableOpacity
            style={[
              styles.discountToggle,
              { backgroundColor: isDiscounted ? 'rgba(59, 130, 246, 0.15)' : colors.surface, borderColor: isDiscounted ? '#3B82F6' : colors.border },
            ]}
            onPress={() => setIsDiscounted(!isDiscounted)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isDiscounted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
              size={16}
              color={isDiscounted ? '#3B82F6' : colors.textMuted}
            />
            <Text style={[styles.discountToggleText, { color: isDiscounted ? '#3B82F6' : colors.textSecondary }]}>
              20% Discount
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Vehicle Option Cards (Tricycle, Traditional Jeep, Modern Jeep) */}
        <View style={styles.vehicleGrid}>
          {/* TRICYCLE CARD */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedVehicle === 'tricycle' ? '#F59E0B' : colors.border,
                borderWidth: selectedVehicle === 'tricycle' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedVehicle('tricycle')}
            activeOpacity={0.85}
          >
            <View style={[styles.vehicleIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <MaterialCommunityIcons name="rickshaw" size={24} color="#D97706" />
            </View>
            <Text style={[styles.vehicleCardName, { color: colors.textPrimary }]}>Dagupan Tricycle</Text>
            <Text style={[styles.vehicleCardSub, { color: colors.textMuted }]}>
              {!routeIntelligence.isOnRoute ? '★ Recommended' : 'Direct Door-to-Door'}
            </Text>
            <Text style={[styles.vehicleCardPrice, { color: '#D97706' }]}>
              {formatPeso(isDiscounted ? computedFares.tricycle.discounted : computedFares.tricycle.regular)}
            </Text>
            <Text style={[styles.vehicleCardRate, { color: colors.textMuted }]}>
              Base ₱{computedFares.tricycle.baseFare} (1 km) + ₱{computedFares.tricycle.perKmRate}/km
            </Text>
          </TouchableOpacity>

          {/* TRADITIONAL JEEP */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedVehicle === 'traditional' ? '#0284C7' : colors.border,
                borderWidth: selectedVehicle === 'traditional' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedVehicle('traditional')}
            activeOpacity={0.85}
          >
            <View style={[styles.vehicleIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
              <MaterialCommunityIcons name="bus" size={24} color="#0284C7" />
            </View>
            <Text style={[styles.vehicleCardName, { color: colors.textPrimary }]}>Traditional Jeep</Text>
            <Text style={[styles.vehicleCardSub, { color: colors.textMuted }]}>LTFRB Regulated</Text>
            <Text style={[styles.vehicleCardPrice, { color: '#0284C7' }]}>
              {formatPeso(isDiscounted ? computedFares.traditional.discounted : computedFares.traditional.regular)}
            </Text>
            <Text style={[styles.vehicleCardRate, { color: colors.textMuted }]}>
              Base ₱{computedFares.traditional.baseFare} (4 km) + ₱{computedFares.traditional.perKmRate}/km
            </Text>
          </TouchableOpacity>

          {/* MODERN JEEP */}
          <TouchableOpacity
            style={[
              styles.vehicleCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedVehicle === 'modern' ? '#10B981' : colors.border,
                borderWidth: selectedVehicle === 'modern' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedVehicle('modern')}
            activeOpacity={0.85}
          >
            <View style={[styles.vehicleIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="bus-articulated-front" size={24} color="#10B981" />
            </View>
            <Text style={[styles.vehicleCardName, { color: colors.textPrimary }]}>Modern PUV</Text>
            <Text style={[styles.vehicleCardSub, { color: colors.textMuted }]}>Air-conditioned</Text>
            <Text style={[styles.vehicleCardPrice, { color: '#10B981' }]}>
              {formatPeso(isDiscounted ? computedFares.modern.discounted : computedFares.modern.regular)}
            </Text>
            <Text style={[styles.vehicleCardRate, { color: colors.textMuted }]}>
              Base ₱{computedFares.modern.baseFare} (4 km) + ₱{computedFares.modern.perKmRate}/km
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Fair Fare Detailed Receipt / Breakdown */}
        <Card style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.breakdownBadgeText}>OFFICIAL COMPUTED FAIR TARIFF</Text>
              <Text style={[styles.breakdownVehicleTitle, { color: colors.textPrimary }]}>
                {selectedVehicle === 'tricycle'
                  ? 'Dagupan City Tricycle (TFRB Ordinance)'
                  : selectedVehicle === 'traditional'
                  ? 'Traditional Jeepney (LTFRB Regulated)'
                  : 'Modern Aircon Jeepney (LTFRB Regulated)'}
              </Text>
            </View>
            <Text style={[styles.breakdownTotalAmount, { color: colors.primary }]}>
              {formatPeso(currentPrice)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Math details */}
          <View style={styles.mathRow}>
            <Text style={[styles.mathLabel, { color: colors.textSecondary }]}>
              Base Fare (First {currentFareData.baseDistanceKm} km):
            </Text>
            <Text style={[styles.mathVal, { color: colors.textPrimary }]}>
              {formatPeso(currentFareData.baseFare)}
            </Text>
          </View>

          <View style={styles.mathRow}>
            <Text style={[styles.mathLabel, { color: colors.textSecondary }]}>
              Extra Distance ({Math.max(0, (distanceKm - currentFareData.baseDistanceKm).toFixed(1))} km × ₱{currentFareData.perKmRate}):
            </Text>
            <Text style={[styles.mathVal, { color: colors.textPrimary }]}>
              {formatPeso(currentFareData.extraCost)}
            </Text>
          </View>

          {isDiscounted && (
            <View style={styles.mathRow}>
              <Text style={[styles.mathLabel, { color: '#3B82F6' }]}>
                Mandatory 20% Discount (Student/Senior/PWD):
              </Text>
              <Text style={[styles.mathVal, { color: '#3B82F6' }]}>
                -{formatPeso(currentFareData.regular - currentFareData.discounted)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { marginVertical: 6 }]} />

          <View style={styles.mathRow}>
            <Text style={[styles.mathTotalLabel, { color: colors.textPrimary }]}>
              Exact Fair Fare to Pay:
            </Text>
            <Text style={[styles.mathTotalVal, { color: colors.primary }]}>
              {formatPeso(currentPrice)}
            </Text>
          </View>

          {/* Anti-Overcharging Prompt */}
          <View style={styles.antiOverchargeBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#EF4444" />
              <Text style={styles.antiOverchargeTitle}>Driver charging more than {formatPeso(currentPrice)}?</Text>
            </View>
            <Text style={styles.antiOverchargeBody}>
              Charging above the official tariff is illegal under Dagupan City Ordinance. You can file an instant report.
            </Text>
            <TouchableOpacity
              style={styles.fileComplaintBtn}
              onPress={() => {
                navigation.navigate('SubmitComplaint', {
                  category: 'overcharging',
                  subject: `Overcharging trip to ${destination.name}`,
                  description: `Trip from ${origin.name} to ${destination.name} (${distanceKm} km). Official Dagupan tariff is ${formatPeso(currentPrice)} for ${selectedVehicle}, but driver demanded more.`,
                });
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="alert-octagon" size={15} color="#FFFFFF" />
              <Text style={styles.fileComplaintBtnText}>Report Overcharging Violation</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  permissionWarningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  permissionWarningText: {
    fontSize: 10,
    color: '#B45309',
  },
  enableGpsBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  enableGpsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  recenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  recenterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsWrapper: {
    marginTop: 8,
    marginBottom: 10,
  },
  chipsContent: {
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  landmarkChipText: {
    fontSize: 11,
  },
  mapContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  bodyContent: {
    padding: SPACING.xl,
  },
  tripMetricCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  tripPointCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotPill: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripPointLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tripPointName: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  tripStatsRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 11,
    color: '#64748B',
  },
  corridorBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: SPACING.lg,
  },
  corridorTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  corridorDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  discountToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  discountToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  vehicleCard: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  vehicleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vehicleCardName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  vehicleCardSub: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  vehicleCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  vehicleCardRate: {
    fontSize: 8,
    marginTop: 3,
    textAlign: 'center',
  },
  breakdownCard: {
    padding: 16,
    borderRadius: RADIUS.lg,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  breakdownBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  breakdownVehicleTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  breakdownTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: 10,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mathLabel: {
    fontSize: 11,
  },
  mathVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  mathTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  mathTotalVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  antiOverchargeBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
  },
  antiOverchargeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  antiOverchargeBody: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 4,
    lineHeight: 14,
  },
  fileComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  fileComplaintBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PinpointFareScreen;
