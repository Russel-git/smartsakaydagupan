import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import Button from "../../components/common/Button";
import { FONTS, SPACING, RADIUS } from "../../utils/constants";

const WelcomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { enterGuestMode } = useAuth();
  const { showInfo } = useFeedback();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  /* ====================================================== */
  /* ANIMATION                                               */
  /* ====================================================== */

  const vehicleOne = useRef(new Animated.Value(-100)).current;
  const vehicleTwo = useRef(new Animated.Value(-140)).current;

  const cloudOne = useRef(new Animated.Value(-120)).current;
  const cloudTwo = useRef(new Animated.Value(-180)).current;
  const cloudThree = useRef(new Animated.Value(-140)).current;

  const routePulseOne = useRef(new Animated.Value(0)).current;
  const routePulseTwo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* ================================================== */
    /* VEHICLE 1                                           */
    /* ================================================== */

    const vehicleOneAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(vehicleOne, {
          toValue: screenWidth + 100,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(vehicleOne, {
          toValue: -100,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* VEHICLE 2                                           */
    /* ================================================== */

    const vehicleTwoAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(2500),

        Animated.timing(vehicleTwo, {
          toValue: screenWidth + 140,
          duration: 12500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(vehicleTwo, {
          toValue: -140,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* CLOUD 1                                             */
    /* ================================================== */

    const cloudOneAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudOne, {
          toValue: screenWidth + 120,
          duration: 22000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(cloudOne, {
          toValue: -120,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* CLOUD 2                                             */
    /* ================================================== */

    const cloudTwoAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(5000),

        Animated.timing(cloudTwo, {
          toValue: screenWidth + 180,
          duration: 28000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(cloudTwo, {
          toValue: -180,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* CLOUD 3                                             */
    /* ================================================== */

    const cloudThreeAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(10000),

        Animated.timing(cloudThree, {
          toValue: screenWidth + 140,
          duration: 32000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),

        Animated.timing(cloudThree, {
          toValue: -140,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* LOCATION PULSE 1                                    */
    /* ================================================== */

    const pulseOneAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(routePulseOne, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(routePulseOne, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    /* ================================================== */
    /* LOCATION PULSE 2                                    */
    /* ================================================== */

    const pulseTwoAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(700),

        Animated.timing(routePulseTwo, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(routePulseTwo, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    vehicleOneAnimation.start();
    vehicleTwoAnimation.start();

    cloudOneAnimation.start();
    cloudTwoAnimation.start();
    cloudThreeAnimation.start();

    pulseOneAnimation.start();
    pulseTwoAnimation.start();

    return () => {
      vehicleOneAnimation.stop();
      vehicleTwoAnimation.stop();

      cloudOneAnimation.stop();
      cloudTwoAnimation.stop();
      cloudThreeAnimation.stop();

      pulseOneAnimation.stop();
      pulseTwoAnimation.stop();
    };
  }, [
    screenWidth,
    vehicleOne,
    vehicleTwo,
    cloudOne,
    cloudTwo,
    cloudThree,
    routePulseOne,
    routePulseTwo,
  ]);

  /* ====================================================== */
  /* AUTH / ACTIONS                                          */
  /* ====================================================== */

  const signInTextColor = isDark ? colors.warning : colors.primary;

  const handleGuestMode = async () => {
    await enterGuestMode();

    showInfo(
      "Guest Session Active",
      "Browsing routes and fares in guest commuter mode.",
    );
  };

  /* ====================================================== */
  /* ANIMATED BACKGROUND                                     */
  /* ====================================================== */

  const AnimatedTransportation = () => {
    const markerOneScale = routePulseOne.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1.15],
    });

    const markerOneOpacity = routePulseOne.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.45],
    });

    const markerTwoScale = routePulseTwo.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1.15],
    });

    const markerTwoOpacity = routePulseTwo.interpolate({
      inputRange: [0, 1],
      outputRange: [0.12, 0.4],
    });

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* ================================================== */}
        {/* CLOUDS                                               */}
        {/* ================================================== */}

        <Animated.View
          style={[
            styles.cloud,
            {
              top: screenHeight * 0.12,
              transform: [
                {
                  translateX: cloudOne,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="cloud" size={58} color={colors.white} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            {
              top: screenHeight * 0.2,
              transform: [
                {
                  translateX: cloudTwo,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="cloud" size={42} color={colors.white} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            {
              top: screenHeight * 0.08,
              transform: [
                {
                  translateX: cloudThree,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="cloud" size={32} color={colors.white} />
        </Animated.View>

        {/* ================================================== */}
        {/* DECORATIVE ROUTE LINES                             */}
        {/* ================================================== */}

        <View
          style={[
            styles.routeLine,
            {
              top: screenHeight * 0.28,
              backgroundColor: colors.white,
              opacity: 0.035,
            },
          ]}
        />

        <View
          style={[
            styles.routeLine,
            {
              top: screenHeight * 0.63,
              backgroundColor: colors.white,
              opacity: 0.025,
            },
          ]}
        />

        {/* ================================================== */}
        {/* LOCATION MARKER 1                                  */}
        {/* ================================================== */}

        <Animated.View
          style={[
            styles.routeMarker,
            {
              top: screenHeight * 0.24,
              left: screenWidth * 0.18,
              opacity: markerOneOpacity,
              transform: [
                {
                  scale: markerOneScale,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={18}
            color={colors.warning}
          />
        </Animated.View>

        {/* ================================================== */}
        {/* LOCATION MARKER 2                                  */}
        {/* ================================================== */}

        <Animated.View
          style={[
            styles.routeMarker,
            {
              top: screenHeight * 0.68,
              right: screenWidth * 0.18,
              opacity: markerTwoOpacity,
              transform: [
                {
                  scale: markerTwoScale,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={15}
            color={colors.warning}
          />
        </Animated.View>

        {/* ================================================== */}
        {/* SMALL ROUTE DOTS                                   */}
        {/* ================================================== */}

        <View
          style={[
            styles.routeDot,
            {
              top: screenHeight * 0.31,
              left: screenWidth * 0.08,
              backgroundColor: colors.white,
            },
          ]}
        />

        <View
          style={[
            styles.routeDot,
            {
              top: screenHeight * 0.31,
              right: screenWidth * 0.1,
              backgroundColor: colors.warning,
            },
          ]}
        />

        <View
          style={[
            styles.routeDot,
            {
              top: screenHeight * 0.58,
              left: screenWidth * 0.12,
              backgroundColor: colors.warning,
            },
          ]}
        />

        <View
          style={[
            styles.routeDot,
            {
              top: screenHeight * 0.58,
              right: screenWidth * 0.08,
              backgroundColor: colors.white,
            },
          ]}
        />

        {/* ================================================== */}
        {/* MOVING VEHICLE 1                                  */}
        {/* ================================================== */}

        <Animated.View
          style={[
            styles.animatedVehicle,
            {
              top: screenHeight * 0.29,
              transform: [
                {
                  translateX: vehicleOne,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="bus-side"
            size={34}
            color={colors.warning}
          />
        </Animated.View>

        {/* ================================================== */}
        {/* MOVING VEHICLE 2                                  */}
        {/* ================================================== */}

        <Animated.View
          style={[
            styles.animatedVehicle,
            {
              top: screenHeight * 0.57,
              transform: [
                {
                  translateX: vehicleTwo,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="car-side"
            size={27}
            color={colors.white}
          />
        </Animated.View>

        {/* ================================================== */}
        {/* STATIC VEHICLE                                     */}
        {/* ================================================== */}

        <View
          style={[
            styles.staticVehicle,
            {
              top: screenHeight * 0.43,
              right: screenWidth * 0.08,
            },
          ]}
        >
          <MaterialCommunityIcons name="bus" size={22} color={colors.white} />
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* ====================================================== */}
      {/* HERO / LANDING SECTION                                 */}
      {/* ====================================================== */}

      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.primary]}
        style={[
          styles.heroSection,
          {
            backgroundColor: colors.primary,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* ANIMATED BACKGROUND */}
        <AnimatedTransportation />

        {/* ================================================== */}
        {/* LOGO                                                */}
        {/* ================================================== */}

        <View style={styles.logoContainer}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.warning,
                borderColor: colors.warning,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="bus"
              size={48}
              color={colors.secondary}
            />
          </View>

          <Text
            style={[
              styles.appName,
              {
                color: colors.white,
              },
            ]}
          >
            SmartSakay
          </Text>

          <Text
            style={[
              styles.appSubtitle,
              {
                color: colors.warning,
              },
            ]}
          >
            Dagupan
          </Text>
        </View>

        {/* ================================================== */}
        {/* TAGLINE                                             */}
        {/* ================================================== */}

        <Text
          style={[
            styles.tagline,
            {
              color: colors.white,
            },
          ]}
        >
          Your trusted commuter companion for{"\n"}
          Dagupan City and Pangasinan
        </Text>

        {/* ================================================== */}
        {/* FEATURES                                            */}
        {/* ================================================== */}

        <View style={styles.featureRow}>
          {[
            {
              icon: "bus",
              label: "Jeepney Routes",
            },
            {
              icon: "car",
              label: "Solo Ride / Visitor",
            },
            {
              icon: "scale-balance",
              label: "Official Fares & Matrix",
            },
          ].map((feature) => (
            <View key={feature.icon} style={styles.featureItem}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: colors.primaryDark,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={22}
                  color={colors.warning}
                />
              </View>

              <Text
                style={[
                  styles.featureLabel,
                  {
                    color: colors.white,
                  },
                ]}
              >
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ====================================================== */}
      {/* ACTION SECTION                                         */}
      {/* ====================================================== */}

      <View
        style={[
          styles.actionSection,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          title="Get Started"
          onPress={() => navigation.navigate("GetStarted")}
          size="lg"
          style={styles.btn}
        />

        <Button
          title="Sign In"
          onPress={() => navigation.navigate("Login")}
          variant="outline"
          size="lg"
          style={styles.btn}
          textStyle={{
            color: signInTextColor,
          }}
        />

        <Button
          title="Continue as Guest"
          onPress={handleGuestMode}
          variant="ghost"
          size="md"
          style={styles.guestBtn}
          textStyle={{
            color: signInTextColor,
          }}
        />

        <Text
          style={[
            styles.guestNote,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Guests can view fares and routes only
        </Text>
      </View>
    </View>
  );
};

/* ========================================================== */
/* STYLES                                                       */
/* ========================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ====================================================== */
  /* HERO                                                    */
  /* ====================================================== */

  heroSection: {
    flex: 1.3,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.section,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    overflow: "hidden",
  },

  /* ====================================================== */
  /* ANIMATED BACKGROUND                                     */
  /* ====================================================== */

  cloud: {
    position: "absolute",
    left: 0,
    opacity: 0.075,
  },

  routeLine: {
    position: "absolute",
    left: -20,
    right: -20,
    height: 1,
  },

  routeMarker: {
    position: "absolute",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  routeDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 5,
    opacity: 0.12,
  },

  animatedVehicle: {
    position: "absolute",
    left: 0,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.35,
  },

  staticVehicle: {
    position: "absolute",
    opacity: 0.08,
  },

  /* ====================================================== */
  /* LOGO                                                    */
  /* ====================================================== */

  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 2,
  },

  appName: {
    fontFamily: FONTS.montserratBold,
    fontSize: FONTS.sizes.hero,
    fontWeight: "bold",
    letterSpacing: -1,
  },

  appSubtitle: {
    fontFamily: FONTS.montserratMedium,
    fontSize: FONTS.sizes.xl,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: -4,
  },

  /* ====================================================== */
  /* TAGLINE                                                 */
  /* ====================================================== */

  tagline: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.md,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },

  /* ====================================================== */
  /* FEATURES                                                */
  /* ====================================================== */

  featureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },

  featureItem: {
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  featureLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.xs,
    textAlign: "center",
    paddingHorizontal: SPACING.xs,
  },

  /* ====================================================== */
  /* ACTION SECTION                                          */
  /* ====================================================== */

  actionSection: {
    flex: 0.7,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxl,
    justifyContent: "flex-start",
  },

  btn: {
    marginBottom: SPACING.md,
  },

  guestBtn: {
    marginTop: SPACING.sm,
    opacity: 0.7,
  },

  guestNote: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.xs,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
});

export default WelcomeScreen;
