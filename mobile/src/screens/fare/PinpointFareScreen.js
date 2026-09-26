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
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { Card } from '../../components/common/SharedComponents';
import ConfirmDialogModal from '../../components/common/ConfirmDialogModal';
import { faresAPI, routesAPI } from '../../api/services';
import { saveRideToHistory } from '../../utils/storage';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { formatPeso } from '../../utils/helpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GPS_ICON = require('../../../assets/gps_access_icon.png');

// Default fallback location: Dagupan City Plaza
const DAGUPAN_CENTER = {
  lat: 16.0433,
  lng: 120.3342,
  name: 'Dagupan City Plaza',
};

// Popular Dagupan to Visit for 1-tap pinpoint
const POPULAR_DESTINATIONS = [
  { name: 'Region 1', fullName: 'Region 1 Medical Center', lat: 16.04858883203431, lng: 120.34159201507514, icon: 'hospital-building' },
  { name: 'University of Luzon', fullName: 'University of Luzon', lat: 16.03979698464543, lng: 120.33585706611083, icon: 'school' },
  { name: 'UPang', fullName: 'PHINMA University of Pangasinan', lat: 16.047073152284103, lng: 120.3424288642609, icon: 'school' },
  { name: 'Lyceum NorthWestern University', fullName: 'Lyceum Northwestern University', lat: 16.035223066160448, lng: 120.33011439807963, icon: 'school' },
  { name: 'UDD', fullName: 'Universidad de Dagupan (UDD)', lat: 16.050671455090622, lng: 120.34088198010957, icon: 'school' },
  { name: 'CSI Lucao', fullName: 'CSI The City Mall Lucao', lat: 16.023527558411267, lng: 120.32342891959715, icon: 'shopping' },
  { name: 'SM Dagupan', fullName: 'SM Center Dagupan', lat: 16.044318662785823, lng: 120.34369785261799, icon: 'shopping' },
  { name: 'Nepo Mall Dagupan', fullName: 'Nepo Mall Downtown Dagupan', lat: 16.05119585865268, lng: 120.34159281889808, icon: 'store' },
  { name: 'CSI Square', fullName: 'CSI Square Downtown', lat: 16.043433644436057, lng: 120.33567150740232, icon: 'shopping' },
  { name: 'City Mall Mayombo', fullName: 'CityMall Mayombo Dagupan', lat: 16.038098156410296, lng: 120.34736306873677, icon: 'shopping' },
];

// Haversine distance in km
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

const PinpointFareScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { showSuccess, showWarning, showError, showInfo } = useFeedback();
  const webViewRef = useRef(null);

  // Origin & Destination State
  const [origin, setOrigin] = useState({
    lat: DAGUPAN_CENTER.lat,
    lng: DAGUPAN_CENTER.lng,
    name: 'Current Location',
    isGPS: false,
  });

  const [destination, setDestination] = useState({
    lat: 16.023527558411267,
    lng: 120.32342891959715,
    name: 'CSI Lucao',
  });

  // Pending Pinpoint state waiting for commuter to tap "Set"
  const [pendingPinpoint, setPendingPinpoint] = useState(null);
  const [isDestinationSet, setIsDestinationSet] = useState(true);

  // Location Permission State
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'granted' | 'denied'
  const [gpsLoading, setGpsLoading] = useState(false);

  // Road Routing State (OSRM road-aligned data)
  const [roadDistanceKm, setRoadDistanceKm] = useState(2.4);
  const [roadDurationMins, setRoadDurationMins] = useState(8);
  const [roadSummary, setRoadSummary] = useState('Aligning to Dagupan road network...');
  const [isRouting, setIsRouting] = useState(false);

  // Active Fares & Solo Ride / Visitor Ordinance Settings
  const [activeFares, setActiveFares] = useState({});
  const [isDiscounted, setIsDiscounted] = useState(false); // 20% Student/Senior/PWD discount

  // Live Tracking Mode State: 'idle' | 'tracking' | 'arrived'
  const [trackingState, setTrackingState] = useState('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceTraveledKm, setDistanceTraveledKm] = useState(0);
  const [arrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [stopConfirmVisible, setStopConfirmVisible] = useState(false);
  const [currentGpsPos, setCurrentGpsPos] = useState(origin);
  const [lastCompletedRide, setLastCompletedRide] = useState(null);
  const timerIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);
  const watchSubscriptionRef = useRef(null);

  // Live remaining distance to destination (updates as commuter moves)
  const remainingDistToDestKm = useMemo(() => {
    const loc = currentGpsPos || origin;
    if (!loc || !destination) return effectiveDistanceKm;
    return calculateDistanceKm(loc.lat, loc.lng, destination.lat, destination.lng);
  }, [currentGpsPos, origin, destination, effectiveDistanceKm]);

  // Destination arrival lock check: within 150 meters (0.15 km)
  const isNearDestination = remainingDistToDestKm <= 0.15;

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
            setCurrentGpsPos(coords);
            setPermissionStatus('granted');
            setGpsLoading(false);
            showInfo('GPS Updated', 'Recenetred map to your current location.');
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
          setCurrentGpsPos(coords);
          showInfo('GPS Updated', 'Recenetred map to your current location.');
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

  // Fetch Active Fares from Database
  useEffect(() => {
    faresAPI
      .getActiveFares()
      .then((res) => {
        const list = res.data?.data || [];
        const map = {};
        list.forEach((f) => {
          map[f.vehicleType] = f;
        });
        setActiveFares(map);
      })
      .catch((err) => console.warn('Failed to load fares:', err.message));
  }, []);

  // Calculate Distance (km)
  const effectiveDistanceKm = useMemo(() => {
    if (roadDistanceKm && roadDistanceKm > 0) return roadDistanceKm;
    const direct = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    return Math.round(direct * 1.25 * 10) / 10;
  }, [roadDistanceKm, origin, destination]);

  // Solo Ride / Visitor Fair Fare Calculation (Dagupan City TFRB Ordinance)
  // Base ₱15 for 1st km, +₱3/km thereafter
  const computedFare = useMemo(() => {
    const dist = trackingState === 'tracking' ? Math.max(effectiveDistanceKm, distanceTraveledKm) : effectiveDistanceKm;
    const triConf = activeFares.solo_ride || activeFares.tricycle || { baseFare: 15, baseDistanceKm: 1, perKmRate: 3 };
    const baseFare = triConf.baseFare || 15;
    const baseDist = triConf.baseDistanceKm || 1;
    const perKm = triConf.perKmRate || 3;
    const extraDist = dist > baseDist ? dist - baseDist : 0;
    const extraFare = Math.ceil(extraDist) * perKm;
    const regular = baseFare + extraFare;
    const discounted = Math.round(regular * 0.8);

    return {
      regular,
      discounted,
      finalFare: isDiscounted ? discounted : regular,
      baseFare,
      baseDist,
      perKm,
      extraKm: Math.round(extraDist * 10) / 10,
    };
  }, [effectiveDistanceKm, distanceTraveledKm, trackingState, activeFares, isDiscounted]);

  // Confirm and set the pinpointed destination
  const handleConfirmSet = (target) => {
    const toSet = target || pendingPinpoint;
    if (toSet) {
      setDestination((prev) => ({
        ...prev,
        lat: toSet.lat,
        lng: toSet.lng,
        name: toSet.name || prev.name,
      }));
      if (toSet.distanceKm) setRoadDistanceKm(toSet.distanceKm);
      if (toSet.durationMins) setRoadDurationMins(toSet.durationMins);
      if (toSet.summary) setRoadSummary(toSet.summary);
    }
    const destName = toSet?.name || destination.name;
    setIsDestinationSet(true);
    setPendingPinpoint(null);
    showSuccess('Destination Set', `Destination set to ${destName}. Ready to track ride!`);

    // Signal map to update pin popup
    const script = `if (window.onDestinationConfirmed) { window.onDestinationConfirmed('${destName.replace(/'/g, "\\'")}'); }`;
    if (webViewRef.current && Platform.OS !== 'web') {
      webViewRef.current.injectJavaScript(script);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const iframe = document.getElementById('solo-ride-pinpoint-map') || document.getElementById('tricycle-pinpoint-map');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ type: 'CONFIRM_SET_PINPOINT', name: destName }), '*');
      }
    }
  };

  // Handle message from Leaflet Web / WebView
  const handleMapEvent = (data) => {
    if (!data) return;
    if (data.type === 'CONFIRM_SET_PINPOINT') {
      handleConfirmSet(data);
      return;
    }
    if (data.type === 'ROUTE_CALCULATED') {
      setIsRouting(false);
      const name = data.name || (data.summary ? `Near ${data.summary.split('➔')[0].trim()}` : destination.name);
      setPendingPinpoint({
        lat: data.lat,
        lng: data.lng,
        name,
        distanceKm: data.distanceKm,
        durationMins: data.durationMins,
        summary: data.summary,
      });
      setIsDestinationSet(false);
      if (data.distanceKm) setRoadDistanceKm(data.distanceKm);
      if (data.durationMins) setRoadDurationMins(data.durationMins);
      if (data.summary) setRoadSummary(data.summary);
    } else if (data.type === 'PINPOINT_DESTINATION') {
      setIsRouting(false);
      const d = calculateDistanceKm(origin.lat, origin.lng, data.lat, data.lng);
      const dist = Math.round(d * 1.25 * 10) / 10;
      const mins = Math.max(2, Math.round((d / 18) * 60));
      setPendingPinpoint({
        lat: data.lat,
        lng: data.lng,
        name: data.name || 'Pinpointed Location',
        distanceKm: dist,
        durationMins: mins,
      });
      setIsDestinationSet(false);
      setRoadDistanceKm(dist);
      setRoadDurationMins(mins);
    } else if (data.type === 'ROUTING_STARTED') {
      setIsRouting(true);
    }
  };

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
  }, [origin, pendingPinpoint, destination]);

  // Send destination to Leaflet map from Popular Dagupan to Visit chips
  const selectLandmark = (item) => {
    setIsRouting(true);
    setPendingPinpoint({
      lat: item.lat,
      lng: item.lng,
      name: item.name,
    });
    setIsDestinationSet(false);
    const script = `if (window.setDestinationFromApp) { window.setDestinationFromApp(${item.lat}, ${item.lng}, '${item.name.replace(/'/g, "\\'")}'); }`;
    if (webViewRef.current && Platform.OS !== 'web') {
      webViewRef.current.injectJavaScript(script);
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const iframe = document.getElementById('solo-ride-pinpoint-map') || document.getElementById('tricycle-pinpoint-map');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ type: 'SET_DESTINATION', lat: item.lat, lng: item.lng, name: item.name }), '*');
      }
    }
  };

  // Start Live Solo Ride / Visitor Tracking
  const handleStartTracking = () => {
    if (!isDestinationSet && pendingPinpoint) {
      handleConfirmSet();
    }
    setTrackingState('tracking');
    setDistanceTraveledKm(0);
    setElapsedSeconds(0);
    setCurrentGpsPos(origin);
    lastLocationRef.current = origin;

    showInfo('Tracking Started', `Live Solo Ride / Visitor meter active towards ${destination.name}.`);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Watch position
    if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          handleNextPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
      watchSubscriptionRef.current = { remove: () => navigator.geolocation.clearWatch(id) };
    } else {
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (loc) => {
          handleNextPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      ).then((sub) => {
        watchSubscriptionRef.current = sub;
      }).catch(() => {});
    }
  };

  const handleNextPosition = (nextPos) => {
    setCurrentGpsPos(nextPos);
    if (lastLocationRef.current) {
      const step = calculateDistanceKm(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        nextPos.lat,
        nextPos.lng
      );
      if (step > 0.003 && step < 2.0) {
        setDistanceTraveledKm((prev) => parseFloat((prev + step).toFixed(2)));
        lastLocationRef.current = nextPos;
      }
    } else {
      lastLocationRef.current = nextPos;
    }

    // Check if reached destination (< 80 meters)
    const distToDest = calculateDistanceKm(nextPos.lat, nextPos.lng, destination.lat, destination.lng);
    if (distToDest <= 0.08) {
      handleArrival();
    }
  };

  // Stop ride early & drop off before original pinpoint destination
  const handleStopRideEarly = async () => {
    setStopConfirmVisible(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (watchSubscriptionRef.current && typeof watchSubscriptionRef.current.remove === 'function') {
      watchSubscriptionRef.current.remove();
    }

    // Calculate actual distance traveled (or default minimum 0.5km)
    const actualDistKm = Math.max(0.4, distanceTraveledKm > 0.05 ? distanceTraveledKm : 0.8);
    // Base fare: ₱15 for 1st km, +₱3/km succeeding
    const baseFare = 15;
    const ratePerKm = 3;
    let regFare = baseFare;
    if (actualDistKm > 1) {
      regFare = Math.round(baseFare + (actualDistKm - 1) * ratePerKm);
    }
    const finalFare = isDiscounted ? Math.round(regFare * 0.80) : regFare;

    const completedRide = {
      id: `ride_solo_${Date.now()}`,
      timestamp: new Date().toISOString(),
      routeName: `Solo Ride / Visitor to ${destination.name} (Early Drop-Off)`,
      destination: `Early Drop-off near ${currentGpsPos?.name || 'Current Stop'}`,
      vehicleType: 'solo_ride',
      fare: finalFare,
      regularFare: regFare,
      discount: isDiscounted ? 'discounted' : 'none',
      distanceKm: parseFloat(actualDistKm.toFixed(2)),
      durationSecs: elapsedSeconds || 60,
    };

    setLastCompletedRide(completedRide);
    await saveRideToHistory(completedRide);
    setTrackingState('arrived');
    setArrivalModalVisible(true);
    showSuccess('Ride Ended', `Dropped off early. Fair fare: ₱${finalFare}.`);
  };

  // Arrived at destination
  const handleArrival = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (watchSubscriptionRef.current && typeof watchSubscriptionRef.current.remove === 'function') {
      watchSubscriptionRef.current.remove();
    }

    // Save to Ride History
    const completedRide = {
      id: `ride_solo_${Date.now()}`,
      timestamp: new Date().toISOString(),
      routeName: `Solo Ride / Visitor to ${destination.name}`,
      destination: destination.name,
      vehicleType: 'solo_ride',
      fare: computedFare.finalFare,
      regularFare: computedFare.regular,
      discount: isDiscounted ? 'discounted' : 'none',
      distanceKm: Math.max(effectiveDistanceKm, distanceTraveledKm),
      durationSecs: elapsedSeconds || roadDurationMins * 60,
    };
    setLastCompletedRide(completedRide);
    await saveRideToHistory(completedRide);
    setTrackingState('arrived');
    setArrivalModalVisible(true);
  };

  const generateLeafletHtml = () => {
    const oLat = origin.lat;
    const oLng = origin.lng;
    const dLat = destination.lat;
    const dLng = destination.lng;

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
            width: 26px;
            height: 26px;
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
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #10B981;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          }
          @keyframes radar {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }

          /* Compact Destination Pin (smaller as requested) */
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
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            cursor: grab;
            transition: transform 0.15s ease;
          }
          .dest-pin-compact:active {
            cursor: grabbing;
            transform: scale(1.15);
          }
          
          .map-tap-hint {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.90);
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 18px;
            font-size: 11px;
            font-weight: 700;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
          }
          .route-status-pill {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(15, 23, 42, 0.90);
            color: #38BDF8;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            z-index: 1000;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="map-tap-hint" id="status-hint">📍 Tap or drag red pin to choose destination, then tap Set</div>
        <div class="route-status-pill" id="route-meta">Finding fastest road...</div>

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
          var currentDestName = '${destination.name.replace(/'/g, "\\'")}';

          var map = L.map('map', { zoomControl: false }).setView([(oLat + dLat)/2, (oLng + dLng)/2], 14);
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          // Origin Marker
          var originIcon = L.divIcon({
            className: 'origin-marker',
            html: '<div class="origin-beacon"><div class="origin-pulse"></div><div class="origin-core"></div></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          var originMarker = L.marker([oLat, oLng], { icon: originIcon }).addTo(map)
            .bindPopup('<b>Starting Location</b><br/>Your GPS Position');

          // Smaller Destination Marker
          var destIcon = L.divIcon({
            className: 'dest-marker',
            html: '<div class="dest-pin-compact">📍</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          var destMarker = L.marker([dLat, dLng], { icon: destIcon, draggable: true }).addTo(map);

          function buildPopupHtml(title, distKm, durMins, isConfirmed) {
            return '<div style="text-align:center; padding:3px; min-width:140px; font-family:system-ui,-apple-system,sans-serif;">' +
              '<b style="font-size:12px; color:#0f172a;">📍 ' + (title || 'Pinpoint Location') + '</b><br/>' +
              (distKm ? ('<span style="font-size:11px; color:#64748b;">~' + distKm + ' km • ~' + durMins + ' mins</span><br/>') : '') +
              (isConfirmed
                ? '<div style="margin-top:5px; font-size:11px; font-weight:800; color:#16A34A;">✓ Destination Set</div>'
                : '<button onclick="window.confirmFromMap()" style="background:#16A34A; color:#ffffff; border:none; padding:5px 14px; border-radius:12px; font-size:11px; font-weight:800; margin-top:6px; cursor:pointer; box-shadow:0 2px 4px rgba(22,163,74,0.3);">Set</button>'
              ) +
            '</div>';
          }
          destMarker.bindPopup(buildPopupHtml(currentDestName, null, null, true));

          window.confirmFromMap = function() {
            destMarker.closePopup();
            postToApp({ type: 'CONFIRM_SET_PINPOINT', lat: dLat, lng: dLng, name: currentDestName });
          };

          window.onDestinationConfirmed = function(name) {
            currentDestName = name;
            var hintEl = document.getElementById('status-hint');
            if (hintEl) hintEl.innerHTML = '✓ Destination Set: ' + name;
            destMarker.setPopupContent(buildPopupHtml(name, null, null, true));
          };

          var currentGlowLayer = null;
          var currentRouteLayer = null;

          async function updateRoadRoute(destLatitude, destLongitude, isUserInteraction) {
            dLat = destLatitude;
            dLng = destLongitude;
            destMarker.setLatLng([dLat, dLng]);

            var hintEl = document.getElementById('status-hint');
            var metaEl = document.getElementById('route-meta');
            if (hintEl) hintEl.innerHTML = '⚡ Finding fastest route...';
            if (metaEl) metaEl.innerHTML = 'Calculating road alignment...';

            postToApp({ type: 'ROUTING_STARTED', lat: dLat, lng: dLng });

            try {
              var url = 'https://router.project-osrm.org/route/v1/driving/' + oLng + ',' + oLat + ';' + dLng + ',' + dLat + '?overview=full&geometries=geojson&steps=true';
              var res = await fetch(url);
              var data = await res.json();

              if (data && data.routes && data.routes.length > 0) {
                var best = data.routes[0];
                var latLngs = best.geometry.coordinates.map(function(c) {
                  return [c[1], c[0]];
                });

                if (currentGlowLayer) map.removeLayer(currentGlowLayer);
                if (currentRouteLayer) map.removeLayer(currentRouteLayer);

                currentGlowLayer = L.polyline(latLngs, {
                  color: '#D97706',
                  weight: 8,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);

                currentRouteLayer = L.polyline(latLngs, {
                  color: '#D97706',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round'
                }).addTo(map);

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

                if (hintEl) hintEl.innerHTML = '📍 Route: ' + distKm + ' km • Tap "Set" to confirm';
                if (metaEl) metaEl.innerHTML = summary ? ('🛣️ ' + summary) : ('🛣️ Fastest road aligned');
                destMarker.setPopupContent(buildPopupHtml(currentDestName || (summary ? summary.split('➔')[0].trim() : 'Pinpointed Location'), distKm, durMins, false));
                if (isUserInteraction) destMarker.openPopup();

                postToApp({
                  type: 'ROUTE_CALCULATED',
                  lat: dLat,
                  lng: dLng,
                  distanceKm: distKm,
                  durationMins: durMins,
                  summary: summary || 'Fastest street route',
                  name: currentDestName,
                  coordinates: latLngs
                });
                return;
              }
            } catch (err) {
              console.warn('Road routing error:', err);
            }

            if (hintEl) hintEl.innerHTML = '📍 Tap "Set" to confirm destination';
            destMarker.setPopupContent(buildPopupHtml(currentDestName || 'Pinpointed Location', null, null, false));
            if (isUserInteraction) destMarker.openPopup();
            postToApp({ type: 'PINPOINT_DESTINATION', lat: dLat, lng: dLng, name: currentDestName });
          }

          updateRoadRoute(dLat, dLng, false);

          destMarker.on('dragend', function() {
            var pos = destMarker.getLatLng();
            currentDestName = '';
            updateRoadRoute(pos.lat, pos.lng, true);
          });

          map.on('click', function(e) {
            currentDestName = '';
            updateRoadRoute(e.latlng.lat, e.latlng.lng, true);
          });

          window.setDestinationFromApp = function(lat, lng, name) {
            currentDestName = name || '';
            updateRoadRoute(lat, lng, true);
          };

          window.addEventListener('message', function(e) {
            try {
              var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (d && d.type === 'SET_DESTINATION') {
                currentDestName = d.name || '';
                updateRoadRoute(d.lat, d.lng, true);
              } else if (d && d.type === 'CONFIRM_SET_PINPOINT') {
                if (window.onDestinationConfirmed) window.onDestinationConfirmed(d.name);
              }
            } catch (_) {}
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: SPACING.xxl }}
    >
      {/* Arrival Celebration Modal: "You've successfully arrived!" */}
      <Modal visible={arrivalModalVisible} transparent animationType="fade">
        <View style={styles.arrivalModalBackdrop}>
          <View style={[styles.arrivalModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.arrivalIconCircle}>
              <MaterialCommunityIcons name="check-decagram" size={44} color="#16A34A" />
            </View>

            <Text style={[styles.arrivalTitle, { color: colors.textPrimary }]}>
              You've successfully arrived!
            </Text>
            <Text style={[styles.arrivalSubtitle, { color: colors.textSecondary }]}>
              {lastCompletedRide?.destination
                ? `You completed your ride at ${lastCompletedRide.destination}.`
                : `You have reached your destination at ${destination.name}.`}
            </Text>

            <View style={[styles.arrivalReceiptCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.receiptLabel, { color: colors.textMuted }]}>FAIR FARE TO PAY</Text>
              <Text style={[styles.receiptFareBig, { color: colors.primary }]}>
                {formatPeso(lastCompletedRide?.fare || computedFare.finalFare)}
              </Text>
              {isDiscounted && (
                <Text style={styles.receiptDiscountText}>Includes 20% Mandatory Discount</Text>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.arrivalMetaRow}>
                <View style={styles.arrivalMetaCol}>
                  <Text style={[styles.arrivalMetaLabel, { color: colors.textMuted }]}>Distance</Text>
                  <Text style={[styles.arrivalMetaVal, { color: colors.textPrimary }]}>
                    {lastCompletedRide?.distanceKm || effectiveDistanceKm} km
                  </Text>
                </View>
                <View style={styles.arrivalMetaCol}>
                  <Text style={[styles.arrivalMetaLabel, { color: colors.textMuted }]}>Trip Time</Text>
                  <Text style={[styles.arrivalMetaVal, { color: colors.textPrimary }]}>
                    {Math.max(1, Math.round((elapsedSeconds || roadDurationMins * 60) / 60))} mins
                  </Text>
                </View>
                <View style={styles.arrivalMetaCol}>
                  <Text style={[styles.arrivalMetaLabel, { color: colors.textMuted }]}>Mode</Text>
                  <Text style={[styles.arrivalMetaVal, { color: colors.textPrimary }]}>Solo Ride / Visitor</Text>
                </View>
              </View>
            </View>

            <View style={styles.arrivalBtnRow}>
              <TouchableOpacity
                style={[styles.arrivalHistoryBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setArrivalModalVisible(false);
                  setTrackingState('idle');
                  navigation.navigate('RideHistory');
                }}
              >
                <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
                <Text style={[styles.arrivalHistoryBtnText, { color: colors.primary }]}>View History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.arrivalDoneBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setArrivalModalVisible(false);
                  setTrackingState('idle');
                }}
              >
                <Text style={styles.arrivalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Early Drop-Off Stop Ride Confirmation Modal */}
      <ConfirmDialogModal
        visible={stopConfirmVisible}
        onClose={() => setStopConfirmVisible(false)}
        onConfirm={handleStopRideEarly}
        title="Stop Ride & Drop Off Here?"
        message={`Are you dropping off early before reaching ${destination.name}? This will complete your commute and calculate the fair fare for the ${distanceTraveledKm > 0 ? distanceTraveledKm.toFixed(2) : 'actual'} km traveled.`}
        confirmText="Yes, Drop Off Here"
        cancelText="Continue Riding"
        type="warning"
        icon="stop-circle-outline"
      />

      {/* Popular Destination Quick Chips */}
      <View style={[styles.quickChipsSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.chipHeaderRow}>
          <MaterialCommunityIcons name="star-outline" size={16} color="#D97706" />
          <Text style={[styles.chipHeaderTitle, { color: colors.textSecondary }]}>
            Popular Dagupan to Visit:
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {POPULAR_DESTINATIONS.map((dest, idx) => {
            const isSelected = pendingPinpoint ? pendingPinpoint.name === dest.name : destination.name === dest.name;
            return (
              <TouchableOpacity
                key={`dest-${idx}`}
                style={[
                  styles.landmarkChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  isSelected && {
                    borderColor: '#16A34A',
                    backgroundColor: '#16A34A15',
                  },
                ]}
                onPress={() => selectLandmark(dest)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={dest.icon}
                  size={14}
                  color={isSelected ? '#16A34A' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.landmarkChipText,
                    { color: isSelected ? '#16A34A' : colors.textPrimary },
                  ]}
                >
                  {dest.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Map with Custom Orange GPS Access Button, Set Button, and Pin */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            id="solo-ride-pinpoint-map"
            key={`map-${origin.lat}-${origin.lng}`}
            title="Dagupan Solo Ride / Visitor Pinpoint Map"
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

        {/* Floating "Set" Confirmation Bar over Map (Appears when destination is chosen) */}
        {!isDestinationSet && pendingPinpoint && (
          <View
            style={[
              styles.floatingSetBar,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.97)',
                borderColor: '#16A34A',
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.pulseGreenDot} />
                <Text style={styles.floatingSetHeader}>Pinpointed Destination</Text>
              </View>
              <Text
                style={[styles.floatingSetTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {pendingPinpoint.name || 'Selected Location'}
              </Text>
              <Text style={[styles.floatingSetSub, { color: colors.textMuted }]}>
                ~{pendingPinpoint.distanceKm || roadDistanceKm} km • Tap "Set" to confirm
              </Text>
            </View>

            <TouchableOpacity
              style={styles.floatingSetBtn}
              onPress={() => handleConfirmSet()}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="check-bold" size={16} color="#FFFFFF" />
              <Text style={styles.floatingSetBtnText}>Set</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Confirmed Destination Tag */}
        {isDestinationSet && (
          <View
            style={[
              styles.confirmedDestBar,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: '#16A34A60',
              },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={15} color="#16A34A" />
            <Text style={[styles.confirmedDestText, { color: colors.textPrimary }]} numberOfLines={1}>
              Destination Set: <Text style={{ fontWeight: '800', color: '#16A34A' }}>{destination.name}</Text>
            </Text>
          </View>
        )}

        {/* Floating Custom GPS Access Button (Using Uploaded Avatar Pin Icon) */}
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          onPress={requestLocation}
          activeOpacity={0.85}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#EA580C" />
          ) : (
            <Image source={GPS_ICON} style={styles.gpsIconImg} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentPadding}>
        {/* Solo Ride / Visitor Ordinance Notice */}
        <View style={[styles.ordinanceBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <MaterialCommunityIcons name="account-arrow-right" size={24} color="#D97706" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.ordinanceTitle, { color: '#92400E' }]}>
              Dagupan City Solo Ride / Visitor Ordinance Tariff (TFRB)
            </Text>
            <Text style={[styles.ordinanceDesc, { color: '#B45309' }]}>
              Base fare ₱15.00 for the first 1.0 km, +₱3.00/km for succeeding distance. Pinpoint anywhere in the city.
            </Text>
          </View>
        </View>

        {/* Real-time Trip Metrics Card */}
        <Card style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metricsHeader}>
            <View>
              <Text style={[styles.metricsHeading, { color: colors.textPrimary }]}>
                Road Route & Live Meter
              </Text>
              <Text style={[styles.metricsSubtitle, { color: colors.textMuted }]}>
                Point-to-point road-aligned distance for solo ride / visitor
              </Text>
            </View>
            <View style={[styles.routingBadge, { backgroundColor: '#D9770615', borderColor: '#D9770650', borderWidth: 1 }]}>
              <MaterialCommunityIcons name="routes" size={13} color="#D97706" />
              <Text style={[styles.routingBadgeText, { color: '#D97706' }]}>Road Aligned</Text>
            </View>
          </View>

          {/* Road Path Summary */}
          {Boolean(roadSummary) && (
            <View style={[styles.roadSummaryRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="directions-fork" size={16} color="#D97706" />
              <Text style={[styles.roadSummaryText, { color: colors.textSecondary }]} numberOfLines={1}>
                {roadSummary}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.metricStatsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Road Distance</Text>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>
                {effectiveDistanceKm} km
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Est. Time</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                ~{roadDurationMins} mins
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Fair Fare</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {formatPeso(computedFare.finalFare)}
              </Text>
            </View>
          </View>
        </Card>

        {/* 20% Discount Toggle Switch */}
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

        {/* Live Tracking Actions */}
        {trackingState === 'idle' ? (
          <TouchableOpacity
            style={[styles.startRideBtn, { backgroundColor: '#D97706' }]}
            onPress={handleStartTracking}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="navigation-variant" size={24} color="#FFFFFF" />
            <Text style={styles.startRideBtnText}>Start Solo Ride / Visitor Live Tracker</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.activeTrackingCard, { backgroundColor: colors.surface, borderColor: '#D97706' }]}>
            <View style={styles.activeTrackingHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.pulseDot} />
                <Text style={[styles.activeTrackingTitle, { color: colors.textPrimary }]}>
                  Live Solo Ride / Visitor Meter Active
                </Text>
              </View>
              <Text style={[styles.timerText, { color: '#D97706' }]}>
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <Text style={[styles.activeTrackingDest, { color: colors.textSecondary }]}>
              Destination: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{destination.name}</Text>
            </Text>

            {/* Proximity & Distance Status Card */}
            <View
              style={[
                styles.proximityCard,
                {
                  backgroundColor: isNearDestination ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.08)',
                  borderColor: isNearDestination ? '#16A34A' : '#D9770640',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isNearDestination ? 'check-circle' : 'map-marker-distance'}
                size={20}
                color={isNearDestination ? '#16A34A' : '#D97706'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.proximityStatusTitle,
                    { color: isNearDestination ? '#16A34A' : colors.textPrimary },
                  ]}
                >
                  {isNearDestination
                    ? 'Within Destination Area (< 150m)'
                    : `Remaining: ~${remainingDistToDestKm.toFixed(2)} km to destination`}
                </Text>
                <Text style={[styles.proximityStatusSub, { color: colors.textMuted }]}>
                  Traveled: {distanceTraveledKm.toFixed(2)} km • Live Tariff: {formatPeso(computedFare.finalFare)}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Stop Ride Early vs Arrived at Destination */}
            <View style={styles.trackingBtnRow}>
              {/* STOP BUTTON: Always pressable to drop off early */}
              <TouchableOpacity
                style={[styles.stopRideBtn, { borderColor: '#EF4444' }]}
                onPress={() => setStopConfirmVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="stop-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.stopRideBtnText}>Stop Ride & Drop Off</Text>
              </TouchableOpacity>

              {/* ARRIVE BUTTON: Disabled/Locked until arrived within 150m of destination */}
              <TouchableOpacity
                style={[
                  styles.arriveBtn,
                  !isNearDestination && styles.arriveBtnDisabled,
                ]}
                onPress={handleArrival}
                disabled={!isNearDestination}
                activeOpacity={0.88}
              >
                <MaterialCommunityIcons
                  name={isNearDestination ? 'check-circle' : 'lock-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.arriveBtnText}>
                  {isNearDestination ? 'Arrived at Destination' : 'Arrived (Locked)'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isNearDestination && (
              <Text style={[styles.lockedWarningText, { color: colors.textMuted }]}>
                🔒 "Arrived" button is locked until you reach {destination.name}. If you are dropping off early, tap "Stop Ride & Drop Off".
              </Text>
            )}
          </View>
        )}

        {/* Anti-Overcharging Legal Grievance Link */}
        <TouchableOpacity
          style={[styles.overchargeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            navigation.navigate('SubmitComplaint', {
              category: 'overcharging',
              subject: `Solo Ride / Visitor overcharging to ${destination.name}`,
              description: `Driver overcharged for solo ride / visitor trip from ${origin.name} to ${destination.name} (${effectiveDistanceKm} km). Official Dagupan City tariff is ${formatPeso(computedFare.finalFare)} but driver demanded excess fare.`,
            });
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon-outline" size={22} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.overchargeCardTitle, { color: colors.textPrimary }]}>
              Charged more than {formatPeso(computedFare.finalFare)}?
            </Text>
            <Text style={[styles.overchargeCardSubtitle, { color: colors.textMuted }]}>
              Tap to report overcharging directly to Dagupan City LGU / POSO
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    height: SCREEN_HEIGHT * 0.40,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#EA580C',
    zIndex: 1100,
  },
  floatingSetBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1100,
  },
  pulseGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  floatingSetHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatingSetTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  floatingSetSub: {
    fontSize: 10,
    marginTop: 1,
  },
  floatingSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    shadowColor: '#16A34A',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingSetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confirmedDestBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    zIndex: 1000,
    maxWidth: '85%',
  },
  confirmedDestText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gpsIconImg: {
    width: 32,
    height: 32,
  },
  contentPadding: {
    padding: SPACING.md,
  },
  ordinanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  ordinanceTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  ordinanceDesc: {
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
  startRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  startRideBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  activeTrackingCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  activeTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  activeTrackingTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
  },
  timerText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  activeTrackingDest: {
    fontSize: 12,
    marginBottom: 12,
  },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  proximityStatusTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  proximityStatusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  trackingBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stopRideBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  stopRideBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  arriveBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  arriveBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.65,
  },
  arriveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  lockedWarningText: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  overchargeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 2,
  },
  overchargeCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  overchargeCardSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  arrivalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  arrivalModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  arrivalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16A34A18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  arrivalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  arrivalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  arrivalReceiptCard: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  receiptFareBig: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  receiptDiscountText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 10,
  },
  arrivalMetaRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  arrivalMetaCol: {
    alignItems: 'center',
  },
  arrivalMetaLabel: {
    fontSize: 10,
  },
  arrivalMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  arrivalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  arrivalHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  arrivalHistoryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  arrivalDoneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  arrivalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default PinpointFareScreen;
