import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Image,
  useWindowDimensions,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { Card, LoadingSpinner } from "../../components/common/SharedComponents";
import { routesAPI, locationSharingAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS, API_BASE_URL } from "../../utils/constants";
import { getMunicipality, saveMunicipality } from "../../utils/storage";
import LocationSharingModal from "./LocationSharingModal";
import { useSharedLocation } from "../../contexts/LocationContext";
import {
  LocationPermissionBanner,
  LocationPermissionModal,
} from "../../components/common/LocationPermissionPrompt";

const GPS_ICON = require("../../../assets/gps_access_icon.png");

const MUNICIPALITY_CENTROIDS = {
  Dagupan: { lat: 16.0433, lng: 120.3397, name: "Dagupan City" },
  Calasiao: { lat: 16.0125, lng: 120.3586, name: "Calasiao" },
  Binmaley: { lat: 16.0294, lng: 120.2689, name: "Binmaley" },
  Lingayen: { lat: 16.0217, lng: 120.2319, name: "Lingayen" },
  Mangaldan: { lat: 16.0694, lng: 120.4022, name: "Mangaldan" },
};

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

// Check if commuter location is near any point on a static route path
const isPointNearRoute = (ptLat, ptLng, routePath, thresholdKm = 0.45) => {
  if (!routePath || !Array.isArray(routePath) || routePath.length === 0)
    return true;
  for (let i = 0; i < routePath.length; i++) {
    const p = routePath[i];
    const rLat = Array.isArray(p) ? p[0] : p.lat;
    const rLng = Array.isArray(p) ? p[1] : p.lng;
    if (rLat && rLng) {
      const d = calculateDistanceKm(ptLat, ptLng, rLat, rLng);
      if (d !== null && d <= thresholdKm) return true;
    }
  }
  return false;
};

const RouteMapScreen = ({ navigation, onSwitchToCircle }) => {
  const {
    location: sharedLocation,
    setLocation: setSharedLocation,
    locationPermission,
    ensureLocationPermission,
  } = useSharedLocation();
  const iframeRef = useRef(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { showWarning } = useFeedback();
  const webViewRef = useRef(null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const isLandscape = windowWidth > windowHeight;
  const mapHeight = isLandscape
    ? Math.max(180, windowHeight * 0.32)
    : isTablet
      ? Math.min(320, Math.max(200, windowHeight * 0.3))
      : Math.min(250, Math.max(160, windowHeight * 0.24));

  const [routes, setRoutes] = useState([]);
  const [busTerminals, setBusTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality || "Dagupan");
  const [activeTab, setActiveTab] = useState("jeepneys"); // 'jeepneys' | 'buses'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [commuterLocation, setCommuterLocation] = useState({
    lat: sharedLocation?.lat ?? null,
    lng: sharedLocation?.lng ?? null,
    accuracy: sharedLocation?.accuracy ?? 25,
    isReal: Boolean(sharedLocation?.isReal),
  });
  const [locationStatus, setLocationStatus] = useState(
    sharedLocation?.isReal ? `Live GPS Active (±${sharedLocation?.accuracy || 20}m)` : "Acquiring GPS..."
  );
  const [recenterCount, setRecenterCount] = useState(0);

  // Sync if sharedLocation acquires real GPS
  useEffect(() => {
    if (sharedLocation && sharedLocation.isReal && sharedLocation.lat != null && sharedLocation.lng != null) {
      setCommuterLocation(sharedLocation);
      setLocationStatus(`Live GPS Active (±${sharedLocation.accuracy || 20}m)`);
    }
  }, [sharedLocation]);

  useEffect(() => {
    (async () => {
      const saved = await getMunicipality();
      const muni = saved || user?.municipality || "Dagupan";
      if (muni && MUNICIPALITY_CENTROIDS[muni]) {
        setSelectedMunicipality(muni);
      }
    })();
  }, [user?.municipality]);

  // Peer Location Sharing states
  const [showLocationSharingModal, setShowLocationSharingModal] =
    useState(false);
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    if (
      commuterLocation &&
      commuterLocation.isReal &&
      Number.isFinite(commuterLocation.lat) &&
      Number.isFinite(commuterLocation.lng)
    ) {
      if (!sharedLocation || sharedLocation.lat !== commuterLocation.lat || sharedLocation.lng !== commuterLocation.lng) {
        setSharedLocation(commuterLocation);
      }
    }
  }, [commuterLocation, sharedLocation, setSharedLocation]);

  // Real-time continuous location tracking
  useEffect(() => {
    if (
      locationPermission === "unknown" ||
      locationPermission === "undetermined"
    ) {
      ensureLocationPermission();
      return;
    }
    if (locationPermission === "denied") {
      setLocationStatus("Location is off. Tap Fix to enable");
      return;
    }

    let isMounted = true;
    let webWatchId = null;
    let nativeSub = null;

    const onFix = (c, fallbackAcc = 20) => {
      if (!isMounted) return;
      const acc = Math.round(c.accuracy || fallbackAcc);
      setCommuterLocation({
        lat: c.latitude,
        lng: c.longitude,
        accuracy: acc,
        isReal: true,
      });
      setLocationStatus(`Live GPS Active (±${acc}m)`);
    };

    (async () => {
      if (Platform.OS === "web") {
        webWatchId = navigator.geolocation.watchPosition(
          (pos) => onFix(pos.coords),
          (err) => console.warn("Web GPS watch:", err.message),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        );
        return;
      }

      nativeSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 4,
        },
        (loc) => onFix(loc.coords, 15),
      );
      if (!isMounted) nativeSub.remove();
    })();

    return () => {
      isMounted = false;
      if (webWatchId !== null) navigator.geolocation.clearWatch(webWatchId);
      if (nativeSub) nativeSub.remove();
    };
  }, [locationPermission]);
  // Fetch routes and bus terminals
  const loadData = async (muni = selectedMunicipality) => {
    try {
      const [routesRes, terminalsRes] = await Promise.all([
        routesAPI.getAllRoutes({ municipality: muni }),
        routesAPI.getBusTerminals(
          commuterLocation.isReal
            ? { lat: commuterLocation.lat, lng: commuterLocation.lng, municipality: muni }
            : { municipality: muni },
        ),
      ]);
      setRoutes(Array.isArray(routesRes.data?.data) ? routesRes.data.data : []);
      const rawTerminals = Array.isArray(terminalsRes.data?.data)
        ? terminalsRes.data.data
        : [];
      setBusTerminals(rawTerminals);
    } catch (e) {
      console.error("Data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMunicipality);
  }, [activeTab, selectedMunicipality]);

  const handleSelectMunicipality = async (muni) => {
    if (muni === selectedMunicipality) return;
    setSelectedMunicipality(muni);
    await saveMunicipality(muni);
    setRecenterCount((c) => c + 1);
  };

  // Real-time synchronization for peer locations
  const fetchPeerLocations = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res = await locationSharingAPI.getPeerLocations();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPeers(res.data.data);
      }
    } catch (e) {
      // transient network ignore
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPeers([]);
      return;
    }

    if (commuterLocation.isReal && commuterLocation.lat && commuterLocation.lng) {
      locationSharingAPI
        .updateMyLocation({
          lat: commuterLocation.lat,
          lng: commuterLocation.lng,
        })
        .catch(() => { });
    }
    fetchPeerLocations();

    const interval = setInterval(() => {
      if (commuterLocation.isReal && commuterLocation.lat && commuterLocation.lng) {
        locationSharingAPI
          .updateMyLocation({
            lat: commuterLocation.lat,
            lng: commuterLocation.lng,
          })
          .catch(() => { });
      }
      fetchPeerLocations();
    }, 8000);

    return () => clearInterval(interval);
  }, [commuterLocation.lat, commuterLocation.lng, commuterLocation.isReal, isAuthenticated, user]);

  // Compute live distances for terminals based on current commuterLocation
  const terminalsWithLiveDistance = busTerminals
    .map((t) => {
      const dist = (commuterLocation.isReal && commuterLocation.lat != null && commuterLocation.lng != null)
        ? calculateDistanceKm(
            commuterLocation.lat,
            commuterLocation.lng,
            t.lat,
            t.lng,
          )
        : null;
      return {
        ...t,
        distanceKm: dist !== null ? dist : t.distanceKm,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm === undefined || a.distanceKm === null) return 1;
      if (b.distanceKm === undefined || b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

  const safeRoutes = Array.isArray(routes) ? routes : [];
  const filteredRoutes = safeRoutes.filter((r) => {
    const matchesCategory =
      selectedCategory === "all" || r.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (r.name || "").toLowerCase().includes(q);
    const codeMatch = (r.code || "").toLowerCase().includes(q);
    const corridorMatch = (r.corridor || "").toLowerCase().includes(q);
    const descMatch = (r.description || "").toLowerCase().includes(q);
    const startMatch = (r.startPoint?.name || "").toLowerCase().includes(q);
    const endMatch = (r.endPoint?.name || "").toLowerCase().includes(q);
    return (
      nameMatch ||
      codeMatch ||
      corridorMatch ||
      descMatch ||
      startMatch ||
      endMatch
    );
  });

  // Trigger re-centering on commuter location with fresh GPS fix
  const handleRecenter = async () => {
    const state = await ensureLocationPermission();
    if (state !== "granted") {
      setShowPermissionModal(true);
      return;
    }

    if (webViewRef.current && Platform.OS !== "web") {
      webViewRef.current.injectJavaScript(
        `if (window.centerOnCommuter) { window.centerOnCommuter(); } true;`,
      );
    }
    try {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCommuterLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 20),
              isReal: true,
            });
            setLocationStatus(
              `Live GPS Active (±${Math.round(pos.coords.accuracy || 20)}m)`,
            );
            setRecenterCount((c) => c + 1);
          },
          () => setRecenterCount((c) => c + 1),
          { enableHighAccuracy: true, timeout: 5000 },
        );
      } else {
        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (cur) {
          setCommuterLocation({
            lat: cur.coords.latitude,
            lng: cur.coords.longitude,
            accuracy: Math.round(cur.coords.accuracy || 20),
            isReal: true,
          });
          setLocationStatus(
            `Live GPS Active (±${Math.round(cur.coords.accuracy || 20)}m)`,
          );
        }
        setRecenterCount((c) => c + 1);
      }
    } catch (_) {
      setRecenterCount((c) => c + 1);
    }
  };

  // Launch Live Tracker with route corridor geofence validation
  const handleTrackJeepney = async (routeItem) => {
    if (!routeItem) return;

    const state = await ensureLocationPermission();
    if (state !== "granted") {
      setShowPermissionModal(true);
      return;
    }
    if (!commuterLocation.isReal) {
      showWarning(
        "Still finding you",
        "Waiting for a GPS fix. Try again in a few seconds.",
      );
      return;
    }

    // Check if commuter location is along the static route corridor
    if (
      routeItem.path &&
      Array.isArray(routeItem.path) &&
      routeItem.path.length > 0
    ) {
      const near = isPointNearRoute(
        commuterLocation.lat,
        commuterLocation.lng,
        routeItem.path,
        0.45,
      );
      if (!near) {
        showWarning(
          "Outside Route Corridor",
          `You cannot use the live tracker for "${routeItem.name}" because your current location is not along this jeepney route corridor. Live tracking is strictly restricted to passengers along the route. For door-to-door trips, please use Solo Ride / Visitor Pinpoint.`,
        );
        return;
      }
    }

    navigation.navigate("RideTracker", {
      selectedRoute: routeItem,
      initialTab: "tracker",
      initialLocation: {
        latitude: commuterLocation.lat,
        longitude: commuterLocation.lng,
        accuracy: commuterLocation.accuracy,
        isReal: commuterLocation.isReal,
        timestamp: Date.now(),
      },
    });
  };

  const pushLocationToMap = () => {
    const { lat, lng, accuracy, isReal } = commuterLocation;
    if (lat == null || lng == null) return;
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          type: "UPDATE_USER_LOCATION",
          lat,
          lng,
          accuracy: accuracy || 20,
          isReal: Boolean(isReal),
        }),
        "*",
      );
    } else {
      webViewRef.current?.injectJavaScript(
        `window.updateUserLocation && window.updateUserLocation(${lat},${lng},${accuracy || 20},${Boolean(isReal)}); true;`,
      );
    }
  };

  useEffect(pushLocationToMap, [commuterLocation]);

  // Generate HTML for the embedded Leaflet Map
  const generateLeafletHtml = () => {
    const centroid = MUNICIPALITY_CENTROIDS[selectedMunicipality] || {
      lat: 16.0433,
      lng: 120.3397,
      name: "Dagupan City",
    };
    const isRealGPS = Boolean(commuterLocation?.isReal && commuterLocation?.lat != null && commuterLocation?.lng != null);
    const lat = isRealGPS ? commuterLocation.lat : (centroid.lat || 16.0433);
    const lng = isRealGPS ? commuterLocation.lng : (centroid.lng || 120.3397);
    const accuracy = commuterLocation?.accuracy || 25;

    const routesJson = JSON.stringify(
      routes.map((r) => ({
        id: r._id,
        name: r.name,
        code: r.code,
        category: r.category,
        distanceKm: r.distanceKm,
        corridor: r.corridor || r.description || "",
        isLoop: r.isLoop !== false,
        path: r.path || [],
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        waypoints: r.waypoints || [],
        terminalLocation: r.terminalLocation || null,
      })),
    );

    const terminalsJson = JSON.stringify(terminalsWithLiveDistance);
    const selectedRouteId = selectedItem?._id || "";
    const peersJson = JSON.stringify(peers || []);
    const apiHost = API_BASE_URL.replace(/\/api$/, "");

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

        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var userLat = ${lat};
          var userLng = ${lng};
          var userAccuracy = ${accuracy};
          var isRealFix = ${isRealGPS};

          if (typeof L === 'undefined') {
            console.error('Leaflet failed to load');
          } else {
            var map = L.map('map', { 
              zoomControl: true,
              preferCanvas: true 
            }).setView([userLat, userLng], 14);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap',
              maxZoom: 19
            }).addTo(map);

            setTimeout(function() { if (map) map.invalidateSize(); }, 200);
            setTimeout(function() { if (map) map.invalidateSize(); }, 600);

          var commuterCircle = null;
          var commuterMarker = null;

          var commuterIcon = L.divIcon({
            className: 'commuter-live-beacon',
            html: '<div class="commuter-beacon-wrapper"><div class="commuter-pulse-ring"></div><div class="commuter-pulse-ring-outer"></div><div class="commuter-core-dot"><div class="commuter-core-inner"></div></div></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          function buildCommuterPopup(pLat, pLng, pAcc) {
            return '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-width:180px;">' +
              '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
              '<span style="background:#2563EB; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">YOU ARE HERE</span>' +
              '<span style="color:#10B981; font-weight:700; font-size:11px;">● LIVE GPS</span>' +
              '</div>' +
              '<div style="font-size:13px; font-weight:800; color:#0f172a;">Your Current Location</div>' +
              '<div style="font-family:monospace; font-size:11px; color:#64748b; margin-top:2px;">' +
              pLat.toFixed(5) + '°N, ' + pLng.toFixed(5) + '°E (±' + pAcc + 'm)' +
              '</div>' +
              '<div style="font-size:11px; color:#3b82f6; margin-top:4px;">' +
              ${JSON.stringify((MUNICIPALITY_CENTROIDS[selectedMunicipality]?.name || selectedMunicipality) + ", Pangasinan")} + '</div>' +
              '</div>';
          }

          function setupCommuter(pLat, pLng, pAcc) {
            if (!commuterCircle) {
              commuterCircle = L.circle([pLat, pLng], {
                radius: Math.max(pAcc, 20),
                color: '#2563EB',
                fillColor: '#3B82F6',
                fillOpacity: 0.15,
                weight: 1.5
              }).addTo(map);
            } else {
              commuterCircle.setLatLng([pLat, pLng]);
              commuterCircle.setRadius(Math.max(pAcc, 20));
            }

            if (!commuterMarker) {
              commuterMarker = L.marker([pLat, pLng], {
                icon: commuterIcon,
                zIndexOffset: 3000
              }).addTo(map);
              commuterMarker.bindPopup(buildCommuterPopup(pLat, pLng, pAcc));
            } else {
              commuterMarker.setLatLng([pLat, pLng]);
              commuterMarker.setPopupContent(buildCommuterPopup(pLat, pLng, pAcc));
            }
          }

          if (isRealFix) {
            setupCommuter(userLat, userLng, userAccuracy);
          }

          // Center On Commuter Function for Native / Web bridge
          window.centerOnCommuter = function() {
            if (commuterMarker) {
              map.setView(commuterMarker.getLatLng(), 16, { animate: true });
              commuterMarker.openPopup();
            } else {
              map.setView([userLat, userLng], 14, { animate: true });
            }
          };

          var hasCentered = false;
          window.updateUserLocation = function(lat, lng, acc, real) {
            if (typeof lat !== 'number' || typeof lng !== 'number') return;
            userLat = lat; userLng = lng; userAccuracy = acc || 20;
            if (real) {
              setupCommuter(lat, lng, userAccuracy);
              if (!hasCentered && !selectedId) {
                hasCentered = true;
                map.setView([lat, lng], 15);
              }
            }
          };
          window.addEventListener('message', function(e) {
            try {
              var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (d && d.type === 'UPDATE_USER_LOCATION') {
                window.updateUserLocation(d.lat, d.lng, d.accuracy, d.isReal);
              } else if (d && d.type === 'CENTER_ON_COMMUTER') {
                window.centerOnCommuter();
              }
            } catch (_) {}
          });

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
              'BONUAN_BINLOC': '#0D9488',
              'SAN_FABIAN_MANGALDAN_DAGUPAN': '#0284C7',
              'LINGAYEN_BINMALEY_DAGUPAN': '#4F46E5',
            };

            var selectedCat = '${selectedCategory}';
            var routesToRender = routes.filter(function(r) {
              if (selectedId) return (r.id === selectedId || String(r.id) === String(selectedId));
              if (selectedCat !== 'all') return r.category === selectedCat;
              return true;
            });

            routesToRender.forEach(function(route) {
              var isSelected = (selectedId && (route.id === selectedId || String(route.id) === String(selectedId)));
              var baseColor = routeColorMap[route.code] || (route.category === 'city' ? '#2563EB' : '#10B981');
              var color = isSelected ? '#F59E0B' : baseColor;
              var weight = isSelected ? 6 : (route.path && route.path.length > 0 ? 4 : 3);
              var opacity = 1.0;

              var pts = [];
              if (route.path && route.path.length > 1) {
                pts = route.path.map(function(p) { return [p.lat, p.lng]; });
              } else if (route.waypoints && route.waypoints.length > 1) {
                pts = route.waypoints.map(function(w) { return [w.lat, w.lng]; });
              }

              if (pts.length > 1) {
                var poly = L.polyline(pts, {
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  dashArray: null
                }).bindPopup(
                  '<div style="min-width:180px;">' +
                  '<div style="font-weight:800; font-size:13px; color:' + color + ';">🚐 ' + route.name + '</div>' +
                  (route.corridor ? '<div style="font-size:11px; margin-top:3px; color:#334155; font-weight:600;">' + route.corridor + '</div>' : '') +
                  '<div style="font-size:11px; color:#64748b; margin-top:4px;">Distance: ~' + route.distanceKm + ' km • ' + (route.isLoop ? 'Loop Corridor' : 'Static Corridor') + '</div>' +
                  '</div>'
                ).addTo(map);

                if (isSelected) {
                  selectedBounds = poly.getBounds();
                  // Add clear start and end pin markers for the selected solo route
                  L.circleMarker(pts[0], { radius: 7, color: '#FFFFFF', fillColor: '#16A34A', fillOpacity: 1, weight: 2.5 })
                    .bindPopup('<b>🟢 Start: ' + (route.startPoint && route.startPoint.name ? route.startPoint.name : route.name) + '</b>')
                    .addTo(map);
                  L.circleMarker(pts[pts.length - 1], { radius: 7, color: '#FFFFFF', fillColor: '#DC2626', fillOpacity: 1, weight: 2.5 })
                    .bindPopup('<b>🔴 Terminal Depot: ' + (route.endPoint && route.endPoint.name ? route.endPoint.name : route.name) + '</b>')
                    .addTo(map);
                }
              }
            });

            function applyRouteBounds() {
              if (!map) return;
              map.invalidateSize();
              if (selectedBounds && selectedBounds.isValid()) {
                map.fitBounds(selectedBounds, { padding: [40, 40], maxZoom: 16 });
              }
            }

            if (selectedBounds && selectedBounds.isValid()) {
              map.fitBounds(selectedBounds, { padding: [40, 40], maxZoom: 16 });
            }
            setTimeout(applyRouteBounds, 150);
            setTimeout(applyRouteBounds, 400);
            setTimeout(applyRouteBounds, 800);
          }

          // 4. Render Dagupan Transit Terminals & Hubs directly on Jeepney Routes map
          busTerminals.forEach(function(t) {
            if (!t || typeof t.lat !== 'number' || typeof t.lng !== 'number') return;
            var typeEmoji = '🚌';
            var badgeColor = '#3B82F6';
            var badgeLabel = 'BUS TERMINAL';
            if (t.type === 'jeepney') {
              typeEmoji = '🚐';
              badgeColor = '#10B981';
              badgeLabel = 'JEEPNEY STAGING HUB';
            } else if (t.type === 'tricycle' || t.type === 'solo_ride') {
              typeEmoji = '🚗';
              badgeColor = '#F59E0B';
              badgeLabel = 'SOLO RIDE / TODA HUB';
            } else if (t.type === 'multimodal') {
              typeEmoji = '🏢';
              badgeColor = '#8B5CF6';
              badgeLabel = 'MULTIMODAL TRANSIT HUB';
            }

            var termIcon = L.divIcon({
              className: 'terminal-pin',
              html: '<div style="background:' + badgeColor + '; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.4);">' + typeEmoji + '</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
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

          // 4. Render Authorized Peer Commuters (Live Location Sharing with Profile Photos)
          var peers = ${peersJson};
          if (Array.isArray(peers) && peers.length > 0) {
            peers.forEach(function(peer) {
              if (typeof peer.lat !== 'number' || typeof peer.lng !== 'number') return;
              var avatarSrc = peer.profilePhoto
                ? (peer.profilePhoto.indexOf('http') === 0 ? peer.profilePhoto : '${apiHost}' + peer.profilePhoto)
                : null;
              var initialChar = (peer.name && peer.name.trim().length > 0) ? peer.name.trim().charAt(0).toUpperCase() : 'U';
              var avatarContent = avatarSrc
                ? '<img src="' + avatarSrc + '" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:2.5px solid #FFFFFF; background:#334155;" />'
                : '<div style="width:34px; height:34px; border-radius:50%; background:#8B5CF6; color:#ffffff; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; border:2.5px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.3);">' + initialChar + '</div>';

              var peerMarkerHtml = 
                '<div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">' +
                '<div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(139,92,246,0.35); animation:radar-sweep 2s infinite;"></div>' +
                avatarContent +
                '<div style="position:absolute; bottom:-12px; background:#0F172A; color:#FFFFFF; font-size:9px; font-weight:800; padding:1px 5px; border-radius:8px; border:1px solid #8B5CF6; white-space:nowrap; max-width:80px; overflow:hidden; text-overflow:ellipsis;">' +
                (peer.name ? peer.name.split(' ')[0] : 'Peer') +
                '</div>' +
                '</div>';

              var peerIcon = L.divIcon({
                className: 'peer-commuter-pin',
                html: peerMarkerHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });

              var peerPopupHtml = 
                '<div style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; min-width:180px;">' +
                '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
                '<span style="background:#8B5CF6; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">SAKAYCIRCLE MEMBER</span>' +
                '<span style="color:#10B981; font-weight:700; font-size:11px;">● LIVE</span>' +
                '</div>' +
                '<div style="font-size:13px; font-weight:800; color:#0f172a;">' + peer.name + '</div>' +
                '<div style="font-size:11px; color:#64748b; margin-top:2px;">' + (peer.email || '') + '</div>' +
                '<div style="font-family:monospace; font-size:10px; color:#8b5cf6; margin-top:4px;">' +
                peer.lat.toFixed(5) + '°N, ' + peer.lng.toFixed(5) + '°E' +
                '</div>' +
                '</div>';

              L.marker([peer.lat, peer.lng], { icon: peerIcon, zIndexOffset: 2500 })
                .bindPopup(peerPopupHtml)
                .addTo(map);
            });
          }


        </script>
      </body>
      </html>
    `;
  };

  const mapHtml = useMemo(
    () => generateLeafletHtml(),
    [
      routes,
      busTerminals,
      peers,
      selectedItem,
      selectedCategory,
      activeTab,
      selectedMunicipality,
      recenterCount,
      commuterLocation.isReal,
    ],
  );

  useEffect(() => {
    if (locationPermission === "granted") setShowPermissionModal(false);
  }, [locationPermission]);

  if (loading)
    return <LoadingSpinner text="Connecting to Dagupan Transit Grid..." />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header: Real-time commuter GPS status with Re-center action */}
      <View
        style={[
          styles.gpsStatusBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.gpsRow}>
          <View
            style={[
              styles.gpsDot,
              {
                backgroundColor: commuterLocation.isReal
                  ? "#10B981"
                  : "#F59E0B",
              },
            ]}
          />
          <Text style={[styles.gpsStatusText, { color: colors.textPrimary }]}>
            {locationStatus}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.7}
          style={styles.recenterHeaderBtn}
        >
          <Image
            source={GPS_ICON}
            style={{ width: 14, height: 14, marginRight: 2 }}
            resizeMode="contain"
          />
          <Text style={styles.recenterHeaderText}>
            {commuterLocation.isReal && commuterLocation.lat != null
              ? `${commuterLocation.lat.toFixed(4)}°N, ${commuterLocation.lng.toFixed(4)}°E`
              : (MUNICIPALITY_CENTROIDS[selectedMunicipality]?.name || selectedMunicipality)}
          </Text>
        </TouchableOpacity>
      </View>

      {locationPermission === "denied" && (
        <LocationPermissionBanner
          onPress={() => setShowPermissionModal(true)}
        />
      )}

      {/* Sub-Header Bar: Terminals visible notice + Solo Ride + Full Map Arrow Toggle */}
      <View
        style={[
          styles.subBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.hubIndicator}>
          <MaterialCommunityIcons
            name="domain"
            size={15}
            color={colors.primary}
          />
          <Text
            style={[styles.hubIndicatorText, { color: colors.textSecondary }]}
          >
            Terminals & Hubs visible
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {/* Top Arrow Button: Toggles down list of routes so user sees full map, or toggles up */}
          <TouchableOpacity
            style={[
              styles.mapToggleBtn,
              {
                backgroundColor: isListCollapsed
                  ? colors.primary
                  : isDark
                    ? "rgba(37, 99, 235, 0.18)"
                    : "#EFF6FF",
                borderColor: isListCollapsed ? colors.primary : "#93C5FD",
              },
            ]}
            onPress={() => setIsListCollapsed(!isListCollapsed)}
            activeOpacity={0.8}
            accessibilityLabel={
              isListCollapsed ? "Show Routes List" : "Toggle Down to Full Map"
            }
          >
            <MaterialCommunityIcons
              name={isListCollapsed ? "chevron-up" : "chevron-down"}
              size={18}
              color={isListCollapsed ? "#FFFFFF" : colors.primary}
            />
            <Text
              style={[
                styles.mapToggleBtnText,
                { color: isListCollapsed ? "#FFFFFF" : colors.primary },
              ]}
            >
              {isListCollapsed ? "Show Routes" : "Full Map"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Municipality Scope Bar */}
      <View
        style={[
          styles.municipalityBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
          },
        ]}
      >
        <View style={styles.municipalityLabelRow}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.municipalityLabel, { color: colors.textSecondary }]}>
            Active LGU:
          </Text>
          <View
            style={[
              styles.municipalityPill,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.municipalityPillText,
                {
                  color: "#FFFFFF",
                  fontWeight: "700",
                },
              ]}
            >
              {selectedMunicipality}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: FONTS.sizes.xs,
            color: colors.textSecondary,
            marginLeft: "auto",
          }}
        >
          Transit Routes: {selectedMunicipality}
        </Text>
      </View>

      {/* Embedded Interactive Leaflet Map (Takes Full Screen when routes list is toggled down) */}
      <View
        style={[
          styles.mapContainer,
          isListCollapsed
            ? { flex: 1, width: "100%", height: "100%" }
            : { height: mapHeight, width: "100%" },
        ]}
      >
        {selectedItem && (
          <View style={styles.selectedRouteOverlay}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <MaterialCommunityIcons name="target" size={16} color="#F59E0B" />
              <Text style={styles.selectedRouteOverlayText} numberOfLines={1}>
                Solo Route:{" "}
                <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>
                  {selectedItem.name}
                </Text>
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
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef}
            onLoad={pushLocationToMap}
            key={`leaflet-map-${selectedMunicipality}-${activeTab}-${selectedCategory}-${recenterCount}-${selectedItem?._id || "all"}-${isListCollapsed ? "full" : "norm"}-${peers.length}`}
            title="Dagupan Transit Leaflet Map"
            srcDoc={mapHtml}
            allow="geolocation"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            onLoadEnd={pushLocationToMap}
            key={`leaflet-webview-${selectedMunicipality}-${activeTab}-${selectedCategory}-${recenterCount}-${selectedItem?._id || "all"}-${isListCollapsed ? "full" : "norm"}-${peers.length}`}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#0f172a",
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            geolocationEnabled={true}
            scrollEnabled={false}
          />
        )}

        {/* Floating Custom GPS Access Button */}
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          onPress={handleRecenter}
          activeOpacity={0.85}
          accessibilityLabel="Access Current Location"
        >
          <Image
            source={GPS_ICON}
            style={styles.gpsIconImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* When toggled down: Collapsed Bottom Dock so user can easily toggle back up */}
      {isListCollapsed ? (
        <TouchableOpacity
          style={[
            styles.collapsedBottomDock,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
          onPress={() => setIsListCollapsed(false)}
          activeOpacity={0.85}
        >
          <View style={styles.collapsedDockInner}>
            <View
              style={[
                styles.collapsedDockIconWrap,
                { backgroundColor: colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.collapsedDockTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Toggle Up: Show Routes ({filteredRoutes.length}) & Search
              </Text>
              <Text
                style={[styles.collapsedDockSub, { color: colors.textMuted }]}
              >
                Tap to search corridors or view live tracking details
              </Text>
            </View>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>
      ) : (
        <>
          {/* Drawer Bar with Arrow Button at top of routes list */}
          <View
            style={[
              styles.drawerToggleBar,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <MaterialCommunityIcons
                name="bus-side"
                size={18}
                color={colors.primary}
              />
              <Text
                style={[styles.drawerTitleText, { color: colors.textPrimary }]}
              >
                Jeepney Routes
              </Text>
              <View
                style={[
                  styles.routeCountBadge,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <Text
                  style={[styles.routeCountText, { color: colors.primary }]}
                >
                  {filteredRoutes.length}{" "}
                  {filteredRoutes.length === 1 ? "route" : "routes"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.toggleDownBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#F1F5F9",
                },
              ]}
              onPress={() => setIsListCollapsed(true)}
              activeOpacity={0.7}
              accessibilityLabel="Toggle down to view full map"
            >
              <Text
                style={[styles.toggleDownText, { color: colors.textSecondary }]}
              >
                Full Map
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Searchbar in the Router (Jeepney) */}
          <View
            style={[
              styles.searchBarContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.searchInputWrap,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#F8FAFC",
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={colors.textMuted}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search route name, code (e.g. DAG-CAL), corridor..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filter for Jeepney Routes */}
          <View style={styles.filterRow}>
            {["all", "city", "intercity"].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedCategory === cat
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedCategory === cat ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={{
                    color:
                      selectedCategory === cat ? "#FFFFFF" : colors.textPrimary,
                    fontWeight: "600",
                    fontSize: FONTS.sizes.xs,
                    textTransform: "capitalize",
                  }}
                >
                  {cat === "all" ? "All Static Routes" : `${cat} Corridors`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content List: Static Jeepney Corridors */}
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
                      isSelected && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor:
                              (item.category || "city") === "city"
                                ? "#DBEAFE"
                                : "#FEF3C7",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              (item.category || "city") === "city"
                                ? "#2563EB"
                                : "#D97706",
                            fontSize: FONTS.sizes.xs,
                            fontWeight: "700",
                          }}
                        >
                          {(item.category || "city").toUpperCase()} JEEPNEY •{" "}
                          {item.isLoop !== false ? "LOOP" : "CORRIDOR"}
                        </Text>
                      </View>
                      {item.distanceKm ? (
                        <Text
                          style={[
                            styles.distanceBadge,
                            { color: colors.textMuted },
                          ]}
                        >
                          ~{item.distanceKm} km
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      style={[styles.itemTitle, { color: colors.textPrimary }]}
                    >
                      {item.name || "Unnamed Route"}
                    </Text>

                    {/* Static Route Corridor */}
                    <View style={styles.corridorContainer}>
                      <MaterialCommunityIcons
                        name="transit-connection-variant"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.corridorText,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {item.corridor ||
                          item.description ||
                          "Static Dagupan transit corridor"}
                      </Text>
                    </View>

                    {/* Badges Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaBadge}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={13}
                          color={colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.metaBadgeText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {item.operatingHours?.start || "04:00"} -{" "}
                          {item.operatingHours?.end || "21:00"}
                        </Text>
                      </View>

                      {hasGpxPath && (
                        <View
                          style={[
                            styles.metaBadge,
                            { backgroundColor: "#ECFDF5" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="routes"
                            size={13}
                            color="#10B981"
                          />
                          <Text
                            style={[
                              styles.metaBadgeText,
                              { color: "#059669", fontWeight: "700" },
                            ]}
                          >
                            GPX Track Active
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Card Actions: Track Jeepney (with geofence check) & View Details */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.trackBtn,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={() => handleTrackJeepney(item)}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons
                          name="crosshairs-gps"
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.trackBtnText}>Ride Jeepney</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.detailBtn,
                          { borderColor: colors.border },
                        ]}
                        onPress={() =>
                          navigation.navigate("RouteDetail", { route: item })
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.detailBtnText,
                            { color: colors.primary },
                          ]}
                        >
                          Details
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={15}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 44,
                  paddingHorizontal: 24,
                }}
              >
                <MaterialCommunityIcons
                  name="van-passenger"
                  size={48}
                  color={colors.textMuted}
                  style={{ marginBottom: 12, opacity: 0.6 }}
                />
                <Text
                  style={{
                    fontSize: FONTS.sizes.md,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                >
                  No Routes Found
                </Text>
                <Text
                  style={{
                    fontSize: FONTS.sizes.xs,
                    color: colors.textMuted,
                    textAlign: "center",
                    lineHeight: 18,
                    maxWidth: 300,
                  }}
                >
                  {searchQuery
                    ? `No jeepney routes match "${searchQuery}". Try searching for Lucao, Bonuan, Calasiao, or a route code.`
                    : "No jeepney routes match this filter category in Dagupan City."}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Peer Location Sharing Modal */}
      <LocationSharingModal
        visible={showLocationSharingModal}
        onClose={() => setShowLocationSharingModal(false)}
        onRefreshPeers={fetchPeerLocations}
      />

      <LocationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRetry={async () => {
          const s = await ensureLocationPermission();
          if (s === "granted") setShowPermissionModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gpsStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  gpsDot: { width: 9, height: 9, borderRadius: 5 },
  gpsStatusText: { fontSize: FONTS.sizes.xs, fontWeight: "700" },
  recenterHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  recenterHeaderText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: "monospace",
    color: "#38BDF8",
    fontWeight: "600",
  },
  subBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  hubIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hubIndicatorText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  tricycleQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tricycleQuickBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  mapContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  floatingGpsBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#EA580C",
    zIndex: 1100,
  },
  gpsIconImg: {
    width: 32,
    height: 32,
  },
  filterRow: {
    flexDirection: "row",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  distanceBadge: { fontSize: FONTS.sizes.xs, fontWeight: "600" },
  itemTitle: { fontSize: FONTS.sizes.md, fontWeight: "800", marginBottom: 6 },
  corridorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginVertical: 4,
  },
  corridorText: {
    fontSize: FONTS.sizes.xs + 1,
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: RADIUS.sm,
  },
  trackBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: { fontSize: 11 },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  detailBtnText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  terminalAddress: { fontSize: FONTS.sizes.xs, marginBottom: 6 },
  terminalMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  terminalMetaText: { fontSize: FONTS.sizes.xs },
  destinationsBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 8,
  },
  destinationsLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  destinationsText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    marginTop: 2,
  },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  amenityChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  amenityText: { fontSize: 10 },
  selectedRouteOverlay: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 1000,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  selectedRouteOverlayText: {
    color: "#F59E0B",
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
  },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  showAllBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  mapToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  mapToggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  drawerToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  drawerTitleText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  routeCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  routeCountText: {
    fontSize: 10,
    fontWeight: "800",
  },
  toggleDownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  toggleDownText: {
    fontSize: 11,
    fontWeight: "600",
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.xs + 1,
    height: "100%",
    padding: 0,
  },
  collapsedBottomDock: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  collapsedDockInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  collapsedDockIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedDockTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  collapsedDockSub: {
    fontSize: FONTS.sizes.xs,
    marginTop: 1,
  },
  peerShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  peerShareBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B5CF6",
  },
  municipalityBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 8,
  },
  municipalityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  municipalityLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  municipalityScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 10,
  },
  municipalityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  municipalityPillText: {
    fontSize: 11,
  },
});

export default RouteMapScreen;
