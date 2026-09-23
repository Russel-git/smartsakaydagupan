import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import Button from '../../components/common/Button';
import { FONTS, SPACING, RADIUS, COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'cash-check',        label: 'Verified\nFares',    color: COLORS.primaryLight },
  { icon: 'map-marker-radius', label: 'Route\nFinder',     color: COLORS.accent },
  { icon: 'robot',             label: 'AI\nAssistant',     color: '#38BDF8' },
  { icon: 'shield-check',      label: 'PWD & Senior\nDiscount', color: '#34D399' },
];

const WelcomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { enterGuestMode } = useAuth();
  const { showInfo } = useFeedback();

  // Entrance animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const btnSlide  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(btnSlide, { toValue: 0, tension: 90, friction: 14, useNativeDriver: true }).start();
    });
  }, []);

  const handleGuestMode = async () => {
    await enterGuestMode();
    showInfo('Guest Session Active', 'Browsing routes and fares in guest commuter mode.');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero Section ── */}
      <LinearGradient
        colors={['#3B0015', '#7F1D2E', '#BE123C', '#E11D48']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />
        <View style={styles.deco3} />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
          ]}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <MaterialCommunityIcons name="bus-clock" size={40} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.appName}>SmartSakay</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleLine} />
            <Text style={styles.appCity}>DAGUPAN</Text>
            <View style={styles.subtitleLine} />
          </View>
          <Text style={styles.tagline}>
            Your intelligent commuter companion{'\n'}for Dagupan City transit
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View
          style={[styles.featuresRow, { opacity: fadeAnim }]}
        >
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featurePill}>
              <View style={[styles.featureIconBox, { backgroundColor: `${f.color}22` }]}>
                <MaterialCommunityIcons name={f.icon} size={18} color={f.color} />
              </View>
              <Text style={styles.featurePillLabel}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>
      </LinearGradient>

      {/* ── Action Panel ── */}
      <Animated.View
        style={[
          styles.actions,
          { backgroundColor: colors.surface, transform: [{ translateY: btnSlide }], opacity: fadeAnim },
        ]}
      >
        {/* Prominent badge */}
        <View style={styles.discountBadge}>
          <MaterialCommunityIcons name="percent" size={14} color={COLORS.accentDark} />
          <Text style={styles.discountBadgeText}>
            Senior Citizens, PWDs & Students enjoy 20% statutory discount
          </Text>
        </View>

        <Button
          title="Create Free Account"
          onPress={() => navigation.navigate('Register')}
          size="lg"
          style={styles.btnPrimary}
        />
        <Button
          title="Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          size="lg"
          style={styles.btnSecondary}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Browse as Guest"
          onPress={handleGuestMode}
          variant="ghost"
          size="md"
          style={styles.btnGuest}
        />
        <Text style={[styles.guestNote, { color: colors.textFaint || colors.textMuted }]}>
          Guests can view fares and routes • Sign up to unlock all features
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E11D48' },

  // ── Hero
  hero: {
    flex: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 56,
    paddingBottom: SPACING.xxxl,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },

  // Decorative bg circles
  deco1: {
    position: 'absolute', top: -80, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deco2: {
    position: 'absolute', bottom: 40, left: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  deco3: {
    position: 'absolute', top: 100, left: 30,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  logoWrap: { alignItems: 'center', marginBottom: SPACING.xxl },

  iconRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },

  appName: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  subtitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginTop: 2, marginBottom: SPACING.md,
  },
  subtitleLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.35)',
  },
  appCity: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)',
    letterSpacing: 6, textTransform: 'uppercase',
  },

  tagline: {
    fontSize: FONTS.sizes.sm + 1,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Feature pills
  featuresRow: {
    flexDirection: 'row', gap: SPACING.sm,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  featurePill: {
    alignItems: 'center', gap: SPACING.xs,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    minWidth: (width - SPACING.xxl * 2 - SPACING.sm * 3) / 4,
  },
  featureIconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  featurePillLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 14,
  },

  // ── Actions panel
  actions: {
    flex: 0.95,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    justifyContent: 'flex-start',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  discountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1, borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  discountBadgeText: {
    fontSize: 11, fontWeight: '700',
    color: COLORS.accentDark,
    textAlign: 'center',
  },

  btnPrimary:   { marginBottom: SPACING.md },
  btnSecondary: { marginBottom: SPACING.sm },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginVertical: SPACING.sm,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: COLORS.border,
  },
  dividerText: { fontSize: FONTS.sizes.sm },

  btnGuest: { marginBottom: SPACING.xs },

  guestNote: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    lineHeight: 17,
  },
});

export default WelcomeScreen;
