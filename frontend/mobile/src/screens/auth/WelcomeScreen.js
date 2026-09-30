import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import JeepneyIntroOverlay from '../../components/intro/JeepneyIntroOverlay';

// Real Dagupan Transit Photos provided by the user
const WELCOME_IMG = require('../../../assets/onboard_welcome.jpg'); // Welcome to Dagupan Bangus Arch & Jeepney
const TRACKING_IMG = require('../../../assets/onboard_tracking.jpg'); // Authentic Dagupan / Calasiao Jeepney with commuters
const FARES_IMG = require('../../../assets/onboard_fares.jpg');       // Dagupan Tricycles on city street

const WelcomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { enterGuestMode } = useAuth();
  const { showInfo } = useFeedback();
  const insets = useSafeAreaInsets();

  // Dynamic window dimensions that automatically adapt to iPads, tablets, foldables, and orientation changes
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenWidth = windowWidth > 0 ? windowWidth : Dimensions.get('window').width || 390;
  const screenHeight = windowHeight > 0 ? windowHeight : Dimensions.get('window').height || 844;
  const isTablet = Math.min(screenWidth, screenHeight) >= 600;

  // Responsive photo card dimensions tailored for tablets vs phones
  const photoCardWidth = isTablet ? 460 : Math.min(screenWidth * 0.88, 350);
  const photoCardHeight = isTablet ? 250 : Math.min(screenWidth * 0.52, 210);
  const compactPhotoCardWidth = isTablet ? 440 : Math.min(screenWidth * 0.88, 340);
  const compactPhotoCardHeight = isTablet ? 210 : Math.min(screenWidth * 0.42, 170);

  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Intro Jeepney Animation State & Landing Page Kinetic Transition
  const [showIntro, setShowIntro] = useState(true);
  const landingFadeAnim = useRef(new Animated.Value(0)).current;
  const landingSlideAnim = useRef(new Animated.Value(24)).current;

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  const handleIntroFinish = () => {
    // Kinetic momentum transition: Landing page gently rises and fades in
    Animated.parallel([
      Animated.timing(landingFadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(landingSlideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowIntro(false);
    });
  };

  const handleGuestMode = async () => {
    await enterGuestMode();
    showInfo('Guest Session Active', 'Browsing routes and fares in guest commuter mode.');
  };

  const scrollToSlide = (index) => {
    scrollRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setActiveIndex(index);
  };

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? colors.background : '#F9ECE5' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {/* ======================================================== */}
        {/* SLIDE 0: BRAND LANDING PAGE (Exact user mockup)           */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: screenWidth }]}>
          <Animated.View
            style={[
              { flex: 1 },
              { opacity: landingFadeAnim, transform: [{ translateY: landingSlideAnim }] },
            ]}
          >
            <LinearGradient
              colors={isDark ? [colors.background, colors.background] : ['#F9ECE5', '#F5DFD5', '#F9ECE5']}
              style={[
                styles.landingContainer,
                {
                  paddingTop: topInset + 12,
                  paddingBottom: Math.max(insets.bottom, 20) + 12,
                },
              ]}
            >
              <View style={[styles.landingInnerContent, { maxWidth: isTablet ? 500 : '100%' }]}>
                {/* Top Header: Live Network Status & Replay Button */}
                <View style={styles.landingTopRow}>
                <View style={[styles.liveNetworkPill, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#EED7CC' }]}>
                  <View style={styles.liveGreenDot} />
                  <Text style={[styles.liveNetworkText, { color: colors.textSecondary }]}>
                    LIVE NETWORK • DAGUPAN
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.replayBtn, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#EED7CC' }]}
                  onPress={() => {
                    landingFadeAnim.setValue(0);
                    landingSlideAnim.setValue(24);
                    setShowIntro(true);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="reload" size={13} color="#EA580C" />
                  <Text style={[styles.replayBtnText, { color: colors.textSecondary }]}>Replay</Text>
                </TouchableOpacity>
              </View>

            {/* Center Content: Logo, Brand Typography & Feature Badges */}
            <View style={styles.landingCenterContent}>
              {/* App Icon Tile */}
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                style={styles.appIconTile}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
              >
                <MaterialCommunityIcons name="bus-side" size={46} color="#FFFFFF" />
              </LinearGradient>

              {/* Title & Badge */}
              <Text style={[styles.appNameTitle, { color: colors.textPrimary }]}>SmartSakay</Text>
              
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>DAGUPAN CITY</Text>
              </View>

              <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
                Your trusted transit & commuter companion for Dagupan City and Pangasinan.
              </Text>

              {/* 3 Floating Transit Feature Pills */}
              <View style={styles.featurePillsCol}>
                <View style={[styles.floatingFeaturePill, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#EED7CC' }]}>
                  <Text style={styles.pillEmoji}>🚐</Text>
                  <Text style={[styles.pillLabel, { color: colors.textPrimary }]}>Jeepney Routes</Text>
                </View>

                <View style={[styles.floatingFeaturePill, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#EED7CC' }]}>
                  <Text style={styles.pillEmoji}>🚗</Text>
                  <Text style={[styles.pillLabel, { color: colors.textPrimary }]}>Solo Ride / Visitor</Text>
                </View>

                <View style={[styles.floatingFeaturePill, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#EED7CC' }]}>
                  <Text style={styles.pillEmoji}>⚖️</Text>
                  <Text style={[styles.pillLabel, { color: colors.textPrimary }]}>Official Fares & Matrix</Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions: Explore Dagupan Transit Button + Shortcuts */}
            <View style={styles.landingBottomSection}>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => scrollToSlide(1)}
                activeOpacity={0.88}
              >
                <Text style={styles.exploreBtnText}>Explore Dagupan Transit</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.quickLinksRow}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                  <Text style={[styles.quickLinkText, { color: colors.textSecondary }]}>Sign In</Text>
                </TouchableOpacity>
                <Text style={[styles.quickLinkDivider, { color: colors.textMuted }]}>•</Text>
                <TouchableOpacity onPress={handleGuestMode} activeOpacity={0.8}>
                  <Text style={[styles.quickLinkText, { color: colors.textSecondary }]}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>

        {/* ======================================================== */}
        {/* SLIDE 1: WELCOME WITH REAL DAGUPAN BANGUS ARCH PHOTO     */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#FDF7F4' }]}>
          <View style={[styles.walkthroughContainer, { maxWidth: isTablet ? 540 : '100%', paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header: Back & Skip */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={[styles.headerBackBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                onPress={() => scrollToSlide(0)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerSkipBtn}
                onPress={() => scrollToSlide(3)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSkipText, { color: colors.textMuted }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Real Photo Frame */}
            <View style={styles.photoFrameWrapper}>
              <View style={[styles.realPhotoCard, { width: photoCardWidth, height: photoCardHeight, borderColor: colors.border }]}>
                <Image
                  source={WELCOME_IMG}
                  style={styles.realPhotoImg}
                  resizeMode="cover"
                />
                <View style={styles.photoBadgeOverlay}>
                  <MaterialCommunityIcons name="map-marker" size={13} color="#FFFFFF" />
                  <Text style={styles.photoBadgeText}>Dagupan City Welcome Arch</Text>
                </View>
              </View>
            </View>

            {/* Text Information */}
            <View style={styles.infoWrapper}>
              <Text style={[styles.titlePrefix, { color: colors.textPrimary }]}>Welcome to</Text>
              <Text style={styles.titleHighlight}>SmartSakay Dagupan!</Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Getting your day-to-day transit routes, verified fare matrix, and POSO commuter protection is now just a tap away!
              </Text>
            </View>

            {/* Bottom Controls: Dots & Circular Next Button */}
            <View style={styles.bottomControlRow}>
              <View style={styles.paginationDotsContainer}>
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
              </View>

              <TouchableOpacity
                style={styles.nextCircleContainer}
                onPress={() => scrollToSlide(2)}
                activeOpacity={0.85}
              >
                <View style={styles.nextCircleInner}>
                  <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SLIDE 2: REAL DAGUPAN PASSENGER JEEPNEY PHOTO            */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#FDF7F4' }]}>
          <View style={[styles.walkthroughContainer, { maxWidth: isTablet ? 540 : '100%', paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header: Back & Skip */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={[styles.headerBackBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                onPress={() => scrollToSlide(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerSkipBtn}
                onPress={() => scrollToSlide(3)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSkipText, { color: colors.textMuted }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Real Photo Frame */}
            <View style={styles.photoFrameWrapper}>
              <View style={[styles.realPhotoCard, { width: photoCardWidth, height: photoCardHeight, borderColor: colors.border }]}>
                <Image
                  source={TRACKING_IMG}
                  style={styles.realPhotoImg}
                  resizeMode="cover"
                />
                <View style={styles.photoBadgeOverlay}>
                  <MaterialCommunityIcons name="van-passenger" size={13} color="#FFFFFF" />
                  <Text style={styles.photoBadgeText}>Dagupan - Calasiao Jeepney</Text>
                </View>
              </View>
            </View>

            {/* Text Information */}
            <View style={styles.infoWrapper}>
              <Text style={[styles.titlePrefix, { color: colors.textPrimary }]}>Quick and Reliable</Text>
              <Text style={styles.titleHighlight}>Transit & Ride Tracking</Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Use our real-time tracking feature to see exact jeepney corridors, live solo ride / visitor meters, and know when you will arrive at your stop.
              </Text>
            </View>

            {/* Bottom Controls: Dots & Circular Next Button */}
            <View style={styles.bottomControlRow}>
              <View style={styles.paginationDotsContainer}>
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
              </View>

              <TouchableOpacity
                style={styles.nextCircleContainer}
                onPress={() => scrollToSlide(3)}
                activeOpacity={0.85}
              >
                <View style={styles.nextCircleInner}>
                  <MaterialCommunityIcons name="arrow-right" size={22} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* SLIDE 3: REAL DAGUPAN TRICYCLE PHOTO + AUTH ACTIONS      */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: screenWidth, backgroundColor: isDark ? colors.background : '#FDF7F4' }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.finalSlideContent, { maxWidth: isTablet ? 540 : '100%', alignSelf: 'center', paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 24) + 12 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Back only */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={[styles.headerBackBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                onPress={() => scrollToSlide(2)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.paginationDotsSmall}>
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
              </View>
            </View>

            {/* Real Photo Frame */}
            <View style={styles.photoFrameWrapperCompact}>
              <View style={[styles.realPhotoCardCompact, { width: compactPhotoCardWidth, height: compactPhotoCardHeight, borderColor: colors.border }]}>
                <Image
                  source={FARES_IMG}
                  style={styles.realPhotoImgCompact}
                  resizeMode="cover"
                />
                <View style={styles.photoBadgeOverlay}>
                  <MaterialCommunityIcons name="account-arrow-right" size={13} color="#FFFFFF" />
                  <Text style={styles.photoBadgeText}>Dagupan Solo Ride / Visitor</Text>
                </View>
              </View>
            </View>

            {/* Text Information */}
            <View style={styles.infoWrapperCompact}>
              <Text style={[styles.titlePrefix, { color: colors.textPrimary }]}>Fair Fares &</Text>
              <Text style={styles.titleHighlight}>Commuter Protection</Text>
              <Text style={[styles.descriptionTextCompact, { color: colors.textSecondary }]}>
                Official Dagupan City LGU tariffs, anti-overcharging grievance filing with POSO, and verified fare receipts.
              </Text>
            </View>

            {/* Action Buttons Section */}
            <View style={styles.authButtonsWrapper}>
              <Button
                title="Create Account"
                onPress={() => navigation.navigate('Register')}
                size="lg"
                style={styles.actionBtn}
              />
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="lg"
                style={styles.actionBtn}
              />
              <Button
                title="Continue as Guest"
                onPress={handleGuestMode}
                variant="ghost"
                size="md"
                style={styles.guestBtn}
              />
              <Text style={[styles.guestNote, { color: colors.textMuted }]}>
                Guests can view fares and jeepney routes without an account
              </Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {showIntro && (
        <JeepneyIntroOverlay onFinish={handleIntroFinish} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height: '100%',
  },

  /* ------------------------------------------------ */
  /* SLIDE 0: BRAND LANDING STYLES (Mockup Match)     */
  /* ------------------------------------------------ */
  landingContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  landingInnerContent: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  landingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  liveNetworkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveNetworkText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  replayBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  landingCenterContent: {
    alignItems: 'center',
    marginVertical: 12,
  },
  appIconTile: {
    width: 82,
    height: 82,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  appNameTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  cityBadge: {
    backgroundColor: '#FBE8DE',
    borderWidth: 1,
    borderColor: '#F3C5AF',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  cityBadgeText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appDescription: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 20,
  },
  featurePillsCol: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  floatingFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    shadowColor: '#C28469',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pillEmoji: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  landingBottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  exploreBtn: {
    width: '100%',
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    shadowColor: '#EA580C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  quickLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  quickLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  quickLinkDivider: {
    fontSize: 12,
  },

  /* ------------------------------------------------ */
  /* WALKTHROUGH SLIDES STYLES                         */
  /* ------------------------------------------------ */
  walkthroughContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    width: '100%',
    alignSelf: 'center',
  },
  walkthroughHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 44,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSkipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSkipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoFrameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  realPhotoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    ...SHADOWS.md,
  },
  realPhotoImg: {
    width: '100%',
    height: '100%',
  },
  photoBadgeOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  infoWrapper: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  titlePrefix: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleHighlight: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EA580C',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 310,
  },
  bottomControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.sm,
    marginTop: 10,
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDotsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 8,
  },
  paginationDot: {
    height: 7,
    borderRadius: 3.5,
  },
  paginationDotActive: {
    width: 22,
    backgroundColor: '#EA580C',
  },
  paginationDotInactive: {
    width: 7,
    backgroundColor: '#CBD5E1',
  },
  nextCircleContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nextCircleInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },

  /* ------------------------------------------------ */
  /* FINAL SLIDE AUTH ACTIONS STYLES                   */
  /* ------------------------------------------------ */
  finalSlideContent: {
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  photoFrameWrapperCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  realPhotoCardCompact: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  realPhotoImgCompact: {
    width: '100%',
    height: '100%',
  },
  infoWrapperCompact: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 12,
  },
  descriptionTextCompact: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 310,
  },
  authButtonsWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
  },
  guestBtn: {
    marginTop: 2,
  },
  guestNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default WelcomeScreen;
