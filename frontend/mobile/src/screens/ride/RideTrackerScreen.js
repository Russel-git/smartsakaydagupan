import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { routesAPI } from "../../api/services";
import { Card, LoadingSpinner } from "../../components/common/SharedComponents";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthPromptModal from "../../components/common/AuthPromptModal";
import ConfirmDialogModal from "../../components/common/ConfirmDialogModal";
import { useSharedLocation } from "../../contexts/LocationContext";
import {
  FONTS,
  SPACING,
  RADIUS,
  VEHICLE_TYPES,
  DISCOUNT_TYPES,
} from "../../utils/constants";
import { formatPeso } from "../../utils/helpers";
import {
  getRideHistory,
  saveRideToHistory,
  clearRideHistory,
  getMunicipality,
} from "../../utils/storage";



// Haversine distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
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

// Calculate minimum perpendicular distance in km from a point to a route path
const calculateDistanceToRouteKm = (ptLat, ptLng, routePath) => {
  if (!routePath || !Array.isArray(routePath) || routePath.length === 0) {
    return Infinity;
  }
  let minDistance = Infinity;
  const numPoints = routePath.length;

  for (let i = 0; i < numPoints; i++) {
    const p1 = routePath[i];
    const lat1 = Array.isArray(p1) ? p1[0] : (p1.lat ?? p1.latitude);
    const lng1 = Array.isArray(p1) ? p1[1] : (p1.lng ?? p1.longitude);
    if (lat1 == null || lng1 == null) continue;

    // Distance to vertex
    const dVertex = calculateDistanceKm(ptLat, ptLng, lat1, lng1);
    if (dVertex < minDistance) minDistance = dVertex;

    // Distance to line segment between vertex i and i + 1
    if (i < numPoints - 1) {
      const p2 = routePath[i + 1];
      const lat2 = Array.isArray(p2) ? p2[0] : (p2.lat ?? p2.latitude);
      const lng2 = Array.isArray(p2) ? p2[1] : (p2.lng ?? p2.longitude);
      if (lat2 == null || lng2 == null) continue;

      const cosMeanLat = Math.cos(((lat1 + lat2) * Math.PI) / 360);
      const dx = (lng2 - lng1) * cosMeanLat;
      const dy = lat2 - lat1;
      const segLenSq = dx * dx + dy * dy;

      if (segLenSq > 1e-12) {
        const px = (ptLng - lng1) * cosMeanLat;
        const py = ptLat - lat1;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
        const projLat = lat1 + t * (lat2 - lat1);
        const projLng = lng1 + t * (lng2 - lng1);
        const dSeg = calculateDistanceKm(ptLat, ptLng, projLat, projLng);
        if (dSeg < minDistance) minDistance = dSeg;
      }
    }
  }

  return minDistance;
};

// Check if a point is strictly within the designated route corridor (within threshold km)
const isPointNearRoute = (ptLat, ptLng, routePath, thresholdKm = 0.15) => {
  if (!routePath || !Array.isArray(routePath) || routePath.length === 0) {
    return false;
  }
  const dist = calculateDistanceToRouteKm(ptLat, ptLng, routePath);
  return dist <= thresholdKm;
};

// Project any coordinate onto the closest point strictly on the route polyline
const projectPointToRoute = (ptLat, ptLng, routePath) => {
  if (!routePath || !Array.isArray(routePath) || routePath.length === 0) {
    return { lat: ptLat, lng: ptLng, dist: 0 };
  }
  let best = { lat: ptLat, lng: ptLng, dist: Infinity, segIdx: 0, t: 0 };
  const numPoints = routePath.length;

  for (let i = 0; i < numPoints; i++) {
    const p1 = routePath[i];
    const lat1 = Number(p1.lat ?? p1[0]);
    const lng1 = Number(p1.lng ?? p1[1]);
    const dVertex = calculateDistanceKm(ptLat, ptLng, lat1, lng1);
    if (dVertex < best.dist) {
      best = { lat: lat1, lng: lng1, dist: dVertex, segIdx: i, t: 0 };
    }

    if (i < numPoints - 1) {
      const p2 = routePath[i + 1];
      const lat2 = Number(p2.lat ?? p2[0]);
      const lng2 = Number(p2.lng ?? p2[1]);
      const cosMeanLat = Math.cos(((lat1 + lat2) * Math.PI) / 360);
      const dx = (lng2 - lng1) * cosMeanLat;
      const dy = lat2 - lat1;
      const segLenSq = dx * dx + dy * dy;

      if (segLenSq > 1e-12) {
        const px = (ptLng - lng1) * cosMeanLat;
        const py = ptLat - lat1;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
        const projLat = lat1 + t * (lat2 - lat1);
        const projLng = lng1 + t * (lng2 - lng1);
        const dSeg = calculateDistanceKm(ptLat, ptLng, projLat, projLng);
        if (dSeg < best.dist) {
          best = { lat: projLat, lng: projLng, dist: dSeg, segIdx: i, t };
        }
      }
    }
  }

  return best;
};

// Calculate distance strictly along the route polyline (km count starts on route itself)
const getRouteDistanceKm = (origin, destination, routePath, isLoop = true) => {
  if (!origin || !destination || origin.lat == null || destination.lat == null) return 0;
  if (!routePath || !Array.isArray(routePath) || routePath.length < 2) {
    return Number(
      calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng).toFixed(2),
    );
  }

  // Pre-calculate cumulative distance along the route polyline
  const cumDist = [0];
  for (let i = 0; i < routePath.length - 1; i++) {
    const p1 = routePath[i];
    const p2 = routePath[i + 1];
    const lat1 = Number(p1.lat ?? p1[0]);
    const lng1 = Number(p1.lng ?? p1[1]);
    const lat2 = Number(p2.lat ?? p2[0]);
    const lng2 = Number(p2.lng ?? p2[1]);
    cumDist.push(cumDist[i] + calculateDistanceKm(lat1, lng1, lat2, lng2));
  }
  const totalLength = cumDist[cumDist.length - 1];
  if (totalLength <= 0.001) return 0;

  // Project points and gather candidate segments within corridor threshold
  const getProjections = (pt) => {
    let bestDist = Infinity;
    const candidates = [];
    const numPoints = routePath.length;

    for (let i = 0; i < numPoints - 1; i++) {
      const p1 = routePath[i];
      const p2 = routePath[i + 1];
      const lat1 = Number(p1.lat ?? p1[0]);
      const lng1 = Number(p1.lng ?? p1[1]);
      const lat2 = Number(p2.lat ?? p2[0]);
      const lng2 = Number(p2.lng ?? p2[1]);

      const cosMeanLat = Math.cos(((lat1 + lat2) * Math.PI) / 360);
      const dx = (lng2 - lng1) * cosMeanLat;
      const dy = lat2 - lat1;
      const segLenSq = dx * dx + dy * dy;
      let t = 0;
      let projLat = lat1;
      let projLng = lng1;

      if (segLenSq > 1e-12) {
        const px = (pt.lng - lng1) * cosMeanLat;
        const py = pt.lat - lat1;
        t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
        projLat = lat1 + t * (lat2 - lat1);
        projLng = lng1 + t * (lng2 - lng1);
      }

      const d = calculateDistanceKm(pt.lat, pt.lng, projLat, projLng);
      if (d < bestDist) bestDist = d;
      const segDist = cumDist[i + 1] - cumDist[i];
      const routePosKm = cumDist[i] + t * segDist;
      candidates.push({ dist: d, routePosKm });
    }

    const threshold = Math.max(bestDist + 0.05, 0.12);
    return candidates.filter((c) => c.dist <= threshold);
  };

  const oProjs = getProjections(origin);
  const dProjs = getProjections(destination);
  if (oProjs.length === 0 || dProjs.length === 0) return 0;

  let minTrip = Infinity;
  for (const o of oProjs) {
    for (const d of dProjs) {
      let forwardDist;
      if (d.routePosKm >= o.routePosKm) {
        forwardDist = d.routePosKm - o.routePosKm;
      } else if (isLoop) {
        forwardDist = totalLength - o.routePosKm + d.routePosKm;
      } else {
        forwardDist = o.routePosKm - d.routePosKm;
      }
      const directDist = Math.abs(d.routePosKm - o.routePosKm);
      const tripCandidate = Math.min(forwardDist, directDist);
      if (tripCandidate < minTrip) {
        minTrip = tripCandidate;
      }
    }
  }

  return minTrip === Infinity ? 0 : Number(minTrip.toFixed(2));
};

const normalizeLocation = (location) => {
  if (!location) return null;

  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    lat,
    lng,
    accuracy: location.accuracy ?? null,
    isReal: location.isReal === true,
  };
};

const buildWaitingHtml = () => `
<!DOCTYPE html>
<html>
  <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#EFE6DD;color:#463737;font-family:sans-serif;">
    <p>Waiting for your actual GPS location...</p>
  </body>
</html>
`;

const buildRideMapHtml = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; }
    .commuter-marker {
      width: 24px; height: 24px; border-radius: 50%; background: #2563EB;
      border: 3px solid #ffffff; box-shadow: 0 0 16px rgba(37,99,235,1);
      display: flex; align-items: center; justify-content: center;
      animation: pulse-ring 2s infinite;
    }
    .commuter-inner { width: 8px; height: 8px; border-radius: 50%; background: #ffffff; }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.8); }
      70% { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
      100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
    }
    .boarding-pin {
      background: #16A34A; color: white; width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 13px;
      font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([${lat}, ${lng}], 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Let web users scroll the page when the cursor is over the map
    window.addEventListener('wheel', function (e) {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
        }
      } catch (err) {}
    }, { passive: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var routeLine = null;
    var boardMarker = null;

    var commuterIcon = L.divIcon({
      className: '',
      html: '<div class="commuter-marker"><div class="commuter-inner"></div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    var commuterMarker = L.marker([${lat}, ${lng}], { icon: commuterIcon }).addTo(map);
    commuterMarker.bindPopup('<b>Your Live Position</b><br/>Tracking ride...');

    var boardIcon = L.divIcon({
      className: '',
      html: '<div class="boarding-pin">🚏</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    // Single entry point used by React: { position?, path?, start? }
    window.updateMap = function (data) {
      if (!data) return;

      if (data.position && typeof data.position.lat === 'number' && typeof data.position.lng === 'number') {
        var ll = [data.position.lat, data.position.lng];
        commuterMarker.setLatLng(ll);
        map.panTo(ll, { animate: true });
      }

      if ('path' in data) {
        if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
        var raw = data.path || [];
        var pts = raw.map(function (p) {
          return Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng];
        });
        if (pts.length > 0) {
          routeLine = L.polyline(pts, {
            color: '#3B82F6', weight: 5, opacity: 0.85,
            lineJoin: 'round', lineCap: 'round'
          }).addTo(map);
        }
      }

      if ('start' in data) {
        if (boardMarker) { map.removeLayer(boardMarker); boardMarker = null; }
        if (data.start) {
          boardMarker = L.marker([data.start.lat, data.start.lng], { icon: boardIcon })
            .addTo(map)
            .bindPopup('<b>Boarding Location</b><br/>Ride started here');
        }
      }
    };

    // Web iframe path: parent sends JSON through postMessage
    window.addEventListener('message', function (e) {
      try {
        var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && d.type === 'UPDATE_MAP') window.updateMap(d);
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

const RideTrackerScreen = ({ route, navigation }) => {
  const {
    selectedRoute: initialSelectedRoute,
    initialTab = "tracker",
    initialLocation,
  } = route.params || {};

  const { location: sharedLocation } = useSharedLocation();
  const { colors } = useTheme();
  const { isGuest, user } = useAuth();
  const { showSuccess, showInfo, showWarning } = useFeedback();

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const isLandscape = windowWidth > windowHeight;
  const mapHeight = isLandscape
    ? Math.max(220, Math.min(360, windowHeight * 0.42))
    : isTablet
      ? Math.min(320, windowHeight * 0.4)
      : Math.min(320, Math.max(400, windowHeight * 0.35));
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    icon: null,
    onConfirm: () => {},
  });
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  // View Tab: 'tracker' | 'history'
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab || "tracker",
  );
  const [rideHistory, setRideHistory] = useState([]);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // Data & Selection state
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(
    initialSelectedRoute ?? null,
  );
  const [vehicleType, setVehicleType] = useState("traditional");
  const [discount, setDiscount] = useState("none");
  const [openDropdown, setOpenDropdown] = useState(null); // 'route' | 'vehicle' | 'discount' | null

  // Destination Pinpoint state & live expected fare
  const [destination, setDestination] = useState(null);



  // Ride State: 'idle' | 'riding' | 'completed'
  const [rideState, setRideState] = useState("idle");

  // Commuter Position & Real-time Metrics
  const [currentLocation, setCurrentLocation] = useState(() =>
    normalizeLocation(initialLocation),
  );
  const [startLocation, setStartLocation] = useState(null);
  const [gpsReady, setGpsReady] = useState(
    Boolean(normalizeLocation(initialLocation)),
  );
  const [gpsError, setGpsError] = useState("");
  const [distanceTraveledKm, setDistanceTraveledKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const lastLocationRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const watchSubscriptionRef = useRef(null);
  const headingSubRef = useRef(null);
  const lastSentHeadingRef = useRef(-999);
  const currentHeadingRef = useRef(0);
  const startedAtRef = useRef(null);

  const loadHistory = async () => {
    const data = await getRideHistory();
    setRideHistory(data || []);
  };

  const rideStateRef = useRef(rideState);
  useEffect(() => {
    rideStateRef.current = rideState;
  }, [rideState]);

  const selectedRouteRef = useRef(selectedRoute);
  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  const startLocationRef = useRef(startLocation);
  useEffect(() => {
    startLocationRef.current = startLocation;
  }, [startLocation]);

  // Load active routes & ride history
  useEffect(() => {
    loadHistory();
    const fetchRoutes = async () => {
      try {
        const savedMuni = await getMunicipality();
        const activeMuni = (savedMuni || user?.municipality || "Dagupan").trim();
        const { data } = await routesAPI.getAllRoutes({ municipality: activeMuni });
        const routeList = Array.isArray(data.data) ? data.data : [];
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRoute((currentRoute) => {
            if (!currentRoute) {
              return initialSelectedRoute ?? routeList[0];
            }

            const matchingRoute = routeList.find(
              (item) => item._id === currentRoute._id,
            );

            return matchingRoute ?? currentRoute;
          });
        }
      } catch (err) {
        console.warn("Failed to load routes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    const nextLocation = normalizeLocation(sharedLocation);

    if (!nextLocation) return;

    setCurrentLocation(nextLocation);
    setGpsReady(nextLocation.isReal);
    setGpsError("");

    if (rideStateRef.current !== "riding") {
      lastLocationRef.current = nextLocation;
      return;
    }

    const currentRoute = selectedRouteRef.current;
    const routePoints =
      currentRoute?.path &&
      Array.isArray(currentRoute.path) &&
      currentRoute.path.length > 0
        ? currentRoute.path
        : currentRoute?.waypoints;

    if (routePoints && routePoints.length >= 2 && startLocationRef.current) {
      const traveledOnRoute = getRouteDistanceKm(
        startLocationRef.current,
        nextLocation,
        routePoints,
        currentRoute?.isLoop !== false,
      );
      if (traveledOnRoute > 0) {
        setDistanceTraveledKm((prev) => Math.max(prev, traveledOnRoute));
      }
      lastLocationRef.current = nextLocation;
    } else {
      const previousLocation = lastLocationRef.current;
      if (!previousLocation) {
        lastLocationRef.current = nextLocation;
        return;
      }
      const stepDist = calculateDistanceKm(
        previousLocation.lat,
        previousLocation.lng,
        nextLocation.lat,
        nextLocation.lng,
      );
      if (stepDist > 0.003 && stepDist < 2.0) {
        setDistanceTraveledKm((prev) => Number((prev + stepDist).toFixed(3)));
        lastLocationRef.current = nextLocation;
      }
    }
  }, [sharedLocation]);

  // Compute live LTFRB fare
  const computeLiveFare = (distanceKm) => {
    let baseFare = 14;
    let baseDistanceKm = 4;
    let perKmRate = 2.0;

    if (vehicleType === "traditional") {
      baseFare = 14;
      baseDistanceKm = 4;
      perKmRate = 2.0;
    } else if (vehicleType === "modern") {
      baseFare = 17;
      baseDistanceKm = 4;
      perKmRate = 2.4;
    }

    let subtotal;
    if (distanceKm <= baseDistanceKm) {
      subtotal = baseFare;
    } else {
      subtotal = baseFare + (distanceKm - baseDistanceKm) * perKmRate;
    }

    const discountRate = discount === "discounted" ? 0.2 : 0;
    const finalFare =
      discountRate > 0
        ? Math.ceil(subtotal * (1 - discountRate))
        : Math.ceil(subtotal);
    const regularFare = Math.ceil(subtotal);

    return {
      finalFare,
      regularFare,
      baseFare,
      baseDistanceKm,
      perKmRate,
      extraKm: Math.max(0, distanceKm - baseDistanceKm),
      isBase: distanceKm <= baseDistanceKm,
    };
  };

  const liveFareData = computeLiveFare(distanceTraveledKm);

  // Pre-calculated fare to pinpointed destination strictly along the route polyline
  const destinationFareData = useMemo(() => {
    if (!destination) return null;
    const origin = startLocation || currentLocation;
    if (!origin || origin.lat == null || origin.lng == null) return null;

    const routePoints =
      selectedRoute?.path &&
      Array.isArray(selectedRoute.path) &&
      selectedRoute.path.length > 0
        ? selectedRoute.path
        : selectedRoute?.waypoints &&
            Array.isArray(selectedRoute.waypoints) &&
            selectedRoute.waypoints.length > 0
          ? selectedRoute.waypoints
          : [];

    const routeKm = Math.max(
      0.1,
      getRouteDistanceKm(
        origin,
        destination,
        routePoints,
        selectedRoute?.isLoop !== false,
      ),
    );
    const fareInfo = computeLiveFare(routeKm);
    const estMins = Math.max(1, Math.round((routeKm / 30) * 60)); // ~30 km/h average PUJ speed

    return {
      distanceKm: routeKm,
      estMinutes: estMins,
      fare: fareInfo.finalFare,
      regularFare: fareInfo.regularFare,
      baseFare: fareInfo.baseFare,
      baseDistanceKm: fareInfo.baseDistanceKm,
      perKmRate: fareInfo.perKmRate,
      extraKm: fareInfo.extraKm,
      isBase: fareInfo.isBase,
    };
  }, [destination, startLocation, currentLocation, selectedRoute, vehicleType, discount]);

  // Remaining distance to destination while riding measured strictly along the route polyline
  const remainingDistanceToDestKm = useMemo(() => {
    if (!destination || !currentLocation || currentLocation.lat == null) return null;
    const routePoints =
      selectedRoute?.path &&
      Array.isArray(selectedRoute.path) &&
      selectedRoute.path.length > 0
        ? selectedRoute.path
        : selectedRoute?.waypoints &&
            Array.isArray(selectedRoute.waypoints) &&
            selectedRoute.waypoints.length > 0
          ? selectedRoute.waypoints
          : [];

    const routeKm = getRouteDistanceKm(
      currentLocation,
      destination,
      routePoints,
      selectedRoute?.isLoop !== false,
    );
    return Math.max(0, routeKm);
  }, [destination, currentLocation, selectedRoute]);

  const isNearDestination =
    remainingDistanceToDestKm !== null && remainingDistanceToDestKm <= 0.15;

  useEffect(() => () => stopTracking(), []);

  // Start Ride handler
  const handleStartRide = () => {
    if (!gpsReady || !currentLocation || !currentLocation.isReal) {
      showWarning(
        "Actual GPS Required",
        "Please wait for your device to acquire your actual GPS location before starting your ride.",
      );
      return;
    }
    if (isGuest) {
      setAuthModalVisible(true);
      return;
    }
    if (!selectedRoute) {
      showWarning(
        "Select Route",
        "Please select a jeepney route before starting ride tracking.",
      );
      return;
    }

    // Geofence corridor check: commuter cannot board a jeepney that is not within its route corridor
    const routePoints =
      selectedRoute?.path &&
      Array.isArray(selectedRoute.path) &&
      selectedRoute.path.length > 0
        ? selectedRoute.path
        : selectedRoute?.waypoints;
    if (routePoints && Array.isArray(routePoints) && routePoints.length > 0) {
      const isAlongRoute = isPointNearRoute(
        currentLocation.lat,
        currentLocation.lng,
        routePoints,
        0.05,
      );
      if (!isAlongRoute) {
        showWarning(
          "Outside Jeepney Route Corridor",
          `You cannot board "${selectedRoute.name}" because your current location is not within its designated route corridor. Commuters cannot board a jeepney that is not within its route.`,
        );
        return;
      }
    }

    // Snap starting point directly to the route polyline so km count starts on the route itself
    const projStart =
      routePoints && routePoints.length >= 2
        ? projectPointToRoute(currentLocation.lat, currentLocation.lng, routePoints)
        : currentLocation;
    const initialRouteStart = {
      ...currentLocation,
      lat: projStart.lat,
      lng: projStart.lng,
    };

    setStartLocation(initialRouteStart);
    startLocationRef.current = initialRouteStart;
    lastLocationRef.current = initialRouteStart;
    setDistanceTraveledKm(0);
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    rideStateRef.current = "riding";
    setRideState("riding");
    showInfo(
      "Tracking Started",
      `Live GPS tracking is now active for ${selectedRoute.name}. Safe travels!`,
    );

    // Timer based on wall-clock time (no drift, survives brief backgrounding)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    // Start GPS watch
    try {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        navigator.geolocation
      ) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const nextCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              isReal: true,
            };
            handleNewPosition(nextCoords);
          },
          (err) => console.warn("Web watchPosition error:", err),
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 },
        );
        watchSubscriptionRef.current = {
          remove: () => navigator.geolocation.clearWatch(id),
        };
      } else {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2500,
            distanceInterval: 4,
          },
          (newLoc) => {
            const nextCoords = {
              lat: newLoc.coords.latitude,
              lng: newLoc.coords.longitude,
              accuracy: newLoc.coords.accuracy,
              isReal: true,
            };
            handleNewPosition(nextCoords);
          },
        );
        watchSubscriptionRef.current = sub;
      }
    } catch (e) {
      console.warn("Could not start GPS watch:", e);
    }
  };

  const handleNewPosition = (nextCoords) => {
    setCurrentLocation(nextCoords);
    setGpsReady(true);
    setGpsError("");

    if (rideStateRef.current !== "riding") {
      lastLocationRef.current = nextCoords;
      return;
    }

    const currentRoute = selectedRouteRef.current;
    const routePoints =
      currentRoute?.path &&
      Array.isArray(currentRoute.path) &&
      currentRoute.path.length > 0
        ? currentRoute.path
        : currentRoute?.waypoints;

    if (routePoints && routePoints.length >= 2 && startLocationRef.current) {
      const traveledOnRoute = getRouteDistanceKm(
        startLocationRef.current,
        nextCoords,
        routePoints,
        currentRoute?.isLoop !== false,
      );
      if (traveledOnRoute > 0) {
        setDistanceTraveledKm((prev) => Math.max(prev, traveledOnRoute));
      }
      lastLocationRef.current = nextCoords;
    } else {
      const previousLocation = lastLocationRef.current;
      if (!previousLocation) {
        lastLocationRef.current = nextCoords;
        return;
      }
      const stepDist = calculateDistanceKm(
        previousLocation.lat,
        previousLocation.lng,
        nextCoords.lat,
        nextCoords.lng,
      );
      if (stepDist > 0.003 && stepDist < 2.0) {
        setDistanceTraveledKm((prev) => parseFloat((prev + stepDist).toFixed(3)));
        lastLocationRef.current = nextCoords;
      }
    }
  };

  // Stop tracking helper
  const stopTracking = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (watchSubscriptionRef.current) {
      if (typeof watchSubscriptionRef.current.remove === "function") {
        watchSubscriptionRef.current.remove();
      }
      watchSubscriptionRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  // End Ride prompt & handler
  const confirmEndRide = () => {
    setConfirmModalConfig({
      visible: true,
      title: "End Ride & Drop Off",
      message:
        "Are you sure you want to end your commute and calculate the final official fare?",
      confirmText: "End Ride",
      cancelText: "Continue Riding",
      type: "warning",
      icon: "map-marker-check",
      onConfirm: () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        handleEndRide();
      },
    });
  };

  const handleEndRide = async () => {
    stopTracking();
    const durationSecs = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : elapsedSeconds;
    setElapsedSeconds(durationSecs);
    setRideState("completed");

    const completedRide = {
      id: `ride_${Date.now()}`,
      timestamp: new Date().toISOString(),
      routeName: selectedRoute?.name || "Dagupan Route",
      routeCode: selectedRoute?.code || "",
      destination: destination?.name || "Drop-Off",
      vehicleType,
      fare: liveFareData.finalFare,
      regularFare: liveFareData.regularFare,
      discount,
      distanceKm: distanceTraveledKm,
      durationSecs,
    };

    const updated = await saveRideToHistory(completedRide);
    if (updated) setRideHistory(updated);
    showSuccess(
      "You've successfully arrived!",
      `Official fare calculated: ₱${liveFareData.finalFare}. Saved to ride history.`,
    );
  };

  const handleClearHistory = () => {
    setConfirmModalConfig({
      visible: true,
      title: "Clear Ride History",
      message:
        "Are you sure you want to clear all completed ride history logs?",
      confirmText: "Clear All",
      cancelText: "Cancel",
      type: "danger",
      icon: "trash-can-outline",
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        await clearRideHistory();
        setRideHistory([]);
        showInfo("History Cleared", "Your ride history log has been cleared.");
      },
    });
  };

  // Reset to idle
  const handleResetRide = () => {
    stopTracking();
    startedAtRef.current = null;
    setDistanceTraveledKm(0);
    setElapsedSeconds(0);
    setStartLocation(null);
    setDestination(null);
    sendDestinationToMap(null);
    setRideState("idle");
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const sendHeadingToMap = (deg) => {
    if (typeof deg !== "number" || isNaN(deg)) return;
    const rounded = Math.round(deg);
    if (Math.abs(rounded - lastSentHeadingRef.current) < 1) return;
    lastSentHeadingRef.current = rounded;
    currentHeadingRef.current = rounded;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ type: "UPDATE_HEADING", heading: rounded }),
        "*",
      );
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.updateHeading) { window.updateHeading(${rounded}); } true;`,
      );
    }
  };

  const pushLocationToMap = (loc) => {
    const targetLoc = loc || currentLocation;
    if (!targetLoc || targetLoc.lat == null || targetLoc.lng == null) return;
    const { lat, lng, accuracy } = targetLoc;

    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          type: "UPDATE_COMMUTER_LOCATION",
          lat,
          lng,
          accuracy: accuracy || 10,
          heading: currentHeadingRef.current,
        }),
        "*",
      );
    } else {
      webViewRef.current?.injectJavaScript(
        `if (window.updateCommuterLocation) { window.updateCommuterLocation(${lat}, ${lng}, ${accuracy || 10}, ${currentHeadingRef.current}); } true;`,
      );
    }
  };

  const sendDestinationToMap = (dest) => {
    if (!dest) {
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ type: "CLEAR_DESTINATION" }),
          "*"
        );
      } else {
        webViewRef.current?.injectJavaScript(
          "window.clearDestinationFromApp && window.clearDestinationFromApp(); true;"
        );
      }
      return;
    }

    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          type: "SET_DESTINATION",
          lat: dest.lat,
          lng: dest.lng,
          name: dest.name || "Pinpointed Destination",
        }),
        "*"
      );
    } else {
      webViewRef.current?.injectJavaScript(
        `window.setDestinationFromApp && window.setDestinationFromApp(${dest.lat}, ${dest.lng}, ${JSON.stringify(dest.name || "Pinpointed Destination")}); true;`
      );
    }
  };



  const handleClearDestination = () => {
    setDestination(null);
    sendDestinationToMap(null);
  };

  const handleMapEvent = (data) => {
    if (!data) return;
    if (data.type === "PINPOINT_OUTSIDE_ROUTE") {
      showWarning(
        "Invalid Destination",
        "Your destination is not within the route",
      );
      sendDestinationToMap(null);
      setDestination(null);
      return;
    }
    if (data.type === "PINPOINT_DESTINATION") {
      const routePoints =
        selectedRoute?.path &&
        Array.isArray(selectedRoute.path) &&
        selectedRoute.path.length > 0
          ? selectedRoute.path
          : selectedRoute?.waypoints &&
              Array.isArray(selectedRoute.waypoints) &&
              selectedRoute.waypoints.length > 0
            ? selectedRoute.waypoints
            : [];

      if (!isPointNearRoute(data.lat, data.lng, routePoints, 0.15)) {
        showWarning(
          "Invalid Destination",
          "Your destination is not within the route",
        );
        sendDestinationToMap(null);
        setDestination(null);
        return;
      }

      const proj = projectPointToRoute(data.lat, data.lng, routePoints);
      const name = data.name || "Pinpointed Destination";
      const snappedDest = {
        lat: proj.lat,
        lng: proj.lng,
        name,
      };

      setDestination(snappedDest);
      showInfo(
        "Destination Dropped",
        "Exact fare to pay driver updated based on your pinpointed drop-off!",
      );
    }
  };

  // Whenever selected route changes, clear destination if it is not within the new route
  useEffect(() => {
    if (!destination) return;
    const routePoints =
      selectedRoute?.path &&
      Array.isArray(selectedRoute.path) &&
      selectedRoute.path.length > 0
        ? selectedRoute.path
        : selectedRoute?.waypoints &&
            Array.isArray(selectedRoute.waypoints) &&
            selectedRoute.waypoints.length > 0
          ? selectedRoute.waypoints
          : [];
    if (!isPointNearRoute(destination.lat, destination.lng, routePoints, 0.15)) {
      setDestination(null);
      sendDestinationToMap(null);
    }
  }, [selectedRoute?._id]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handler = (e) => {
        try {
          const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (
            d &&
            (d.type === "PINPOINT_DESTINATION" ||
              d.type === "PINPOINT_OUTSIDE_ROUTE")
          ) {
            handleMapEvent(d);
          }
        } catch (_) {}
      };
      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    }
  }, [selectedRoute]);

  // Watch Device Compass / Orientation in Real-Time (Rotates flashlight beam as phone turns)
  useEffect(() => {
    let isMounted = true;
    let webOrientationHandler = null;

    const startHeadingWatcher = async () => {
      try {
        if (Platform.OS !== "web") {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            if (
              headingSubRef.current &&
              typeof headingSubRef.current.remove === "function"
            ) {
              headingSubRef.current.remove();
            }
            headingSubRef.current = await Location.watchHeadingAsync((data) => {
              if (!isMounted) return;
              const h =
                data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
              if (typeof h === "number" && !isNaN(h)) {
                sendHeadingToMap(h);
              }
            });
          }
        } else if (typeof window !== "undefined") {
          webOrientationHandler = (ev) => {
            if (!isMounted) return;
            let h = null;
            if (
              ev.webkitCompassHeading !== undefined &&
              ev.webkitCompassHeading !== null
            ) {
              h = ev.webkitCompassHeading;
            } else if (ev.alpha !== null && ev.alpha !== undefined) {
              h = (360 - ev.alpha) % 360;
            }
            if (h !== null && !isNaN(h)) {
              const screenAngle =
                window.screen?.orientation?.angle ||
                (typeof window.orientation === "number"
                  ? window.orientation
                  : 0);
              const adjusted = (h + screenAngle + 360) % 360;
              sendHeadingToMap(adjusted);
            }
          };

          if ("ondeviceorientationabsolute" in window) {
            window.addEventListener(
              "deviceorientationabsolute",
              webOrientationHandler,
              false,
            );
          } else if ("ondeviceorientation" in window) {
            window.addEventListener(
              "deviceorientation",
              webOrientationHandler,
              false,
            );
          }

          const requestIosPermission = async () => {
            if (
              typeof DeviceOrientationEvent !== "undefined" &&
              typeof DeviceOrientationEvent.requestPermission === "function"
            ) {
              try {
                const resp = await DeviceOrientationEvent.requestPermission();
                if (resp === "granted" && webOrientationHandler) {
                  window.addEventListener(
                    "deviceorientation",
                    webOrientationHandler,
                    false,
                  );
                }
              } catch (_) {}
            }
            window.removeEventListener("click", requestIosPermission);
            window.removeEventListener("touchend", requestIosPermission);
          };
          window.addEventListener("click", requestIosPermission, {
            once: true,
          });
          window.addEventListener("touchend", requestIosPermission, {
            once: true,
          });
        }
      } catch (err) {
        console.warn("Heading watch initialization error in RideTracker:", err);
      }
    };

    startHeadingWatcher();

    return () => {
      isMounted = false;
      if (
        headingSubRef.current &&
        typeof headingSubRef.current.remove === "function"
      ) {
        headingSubRef.current.remove();
        headingSubRef.current = null;
      }
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        webOrientationHandler
      ) {
        window.removeEventListener(
          "deviceorientationabsolute",
          webOrientationHandler,
        );
        window.removeEventListener(
          "deviceorientation",
          webOrientationHandler,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (currentLocation?.lat != null && currentLocation?.lng != null) {
      pushLocationToMap(currentLocation);
    }
  }, [currentLocation?.lat, currentLocation?.lng]);

  // Generate Leaflet Map HTML
  const generateMapHtml = () => {
    const centerLat = startLocation?.lat ?? currentLocation?.lat ?? 16.0433;
    const centerLng = startLocation?.lng ?? currentLocation?.lng ?? 120.3342;
    const hasInitialLoc = Boolean(
      currentLocation?.lat != null && currentLocation?.lng != null,
    );

    const startLat = startLocation?.lat ?? null;
    const startLng = startLocation?.lng ?? null;
    const pathCoords =
      selectedRoute?.path &&
      Array.isArray(selectedRoute.path) &&
      selectedRoute.path.length > 0
        ? selectedRoute.path
        : selectedRoute?.waypoints &&
            Array.isArray(selectedRoute.waypoints) &&
            selectedRoute.waypoints.length > 0
          ? selectedRoute.waypoints
          : [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0f172a; }
          
          /* Directional Flashlight Beam for Live Commuter Location Marker */
          .origin-marker-wrap {
            position: relative;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }
          .light-beam-rotor {
            position: absolute;
            top: 0;
            left: 0;
            width: 80px;
            height: 80px;
            pointer-events: none;
            transform-origin: 40px 40px;
            transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .light-beam-cone {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            /* ~96-degree wide high-contrast blue/cyan flashlight beam */
            background: conic-gradient(
              from -48deg at 50% 50%,
              rgba(37, 99, 235, 0) 0deg,
              rgba(56, 189, 248, 0.35) 14deg,
              rgba(14, 165, 233, 0.82) 30deg,
              rgba(240, 249, 255, 0.98) 48deg,
              rgba(14, 165, 233, 0.82) 66deg,
              rgba(56, 189, 248, 0.35) 82deg,
              rgba(37, 99, 235, 0) 96deg,
              transparent 96deg,
              transparent 360deg
            );
            -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 28%, rgba(0,0,0,0) 60%);
            mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 28%, rgba(0,0,0,0) 60%);
            filter: drop-shadow(0 0 6px rgba(14, 165, 233, 0.9)) drop-shadow(0 0 1.5px rgba(2, 132, 199, 0.65));
            animation: googleBeamPulse 2.8s infinite ease-in-out;
          }
          @keyframes googleBeamPulse {
            0%, 100% { opacity: 0.92; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.03); }
          }
          .commuter-puck-beacon {
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .commuter-puck-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.4);
            animation: googleRadar 2.2s infinite ease-out;
          }
          .commuter-puck-core {
            position: relative;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #2563EB;
            border: 2px solid #ffffff;
            box-shadow: 0 1px 5px rgba(0,0,0,0.35);
          }
          @keyframes googleRadar {
            0% { transform: scale(0.65); opacity: 0.95; }
            100% { transform: scale(2.0); opacity: 0; }
          }

          .boarding-pin {
            background: #16A34A; color: white; width: 26px; height: 26px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 13px;
            font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          }

          /* Small but highly noticeable 📍 pinpoint icon */
          .dest-pin-compact {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #EF4444;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(239, 68, 68, 0.35);
            cursor: grab;
            transition: transform 0.15s ease;
            animation: pinPulse 2.2s infinite ease-in-out;
          }
          .dest-pin-compact:active {
            cursor: grabbing;
            transform: scale(1.2);
          }
          @keyframes pinPulse {
            0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 0 3px rgba(239, 68, 68, 0.35); }
            50% { box-shadow: 0 2px 10px rgba(0,0,0,0.65), 0 0 0 6px rgba(239, 68, 68, 0.15); }
          }

          .map-hint-pill {
            position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.88); color: #fff; padding: 5px 12px;
            border-radius: 20px; font-size: 11px; font-family: sans-serif; font-weight: 600;
            z-index: 1000; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transition: background 0.25s ease;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-hint-pill" id="map-hint">📍 Tap on route to pinpoint destination</div>
        <script>
          function postToApp(data) {
            var str = JSON.stringify(data);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(str);
            } else if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(str, '*');
            }
          }

          function calculateDistanceKm(lat1, lon1, lat2, lon2) {
            var R = 6371;
            var dLat = ((lat2 - lat1) * Math.PI) / 180;
            var dLon = ((lon2 - lon1) * Math.PI) / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
          }

          var map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([${centerLat}, ${centerLng}], 15);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          window.addEventListener('wheel', function(e) {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
              }
            } catch(err) {}
          }, { passive: true });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          // Route Polyline
          var rawPath = ${JSON.stringify(pathCoords)};
          var path = rawPath.map(function(p) {
            return Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng];
          });
          if (path.length > 0) {
            var poly = L.polyline(path, {
              color: '#3B82F6',
              weight: 6,
              opacity: 0.90,
              lineJoin: 'round',
              lineCap: 'round'
            }).addTo(map);

            poly.on('click', function(e) {
              var lat = e.latlng.lat;
              var lng = e.latlng.lng;
              var snapped = getClosestPointOnRoute(lat, lng);
              updateDestinationPin(snapped.lat, snapped.lng, 'Pinpointed Destination');
              postToApp({ type: 'PINPOINT_DESTINATION', lat: snapped.lat, lng: snapped.lng, name: 'Pinpointed Destination' });
            });
          }

          function calculateDistanceToRouteKm(ptLat, ptLng) {
            if (!path || path.length === 0) return Infinity;
            var minDist = Infinity;
            var numPoints = path.length;
            for (var i = 0; i < numPoints; i++) {
              var p1 = path[i];
              var lat1 = p1[0];
              var lng1 = p1[1];
              var dVertex = calculateDistanceKm(ptLat, ptLng, lat1, lng1);
              if (dVertex < minDist) minDist = dVertex;

              if (i < numPoints - 1) {
                var p2 = path[i + 1];
                var lat2 = p2[0];
                var lng2 = p2[1];
                var cosMeanLat = Math.cos(((lat1 + lat2) * Math.PI) / 360);
                var dx = (lng2 - lng1) * cosMeanLat;
                var dy = lat2 - lat1;
                var segLenSq = dx * dx + dy * dy;
                if (segLenSq > 1e-12) {
                  var px = (ptLng - lng1) * cosMeanLat;
                  var py = ptLat - lat1;
                  var t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
                  var projLat = lat1 + t * (lat2 - lat1);
                  var projLng = lng1 + t * (lng2 - lng1);
                  var dSeg = calculateDistanceKm(ptLat, ptLng, projLat, projLng);
                  if (dSeg < minDist) minDist = dSeg;
                }
              }
            }
            return minDist;
          }

          function getClosestPointOnRoute(ptLat, ptLng) {
            if (!path || path.length === 0) return { lat: ptLat, lng: ptLng };
            var minDist = Infinity;
            var bestPt = { lat: ptLat, lng: ptLng };
            var numPoints = path.length;
            for (var i = 0; i < numPoints; i++) {
              var p1 = path[i];
              var lat1 = p1[0];
              var lng1 = p1[1];
              var dVertex = calculateDistanceKm(ptLat, ptLng, lat1, lng1);
              if (dVertex < minDist) {
                minDist = dVertex;
                bestPt = { lat: lat1, lng: lng1 };
              }

              if (i < numPoints - 1) {
                var p2 = path[i + 1];
                var lat2 = p2[0];
                var lng2 = p2[1];
                var cosMeanLat = Math.cos(((lat1 + lat2) * Math.PI) / 360);
                var dx = (lng2 - lng1) * cosMeanLat;
                var dy = lat2 - lat1;
                var segLenSq = dx * dx + dy * dy;
                if (segLenSq > 1e-12) {
                  var px = (ptLng - lng1) * cosMeanLat;
                  var py = ptLat - lat1;
                  var t = Math.max(0, Math.min(1, (px * dx + py * dy) / segLenSq));
                  var projLat = lat1 + t * (lat2 - lat1);
                  var projLng = lng1 + t * (lng2 - lng1);
                  var dSeg = calculateDistanceKm(ptLat, ptLng, projLat, projLng);
                  if (dSeg < minDist) {
                    minDist = dSeg;
                    bestPt = { lat: projLat, lng: projLng };
                  }
                }
              }
            }
            return bestPt;
          }

          function isPointWithinRouteCorridor(ptLat, ptLng, thresholdKm) {
            if (!path || path.length === 0) return false;
            var thresh = thresholdKm || 0.15;
            return calculateDistanceToRouteKm(ptLat, ptLng) <= thresh;
          }

          // Boarding Pin
          var startLat = ${startLat !== null ? startLat : "null"};
          var startLng = ${startLng !== null ? startLng : "null"};
          if (startLat !== null && startLng !== null) {
            var boardIcon = L.divIcon({
              className: '',
              html: '<div class="boarding-pin">🚏</div>',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });
            L.marker([startLat, startLng], { icon: boardIcon }).addTo(map)
              .bindPopup('<b>Boarding Location</b><br/>Ride started here');
          }

          // Live Commuter Marker with Directional Compass Flashlight
          var commuterIcon = L.divIcon({
            className: '',
            html:
              '<div class="origin-marker-wrap">' +
                '<div class="light-beam-rotor" id="directional-light" style="transform: rotate(0deg);">' +
                  '<div class="light-beam-cone"></div>' +
                '</div>' +
                '<div class="commuter-puck-beacon">' +
                  '<div class="commuter-puck-pulse"></div>' +
                  '<div class="commuter-puck-core"></div>' +
                '</div>' +
              '</div>',
            iconSize: [80, 80],
            iconAnchor: [40, 40]
          });

          var commuterMarker = null;
          var hasInitial = ${hasInitialLoc ? "true" : "false"};
          if (hasInitial) {
            commuterMarker = L.marker([${centerLat}, ${centerLng}], { icon: commuterIcon }).addTo(map);
            commuterMarker.bindPopup('<b>Your Live Position</b><br/>Tracking ride...');
          }

          // Flashlight rotation
          var currentBeamAngle = 0;
          window.updateHeading = function(newHeading) {
            if (typeof newHeading !== 'number' || isNaN(newHeading)) return;
            var beamEl = document.getElementById('directional-light');
            if (!beamEl) return;
            var target = (newHeading % 360 + 360) % 360;
            var diff = (target - (currentBeamAngle % 360) + 540) % 360 - 180;
            currentBeamAngle += diff;
            beamEl.style.transform = 'rotate(' + currentBeamAngle + 'deg)';
          };

          // Small noticeable 📍 Pinpointed Destination Marker (NO dashed line)
          var destMarker = null;
          var currentDestName = '';
          var destIcon = L.divIcon({
            className: '',
            html: '<div class="dest-pin-compact">📍</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          function updateDestinationPin(lat, lng, name) {
            if (lat == null || lng == null) return;
            currentDestName = name || 'Drop-Off Point';
            var popupContent = '<b>📍 Destination</b><br/>' + currentDestName + '<br/><small style="color:#16A34A;font-weight:bold;">Exact fare calculated below</small>';
            if (!destMarker) {
              destMarker = L.marker([lat, lng], { icon: destIcon, draggable: true }).addTo(map);
              destMarker.on('dragend', function() {
                var p = destMarker.getLatLng();
                if (!isPointWithinRouteCorridor(p.lat, p.lng, 0.15)) {
                  clearDestinationPin();
                  var hintEl = document.getElementById('map-hint');
                  if (hintEl) {
                    hintEl.innerHTML = '⚠️ Your destination is not within the route';
                    hintEl.style.background = 'rgba(220, 38, 38, 0.95)';
                    setTimeout(function() {
                      if (hintEl) {
                        hintEl.innerHTML = '📍 Tap on route to pinpoint destination';
                        hintEl.style.background = 'rgba(15, 23, 42, 0.88)';
                      }
                    }, 3500);
                  }
                  postToApp({ type: 'PINPOINT_OUTSIDE_ROUTE', lat: p.lat, lng: p.lng });
                  return;
                }
                var snapped = getClosestPointOnRoute(p.lat, p.lng);
                updateDestinationPin(snapped.lat, snapped.lng, currentDestName);
                postToApp({ type: 'PINPOINT_DESTINATION', lat: snapped.lat, lng: snapped.lng, name: currentDestName });
              });
            } else {
              destMarker.setLatLng([lat, lng]);
            }
            destMarker.bindPopup(popupContent).openPopup();

            var hintEl = document.getElementById('map-hint');
            if (hintEl) {
              hintEl.innerHTML = '📍 Destination: ' + currentDestName;
              hintEl.style.background = 'rgba(15, 23, 42, 0.88)';
            }
          }

          function clearDestinationPin() {
            if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
            var hintEl = document.getElementById('map-hint');
            if (hintEl) {
              hintEl.innerHTML = '📍 Tap on route to pinpoint destination';
              hintEl.style.background = 'rgba(15, 23, 42, 0.88)';
            }
          }

          map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            if (!isPointWithinRouteCorridor(lat, lng, 0.15)) {
              var hintEl = document.getElementById('map-hint');
              if (hintEl) {
                hintEl.innerHTML = '⚠️ Your destination is not within the route';
                hintEl.style.background = 'rgba(220, 38, 38, 0.95)';
                setTimeout(function() {
                  if (hintEl) {
                    hintEl.innerHTML = destMarker ? ('📍 Destination: ' + (currentDestName || 'Drop-Off')) : '📍 Tap on route to pinpoint destination';
                    hintEl.style.background = 'rgba(15, 23, 42, 0.88)';
                  }
                }, 3500);
              }
              postToApp({ type: 'PINPOINT_OUTSIDE_ROUTE', lat: lat, lng: lng });
              return;
            }
            var snapped = getClosestPointOnRoute(lat, lng);
            updateDestinationPin(snapped.lat, snapped.lng, 'Pinpointed Destination');
            postToApp({ type: 'PINPOINT_DESTINATION', lat: snapped.lat, lng: snapped.lng, name: 'Pinpointed Destination' });
          });

          window.setDestinationFromApp = function(lat, lng, name) {
            updateDestinationPin(lat, lng, name);
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          };

          window.clearDestinationFromApp = function() {
            clearDestinationPin();
          };

          window.updateCommuterLocation = function(lat, lng, accuracy, heading) {
            if (lat == null || lng == null) return;
            if (!commuterMarker) {
              commuterMarker = L.marker([lat, lng], { icon: commuterIcon }).addTo(map);
              commuterMarker.bindPopup('<b>Your Live Position</b><br/>Tracking ride...');
            } else {
              commuterMarker.setLatLng([lat, lng]);
            }
            if (typeof heading === 'number' && !isNaN(heading)) {
              window.updateHeading(heading);
            }
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          };

          window.addEventListener('message', function(e) {
            try {
              var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (d && (d.type === 'UPDATE_COMMUTER_LOCATION' || d.type === 'UPDATE_USER_LOCATION')) {
                window.updateCommuterLocation(d.lat, d.lng, d.accuracy, d.heading);
              } else if (d && d.type === 'UPDATE_HEADING') {
                window.updateHeading(d.heading);
              } else if (d && d.type === 'SET_DESTINATION') {
                window.setDestinationFromApp(d.lat, d.lng, d.name);
              } else if (d && d.type === 'CLEAR_DESTINATION') {
                window.clearDestinationFromApp();
              }
            } catch(err) {}
          });
        </script>
      </body>
      </html>
    `;
  };

  const mapHtml = useMemo(() => {
    return generateMapHtml();
  }, [selectedRoute?._id, startLocation?.lat, startLocation?.lng]);
  if (loading) {
    return <LoadingSpinner text="Preparing Live Ride Tracker..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="steering" size={26} color="#EA580C" />
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Live Ride Tracker
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {activeTab === "pinpoint"
                ? "Road-Aligned Route & Fair Fare"
                : activeTab === "history"
                  ? "Your Past Trips & LTFRB Receipts"
                  : rideState === "riding"
                    ? "🟢 Active Ride in Progress"
                    : rideState === "completed"
                      ? "🏁 Ride Completed"
                      : "Dagupan LTFRB Live Meter"}
            </Text>
          </View>
        </View>

        {activeTab === "history" && rideHistory.length > 0 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.error + "18" }]}
            onPress={handleClearHistory}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={colors.error}
            />
            <Text style={[styles.clearBtnText, { color: colors.error }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Switcher */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "tracker" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab("tracker")}
        >
          <MaterialCommunityIcons
            name="map-marker-path"
            size={18}
            color={
              activeTab === "tracker" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "tracker"
                    ? colors.primary
                    : colors.textSecondary,
              },
              activeTab === "tracker" && { fontWeight: "700" },
            ]}
          >
            Live Jeepney Tracker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "history" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => {
            setActiveTab("history");
            loadHistory();
          }}
        >
          <MaterialCommunityIcons
            name="history"
            size={18}
            color={
              activeTab === "history" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "history"
                    ? colors.primary
                    : colors.textSecondary,
              },
              activeTab === "history" && { fontWeight: "700" },
            ]}
          >
            Ride History{" "}
            {rideHistory.length > 0 ? `(${rideHistory.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: LIVE TRACKER VIEW */}
      {activeTab === "tracker" && (
        <ScrollView
          style={styles.trackerScroll}
          contentContainerStyle={[
            styles.trackerScrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {/* Map View Area */}
          <View style={[styles.mapArea, { height: mapHeight }]}>
            {Platform.OS === "web" ? (
              <iframe
                ref={iframeRef}
                id="ride-tracker-leaflet-map"
                key={`ride-map-${selectedRoute?._id || "none"}-${startLocation ? "riding" : "idle"}`}
                title="Live Ride Map"
                srcDoc={mapHtml}
                allow="geolocation; accelerometer; gyroscope; magnetometer"
                onLoad={() => {
                  pushLocationToMap(currentLocation);
                  if (destination) sendDestinationToMap(destination);
                  if (typeof currentHeadingRef.current === "number") {
                    sendHeadingToMap(currentHeadingRef.current);
                  }
                }}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <WebView
                ref={webViewRef}
                key={`ride-webview-${selectedRoute?._id || "none"}-${startLocation ? "riding" : "idle"}`}
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                onLoadEnd={() => {
                  pushLocationToMap(currentLocation);
                  if (destination) sendDestinationToMap(destination);
                  if (typeof currentHeadingRef.current === "number") {
                    sendHeadingToMap(currentHeadingRef.current);
                  }
                }}
                onMessage={(e) => {
                  try {
                    const data = JSON.parse(e.nativeEvent.data);
                    handleMapEvent(data);
                  } catch (_) {}
                }}
                style={{ flex: 1, backgroundColor: "#0f172a" }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}

            {/* Live HUD Overlay when riding */}
            {rideState === "riding" && (
              <View style={styles.hudOverlay}>
                <View style={styles.hudMainRow}>
                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>LIVE FARE</Text>
                    <Text style={styles.hudFareText}>
                      {formatPeso(liveFareData.finalFare)}
                    </Text>
                  </View>

                  <View style={styles.hudDivider} />

                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>DISTANCE</Text>
                    <Text style={styles.hudValueText}>
                      {distanceTraveledKm.toFixed(2)} km
                    </Text>
                  </View>

                  <View style={styles.hudDivider} />

                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>ELAPSED</Text>
                    <Text style={styles.hudValueText}>
                      {formatTime(elapsedSeconds)}
                    </Text>
                  </View>
                </View>

                <View style={styles.hudSubRow}>
                  <Text style={styles.hudSubText}>
                    {liveFareData.isBase
                      ? `Base fare covers first ${liveFareData.baseDistanceKm || 4}.0 km (${Math.max(0, (liveFareData.baseDistanceKm || 4) - distanceTraveledKm).toFixed(2)} km left in base)`
                      : `+${formatPeso(liveFareData.perKmRate)}/km beyond ${liveFareData.baseDistanceKm || 4}.0 km`}
                  </Text>
                  {discount === "discounted" && (
                    <Text style={styles.hudDiscountTag}>
                      20% Discount Applied
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 10,
              gap: 8,
              backgroundColor: colors.surface,
            }}
          >
            <MaterialCommunityIcons
              name={gpsReady ? "crosshairs-gps" : "crosshairs-off"}
              size={20}
              color={gpsReady ? "#16A34A" : "#DC2626"}
            />

            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                {gpsReady ? "GPS Location Acquired" : "Waiting for GPS"}
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {gpsReady
                  ? `Accuracy: approximately ${Math.round(currentLocation.accuracy ?? 0)} meters`
                  : gpsError || "Please allow location access."}
              </Text>
            </View>
          </View>

          {/* Controls Panel */}
          <View
            style={[
              styles.bottomPanel,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                maxWidth: isTablet ? 780 : "100%",
                alignSelf: "center",
                width: "100%",
              },
            ]}
          >
            <View style={styles.bottomPanelInner}>
              {/* STATE: IDLE (Choose route, vehicle, discount, then Start) */}
              {rideState === "idle" && (
                <>
                  {/* 1. JEEPNEY ROUTE DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text
                      style={[
                        styles.controlLabel,
                        { color: colors.textPrimary },
                      ]}
                    >
                      1. What Jeepney Did You Board?
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor:
                            openDropdown === "route"
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() =>
                        setOpenDropdown((prev) =>
                          prev === "route" ? null : "route",
                        )
                      }
                    >
                      <View
                        style={[
                          styles.dropdownIconBadge,
                          { backgroundColor: colors.primary + "18" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="van-passenger"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text
                          style={[
                            styles.dropdownSelectedTitle,
                            { color: colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {selectedRoute
                            ? selectedRoute.name
                            : "Select a Jeepney Route..."}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownSelectedSubtitle,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {selectedRoute
                            ? selectedRoute.corridor ||
                              `~${selectedRoute.distanceKm} km loop (Downtown)`
                            : "Tap to choose jeepney"}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          openDropdown === "route"
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === "route" && (
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <ScrollView
                          style={styles.dropdownScroll}
                          nestedScrollEnabled={true}
                        >
                          {routes.map((r) => {
                            const isSel = selectedRoute?._id === r._id;
                            return (
                              <TouchableOpacity
                                key={r._id}
                                style={[
                                  styles.dropdownItem,
                                  isSel && {
                                    backgroundColor: colors.primary + "14",
                                  },
                                ]}
                                onPress={() => {
                                  setSelectedRoute(r);
                                  setOpenDropdown(null);
                                }}
                              >
                                <View
                                  style={[
                                    styles.itemDot,
                                    {
                                      backgroundColor: isSel
                                        ? colors.primary
                                        : "#94A3B8",
                                    },
                                  ]}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      styles.dropdownItemTitle,
                                      {
                                        color: isSel
                                          ? colors.primary
                                          : colors.textPrimary,
                                        fontWeight: isSel ? "700" : "600",
                                      },
                                    ]}
                                  >
                                    {r.name}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.dropdownItemSub,
                                      { color: colors.textMuted },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {r.corridor || `~${r.distanceKm} km loop`}
                                  </Text>
                                </View>
                                {isSel && (
                                  <MaterialCommunityIcons
                                    name="check-circle"
                                    size={18}
                                    color={colors.primary}
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <View
                          style={[
                            styles.dropdownNotice,
                            { borderTopColor: colors.border },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="information"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.dropdownNoticeText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            All jeepneys can be seen and boarded in Downtown
                            Dagupan.
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 2. VEHICLE TYPE DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text
                      style={[
                        styles.controlLabel,
                        { color: colors.textPrimary },
                      ]}
                    >
                      2. Vehicle Type
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor:
                            openDropdown === "vehicle"
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() =>
                        setOpenDropdown((prev) =>
                          prev === "vehicle" ? null : "vehicle",
                        )
                      }
                    >
                      <View
                        style={[
                          styles.dropdownIconBadge,
                          { backgroundColor: colors.primary + "18" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            vehicleType === "traditional"
                              ? "van-utility"
                              : "bus-side"
                          }
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text
                          style={[
                            styles.dropdownSelectedTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {vehicleType === "traditional"
                            ? "Traditional Jeepney"
                            : "Modern Jeepney"}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownSelectedSubtitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          {vehicleType === "traditional"
                            ? "Base: ₱14.00 (First 4.0 km) • +₱2.00/km"
                            : "Base: ₱17.00 (First 4.0 km) • +₱2.40/km"}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          openDropdown === "vehicle"
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === "vehicle" && (
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        {VEHICLE_TYPES.map((vt) => {
                          const isSel = vehicleType === vt.value;
                          return (
                            <TouchableOpacity
                              key={vt.value}
                              style={[
                                styles.dropdownItem,
                                isSel && {
                                  backgroundColor: colors.primary + "14",
                                },
                              ]}
                              onPress={() => {
                                setVehicleType(vt.value);
                                setOpenDropdown(null);
                              }}
                            >
                              <MaterialCommunityIcons
                                name={vt.icon}
                                size={20}
                                color={
                                  isSel ? colors.primary : colors.textSecondary
                                }
                                style={{ marginRight: 10 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.dropdownItemTitle,
                                    {
                                      color: isSel
                                        ? colors.primary
                                        : colors.textPrimary,
                                      fontWeight: isSel ? "700" : "600",
                                    },
                                  ]}
                                >
                                  {vt.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.dropdownItemSub,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {vt.value === "traditional"
                                    ? "Standard open-air jeepney • ₱14.00 base + ₱2.00/km"
                                    : "Air-conditioned modern PUV • ₱17.00 base + ₱2.40/km"}
                                </Text>
                              </View>
                              {isSel && (
                                <MaterialCommunityIcons
                                  name="check-circle"
                                  size={18}
                                  color={colors.primary}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* 3. FARE CATEGORY DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text
                      style={[
                        styles.controlLabel,
                        { color: colors.textPrimary },
                      ]}
                    >
                      3. Fare Category & Discounts
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor:
                            openDropdown === "discount"
                              ? colors.accent
                              : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() =>
                        setOpenDropdown((prev) =>
                          prev === "discount" ? null : "discount",
                        )
                      }
                    >
                      <View
                        style={[
                          styles.dropdownIconBadge,
                          { backgroundColor: colors.accent + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            discount === "discounted"
                              ? "account-heart"
                              : "account"
                          }
                          size={20}
                          color={colors.accent}
                        />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text
                          style={[
                            styles.dropdownSelectedTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {discount === "discounted"
                            ? "20% Mandated Discount"
                            : "Regular Passenger"}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownSelectedSubtitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          {discount === "discounted"
                            ? "Student, Senior Citizen, PWD (20% off)"
                            : "Standard statutory LTFRB tariff"}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          openDropdown === "discount"
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === "discount" && (
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        {DISCOUNT_TYPES.map((dt) => {
                          const isSel = discount === dt.value;
                          return (
                            <TouchableOpacity
                              key={dt.value}
                              style={[
                                styles.dropdownItem,
                                isSel && {
                                  backgroundColor: colors.accent + "14",
                                },
                              ]}
                              onPress={() => {
                                setDiscount(dt.value);
                                setOpenDropdown(null);
                              }}
                            >
                              <MaterialCommunityIcons
                                name={dt.icon}
                                size={20}
                                color={
                                  isSel ? colors.accent : colors.textSecondary
                                }
                                style={{ marginRight: 10 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.dropdownItemTitle,
                                    {
                                      color: isSel
                                        ? colors.accent
                                        : colors.textPrimary,
                                      fontWeight: isSel ? "700" : "600",
                                    },
                                  ]}
                                >
                                  {dt.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.dropdownItemSub,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {dt.value === "none"
                                    ? "Standard commuter fare (no discount)"
                                    : "Mandated 20% discount for Students, Seniors, & PWDs"}
                                </Text>
                              </View>
                              {isSel && (
                                <MaterialCommunityIcons
                                  name="check-circle"
                                  size={18}
                                  color={colors.accent}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Pre-ride Rate Info Banner */}
                  <View
                    style={[
                      styles.rateBanner,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.rateCol}>
                      <Text
                        style={[styles.rateLabel, { color: colors.textMuted }]}
                      >
                        BASE FARE (FIRST 4 KM)
                      </Text>
                      <Text
                        style={[styles.rateValue, { color: colors.primary }]}
                      >
                        {formatPeso(
                          vehicleType === "traditional"
                            ? discount === "discounted"
                              ? 12
                              : 14
                            : discount === "discounted"
                              ? 14
                              : 17,
                        )}
                      </Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text
                        style={[styles.rateLabel, { color: colors.textMuted }]}
                      >
                        SUCCEEDING PER KM
                      </Text>
                      <Text
                        style={[
                          styles.rateValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        +{formatPeso(vehicleType === "traditional" ? 2.0 : 2.4)}
                        /km
                      </Text>
                    </View>
                  </View>

                  {/* Guest Locked Notice */}
                  {isGuest && (
                    <TouchableOpacity
                      style={[
                        styles.guestLockBanner,
                        {
                          backgroundColor: colors.primary + "12",
                          borderColor: colors.primary + "35",
                        },
                      ]}
                      onPress={() => setAuthModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.guestLockBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-lock"
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.guestLockTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Account Required to Track Live Ride
                        </Text>
                        <Text
                          style={[
                            styles.guestLockText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Sign in or create a free account to activate live GPS
                          tracking and automated fare calculations.
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.guestLockAction,
                          { color: colors.primary },
                        ]}
                      >
                        Sign In →
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 4. PINPOINT DESTINATION & FARE TO DRIVER */}
                  <View style={styles.dropdownSection}>
                    <Text
                      style={[
                        styles.controlLabel,
                        { color: colors.textPrimary },
                      ]}
                    >
                      4. Pinpoint Drop-Off & Exact Fare
                    </Text>

                    {destination && destinationFareData ? (
                      <View
                        style={[
                          styles.destFareCard,
                          {
                            backgroundColor: colors.background,
                            borderColor: "#16A34A",
                          },
                        ]}
                      >
                        <View style={styles.destFareTopRow}>
                          <View
                            style={[
                              styles.destFareIconCircle,
                              { backgroundColor: "#16A34A18" },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="cash-multiple"
                              size={22}
                              color="#16A34A"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.destFareHeaderLabel,
                                { color: colors.textSecondary },
                              ]}
                            >
                              OFFICIAL FARE TO PAY DRIVER
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "baseline",
                                gap: 6,
                              }}
                            >
                              <Text
                                style={[
                                  styles.destFareBigPrice,
                                  { color: "#16A34A" },
                                ]}
                              >
                                {formatPeso(destinationFareData.fare)}
                              </Text>
                              {discount === "discounted" && (
                                <Text
                                  style={[
                                    styles.destFareDiscountTag,
                                    { color: colors.accent },
                                  ]}
                                >
                                  (20% Off Applied)
                                </Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.destClearBtn,
                              { backgroundColor: colors.border + "40" },
                            ]}
                            onPress={handleClearDestination}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name="close"
                              size={16}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.destClearBtnText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View
                          style={[
                            styles.destDivider,
                            { backgroundColor: colors.border },
                          ]}
                        />

                        <View style={styles.destMetaRow}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              flex: 1,
                            }}
                          >
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={18}
                              color="#EA580C"
                            />
                            <Text
                              style={[
                                styles.destTargetName,
                                { color: colors.textPrimary },
                              ]}
                              numberOfLines={1}
                            >
                              {destination.name || "Drop-Off Location"}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.destDistanceBadge,
                              { color: colors.textMuted },
                            ]}
                          >
                            ~{destinationFareData.distanceKm} km route distance • ~
                            {destinationFareData.estMinutes} mins
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.destFareNoticeBox,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.destFareNoticeText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {destinationFareData.isBase
                              ? `Covers up to first 4.0 km standard LTFRB base fare.`
                              : `Base ${formatPeso(destinationFareData.baseFare)} + ${destinationFareData.extraKm.toFixed(1)} km × ₱${destinationFareData.perKmRate}/km`}
                          </Text>
                          <Text style={styles.destHandCashText}>
                            💡 Hand exact {formatPeso(destinationFareData.fare)}{" "}
                            to your jeepney driver upon boarding.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.destPromptBox,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-radius"
                            size={20}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.destPromptTitle,
                              { color: colors.textPrimary },
                            ]}
                          >
                            Tap Route on Map to Pinpoint Drop-Off:
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.destPromptSub,
                            { color: colors.textMuted },
                          ]}
                        >
                          Tap anywhere directly along your chosen route on the map above to pinpoint your destination and compute the exact fare to hand the driver.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Big Start Ride Button */}
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.8}
                    onPress={handleStartRide}
                  >
                    <MaterialCommunityIcons
                      name="play-circle"
                      size={26}
                      color="#FFFFFF"
                    />
                    <Text style={styles.startBtnText}>
                      Start Ride & Track Live Fare
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STATE: RIDING (Live Status + End Ride) */}
              {rideState === "riding" && (
                <View style={styles.activeRideBox}>
                  <View style={styles.routeHeaderActive}>
                    <MaterialCommunityIcons
                      name="jeepney"
                      size={22}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.routeActiveName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {selectedRoute?.name || "Jeepney Ride"}
                    </Text>
                    <Text
                      style={[
                        styles.badgePill,
                        {
                          backgroundColor: colors.primary + "20",
                          color: colors.primary,
                        },
                      ]}
                    >
                      {vehicleType === "traditional" ? "Traditional" : "Modern"}
                    </Text>
                  </View>

                  {destination && destinationFareData && (
                    <View
                      style={[
                        styles.ridingDestCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: isNearDestination
                            ? "#16A34A"
                            : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.ridingDestTop}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={20}
                          color="#EA580C"
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text
                            style={[
                              styles.ridingDestLabel,
                              { color: colors.textMuted },
                            ]}
                          >
                            DESTINATION / DROP-OFF
                          </Text>
                          <Text
                            style={[
                              styles.ridingDestTitle,
                              { color: colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {destination.name}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={[
                              styles.ridingDestFareLabel,
                              { color: colors.textMuted },
                            ]}
                          >
                            FARE TO DRIVER
                          </Text>
                          <Text style={styles.ridingDestFareValue}>
                            {formatPeso(destinationFareData.fare)}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.ridingDestBanner,
                          {
                            backgroundColor: isNearDestination
                              ? "#16A34A18"
                              : colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ridingDestRemaining,
                            {
                              color: isNearDestination
                                ? "#16A34A"
                                : colors.textSecondary,
                              fontWeight: isNearDestination ? "700" : "500",
                            },
                          ]}
                        >
                          {isNearDestination
                            ? "🔔 Approaching your destination! Please prepare to alight."
                            : `~${remainingDistanceToDestKm !== null ? remainingDistanceToDestKm : destinationFareData.distanceKm} km route distance to drop-off`}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.activeHelpText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Your GPS position is updating in real-time. The fare ticker
                    above displays the exact LTFRB-compliant fare for your trip
                    distance.
                  </Text>

                  <TouchableOpacity
                    style={styles.endBtn}
                    activeOpacity={0.8}
                    onPress={confirmEndRide}
                  >
                    <MaterialCommunityIcons
                      name="stop-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.endBtnText}>End Ride / Drop Off</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STATE: COMPLETED (Ride Receipt & Summary) */}
              {rideState === "completed" && (
                <View style={styles.completedBox}>
                  <View style={styles.completedHeader}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={32}
                      color="#16A34A"
                    />
                    <Text
                      style={[
                        styles.completedTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      You've successfully arrived!
                    </Text>
                  </View>

                  {/* Emphasized Fare Card */}
                  <Card
                    style={[styles.fareReceiptCard, { borderColor: "#16A34A" }]}
                  >
                    <Text style={styles.receiptFareLabel}>
                      AMOUNT TO PAY DRIVER
                    </Text>
                    <Text style={styles.receiptFareBig}>
                      {formatPeso(liveFareData.finalFare)}
                    </Text>
                    {discount === "discounted" && (
                      <Text style={styles.receiptDiscountNote}>
                        Includes 20% Student / Senior / PWD Discount (Regular:{" "}
                        {formatPeso(liveFareData.regularFare)})
                      </Text>
                    )}
                  </Card>

                  {/* Metrics Table */}
                  <View
                    style={[
                      styles.metricsTable,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.metricRow}>
                      <Text
                        style={[
                          styles.metricRowLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Route:
                      </Text>
                      <Text
                        style={[
                          styles.metricRowValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {selectedRoute?.name}
                      </Text>
                    </View>
                    {destination && (
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricRowLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Destination:
                        </Text>
                        <Text
                          style={[
                            styles.metricRowValue,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          {destination.name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metricRow}>
                      <Text
                        style={[
                          styles.metricRowLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Vehicle Type:
                      </Text>
                      <Text
                        style={[
                          styles.metricRowValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {vehicleType === "traditional"
                          ? "🚐 Traditional Jeepney"
                          : "🚌 Modern PUJ"}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text
                        style={[
                          styles.metricRowLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Total Distance:
                      </Text>
                      <Text
                        style={[
                          styles.metricRowValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {distanceTraveledKm.toFixed(2)} km
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text
                        style={[
                          styles.metricRowLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Ride Duration:
                      </Text>
                      <Text
                        style={[
                          styles.metricRowValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {formatTime(elapsedSeconds)}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text
                        style={[
                          styles.metricRowLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Base Fare (First 4 km):
                      </Text>
                      <Text
                        style={[
                          styles.metricRowValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {formatPeso(liveFareData.baseFare)}
                      </Text>
                    </View>
                    {liveFareData.extraKm > 0 && (
                      <View style={styles.metricRow}>
                        <Text
                          style={[
                            styles.metricRowLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Extra Distance ({liveFareData.extraKm.toFixed(2)} km @{" "}
                          {formatPeso(liveFareData.perKmRate)}/km):
                        </Text>
                        <Text
                          style={[
                            styles.metricRowValue,
                            { color: colors.textPrimary },
                          ]}
                        >
                          +
                          {formatPeso(
                            liveFareData.extraKm * liveFareData.perKmRate,
                          )}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.newRideBtn}
                    activeOpacity={0.8}
                    onPress={handleResetRide}
                  >
                    <MaterialCommunityIcons
                      name="refresh"
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.newRideBtnText}>
                      Start Another Ride
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* TAB 2: RIDE HISTORY VIEW */}
      {activeTab === "history" && (
        <ScrollView
          contentContainerStyle={styles.historyScroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active Ride Banner if riding in background */}
          {rideState === "riding" && (
            <TouchableOpacity
              style={[styles.activeRideBanner, { backgroundColor: "#EA580C" }]}
              onPress={() => setActiveTab("tracker")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="steering"
                size={24}
                color="#FFFFFF"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeRideBannerTitle}>
                  Active Ride in Progress
                </Text>
                <Text style={styles.activeRideBannerSubtitle}>
                  {formatPeso(liveFareData.finalFare)} •{" "}
                  {distanceTraveledKm.toFixed(2)} km • Tap to view map
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}

          {/* Lifetime Summary Stats Card */}
          <View
            style={[
              styles.statsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {rideHistory.length}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                Total Rides
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: "#2563EB" }]}>
                {rideHistory
                  .reduce((acc, r) => acc + (r.distanceKm || 0), 0)
                  .toFixed(1)}{" "}
                km
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                Distance
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: "#16A34A" }]}>
                {formatPeso(
                  rideHistory.reduce((acc, r) => acc + (r.fare || 0), 0),
                )}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                Fares Paid
              </Text>
            </View>
          </View>

          {/* Empty State or Trip Cards */}
          {rideHistory.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={44}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Past Rides Yet
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Start and complete a trip using the Live Ride Tracker to view
                your travel logs and fare receipts here.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab("tracker")}
              >
                <MaterialCommunityIcons
                  name="play-circle"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.emptyBtnText}>Start a Ride Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tripList}>
              <Text
                style={[
                  styles.listHeaderTitle,
                  { color: colors.textSecondary },
                ]}
              >
                COMPLETED TRIPS ({rideHistory.length})
              </Text>

              {rideHistory.map((ride, idx) => {
                const dateObj = new Date(ride.timestamp);
                const dateFormatted = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) +
                    " • " +
                    dateObj.toLocaleTimeString("en-PH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Recent Trip";

                const isModern = ride.vehicleType === "modern";

                return (
                  <Card key={ride.id || idx} style={styles.tripCard}>
                    <View style={styles.tripCardTop}>
                      <View style={styles.tripCardLeft}>
                        <View
                          style={[
                            styles.vehiclePill,
                            {
                              backgroundColor: isModern ? "#DBEAFE" : "#FEF3C7",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isModern ? "bus" : "jeepney"}
                            size={14}
                            color={isModern ? "#2563EB" : "#D97706"}
                          />
                          <Text
                            style={[
                              styles.vehiclePillText,
                              { color: isModern ? "#1D4ED8" : "#B45309" },
                            ]}
                          >
                            {isModern ? "Modern PUJ" : "Traditional"}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.tripRouteName,
                            { color: colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {ride.routeName || "Dagupan Loop"}
                        </Text>
                      </View>
                      <Text style={styles.tripFareBig}>
                        {formatPeso(ride.fare)}
                      </Text>
                    </View>

                    <View style={styles.tripMetaRow}>
                      <View style={styles.tripMetaItem}>
                        <MaterialCommunityIcons
                          name="map-marker-distance"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.tripMetaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {(ride.distanceKm || 0).toFixed(2)} km
                        </Text>
                      </View>

                      <View style={styles.tripMetaItem}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.tripMetaText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatTime(ride.durationSecs || 0)}
                        </Text>
                      </View>

                      {(ride.discount === "discounted" ||
                        ride.isDiscounted) && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>
                            20% Discount
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.tripCardBottom,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tripDateText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {dateFormatted}
                      </Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
      <AuthPromptModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        title="Sign In to Start Ride Tracking"
        message="Live GPS tracking, real-time fare calculations, and trip history require a commuter account. Please sign in or create an account if you don't have one."
        icon="steering"
        featureTag="Live Ride Tracker"
      />
      <ConfirmDialogModal
        visible={confirmModalConfig.visible}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, visible: false }))
        }
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        type={confirmModalConfig.type}
        icon={confirmModalConfig.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  guestLockBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  guestLockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  guestLockTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 2,
  },
  guestLockText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 16,
  },
  guestLockAction: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
  },
  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  simBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  mapArea: {
    width: "100%",
    minHeight: 220,
    position: "relative",
  },
  hudOverlay: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  hudMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  hudMetric: {
    alignItems: "center",
  },
  hudLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hudFareText: {
    color: "#10B981",
    fontSize: 24,
    fontWeight: "800",
  },
  hudValueText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
  },
  hudDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#334155",
  },
  hudSubRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudSubText: {
    color: "#94A3B8",
    fontSize: 11,
    flex: 1,
  },
  hudDiscountTag: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trackerScroll: {
    flex: 1,
  },
  trackerScrollContent: {
    flexGrow: 1,
  },
  bottomPanel: {
    borderTopWidth: 1,
  },
  bottomPanelInner: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  bottomScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  controlLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  dropdownSection: {
    marginBottom: SPACING.md,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 3,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  dropdownIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  dropdownTextCol: {
    flex: 1,
  },
  dropdownSelectedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  dropdownSelectedSubtitle: {
    fontSize: FONTS.sizes.xs - 1,
    marginTop: 2,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 190,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dropdownItemTitle: {
    fontSize: FONTS.sizes.sm,
  },
  dropdownItemSub: {
    fontSize: FONTS.sizes.xs - 1,
    marginTop: 2,
  },
  dropdownNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    backgroundColor: "rgba(37, 99, 235, 0.05)",
  },
  dropdownNoticeText: {
    fontSize: FONTS.sizes.xs - 1,
    fontWeight: "600",
    flex: 1,
  },
  rateBanner: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  rateCol: {
    alignItems: "center",
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 50,
    borderRadius: RADIUS.lg,
    shadowColor: "#16A34A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  activeRideBox: {
    paddingVertical: SPACING.sm,
  },
  routeHeaderActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  routeActiveName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  badgePill: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: 6,
  },
  activeHelpText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  endBtn: {
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 50,
    borderRadius: RADIUS.lg,
    shadowColor: "#DC2626",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  endBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  completedBox: {
    paddingVertical: SPACING.xs,
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  completedTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  fareReceiptCard: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    backgroundColor: "rgba(22, 163, 74, 0.05)",
  },
  receiptFareLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.8,
  },
  receiptFareBig: {
    fontSize: 40,
    fontWeight: "900",
    color: "#16A34A",
    marginVertical: 4,
  },
  receiptDiscountNote: {
    fontSize: FONTS.sizes.xs,
    color: "#F59E0B",
    fontWeight: "600",
  },
  metricsTable: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 8,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricRowLabel: {
    fontSize: FONTS.sizes.xs,
  },
  metricRowValue: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  newRideBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    minHeight: 50,
    borderRadius: RADIUS.lg,
  },
  newRideBtnText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  historyScroll: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  activeRideBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: "#EA580C",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activeRideBannerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  activeRideBannerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  statCol: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLbl: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  emptyBox: {
    padding: SPACING.xxl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  tripList: {
    gap: SPACING.sm,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  tripCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 2,
  },
  tripCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  vehiclePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  vehiclePillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tripRouteName: {
    fontSize: 14,
    fontWeight: "700",
  },
  tripFareBig: {
    fontSize: 22,
    fontWeight: "900",
    color: "#16A34A",
  },
  tripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
  tripMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tripMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  discountBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  tripCardBottom: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tripDateText: {
    fontSize: 11,
  },
  destFareCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginTop: 4,
  },
  destFareTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  destFareIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  destFareHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  destFareBigPrice: {
    fontSize: 24,
    fontWeight: "900",
  },
  destFareDiscountTag: {
    fontSize: 11,
    fontWeight: "700",
  },
  destClearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  destClearBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  destDivider: {
    height: 1,
    marginVertical: 10,
  },
  destMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  destTargetName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  destDistanceBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  destFareNoticeBox: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  destFareNoticeText: {
    fontSize: 11,
    marginBottom: 4,
  },
  destHandCashText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#16A34A",
  },
  destPromptBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: 4,
  },
  destPromptTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  destPromptSub: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 16,
    marginBottom: 8,
  },

  ridingDestCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ridingDestTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  ridingDestLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ridingDestTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  ridingDestFareLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ridingDestFareValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#16A34A",
  },
  ridingDestBanner: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  ridingDestRemaining: {
    fontSize: 11.5,
  },
});

export default RideTrackerScreen;
