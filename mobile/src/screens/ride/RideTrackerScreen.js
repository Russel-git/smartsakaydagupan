import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { routesAPI } from '../../api/services';
import { Card, LoadingSpinner } from '../../components/common/SharedComponents';
import AuthPromptModal from '../../components/common/AuthPromptModal';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import { FONTS, SPACING, RADIUS, VEHICLE_TYPES, DISCOUNT_TYPES } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';
import { getRideHistory, saveRideToHistory, clearRideHistory } from '../../utils/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const RideTrackerScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { isGuest } = useAuth();
  const { showSuccess, showInfo, showWarning } = useFeedback();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    icon: null,
    onConfirm: () => {},
  });
  const webViewRef = useRef(null);

  // View Tab: 'tracker' | 'history'
  const [activeTab, setActiveTab] = useState('tracker');
  const [rideHistory, setRideHistory] = useState([]);

  // Data & Selection state
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicleType, setVehicleType] = useState('traditional');
  const [discount, setDiscount] = useState('none');
  const [openDropdown, setOpenDropdown] = useState(null); // 'route' | 'vehicle' | 'discount' | null

  // Ride State: 'idle' | 'riding' | 'completed'
  const [rideState, setRideState] = useState('idle');

  // Commuter Position & Real-time Metrics
  const [currentLocation, setCurrentLocation] = useState({
    lat: 16.0433,
    lng: 120.3342,
    accuracy: null,
  });
  const [startLocation, setStartLocation] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [distanceTraveledKm, setDistanceTraveledKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);

  // References for live subscriptions & timers
  const lastLocationRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const watchSubscriptionRef = useRef(null);

  const loadHistory = async () => {
    const data = await getRideHistory();
    setRideHistory(data || []);
  };

  // Load active routes & ride history
  useEffect(() => {
    loadHistory();
    const fetchRoutes = async () => {
      try {
        const { data } = await routesAPI.getAllRoutes();
        const routeList = Array.isArray(data.data) ? data.data : [];
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRoute(routeList[0]);
        }
      } catch (err) {
        console.warn('Failed to load routes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Initialize GPS on load
  useEffect(() => {
    let isMounted = true;

    const initGps = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return;
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              };
              setCurrentLocation(coords);
              lastLocationRef.current = coords;
              setGpsReady(true);
            },
            (err) => {
              console.warn('Web GPS unavailable, using Dagupan Center:', err);
              setGpsReady(true);
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            if (!isMounted) return;
            const coords = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            };
            setCurrentLocation(coords);
            lastLocationRef.current = coords;
            setGpsReady(true);
          }
        }
      } catch (e) {
        console.warn('Error acquiring GPS:', e);
      }
    };

    initGps();

    return () => {
      isMounted = false;
      stopTracking();
    };
  }, []);

  // Compute live LTFRB fare
  const computeLiveFare = (distanceKm) => {
    let baseFare = 14;
    let baseDistanceKm = 4;
    let perKmRate = 2.0;

    if (vehicleType === 'traditional') {
      baseFare = 14;
      baseDistanceKm = 4;
      perKmRate = 2.0;
    } else if (vehicleType === 'modern') {
      baseFare = 17;
      baseDistanceKm = 4;
      perKmRate = 2.4;
    } else if (vehicleType === 'tricycle') {
      baseFare = 15;
      baseDistanceKm = 1;
      perKmRate = 3.0;
    }

    let subtotal;
    if (distanceKm <= baseDistanceKm) {
      subtotal = baseFare;
    } else {
      subtotal = baseFare + (distanceKm - baseDistanceKm) * perKmRate;
    }

    const discountRate = discount === 'discounted' ? 0.2 : 0;
    const finalFare = discountRate > 0 ? Math.ceil(subtotal * (1 - discountRate)) : Math.ceil(subtotal);
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

  // Start Ride handler
  const handleStartRide = async () => {
    if (isGuest) {
      setAuthModalVisible(true);
      return;
    }
    if (!selectedRoute) {
      showWarning('Select Route', 'Please select a jeepney route before starting ride tracking.');
      return;
    }

    setStartLocation(currentLocation);
    lastLocationRef.current = currentLocation;
    setDistanceTraveledKm(0);
    setElapsedSeconds(0);
    setRideState('riding');
    showInfo(
      'Tracking Started',
      `Live GPS tracking is now active for ${selectedRoute.name}. Safe travels!`
    );

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Start GPS watch
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const nextCoords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            handleNewPosition(nextCoords);
          },
          (err) => console.warn('Web watchPosition error:', err),
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
        );
        watchSubscriptionRef.current = { remove: () => navigator.geolocation.clearWatch(id) };
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
            };
            handleNewPosition(nextCoords);
          }
        );
        watchSubscriptionRef.current = sub;
      }
    } catch (e) {
      console.warn('Could not start GPS watch:', e);
    }
  };

  // Position update & distance calculation
  const handleNewPosition = (nextCoords) => {
    setCurrentLocation(nextCoords);
    if (lastLocationRef.current) {
      const stepDist = calculateDistanceKm(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        nextCoords.lat,
        nextCoords.lng
      );
      // Filter out stationary noise (< 3 meters) and unrealistic spikes (> 2 km in 2 seconds)
      if (stepDist > 0.003 && stepDist < 2.0) {
        setDistanceTraveledKm((prev) => parseFloat((prev + stepDist).toFixed(3)));
        lastLocationRef.current = nextCoords;
      }
    } else {
      lastLocationRef.current = nextCoords;
    }
  };

  // Stop tracking helper
  const stopTracking = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (watchSubscriptionRef.current) {
      if (typeof watchSubscriptionRef.current.remove === 'function') {
        watchSubscriptionRef.current.remove();
      }
      watchSubscriptionRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
    }
  };

  // End Ride prompt & handler
  const confirmEndRide = () => {
    setConfirmModalConfig({
      visible: true,
      title: 'End Ride & Drop Off',
      message: 'Are you sure you want to end your commute and calculate the final official fare?',
      confirmText: 'End Ride',
      cancelText: 'Continue Riding',
      type: 'warning',
      icon: 'map-marker-check',
      onConfirm: () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        handleEndRide();
      },
    });
  };

  const handleEndRide = async () => {
    stopTracking();
    setRideState('completed');

    const completedRide = {
      id: `ride_${Date.now()}`,
      timestamp: new Date().toISOString(),
      routeName: selectedRoute?.name || 'Dagupan Route',
      routeCode: selectedRoute?.code || '',
      vehicleType,
      fare: liveFareData.finalFare,
      regularFare: liveFareData.regularFare,
      discount,
      distanceKm: distanceTraveledKm,
      durationSecs: elapsedSeconds,
    };

    const updated = await saveRideToHistory(completedRide);
    if (updated) setRideHistory(updated);
    showSuccess(
      'Ride Completed!',
      `Official fare calculated: ₱${liveFareData.finalFare}. Saved to ride history.`
    );
  };

  const handleClearHistory = () => {
    setConfirmModalConfig({
      visible: true,
      title: 'Clear Ride History',
      message: 'Are you sure you want to clear all completed ride history logs?',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash-can-outline',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, visible: false }));
        await clearRideHistory();
        setRideHistory([]);
        showInfo('History Cleared', 'Your ride history log has been cleared.');
      },
    });
  };

  // Reset to idle
  const handleResetRide = () => {
    stopTracking();
    setDistanceTraveledKm(0);
    setElapsedSeconds(0);
    setStartLocation(null);
    setRideState('idle');
  };

  // Desktop Motion Simulation along selected route path
  const toggleSimulation = () => {
    if (isGuest) {
      setAuthModalVisible(true);
      return;
    }
    if (isSimulating) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setIsSimulating(false);
    } else {
      if (!selectedRoute?.path || selectedRoute.path.length < 2) {
        showWarning('Simulation Notice', 'Selected route does not have GPS path coordinates to simulate.');
        return;
      }

      setIsSimulating(true);
      let idx = simulationIndex;
      const path = selectedRoute.path;

      simulationIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % path.length;
        setSimulationIndex(idx);
        const pt = path[idx];
        const nextCoords = Array.isArray(pt) ? { lat: pt[0], lng: pt[1] } : { lat: pt.lat, lng: pt.lng };
        handleNewPosition(nextCoords);
      }, 1500);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate Leaflet Map HTML
  const generateMapHtml = () => {
    const lat = currentLocation.lat || 16.0433;
    const lng = currentLocation.lng || 120.3342;
    const startLat = startLocation?.lat || null;
    const startLng = startLocation?.lng || null;
    const pathCoords = selectedRoute?.path || [];

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
          .commuter-marker {
            width: 24px; height: 24px; border-radius: 50%; background: #2563EB;
            border: 3px solid #ffffff; box-shadow: 0 0 16px rgba(37,99,235,1);
            display: flex; align-items: center; justify-content: center;
            animation: pulse-ring 2s infinite;
          }
          .commuter-inner {
            width: 8px; height: 8px; border-radius: 50%; background: #ffffff;
          }
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
          const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          // Route Polyline
          const rawPath = ${JSON.stringify(pathCoords)};
          const path = rawPath.map(function(p) {
            return Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng];
          });
          if (path.length > 0) {
            const poly = L.polyline(path, {
              color: '#3B82F6',
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round',
              lineCap: 'round'
            }).addTo(map);
          }

          // Boarding Pin
          const startLat = ${startLat ? startLat : 'null'};
          const startLng = ${startLng ? startLng : 'null'};
          if (startLat && startLng) {
            const boardIcon = L.divIcon({
              className: '',
              html: '<div class="boarding-pin">🚏</div>',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });
            L.marker([startLat, startLng], { icon: boardIcon }).addTo(map)
              .bindPopup('<b>Boarding Location</b><br/>Ride started here');
          }

          // Live Commuter Marker
          const commuterIcon = L.divIcon({
            className: '',
            html: '<div class="commuter-marker"><div class="commuter-inner"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          const commuterMarker = L.marker([${lat}, ${lng}], { icon: commuterIcon }).addTo(map);
          commuterMarker.bindPopup('<b>Your Live Position</b><br/>Tracking ride...');

          // Keep in view
          map.panTo([${lat}, ${lng}]);
        </script>
      </body>
      </html>
    `;
  };

  if (loading) {
    return <LoadingSpinner text="Preparing Live Ride Tracker..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="steering" size={26} color="#EA580C" />
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Live Ride Tracker</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'history'
                ? 'Your Past Trips & LTFRB Receipts'
                : rideState === 'riding'
                ? '🟢 Active Ride in Progress'
                : rideState === 'completed'
                ? '🏁 Ride Completed'
                : 'Dagupan LTFRB Live Meter'}
            </Text>
          </View>
        </View>

        {activeTab === 'tracker' && rideState === 'riding' && (
          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: isSimulating ? '#DC2626' : '#2563EB' }]}
            onPress={toggleSimulation}
          >
            <MaterialCommunityIcons
              name={isSimulating ? 'motion-pause' : 'motion-play'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.simBtnText}>
              {isSimulating ? 'Pause Sim' : 'Simulate'}
            </Text>
          </TouchableOpacity>
        )}

        {activeTab === 'history' && rideHistory.length > 0 && (
          <TouchableOpacity
            style={[styles.clearBtn, { backgroundColor: colors.error + '18' }]}
            onPress={handleClearHistory}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
            <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'tracker' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('tracker')}
        >
          <MaterialCommunityIcons
            name="map-marker-path"
            size={18}
            color={activeTab === 'tracker' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'tracker' ? colors.primary : colors.textSecondary },
              activeTab === 'tracker' && { fontWeight: '700' },
            ]}
          >
            Live Tracker
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <MaterialCommunityIcons
            name="history"
            size={18}
            color={activeTab === 'history' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'history' ? colors.primary : colors.textSecondary },
              activeTab === 'history' && { fontWeight: '700' },
            ]}
          >
            Ride History {rideHistory.length > 0 ? `(${rideHistory.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: LIVE TRACKER VIEW */}
      {activeTab === 'tracker' && (
        <>
          {/* Map View Area */}
          <View style={styles.mapArea}>
            {Platform.OS === 'web' ? (
              <iframe
                key={`ride-map-${currentLocation.lat}-${currentLocation.lng}-${rideState}`}
                title="Live Ride Map"
                srcDoc={generateMapHtml()}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: generateMapHtml() }}
                style={{ flex: 1, backgroundColor: '#0f172a' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}

            {/* Live HUD Overlay when riding */}
            {rideState === 'riding' && (
              <View style={styles.hudOverlay}>
                <View style={styles.hudMainRow}>
                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>LIVE FARE</Text>
                    <Text style={styles.hudFareText}>{formatPeso(liveFareData.finalFare)}</Text>
                  </View>

                  <View style={styles.hudDivider} />

                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>DISTANCE</Text>
                    <Text style={styles.hudValueText}>{distanceTraveledKm.toFixed(2)} km</Text>
                  </View>

                  <View style={styles.hudDivider} />

                  <View style={styles.hudMetric}>
                    <Text style={styles.hudLabel}>ELAPSED</Text>
                    <Text style={styles.hudValueText}>{formatTime(elapsedSeconds)}</Text>
                  </View>
                </View>

                <View style={styles.hudSubRow}>
                  <Text style={styles.hudSubText}>
                    {liveFareData.isBase
                      ? `Base fare covers first ${liveFareData.baseDistanceKm || 4}.0 km (${Math.max(0, (liveFareData.baseDistanceKm || 4) - distanceTraveledKm).toFixed(2)} km left in base)`
                      : `+${formatPeso(liveFareData.perKmRate)}/km beyond ${liveFareData.baseDistanceKm || 4}.0 km`}
                  </Text>
                  {discount === 'discounted' && (
                    <Text style={styles.hudDiscountTag}>20% Discount Applied</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Bottom Sheet / Controls Panel */}
          <View style={[styles.bottomPanel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <ScrollView contentContainerStyle={styles.bottomScroll} keyboardShouldPersistTaps="handled">
              {/* STATE: IDLE (Choose route, vehicle, discount, then Start) */}
              {rideState === 'idle' && (
                <>
                  {/* 1. JEEPNEY ROUTE DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>
                      1. What Jeepney Did You Board?
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor: openDropdown === 'route' ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setOpenDropdown((prev) => (prev === 'route' ? null : 'route'))}
                    >
                      <View style={[styles.dropdownIconBadge, { backgroundColor: colors.primary + '18' }]}>
                        <MaterialCommunityIcons name="van-passenger" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text style={[styles.dropdownSelectedTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {selectedRoute ? selectedRoute.name : 'Select a Jeepney Route...'}
                        </Text>
                        <Text style={[styles.dropdownSelectedSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                          {selectedRoute ? (selectedRoute.corridor || `~${selectedRoute.distanceKm} km loop (Downtown)`) : 'Tap to choose jeepney'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={openDropdown === 'route' ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === 'route' && (
                      <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                          {routes.map((r) => {
                            const isSel = selectedRoute?._id === r._id;
                            return (
                              <TouchableOpacity
                                key={r._id}
                                style={[
                                  styles.dropdownItem,
                                  isSel && { backgroundColor: colors.primary + '14' },
                                ]}
                                onPress={() => {
                                  setSelectedRoute(r);
                                  setOpenDropdown(null);
                                }}
                              >
                                <View style={[styles.itemDot, { backgroundColor: isSel ? colors.primary : '#94A3B8' }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.dropdownItemTitle, { color: isSel ? colors.primary : colors.textPrimary, fontWeight: isSel ? '700' : '600' }]}>
                                    {r.name}
                                  </Text>
                                  <Text style={[styles.dropdownItemSub, { color: colors.textMuted }]} numberOfLines={1}>
                                    {r.corridor || `~${r.distanceKm} km loop`}
                                  </Text>
                                </View>
                                {isSel && (
                                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <View style={[styles.dropdownNotice, { borderTopColor: colors.border }]}>
                          <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
                          <Text style={[styles.dropdownNoticeText, { color: colors.textSecondary }]}>
                            All jeepneys can be seen and boarded in Downtown Dagupan.
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 2. VEHICLE TYPE DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>
                      2. Vehicle Type
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor: openDropdown === 'vehicle' ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setOpenDropdown((prev) => (prev === 'vehicle' ? null : 'vehicle'))}
                    >
                      <View style={[styles.dropdownIconBadge, { backgroundColor: colors.primary + '18' }]}>
                        <MaterialCommunityIcons
                          name={vehicleType === 'traditional' ? 'van-utility' : 'bus-side'}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text style={[styles.dropdownSelectedTitle, { color: colors.textPrimary }]}>
                          {vehicleType === 'traditional' ? 'Traditional Jeepney' : 'Modern PUV (Minibus)'}
                        </Text>
                        <Text style={[styles.dropdownSelectedSubtitle, { color: colors.textMuted }]}>
                          {vehicleType === 'traditional'
                            ? 'Base: ₱14.00 (First 4.0 km) • +₱2.00/km'
                            : 'Base: ₱17.00 (First 4.0 km) • +₱2.40/km'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={openDropdown === 'vehicle' ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === 'vehicle' && (
                      <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {VEHICLE_TYPES.map((vt) => {
                          const isSel = vehicleType === vt.value;
                          return (
                            <TouchableOpacity
                              key={vt.value}
                              style={[
                                styles.dropdownItem,
                                isSel && { backgroundColor: colors.primary + '14' },
                              ]}
                              onPress={() => {
                                setVehicleType(vt.value);
                                setOpenDropdown(null);
                              }}
                            >
                              <MaterialCommunityIcons
                                name={vt.icon}
                                size={20}
                                color={isSel ? colors.primary : colors.textSecondary}
                                style={{ marginRight: 10 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.dropdownItemTitle, { color: isSel ? colors.primary : colors.textPrimary, fontWeight: isSel ? '700' : '600' }]}>
                                  {vt.label}
                                </Text>
                                <Text style={[styles.dropdownItemSub, { color: colors.textMuted }]}>
                                  {vt.value === 'traditional'
                                    ? 'Standard open-air jeepney • ₱14.00 base + ₱2.00/km'
                                    : vt.value === 'modern'
                                    ? 'Air-conditioned modern PUV • ₱17.00 base + ₱2.40/km'
                                    : 'Dagupan Tricycle • ₱15.00 base (1 km) + ₱3.00/km'}
                                </Text>
                              </View>
                              {isSel && (
                                <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* 3. FARE CATEGORY DROPDOWN */}
                  <View style={styles.dropdownSection}>
                    <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>
                      3. Fare Category & Discounts
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownTrigger,
                        {
                          backgroundColor: colors.background,
                          borderColor: openDropdown === 'discount' ? colors.accent : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setOpenDropdown((prev) => (prev === 'discount' ? null : 'discount'))}
                    >
                      <View style={[styles.dropdownIconBadge, { backgroundColor: colors.accent + '20' }]}>
                        <MaterialCommunityIcons
                          name={discount === 'discounted' ? 'account-heart' : 'account'}
                          size={20}
                          color={colors.accent}
                        />
                      </View>
                      <View style={styles.dropdownTextCol}>
                        <Text style={[styles.dropdownSelectedTitle, { color: colors.textPrimary }]}>
                          {discount === 'discounted' ? '20% Mandated Discount' : 'Regular Passenger'}
                        </Text>
                        <Text style={[styles.dropdownSelectedSubtitle, { color: colors.textMuted }]}>
                          {discount === 'discounted'
                            ? 'Student, Senior Citizen, PWD (20% off)'
                            : 'Standard statutory LTFRB tariff'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={openDropdown === 'discount' ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {openDropdown === 'discount' && (
                      <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {DISCOUNT_TYPES.map((dt) => {
                          const isSel = discount === dt.value;
                          return (
                            <TouchableOpacity
                              key={dt.value}
                              style={[
                                styles.dropdownItem,
                                isSel && { backgroundColor: colors.accent + '14' },
                              ]}
                              onPress={() => {
                                setDiscount(dt.value);
                                setOpenDropdown(null);
                              }}
                            >
                              <MaterialCommunityIcons
                                name={dt.icon}
                                size={20}
                                color={isSel ? colors.accent : colors.textSecondary}
                                style={{ marginRight: 10 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.dropdownItemTitle, { color: isSel ? colors.accent : colors.textPrimary, fontWeight: isSel ? '700' : '600' }]}>
                                  {dt.label}
                                </Text>
                                <Text style={[styles.dropdownItemSub, { color: colors.textMuted }]}>
                                  {dt.value === 'none'
                                    ? 'Standard commuter fare (no discount)'
                                    : 'Mandated 20% discount for Students, Seniors, & PWDs'}
                                </Text>
                              </View>
                              {isSel && (
                                <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Pre-ride Rate Info Banner */}
                  <View style={[styles.rateBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.rateCol}>
                      <Text style={[styles.rateLabel, { color: colors.textMuted }]}>BASE FARE (FIRST 4 KM)</Text>
                      <Text style={[styles.rateValue, { color: colors.primary }]}>
                        {formatPeso(vehicleType === 'traditional' ? (discount === 'discounted' ? 12 : 14) : (discount === 'discounted' ? 14 : 17))}
                      </Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={[styles.rateLabel, { color: colors.textMuted }]}>SUCCEEDING PER KM</Text>
                      <Text style={[styles.rateValue, { color: colors.textPrimary }]}>
                        +{formatPeso(vehicleType === 'traditional' ? 2.0 : 2.4)}/km
                      </Text>
                    </View>
                  </View>

                  {/* Guest Locked Notice */}
                  {isGuest && (
                    <TouchableOpacity
                      style={[styles.guestLockBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}
                      onPress={() => setAuthModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.guestLockBadge, { backgroundColor: colors.primary }]}>
                        <MaterialCommunityIcons name="account-lock" size={16} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.guestLockTitle, { color: colors.textPrimary }]}>
                          Account Required to Track Live Ride
                        </Text>
                        <Text style={[styles.guestLockText, { color: colors.textSecondary }]}>
                          Sign in or create a free account to activate live GPS tracking and automated fare calculations.
                        </Text>
                      </View>
                      <Text style={[styles.guestLockAction, { color: colors.primary }]}>Sign In →</Text>
                    </TouchableOpacity>
                  )}

                  {/* Big Start Ride Button */}
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.8}
                    onPress={handleStartRide}
                  >
                    <MaterialCommunityIcons name="play-circle" size={26} color="#FFFFFF" />
                    <Text style={styles.startBtnText}>Start Ride & Track Live Fare</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STATE: RIDING (Live Status + End Ride) */}
              {rideState === 'riding' && (
                <View style={styles.activeRideBox}>
                  <View style={styles.routeHeaderActive}>
                    <MaterialCommunityIcons name="jeepney" size={22} color={colors.primary} />
                    <Text style={[styles.routeActiveName, { color: colors.textPrimary }]}>
                      {selectedRoute?.name || 'Jeepney Ride'}
                    </Text>
                    <Text style={[styles.badgePill, { backgroundColor: colors.primary + '20', color: colors.primary }]}>
                      {vehicleType === 'traditional' ? 'Traditional' : 'Modern'}
                    </Text>
                  </View>

                  <Text style={[styles.activeHelpText, { color: colors.textSecondary }]}>
                    Your GPS position is updating in real-time. The fare ticker above displays the exact LTFRB-compliant fare for your trip distance.
                  </Text>

                  <TouchableOpacity
                    style={styles.endBtn}
                    activeOpacity={0.8}
                    onPress={confirmEndRide}
                  >
                    <MaterialCommunityIcons name="stop-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.endBtnText}>End Ride / Drop Off</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STATE: COMPLETED (Ride Receipt & Summary) */}
              {rideState === 'completed' && (
                <View style={styles.completedBox}>
                  <View style={styles.completedHeader}>
                    <MaterialCommunityIcons name="check-decagram" size={32} color="#16A34A" />
                    <Text style={[styles.completedTitle, { color: colors.textPrimary }]}>
                      Ride Summary & Receipt
                    </Text>
                  </View>

                  {/* Emphasized Fare Card */}
                  <Card style={[styles.fareReceiptCard, { borderColor: '#16A34A' }]}>
                    <Text style={styles.receiptFareLabel}>AMOUNT TO PAY DRIVER</Text>
                    <Text style={styles.receiptFareBig}>{formatPeso(liveFareData.finalFare)}</Text>
                    {discount === 'discounted' && (
                      <Text style={styles.receiptDiscountNote}>
                        Includes 20% Student / Senior / PWD Discount (Regular: {formatPeso(liveFareData.regularFare)})
                      </Text>
                    )}
                  </Card>

                  {/* Metrics Table */}
                  <View style={[styles.metricsTable, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.metricRow}>
                      <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>Route:</Text>
                      <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>{selectedRoute?.name}</Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>Vehicle Type:</Text>
                      <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>
                        {vehicleType === 'traditional' ? '🚐 Traditional Jeepney' : '🚌 Modern PUJ'}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>Total Distance:</Text>
                      <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>
                        {distanceTraveledKm.toFixed(2)} km
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>Ride Duration:</Text>
                      <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>
                        {formatTime(elapsedSeconds)}
                      </Text>
                    </View>
                    <View style={styles.metricRow}>
                      <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>Base Fare (First 4 km):</Text>
                      <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>
                        {formatPeso(liveFareData.baseFare)}
                      </Text>
                    </View>
                    {liveFareData.extraKm > 0 && (
                      <View style={styles.metricRow}>
                        <Text style={[styles.metricRowLabel, { color: colors.textSecondary }]}>
                          Extra Distance ({liveFareData.extraKm.toFixed(2)} km @ {formatPeso(liveFareData.perKmRate)}/km):
                        </Text>
                        <Text style={[styles.metricRowValue, { color: colors.textPrimary }]}>
                          +{formatPeso(liveFareData.extraKm * liveFareData.perKmRate)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.newRideBtn}
                    activeOpacity={0.8}
                    onPress={handleResetRide}
                  >
                    <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
                    <Text style={styles.newRideBtnText}>Start Another Ride</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* TAB 2: RIDE HISTORY VIEW */}
      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={styles.historyScroll} keyboardShouldPersistTaps="handled">
          {/* Active Ride Banner if riding in background */}
          {rideState === 'riding' && (
            <TouchableOpacity
              style={[styles.activeRideBanner, { backgroundColor: '#EA580C' }]}
              onPress={() => setActiveTab('tracker')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="steering" size={24} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeRideBannerTitle}>Active Ride in Progress</Text>
                <Text style={styles.activeRideBannerSubtitle}>
                  {formatPeso(liveFareData.finalFare)} • {distanceTraveledKm.toFixed(2)} km • Tap to view map
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Lifetime Summary Stats Card */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{rideHistory.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total Rides</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: '#2563EB' }]}>
                {rideHistory.reduce((acc, r) => acc + (r.distanceKm || 0), 0).toFixed(1)} km
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Distance</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: '#16A34A' }]}>
                {formatPeso(rideHistory.reduce((acc, r) => acc + (r.fare || 0), 0))}
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Fares Paid</Text>
            </View>
          </View>

          {/* Empty State or Trip Cards */}
          {rideHistory.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="history" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Past Rides Yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Start and complete a trip using the Live Ride Tracker to view your travel logs and fare receipts here.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => setActiveTab('tracker')}
              >
                <MaterialCommunityIcons name="play-circle" size={18} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Start a Ride Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tripList}>
              <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
                COMPLETED TRIPS ({rideHistory.length})
              </Text>

              {rideHistory.map((ride, idx) => {
                const dateObj = new Date(ride.timestamp);
                const dateFormatted = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
                    ' • ' +
                    dateObj.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
                  : 'Recent Trip';

                const isModern = ride.vehicleType === 'modern';

                return (
                  <Card key={ride.id || idx} style={styles.tripCard}>
                    <View style={styles.tripCardTop}>
                      <View style={styles.tripCardLeft}>
                        <View
                          style={[
                            styles.vehiclePill,
                            { backgroundColor: isModern ? '#DBEAFE' : '#FEF3C7' },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={isModern ? 'bus' : 'jeepney'}
                            size={14}
                            color={isModern ? '#2563EB' : '#D97706'}
                          />
                          <Text
                            style={[
                              styles.vehiclePillText,
                              { color: isModern ? '#1D4ED8' : '#B45309' },
                            ]}
                          >
                            {isModern ? 'Modern PUJ' : 'Traditional'}
                          </Text>
                        </View>
                        <Text
                          style={[styles.tripRouteName, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {ride.routeName || 'Dagupan Loop'}
                        </Text>
                      </View>
                      <Text style={styles.tripFareBig}>{formatPeso(ride.fare)}</Text>
                    </View>

                    <View style={styles.tripMetaRow}>
                      <View style={styles.tripMetaItem}>
                        <MaterialCommunityIcons
                          name="map-marker-distance"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={[styles.tripMetaText, { color: colors.textSecondary }]}>
                          {(ride.distanceKm || 0).toFixed(2)} km
                        </Text>
                      </View>

                      <View style={styles.tripMetaItem}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={[styles.tripMetaText, { color: colors.textSecondary }]}>
                          {formatTime(ride.durationSecs || 0)}
                        </Text>
                      </View>

                      {(ride.discount === 'discounted' || ride.isDiscounted) && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>20% Discount</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.tripCardBottom, { borderTopColor: colors.border }]}>
                      <Text style={[styles.tripDateText, { color: colors.textMuted }]}>
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
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, visible: false }))}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLockTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  guestLockText: {
    fontSize: FONTS.sizes.xs,
    lineHeight: 16,
  },
  guestLockAction: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  simBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  mapArea: {
    flex: 1,
    minHeight: 220,
    position: 'relative',
  },
  hudOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  hudMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  hudMetric: {
    alignItems: 'center',
  },
  hudLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hudFareText: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: '800',
  },
  hudValueText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  hudDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
  },
  hudSubRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudSubText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
  },
  hudDiscountTag: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomPanel: {
    maxHeight: SCREEN_HEIGHT * 0.52,
    borderTopWidth: 1,
  },
  bottomScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  controlLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  dropdownSection: {
    marginBottom: SPACING.md,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 3,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  dropdownIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  dropdownTextCol: {
    flex: 1,
  },
  dropdownSelectedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },
  dropdownSelectedSubtitle: {
    fontSize: FONTS.sizes.xs - 1,
    marginTop: 2,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 190,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  dropdownNoticeText: {
    fontSize: FONTS.sizes.xs - 1,
    fontWeight: '600',
    flex: 1,
  },
  rateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  rateCol: {
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  activeRideBox: {
    paddingVertical: SPACING.sm,
  },
  routeHeaderActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  routeActiveName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  badgePill: {
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: '#DC2626',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  endBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  completedBox: {
    paddingVertical: SPACING.xs,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  completedTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  fareReceiptCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  receiptFareLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.8,
  },
  receiptFareBig: {
    fontSize: 40,
    fontWeight: '900',
    color: '#16A34A',
    marginVertical: 4,
  },
  receiptDiscountNote: {
    fontSize: FONTS.sizes.xs,
    color: '#F59E0B',
    fontWeight: '600',
  },
  metricsTable: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRowLabel: {
    fontSize: FONTS.sizes.xs,
  },
  metricRowValue: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
  },
  newRideBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  newRideBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyScroll: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  activeRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activeRideBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  activeRideBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
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
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tripList: {
    gap: SPACING.sm,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  tripCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 2,
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripCardLeft: {
    flex: 1,
    marginRight: 8,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  vehiclePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tripRouteName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tripFareBig: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16A34A',
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  tripMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  tripCardBottom: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tripDateText: {
    fontSize: 11,
  },
});

export default RideTrackerScreen;
