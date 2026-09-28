import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
  Image,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
} from 'react-native-svg';

const MAP_BASE_IMAGE = require('../../../assets/city_map_base.jpg');
const JEEPNEY_IMAGE = require('../../../assets/jeepney_flag_top.png');

/**
 * Normalized Highway Corridor Waypoints:
 * Offset from horizontal center (xOffset) and normalized height (y).
 * Dynamically scaled across Phones (iOS, Samsung, Android) and Tablets (iPad, Galaxy Tab).
 */
const WAYPOINTS = [
  { xOffset: +0.10, y: 1.15 }, // Below bottom
  { xOffset: +0.07, y: 1.04 }, // Bottom screen entrance
  { xOffset: -0.01, y: 0.88 },
  { xOffset: -0.10, y: 0.70 },
  { xOffset: -0.22, y: 0.52 }, // Mid sweep left
  { xOffset: -0.26, y: 0.34 }, // Upper bend
  { xOffset: -0.18, y: 0.16 }, // Turn upward
  { xOffset: -0.06, y: -0.04 }, // Top screen exit
  { xOffset: -0.02, y: -0.16 }, // Disappears above top
];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const v0 = (p2.x - p0.x) * 0.5;
  const v1 = (p3.x - p1.x) * 0.5;
  const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 +
            (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 +
            v0 * t + p1.x;

  const u0 = (p2.y - p0.y) * 0.5;
  const u1 = (p3.y - p1.y) * 0.5;
  const y = (2 * p1.y - 2 * p2.y + u0 + u1) * t3 +
            (-3 * p1.y + 3 * p2.y - 2 * u0 - u1) * t2 +
            u0 * t + p1.y;

  return { x, y };
}

const JeepneyIntroOverlay = ({ onFinish }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Dynamic dimensions that react immediately to rotation, split-view, and any device aspect ratio
  const screenW = windowWidth > 0 ? windowWidth : Dimensions.get('window').width || 390;
  const screenH = windowHeight > 0 ? windowHeight : Dimensions.get('window').height || 844;

  const animProgress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlaySlide = useRef(new Animated.Value(0)).current;
  const hasFinishedRef = useRef(false);

  // Cross-device form factor detection:
  // iPad (all sizes: 10.2", mini, Air, Pro) & Android Tablets (Galaxy Tab, Lenovo, Pixel Tablet): smallest dimension >= 600
  const isTablet = Math.min(screenW, screenH) >= 600;
  const isLandscape = screenW > screenH;

  // Responsive Road Corridor Width:
  // - On phones in portrait: spans gracefully across the phone width
  // - On tablets in portrait: framed in the center (up to 560px) for an elegant highway sweep
  // - On landscape (tablets or phones): bounded relative to height so the sweep remains centered and natural
  const effectiveW = isLandscape
    ? Math.min(screenH * 0.72, 540)
    : isTablet
    ? Math.min(screenW * 0.68, 560)
    : screenW;

  const centerX = screenW * 0.5;

  // Responsive, proportional Road Width across all devices:
  // - Phones (iOS iPhone, Samsung Galaxy, Android): ~54px to 62px
  // - Tablets (iPad, Samsung Galaxy Tab): ~70px to 84px
  const ROAD_WIDTH = isTablet
    ? Math.min(84, Math.max(70, Math.round((isLandscape ? screenH : screenW) * 0.088)))
    : Math.min(64, Math.max(52, Math.round(screenW * 0.145)));

  // Exact Right Lane Center: exactly 1/4 of total road width
  const RIGHT_LANE_OFFSET = ROAD_WIDTH * 0.25;

  // Proportional Philippine flag jeepney dimensions
  const JEEP_W = Math.round(ROAD_WIDTH * 0.39); // Fits comfortably in lane with clear side safety margins
  const JEEP_H = Math.round(JEEP_W * 2.18);      // Preserves 427x932 aspect ratio

  // SVG Layer Proportions (scaled mathematically to ROAD_WIDTH)
  const curbShadowWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.15);
  const curbOuterWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.11);
  const curbInnerWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.05);
  const asphaltWidth = ROAD_WIDTH;
  const shoulderWhiteWidth = ROAD_WIDTH - Math.round(ROAD_WIDTH * 0.10);
  const shoulderAsphaltWidth = ROAD_WIDTH - Math.round(ROAD_WIDTH * 0.18);
  const doubleYellowWidth = Math.max(5.5, Math.round(ROAD_WIDTH * 0.10));
  const yellowGapWidth = Math.max(2, Math.round(ROAD_WIDTH * 0.035));

  // Pre-calculate absolute waypoints in current device screen pixels
  const absoluteWaypoints = useMemo(() => {
    return WAYPOINTS.map(wp => ({
      x: centerX + wp.xOffset * effectiveW,
      y: wp.y * screenH,
    }));
  }, [centerX, effectiveW, screenH]);

  const getPt = (globalT) => {
    const n = absoluteWaypoints.length - 1;
    const scaled = Math.max(0, Math.min(1, globalT)) * (n - 2);
    const i = Math.min(Math.floor(scaled), n - 3);
    const localT = scaled - i;
    return catmullRom(absoluteWaypoints[i], absoluteWaypoints[i + 1], absoluteWaypoints[i + 2], absoluteWaypoints[i + 3], localT);
  };

  // 1. Generate mathematically exact SVG path string for the highway road centerline
  const roadPathD = useMemo(() => {
    const steps = 60;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = getPt(t);
      const x = pt.x.toFixed(1);
      const y = pt.y.toFixed(1);
      d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
    }
    return d;
  }, [absoluteWaypoints]);

  // 2. Generate vehicle trajectory locked 100% in the center of the RIGHT lane
  const { inputRange, outputRangeX, outputRangeY, outputRangeRot } = useMemo(() => {
    const steps = 80;
    const inRange = [];
    const outX = [];
    const outY = [];
    const outRot = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      inRange.push(t);

      // Tangent vector
      const dt = 0.005;
      const p1 = getPt(Math.max(0, t - dt));
      const p2 = getPt(Math.min(1, t + dt));
      const p = getPt(t);

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      // Unit perpendicular normal vector pointing to the RIGHT of direction of travel:
      // When heading UP (dx=0, dy=-1), normal is (1, 0) -> Shift into Right Lane (+X)
      const nx = -dy / len;
      const ny = dx / len;

      // Right lane position
      const laneX = p.x + nx * RIGHT_LANE_OFFSET;
      const laneY = p.y + ny * RIGHT_LANE_OFFSET;

      // Tangent heading angle in degrees
      const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;

      outX.push(laneX - JEEP_W / 2);
      outY.push(laneY - JEEP_H / 2);
      outRot.push(`${angle.toFixed(1)}deg`);
    }

    return {
      inputRange: inRange,
      outputRangeX: outX,
      outputRangeY: outY,
      outputRangeRot: outRot,
    };
  }, [absoluteWaypoints, RIGHT_LANE_OFFSET, JEEP_W, JEEP_H]);

  const translateX = animProgress.interpolate({
    inputRange,
    outputRange: outputRangeX,
  });

  const translateY = animProgress.interpolate({
    inputRange,
    outputRange: outputRangeY,
  });

  const rotate = animProgress.interpolate({
    inputRange,
    outputRange: outputRangeRot,
  });

  useEffect(() => {
    // 5-second slow and controlled drive from bottom to top locked in the right lane
    Animated.timing(animProgress, {
      toValue: 1.0,
      duration: 5000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !hasFinishedRef.current) {
        triggerTransition();
      }
    });
  }, []);

  const triggerTransition = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Immediately trigger landing page entrance simultaneously
    if (onFinish) {
      onFinish();
    }

    // Seamless kinetic crossfade: Map gently glides up and dissolves
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlaySlide, {
        toValue: -28,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSkip = () => {
    triggerTransition();
  };

  // Safe area placement for skip button (iPad, iPhone Dynamic Island, Samsung notch/cutout)
  const topSkip = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  ) + 12;
  const rightSkip = Math.max(insets.right, 20);

  return (
    <Animated.View
      style={[
        styles.fullScreenOverlay,
        {
          opacity: overlayOpacity,
          transform: [{ translateY: overlaySlide }],
        },
      ]}
      pointerEvents="box-none"
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleSkip}
      >
        {/* Layer 1: Seamless Clean City Map Background (with trees and buildings) */}
        <Image
          source={MAP_BASE_IMAGE}
          style={styles.mapImage}
          resizeMode="cover"
        />

        {/* Layer 2: Mathematically Exact 2-Lane Highway Overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${screenW} ${screenH}`}
            style={StyleSheet.absoluteFill}
          >
            {/* Road Ambient Drop Shadow */}
            <Path
              d={roadPathD}
              fill="none"
              stroke="rgba(15, 23, 42, 0.22)"
              strokeWidth={curbShadowWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Concrete Curbs and Sidewalk Borders */}
            <Path
              d={roadPathD}
              fill="none"
              stroke="#94A3B8"
              strokeWidth={curbOuterWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={roadPathD}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={curbInnerWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dark Charcoal Asphalt Roadway */}
            <Path
              d={roadPathD}
              fill="none"
              stroke="#2D3748"
              strokeWidth={asphaltWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Solid White Outer Lane Boundary / Shoulder Lines */}
            <Path
              d={roadPathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={shoulderWhiteWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={roadPathD}
              fill="none"
              stroke="#2D3748"
              strokeWidth={shoulderAsphaltWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Double Solid Golden Yellow Center Dividing Lines */}
            <Path
              d={roadPathD}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={doubleYellowWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={roadPathD}
              fill="none"
              stroke="#2D3748"
              strokeWidth={yellowGapWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Layer 3: Dynamic Philippine Flag Jeepney Driving 100% Centered in the RIGHT Lane */}
        <Animated.View
          style={[
            styles.jeepneyWrapper,
            {
              width: JEEP_W,
              height: JEEP_H,
              transform: [
                { translateX },
                { translateY },
                { rotate },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={JEEPNEY_IMAGE}
            style={styles.jeepneyImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Minimalist Skip Button */}
        <TouchableOpacity
          style={[
            styles.skipButton,
            {
              top: topSkip,
              right: rightSkip,
              paddingHorizontal: isTablet ? 18 : 14,
              paddingVertical: isTablet ? 9 : 7,
            },
          ]}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={[styles.skipButtonText, { fontSize: isTablet ? 13 : 12 }]}>Skip  →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: '#F8F9FA',
  },
  touchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  jeepneyWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  jeepneyImage: {
    width: '100%',
    height: '100%',
  },
  skipButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 20,
  },
  skipButtonText: {
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
  },
});

export default JeepneyIntroOverlay;
