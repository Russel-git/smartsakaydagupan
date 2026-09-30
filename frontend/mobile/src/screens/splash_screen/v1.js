import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function AnimatedSplashV1({ onFinish }) {
  const { colors } = useTheme();

  // --------------------------------------------------
  // Main animations
  // --------------------------------------------------

  const screenOpacity = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoY = useRef(new Animated.Value(20)).current;

  const locationOpacity = useRef(new Animated.Value(0)).current;
  const locationY = useRef(new Animated.Value(10)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;

  const skylineOpacity = useRef(new Animated.Value(0)).current;
  const roadOpacity = useRef(new Animated.Value(0)).current;

  const vehicleX = useRef(new Animated.Value(-180)).current;
  const vehicleBob = useRef(new Animated.Value(0)).current;

  const cloudOneX = useRef(new Animated.Value(-100)).current;
  const cloudTwoX = useRef(new Animated.Value(width + 100)).current;

  const glowScale = useRef(new Animated.Value(0.7)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const roadMove = useRef(new Animated.Value(0)).current;

  const particleOne = useRef(new Animated.Value(0)).current;
  const particleTwo = useRef(new Animated.Value(0)).current;
  const particleThree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // --------------------------------------------------
    // Branding entrance
    // --------------------------------------------------

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        delay: 300,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.timing(logoY, {
        toValue: 0,
        duration: 700,
        delay: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // --------------------------------------------------
    // Location text
    // --------------------------------------------------

    Animated.parallel([
      Animated.timing(locationOpacity, {
        toValue: 1,
        duration: 600,
        delay: 850,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(locationY, {
        toValue: 0,
        duration: 600,
        delay: 850,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // --------------------------------------------------
    // Tagline
    // --------------------------------------------------

    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        delay: 1050,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(taglineY, {
        toValue: 0,
        duration: 600,
        delay: 1050,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // --------------------------------------------------
    // Skyline + road
    // --------------------------------------------------

    Animated.timing(skylineOpacity, {
      toValue: 1,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(roadOpacity, {
      toValue: 1,
      duration: 700,
      delay: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // --------------------------------------------------
    // Glow
    // --------------------------------------------------

    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 0.25,
        duration: 900,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(glowScale, {
        toValue: 1,
        delay: 400,
        friction: 8,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();

    // --------------------------------------------------
    // Vehicle movement
    // --------------------------------------------------

    Animated.timing(vehicleX, {
      toValue: width + 180,
      duration: 2300,
      delay: 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Vehicle suspension
    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(vehicleBob, {
          toValue: -2,
          duration: 170,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(vehicleBob, {
          toValue: 2,
          duration: 170,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    bobAnimation.start();

    // --------------------------------------------------
    // Moving road markings
    // --------------------------------------------------

    const roadAnimation = Animated.loop(
      Animated.timing(roadMove, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    roadAnimation.start();

    // --------------------------------------------------
    // Clouds
    // --------------------------------------------------

    Animated.loop(
      Animated.timing(cloudOneX, {
        toValue: width + 120,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(cloudTwoX, {
        toValue: -150,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // --------------------------------------------------
    // Floating particles
    // --------------------------------------------------

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

    createParticleAnimation(particleOne, 200).start();
    createParticleAnimation(particleTwo, 800).start();
    createParticleAnimation(particleThree, 1300).start();

    // --------------------------------------------------
    // Finish intro
    // --------------------------------------------------

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
    }, 3300);

    return () => {
      clearTimeout(finishTimer);
      bobAnimation.stop();
      roadAnimation.stop();
    };
  }, []);

  const roadTranslate = roadMove.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -110],
  });

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
      {/* ================================================
          BACKGROUND DECORATION
      ================================================= */}

      <View style={styles.backgroundGlow} />

      {/* Clouds */}

      <Animated.View
        style={[
          styles.cloud,
          styles.cloudOne,
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
          styles.cloudTwo,
          {
            transform: [{ translateX: cloudTwoX }],
          },
        ]}
      >
        <View style={styles.cloudSmall} />
        <View style={styles.cloudLarge} />
        <View style={styles.cloudSmallRight} />
      </Animated.View>

      {/* Floating particles */}

      <Animated.View
        style={[
          styles.particle,
          styles.particleOne,
          {
            opacity: particleOne,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          styles.particleTwo,
          {
            opacity: particleTwo,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.particle,
          styles.particleThree,
          {
            opacity: particleThree,
          },
        ]}
      />

      {/* ================================================
          CITY SKYLINE
      ================================================= */}

      <Animated.View
        style={[
          styles.city,
          {
            opacity: skylineOpacity,
          },
        ]}
      >
        <View style={[styles.building, styles.buildingOne]}>
          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
          </View>

          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
        </View>

        <View style={[styles.building, styles.buildingTwo]}>
          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.window} />
          </View>

          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.window} />
          </View>

          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
        </View>

        <View style={[styles.building, styles.buildingThree]}>
          <MaterialCommunityIcons
            name="office-building"
            size={38}
            color="rgba(255,255,255,0.18)"
          />
        </View>

        <View style={[styles.building, styles.buildingFour]}>
          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
          </View>

          <View style={styles.windowRow}>
            <View style={styles.window} />
            <View style={styles.window} />
          </View>
        </View>
      </Animated.View>

      {/* ================================================
          BRANDING
      ================================================= */}

      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoY }],
          },
        ]}
      >
        {/* Glow */}

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

        <Text style={styles.brandName}>SmartSakay</Text>
      </Animated.View>

      {/* Location */}

      <Animated.Text
        style={[
          styles.location,
          {
            opacity: locationOpacity,
            transform: [{ translateY: locationY }],
          },
        ]}
      >
        D A G U P A N
      </Animated.Text>

      {/* Tagline */}

      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        <View style={styles.taglineLine} />

        <Text style={styles.tagline}>Your journey starts here.</Text>

        <View style={styles.taglineLine} />
      </Animated.View>

      {/* ================================================
          ROAD
      ================================================= */}

      <Animated.View
        style={[
          styles.roadScene,
          {
            opacity: roadOpacity,
          },
        ]}
      >
        {/* Road */}

        <View style={styles.road} />

        {/* Road markings */}

        <Animated.View
          style={[
            styles.roadMarkings,
            {
              transform: [{ translateX: roadTranslate }],
            },
          ]}
        >
          {Array.from({ length: 14 }).map((_, index) => (
            <View key={index} style={styles.roadMark} />
          ))}
        </Animated.View>

        {/* Vehicle */}

        <Animated.View
          style={[
            styles.vehicle,
            {
              transform: [{ translateX: vehicleX }, { translateY: vehicleBob }],
            },
          ]}
        >
          <PublicTransportVehicle />
        </Animated.View>
      </Animated.View>

      {/* Bottom decorative text */}

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

/* =====================================================
   CUSTOM PUBLIC TRANSPORT VEHICLE
===================================================== */

function PublicTransportVehicle() {
  return (
    <View style={vehicleStyles.container}>
      {/* Main body */}

      <View style={vehicleStyles.body}>
        {/* Roof */}

        <View style={vehicleStyles.roof} />

        {/* Windows */}

        <View style={vehicleStyles.windows}>
          <View style={vehicleStyles.window} />
          <View style={vehicleStyles.window} />
          <View style={vehicleStyles.window} />
        </View>

        {/* Front windshield */}

        <View style={vehicleStyles.frontWindow} />

        {/* Door */}

        <View style={vehicleStyles.door} />

        {/* Headlight */}

        <View style={vehicleStyles.headlight} />

        {/* SmartSakay stripe */}

        <View style={vehicleStyles.stripe}>
          <View style={vehicleStyles.stripeDot} />
          <View style={vehicleStyles.stripeDot} />
          <View style={vehicleStyles.stripeDot} />
        </View>
      </View>

      {/* Wheels */}

      <View style={[vehicleStyles.wheel, vehicleStyles.frontWheel]}>
        <View style={vehicleStyles.wheelInner} />
      </View>

      <View style={[vehicleStyles.wheel, vehicleStyles.backWheel]}>
        <View style={vehicleStyles.wheelInner} />
      </View>
    </View>
  );
}

/* =====================================================
   MAIN STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  backgroundGlow: {
    position: "absolute",
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width,
    backgroundColor: "rgba(255,255,255,0.035)",
    top: -width * 0.55,
    alignSelf: "center",
  },

  /* Clouds */

  cloud: {
    position: "absolute",
    width: 90,
    height: 35,
    opacity: 0.12,
  },

  cloudOne: {
    top: height * 0.15,
    left: -100,
  },

  cloudTwo: {
    top: height * 0.24,
    left: width,
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

  /* Particles */

  particle: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  particleOne: {
    top: height * 0.22,
    left: width * 0.18,
  },

  particleTwo: {
    top: height * 0.31,
    right: width * 0.18,
  },

  particleThree: {
    top: height * 0.16,
    right: width * 0.3,
  },

  /* Skyline */

  city: {
    position: "absolute",
    bottom: 118,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },

  building: {
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 12,
  },

  buildingOne: {
    width: 48,
    height: 72,
  },

  buildingTwo: {
    width: 60,
    height: 105,
  },

  buildingThree: {
    width: 70,
    height: 82,
    justifyContent: "center",
  },

  buildingFour: {
    width: 45,
    height: 62,
  },

  windowRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 9,
  },

  window: {
    width: 5,
    height: 7,
    backgroundColor: "rgba(255,176,0,0.5)",
    borderRadius: 1,
  },

  /* Branding */

  brandContainer: {
    alignItems: "center",
    marginBottom: 6,
  },

  logoGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFB000",

    margin: "auto",
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
  },

  location: {
    color: "#FFB000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 5,
    marginTop: 1,
  },

  /* Tagline */

  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  taglineLine: {
    width: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: 10,
  },

  tagline: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Road */

  roadScene: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 70,
    height: 100,
    justifyContent: "flex-end",
  },

  road: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  roadMarkings: {
    position: "absolute",
    bottom: 4,
    left: -100,
    flexDirection: "row",
    alignItems: "center",
    gap: 55,
  },

  roadMark: {
    width: 45,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFB000",
  },

  /* Vehicle */

  vehicle: {
    position: "absolute",
    bottom: 15,
    left: 0,
  },

  /* Bottom text */

  bottomText: {
    position: "absolute",
    bottom: 30,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
  },
});

/* =====================================================
   VEHICLE STYLES
===================================================== */

const vehicleStyles = StyleSheet.create({
  container: {
    width: 155,
    height: 68,
  },

  body: {
    position: "absolute",
    left: 4,
    bottom: 10,
    width: 147,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 5,
  },

  roof: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 15,
    height: 7,
    backgroundColor: "#FFB000",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  windows: {
    position: "absolute",
    top: 9,
    left: 10,
    flexDirection: "row",
    gap: 4,
  },

  window: {
    width: 29,
    height: 16,
    backgroundColor: "#243047",
    borderRadius: 3,
  },

  frontWindow: {
    position: "absolute",
    right: 7,
    top: 9,
    width: 19,
    height: 16,
    backgroundColor: "#243047",
    borderRadius: 3,
  },

  door: {
    position: "absolute",
    right: 31,
    bottom: 4,
    width: 16,
    height: 22,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 2,
  },

  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    height: 5,
    backgroundColor: "#FFB000",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    gap: 4,
  },

  stripeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  headlight: {
    position: "absolute",
    right: 2,
    bottom: 12,
    width: 5,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#FFF4B8",
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

  frontWheel: {
    right: 15,
  },

  backWheel: {
    left: 17,
  },

  wheelInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#8A93A5",
  },
});
