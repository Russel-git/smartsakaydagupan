import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { routesAPI, terminalsAPI } from '../../api/services';
import { RADIUS, SHADOWS } from '../../utils/constants';

/**
 * HomeMapWidget — compact Leaflet map embedded in the Home Screen.
 * Shows live GPS location, jeepney route polylines, and terminal pins.
 * No legend. Tapping "View Full Map" navigates to the full RouteMapScreen.
 */
const HomeMapWidget = ({ navigation, height = 240 }) => {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [userLat, setUserLat] = useState(16.0433);
  const [userLng, setUserLng] = useState(120.3342);
  const [locationLabel, setLocationLabel] = useState('Dagupan City');

  // Acquire GPS on web / native
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationLabel('Location Active');
        },
        () => setLocationLabel('Dagupan City'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  }, []);

  // Fetch routes & terminals once
  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, tRes] = await Promise.allSettled([
          routesAPI.getAllRoutes(),
          terminalsAPI.getAll(),
        ]);
        if (rRes.status === 'fulfilled') setRoutes(rRes.value.data.data || []);
        if (tRes.status === 'fulfilled') setTerminals(tRes.value.data.data || []);
      } catch (_) {}
    };
    load();
  }, []);

  const routesJson = JSON.stringify(
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
  );

  const terminalsJson = JSON.stringify(
    terminals.map((t) => ({
      name: t.name,
      lat: t.location?.coordinates?.[1] ?? t.latitude ?? t.lat,
      lng: t.location?.coordinates?.[0] ?? t.longitude ?? t.lng,
      type: t.type,
    }))
  );

  const mapHtml = `<!DOCTYPE html>
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
  var lat = ${userLat}, lng = ${userLng};
  var map = L.map('map', { zoomControl:false, attributionControl:true })
             .setView([lat, lng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© OSM', maxZoom:19
  }).addTo(map);

  /* ---- GPS circle ---- */
  var circle = L.circle([lat, lng], {
    radius:40, color:'#f97316', fillColor:'#f97316', fillOpacity:0.15, weight:1
  }).addTo(map);

  /* ---- User beacon ---- */
  var beaconIcon = L.divIcon({
    className:'',
    html:'<div class="beacon-wrap"><div class="pulse-ring"></div><div class="pulse-ring-2"></div><div class="core-dot"></div></div>',
    iconSize:[32,32], iconAnchor:[16,16]
  });
  var marker = L.marker([lat,lng],{icon:beaconIcon,zIndexOffset:3000}).addTo(map);

  /* ---- Live GPS watch ---- */
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(function(p){
      lat=p.coords.latitude; lng=p.coords.longitude;
      marker.setLatLng([lat,lng]);
      circle.setLatLng([lat,lng]);
    },null,{enableHighAccuracy:true,timeout:12000,maximumAge:5000});
  }

  /* ---- Locate btn ---- */
  document.getElementById('locateBtn').onclick = function(){
    map.setView([lat,lng],15,{animate:true});
  };

  /* ---- Route colour map ---- */
  var routeColorMap = {
    'CSI_LUCAO':'#f97316','DOWNTOWN':'#8B5CF6',
    'CALASIAO':'#22c55e','BONUAN_TONDALIGAN':'#ea6c0a',
    'BOLOSAN_HIGHWAY':'#f59e0b','SALISAY_BOLOSAN_OLD_ROAD':'#ec4899'
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

  /* ---- Downtown hub pin ---- */
  L.marker([16.0433,120.3342],{
    icon:L.divIcon({
      className:'',
      html:'<div style="background:#f97316;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>',
      iconSize:[28,28],iconAnchor:[14,14]
    }),zIndexOffset:1500
  }).bindPopup('<b>Downtown Dagupan — Central Hub</b><br><small>All jeepney routes converge here</small>')
    .addTo(map);

  /* ---- Terminal pins ---- */
  var terminals = ${terminalsJson};
  var typeEmojis = {bus:'🚌',jeepney:'🚐',tricycle:'🛺',multimodal:'🏢'};
  var typeColors = {bus:'#3b82f6',jeepney:'#22c55e',tricycle:'#f59e0b',multimodal:'#8B5CF6'};
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

  return (
    <View style={[styles.wrapper, { height, borderColor: colors.border }]}>
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
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
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="SmartSakay Map"
          />
        ) : (
          <WebView
            source={{ html: mapHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            geolocationEnabled
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
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
