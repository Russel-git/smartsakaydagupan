import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Switch,
  TextInput,
  Alert,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useSharedLocation } from "../../contexts/LocationContext";
import { locationSharingAPI } from "../../api/services";
import { FONTS, SPACING, RADIUS, API_BASE_URL } from "../../utils/constants";
import {
  getInitials,
  calculateDistance,
  formatDistance,
} from "../../utils/helpers";

const DAGUPAN_CENTER = {
  lat: 16.0433,
  lng: 120.3342,
  name: "Dagupan City Plaza",
};

const buildSakayCircleMapHtml = (initLat, initLng) => `
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
    var map = L.map('map', { 
      zoomControl: true,
      preferCanvas: true 
    }).setView([${initLat}, ${initLng}], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    setTimeout(function() { if (map) map.invalidateSize(); }, 200);
    setTimeout(function() { if (map) map.invalidateSize(); }, 600);

    // 1. Accuracy Circle for Commuter GPS
    var commuterCircle = L.circle([${initLat}, ${initLng}], {
      radius: 20,
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

    var commuterMarker = L.marker([${initLat}, ${initLng}], {
      icon: commuterIcon,
      zIndexOffset: 3000
    }).addTo(map);

    function createCommuterPopupHtml(lat, lng, acc) {
      return (
        '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; min-width:180px;">' +
        '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">' +
        '<span style="background:#2563EB; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:3px;">YOU ARE HERE</span>' +
        '<span style="color:#10B981; font-weight:700; font-size:11px;">● LIVE GPS</span>' +
        '</div>' +
        '<div style="font-size:13px; font-weight:800; color:#0f172a;">Your Current Location</div>' +
        '<div style="font-family:monospace; font-size:11px; color:#64748b; margin-top:2px;">' +
        lat.toFixed(5) + '°N, ' + lng.toFixed(5) + '°E (±' + acc + 'm)' +
        '</div>' +
        '<div style="font-size:11px; color:#3b82f6; margin-top:4px;">Dagupan City, Pangasinan</div>' +
        '</div>'
      );
    }

    commuterMarker.bindPopup(createCommuterPopupHtml(${initLat}, ${initLng}, 20));

    // 3. Layer group for SakayCircle Peer Members (allows smooth marker updates without re-rendering HTML)
    var peerMarkersLayer = L.layerGroup().addTo(map);

    // Single entry point used to update the map markers smoothly (no blinking/re-rendering)
    window.updateMap = function (data) {
      if (!data) return;

      // Update commuter live position smoothly
      if (data.user && typeof data.user.lat === 'number' && typeof data.user.lng === 'number') {
        var uLat = data.user.lat;
        var uLng = data.user.lng;
        var uAcc = Math.round(data.user.accuracy || 20);
        commuterMarker.setLatLng([uLat, uLng]);
        commuterCircle.setLatLng([uLat, uLng]);
        commuterCircle.setRadius(Math.max(uAcc, 20));
        commuterMarker.setPopupContent(createCommuterPopupHtml(uLat, uLng, uAcc));

        if (data.recenter) {
          map.setView([uLat, uLng], 15, { animate: true });
          commuterMarker.openPopup();
        }
      }

      // Update SakayCircle peer markers smoothly
      if ('peers' in data && Array.isArray(data.peers)) {
        peerMarkersLayer.clearLayers();
        var bounds = [];
        if (data.user && typeof data.user.lat === 'number') {
          bounds.push([data.user.lat, data.user.lng]);
        }

        var apiHost = data.apiHost || '';
        data.peers.forEach(function(peer) {
          if (typeof peer.lat !== 'number' || typeof peer.lng !== 'number') return;
          bounds.push([peer.lat, peer.lng]);

          var avatarSrc = peer.profilePhoto
            ? (peer.profilePhoto.indexOf('http') === 0 ? peer.profilePhoto : apiHost + peer.profilePhoto)
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
            (peer.name ? peer.name.split(' ')[0] : 'Member') +
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
            '<div style="font-size:13px; font-weight:800; color:#0f172a;">' + (peer.name || 'Member') + '</div>' +
            '<div style="font-size:11px; color:#64748b; margin-top:2px;">' + (peer.email || '') + '</div>' +
            '<div style="font-family:monospace; font-size:10px; color:#8b5cf6; margin-top:4px;">' +
            peer.lat.toFixed(5) + '°N, ' + peer.lng.toFixed(5) + '°E' +
            '</div>' +
            '</div>';

          var m = L.marker([peer.lat, peer.lng], { icon: peerIcon, zIndexOffset: 2500 })
            .bindPopup(peerPopupHtml);
          peerMarkersLayer.addLayer(m);
        });

        if (data.fitAll && bounds.length > 1) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
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

const SakayCircleScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useFeedback();
  const { location: sharedLocation } = useSharedLocation();

  const iframeRef = useRef(null);
  const webViewRef = useRef(null);
  const isMapLoadedRef = useRef(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const isLandscape = windowWidth > windowHeight;

  // Map view toggle: normal split view vs expanded full map
  const [isFullMap, setIsFullMap] = useState(false);

  // Live Location & Peer Sharing states
  const [commuterLocation, setCommuterLocation] = useState({
    lat: sharedLocation?.lat || DAGUPAN_CENTER.lat,
    lng: sharedLocation?.lng || DAGUPAN_CENTER.lng,
    accuracy: sharedLocation?.accuracy || 25,
  });

  const initialCenterRef = useRef({
    lat: sharedLocation?.lat || DAGUPAN_CENTER.lat,
    lng: sharedLocation?.lng || DAGUPAN_CENTER.lng,
  });

  const [peers, setPeers] = useState([]);
  const [loadingPeers, setLoadingPeers] = useState(false);

  // Connections state
  const [loadingConn, setLoadingConn] = useState(false);
  const [outgoing, setOutgoing] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [activeCount, setActiveCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [existingConn, setExistingConn] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const mapHtml = useMemo(() => {
    const c = initialCenterRef.current;
    return buildSakayCircleMapHtml(c.lat, c.lng);
  }, []);

  const sendToMap = useCallback((payload) => {
    try {
      const dataWithHost = {
        apiHost: API_BASE_URL.replace(/\/api$/, ""),
        ...payload,
      };
      if (Platform.OS === "web") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ type: "UPDATE_MAP", ...dataWithHost }),
          "*",
        );
      } else {
        webViewRef.current?.injectJavaScript(
          `if (window.updateMap) { window.updateMap(${JSON.stringify(dataWithHost)}); } true;`,
        );
      }
    } catch (err) {
      console.warn("sendToMap error:", err);
    }
  }, []);

  // Keep commuterLocation synced with sharedLocation
  useEffect(() => {
    if (
      sharedLocation &&
      Number.isFinite(sharedLocation.lat) &&
      Number.isFinite(sharedLocation.lng)
    ) {
      setCommuterLocation({
        lat: sharedLocation.lat,
        lng: sharedLocation.lng,
        accuracy: sharedLocation.accuracy || 20,
      });
    }
  }, [sharedLocation]);

  const handleMapLoaded = useCallback(() => {
    isMapLoadedRef.current = true;
    sendToMap({
      user: commuterLocation,
      peers: peers,
      fitAll: peers.length > 0,
    });
  }, [commuterLocation, peers, sendToMap]);

  useEffect(() => {
    if (isMapLoadedRef.current) {
      sendToMap({
        user: commuterLocation,
        peers: peers,
      });
    }
  }, [
    commuterLocation.lat,
    commuterLocation.lng,
    commuterLocation.accuracy,
    peers,
    sendToMap,
  ]);

  // Fetch peer live locations from API
  const fetchPeerLocations = async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoadingPeers(true);
      const res = await locationSharingAPI.getPeerLocations();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPeers(res.data.data);
      }
    } catch (e) {
      // transient network error ignore
    } finally {
      setLoadingPeers(false);
    }
  };

  // Fetch connections list (incoming, outgoing, active)
  const fetchConnections = async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoadingConn(true);
      const res = await locationSharingAPI.getConnections();
      if (res.data?.success && res.data?.data) {
        setOutgoing(res.data.data.outgoing || []);
        setIncoming(res.data.data.incoming || []);
        setActiveCount(res.data.data.activeCount || 0);
      }
    } catch (e) {
      console.warn("Error fetching SakayCircle connections:", e);
    } finally {
      setLoadingConn(false);
    }
  };

  // Periodic synchronization (updates my location and fetches peer updates)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setPeers([]);
      setOutgoing([]);
      setIncoming([]);
      setActiveCount(0);
      return;
    }

    if (commuterLocation.lat && commuterLocation.lng) {
      locationSharingAPI
        .updateMyLocation({
          lat: commuterLocation.lat,
          lng: commuterLocation.lng,
        })
        .catch(() => {});
    }

    fetchPeerLocations();
    fetchConnections();

    const interval = setInterval(() => {
      if (commuterLocation.lat && commuterLocation.lng) {
        locationSharingAPI
          .updateMyLocation({
            lat: commuterLocation.lat,
            lng: commuterLocation.lng,
          })
          .catch(() => {});
      }
      fetchPeerLocations();
    }, 8000);

    return () => clearInterval(interval);
  }, [commuterLocation.lat, commuterLocation.lng, isAuthenticated, user]);

  // Copy shareable ID
  const handleCopyId = async () => {
    const idToCopy = user?._id || user?.email || "";
    if (!idToCopy) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(idToCopy);
      }
      showSuccess(
        "ID Copied",
        "Your SakayCircle Commuter ID has been copied to clipboard.",
      );
    } catch (e) {
      showInfo("SakayCircle ID", `Your ID: ${idToCopy}`);
    }
  };

  // Search user to request access
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      showError("Empty Query", "Enter a User ID, name, or email to search.");
      return;
    }
    if (
      user &&
      (q.toLowerCase() === String(user.email).toLowerCase() ||
        q === String(user._id))
    ) {
      showError("Self Search", "You cannot add yourself to SakayCircle.");
      return;
    }

    setSearching(true);
    setSearchedUser(null);
    setExistingConn(null);
    try {
      const res = await locationSharingAPI.searchUser(q);
      if (res.data?.success) {
        setSearchedUser(res.data.data.user);
        setExistingConn(res.data.data.existingConnection);
      }
    } catch (e) {
      showError(
        "User Not Found",
        e.response?.data?.message ||
          "No commuter found with that ID, name, or email.",
      );
    } finally {
      setSearching(false);
    }
  };

  // Send location request to searched user
  const handleSendRequest = async () => {
    if (!searchedUser) return;
    if (activeCount >= 10) {
      showError(
        "Limit Reached",
        "You can only connect with up to 10 commuters in SakayCircle. Remove an existing connection to continue.",
      );
      return;
    }

    try {
      setActionLoadingId("search-request");
      const res = await locationSharingAPI.sendRequest(searchedUser._id);
      if (res.data?.success) {
        showSuccess(
          "Request Sent",
          res.data.message ||
            `Location access request sent to ${searchedUser.firstName} ${searchedUser.lastName}.`,
        );
        setSearchedUser(null);
        setSearchQuery("");
        await fetchConnections();
        await fetchPeerLocations();
      }
    } catch (e) {
      showError(
        "Request Failed",
        e.response?.data?.message || "Could not send SakayCircle request.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Respond to request (accept, decline, block)
  const handleRespond = async (id, action) => {
    try {
      setActionLoadingId(id);
      const res = await locationSharingAPI.respondToRequest(id, action);
      if (res.data?.success) {
        showSuccess("Updated", `Request ${action}ed.`);
        if (searchedUser) {
          setSearchedUser(null);
          setSearchQuery("");
        }
        await fetchConnections();
        await fetchPeerLocations();
      }
    } catch (e) {
      showError("Failed", e.response?.data?.message || "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle location sharing with a peer
  const handleToggleSharing = async (id, currentVal) => {
    try {
      setActionLoadingId(id);
      const res = await locationSharingAPI.toggleSharing(id, !currentVal);
      if (res.data?.success) {
        showInfo(
          "Sharing Updated",
          !currentVal
            ? "Location access turned ON."
            : "Location access turned OFF.",
        );
        await fetchConnections();
        await fetchPeerLocations();
      }
    } catch (e) {
      showError(
        "Failed",
        e.response?.data?.message || "Could not update sharing.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove connection or block
  const handleRemoveOrBlock = async (id, block = false) => {
    const message = block
      ? "Are you sure you want to block this user from SakayCircle?"
      : "Are you sure you want to remove this connection from your SakayCircle?";

    const performAction = async () => {
      try {
        setActionLoadingId(id);
        const res = await locationSharingAPI.removeConnection(id, block);
        if (res.data?.success) {
          showSuccess(
            "Success",
            block ? "User blocked." : "Connection removed.",
          );
          await fetchConnections();
          await fetchPeerLocations();
        }
      } catch (e) {
        showError("Failed", e.response?.data?.message || "Action failed.");
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        await performAction();
      }
      return;
    }

    Alert.alert(block ? "Block User" : "Remove Connection", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: block ? "Block" : "Remove",
        style: "destructive",
        onPress: performAction,
      },
    ]);
  };

  // Render peer avatar
  const renderAvatar = (targetUser, size = 38) => {
    const photo = targetUser?.profilePhoto;
    if (photo) {
      const uri = photo.startsWith("http")
        ? photo
        : `${API_BASE_URL.replace(/\/api$/, "")}${photo}`;
      return (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }
    return (
      <View
        style={[
          styles.peerAvatarFallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#8B5CF6",
          },
        ]}
      >
        <Text
          style={[
            styles.peerAvatarInitials,
            { fontSize: Math.max(11, size * 0.38) },
          ]}
        >
          {getInitials(targetUser?.firstName, targetUser?.lastName)}
        </Text>
      </View>
    );
  };

  // Calculate peer distance from user
  const getPeerDistanceText = (peerLat, peerLng) => {
    if (
      typeof peerLat !== "number" ||
      typeof peerLng !== "number" ||
      !commuterLocation?.lat ||
      !commuterLocation?.lng
    ) {
      return null;
    }
    const dist = calculateDistance(
      commuterLocation.lat,
      commuterLocation.lng,
      peerLat,
      peerLng,
    );
    return formatDistance(dist);
  };

  const pendingIncoming = incoming.filter((c) => c.status === "pending");
  const pendingOutgoing = outgoing.filter((c) => c.status === "pending");
  const acceptedOutgoing = outgoing.filter((c) => c.status === "accepted");
  const acceptedIncoming = incoming.filter((c) => c.status === "accepted");
  const totalActiveCircle = acceptedOutgoing.length + acceptedIncoming.length;

  const mapHeight = isFullMap
    ? "100%"
    : isLandscape
      ? Math.max(220, windowHeight * 0.42)
      : isTablet
        ? Math.min(380, Math.max(260, windowHeight * 0.38))
        : Math.min(300, Math.max(220, windowHeight * 0.32));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. TOP STATUS BAR: Live GPS, Coordinates, Active Peer Count & Controls */}
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.statusLeft}>
          <View style={styles.pulseDot} />
          <Text
            style={[styles.statusGpsText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            Live GPS Active (±{Math.round(commuterLocation.accuracy || 20)}m)
          </Text>
          <View
            style={[
              styles.coordBadge,
              {
                backgroundColor: isDark
                  ? "rgba(139, 92, 246, 0.15)"
                  : "#F5F3FF",
                borderColor: "#C4B5FD",
              },
            ]}
          >
            <Text style={styles.coordBadgeText}>
              {commuterLocation.lat.toFixed(4)}°N,{" "}
              {commuterLocation.lng.toFixed(4)}°E
            </Text>
          </View>
        </View>

        <View style={styles.statusRight}>
          {/* Active Circle Badge */}
          <View
            style={[
              styles.circleCounterBadge,
              {
                backgroundColor: isDark ? "rgba(139, 92, 246, 0.2)" : "#EDE9FE",
                borderColor: "#8B5CF6",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={14}
              color="#8B5CF6"
            />
            <Text style={styles.circleCounterText}>{peers.length} Live</Text>
          </View>

          {/* Map Recenter Button (updates map view smoothly via updateMap without reloading HTML) */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              sendToMap({
                user: commuterLocation,
                peers: peers,
                recenter: true,
              });
              fetchPeerLocations();
              fetchConnections();
            }}
            activeOpacity={0.7}
            accessibilityLabel="Recenter SakayCircle Map"
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={18}
              color="#8B5CF6"
            />
          </TouchableOpacity>

          {/* Toggle Full Map View Button */}
          <TouchableOpacity
            style={[
              styles.mapToggleBtn,
              {
                backgroundColor: isFullMap
                  ? "#8B5CF6"
                  : isDark
                    ? "rgba(139, 92, 246, 0.18)"
                    : "#EDE9FE",
                borderColor: isFullMap ? "#8B5CF6" : "#C4B5FD",
              },
            ]}
            onPress={() => setIsFullMap(!isFullMap)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isFullMap ? "arrow-collapse" : "arrow-expand"}
              size={14}
              color={isFullMap ? "#FFFFFF" : "#8B5CF6"}
            />
            <Text
              style={[
                styles.mapToggleText,
                { color: isFullMap ? "#FFFFFF" : "#8B5CF6" },
              ]}
            >
              {isFullMap ? "Details" : "Full Map"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DEDICATED SAKAYCIRCLE MAP — RENDERED ONCE, NO BLINKING/REMOUNTING */}
      <View
        style={[
          styles.mapWrapper,
          {
            height: isFullMap ? "100%" : mapHeight,
            flex: isFullMap ? 1 : undefined,
          },
        ]}
      >
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef}
            title="SakayCircle Live Peer Map"
            srcDoc={mapHtml}
            onLoad={handleMapLoaded}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            onLoadEnd={handleMapLoaded}
            style={{ flex: 1, backgroundColor: "#0f172a" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>

      {/* 3. DETAILS / MANAGEMENT PANEL (Collapsible when isFullMap is false) */}
      {!isFullMap && (
        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={styles.detailsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Unauthenticated Guest Banner */}
          {!isAuthenticated || !user ? (
            <View
              style={[
                styles.authPromptCard,
                {
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.12)"
                    : "#F5F3FF",
                  borderColor: "#C4B5FD",
                },
              ]}
            >
              <View style={styles.authPromptIconWrap}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={32}
                  color="#8B5CF6"
                />
              </View>
              <Text
                style={[styles.authPromptTitle, { color: colors.textPrimary }]}
              >
                Join SakayCircle
              </Text>
              <Text
                style={[styles.authPromptSub, { color: colors.textSecondary }]}
              >
                Connect with family, peers, and trusted commuters to share live
                GPS locations and travel safely together along Dagupan routes.
              </Text>
              <TouchableOpacity
                style={styles.signInCtaBtn}
                onPress={() => {
                  if (navigation?.navigate) {
                    navigation.navigate("Account");
                  }
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="login"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.signInCtaBtnText}>
                  Sign In to Access SakayCircle
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Stats Overview Pill Row */}
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: "#8B5CF6" }]}>
                    {activeCount}/10
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Circle Quota
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: "#10B981" }]}>
                    {peers.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Live on Map
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                    {pendingIncoming.length + pendingOutgoing.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Pending
                  </Text>
                </View>
              </View>

              {/* CARD 1: My Commuter Share ID */}
              <View
                style={[
                  styles.myIdCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(139, 92, 246, 0.12)"
                      : "#F5F3FF",
                    borderColor: "#C4B5FD",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.myIdHeaderRow}>
                    <Text style={styles.myIdLabel}>
                      YOUR SAKAYCIRCLE COMMUTER ID
                    </Text>
                    <TouchableOpacity
                      onPress={handleCopyId}
                      style={styles.copyIdBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="content-copy"
                        size={12}
                        color="#8B5CF6"
                      />
                      <Text style={styles.copyIdText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.myIdValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                    selectable
                  >
                    {user?._id || user?.email}
                  </Text>
                  <Text style={styles.myIdHint}>
                    Share this ID or email with friends and trusted peers so
                    they can connect with you.
                  </Text>
                </View>
              </View>

              {/* CARD 2: Search & Add Member */}
              <View
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.sectionHeading, { color: colors.textPrimary }]}
                >
                  Request Access to Commuter
                </Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[
                      styles.searchInput,
                      {
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder="Enter User ID, email, or name..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                  <TouchableOpacity
                    style={[styles.searchBtn, { backgroundColor: "#8B5CF6" }]}
                    onPress={handleSearch}
                    disabled={searching}
                    activeOpacity={0.8}
                  >
                    {searching ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <MaterialCommunityIcons
                        name="magnify"
                        size={20}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Search Result Card */}
                {searchedUser && (
                  <View
                    style={[
                      styles.resultCard,
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
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      {renderAvatar(searchedUser)}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.resultName,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {searchedUser.firstName} {searchedUser.lastName}
                        </Text>
                        <Text
                          style={[
                            styles.resultEmail,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {searchedUser.email}
                        </Text>
                      </View>
                    </View>

                    {existingConn?.status === "accepted" ? (
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusPillActiveText}>
                          Connected
                        </Text>
                      </View>
                    ) : existingConn?.status === "pending" ? (
                      String(existingConn?.recipient) === String(user?._id) ? (
                        <TouchableOpacity
                          style={[
                            styles.requestActionBtn,
                            { backgroundColor: "#10B981" },
                          ]}
                          onPress={() =>
                            handleRespond(existingConn._id, "accept")
                          }
                          disabled={actionLoadingId === existingConn._id}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.requestActionBtnText}>
                            Accept
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.statusPillPending}>
                          <Text style={styles.statusPillPendingText}>
                            Pending
                          </Text>
                        </View>
                      )
                    ) : existingConn?.status === "blocked" ? (
                      <View style={styles.statusPillBlocked}>
                        <Text style={styles.statusPillBlockedText}>
                          Blocked
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.requestActionBtn,
                          {
                            backgroundColor:
                              activeCount >= 10 ? "#9CA3AF" : "#8B5CF6",
                          },
                        ]}
                        onPress={handleSendRequest}
                        disabled={
                          actionLoadingId === "search-request" ||
                          activeCount >= 10
                        }
                      >
                        {actionLoadingId === "search-request" ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="account-plus"
                              size={14}
                              color="#FFFFFF"
                            />
                            <Text style={styles.requestActionBtnText}>
                              Add to Circle
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* CARD 3: Incoming Requests (if any) */}
              {pendingIncoming.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeadingRow}>
                    <Text style={[styles.sectionHeading, { color: "#D97706" }]}>
                      Incoming Requests ({pendingIncoming.length})
                    </Text>
                  </View>

                  {pendingIncoming.map((item) => (
                    <View
                      key={item._id}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {renderAvatar(item.requester)}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.itemName,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {item.requester?.firstName}{" "}
                            {item.requester?.lastName}
                          </Text>
                          <Text
                            style={[
                              styles.itemSub,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Wants to connect with you on SakayCircle
                          </Text>
                        </View>
                      </View>

                      <View style={styles.incomingActionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.smallBtn,
                            { backgroundColor: "#10B981" },
                          ]}
                          onPress={() => handleRespond(item._id, "accept")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.smallBtnText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.smallBtn,
                            { backgroundColor: "#6B7280" },
                          ]}
                          onPress={() => handleRespond(item._id, "decline")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.smallBtnText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.smallBtn,
                            { backgroundColor: "#EF4444" },
                          ]}
                          onPress={() => handleRespond(item._id, "block")}
                          disabled={actionLoadingId === item._id}
                        >
                          <MaterialCommunityIcons
                            name="shield-lock"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text style={styles.smallBtnText}>Block</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* CARD 4: Connected Circle Members */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeadingRow}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Connected Members on Map ({totalActiveCircle})
                  </Text>
                  {loadingConn && (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  )}
                </View>

                {totalActiveCircle === 0 ? (
                  <View
                    style={[
                      styles.emptyBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={38}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[styles.emptyTitle, { color: colors.textPrimary }]}
                    >
                      No Connected Members Yet
                    </Text>
                    <Text
                      style={[styles.emptyText, { color: colors.textMuted }]}
                    >
                      Search a commuter's User ID or email above, or share your
                      SakayCircle ID with friends to see each other's live
                      transit locations!
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Outgoing accepted connections */}
                    {acceptedOutgoing.map((item) => {
                      const peer = item.recipient;
                      const isSharingOn = item.isRequesterSharing;
                      // Match live peer coordinates if available
                      const livePeer = peers.find(
                        (p) => String(p.id) === String(peer?._id),
                      );
                      const distanceText = livePeer
                        ? getPeerDistanceText(livePeer.lat, livePeer.lng)
                        : null;

                      return (
                        <View
                          key={item._id}
                          style={[
                            styles.itemCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              flex: 1,
                            }}
                          >
                            {renderAvatar(peer)}
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.itemName,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {peer?.firstName} {peer?.lastName}
                              </Text>
                              <Text
                                style={[
                                  styles.itemSub,
                                  {
                                    color: livePeer
                                      ? "#10B981"
                                      : colors.textMuted,
                                  },
                                ]}
                              >
                                {livePeer
                                  ? `● Live on map ${distanceText ? `(${distanceText} away)` : ""}`
                                  : "● Profile connected"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.activePeerControls}>
                            <View style={styles.toggleRow}>
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {isSharingOn ? "Sharing: ON" : "Sharing: OFF"}
                              </Text>
                              <Switch
                                value={isSharingOn}
                                onValueChange={() =>
                                  handleToggleSharing(item._id, isSharingOn)
                                }
                                trackColor={{
                                  false: "#D1D5DB",
                                  true: "#C4B5FD",
                                }}
                                thumbColor={isSharingOn ? "#8B5CF6" : "#9CA3AF"}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveOrBlock(item._id, false)
                              }
                              style={styles.iconActionBtn}
                              accessibilityLabel="Remove Connection"
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={18}
                                color="#EF4444"
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveOrBlock(item._id, true)
                              }
                              style={styles.iconActionBtn}
                              accessibilityLabel="Block User"
                            >
                              <MaterialCommunityIcons
                                name="shield-lock-outline"
                                size={18}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    {/* Incoming accepted connections */}
                    {acceptedIncoming.map((item) => {
                      const peer = item.requester;
                      const isSharingOn = item.isRecipientSharing;
                      const livePeer = peers.find(
                        (p) => String(p.id) === String(peer?._id),
                      );
                      const distanceText = livePeer
                        ? getPeerDistanceText(livePeer.lat, livePeer.lng)
                        : null;

                      return (
                        <View
                          key={item._id}
                          style={[
                            styles.itemCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              flex: 1,
                            }}
                          >
                            {renderAvatar(peer)}
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.itemName,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {peer?.firstName} {peer?.lastName}
                              </Text>
                              <Text
                                style={[
                                  styles.itemSub,
                                  {
                                    color: livePeer
                                      ? "#10B981"
                                      : colors.textMuted,
                                  },
                                ]}
                              >
                                {livePeer
                                  ? `● Live on map ${distanceText ? `(${distanceText} away)` : ""}`
                                  : "● Profile connected"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.activePeerControls}>
                            <View style={styles.toggleRow}>
                              <Text
                                style={[
                                  styles.toggleLabel,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {isSharingOn ? "Sharing: ON" : "Sharing: OFF"}
                              </Text>
                              <Switch
                                value={isSharingOn}
                                onValueChange={() =>
                                  handleToggleSharing(item._id, isSharingOn)
                                }
                                trackColor={{
                                  false: "#D1D5DB",
                                  true: "#C4B5FD",
                                }}
                                thumbColor={isSharingOn ? "#8B5CF6" : "#9CA3AF"}
                              />
                            </View>

                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveOrBlock(item._id, false)
                              }
                              style={styles.iconActionBtn}
                              accessibilityLabel="Remove Connection"
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={18}
                                color="#EF4444"
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveOrBlock(item._id, true)
                              }
                              style={styles.iconActionBtn}
                              accessibilityLabel="Block User"
                            >
                              <MaterialCommunityIcons
                                name="shield-lock-outline"
                                size={18}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </View>

              {/* CARD 5: Pending Outgoing Requests */}
              {pendingOutgoing.length > 0 && (
                <View style={styles.sectionWrap}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Pending Outgoing Requests ({pendingOutgoing.length})
                  </Text>
                  {pendingOutgoing.map((item) => (
                    <View
                      key={item._id}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          flex: 1,
                        }}
                      >
                        {renderAvatar(item.recipient)}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.itemName,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {item.recipient?.firstName}{" "}
                            {item.recipient?.lastName}
                          </Text>
                          <Text style={[styles.itemSub, { color: "#F59E0B" }]}>
                            Awaiting response...
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveOrBlock(item._id, false)}
                        style={styles.cancelRequestBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelRequestText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 8,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    overflow: "hidden",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  statusGpsText: {
    fontSize: 11,
    fontWeight: "700",
  },
  coordBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  coordBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  circleCounterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  circleCounterText: {
    color: "#8B5CF6",
    fontSize: 11,
    fontWeight: "700",
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  mapToggleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  mapWrapper: {
    width: "100%",
    position: "relative",
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  authPromptCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center",
    marginVertical: SPACING.sm,
  },
  authPromptIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  authPromptTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "800",
    marginBottom: 6,
  },
  authPromptSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  signInCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  signInCtaBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  myIdCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  myIdHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  myIdLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8B5CF6",
    letterSpacing: 0.5,
  },
  copyIdBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  copyIdText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8B5CF6",
  },
  myIdValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginBottom: 3,
  },
  myIdHint: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
  },
  searchCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: FONTS.sizes.sm,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 6,
  },
  resultName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  resultEmail: {
    fontSize: 11,
  },
  requestActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  requestActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPillActive: {
    backgroundColor: "#10B98120",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  statusPillActiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  statusPillPending: {
    backgroundColor: "#F59E0B20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  statusPillPendingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  statusPillBlocked: {
    backgroundColor: "#EF444420",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  statusPillBlockedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  sectionWrap: {
    marginBottom: SPACING.md,
  },
  itemCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  incomingActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  smallBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  activePeerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(156,163,175,0.2)",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: "auto",
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconActionBtn: {
    padding: 6,
  },
  cancelRequestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: "#EF444420",
  },
  cancelRequestText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  peerAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  peerAvatarInitials: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  emptyBox: {
    padding: 24,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});

export default SakayCircleScreen;
