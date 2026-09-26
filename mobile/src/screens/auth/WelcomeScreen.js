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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WELCOME_IMG = require('../../../assets/onboard_welcome.jpg');
const TRACKING_IMG = require('../../../assets/onboard_tracking.jpg');
const FARES_IMG = require('../../../assets/onboard_fares.jpg');

const WelcomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { enterGuestMode } = useAuth();
  const { showInfo } = useFeedback();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28)
    : insets.top;

  const handleGuestMode = async () => {
    await enterGuestMode();
    showInfo('Guest Session Active', 'Browsing routes and fares in guest commuter mode.');
  };

  const scrollToSlide = (index) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: activeIndex === 0 ? '#EA580C' : colors.background }]}>
      <StatusBar
        barStyle={activeIndex === 0 ? 'light-content' : (isDark ? 'light-content' : 'dark-content')}
        backgroundColor={activeIndex === 0 ? '#EA580C' : 'transparent'}
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
        {/* SLIDE 0: BRAND SPLASH / LANDING PAGE (Screen 1 in mockup) */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <LinearGradient
            colors={['#F97316', '#EA580C', '#C2410C']}
            style={[styles.splashSection, { paddingTop: topInset + 30, paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          >
            {/* Upper Content: Vehicle Icon + Brand Title */}
            <View style={styles.splashCenter}>
              <View style={styles.splashIconCircle}>
                <MaterialCommunityIcons name="bus-side" size={56} color="#FFFFFF" />
              </View>

              <Text style={styles.splashAppName}>SmartSakay</Text>
              <Text style={styles.splashAppCity}>DAGUPAN</Text>

              <Text style={styles.splashTagline}>
                Your trusted transit & commuter companion for Dagupan City and Pangasinan
              </Text>

              {/* Transit Feature Pills */}
              <View style={styles.splashPillsRow}>
                <View style={styles.splashPill}>
                  <MaterialCommunityIcons name="van-passenger" size={16} color="#FEF08A" />
                  <Text style={styles.splashPillText}>Jeepney Routes</Text>
                </View>
                <View style={styles.splashPill}>
                  <MaterialCommunityIcons name="moped" size={16} color="#FEF08A" />
                  <Text style={styles.splashPillText}>Tricycle Pinpoint</Text>
                </View>
                <View style={styles.splashPill}>
                  <MaterialCommunityIcons name="scale-balance" size={16} color="#FEF08A" />
                  <Text style={styles.splashPillText}>Official Fares</Text>
                </View>
              </View>
            </View>

            {/* Bottom Actions for Slide 0 */}
            <View style={styles.splashBottomActions}>
              <TouchableOpacity
                style={styles.splashPrimaryBtn}
                onPress={() => scrollToSlide(1)}
                activeOpacity={0.88}
              >
                <Text style={styles.splashPrimaryBtnText}>Explore Dagupan Transit</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#EA580C" />
              </TouchableOpacity>

              <View style={styles.splashQuickLinks}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
                  <Text style={styles.splashQuickLinkText}>Sign In</Text>
                </TouchableOpacity>
                <Text style={styles.splashQuickLinkDivider}>•</Text>
                <TouchableOpacity onPress={handleGuestMode} activeOpacity={0.8}>
                  <Text style={styles.splashQuickLinkText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ======================================================== */}
        {/* SLIDE 1: WELCOME TO SMARTSAKAY DAGUPAN (Screen 3 mockup)   */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: colors.background }]}>
          <View style={[styles.walkthroughContainer, { paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header: Back & Skip */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => scrollToSlide(0)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerSkipBtn}
                onPress={() => scrollToSlide(3)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSkipText, { color: colors.textMuted }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Illustration Canvas */}
            <View style={styles.illustrationWrapper}>
              <View style={[styles.illustrationBackdrop, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Image
                  source={WELCOME_IMG}
                  style={styles.illustrationImg}
                  resizeMode="cover"
                />
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
        {/* SLIDE 2: QUICK AND RELIABLE TRACKING (Screen 2 mockup)    */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: colors.background }]}>
          <View style={[styles.walkthroughContainer, { paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Header: Back & Skip */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => scrollToSlide(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerSkipBtn}
                onPress={() => scrollToSlide(3)}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerSkipText, { color: colors.textMuted }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Illustration Canvas */}
            <View style={styles.illustrationWrapper}>
              <View style={[styles.illustrationBackdrop, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Image
                  source={TRACKING_IMG}
                  style={styles.illustrationImg}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Text Information */}
            <View style={styles.infoWrapper}>
              <Text style={[styles.titlePrefix, { color: colors.textPrimary }]}>Quick and Reliable</Text>
              <Text style={styles.titleHighlight}>Transit & Ride Tracking</Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Use our real-time tracking feature to see exact jeepney corridors, live tricycle meters, and know when you will arrive at your stop.
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
        {/* SLIDE 3: OFFICIAL TARIFFS & COMMUTER RIGHTS (Final Action) */}
        {/* ======================================================== */}
        <View style={[styles.slide, { width: SCREEN_WIDTH, backgroundColor: colors.background }]}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.finalSlideContent, { paddingTop: topInset + 8, paddingBottom: Math.max(insets.bottom, 24) + 10 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Back only */}
            <View style={styles.walkthroughHeader}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => scrollToSlide(2)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.paginationDotsSmall}>
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotInactive]} />
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
              </View>
            </View>

            {/* Compact Illustration Canvas */}
            <View style={styles.finalIllustrationWrapper}>
              <View style={[styles.illustrationBackdropCompact, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }]}>
                <Image
                  source={FARES_IMG}
                  style={styles.illustrationImgCompact}
                  resizeMode="cover"
                />
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
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    height: '100%',
  },

  /* ------------------------------------------------ */
  /* SLIDE 0: BRAND SPLASH STYLES                      */
  /* ------------------------------------------------ */
  splashSection: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  splashCenter: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.08,
  },
  splashIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  splashAppName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  splashAppCity: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 6,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  splashTagline: {
    fontSize: FONTS.sizes.sm + 1,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
    marginBottom: SPACING.xl,
  },
  splashPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 320,
  },
  splashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  splashPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  splashBottomActions: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  splashPrimaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  splashPrimaryBtnText: {
    color: '#EA580C',
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
  splashQuickLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  splashQuickLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  splashQuickLinkDivider: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },

  /* ------------------------------------------------ */
  /* WALKTHROUGH SLIDES STYLES                         */
  /* ------------------------------------------------ */
  walkthroughContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  walkthroughHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 44,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  illustrationBackdrop: {
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
    height: Math.min(SCREEN_WIDTH * 0.78, 300),
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 88, 12, 0.15)',
    ...SHADOWS.md,
  },
  illustrationImg: {
    width: '100%',
    height: '100%',
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
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },
  bottomControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.sm,
    marginTop: 16,
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
  },
  finalIllustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  illustrationBackdropCompact: {
    width: Math.min(SCREEN_WIDTH * 0.65, 230),
    height: Math.min(SCREEN_WIDTH * 0.65, 230),
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 88, 12, 0.15)',
    ...SHADOWS.sm,
  },
  illustrationImgCompact: {
    width: '100%',
    height: '100%',
  },
  infoWrapperCompact: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 16,
  },
  descriptionTextCompact: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 310,
  },
  authButtonsWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
  guestActionBtn: {
    marginTop: 2,
  },
  guestNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default WelcomeScreen;
