import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSharedLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { routesAPI, terminalsAPI } from '../../api/services';
import { getMunicipality } from '../../utils/storage';
import { RADIUS, SHADOWS } from '../../utils/constants';

const MUNICIPALITY_CENTROIDS = {
  Dagupan: { lat: 16.0433, lng: 120.3397, name: 'Dagupan City' },
  Calasiao: { lat: 16.0125, lng: 120.3586, name: 'Calasiao' },
  Binmaley: { lat: 16.0272, lng: 120.2686, name: 'Binmaley' },
  Lingayen: { lat: 16.0216, lng: 120.2319, name: 'Lingayen' },
  Mangaldan: { lat: 16.0694, lng: 120.4022, name: 'Mangaldan' },
};

/**
 * HomeMapWidget — compact Leaflet map embedded in the Home Screen.
 * Shows live GPS location, jeepney route polylines, and terminal pins.
 * Removes fixed Dagupan dummy pin; user marker only displays when actual GPS is available.
 */
const HomeMapWidget = ({ navigation, height = 240, municipality: propMuni }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { location: sharedLocation } = useSharedLocation();
  const [activeMuni, setActiveMuni] = useState(propMuni || user?.municipality || 'Dagupan');
  const [routes, setRoutes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const iframeRef = useRef(null);
  const webViewRef = useRef(null);

  // Sync propMuni when passed from parent screen
  useEffect(() => {
    if (propMuni) {
      setActiveMuni(propMuni);
    }
  }, [propMuni]);

  // Load active municipality from storage
  useEffect(() => {
    (async () => {
      const savedMuni = await getMunicipality();
      const current = (propMuni || savedMuni || user?.municipality || 'Dagupan').trim();
      setActiveMuni(current);
    })();
  }, [user?.municipality, propMuni]);

  // Fetch routes & terminals for active municipality
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [rRes, tRes] = await Promise.allSettled([
          routesAPI.getAllRoutes({ municipality: activeMuni }),
          terminalsAPI.getAll({ municipality: activeMuni }),
        ]);
        if (isMounted) {
          if (rRes.status === 'fulfilled') setRoutes(rRes.value.data.data || []);
          if (tRes.status === 'fulfilled') setTerminals(tRes.value.data.data || []);
        }
      } catch (_) {}
    };
    load();
    return () => { isMounted = false; };
  }, [activeMuni]);

  const isRealUserLocation = Boolean(
    sharedLocation && sharedLocation.isReal && sharedLocation.lat != null && sharedLocation.lng != null
  );
  const userLat = isRealUserLocation ? sharedLocation.lat : null;
  const userLng = isRealUserLocation ? sharedLocation.lng : null;

  const centroid = MUNICIPALITY_CENTROIDS[activeMuni] || MUNICIPALITY_CENTROIDS.Dagupan;
  const centerLat = userLat != null ? userLat : centroid.lat;
  const centerLng = userLng != null ? userLng : centroid.lng;

  const locationLabel = isRealUserLocation ? 'Location Active' : (centroid.name || activeMuni);

  const pushLocationToMap = (loc) => {
    if (!loc || !loc.isReal || loc.lat == null || loc.lng == null) return;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          type: 'UPDATE_USER_LOCATION',
          lat: loc.lat,
          lng: loc.lng,
        }),
        '*',
      );
    } else {
      webViewRef.current?.injectJavaScript(
        `window.updateUserPosition && window.updateUserPosition(${loc.lat}, ${loc.lng}); true;`,
      );
    }
  };

  useEffect(() => {
    if (sharedLocation && sharedLocation.isReal) {
      pushLocationToMap(sharedLocation);
    }
  }, [sharedLocation?.lat, sharedLocation?.lng, sharedLocation?.isReal]);

  const routesJson = useMemo(() => JSON.stringify(
    routes.map((r) => ({
      id: r._id,
      name: r.name,
      code: r.code,
      category: r.category,
      path: r.path || [],
      startPoint: r.startPoint,
      endPoint: r.endPoint,
      waypoints: r.waypoints || [],
    }))
  ), [routes]);

  const terminalsJson = useMemo(() => JSON.stringify(
    terminals.map((t) => ({
      name: t.name,
      lat: t.location?.coordinates?.[1] ?? t.latitude ?? t.lat,
      lng: t.location?.coordinates?.[0] ?? t.longitude ?? t.lng,
      type: t.type,
    }))
  ), [terminals]);

  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:#f5f6fa; }
    .leaflet-control-zoom { display:none; }
    .leaflet-control-attribution { font-size:8px !important; opacity:0.5; }

    /* Pulsating location beacon */
    .beacon-wrap { position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; }
    .pulse-ring {
      position:absolute; width:100%; height:100%; border-radius:50%;
      background:rgba(249,115,22,0.35);
      animation:pulse 2s cubic-bezier(0.2,0.8,0.4,1) infinite;
    }
    .pulse-ring-2 {
      position:absolute; width:100%; height:100%; border-radius:50%;
      border:2px solid rgba(249,115,22,0.5);
      animation:pulse 2s cubic-bezier(0.2,0.8,0.4,1) infinite 0.6s;
    }
    .core-dot {
      position:relative; z-index:2;
      width:16px; height:16px; border-radius:50%;
      background:#f97316; border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4), 0 0 10px rgba(249,115,22,0.6);
    }
    @keyframes pulse {
      0%   { transform:scale(0.5); opacity:0.9; }
      75%  { transform:scale(2.0); opacity:0.1; }
      100% { transform:scale(2.4); opacity:0; }
    }

    /* Locate-me FAB */
    #locateBtn {
      position:absolute; right:10px; bottom:10px; z-index:1000;
      width:38px; height:38px; border-radius:50%;
      background:#f97316; color:#fff; font-size:17px;
      display:flex; align-items:center; justify-content:center;
      border:none; cursor:pointer;
      box-shadow:0 3px 10px rgba(249,115,22,0.5);
    }
    .leaflet-popup-content-wrapper { border-radius:10px; font-size:12px; }
  </style>
</head>
<body>
<div id="map"></div>
<button id="locateBtn" title="Re-center">🎯</button>
<script>
  var centerLat = ${centerLat}, centerLng = ${centerLng};
  var map = L.map('map', { zoomControl:false, attributionControl:true })
             .setView([centerLat, centerLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OSM', maxZoom:19
  }).addTo(map);

  /* ---- User beacon (ONLY shown when user location is truly available!) ---- */
  var beaconIcon = L.divIcon({
    className:'',
    html:'<div class="beacon-wrap"><div class="pulse-ring"></div><div class="pulse-ring-2"></div><div class="core-dot"></div></div>',
    iconSize:[32,32], iconAnchor:[16,16]
  });

  var marker = null;
  var circle = null;
  var hasInitialRealUser = ${isRealUserLocation ? "true" : "false"};

  function updateUserPosition(lat, lng) {
    if (lat == null || lng == null) return;
    if (!marker) {
      circle = L.circle([lat, lng], {
        radius:40, color:'#f97316', fillColor:'#f97316', fillOpacity:0.15, weight:1
      }).addTo(map);
      marker = L.marker([lat, lng], { icon:beaconIcon, zIndexOffset:3000 }).addTo(map);
    } else {
      marker.setLatLng([lat, lng]);
      if (circle) circle.setLatLng([lat, lng]);
    }
  }

  if (hasInitialRealUser) {
    updateUserPosition(${userLat !== null ? userLat : "null"}, ${userLng !== null ? userLng : "null"});
  }

  /* ---- Live GPS watch (only plots actual coordinates!) ---- */
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(function(p){
      if (p && p.coords) {
        updateUserPosition(p.coords.latitude, p.coords.longitude);
      }
    }, null, { enableHighAccuracy:true, timeout:12000, maximumAge:5000 });
  }

  /* ---- Web postMessage bridge ---- */
  window.addEventListener('message', function(e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (d && (d.type === 'UPDATE_USER_LOCATION' || d.type === 'UPDATE_COMMUTER_LOCATION')) {
        updateUserPosition(d.lat, d.lng);
      }
    } catch(err) {}
  });

  /* ---- Locate btn ---- */
  document.getElementById('locateBtn').onclick = function(){
    if (marker) {
      map.setView(marker.getLatLng(), 15, { animate:true });
    } else {
      map.setView([centerLat, centerLng], 14, { animate:true });
    }
  };

  /* ---- Route colour map ---- */
  var routeColorMap = {
    'CSI_LUCAO':'#f97316','DOWNTOWN':'#8B5CF6',
    'CALASIAO':'#22c55e','BONUAN_TONDALIGAN':'#ea6c0a',
    'BOLOSAN_HIGHWAY':'#f59e0b','SALISAY_BOLOSAN_OLD_ROAD':'#ec4899',
    'BONUAN_BINLOC':'#0D9488',
    'SAN_FABIAN_MANGALDAN_DAGUPAN':'#0284C7',
    'LINGAYEN_BINMALEY_DAGUPAN':'#4F46E5'
  };

  /* ---- Render jeepney routes ---- */
  var routes = ${routesJson};
  routes.forEach(function(r){
    var color = routeColorMap[r.code] || (r.category==='city'?'#f97316':'#22c55e');
    var pts=[];
    if(r.path && r.path.length>0){
      pts=r.path.map(function(p){return[p.lat,p.lng];});
    } else if(r.startPoint && r.endPoint){
      pts=[[r.startPoint.lat,r.startPoint.lng]].concat(
        (r.waypoints||[]).map(function(w){return[w.lat,w.lng];}),
        [[r.endPoint.lat,r.endPoint.lng]]
      );
    }
    if(pts.length>0){
      L.polyline(pts,{color:color,weight:4,opacity:0.9,lineJoin:'round'})
       .bindPopup('<b style="color:'+color+'">🚐 '+r.name+'</b>')
       .addTo(map);
    }
  });

  /* ---- Terminal pins ---- */
  var terminals = ${terminalsJson};
  var typeEmojis = {bus:'🚌',jeepney:'🚐',solo_ride:'🚗',tricycle:'🚗',multimodal:'🏢'};
  var typeColors = {bus:'#3b82f6',jeepney:'#22c55e',solo_ride:'#f59e0b',tricycle:'#f59e0b',multimodal:'#8B5CF6'};
  terminals.forEach(function(t){
    if(!t.lat||!t.lng) return;
    var em = typeEmojis[t.type]||'📍';
    var col = typeColors[t.type]||'#6b7280';
    L.marker([t.lat,t.lng],{
      icon:L.divIcon({
        className:'',
        html:'<div style="background:'+col+';color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">'+em+'</div>',
        iconSize:[26,26],iconAnchor:[13,13]
      }),zIndexOffset:1000
    }).bindPopup('<b>'+t.name+'</b>').addTo(map);
  });
</script>
</body>
</html>`;
  }, [centerLat, centerLng, isRealUserLocation, userLat, userLng, routesJson, terminalsJson]);

  return (
    <View style={[styles.wrapper, { height, borderColor: colors.border }]}>
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isRealUserLocation ? '#22c55e' : '#f97316' }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {locationLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.fullMapBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('RoutesAndFares')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="fullscreen" size={13} color="#fff" />
          <Text style={styles.fullMapBtnText}>Full Map</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="SmartSakay Map"
            onLoad={() => pushLocationToMap(sharedLocation)}
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onLoadEnd={() => pushLocationToMap(sharedLocation)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    ...SHADOWS.md,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fullMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  fullMapBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default HomeMapWidget;
