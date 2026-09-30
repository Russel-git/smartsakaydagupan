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

  // ==================================================
  // MAIN ANIMATIONS
  // ==================================================

  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Branding
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoY = useRef(new Animated.Value(20)).current;

  const locationOpacity = useRef(new Animated.Value(0)).current;
  const locationY = useRef(new Animated.Value(10)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;

  // Scene
  const sceneOpacity = useRef(new Animated.Value(0)).current;

  // Jeepney
  const vehicleProgress = useRef(new Animated.Value(0)).current;
  const vehicleBob = useRef(new Animated.Value(0)).current;

  // Logo glow
  const glowScale = useRef(new Animated.Value(0.7)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Clouds
  const cloudOneX = useRef(new Animated.Value(-100)).current;
  const cloudTwoX = useRef(new Animated.Value(width + 100)).current;

  // Particles
  const particleOne = useRef(new Animated.Value(0)).current;
  const particleTwo = useRef(new Animated.Value(0)).current;
  const particleThree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ==================================================
    // CITY / ROAD SCENE
    // Appears first, before the branding.
    // ==================================================

    const sceneAnimation = Animated.timing(sceneOpacity, {
      toValue: 1,
      duration: 700,
      delay: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    sceneAnimation.start();

    // ==================================================
    // JEEPNEY MOVEMENT
    // Jeepney travels first.
    // Branding stays completely hidden.
    // ==================================================

    const jeepneyAnimation = Animated.timing(vehicleProgress, {
      toValue: 1,
      duration: 3400,
      delay: 250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    jeepneyAnimation.start();

    // ==================================================
    // JEEPNEY SUSPENSION
    // ==================================================

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

    // ==================================================
    // CLOUDS
    // ==================================================

    const cloudAnimationOne = Animated.loop(
      Animated.timing(cloudOneX, {
        toValue: width + 120,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const cloudAnimationTwo = Animated.loop(
      Animated.timing(cloudTwoX, {
        toValue: -150,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    cloudAnimationOne.start();
    cloudAnimationTwo.start();

    // ==================================================
    // PARTICLES
    // ==================================================

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

    // ==================================================
    // BRANDING REVEAL
    //
    // Jeepney finishes around 3.65s.
    // Branding appears immediately afterward.
    // ==================================================

    const brandingTimer = setTimeout(() => {
      Animated.parallel([
        // Logo
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),

        Animated.timing(logoY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        // Location
        Animated.timing(locationOpacity, {
          toValue: 1,
          duration: 500,
          delay: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(locationY, {
          toValue: 0,
          duration: 500,
          delay: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        // Tagline
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          delay: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(taglineY, {
          toValue: 0,
          duration: 500,
          delay: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        // Logo glow
        Animated.timing(glowOpacity, {
          toValue: 0.18,
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
      ]).start();
    }, 3650);

    // ==================================================
    // FINISH
    //
    // Branding stays visible for a moment,
    // then transitions to the Landing Page.
    // ==================================================

    const finishTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onFinish) {
          onFinish();
        }
      });
    }, 5200);

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      clearTimeout(brandingTimer);
      clearTimeout(finishTimer);

      bobAnimation.stop();
      cloudAnimationOne.stop();
      cloudAnimationTwo.stop();

      particleAnimationOne.stop();
      particleAnimationTwo.stop();
      particleAnimationThree.stop();

      jeepneyAnimation.stop();
      sceneAnimation.stop();
    };
  }, []);

  // ==================================================
  // RESPONSIVE JEEPNEY PATH
  // ==================================================

  const pathInput = [
    0, 0.083, 0.167, 0.25, 0.333, 0.417, 0.5, 0.583, 0.667, 0.75, 0.833, 0.917,
    1,
  ];

  const jeepneyX = vehicleProgress.interpolate({
    inputRange: pathInput,
    outputRange: [
      width * 0.76 - 75,
      width * 0.68 - 75,
      width * 0.58 - 75,
      width * 0.491 - 75,
      width * 0.444 - 75,
      width * 0.544 - 75,
      width * 0.611 - 75,
      width * 0.656 - 75,
      width * 0.661 - 75,
      width * 0.508 - 75,
      width * 0.416 - 75,
      width * 0.364 - 75,
      width * 0.38 - 75,
    ],
  });

  const jeepneyY = vehicleProgress.interpolate({
    inputRange: pathInput,
    outputRange: [
      height * 1.0 - 38,
      height * 0.913 - 38,
      height * 0.84 - 38,
      height * 0.772 - 38,
      height * 0.702 - 38,
      height * 0.545 - 38,
      height * 0.484 - 38,
      height * 0.428 - 38,
      height * 0.37 - 38,
      height * 0.224 - 38,
      height * 0.161 - 38,
      height * 0.093 - 38,
      height * 0.0 - 38,
    ],
  });

  const jeepneyRotate = vehicleProgress.interpolate({
    inputRange: pathInput,
    outputRange: [
      "12deg",
      "10deg",
      "7deg",
      "2deg",
      "-6deg",
      "-10deg",
      "-8deg",
      "-4deg",
      "4deg",
      "8deg",
      "6deg",
      "2deg",
      "-3deg",
    ],
  });

  // ==================================================
  // RESPONSIVE ROAD
  // ==================================================

  const roadWidth = Math.min(Math.max(width * 0.2, 78), 125);

  const roadShadowWidth = roadWidth + 10;

  const jeepneyScale = Math.min(Math.max(width / 420, 0.82), 1.25);

  const roadPath = `
    M ${width * 0.76} ${height}
    C ${width * 0.66} ${height * 0.84},
      ${width * 0.35} ${height * 0.77},
      ${width * 0.47} ${height * 0.62}

    C ${width * 0.59} ${height * 0.48},
      ${width * 0.75} ${height * 0.43},
      ${width * 0.61} ${height * 0.3}

    C ${width * 0.48} ${height * 0.18},
      ${width * 0.3} ${height * 0.15},
      ${width * 0.38} 0
  `;

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
      {/* ==================================================
          BACKGROUND GLOW
      ================================================== */}

      <View
        style={[
          styles.backgroundGlow,
          {
            width: width * 1.3,
            height: width * 1.3,
            borderRadius: width,
            top: -width * 0.55,
          },
        ]}
      />

      {/* ==================================================
          CLOUDS
      ================================================== */}

      <Animated.View
        style={[
          styles.cloud,
          {
            top: height * 0.1,
            left: -100,
          },
          {
            transform: [{ translateX: cloudOneX }],
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
          {
            top: height * 0.18,
            left: width,
          },
          {
            transform: [{ translateX: cloudTwoX }],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      {/* ==================================================
          PARTICLES
      ================================================== */}

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
            top: height * 0.28,
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

      {/* ==================================================
          CITY SCENE
      ================================================== */}

      <Animated.View
        style={[
          styles.scene,
          {
            opacity: sceneOpacity,
          },
        ]}
      >
        {/* ==================================================
            ROAD
        ================================================== */}

        <Svg
          width={width}
          height={height}
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Road shadow */}

          <Path
            d={roadPath}
            stroke="#000"
            strokeWidth={roadShadowWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
          />

          {/* Main road */}

          <Path
            d={roadPath}
            stroke="#333"
            strokeWidth={roadWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Road center markings */}

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

        {/* ==================================================
            LEFT SIDE BUILDINGS
        ================================================== */}

        <CityBuilding
          style={{
            left: width * 0.03,
            top: height * 0.42,
            width: 48,
            height: 90,
          }}
        />

        <CityBuilding
          style={{
            left: width * 0.06,
            top: height * 0.58,
            width: 42,
            height: 72,
          }}
        />

        {/* ==================================================
            RIGHT SIDE BUILDINGS
        ================================================== */}

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
            top: height * 0.55,
            width: 42,
            height: 68,
          }}
        />

        {/* ==================================================
            TREES
        ================================================== */}

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
            top: height * 0.5,
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
            top: height * 0.63,
          }}
          scale={0.75}
        />

        {/* ==================================================
            STREET LIGHTS
        ================================================== */}

        <StreetLight
          style={{
            left: width * 0.18,
            top: height * 0.33,
          }}
        />

        <StreetLight
          style={{
            right: width * 0.16,
            top: height * 0.45,
          }}
        />

        {/* ==================================================
            JEEPNEY
        ================================================== */}

        <Animated.View
          style={[
            styles.jeepney,
            {
              transform: [
                { translateX: jeepneyX },
                {
                  translateY: Animated.add(jeepneyY, vehicleBob),
                },
                { rotate: jeepneyRotate },
                { scale: jeepneyScale },
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

      {/* ==================================================
          BRANDING
          IMPORTANT:
          Kept ABOVE the city/road scene.
      ================================================== */}

      <Animated.View
        style={[
          styles.brandContainer,
          {
            top: height * 0.32,
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoY }],
          },
        ]}
      >
        {/* Logo glow */}

        <Animated.View
          style={[
            styles.logoGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Logo */}

        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="bus" size={45} color="#FFFFFF" />
        </View>

        {/* Brand */}

        <Text style={styles.brandName}>SmartSakay</Text>
      </Animated.View>

      {/* ==================================================
          LOCATION
      ================================================== */}

      <Animated.Text
        style={[
          styles.location,
          {
            top: height * 0.5,
            opacity: locationOpacity,
            transform: [{ translateY: locationY }],
          },
        ]}
      >
        D A G U P A N
      </Animated.Text>

      {/* ==================================================
          TAGLINE
      ================================================== */}

      <Animated.View
        style={[
          styles.taglineContainer,
          {
            top: height * 0.55,
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        <View style={styles.taglineLine} />

        <View style={styles.taglineBadge}>
          <Text style={styles.tagline}>Your journey starts here.</Text>
        </View>

        <View style={styles.taglineLine} />
      </Animated.View>

      {/* ==================================================
          BOTTOM TEXT
      ================================================== */}

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

// ======================================================
// PHILIPPINE JEEPNEY
// ======================================================

function PhilippineJeepney() {
  return (
    <View style={jeepneyStyles.container}>
      {/* Roof */}

      <View style={jeepneyStyles.roof}>
        <View style={jeepneyStyles.routeSign}>
          <Text style={jeepneyStyles.routeText}>DAGUPAN</Text>
        </View>
      </View>

      {/* Main body */}

      <View style={jeepneyStyles.body}>
        {/* Passenger windows */}

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

        {/* Jeepney side stripe */}

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

        {/* Chrome bumper */}

        <View style={jeepneyStyles.bumper} />
      </View>

      {/* Side mirrors */}

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

// ======================================================
// CITY BUILDING
// ======================================================

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

// ======================================================
// TREE
// ======================================================

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

// ======================================================
// STREET LIGHT
// ======================================================

function StreetLight({ style }) {
  return (
    <View style={[styles.streetLight, style]}>
      <View style={styles.lightPole} />
      <View style={styles.lightArm} />
      <View style={styles.lightBulb} />
    </View>
  );
}

// ======================================================
// MAIN STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // ==================================================
  // BACKGROUND GLOW
  // ==================================================

  backgroundGlow: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.035)",
    alignSelf: "center",
  },

  // ==================================================
  // CLOUDS
  // ==================================================

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

  // ==================================================
  // PARTICLES
  // ==================================================

  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  // ==================================================
  // CITY SCENE
  // ==================================================

  scene: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },

  // ==================================================
  // BUILDINGS
  // ==================================================

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

  // ==================================================
  // TREES
  // ==================================================

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

  // ==================================================
  // STREET LIGHTS
  // ==================================================

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

  // ==================================================
  // JEEPNEY
  // ==================================================

  jeepney: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  jeepneyImage: {
    height: 230,
    width: 170,
    bottom: 80,
  },

  // ==================================================
  // BRANDING
  // ==================================================

  brandContainer: {
    position: "absolute",
    alignItems: "center",

    // Keep branding above the entire city scene.
    zIndex: 20,
    elevation: 20,

    marginBottom: 6,
  },

  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFB000",
    top: "-8%",
  },

  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
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
    fontSize: 37,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: 17,

    // Better visibility over the scene.
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  // ==================================================
  // LOCATION
  // ==================================================

  location: {
    position: "absolute",

    zIndex: 21,
    elevation: 21,

    color: "#FFB000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 5,

    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  // ==================================================
  // TAGLINE
  // ==================================================

  taglineContainer: {
    position: "absolute",

    zIndex: 21,
    elevation: 21,

    flexDirection: "row",
    alignItems: "center",
  },

  taglineLine: {
    width: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 10,
  },

  taglineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 20,

    backgroundColor: "rgba(0,0,0,0.16)",
  },

  tagline: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",

    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  // ==================================================
  // BOTTOM TEXT
  // ==================================================

  bottomText: {
    position: "absolute",

    zIndex: 20,
    elevation: 20,

    bottom: 25,

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

// ======================================================
// JEEPNEY STYLES
// ======================================================

const jeepneyStyles = StyleSheet.create({
  container: {
    width: 150,
    height: 75,
  },

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

  bumper: {
    position: "absolute",
    left: -2,
    right: -2,
    bottom: 0,
    height: 6,

    borderRadius: 4,

    backgroundColor: "#AEB4BC",
  },

  mirrorLeft: {
    position: "absolute",
    left: -1,
    top: 27,
    width: 10,
    height: 3,

    backgroundColor: "#AEB4BC",

    transform: [{ rotate: "-15deg" }],
  },

  mirrorRight: {
    position: "absolute",
    right: -1,
    top: 27,
    width: 10,
    height: 3,

    backgroundColor: "#AEB4BC",

    transform: [{ rotate: "15deg" }],
  },

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
