import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";

export default function AnimatedSplashV2({ onFinish }) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();

  // ============================================================
  // MAIN ANIMATIONS
  // ============================================================

  const screenOpacity = useRef(new Animated.Value(1)).current;

  const sceneOpacity = useRef(new Animated.Value(0)).current;

  // Jeepney movement
  const vehicleProgress = useRef(new Animated.Value(0)).current;
  const vehicleBob = useRef(new Animated.Value(0)).current;

  // ============================================================
  // S-ROAD / LOGO FORMATION
  // ============================================================

  const formationX = useRef(new Animated.Value(0)).current;
  const formationScale = useRef(new Animated.Value(1)).current;

  // ============================================================
  // BRANDING
  // ============================================================

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoX = useRef(new Animated.Value(25)).current;

  const locationOpacity = useRef(new Animated.Value(0)).current;
  const locationY = useRef(new Animated.Value(12)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;

  // ============================================================
  // LOGO GLOW
  // ============================================================

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.7)).current;

  // ============================================================
  // CLOUDS
  // ============================================================

  const cloudOneX = useRef(new Animated.Value(-120)).current;
  const cloudTwoX = useRef(new Animated.Value(width + 120)).current;
  const cloudThreeX = useRef(new Animated.Value(-180)).current;
  const cloudFourX = useRef(new Animated.Value(width + 180)).current;

  // ============================================================
  // PARTICLES
  // ============================================================

  const particleOne = useRef(new Animated.Value(0)).current;
  const particleTwo = useRef(new Animated.Value(0)).current;
  const particleThree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ============================================================
    // SCENE APPEARS
    // ============================================================

    const sceneAnimation = Animated.timing(sceneOpacity, {
      toValue: 1,
      duration: 650,
      delay: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    sceneAnimation.start();

    // ============================================================
    // JEEPNEY MOVEMENT
    //
    // The jeepney travels upward through the S-shaped road.
    // ============================================================

    const jeepneyAnimation = Animated.timing(vehicleProgress, {
      toValue: 1,
      duration: 3400,
      delay: 350,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    jeepneyAnimation.start();

    // ============================================================
    // JEEPNEY SUSPENSION
    // ============================================================

    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(vehicleBob, {
          toValue: -2,
          duration: 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(vehicleBob, {
          toValue: 2,
          duration: 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    bobAnimation.start();

    // ============================================================
    // CLOUDS
    // ============================================================

    const cloudAnimationOne = Animated.loop(
      Animated.timing(cloudOneX, {
        toValue: width + 140,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const cloudAnimationTwo = Animated.loop(
      Animated.timing(cloudTwoX, {
        toValue: -180,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const cloudAnimationThree = Animated.loop(
      Animated.timing(cloudThreeX, {
        toValue: width + 180,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const cloudAnimationFour = Animated.loop(
      Animated.timing(cloudFourX, {
        toValue: -180,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    cloudAnimationOne.start();
    cloudAnimationTwo.start();
    cloudAnimationThree.start();
    cloudAnimationFour.start();

    // ============================================================
    // PARTICLES
    // ============================================================

    const createParticleAnimation = (value, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(value, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const particleAnimationOne = createParticleAnimation(particleOne, 200);

    const particleAnimationTwo = createParticleAnimation(particleTwo, 800);

    const particleAnimationThree = createParticleAnimation(particleThree, 1300);

    particleAnimationOne.start();
    particleAnimationTwo.start();
    particleAnimationThree.start();

    // ============================================================
    // PHASE 2
    //
    // After the jeepney reaches the top:
    //
    // S road + jeep shift center-left and shrink together.
    // ============================================================

    const formationTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(formationX, {
          toValue: -width * 0.26,
          duration: 1250,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(formationScale, {
          toValue: 0.5,
          duration: 1250,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 3900);

    // ============================================================
    // PHASE 3
    //
    // SmartSakay branding appears after the S settles.
    // ============================================================

    const brandingTimer = setTimeout(() => {
      Animated.parallel([
        // Main logo
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),

        Animated.timing(logoX, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // Glow
        Animated.timing(glowOpacity, {
          toValue: 0.16,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.spring(glowScale, {
          toValue: 1,
          friction: 8,
          tension: 35,
          useNativeDriver: true,
        }),

        // Location
        Animated.timing(locationOpacity, {
          toValue: 1,
          duration: 500,
          delay: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(locationY, {
          toValue: 0,
          duration: 500,
          delay: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        // Tagline
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          delay: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(taglineY, {
          toValue: 0,
          duration: 500,
          delay: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 5150);

    // ============================================================
    // FINISH
    // ============================================================

    const finishTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onFinish) {
          onFinish();
        }
      });
    }, 6900);

    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      clearTimeout(formationTimer);
      clearTimeout(brandingTimer);
      clearTimeout(finishTimer);

      sceneAnimation.stop();
      jeepneyAnimation.stop();

      bobAnimation.stop();

      cloudAnimationOne.stop();
      cloudAnimationTwo.stop();
      cloudAnimationThree.stop();
      cloudAnimationFour.stop();

      particleAnimationOne.stop();
      particleAnimationTwo.stop();
      particleAnimationThree.stop();
    };
  }, []);

  // ============================================================
  // PATH INPUT
  // ============================================================

  const pathInput = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  // ============================================================
  // JEEPNEY X
  //
  // Follows the NEW S-shaped road.
  //
  // Bottom:
  //   starts on the left
  //
  // Lower curve:
  //   moves toward the right
  //
  // Middle:
  //   sweeps back toward the left
  //
  // Upper curve:
  //   moves upward and toward the right
  // ============================================================

  const jeepneyX = vehicleProgress.interpolate({
    inputRange: pathInput,

    outputRange: [
      width * 0.12 - 75,
      width * 0.3 - 75,
      width * 0.55 - 75,
      width * 0.76 - 75,

      width * 0.72 - 75,
      width * 0.55 - 75,
      width * 0.34 - 75,

      width * 0.16 - 75,
      width * 0.22 - 75,
      width * 0.48 - 75,
      width * 0.76 - 75,
    ],
  });

  // ============================================================
  // JEEPNEY Y
  //
  // Continuously moves upward.
  // ============================================================

  const jeepneyY = vehicleProgress.interpolate({
    inputRange: pathInput,

    outputRange: [
      height * 0.9 - 38,
      height * 0.9 - 38,
      height * 0.84 - 38,
      height * 0.73 - 38,

      height * 0.59 - 38,
      height * 0.5 - 38,
      height * 0.43 - 38,

      height * 0.35 - 38,
      height * 0.25 - 38,
      height * 0.15 - 38,
      height * 0.08 - 38,
    ],
  });

  // ============================================================
  // JEEPNEY ROTATION
  //
  // The vehicle rotates according to the S-road direction.
  // ============================================================

  const jeepneyRotate = vehicleProgress.interpolate({
    inputRange: pathInput,

    outputRange: [
      "0deg",
      "0deg",
      "-5deg",
      "-12deg",

      "-18deg",
      "-8deg",
      "5deg",

      "12deg",
      "8deg",
      "2deg",
      "0deg",
    ],
  });

  // ============================================================
  // ROAD SIZE
  // ============================================================

  const roadWidth = Math.min(Math.max(width * 0.21, 82), 125);

  const roadShadowWidth = roadWidth + 10;

  const jeepneyScale = Math.min(Math.max(width / 420, 0.82), 1.2);

  // ============================================================
  // NEW S-SHAPED ROAD
  //
  // This is intentionally shaped like a CAPITAL "S".
  //
  // Bottom:
  //     starts left
  //
  // Lower curve:
  //     sweeps strongly toward the right
  //
  // Middle:
  //     sweeps back toward the left
  //
  // Upper curve:
  //     bends upward on the left
  //
  // Top:
  //     finishes toward the right
  // ============================================================

  const roadPath = `
    M ${width * 0.12} ${height * 0.9}

    C ${width * 0.38} ${height * 0.9},
      ${width * 0.78} ${height * 0.92},
      ${width * 0.82} ${height * 0.72}

    C ${width * 0.86} ${height * 0.53},
      ${width * 0.62} ${height * 0.48},
      ${width * 0.36} ${height * 0.41}

    C ${width * 0.12} ${height * 0.35},
      ${width * 0.1} ${height * 0.2},
      ${width * 0.3} ${height * 0.12}

    C ${width * 0.45} ${height * 0.06},
      ${width * 0.67} ${height * 0.08},
      ${width * 0.9} ${height * 0.08}
  `;

  const formationTransform = [
    { translateX: formationX },
    { scale: formationScale },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          opacity: screenOpacity,
        },
      ]}
    >
      {/* ========================================================
          BACKGROUND GLOW
      ======================================================== */}

      <View
        style={[
          styles.backgroundGlow,
          {
            width: width * 1.4,
            height: width * 1.4,
            borderRadius: width,
            top: -width * 0.55,
          },
        ]}
      />

      {/* ========================================================
          CLOUD 1
      ======================================================== */}

      <Animated.View
        style={[
          styles.cloud,
          {
            top: height * 0.1,
            left: -120,
          },
          {
            transform: [
              {
                translateX: cloudOneX,
              },
            ],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      {/* ========================================================
          CLOUD 2
      ======================================================== */}

      <Animated.View
        style={[
          styles.cloud,
          {
            top: height * 0.19,
            left: width,
          },
          {
            transform: [
              {
                translateX: cloudTwoX,
              },
            ],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      <Animated.View
        style={[
          styles.cloud,
          { top: height * 0.29, left: 0, opacity: 0.08 },
          {
            transform: [{ scale: 0.78 }, { translateX: cloudThreeX }],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      <Animated.View
        style={[
          styles.cloud,
          { top: height * 0.04, left: 0, opacity: 0.07 },
          {
            transform: [{ scale: 1.15 }, { translateX: cloudFourX }],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      {/* ========================================================
          PARTICLES
      ======================================================== */}

      <Animated.View
        style={[
          styles.particle,
          {
            top: height * 0.2,
            left: width * 0.15,
          },
          {
            opacity: particleOne,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            top: height * 0.29,
            right: width * 0.15,
          },
          {
            opacity: particleTwo,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          {
            top: height * 0.14,
            right: width * 0.3,
          },
          {
            opacity: particleThree,
          },
        ]}
      />

      {/* ========================================================
          MAIN S-ROAD + JEEPNEY

          Road and jeepney move together during formation.
      ======================================================== */}

      <Animated.View
        style={[
          styles.formationContainer,
          {
            opacity: sceneOpacity,
          },
        ]}
      >
        {/* ======================================================
            S ROAD
        ====================================================== */}

        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: formationTransform }]}
        >
          <Svg
            width={width}
            height={height}
            style={StyleSheet.absoluteFill}
            viewBox={`0 0 ${width} ${height}`}
          >
            {/* Road shadow */}

            <Path
              d={roadPath}
              stroke="#000000"
              strokeWidth={roadShadowWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.35}
            />

            {/* Main road */}

            <Path
              d={roadPath}
              stroke="#333333"
              strokeWidth={roadWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Center road marking */}

            <Path
              d={roadPath}
              stroke={colors.secondary}
              strokeWidth={3}
              strokeDasharray="15 18"
              fill="none"
              strokeLinecap="round"
              opacity={0.9}
            />
          </Svg>
        </Animated.View>

        {/* ======================================================
            CITY BUILDINGS
        ====================================================== */}

        <CityBuilding
          style={{
            left: width * 0.03,
            top: height * 0.43,
            width: 48,
            height: 90,
          }}
        />

        <CityBuilding
          style={{
            left: width * 0.06,
            top: height * 0.6,
            width: 42,
            height: 72,
          }}
        />

        <CityBuilding
          style={{
            right: width * 0.04,
            top: height * 0.36,
            width: 52,
            height: 105,
          }}
        />

        <CityBuilding
          style={{
            right: width * 0.08,
            top: height * 0.56,
            width: 42,
            height: 68,
          }}
        />

        {/* ======================================================
            TREES
        ====================================================== */}

        <Tree
          style={{
            left: width * 0.02,
            top: height * 0.3,
          }}
          scale={1}
        />

        <Tree
          style={{
            left: width * 0.13,
            top: height * 0.51,
          }}
          scale={0.8}
        />

        <Tree
          style={{
            right: width * 0.02,
            top: height * 0.48,
          }}
          scale={1.1}
        />

        <Tree
          style={{
            right: width * 0.15,
            top: height * 0.64,
          }}
          scale={0.75}
        />

        {/* ======================================================
            STREET LIGHTS
        ====================================================== */}

        <StreetLight
          style={{
            left: width * 0.18,
            top: height * 0.34,
          }}
        />

        <StreetLight
          style={{
            right: width * 0.16,
            top: height * 0.45,
          }}
        />

        {/* ======================================================
            JEEPNEY
        ====================================================== */}

        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: formationTransform }]}
        >
          <Animated.View
            style={[
              styles.jeepney,
              {
                transform: [
                  {
                    translateX: jeepneyX,
                  },

                  {
                    translateY: Animated.add(jeepneyY, vehicleBob),
                  },

                  {
                    rotate: jeepneyRotate,
                  },

                  {
                    scale: jeepneyScale,
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../../assets/jeepney.png")}
              style={styles.jeepneyImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* ========================================================
          SMARTSAKAY BRANDING
      ======================================================== */}

      <Animated.View
        style={[
          styles.brandingGroup,
          {
            left: width * 0.43,
            top: height * 0.35,

            opacity: logoOpacity,

            transform: [
              {
                translateX: logoX,
              },
              {
                scale: logoScale,
              },
            ],
          },
        ]}
      >
        {/* ======================================================
            GLOW
        ====================================================== */}

        <Animated.View
          style={[
            styles.logoGlow,
            {
              opacity: glowOpacity,

              transform: [
                {
                  scale: glowScale,
                },
              ],
            },
          ]}
        />

        {/* ======================================================
            LOGO
        ====================================================== */}

        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="bus" size={42} color="#FFFFFF" />
        </View>

        {/* ======================================================
            BRAND NAME
        ====================================================== */}

        <Text style={styles.brandName}>SmartSakay</Text>

        {/* ======================================================
            LOCATION
        ====================================================== */}

        <Animated.Text
          style={[
            styles.location,
            {
              opacity: locationOpacity,

              transform: [
                {
                  translateY: locationY,
                },
              ],
            },
          ]}
        >
          D A G U P A N
        </Animated.Text>

        {/* ======================================================
            TAGLINE
        ====================================================== */}

        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,

              transform: [
                {
                  translateY: taglineY,
                },
              ],
            },
          ]}
        >
          <View style={styles.taglineLine} />

          <View style={styles.taglineBadge}>
            <Text style={styles.tagline}>Your journey starts here.</Text>
          </View>

          <View style={styles.taglineLine} />
        </Animated.View>
      </Animated.View>

      {/* ========================================================
          BOTTOM TEXT
      ======================================================== */}

      <Animated.Text
        style={[
          styles.bottomText,
          {
            opacity: taglineOpacity,
          },
        ]}
      >
        SMARTER • SAFER • SIMPLER
      </Animated.Text>
    </Animated.View>
  );
}

// ==================================================================
// PHILIPPINE JEEPNEY
// ==================================================================

function PhilippineJeepney() {
  return (
    <View style={jeepneyStyles.container}>
      {/* Roof */}

      <View style={jeepneyStyles.roof}>
        <View style={jeepneyStyles.routeSign}>
          <Text style={jeepneyStyles.routeText}>DAGUPAN</Text>
        </View>
      </View>

      {/* Body */}

      <View style={jeepneyStyles.body}>
        {/* Windows */}

        <View style={jeepneyStyles.windows}>
          <View style={jeepneyStyles.window}>
            <View style={jeepneyStyles.windowBar} />
          </View>

          <View style={jeepneyStyles.window}>
            <View style={jeepneyStyles.windowBar} />
          </View>

          <View style={jeepneyStyles.window}>
            <View style={jeepneyStyles.windowBar} />
          </View>

          <View style={jeepneyStyles.window}>
            <View style={jeepneyStyles.windowBar} />
          </View>
        </View>

        {/* Stripe */}

        <View style={jeepneyStyles.sideStripe}>
          <Text style={jeepneyStyles.sideText}>SMARTSAKAY</Text>
        </View>

        {/* Front */}

        <View style={jeepneyStyles.front}>
          <View style={jeepneyStyles.windshield} />

          <View style={jeepneyStyles.grille}>
            <View style={jeepneyStyles.grilleLine} />
            <View style={jeepneyStyles.grilleLine} />
            <View style={jeepneyStyles.grilleLine} />
          </View>

          <View style={jeepneyStyles.headlight} />

          <View
            style={[jeepneyStyles.headlight, jeepneyStyles.secondHeadlight]}
          />
        </View>

        {/* Bumper */}

        <View style={jeepneyStyles.bumper} />
      </View>

      {/* Mirrors */}

      <View style={jeepneyStyles.mirrorLeft} />
      <View style={jeepneyStyles.mirrorRight} />

      {/* Wheels */}

      <View style={[jeepneyStyles.wheel, jeepneyStyles.backWheel]}>
        <View style={jeepneyStyles.wheelHub} />
      </View>

      <View style={[jeepneyStyles.wheel, jeepneyStyles.frontWheel]}>
        <View style={jeepneyStyles.wheelHub} />
      </View>
    </View>
  );
}

// ==================================================================
// CITY BUILDING
// ==================================================================

function CityBuilding({ style }) {
  return (
    <View style={[styles.cityBuilding, style]}>
      <View style={styles.buildingRoof} />

      <View style={styles.buildingWindows}>
        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />

        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />

        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />
        <View style={styles.buildingWindow} />
      </View>
    </View>
  );
}

// ==================================================================
// TREE
// ==================================================================

function Tree({ style, scale = 1 }) {
  return (
    <View
      style={[
        styles.tree,
        style,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.treeCrownOne} />
      <View style={styles.treeCrownTwo} />
      <View style={styles.treeCrownThree} />
      <View style={styles.treeTrunk} />
    </View>
  );
}

// ==================================================================
// STREET LIGHT
// ==================================================================

function StreetLight({ style }) {
  return (
    <View style={[styles.streetLight, style]}>
      <View style={styles.lightPole} />
      <View style={styles.lightArm} />
      <View style={styles.lightBulb} />
    </View>
  );
}

// ==================================================================
// MAIN STYLES
// ==================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // ==============================================================
  // BACKGROUND
  // ==============================================================

  backgroundGlow: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.035)",
    alignSelf: "center",
  },

  // ==============================================================
  // CLOUDS
  // ==============================================================

  cloud: {
    position: "absolute",
    width: 90,
    height: 35,
    opacity: 0.12,
  },

  cloudSmall: {
    position: "absolute",
    width: 30,
    height: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    left: 12,
    bottom: 5,
  },

  cloudLarge: {
    position: "absolute",
    width: 52,
    height: 30,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    left: 30,
    bottom: 2,
  },

  cloudSmallRight: {
    position: "absolute",
    width: 28,
    height: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    right: 2,
    bottom: 5,
  },

  // ==============================================================
  // PARTICLES
  // ==============================================================

  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  // ==============================================================
  // S ROAD FORMATION
  // ==============================================================

  formationContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },

  // ==============================================================
  // CITY
  // ==============================================================

  cityBuilding: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },

  buildingRoof: {
    height: 7,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  buildingWindows: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 7,
    gap: 7,
  },

  buildingWindow: {
    width: 6,
    height: 9,
    borderRadius: 1,
    backgroundColor: "rgba(255,176,0,0.45)",
  },

  // ==============================================================
  // TREES
  // ==============================================================

  tree: {
    position: "absolute",
    width: 48,
    height: 72,
  },

  treeCrownOne: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    left: 4,
    top: 4,
  },

  treeCrownTwo: {
    position: "absolute",
    width: 39,
    height: 39,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
    left: 14,
    top: 14,
  },

  treeCrownThree: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.13)",
    left: 20,
    top: 0,
  },

  treeTrunk: {
    position: "absolute",
    width: 7,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    left: 22,
    bottom: 0,
    borderRadius: 3,
  },

  // ==============================================================
  // STREET LIGHTS
  // ==============================================================

  streetLight: {
    position: "absolute",
    width: 30,
    height: 100,
  },

  lightPole: {
    position: "absolute",
    width: 2,
    height: 85,
    backgroundColor: "rgba(255,255,255,0.18)",
    left: 10,
    bottom: 0,
  },

  lightArm: {
    position: "absolute",
    width: 17,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    left: 10,
    top: 10,
  },

  lightBulb: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFB000",
    left: 24,
    top: 7,
  },

  // ==============================================================
  // JEEPNEY
  // ==============================================================

  jeepney: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  jeepneyImage: {
    bottom: 100,
    height: 280,
    width: 220,
  },
  // ==============================================================
  // BRANDING
  // ==============================================================

  brandingGroup: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",

    width: 250,

    zIndex: 30,
    elevation: 30,
  },

  logoGlow: {
    position: "absolute",

    width: 120,
    height: 120,

    borderRadius: 60,

    backgroundColor: "#FFB000",
  },

  logoCircle: {
    width: 86,
    height: 86,

    borderRadius: 43,

    backgroundColor: "#FFB000",

    alignItems: "center",
    justifyContent: "center",

    elevation: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  brandName: {
    color: "#FFFFFF",

    fontSize: 36,
    fontWeight: "800",

    letterSpacing: -1.5,

    marginTop: 15,

    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  // ==============================================================
  // LOCATION
  // ==============================================================

  location: {
    marginTop: 8,

    color: "#FFB000",

    fontSize: 15,
    fontWeight: "900",

    letterSpacing: 5,

    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  // ==============================================================
  // TAGLINE
  // ==============================================================

  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 12,
  },

  taglineLine: {
    width: 18,
    height: 1,

    backgroundColor: "rgba(255,255,255,0.5)",

    marginHorizontal: 8,
  },

  taglineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 20,

    backgroundColor: "rgba(0,0,0,0.16)",
  },

  tagline: {
    color: "#FFFFFF",

    fontSize: 12,
    fontWeight: "600",

    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  // ==============================================================
  // BOTTOM BRANDING
  // ==============================================================

  bottomText: {
    position: "absolute",

    bottom: 25,

    zIndex: 30,
    elevation: 30,

    color: "rgba(255,255,255,0.6)",

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 3,

    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
});

// ==================================================================
// JEEPNEY STYLES
// ==================================================================

const jeepneyStyles = StyleSheet.create({
  container: {
    width: 150,
    height: 75,
  },

  // ================================================================
  // ROOF
  // ================================================================

  roof: {
    position: "absolute",

    left: 8,
    top: 0,

    width: 130,
    height: 18,

    backgroundColor: "#D9D9D9",

    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,

    borderBottomWidth: 3,
    borderBottomColor: "#FFB000",
  },

  routeSign: {
    position: "absolute",

    top: 2,
    left: 36,

    width: 68,
    height: 13,

    borderRadius: 3,

    backgroundColor: "#243047",

    alignItems: "center",
    justifyContent: "center",
  },

  routeText: {
    color: "#FFFFFF",

    fontSize: 6,
    fontWeight: "900",

    letterSpacing: 0.8,
  },

  // ================================================================
  // BODY
  // ================================================================

  body: {
    position: "absolute",

    left: 4,
    bottom: 13,

    width: 142,
    height: 47,

    backgroundColor: "#FFFFFF",

    borderRadius: 8,

    overflow: "hidden",

    elevation: 5,
  },

  // ================================================================
  // WINDOWS
  // ================================================================

  windows: {
    position: "absolute",

    left: 8,
    top: 7,

    width: 83,
    height: 18,

    flexDirection: "row",

    gap: 3,
  },

  window: {
    width: 18,
    height: 18,

    backgroundColor: "#243047",

    borderRadius: 3,

    borderWidth: 1,
    borderColor: "#BFC4CC",
  },

  windowBar: {
    position: "absolute",

    width: 1,
    height: 18,

    backgroundColor: "rgba(255,255,255,0.35)",

    left: 8,
  },

  // ================================================================
  // STRIPE
  // ================================================================

  sideStripe: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 11,

    height: 7,

    backgroundColor: "#FFB000",

    justifyContent: "center",
    alignItems: "center",
  },

  sideText: {
    color: "#FFFFFF",

    fontSize: 6,
    fontWeight: "900",

    letterSpacing: 1,
  },

  // ================================================================
  // FRONT
  // ================================================================

  front: {
    position: "absolute",

    right: 0,
    top: 0,

    width: 43,
    height: 47,

    backgroundColor: "#ECECEC",

    borderLeftWidth: 2,
    borderLeftColor: "#C4C4C4",
  },

  windshield: {
    position: "absolute",

    top: 6,
    right: 6,

    width: 30,
    height: 15,

    borderRadius: 3,

    backgroundColor: "#243047",
  },

  grille: {
    position: "absolute",

    right: 8,
    bottom: 7,

    width: 26,
    height: 8,

    borderWidth: 1,
    borderColor: "#A4A4A4",

    justifyContent: "space-around",

    flexDirection: "row",
    alignItems: "center",
  },

  grilleLine: {
    width: 1,
    height: 6,

    backgroundColor: "#777777",
  },

  headlight: {
    position: "absolute",

    right: 34,
    bottom: 13,

    width: 6,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#FFF1A8",
  },

  secondHeadlight: {
    right: 3,
  },

  // ================================================================
  // BUMPER
  // ================================================================

  bumper: {
    position: "absolute",

    left: -2,
    right: -2,
    bottom: 0,

    height: 6,

    borderRadius: 4,

    backgroundColor: "#AEB4BC",
  },

  // ================================================================
  // MIRRORS
  // ================================================================

  mirrorLeft: {
    position: "absolute",

    left: -1,
    top: 27,

    width: 10,
    height: 3,

    backgroundColor: "#AEB4BC",

    transform: [
      {
        rotate: "-15deg",
      },
    ],
  },

  mirrorRight: {
    position: "absolute",

    right: -1,
    top: 27,

    width: 10,
    height: 3,

    backgroundColor: "#AEB4BC",

    transform: [
      {
        rotate: "15deg",
      },
    ],
  },

  // ================================================================
  // WHEELS
  // ================================================================

  wheel: {
    position: "absolute",

    bottom: 1,

    width: 25,
    height: 25,

    borderRadius: 13,

    backgroundColor: "#172033",

    alignItems: "center",
    justifyContent: "center",
  },

  backWheel: {
    left: 20,
  },

  frontWheel: {
    right: 14,
  },

  wheelHub: {
    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: "#9CA3AF",
  },
});
