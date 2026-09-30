import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../../utils/constants";

/* ========================================================== */
/* ONBOARDING IMAGES                                           */
/* ========================================================== */

const WELCOME_IMG = require("../../../assets/onboard_welcome.jpg");
const TRACKING_IMG = require("../../../assets/onboard_tracking.jpg");
const FARES_IMG = require("../../../assets/onboard_fares.jpg");

/* ========================================================== */
/* GET STARTED SCREEN                                          */
/* ========================================================== */

const GetStartedScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scrollRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);

  /* ====================================================== */
  /* RESPONSIVE DIMENSIONS                                   */
  /* ====================================================== */

  const shortestSide = Math.min(screenWidth, screenHeight);

  const isTablet = shortestSide >= 600;
  const isLandscape = screenWidth > screenHeight;

  const horizontalPadding = isTablet
    ? Math.max(32, Math.min(screenWidth * 0.08, 72))
    : Math.max(20, Math.min(screenWidth * 0.06, 28));

  const contentWidth = screenWidth - horizontalPadding * 2;

  const photoWidth = contentWidth;

  const photoHeight = isLandscape
    ? Math.min(photoWidth * 0.42, screenHeight * 0.4)
    : photoWidth * 0.56;

  const topInset =
    Platform.OS === "android"
      ? Math.max(insets.top, StatusBar.currentHeight || 24)
      : insets.top;

  /* ====================================================== */
  /* NAVIGATION                                               */
  /* ====================================================== */

  const scrollToSlide = (index) => {
    const safeIndex = Math.max(0, Math.min(index, 3));

    scrollRef.current?.scrollTo({
      x: safeIndex * screenWidth,
      animated: true,
    });

    setActiveIndex(safeIndex);
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleBackToLanding = () => {
    navigation.navigate("Welcome");
  };

  const handleSkip = () => {
    scrollToSlide(3);
  };

  const getPaginationColor = (index) => {
    return index === activeIndex ? colors.primary : colors.border;
  };

  /* ====================================================== */
  /* SHARED PAGINATION                                       */
  /* ====================================================== */

  const Pagination = () => (
    <View style={styles.pagination}>
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              width: index === activeIndex ? 24 : 7,
              backgroundColor: getPaginationColor(index),
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.rootContainer,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <View
        style={[
          styles.header,
          {
            marginTop: topInset + SPACING.sm,
            marginHorizontal: horizontalPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerCircle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={handleBackToLanding}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        {activeIndex < 3 ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {/* ================================================== */}
        {/* SLIDE 1 — WELCOME                                   */}
        {/* ================================================== */}

        <View
          style={[
            styles.slide,
            {
              width: screenWidth,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.slideContainer,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <View style={styles.mainContent}>
              {/* PHOTO */}
              <View
                style={[
                  styles.photoWrapper,
                  {
                    width: photoWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.photoCard,
                    {
                      width: photoWidth,
                      height: photoHeight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={WELCOME_IMG}
                    style={styles.photo}
                    resizeMode="cover"
                  />

                  <View
                    style={[
                      styles.photoBadge,
                      {
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={13}
                      color={colors.warning}
                    />

                    <Text
                      style={[
                        styles.photoBadgeText,
                        {
                          color: colors.textPrimary,
                        },
                      ]}
                    >
                      Dagupan City Welcome Arch
                    </Text>
                  </View>
                </View>
              </View>

              {/* TEXT */}
              <View style={styles.textSection}>
                <Text
                  style={[
                    styles.titlePrefix,
                    {
                      color: colors.textPrimary,
                    },
                  ]}
                >
                  Welcome to
                </Text>

                <Text
                  style={[
                    styles.titleHighlight,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  SmartSakay Dagupan!
                </Text>

                <Text
                  style={[
                    styles.description,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Getting your day-to-day transit routes, verified fare matrix,
                  and commuter protection is now just a tap away.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* SLIDE 2 — TRACKING                                  */}
        {/* ================================================== */}

        <View
          style={[
            styles.slide,
            {
              width: screenWidth,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.slideContainer,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <View style={styles.mainContent}>
              <View
                style={[
                  styles.photoWrapper,
                  {
                    width: photoWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.photoCard,
                    {
                      width: photoWidth,
                      height: photoHeight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={TRACKING_IMG}
                    style={styles.photo}
                    resizeMode="cover"
                  />

                  <View
                    style={[
                      styles.photoBadge,
                      {
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="van-passenger"
                      size={13}
                      color={colors.warning}
                    />

                    <Text
                      style={[
                        styles.photoBadgeText,
                        {
                          color: colors.textPrimary,
                        },
                      ]}
                    >
                      Dagupan - Calasiao Jeepney
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textSection}>
                <Text
                  style={[
                    styles.titlePrefix,
                    {
                      color: colors.textPrimary,
                    },
                  ]}
                >
                  Quick and Reliable
                </Text>

                <Text
                  style={[
                    styles.titleHighlight,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Transit & Ride Tracking
                </Text>

                <Text
                  style={[
                    styles.description,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Find jeepney routes, track available rides, and get useful
                  transit information for your journey around Dagupan.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* SLIDE 3 — FARES                                     */}
        {/* ================================================== */}

        <View
          style={[
            styles.slide,
            {
              width: screenWidth,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.slideContainer,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <View style={styles.mainContent}>
              <View
                style={[
                  styles.photoWrapper,
                  {
                    width: photoWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.photoCard,
                    {
                      width: photoWidth,
                      height: photoHeight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={FARES_IMG}
                    style={styles.photo}
                    resizeMode="cover"
                  />

                  <View
                    style={[
                      styles.photoBadge,
                      {
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-arrow-right"
                      size={13}
                      color={colors.warning}
                    />

                    <Text
                      style={[
                        styles.photoBadgeText,
                        {
                          color: colors.textPrimary,
                        },
                      ]}
                    >
                      Dagupan Solo Ride / Visitor
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.textSection}>
                <Text
                  style={[
                    styles.titlePrefix,
                    {
                      color: colors.textPrimary,
                    },
                  ]}
                >
                  Fair Fares &
                </Text>

                <Text
                  style={[
                    styles.titleHighlight,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  Commuter Protection
                </Text>

                <Text
                  style={[
                    styles.description,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Access verified fare information and commuter assistance
                  designed to make every trip around Dagupan safer and easier.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* SLIDE 4 — CREATE ACCOUNT                            */}
        {/* ================================================== */}

        <View
          style={[
            styles.slide,
            {
              width: screenWidth,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={[
              styles.finalSlide,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            {/* FINAL CONTENT */}
            <View style={styles.finalContent}>
              <View
                style={[
                  styles.finalIcon,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={42}
                  color={colors.white}
                />
              </View>

              <Text
                style={[
                  styles.finalTitle,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                Ready to ride smarter?
              </Text>

              <Text
                style={[
                  styles.finalHighlight,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Create your account
              </Text>

              <Text
                style={[
                  styles.finalDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Join SmartSakay and get access to personalized commuter
                features, reports, route information, and more.
              </Text>

              {/* CREATE ACCOUNT */}
              <TouchableOpacity
                style={[
                  styles.createAccountButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color={colors.white}
                />

                <Text
                  style={[
                    styles.createAccountButtonText,
                    {
                      color: colors.white,
                    },
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomControls,
          {
            marginHorizontal: horizontalPadding,
            marginBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {activeIndex > 0 ? (
          <TouchableOpacity
            style={[
              styles.navigationButton,
              {
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => scrollToSlide(activeIndex - 1)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}

        <Pagination />

        {activeIndex < 3 ? (
          <TouchableOpacity
            style={[
              styles.navigationButton,
              {
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => scrollToSlide(activeIndex + 1)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}
      </View>
    </View>
  );
};

/* ========================================================== */
/* STYLES                                                       */
/* ========================================================== */

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  slide: {
    flex: 1,
    height: "100%",
  },

  slideContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    justifyContent: "space-between",
  },

  /* ====================================================== */
  /* HEADER                                                   */
  /* ====================================================== */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.xs,
  },

  skipButton: {
    minWidth: 48,
    minHeight: 40,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
  },

  skipText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
  },

  skipPlaceholder: {
    width: 48,
    height: 40,
  },

  /* ====================================================== */
  /* MAIN CONTENT                                             */
  /* ====================================================== */

  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  /* ====================================================== */
  /* PHOTO                                                    */
  /* ====================================================== */

  photoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.md,
  },

  photoCard: {
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  photoBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    left: SPACING.sm,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,

    borderRadius: RADIUS.sm,

    ...SHADOWS.xs,
  },

  photoBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.xs,
    marginLeft: SPACING.xs,
  },

  /* ====================================================== */
  /* TEXT                                                     */
  /* ====================================================== */

  textSection: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.lg,
  },

  titlePrefix: {
    fontFamily: FONTS.montserratMedium,
    fontSize: FONTS.sizes.lg,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  titleHighlight: {
    fontFamily: FONTS.montserratBold,
    fontSize: FONTS.sizes.xl,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },

  description: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.sm,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 500,
  },

  /* ====================================================== */
  /* BOTTOM CONTROLS                                         */
  /* ====================================================== */

  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    position: "relative",
  },

  arrowPlaceholder: {
    width: 52,
    height: 52,
  },

  navigationButton: {
    width: 52,
    height: 52,

    borderRadius: RADIUS.full,
    borderWidth: 1.5,

    alignItems: "center",
    justifyContent: "center",

    ...SHADOWS.sm,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },

  paginationDot: {
    height: 7,
    borderRadius: RADIUS.full,
  },

  /* ====================================================== */
  /* FINAL SLIDE                                              */
  /* ====================================================== */

  finalSlide: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    justifyContent: "space-between",
  },

  finalContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: SPACING.md,
  },

  finalIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },

  finalTitle: {
    fontFamily: FONTS.montserratMedium,
    fontSize: FONTS.sizes.xl,
    textAlign: "center",
  },

  finalHighlight: {
    fontFamily: FONTS.montserratBold,
    fontSize: FONTS.sizes.xxl,
    textAlign: "center",
    marginTop: 4,
    marginBottom: SPACING.md,
  },

  finalDescription: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 420,
  },

  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minWidth: 220,
    ...SHADOWS.md,
  },

  createAccountButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
  },

  finalBottom: {
    width: "100%",
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default GetStartedScreen;
