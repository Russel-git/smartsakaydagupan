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
// Front-to-side (3/4 perspective) Philippine flag jeepney with boy driver inside the cabin
const JEEPNEY_IMAGE = require('../../../assets/jeepney_perspective_driver.png');
// Friendly Filipino boy character avatar from user illustration
const FILIPINO_BOY_AVATAR = require('../../../assets/filipino_boy_avatar.png');

/**
 * Isometric Z/Depth Highway Corridor:
 * Animates directly down along the isometric Z/depth axis (top-right to bottom-left)
 * - Start: Far background depth (top-right), small & faded (scale: 0.4, opacity: 0.2)
 * - Motion: Straight forward/downward toward the viewer along the isometric depth line
 * - End: Lower-center foreground, full size (scale: 1.10, opacity: 1.0) with slight drift finish
 */
const WAYPOINTS = [
  { xOffset: +0.32, y: -0.10 }, // w0: Far background depth spawn
  { xOffset: +0.26, y: 0.08 },  // w1: Background entrance
  { xOffset: +0.18, y: 0.28 },  // w2: Mid-distance approach
  { xOffset: +0.08, y: 0.48 },  // w3: Advancing forward toward viewer
  { xOffset: -0.03, y: 0.68 },  // w4: Lower-center foreground finish / drift stop
  { xOffset: -0.10, y: 0.88 },  // w5: Foreground road continuation
  { xOffset: -0.18, y: 1.15 },  // w6: Past screen bottom
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

  // Dynamic dimensions reacting to any device form factor, orientation, and split-view
  const screenW = windowWidth > 0 ? windowWidth : Dimensions.get('window').width || 390;
  const screenH = windowHeight > 0 ? windowHeight : Dimensions.get('window').height || 844;

  const animProgress = useRef(new Animated.Value(0)).current;
  const driftSmokeAnim = useRef(new Animated.Value(0)).current;
  const skidOpacityAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlaySlide = useRef(new Animated.Value(0)).current;
  const hasFinishedRef = useRef(false);
  const finishTimeoutRef = useRef(null);

  // Form factor detection: iPad, Galaxy Tab, iOS, Android
  const isTablet = Math.min(screenW, screenH) >= 600;
  const isLandscape = screenW > screenH;

  // Responsive Road Corridor Width
  const effectiveW = isLandscape
    ? Math.min(screenH * 0.72, 540)
    : isTablet
    ? Math.min(screenW * 0.68, 560)
    : screenW;

  const centerX = screenW * 0.5;

  // Responsive highway proportions
  const ROAD_WIDTH = isTablet
    ? Math.min(104, Math.max(82, Math.round((isLandscape ? screenH : screenW) * 0.10)))
    : Math.min(80, Math.max(64, Math.round(screenW * 0.18)));

  // Exact Right Lane Center: exactly 1/4 of total road width
  const RIGHT_LANE_OFFSET = ROAD_WIDTH * 0.25;

  // 3/4 Front-Side Perspective Jeepney Dimensions (427 x 294 aspect ratio)
  const JEEP_W = isTablet ? 230 : Math.round(screenW * 0.44);
  const JEEP_H = Math.round(JEEP_W * (294 / 427));

  // SVG Highway Layer Proportions
  const curbShadowWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.16);
  const curbOuterWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.11);
  const curbInnerWidth = ROAD_WIDTH + Math.round(ROAD_WIDTH * 0.05);
  const asphaltWidth = ROAD_WIDTH;
  const shoulderWhiteWidth = ROAD_WIDTH - Math.round(ROAD_WIDTH * 0.10);
  const shoulderAsphaltWidth = ROAD_WIDTH - Math.round(ROAD_WIDTH * 0.18);
  const doubleYellowWidth = Math.max(6, Math.round(ROAD_WIDTH * 0.10));
  const yellowGapWidth = Math.max(2.2, Math.round(ROAD_WIDTH * 0.035));

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
    return catmullRom(
      absoluteWaypoints[i],
      absoluteWaypoints[i + 1],
      absoluteWaypoints[i + 2],
      absoluteWaypoints[i + 3],
      localT
    );
  };

  // 1. Generate full isometric highway centerline SVG path string
  const roadPathD = useMemo(() => {
    const steps = 70;
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

  // 2. Trajectory along Isometric Z/Depth Axis (top-right to bottom-left):
  // - Starts far in background depth (t=0.02, scale=0.40, opacity=0.20)
  // - Drives straight forward/downward toward the viewer
  // - Reaches lower-center foreground (t=0.75, scale=1.10, opacity=1.0) and drifts slightly
  const { inputRange, outputRangeX, outputRangeY, outputRangeRot, outputRangeScale, stopPosition } = useMemo(() => {
    const steps = 90;
    const inRange = [];
    const outX = [];
    const outY = [];
    const outRot = [];
    const outScale = [];

    let finalStop = { x: 0, y: 0 };

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      inRange.push(progress);

      // Map progress to road parameter [0.02..0.75] (stops in lower-center foreground)
      const t = 0.02 + progress * 0.73;

      const dt = 0.005;
      const p1 = getPt(Math.max(0, t - dt));
      const p2 = getPt(Math.min(1, t + dt));
      const p = getPt(t);

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;

      const nx = -dy / len;
      const ny = dx / len;

      const laneX = p.x + nx * RIGHT_LANE_OFFSET;
      const laneY = p.y + ny * RIGHT_LANE_OFFSET;

      // Realistic 3D perspective scale: 0.40x in the far distance up to 1.10x in the front foreground
      const scale = 0.40 + 0.70 * Math.pow(progress, 1.35);

      // Orthographic isometric alignment:
      // - Parallel edges kept orthographic with subtle chassis lean into curves (-2.5° to +2.5°)
      // - Slight drift slip angle on final deceleration (-6.5° settling to -1.5°)
      // - Keeps the grille, headlights, and front windshield clearly forward-facing at all times
      let driftAngle = 0;
      if (progress <= 0.75) {
        driftAngle = Math.max(-2.5, Math.min(2.5, (dx / len) * 3.5));
      } else {
        const dP = (progress - 0.75) / 0.25;
        if (dP < 0.6) {
          driftAngle = -2.5 - 4.0 * (dP / 0.6); // slight drift tilt to -6.5°
        } else {
          driftAngle = -6.5 + 5.0 * ((dP - 0.6) / 0.4); // counter-steer settle to -1.5°
        }
      }

      outX.push(laneX - JEEP_W / 2);
      outY.push(laneY - JEEP_H / 2);
      outRot.push(`${driftAngle.toFixed(1)}deg`);
      outScale.push(Number(scale.toFixed(3)));

      if (i === steps) {
        finalStop = { x: laneX, y: laneY };
      }
    }

    return {
      inputRange: inRange,
      outputRangeX: outX,
      outputRangeY: outY,
      outputRangeRot: outRot,
      outputRangeScale: outScale,
      stopPosition: finalStop,
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

  const scale = animProgress.interpolate({
    inputRange,
    outputRange: outputRangeScale,
  });

  // Depth effects: start faded/lower contrast (opacity 0.20) in distance, full vibrant contrast in foreground
  const jeepOpacity = animProgress.interpolate({
    inputRange: [0, 0.25, 0.65, 1.0],
    outputRange: [0.20, 0.60, 0.92, 1.0],
  });

  // Dynamic ground drop shadow: faint and small in background, expanding and dark under tires in foreground
  const shadowOpacity = animProgress.interpolate({
    inputRange: [0, 0.35, 1.0],
    outputRange: [0.15, 0.35, 0.60],
  });

  const shadowScaleX = animProgress.interpolate({
    inputRange: [0, 1.0],
    outputRange: [0.85, 1.15],
  });

  const shadowScaleY = animProgress.interpolate({
    inputRange: [0, 1.0],
    outputRange: [0.70, 1.10],
  });

  useEffect(() => {
    // 5.0 seconds total realistic sequence:
    // Phase 1 (0.0s - 3.2s): Drives from far end to front, weight deceleration curve cubic-bezier(0.25, 1, 0.5, 1)
    Animated.timing(animProgress, {
      toValue: 1.0,
      duration: 3200,
      easing: Easing.bezier(0.25, 1.0, 0.5, 1.0), // Natural weighty approach deceleration
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !hasFinishedRef.current) {
        // Phase 2 (3.2s - 4.6s): Boy avatar waves + "Tara na! Sakay na!" speech bubble springs in
        Animated.parallel([
          Animated.spring(bubbleAnim, {
            toValue: 1,
            friction: 6,
            tension: 75,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(waveAnim, { toValue: 1, duration: 220, useNativeDriver: false }),
            Animated.timing(waveAnim, { toValue: -1, duration: 220, useNativeDriver: false }),
            Animated.timing(waveAnim, { toValue: 1, duration: 220, useNativeDriver: false }),
            Animated.timing(waveAnim, { toValue: -0.4, duration: 220, useNativeDriver: false }),
            Animated.timing(waveAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
          ]),
        ]).start();

        // Phase 3 (4.6s - 5.0s): Seamless crossfade into landing page
        finishTimeoutRef.current = setTimeout(() => {
          triggerTransition();
        }, 1400);
      }
    });

    // Drift effects trigger around 2150ms (when progress enters the deceleration drift phase)
    const driftTimeout = setTimeout(() => {
      // Fade in tire skid marks on the road
      Animated.timing(skidOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();

      // Animate comic drift smoke puff
      Animated.sequence([
        Animated.timing(driftSmokeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(driftSmokeAnim, {
          toValue: 2,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }, 2150);

    return () => {
      clearTimeout(driftTimeout);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, []);

  const triggerTransition = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }

    // Call onFinish to simultaneously bring up WelcomeScreen
    if (onFinish) {
      onFinish();
    }

    // 400ms crossfade
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlaySlide, {
        toValue: -24,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSkip = () => {
    triggerTransition();
  };

  // Safe area skip button placement
  const topSkip = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  ) + 12;
  const rightSkip = Math.max(insets.right, 20);

  // Responsive speech bubble dimensions and positioning directly above stopped vehicle
  const bubbleW = isTablet ? 310 : 260;
  const bubbleH = isTablet ? 98 : 86;
  const bubbleLeft = Math.max(16, Math.min(screenW - bubbleW - 16, stopPosition.x - bubbleW / 2));
  const bubbleTop = Math.max(
    topSkip + 44,
    stopPosition.y - JEEP_H / 2 - bubbleH - (isTablet ? 30 : 22)
  );

  // Drift smoke puff animations
  const smokeScale = driftSmokeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1.2, 1.6],
  });
  const smokeOpacity = driftSmokeAnim.interpolate({
    inputRange: [0, 0.4, 1, 2],
    outputRange: [0, 0.9, 0.7, 0],
  });
  const smokeTranslateX = driftSmokeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 18, 28],
  });

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
        {/* Layer 1: Clean City Map Background */}
        <Image
          source={MAP_BASE_IMAGE}
          style={styles.mapImage}
          resizeMode="cover"
        />

        {/* Layer 2: Mathematically Exact 2-Lane Highway with S-Curve Pattern */}
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
              stroke="rgba(15, 23, 42, 0.25)"
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
              stroke="#262E3B"
              strokeWidth={asphaltWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Solid White Outer Lane Boundary Lines */}
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
              stroke="#262E3B"
              strokeWidth={shoulderAsphaltWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Double Solid Golden Yellow Center Dividing Highway Lines */}
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
              stroke="#262E3B"
              strokeWidth={yellowGapWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Layer 3: Realistic Tire Skid Marks Beneath Drift Position */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: skidOpacityAnim }]}
          pointerEvents="none"
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${screenW} ${screenH}`}
            style={StyleSheet.absoluteFill}
          >
            {/* Outer Rear Tire Skid Mark */}
            <Path
              d={`M ${stopPosition.x + 18} ${stopPosition.y - 28} Q ${stopPosition.x + 44} ${stopPosition.y + 4}, ${stopPosition.x + 36} ${stopPosition.y + 24}`}
              stroke="rgba(15, 23, 42, 0.40)"
              strokeWidth={isTablet ? 7 : 5}
              fill="none"
              strokeLinecap="round"
            />
            {/* Inner Front Tire Skid Mark */}
            <Path
              d={`M ${stopPosition.x - 14} ${stopPosition.y - 20} Q ${stopPosition.x + 12} ${stopPosition.y + 10}, ${stopPosition.x + 4} ${stopPosition.y + 28}`}
              stroke="rgba(15, 23, 42, 0.35)"
              strokeWidth={isTablet ? 7 : 5}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* Layer 4: Front-to-Side Perspective Philippine Flag Jeepney */}
        <Animated.View
          style={[
            styles.jeepneyWrapper,
            {
              width: JEEP_W,
              height: JEEP_H,
              opacity: jeepOpacity,
              transform: [
                { translateX },
                { translateY },
                { rotate },
                { scale },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {/* Dynamic Ground Contact Drop Shadow under the tires */}
          <Animated.View
            style={[
              styles.jeepneyGroundShadow,
              {
                opacity: shadowOpacity,
                transform: [
                  { scaleX: shadowScaleX },
                  { scaleY: shadowScaleY },
                ],
              },
            ]}
          />

          {/* Front-to-side perspective jeepney body with boy driving inside cabin */}
          <Image
            source={JEEPNEY_IMAGE}
            style={styles.jeepneyImage}
            resizeMode="contain"
          />

          {/* Comic Drift Smoke Puffs behind rear wheels */}
          <Animated.View
            style={[
              styles.driftSmokePuff,
              {
                opacity: smokeOpacity,
                transform: [
                  { scale: smokeScale },
                  { translateX: smokeTranslateX },
                ],
              },
            ]}
          >
            <Text style={[styles.smokeEmoji, { fontSize: isTablet ? 30 : 24 }]}>💨</Text>
          </Animated.View>
        </Animated.View>


        {/* Layer 5: Interactive Comic Speech Bubble ("Tara na! Sakay na!") & Filipino Boy Graphic */}
        <Animated.View
          style={[
            styles.speechBubbleContainer,
            {
              left: bubbleLeft,
              top: bubbleTop,
              width: bubbleW,
              opacity: bubbleAnim,
              transform: [
                { scale: bubbleAnim },
                {
                  translateY: bubbleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          {/* Animated Waving Filipino Boy Driver Badge */}
          <Animated.View
            style={[
              styles.driverBadgeWrapper,
              {
                transform: [
                  {
                    rotate: waveAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ['-14deg', '0deg', '16deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={FILIPINO_BOY_AVATAR}
              style={[
                styles.driverBadgeImage,
                {
                  width: isTablet ? 60 : 50,
                  height: isTablet ? 60 : 50,
                  borderRadius: isTablet ? 30 : 25,
                },
              ]}
              resizeMode="cover"
            />
            <View style={styles.phFlagPill}>
              <Text style={styles.phFlagText}>🇵🇭</Text>
            </View>
          </Animated.View>

          {/* Speech Bubble Card with Crisp Real Text */}
          <View style={styles.speechBubbleCard}>
            <View style={styles.speechBubbleHeader}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.speechBubbleSpeaker}>KUYA DRIVER</Text>
              <Text style={styles.speechBubbleLocation}>• DAGUPAN</Text>
            </View>
            <Text style={[styles.speechBubbleMainText, { fontSize: isTablet ? 17 : 15 }]}>
              Tara na! Sakay na!
            </Text>
            <Text style={styles.speechBubbleSubText}>
              Mabilis at ligtas na biyahe 🚍
            </Text>

            {/* Downward Speech Bubble Triangle Pointer */}
            <View style={styles.speechBubblePointer} />
          </View>
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
    backgroundColor: '#0F172A',
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
  jeepneyGroundShadow: {
    position: 'absolute',
    bottom: -4,
    left: '8%',
    width: '84%',
    height: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  driftSmokePuff: {
    position: 'absolute',
    right: '8%',
    bottom: '22%',
    zIndex: 5,
  },
  smokeEmoji: {
    opacity: 0.9,
  },
  speechBubbleContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 25,
    elevation: 25,
  },
  driverBadgeWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  driverBadgeImage: {
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
  },
  phFlagPill: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phFlagText: {
    fontSize: 10,
  },
  speechBubbleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 12,
  },
  speechBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  speechBubbleSpeaker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  speechBubbleLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 3,
  },
  speechBubbleMainText: {
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  speechBubbleSubText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  speechBubblePointer: {
    position: 'absolute',
    bottom: -6,
    left: '42%',
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#E2E8F0',
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
    zIndex: 30,
  },
  skipButtonText: {
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
  },
});

export default JeepneyIntroOverlay;

